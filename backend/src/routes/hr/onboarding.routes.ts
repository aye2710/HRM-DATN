import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'IT_SUPPORT'));

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
router.post('/task/toggle', authenticateToken, async (req: Request, res: Response) => {
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

// 3. Hoàn tất Hội nhập -> Chuyển sang PROBATION hoặc INTERNSHIP & Tự động kích hoạt tài khoản
router.post('/complete', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        include: { position: true, account: true }
      });

      if (!employee) throw new Error('Không tìm thấy nhân viên');

      let nextStatus: any = 'PROBATION';
      if (employee.position?.level?.toLowerCase() === 'intern') {
        nextStatus = 'INTERNSHIP';
      }

      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: { status: nextStatus }
      });

      // Nếu nhân viên chưa có Account truy cập cổng ESS, tự động tạo Account
      let account = employee.account;
      if (!account) {
        let employeeRole = await tx.role.findUnique({ where: { name: 'EMPLOYEE' } });
        if (!employeeRole) {
          employeeRole = await tx.role.create({
            data: { name: 'EMPLOYEE', description: 'Nhân viên cổng tự phục vụ ESS' }
          });
        }

        const username = employee.code.toLowerCase();
        const hashedPassword = await bcrypt.hash('123456', 10);

        account = await tx.account.create({
          data: {
            username,
            password: hashedPassword,
            employeeId: employee.id,
            roleId: employeeRole.id,
            isActive: true
          }
        });
      } else if (!account.isActive) {
        await tx.account.update({
          where: { id: account.id },
          data: { isActive: true }
        });
      }

      return { updatedEmployee, accountCreated: !employee.account };
    });

    await createAuditLog({
      action: 'COMPLETE_ONBOARDING',
      tableName: 'Employee',
      recordId: employeeId,
      accountId: req.user?.accountId,
      details: `Hoàn tất chương trình hội nhập nhân sự ${result.updatedEmployee.fullName} (${result.updatedEmployee.code}). Chuyển trạng thái sang ${result.updatedEmployee.status}.`
    });

    res.json({
      message: 'Hoàn tất hội nhập nhân viên thành công!',
      employee: result.updatedEmployee
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi hoàn tất hội nhập' });
  }
});

export default router;
