import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';
import { getSettingValue } from '../system/setting.routes';

const router = Router();

const hrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');
const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

// ==========================================
// 1. ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE REVIEW)
// ==========================================

// Lấy danh sách kỳ đánh giá & các bài đánh giá (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem của mình)
router.get('/reviews', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const userRole = req.user?.role?.toUpperCase();
    const where: any = {};

    if (userRole === 'EMPLOYEE') {
      where.employeeId = req.user.employeeId;
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        },
        reviewCycle: true
      },
      orderBy: { id: 'desc' }
    });

    const gradeAMin = Number(await getSettingValue('KPI_RATING_A_MIN', 90)) || 90;
    const gradeBMin = Number(await getSettingValue('KPI_RATING_B_MIN', 75)) || 75;
    const gradeCMin = Number(await getSettingValue('KPI_RATING_C_MIN', 60)) || 60;

    // Tính toán phân loại Curve động theo cấu hình (A, B, C, D)
    const formatted = reviews.map(r => {
      const scoreNum = Number(r.score);
      let finalGrade = (r as any).finalGrade || 'B';
      if (!r.score || scoreNum === 0) {
        finalGrade = 'B';
      } else if (scoreNum >= gradeAMin) {
        finalGrade = 'A';
      } else if (scoreNum >= gradeBMin) {
        finalGrade = 'B';
      } else if (scoreNum >= gradeCMin) {
        finalGrade = 'C';
      } else {
        finalGrade = 'D';
      }
      
      return {
        id: r.id,
        empId: r.employee.code,
        name: r.employee.fullName,
        position: r.employee.position?.title || 'Chuyên viên',
        department: r.employee.department?.name || 'Không xác định',
        selfScore: (r as any).selfScore ? Number((r as any).selfScore) : scoreNum,
        managerScore: scoreNum,
        finalGrade,
        note: r.comments || '',
        status: (r as any).status || 'COMPLETED',
        cycleName: r.reviewCycle?.name || 'Kỳ đánh giá'
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu đánh giá' });
  }
});

// Lấy danh sách KPI & Đánh giá của 1 nhân viên cụ thể (Cổng ESS - Chặn IDOR)
router.get('/employee/:employeeId', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user?.role?.toUpperCase();

    if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin đánh giá KPI của nhân viên khác.' });
    }

    const [kpis, reviews] = await Promise.all([
      prisma.kPI.findMany({
        where: { employeeId },
        orderBy: { id: 'desc' }
      }),
      prisma.performanceReview.findMany({
        where: { employeeId },
        include: { reviewCycle: true },
        orderBy: { id: 'desc' }
      })
    ]);

    const formattedKpis = kpis.map((k) => {
      const targetVal = Number(k.target || 100);
      const achievedVal = Number(k.achieved || 0);
      const unitVal = (k as any).unit || '%';
      const weightVal = Number((k as any).weight || 25);
      
      let progress = 0;
      if (unitVal === 'ms' || unitVal === 'ngày') {
        // Càng thấp càng tốt (ví dụ độ trễ hoặc số ngày hoàn thành)
        progress = achievedVal <= targetVal ? 100 : Math.max(0, Math.round((targetVal / achievedVal) * 100));
      } else {
        progress = targetVal > 0 ? Math.min(100, Math.round((achievedVal / targetVal) * 100)) : 0;
      }
      
      return {
        id: k.id,
        title: k.description,
        target: `${targetVal} ${unitVal}`,
        rawTarget: targetVal,
        rawAchieved: achievedVal,
        unit: unitVal,
        weight: weightVal,
        category: (k as any).category || 'OUTPUT',
        period: (k as any).period || 'Q3-2026',
        progress,
        selfScore: (progress / 10).toFixed(1),
        status: progress >= 90 ? 'EXCELLENT' : (progress >= 70 ? 'ON_TRACK' : 'NEEDS_ATTENTION'),
        comment: `Đạt ${achievedVal}/${targetVal} ${unitVal}`
      };
    });

    const totalWeight = formattedKpis.reduce((acc, curr) => acc + curr.weight, 0);
    const weightedScore = formattedKpis.length > 0 
      ? formattedKpis.reduce((acc, curr) => acc + (Number(curr.selfScore) * curr.weight / (totalWeight || 100)), 0).toFixed(1)
      : '0.0';

    return res.json({
      kpis: formattedKpis,
      reviews,
      weightedScore
    });
  } catch (error) {
    console.error('Error fetching employee KPI:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu KPI cá nhân' });
  }
});

// Chấm điểm và cập nhật phiếu đánh giá (Quản lý / HR, Chống tự chấm điểm)
router.put('/reviews/:id', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { score, comments } = req.body;

    if (score === undefined || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100) {
      return res.status(400).json({ error: 'Điểm đánh giá phải là số từ 0 đến 100.' });
    }

    const review = await prisma.performanceReview.findUnique({
      where: { id },
      include: { reviewCycle: true, employee: { select: { fullName: true } } }
    });

    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu đánh giá' });
    }

    // Chống tự chấm điểm phiếu đánh giá của chính mình
    if (req.user?.employeeId && review.employeeId === req.user.employeeId) {
      return res.status(403).json({ error: 'Quản lý không thể tự chấm điểm đánh giá hiệu suất của chính mình.' });
    }

    // Kiểm tra thời hạn chấm điểm
    const today = new Date();
    const endDate = new Date(review.reviewCycle.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (today > endDate) {
      return res.status(400).json({ 
        error: 'Đã quá hạn chót để chấm điểm cho kỳ đánh giá này.' 
      });
    }

    const gradeAMin = Number(await getSettingValue('KPI_RATING_A_MIN', 90)) || 90;
    const gradeBMin = Number(await getSettingValue('KPI_RATING_B_MIN', 75)) || 75;
    const gradeCMin = Number(await getSettingValue('KPI_RATING_C_MIN', 60)) || 60;

    const scoreNum = Number(score);
    let finalGrade = 'D';
    if (scoreNum >= gradeAMin) finalGrade = 'A';
    else if (scoreNum >= gradeBMin) finalGrade = 'B';
    else if (scoreNum >= gradeCMin) finalGrade = 'C';

    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: {
        score: scoreNum,
        comments: comments ? String(comments).trim() : null,
        finalGrade,
        status: 'COMPLETED'
      }
    });

    await createAuditLog({
      action: 'UPDATE_PERFORMANCE_REVIEW',
      tableName: 'PerformanceReview',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Chấm điểm KPI nhân viên ${review.employee.fullName}: ${score} điểm (Hạng ${finalGrade}). Nhận xét: ${comments || 'Không'}`
    });

    return res.json(updatedReview);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật phiếu đánh giá' });
  }
});

// ==========================================
// 2. KỲ ĐÁNH GIÁ (REVIEW CYCLES)
// ==========================================

// Lấy danh sách kỳ đánh giá
router.get('/cycles', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const cycles = await prisma.reviewCycle.findMany({
      include: {
        _count: { select: { reviews: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    return res.json(cycles);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách kỳ đánh giá' });
  }
});

// Tạo kỳ đánh giá mới (HR Manager Only)
router.post('/cycles', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { name, startDate, endDate } = req.body;
    if (!name?.trim() || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng nhập tên kỳ và ngày bắt đầu/kết thúc' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({ error: 'Ngày bắt đầu kỳ đánh giá không thể sau ngày kết thúc.' });
    }

    const cycle = await prisma.reviewCycle.create({
      data: {
        name: String(name).trim(),
        startDate: start,
        endDate: end,
        status: 'ACTIVE'
      }
    });
    
    // Tự động tạo PerformanceReview (nháp) cho toàn bộ nhân sự ACTIVE
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    for (const emp of employees) {
      await prisma.performanceReview.create({
        data: {
          employeeId: emp.id,
          reviewCycleId: cycle.id,
          score: 0,
          selfScore: 0,
          finalGrade: 'B',
          status: 'PENDING',
          comments: 'Đang đánh giá...'
        }
      });
    }

    await createAuditLog({
      action: 'CREATE_REVIEW_CYCLE',
      tableName: 'ReviewCycle',
      recordId: cycle.id,
      accountId: req.user?.accountId,
      details: `Mở kỳ đánh giá mới: "${cycle.name}" cho ${employees.length} nhân sự.`
    });
    
    return res.status(201).json({ message: 'Đã mở kỳ đánh giá mới và khởi tạo dữ liệu cho nhân sự', cycle });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi tạo kỳ đánh giá' });
  }
});

// ==========================================
// 3. MẪU ĐÁNH GIÁ (KPI TEMPLATES)
// ==========================================

// Lấy danh sách mẫu KPI
router.get('/templates', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const templates = await prisma.kPITemplate.findMany({
      orderBy: { id: 'desc' }
    });
    return res.json(templates);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy mẫu KPI' });
  }
});

// Tạo mẫu KPI mới (HR Manager Only)
router.post('/templates', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { name, department, criteria, weight, status, items } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tên mẫu KPI không được để trống.' });
    }

    const stringifiedItems = typeof items === 'string' ? items : (items ? JSON.stringify(items) : null);

    const newTemplate = await prisma.kPITemplate.create({
      data: {
        name: String(name).trim(),
        department: department ? String(department).trim() : 'Toàn công ty',
        criteria: Number(criteria) || (Array.isArray(items) ? items.length : 1),
        weight: weight || '100%',
        status: status || 'Active',
        items: stringifiedItems
      }
    });

    await createAuditLog({
      action: 'CREATE_KPI_TEMPLATE',
      tableName: 'KPITemplate',
      recordId: newTemplate.id,
      accountId: req.user?.accountId,
      details: `Tạo mẫu KPI: "${newTemplate.name}"`
    });

    return res.status(201).json(newTemplate);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi tạo mẫu KPI' });
  }
});

// Cập nhật mẫu KPI (HR Manager Only)
router.put('/templates/:id', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, department, criteria, weight, status, items } = req.body;

    const stringifiedItems = typeof items === 'string' ? items : (items ? JSON.stringify(items) : undefined);

    const updated = await prisma.kPITemplate.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(department && { department: String(department).trim() }),
        ...(criteria !== undefined && { criteria: Number(criteria) }),
        ...(weight && { weight }),
        ...(status && { status }),
        ...(stringifiedItems !== undefined && { items: stringifiedItems })
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật mẫu KPI' });
  }
});

// Xóa mẫu KPI (HR Manager Only)
router.delete('/templates/:id', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const template = await prisma.kPITemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu KPI để xóa.' });
    }

    await prisma.kPITemplate.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_KPI_TEMPLATE',
      tableName: 'KPITemplate',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa mẫu KPI: "${template.name}"`
    });

    return res.json({ message: 'Đã xóa mẫu KPI' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa mẫu KPI' });
  }
});

// ==========================================
// 4. QUẢN LÝ MỤC TIÊU CÁ NHÂN (KPI ASSIGNMENTS)
// ==========================================

// Lấy danh sách KPI (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem KPI của mình)
router.get('/kpi', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const userRole = req.user?.role?.toUpperCase();
    const where: any = {};

    if (userRole === 'EMPLOYEE') {
      where.employeeId = req.user.employeeId;
    }

    const kpis = await prisma.kPI.findMany({
      where,
      include: {
        employee: {
          select: { 
            id: true, 
            fullName: true, 
            code: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    return res.json(kpis);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách KPI' });
  }
});

// Giao bộ chỉ tiêu từ Mẫu KPI chuẩn (Bulk Assign from Template)
router.post('/assign-template', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, templateId, period, customItems } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Vui lòng chọn nhân viên áp dụng' });
    }

    let itemsToAssign = customItems;
    if (!itemsToAssign || !Array.isArray(itemsToAssign) || itemsToAssign.length === 0) {
      if (!templateId) return res.status(400).json({ error: 'Vui lòng chọn Mẫu KPI' });
      const template = await prisma.kPITemplate.findUnique({ where: { id: templateId } });
      if (!template || !template.items) {
        return res.status(400).json({ error: 'Mẫu KPI này chưa có tiêu chuẩn định sẵn.' });
      }
      try {
        itemsToAssign = JSON.parse(template.items);
      } catch (e) {
        return res.status(400).json({ error: 'Lỗi đọc cấu trúc tiêu chí của mẫu' });
      }
    }

    const createdKPIs = [];
    for (const item of itemsToAssign) {
      const kpi = await prisma.kPI.create({
        data: {
          employeeId,
          description: String(item.title || item.description).trim(),
          target: Number(item.target || 100),
          achieved: Number(item.achieved || 0),
          unit: item.unit || '%',
          weight: Number(item.weight || 25),
          category: item.category || 'OUTPUT',
          period: period || 'Q3-2026',
          status: 'IN_PROGRESS'
        }
      });
      createdKPIs.push(kpi);
    }

    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { fullName: true } });
    await createAuditLog({
      action: 'ASSIGN_KPI_TEMPLATE',
      tableName: 'KPI',
      recordId: employeeId,
      accountId: req.user?.accountId,
      details: `Giao bộ ${createdKPIs.length} chỉ tiêu KPI cho nhân sự ${emp?.fullName || employeeId}`
    });

    return res.status(201).json({
      message: `Đã giao thành công ${createdKPIs.length} chỉ tiêu KPI chuẩn!`,
      kpis: createdKPIs
    });
  } catch (error: any) {
    console.error('Error assigning template:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi giao mẫu KPI' });
  }
});

// Gán KPI đơn lẻ thủ công cho nhân viên (Quản lý / HR Only)
router.post('/kpi', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, description, target, achieved, unit, weight, category, period } = req.body;
    if (!employeeId || !description?.trim() || target === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin gán KPI bắt buộc (nhân viên, mô tả, chỉ tiêu)' });
    }

    const newKpi = await prisma.kPI.create({
      data: {
        employeeId,
        description: String(description).trim(),
        target: Number(target),
        achieved: Number(achieved || 0),
        unit: unit || '%',
        weight: Number(weight || 25),
        category: category || 'OUTPUT',
        period: period || 'Q3-2026',
        status: 'IN_PROGRESS'
      }
    });

    await createAuditLog({
      action: 'ASSIGN_KPI',
      tableName: 'KPI',
      recordId: newKpi.id,
      accountId: req.user?.accountId,
      details: `Gán KPI "${newKpi.description}" (Chỉ tiêu: ${target}) cho nhân viên ${employeeId}`
    });

    return res.status(201).json(newKpi);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi gán KPI mới' });
  }
});

// Cập nhật tiến độ KPI (achieved)
router.put('/kpi/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { achieved, description, target, unit, weight, category, period, status } = req.body;
    const userRole = req.user?.role?.toUpperCase();

    const existingKpi = await prisma.kPI.findUnique({ where: { id } });
    if (!existingKpi) {
      return res.status(404).json({ error: 'Không tìm thấy mục tiêu KPI.' });
    }

    // Nếu là nhân viên, chỉ được cập nhật tiến độ (achieved) trên KPI của chính mình
    if (userRole === 'EMPLOYEE') {
      if (existingKpi.employeeId !== req.user?.employeeId) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật tiến độ KPI của người khác.' });
      }
      if (description !== undefined || target !== undefined || weight !== undefined) {
        return res.status(403).json({ error: 'Chỉ Quản lý hoặc HR mới có quyền điều chỉnh mô tả hoặc chỉ tiêu KPI.' });
      }
    }

    const updatedKpi = await prisma.kPI.update({
      where: { id },
      data: {
        ...(achieved !== undefined && { achieved: Number(achieved) }),
        ...(userRole !== 'EMPLOYEE' && description !== undefined && { description: String(description).trim() }),
        ...(userRole !== 'EMPLOYEE' && target !== undefined && { target: Number(target) }),
        ...(userRole !== 'EMPLOYEE' && unit !== undefined && { unit }),
        ...(userRole !== 'EMPLOYEE' && weight !== undefined && { weight: Number(weight) }),
        ...(userRole !== 'EMPLOYEE' && category !== undefined && { category }),
        ...(userRole !== 'EMPLOYEE' && period !== undefined && { period }),
        ...(status !== undefined && { status })
      }
    });

    return res.json(updatedKpi);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật KPI' });
  }
});

// Xóa KPI (Quản lý / HR Only)
router.delete('/kpi/:id', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const existingKpi = await prisma.kPI.findUnique({ where: { id } });
    if (!existingKpi) {
      return res.status(404).json({ error: 'Không tìm thấy mục tiêu KPI để xóa.' });
    }

    await prisma.kPI.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_KPI',
      tableName: 'KPI',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa KPI "${existingKpi.description}"`
    });

    return res.json({ message: 'Đã xóa KPI thành công' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa KPI' });
  }
});

export default router;
