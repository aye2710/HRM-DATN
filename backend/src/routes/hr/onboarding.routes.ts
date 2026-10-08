import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// 1. Lấy danh sách nhân viên đang Onboarding
router.get('/newbies', async (req: Request, res: Response) => {
  try {
    const newbies = await prisma.employee.findMany({
      where: { status: 'ONBOARDING' },
      include: {
        department: true,
        position: true,
        onboardingTasks: true
      },
      orderBy: { joinDate: 'desc' }
    });
    res.json(newbies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân sự Onboarding' });
  }
});

// 2. Chuyển đổi trạng thái (Check/Uncheck) của 1 task
router.post('/task/toggle', async (req: Request, res: Response) => {
  try {
    const { employeeId, taskName, category, isCompleted } = req.body;
    
    // Tìm task hiện tại
    let task = await prisma.onboardingTask.findFirst({
      where: { employeeId, taskName, category }
    });

    if (task) {
      task = await prisma.onboardingTask.update({
        where: { id: task.id },
        data: { isCompleted }
      });
    } else {
      task = await prisma.onboardingTask.create({
        data: { employeeId, taskName, category, isCompleted }
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật tiến độ công việc' });
  }
});

// 3. Hoàn tất Hội nhập -> Chuyển sang PROBATION hoặc INTERNSHIP
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { position: true }
    });

    if (!employee) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    let nextStatus: any = 'PROBATION';
    if (employee.position?.level?.toLowerCase() === 'intern') {
      nextStatus = 'INTERNSHIP';
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { status: nextStatus }
    });

    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi hoàn tất hội nhập' });
  }
});

export default router;
