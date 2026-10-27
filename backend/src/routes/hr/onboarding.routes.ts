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

// 1b. Lấy danh sách Ứng viên đang chờ Hội nhập (Pre-onboarding Hub)
router.get('/pre-onboarding', async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        offer: {
          status: 'ACCEPTED'
        },
        status: {
          not: 'HIRED'
        }
      },
      include: {
        jobPosting: {
          include: { department: true, position: true }
        },
        offer: true,
        preOnboarding: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng viên Pre-onboarding' });
  }
});

// 1c. Giám sát Tuân thủ Hồ sơ & Khóa chi trả (Hồ sơ nhân sự & BOD Logs)
router.get('/compliance-overview', async (req: Request, res: Response) => {
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
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'BOD_OVERRIDE_ONBOARDING_PAYROLL_LOCK' },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ newbies, auditLogs });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu giám sát hồ sơ và khóa lương' });
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

// 4. Phê duyệt ngoại lệ mở khóa lương từ Ban Giám đốc (FE-G06 - BOD Override & Audit Trail)
router.post('/bod-override', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), async (req: any, res: any) => {
  try {
    const { employeeId, reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Bắt buộc nhập lý do ngoại lệ theo chuẩn kiểm toán' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }

    // Ghi nhận Audit Log bất biến
    const log = await createAuditLog({
      action: 'BOD_OVERRIDE_ONBOARDING_PAYROLL_LOCK',
      tableName: 'Employee',
      recordId: employeeId,
      accountId: req.user?.accountId || 'BOD_ADMIN',
      details: `Ban Giám đốc phê duyệt mở khóa chi trả lương ngoại lệ cho ${employee.fullName} (${employee.code}). Lý do: ${reason}`
    });

    res.json({
      success: true,
      message: 'Phê duyệt ngoại lệ thành công và đã lưu vết Audit Trail',
      log
    });
  } catch (error: any) {
    console.error('Error processing BOD override:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi phê duyệt ngoại lệ' });
  }
});

export default router;

