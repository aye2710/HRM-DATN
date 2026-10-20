import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// Áp dụng xác thực cho bảng điều khiển
router.use(authenticateToken);

// GET /api/dashboard/stats - Thống kê nhanh bảng điều khiển thời gian thực
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      pendingOT,
      openJobPostings,
      todayAttendances,
      contracts
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: { not: 'RESIGNED' } } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.oTRequest.count({ where: { status: 'PENDING' } }),
      prisma.jobPosting.count({ where: { status: 'OPEN' } }),
      prisma.attendance.count({ where: { date: today, checkIn: { not: null } } }),
      prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        select: { baseSalary: true }
      })
    ]);

    // Tổng quỹ lương cơ bản hàng tháng từ các hợp đồng đang ACTIVE
    const totalPayroll = contracts.reduce((sum, c) => sum + Number(c.baseSalary || 0), 0);
    const estimatedPayroll = totalPayroll > 0 
      ? `${(totalPayroll / 1000000).toFixed(1)}M` 
      : `${(activeEmployees * 10)}M`;

    res.status(200).json({
      totalEmployees: activeEmployees || totalEmployees,
      pendingLeaves,
      pendingOT,
      openJobPostings,
      todayAttendances,
      estimatedPayroll,
      totalPayrollVND: totalPayroll
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
