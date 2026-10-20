import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

// ==========================================
// 1. ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE REVIEW)
// ==========================================

// Lấy danh sách kỳ đánh giá & các bài đánh giá (Dành cho HR / Quản lý)
router.get('/reviews', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const reviews = await prisma.performanceReview.findMany({
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } } }
        },
        reviewCycle: true
      },
      orderBy: { id: 'desc' }
    });

    // Tính toán phân loại Curve (A, B, C)
    const formatted = reviews.map(r => {
      const scoreNum = Number(r.score);
      let finalGrade = 'C';
      if (scoreNum >= 90) finalGrade = 'A';
      else if (scoreNum >= 70) finalGrade = 'B';
      
      return {
        id: r.id,
        empId: r.employee.code,
        name: r.employee.fullName,
        department: r.employee.department?.name || 'Không xác định',
        selfScore: scoreNum,
        managerScore: scoreNum,
        finalGrade,
        note: r.comments || '',
        cycleName: r.reviewCycle?.name || 'Kỳ đánh giá'
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu đánh giá' });
  }
});

// Lấy danh sách KPI & Đánh giá của 1 nhân viên cụ thể (Cổng ESS)
router.get('/employee/:employeeId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;

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

    const formattedKpis = kpis.map((k, index) => {
      const targetVal = Number(k.target || 100);
      const achievedVal = Number(k.achieved || 0);
      const progress = targetVal > 0 ? Math.min(100, Math.round((achievedVal / targetVal) * 100)) : 0;
      
      return {
        id: k.id,
        title: k.description,
        target: `Chỉ tiêu: ${targetVal}`,
        weight: 25, // default
        progress,
        selfScore: (progress / 10).toFixed(1),
        status: progress >= 90 ? 'EXCELLENT' : (progress >= 70 ? 'ON_TRACK' : 'NEEDS_ATTENTION'),
        comment: `Đạt ${achievedVal}/${targetVal}`
      };
    });

    return res.json({
      kpis: formattedKpis,
      reviews
    });
  } catch (error) {
    console.error('Error fetching employee KPI:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu KPI cá nhân' });
  }
});

// Chấm điểm và cập nhật phiếu đánh giá
router.put('/reviews/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { score, comments } = req.body;

    const review = await prisma.performanceReview.findUnique({
      where: { id },
      include: { reviewCycle: true, employee: { select: { fullName: true } } }
    });

    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu đánh giá' });
    }

    // Validate: Kiểm tra thời hạn chấm điểm
    const today = new Date();
    const endDate = new Date(review.reviewCycle.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (today > endDate) {
      return res.status(403).json({ 
        error: 'Đã quá hạn chót để chấm điểm cho kỳ đánh giá này.' 
      });
    }

    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: {
        score: Number(score),
        comments: comments || null
      }
    });

    await createAuditLog({
      action: 'UPDATE_PERFORMANCE_REVIEW',
      tableName: 'PerformanceReview',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Chấm điểm KPI nhân viên ${review.employee.fullName}: ${score} điểm. Nhận xét: ${comments || 'Không'}`
    });

    return res.json(updatedReview);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật phiếu đánh giá' });
  }
});

// ==========================================
// 2. KỲ ĐÁNH GIÁ (REVIEW CYCLES)
// ==========================================

// Tạo kỳ đánh giá mới
router.post('/cycles', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng nhập tên kỳ và ngày bắt đầu/kết thúc' });
    }

    const cycle = await prisma.reviewCycle.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
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
          comments: 'Đang đánh giá...'
        }
      });
    }

    await createAuditLog({
      action: 'CREATE_REVIEW_CYCLE',
      tableName: 'ReviewCycle',
      recordId: cycle.id,
      accountId: req.user?.accountId,
      details: `Mở kỳ đánh giá mới: ${name} cho ${employees.length} nhân sự.`
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

// Tạo mẫu KPI mới
router.post('/templates', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, department, criteria, weight, status } = req.body;
    const newTemplate = await prisma.kPITemplate.create({
      data: {
        name,
        department,
        criteria: Number(criteria) || 1,
        weight: weight || '25%',
        status: status || 'Active'
      }
    });
    return res.status(201).json(newTemplate);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi tạo mẫu KPI' });
  }
});

// Xóa mẫu KPI
router.delete('/templates/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.kPITemplate.delete({ where: { id } });
    return res.json({ message: 'Đã xóa mẫu KPI' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa mẫu KPI' });
  }
});

// ==========================================
// 4. QUẢN LÝ MỤC TIÊU CÁ NHÂN (KPI)
// ==========================================

// Lấy danh sách KPI
router.get('/kpi', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const kpis = await prisma.kPI.findMany({
      include: {
        employee: {
          select: { fullName: true, code: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    return res.json(kpis);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách KPI' });
  }
});

// Gán KPI mới cho nhân viên
router.post('/kpi', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId, description, target } = req.body;
    if (!employeeId || !description || !target) {
      return res.status(400).json({ error: 'Thiếu thông tin gán KPI bắt buộc' });
    }

    const newKpi = await prisma.kPI.create({
      data: {
        employeeId,
        description,
        target: Number(target),
        achieved: 0
      }
    });
    return res.status(201).json(newKpi);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi gán KPI mới' });
  }
});

// Cập nhật tiến độ KPI (achieved)
router.put('/kpi/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { achieved, description, target } = req.body;
    const updatedKpi = await prisma.kPI.update({
      where: { id },
      data: {
        ...(achieved !== undefined && { achieved: Number(achieved) }),
        ...(description !== undefined && { description }),
        ...(target !== undefined && { target: Number(target) })
      }
    });
    return res.json(updatedKpi);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật KPI' });
  }
});

// Xóa KPI
router.delete('/kpi/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.kPI.delete({ where: { id } });
    return res.json({ message: 'Đã xóa KPI' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa KPI' });
  }
});

export default router;
