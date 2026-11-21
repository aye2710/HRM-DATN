import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';
import { getSettingValue } from '../system/setting.routes';

const router = Router();

const hrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');
const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

// ==========================================
// HÀM TIỆN ÍCH TÍNH TIẾN ĐỘ & ĐIỂM KPI CHUẨN
// ==========================================
export function calculateKpiProgress(
  targetVal: number,
  achievedVal: number,
  unitVal: string = '%',
  directionVal?: string | null,
  maxCapVal: number = 120,
  minFloorVal: number = 0
): number {
  let direction = directionVal?.toUpperCase();
  if (!direction) {
    if (unitVal === 'ms' || unitVal === 'ngày' || unitVal === 'bug' || unitVal === 'lỗi' || unitVal === 'lần') {
      direction = 'LOWER_IS_BETTER';
    } else {
      direction = 'HIGHER_IS_BETTER';
    }
  }

  let progress = 0;

  if (direction === 'BOOLEAN') {
    if (targetVal === 0) {
      progress = achievedVal === 0 ? 100 : 0;
    } else {
      progress = achievedVal >= targetVal ? 100 : 0;
    }
  } else if (direction === 'LOWER_IS_BETTER') {
    if (targetVal === 0) {
      // Chỉ tiêu 0 lỗi / 0 sự cố:
      // 0 lỗi = 100%, mỗi lỗi phát sinh trừ 25% điểm
      progress = achievedVal <= 0 ? 100 : Math.max(minFloorVal, 100 - (achievedVal * 25));
    } else if (achievedVal <= targetVal) {
      // Số lỗi thực tế ít hơn hoặc bằng mục tiêu:
      // Đạt tối thiểu 100% điểm; nếu ít hơn nữa thì cộng thưởng tối đa lên đến maxCapVal
      const bonus = targetVal > 0 ? ((targetVal - achievedVal) / targetVal) * (maxCapVal - 100) : 0;
      progress = Math.min(maxCapVal, Math.round(100 + bonus));
    } else {
      // Vượt quá số lỗi quy định: Càng nhiều lỗi điểm càng thấp
      progress = Math.max(minFloorVal, Math.round((targetVal / achievedVal) * 100));
    }
  } else {
    // HIGHER_IS_BETTER (Mặc định: Càng cao càng tốt)
    if (targetVal === 0) {
      progress = achievedVal > 0 ? maxCapVal : 100;
    } else {
      const rawProgress = (achievedVal / targetVal) * 100;
      progress = Math.max(minFloorVal, Math.min(maxCapVal, Math.round(rawProgress)));
    }
  }

  return progress;
}

// ==========================================
// 1. ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE REVIEW)
// ==========================================

// Lấy danh sách phiếu đánh giá (HR/Quản lý xem toàn bộ; Nhân viên chỉ xem của mình)
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

    const formatted = reviews.map(r => {
      const scoreNum = Number(r.score || 0);
      let finalGrade = r.finalGrade || 'B';
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
        employeeId: r.employeeId,
        empId: r.employee.code,
        name: r.employee.fullName,
        position: r.employee.position?.title || 'Chuyên viên',
        department: r.employee.department?.name || 'Không xác định',
        selfScore: r.selfScore ? Number(r.selfScore) : 0,
        selfComments: r.selfComments || '',
        managerScore: scoreNum,
        kpiScore: r.kpiScore ? Number(r.kpiScore) : 0,
        competencyScore: r.competencyScore ? Number(r.competencyScore) : 0,
        kpiWeight: r.kpiWeight ? Number(r.kpiWeight) : 70,
        competencyWeight: r.competencyWeight ? Number(r.competencyWeight) : 30,
        finalGrade,
        note: r.comments || '',
        status: r.status || 'PENDING',
        cycleId: r.reviewCycleId,
        cycleName: r.reviewCycle?.name || 'Kỳ đánh giá',
        cycleEndDate: r.reviewCycle?.endDate
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
        include: { reviewCycle: true },
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
      const unitVal = k.unit || '%';
      const weightVal = Number(k.weight || 25);
      const direction = k.direction || 'HIGHER_IS_BETTER';
      const maxCap = Number(k.maxScoreCap || 120);
      const minFloor = Number(k.minScoreFloor || 0);
      
      const progress = calculateKpiProgress(targetVal, achievedVal, unitVal, direction, maxCap, minFloor);
      const selfScore = (progress / 10).toFixed(1);
      
      return {
        id: k.id,
        title: k.description,
        target: `${targetVal} ${unitVal}`,
        rawTarget: targetVal,
        rawAchieved: achievedVal,
        unit: unitVal,
        weight: weightVal,
        direction,
        maxScoreCap: maxCap,
        minScoreFloor: minFloor,
        category: k.category || 'OUTPUT',
        period: k.period || (k.reviewCycle?.name ?? 'Q3-2026'),
        reviewCycleId: k.reviewCycleId,
        progress,
        selfScore,
        status: progress >= 90 ? 'EXCELLENT' : (progress >= 70 ? 'ON_TRACK' : 'NEEDS_ATTENTION'),
        evidenceUrl: k.evidenceUrl || '',
        comment: `Đạt ${achievedVal}/${targetVal} ${unitVal} (${progress}%)`
      };
    });

    const totalWeight = formattedKpis.reduce((acc, curr) => acc + curr.weight, 0);
    const weightedScore = formattedKpis.length > 0 
      ? formattedKpis.reduce((acc, curr) => acc + (Number(curr.selfScore) * curr.weight / (totalWeight || 100)), 0).toFixed(1)
      : '0.0';

    return res.json({
      kpis: formattedKpis,
      reviews,
      weightedScore,
      totalWeight
    });
  } catch (error) {
    console.error('Error fetching employee KPI:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu KPI cá nhân' });
  }
});

// Nhân viên tự đánh giá bản thân (Self-Review - Quy trình 2 chiều)
router.put('/reviews/:id/self-review', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { selfScore, selfComments } = req.body;

    const review = await prisma.performanceReview.findUnique({
      where: { id },
      include: { reviewCycle: true, employee: { select: { fullName: true } } }
    });

    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu đánh giá.' });
    }

    if (req.user?.role?.toUpperCase() === 'EMPLOYEE' && review.employeeId !== req.user?.employeeId) {
      return res.status(403).json({ error: 'Bạn chỉ có thể tự đánh giá trên phiếu của chính mình.' });
    }

    if (review.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Phiếu đánh giá này đã được Quản lý chốt điểm hoàn tất, không thể chỉnh sửa tự đánh giá.' });
    }

    const today = new Date();
    const endDate = new Date(review.reviewCycle.endDate);
    endDate.setHours(23, 59, 59, 999);
    if (today > endDate) {
      return res.status(400).json({ error: 'Đã quá hạn chót của kỳ đánh giá.' });
    }

    const scoreNum = Number(selfScore ?? 80);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return res.status(400).json({ error: 'Điểm tự đánh giá phải từ 0 đến 100.' });
    }

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        selfScore: scoreNum,
        selfComments: selfComments ? String(selfComments).trim() : null,
        status: 'SELF_EVALUATED'
      }
    });

    await createAuditLog({
      action: 'SELF_REVIEW_KPI',
      tableName: 'PerformanceReview',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Nhân viên ${review.employee.fullName} hoàn thành tự đánh giá: ${scoreNum} điểm.`
    });

    return res.json({
      message: 'Đã gửi phiếu tự đánh giá thành công! Quản lý sẽ sớm nghiệm thu kết quả.',
      review: updated
    });
  } catch (error) {
    console.error('Error submitting self review:', error);
    return res.status(500).json({ error: 'Lỗi khi gửi tự đánh giá' });
  }
});

// Chấm điểm và nghiệm thu phiếu đánh giá (Quản lý / HR, Chống tự chấm điểm)
router.put('/reviews/:id', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { score, competencyScore, comments, kpiWeight, competencyWeight } = req.body;

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

    // Tự động tính điểm KPI định lượng từ danh sách KPI của nhân viên
    const employeeKpis = await prisma.kPI.findMany({
      where: {
        employeeId: review.employeeId,
        ...(review.reviewCycleId ? { reviewCycleId: review.reviewCycleId } : {})
      }
    });

    let autoKpiScore = 80;
    if (employeeKpis.length > 0) {
      let totalW = 0;
      let sumWeighted = 0;
      for (const k of employeeKpis) {
        const tVal = Number(k.target || 100);
        const aVal = Number(k.achieved || 0);
        const wVal = Number(k.weight || 25);
        const dir = k.direction || 'HIGHER_IS_BETTER';
        const mCap = Number(k.maxScoreCap || 120);
        const mFloor = Number(k.minScoreFloor || 0);
        const prog = calculateKpiProgress(tVal, aVal, k.unit || '%', dir, mCap, mFloor);
        totalW += wVal;
        sumWeighted += (prog * wVal);
      }
      autoKpiScore = totalW > 0 ? Math.round(sumWeighted / totalW) : 80;
    }

    const kW = Number(kpiWeight ?? review.kpiWeight ?? 70);
    const cW = Number(competencyWeight ?? review.competencyWeight ?? 30);
    const compScoreNum = competencyScore !== undefined ? Number(competencyScore) : (review.competencyScore ? Number(review.competencyScore) : 80);

    // Tính điểm tổng hợp: (KPI * 70%) + (Năng lực/Thái độ * 30%)
    let finalCalculatedScore = Math.round((autoKpiScore * kW / 100) + (compScoreNum * cW / 100));

    // Nếu người dùng nhập điểm tổng thể score rõ ràng thì ưu tiên, còn không thì dùng điểm tính theo công thức
    const finalScore = score !== undefined && !isNaN(Number(score)) ? Number(score) : finalCalculatedScore;

    if (finalScore < 0 || finalScore > 100) {
      return res.status(400).json({ error: 'Điểm đánh giá phải là số từ 0 đến 100.' });
    }

    const gradeAMin = Number(await getSettingValue('KPI_RATING_A_MIN', 90)) || 90;
    const gradeBMin = Number(await getSettingValue('KPI_RATING_B_MIN', 75)) || 75;
    const gradeCMin = Number(await getSettingValue('KPI_RATING_C_MIN', 60)) || 60;

    let finalGrade = 'D';
    if (finalScore >= gradeAMin) finalGrade = 'A';
    else if (finalScore >= gradeBMin) finalGrade = 'B';
    else if (finalScore >= gradeCMin) finalGrade = 'C';

    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: {
        score: finalScore,
        kpiScore: autoKpiScore,
        competencyScore: compScoreNum,
        kpiWeight: kW,
        competencyWeight: cW,
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
      details: `Chấm điểm KPI nhân viên ${review.employee.fullName}: ${finalScore} điểm (Hạng ${finalGrade}) [KPI: ${autoKpiScore}đ (${kW}%), Thái độ: ${compScoreNum}đ (${cW}%)]. Nhận xét: ${comments || 'Không'}`
    });

    return res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
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
        _count: { select: { reviews: true, kpis: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    return res.json(cycles);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách kỳ đánh giá' });
  }
});

// Tạo kỳ đánh giá mới (HR Manager Only) - Có lọc thông minh nhân sự hợp lệ
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
    
    // Lọc thông minh: Loại bỏ nhân viên nghỉ thai sản, nghỉ không lương dài hạn, tạm hoãn hoặc đã thôi việc
    const activeEmployees = await prisma.employee.findMany({
      where: {
        status: {
          notIn: ['MATERNITY_LEAVE', 'UNPAID_LEAVE', 'SUSPENDED', 'RESIGNED']
        }
      },
      select: { id: true, fullName: true, status: true, joinDate: true }
    });

    // Đối với thử việc / nhân viên mới: Phải có thời gian làm việc ít nhất 30 ngày trong kỳ
    const eligibleEmployees = activeEmployees.filter(emp => {
      if (emp.status === 'PROBATION' && emp.joinDate) {
        const daysWorked = Math.floor((end.getTime() - new Date(emp.joinDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysWorked >= 30;
      }
      return true;
    });

    for (const emp of eligibleEmployees) {
      await prisma.performanceReview.create({
        data: {
          employeeId: emp.id,
          reviewCycleId: cycle.id,
          score: 0,
          selfScore: 0,
          kpiScore: 0,
          competencyScore: 80,
          kpiWeight: 70,
          competencyWeight: 30,
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
      details: `Mở kỳ đánh giá mới: "${cycle.name}" cho ${eligibleEmployees.length} nhân sự đủ điều kiện (loại trừ ${activeEmployees.length - eligibleEmployees.length} nhân sự thử việc ngắn/nghỉ dài hạn).`
    });
    
    return res.status(201).json({
      message: `Đã mở kỳ đánh giá mới và khởi tạo phiếu cho ${eligibleEmployees.length} nhân sự đủ điều kiện!`,
      cycle,
      eligibleCount: eligibleEmployees.length,
      excludedCount: activeEmployees.length - eligibleEmployees.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi tạo kỳ đánh giá' });
  }
});

// ==========================================
// 3. MẪU ĐÁNH GIÁ (KPI TEMPLATES)
// ==========================================

// Lấy danh sách mẫu KPI (bao gồm thông tin chức danh position)
router.get('/templates', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const templates = await prisma.kPITemplate.findMany({
      include: {
        position: {
          select: { id: true, title: true, code: true }
        }
      },
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
    const { name, department, positionId, criteria, weight, status, items } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tên mẫu KPI không được để trống.' });
    }

    if (Array.isArray(items) && items.length > 0) {
      const sumWeight = items.reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
      if (Math.abs(sumWeight - 100) > 0.5) {
        return res.status(400).json({ error: `Tổng trọng số các tiêu chí trong mẫu phải bằng đúng 100% (Hiện tại là ${sumWeight}%).` });
      }
    }

    const stringifiedItems = typeof items === 'string' ? items : (items ? JSON.stringify(items) : null);

    const newTemplate = await prisma.kPITemplate.create({
      data: {
        name: String(name).trim(),
        department: department ? String(department).trim() : 'Toàn công ty',
        positionId: positionId || null,
        criteria: Number(criteria) || (Array.isArray(items) ? items.length : 1),
        weight: weight || '100%',
        status: status || 'Active',
        items: stringifiedItems
      },
      include: {
        position: { select: { id: true, title: true } }
      }
    });

    await createAuditLog({
      action: 'CREATE_KPI_TEMPLATE',
      tableName: 'KPITemplate',
      recordId: newTemplate.id,
      accountId: req.user?.accountId,
      details: `Tạo mẫu KPI: "${newTemplate.name}" cho phòng ban ${newTemplate.department} / Chức danh ${newTemplate.position?.title || 'Chung'}`
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
    const { name, department, positionId, criteria, weight, status, items } = req.body;

    if (Array.isArray(items) && items.length > 0) {
      const sumWeight = items.reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
      if (Math.abs(sumWeight - 100) > 0.5) {
        return res.status(400).json({ error: `Tổng trọng số các tiêu chí trong mẫu phải bằng đúng 100% (Hiện tại là ${sumWeight}%).` });
      }
    }

    const stringifiedItems = typeof items === 'string' ? items : (items ? JSON.stringify(items) : undefined);
    const computedCriteria = criteria !== undefined 
      ? Number(criteria) 
      : (Array.isArray(items) ? items.length : undefined);

    const updated = await prisma.kPITemplate.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(department && { department: String(department).trim() }),
        ...(positionId !== undefined && { positionId: positionId || null }),
        ...(computedCriteria !== undefined && { criteria: computedCriteria }),
        ...(weight && { weight }),
        ...(status && { status }),
        ...(stringifiedItems !== undefined && { items: stringifiedItems })
      },
      include: {
        position: { select: { id: true, title: true } }
      }
    });

    await createAuditLog({
      action: 'UPDATE_KPI_TEMPLATE',
      tableName: 'KPITemplate',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Cập nhật Mẫu KPI: "${updated.name}" (${updated.criteria} tiêu chuẩn)`
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
        },
        reviewCycle: true
      },
      orderBy: { id: 'desc' }
    });
    return res.json(kpis);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách KPI' });
  }
});

// Giao bộ chỉ tiêu từ Mẫu KPI chuẩn (Hỗ trợ cả 1 người và giao hàng loạt theo Phòng ban / Chức danh / Danh sách)
router.post('/assign-template', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, employeeIds, departmentId, department, positionId, scope, templateId, period, startDate, endDate, reviewCycleId, customItems } = req.body;

    let targetEmployeeIds: string[] = [];

    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else if (employeeId) {
      targetEmployeeIds = [employeeId];
    } else if (scope === 'DEPARTMENT' && (departmentId || department)) {
      const emps = await prisma.employee.findMany({
        where: {
          ...(departmentId ? { departmentId } : { department: { name: department } }),
          status: { notIn: ['RESIGNED', 'SUSPENDED'] }
        },
        select: { id: true }
      });
      targetEmployeeIds = emps.map(e => e.id);
    } else if (scope === 'POSITION' && positionId) {
      const emps = await prisma.employee.findMany({
        where: {
          positionId,
          status: { notIn: ['RESIGNED', 'SUSPENDED'] }
        },
        select: { id: true }
      });
      targetEmployeeIds = emps.map(e => e.id);
    }

    if (targetEmployeeIds.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy nhân sự phù hợp để giao KPI. Vui lòng kiểm tra lại phạm vi đã chọn.' });
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

    // Kiểm tra tổng trọng số phải xấp xỉ 100%
    const totalWeight = itemsToAssign.reduce((sum: number, it: any) => sum + (Number(it.weight) || 0), 0);
    if (Math.abs(totalWeight - 100) > 1) {
      return res.status(400).json({ error: `Tổng trọng số bộ chỉ tiêu phải bằng 100% (Hiện tại là ${totalWeight}%).` });
    }

    // Tự động quản lý chu kỳ đánh giá ngầm (người dùng không cần thao tác tạo kỳ)
    let targetCycleId = reviewCycleId;
    if (!targetCycleId) {
      let activeCycle = await prisma.reviewCycle.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { startDate: 'desc' }
      });
      if (!activeCycle) {
        activeCycle = await prisma.reviewCycle.create({
          data: {
            name: 'Kỳ Đánh Giá Hiệu Suất Quý 4 - 2026',
            startDate: new Date('2026-10-01'),
            endDate: new Date('2026-12-31'),
            status: 'ACTIVE'
          }
        });
      }
      targetCycleId = activeCycle.id;
    }

    let totalCreated = 0;
    for (const empId of targetEmployeeIds) {
      for (const item of itemsToAssign) {
        await prisma.kPI.create({
          data: {
            employeeId: empId,
            reviewCycleId: targetCycleId || null,
            description: String(item.title || item.description).trim(),
            target: Number(item.target || 100),
            achieved: Number(item.achieved || 0),
            unit: item.unit || '%',
            weight: Number(item.weight || 25),
            direction: item.direction || 'HIGHER_IS_BETTER',
            maxScoreCap: Number(item.maxScoreCap || 120),
            minScoreFloor: Number(item.minScoreFloor || 0),
            category: item.category || 'OUTPUT',
            period: period || (startDate && endDate ? `${startDate} - ${endDate}` : '01/10/2026 - 31/12/2026'),
            status: 'IN_PROGRESS'
          }
        });
        totalCreated++;
      }

      // Tự động liên kết phiếu đánh giá cho nhân sự (để quản lý có thể chấm điểm ngay)
      if (targetCycleId) {
        const existingRev = await prisma.performanceReview.findFirst({
          where: { employeeId: empId, reviewCycleId: targetCycleId }
        });
        if (!existingRev) {
          await prisma.performanceReview.create({
            data: {
              employeeId: empId,
              reviewCycleId: targetCycleId,
              score: 0,
              kpiScore: 0,
              competencyScore: 80,
              kpiWeight: 70,
              competencyWeight: 30,
              finalGrade: 'B',
              status: 'PENDING',
              comments: 'Đang đánh giá...'
            }
          });
        }
      }
    }

    await createAuditLog({
      action: 'ASSIGN_KPI_TEMPLATE',
      tableName: 'KPI',
      recordId: targetEmployeeIds[0],
      accountId: req.user?.accountId,
      details: `Giao bộ ${itemsToAssign.length} chỉ tiêu KPI chuẩn cho ${targetEmployeeIds.length} nhân sự (Tổng ${totalCreated} bản ghi).`
    });

    return res.status(201).json({
      message: `Đã giao thành công bộ ${itemsToAssign.length} chỉ tiêu KPI chuẩn cho ${targetEmployeeIds.length} nhân sự!`,
      totalCreated,
      employeeCount: targetEmployeeIds.length
    });
  } catch (error: any) {
    console.error('Error assigning template:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi giao mẫu KPI' });
  }
});

// Gán KPI đơn lẻ thủ công cho nhân viên hoặc nhóm nhân viên (Quản lý / HR Only)
router.post('/kpi', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, employeeIds, departmentId, department, positionId, scope, description, target, achieved, unit, weight, category, period, startDate, endDate, reviewCycleId, direction, maxScoreCap, minScoreFloor } = req.body;

    let targetEmployeeIds: string[] = [];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else if (employeeId) {
      targetEmployeeIds = [employeeId];
    } else if (scope === 'DEPARTMENT' && (departmentId || department)) {
      const emps = await prisma.employee.findMany({
        where: {
          ...(departmentId ? { departmentId } : { department: { name: department } }),
          status: { notIn: ['RESIGNED', 'SUSPENDED'] }
        },
        select: { id: true }
      });
      targetEmployeeIds = emps.map(e => e.id);
    } else if (scope === 'POSITION' && positionId) {
      const emps = await prisma.employee.findMany({
        where: { positionId, status: { notIn: ['RESIGNED', 'SUSPENDED'] } },
        select: { id: true }
      });
      targetEmployeeIds = emps.map(e => e.id);
    }

    if (targetEmployeeIds.length === 0 || !description?.trim() || target === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin gán KPI bắt buộc (nhân viên/phòng ban, mô tả, chỉ tiêu)' });
    }

    const newWeight = Number(weight || 25);

    let targetCycleId = reviewCycleId;
    if (!targetCycleId) {
      let activeCycle = await prisma.reviewCycle.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { startDate: 'desc' }
      });
      if (!activeCycle) {
        activeCycle = await prisma.reviewCycle.create({
          data: {
            name: 'Kỳ Đánh Giá Hiệu Suất Quý 4 - 2026',
            startDate: new Date('2026-10-01'),
            endDate: new Date('2026-12-31'),
            status: 'ACTIVE'
          }
        });
      }
      targetCycleId = activeCycle.id;
    }

    let createdCount = 0;
    for (const empId of targetEmployeeIds) {
      await prisma.kPI.create({
        data: {
          employeeId: empId,
          reviewCycleId: targetCycleId || null,
          description: String(description).trim(),
          target: Number(target),
          achieved: Number(achieved || 0),
          unit: unit || '%',
          weight: newWeight,
          direction: direction || 'HIGHER_IS_BETTER',
          maxScoreCap: Number(maxScoreCap || 120),
          minScoreFloor: Number(minScoreFloor || 0),
          category: category || 'OUTPUT',
          period: period || (startDate && endDate ? `${startDate} - ${endDate}` : '01/10/2026 - 31/12/2026'),
          status: 'IN_PROGRESS'
        }
      });
      createdCount++;

      // Tự động đảm bảo có phiếu đánh giá cho nhân sự
      if (targetCycleId) {
        const existingRev = await prisma.performanceReview.findFirst({
          where: { employeeId: empId, reviewCycleId: targetCycleId }
        });
        if (!existingRev) {
          await prisma.performanceReview.create({
            data: {
              employeeId: empId,
              reviewCycleId: targetCycleId,
              score: 0,
              kpiScore: 0,
              competencyScore: 80,
              kpiWeight: 70,
              competencyWeight: 30,
              finalGrade: 'B',
              status: 'PENDING',
              comments: 'Đang đánh giá...'
            }
          });
        }
      }
    }

    await createAuditLog({
      action: 'ASSIGN_KPI',
      tableName: 'KPI',
      recordId: targetEmployeeIds[0],
      accountId: req.user?.accountId,
      details: `Gán KPI "${description}" (Chỉ tiêu: ${target} ${unit}, trọng số ${newWeight}%) cho ${targetEmployeeIds.length} nhân viên.`
    });

    return res.status(201).json({
      message: `Đã gán KPI thành công cho ${targetEmployeeIds.length} nhân sự!`,
      employeeCount: targetEmployeeIds.length,
      createdCount
    });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi gán KPI mới' });
  }
});

// Cập nhật tiến độ KPI (achieved) hoặc cấu hình
router.put('/kpi/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { achieved, description, target, unit, weight, category, period, reviewCycleId, direction, maxScoreCap, minScoreFloor, evidenceUrl, status } = req.body;
    const userRole = req.user?.role?.toUpperCase();

    const existingKpi = await prisma.kPI.findUnique({ where: { id } });
    if (!existingKpi) {
      return res.status(404).json({ error: 'Không tìm thấy mục tiêu KPI.' });
    }

    // Nếu là nhân viên: Chỉ được cập nhật tiến độ (achieved) và link minh chứng (evidenceUrl)
    if (userRole === 'EMPLOYEE') {
      if (existingKpi.employeeId !== req.user?.employeeId) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật tiến độ KPI của người khác.' });
      }
      if (description !== undefined || target !== undefined || weight !== undefined || direction !== undefined) {
        return res.status(403).json({ error: 'Chỉ Quản lý hoặc HR mới có quyền điều chỉnh mô tả hoặc chỉ tiêu KPI.' });
      }
    }

    const updatedKpi = await prisma.kPI.update({
      where: { id },
      data: {
        ...(achieved !== undefined && { achieved: Number(achieved) }),
        ...(evidenceUrl !== undefined && { evidenceUrl: String(evidenceUrl).trim() }),
        ...(userRole !== 'EMPLOYEE' && description !== undefined && { description: String(description).trim() }),
        ...(userRole !== 'EMPLOYEE' && target !== undefined && { target: Number(target) }),
        ...(userRole !== 'EMPLOYEE' && unit !== undefined && { unit }),
        ...(userRole !== 'EMPLOYEE' && weight !== undefined && { weight: Number(weight) }),
        ...(userRole !== 'EMPLOYEE' && direction !== undefined && { direction }),
        ...(userRole !== 'EMPLOYEE' && maxScoreCap !== undefined && { maxScoreCap: Number(maxScoreCap) }),
        ...(userRole !== 'EMPLOYEE' && minScoreFloor !== undefined && { minScoreFloor: Number(minScoreFloor) }),
        ...(userRole !== 'EMPLOYEE' && category !== undefined && { category }),
        ...(userRole !== 'EMPLOYEE' && period !== undefined && { period }),
        ...(userRole !== 'EMPLOYEE' && reviewCycleId !== undefined && { reviewCycleId }),
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

// ==========================================
// TỰ ĐỘNG KHỞI TẠO DỮ LIỆU MẪU ĐÁNH GIÁ (NẾU CHƯA CÓ)
// ==========================================
export async function seedSampleReviewData() {
  try {
    let cycle = await prisma.reviewCycle.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' }
    });

    if (!cycle) {
      cycle = await prisma.reviewCycle.create({
        data: {
          name: 'Kỳ Đánh Giá Hiệu Suất Quý 4 - 2026',
          startDate: new Date('2026-10-01'),
          endDate: new Date('2026-12-31'),
          status: 'ACTIVE'
        }
      });
      console.log('[KPI SEED] Đã tạo Kỳ Đánh Giá Hiệu Suất Quý 4 - 2026');
    }

    const employees = await prisma.employee.findMany({
      where: {
        status: { notIn: ['MATERNITY_LEAVE', 'UNPAID_LEAVE', 'SUSPENDED', 'RESIGNED'] }
      },
      include: { department: true, position: true },
      take: 8
    });

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];

      // 1. Kiểm tra phiếu đánh giá
      const existingReview = await prisma.performanceReview.findFirst({
        where: { employeeId: emp.id, reviewCycleId: cycle.id }
      });

      if (!existingReview) {
        const isSelfDone = i === 0 || i === 1;
        await prisma.performanceReview.create({
          data: {
            employeeId: emp.id,
            reviewCycleId: cycle.id,
            score: 0,
            selfScore: isSelfDone ? (i === 0 ? 94 : 82) : 0,
            selfComments: isSelfDone 
              ? (i === 0 ? 'Trong Quý 4 tôi đã hoàn thành vượt tiến độ các đầu việc được giao, tối ưu hóa quy trình và hỗ trợ các bạn mới rất tốt.' : 'Hoàn thành các mốc chỉ tiêu đề ra, cần cải thiện thêm khả năng tự kiểm thử.')
              : null,
            kpiScore: 0,
            competencyScore: 80,
            kpiWeight: 70,
            competencyWeight: 30,
            finalGrade: 'B',
            status: isSelfDone ? 'SELF_EVALUATED' : 'PENDING',
            comments: 'Đang chờ quản lý nghiệm thu và chấm điểm...'
          }
        });
      }

      // 2. Tạo chỉ tiêu KPI mẫu cho nhân sự nếu chưa có
      const existingKpis = await prisma.kPI.count({ where: { employeeId: emp.id } });
      if (existingKpis === 0) {
        const sampleKpis = [
          {
            desc: `Hoàn thành tiến độ các mốc Sprint/Dự án bàn giao (${emp.department?.name || 'Khối Kỹ thuật'})`,
            target: 100,
            achieved: i === 0 ? 100 : (i === 1 ? 85 : 75),
            unit: '%',
            weight: 40,
            category: 'TIMELINE',
            direction: 'HIGHER_IS_BETTER',
            maxCap: 120,
            period: '01/10/2026 - 31/12/2026',
            evidence: 'https://jira.company.internal/browse/SPRINT-Q4'
          },
          {
            desc: 'Chất lượng công việc: Giảm thiểu sự cố & lỗi phát sinh trên hệ thống',
            target: 0,
            achieved: i === 0 ? 0 : (i === 1 ? 1 : 2),
            unit: 'lỗi',
            weight: 30,
            category: 'QUALITY',
            direction: 'LOWER_IS_BETTER',
            maxCap: 120,
            period: '01/10/2026 - 31/12/2026',
            evidence: 'https://sentry.company.internal/issues-q4'
          },
          {
            desc: 'Tuân thủ quy trình vận hành nội bộ, báo cáo tuần & đào tạo nhân sự mới',
            target: 100,
            achieved: i === 0 ? 100 : (i === 1 ? 90 : 80),
            unit: '%',
            weight: 30,
            category: 'COMPLIANCE',
            direction: 'HIGHER_IS_BETTER',
            maxCap: 100,
            period: '01/10/2026 - 31/12/2026',
            evidence: ''
          }
        ];

        for (const item of sampleKpis) {
          await prisma.kPI.create({
            data: {
              employeeId: emp.id,
              reviewCycleId: cycle.id,
              description: item.desc,
              target: item.target,
              achieved: item.achieved,
              unit: item.unit,
              weight: item.weight,
              category: item.category,
              direction: item.direction,
              maxScoreCap: item.maxCap,
              minScoreFloor: 0,
              period: item.period,
              status: 'IN_PROGRESS',
              evidenceUrl: item.evidence
            }
          });
        }
      }
    }
    console.log(`[KPI SEED] Dữ liệu mẫu đánh giá KPI đã sẵn sàng cho ${employees.length} nhân sự.`);
  } catch (err) {
    console.error('[KPI SEED ERROR]', err);
  }
}

// Chạy tự động sau khi máy chủ khởi động
setTimeout(seedSampleReviewData, 1500);

router.post('/seed-sample-reviews', async (req: Request, res: Response) => {
  try {
    await seedSampleReviewData();
    res.json({ message: 'Đã khởi tạo dữ liệu mẫu đánh giá KPI thành công!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
