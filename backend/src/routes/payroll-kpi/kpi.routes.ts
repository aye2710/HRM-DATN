import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// Lấy danh sách kỳ đánh giá & các bài đánh giá (Performance Review)
router.get('/reviews', async (req: Request, res: Response): Promise<any> => {
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
      let finalGrade = 'C';
      if (Number(r.score) >= 90) finalGrade = 'A';
      else if (Number(r.score) >= 70) finalGrade = 'B';
      
      return {
        id: r.id,
        empId: r.employee.code,
        name: r.employee.fullName,
        department: r.employee.department?.name || 'Không xác định',
        selfScore: Number(r.score) - 5, // giả lập
        managerScore: Number(r.score),
        finalGrade,
        note: r.comments || ''
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu đánh giá' });
  }
});

// ==========================================
// MẪU ĐÁNH GIÁ (KPI TEMPLATES)
// ==========================================

// Lấy danh sách mẫu KPI
router.get('/templates', async (req: Request, res: Response): Promise<any> => {
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
router.post('/templates', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, department, criteria, weight, status } = req.body;
    const newTemplate = await prisma.kPITemplate.create({
      data: {
        name,
        department,
        criteria: Number(criteria),
        weight,
        status: status || 'Active'
      }
    });
    return res.status(201).json(newTemplate);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi tạo mẫu KPI' });
  }
});

// Xóa mẫu KPI
router.delete('/templates/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.kPITemplate.delete({ where: { id } });
    return res.json({ message: 'Đã xóa mẫu KPI' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa mẫu KPI' });
  }
});


// Tạo kỳ đánh giá mới
router.post('/cycles', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, startDate, endDate } = req.body;
    const cycle = await prisma.reviewCycle.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });
    
    // Tự động tạo PerformanceReview (nháp) cho toàn bộ nhân sự ACTIVE
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    for(const emp of employees) {
      await prisma.performanceReview.create({
        data: {
          employeeId: emp.id,
          reviewCycleId: cycle.id,
          score: 0,
          comments: 'Đang đánh giá...'
        }
      });
    }
    
    return res.json({ message: 'Đã mở kỳ đánh giá mới và khởi tạo dữ liệu cho nhân sự', cycle });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi tạo kỳ đánh giá' });
  }
});

// ==========================================
// QUẢN LÝ MỤC TIÊU (KPI)
// ==========================================

// Lấy danh sách KPI
router.get('/kpi', async (req: Request, res: Response): Promise<any> => {
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
router.post('/kpi', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId, description, target } = req.body;
    const newKpi = await prisma.kPI.create({
      data: {
        employeeId,
        description,
        target
      }
    });
    return res.status(201).json(newKpi);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi gán KPI mới' });
  }
});

// Cập nhật tiến độ KPI (achieved)
router.put('/kpi/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { achieved, description, target } = req.body;
    const updatedKpi = await prisma.kPI.update({
      where: { id },
      data: { achieved, description, target }
    });
    return res.json(updatedKpi);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật KPI' });
  }
});

// Xóa KPI
router.delete('/kpi/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.kPI.delete({ where: { id } });
    return res.json({ message: 'Đã xóa KPI' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa KPI' });
  }
});

// ==========================================
// CHẤM ĐIỂM HIỆU SUẤT (PERFORMANCE REVIEW)
// ==========================================

// Chấm điểm và cập nhật phiếu đánh giá
router.put('/reviews/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { score, comments } = req.body;

    // Lấy thông tin phiếu đánh giá và kỳ đánh giá
    const review = await prisma.performanceReview.findUnique({
      where: { id },
      include: { reviewCycle: true }
    });

    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu đánh giá' });
    }

    // Validate: Chỉ được chấm điểm nếu chưa quá hạn (endDate)
    const today = new Date();
    const endDate = new Date((review as any).reviewCycle.endDate);
    
    // Đặt thời gian của endDate về cuối ngày để tính chính xác
    endDate.setHours(23, 59, 59, 999);

    if (today > endDate) {
      return res.status(403).json({ 
        error: 'Đã quá hạn chót để chấm điểm cho kỳ đánh giá này.' 
      });
    }

    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: { score, comments }
    });

    return res.json(updatedReview);
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi cập nhật phiếu đánh giá' });
  }
});

export default router;
