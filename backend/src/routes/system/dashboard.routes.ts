import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// GET /api/dashboard/stats - Thống kê nhanh bảng điều khiển
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalEmployees = await prisma.employee.count();
    const pendingLeaves = await prisma.leaveRequest.count({
      where: { status: 'PENDING' }
    });
    
    // Giả lập quỹ lương ước tính: Mỗi nhân viên 10M
    const estimatedPayroll = (totalEmployees * 10) + 'M';
    
    res.status(200).json({
      totalEmployees,
      pendingLeaves,
      estimatedPayroll
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
