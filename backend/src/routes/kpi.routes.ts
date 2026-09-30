import { Router, Request, Response } from 'express';
import { prisma } from '../db';

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

// Lấy danh sách mẫu KPI (KPI Templates) - giả lập vì schema hiện tại mới có bảng KPI cho cá nhân
router.get('/templates', async (req: Request, res: Response): Promise<any> => {
  try {
    // Schema hiện tại chưa có bảng KPITemplate, tạm trả dữ liệu tĩnh cho UI khớp với thiết kế
    const templates = [
      { id: 1, name: 'Đánh giá Năng lực Developer (Q3/2026)', department: 'Phòng Phát triển', criteria: 5, weight: '100%', status: 'Active' },
      { id: 2, name: 'Chỉ tiêu Doanh số Sales (Tháng 8)', department: 'Phòng Kinh doanh', criteria: 3, weight: '100%', status: 'Active' },
      { id: 3, name: 'Đánh giá Thử việc chung', department: 'Tất cả phòng ban', criteria: 8, weight: '100%', status: 'Draft' },
    ];
    return res.json(templates);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy mẫu KPI' });
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

export default router;
