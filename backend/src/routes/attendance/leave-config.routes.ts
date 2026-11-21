import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

// Áp dụng xác thực cho toàn bộ phân hệ Cấu hình Phép
router.use(authenticateToken);

const hrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF');

export const DEFAULT_LEAVE_TYPES = [
  {
    code: 'ANNUAL',
    name: 'Nghỉ phép năm',
    defaultDays: 12,
    paid: true,
    deductAnnualLeave: true,
    paidBy: 'COMPANY',
    carryForward: true,
    maxDaysPerOccasion: null,
    requiresAttachment: false,
    status: 'Hoạt động'
  },
  {
    code: 'MARRIAGE',
    name: 'Nghỉ kết hôn (Điều 115 BLLĐ)',
    defaultDays: 3,
    paid: true,
    deductAnnualLeave: false,
    paidBy: 'COMPANY',
    carryForward: false,
    maxDaysPerOccasion: 3,
    requiresAttachment: true,
    status: 'Hoạt động'
  },
  {
    code: 'CHILD_MARRIAGE',
    name: 'Nghỉ con kết hôn (Điều 115 BLLĐ)',
    defaultDays: 1,
    paid: true,
    deductAnnualLeave: false,
    paidBy: 'COMPANY',
    carryForward: false,
    maxDaysPerOccasion: 1,
    requiresAttachment: false,
    status: 'Hoạt động'
  },
  {
    code: 'BEREAVEMENT',
    name: 'Nghỉ tang chế (Điều 115 BLLĐ)',
    defaultDays: 3,
    paid: true,
    deductAnnualLeave: false,
    paidBy: 'COMPANY',
    carryForward: false,
    maxDaysPerOccasion: 3,
    requiresAttachment: false,
    status: 'Hoạt động'
  },
  {
    code: 'SICK',
    name: 'Nghỉ ốm đau (Chế độ BHXH chi trả)',
    defaultDays: 30,
    paid: false,
    deductAnnualLeave: false,
    paidBy: 'SOCIAL_INSURANCE',
    carryForward: false,
    maxDaysPerOccasion: null,
    requiresAttachment: true,
    status: 'Hoạt động'
  },
  {
    code: 'MATERNITY',
    name: 'Nghỉ thai sản (Chế độ BHXH chi trả 6 tháng)',
    defaultDays: 180,
    paid: false,
    deductAnnualLeave: false,
    paidBy: 'SOCIAL_INSURANCE',
    carryForward: false,
    maxDaysPerOccasion: 180,
    requiresAttachment: true,
    status: 'Hoạt động'
  },
  {
    code: 'UNPAID',
    name: 'Nghỉ không hưởng lương',
    defaultDays: 0,
    paid: false,
    deductAnnualLeave: false,
    paidBy: 'NONE',
    carryForward: false,
    maxDaysPerOccasion: null,
    requiresAttachment: false,
    status: 'Hoạt động'
  },
  {
    code: 'COMP_OFF',
    name: 'Nghỉ bù (Quy đổi từ giờ làm thêm OT)',
    defaultDays: 0,
    paid: true,
    deductAnnualLeave: false,
    paidBy: 'COMPANY',
    carryForward: false,
    maxDaysPerOccasion: null,
    requiresAttachment: false,
    status: 'Hoạt động'
  }
];

export async function ensureDefaultLeaveTypes() {
  const count = await prisma.leaveTypeConfig.count();
  if (count === 0) {
    for (const item of DEFAULT_LEAVE_TYPES) {
      await prisma.leaveTypeConfig.create({ data: item });
    }
  } else {
    for (const item of DEFAULT_LEAVE_TYPES) {
      await prisma.leaveTypeConfig.upsert({
        where: { code: item.code },
        update: {
          deductAnnualLeave: item.deductAnnualLeave,
          paidBy: item.paidBy,
          maxDaysPerOccasion: item.maxDaysPerOccasion,
          requiresAttachment: item.requiresAttachment
        },
        create: item
      });
    }
  }
}

// ==========================================
// 1. LEAVE TYPES CONFIG (Cấu hình loại phép)
// ==========================================
router.get('/types', async (req: Request, res: Response) => {
  try {
    await ensureDefaultLeaveTypes();
    const types = await prisma.leaveTypeConfig.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách loại phép' });
  }
});

router.post('/types', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const data = req.body;
    if (!data.name?.trim() || !data.code?.trim() || data.defaultDays === undefined) {
      return res.status(400).json({ error: 'Tên loại phép, mã code và số ngày mặc định không được để trống.' });
    }

    const cleanCode = String(data.code).trim().toUpperCase();
    const existing = await prisma.leaveTypeConfig.findFirst({
      where: { code: cleanCode }
    });
    if (existing) {
      return res.status(400).json({ error: `Mã loại phép "${cleanCode}" đã tồn tại trong hệ thống.` });
    }

    const newType = await prisma.leaveTypeConfig.create({
      data: {
        name: String(data.name).trim(),
        code: cleanCode,
        defaultDays: parseInt(String(data.defaultDays)),
        paid: Boolean(data.paid),
        carryForward: Boolean(data.carryForward),
        deductAnnualLeave: data.deductAnnualLeave !== undefined ? Boolean(data.deductAnnualLeave) : true,
        paidBy: data.paidBy || (Boolean(data.paid) ? 'COMPANY' : 'NONE'),
        maxDaysPerOccasion: data.maxDaysPerOccasion ? parseInt(String(data.maxDaysPerOccasion)) : null,
        requiresAttachment: Boolean(data.requiresAttachment),
        status: data.status || 'Hoạt động'
      }
    });

    await createAuditLog({
      action: 'CREATE_LEAVE_TYPE',
      tableName: 'LeaveTypeConfig',
      recordId: newType.id,
      accountId: req.user?.accountId,
      details: `Tạo loại phép "${newType.name}" (${newType.code}) - ${newType.defaultDays} ngày`
    });

    return res.status(201).json(newType);
  } catch (error) {
    return res.status(400).json({ error: 'Mã loại phép đã tồn tại hoặc dữ liệu không hợp lệ' });
  }
});

router.delete('/types/:id', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const type = await prisma.leaveTypeConfig.findUnique({ where: { id } });
    if (!type) {
      return res.status(404).json({ error: 'Không tìm thấy loại phép để xóa.' });
    }

    await prisma.leaveTypeConfig.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_LEAVE_TYPE',
      tableName: 'LeaveTypeConfig',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa loại phép "${type.name}" (${type.code})`
    });

    return res.json({ message: 'Đã xóa loại phép' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa loại phép' });
  }
});

// ==========================================
// 2. LEAVE POLICIES (Chính sách nghỉ phép)
// ==========================================
router.get('/policies', async (req: Request, res: Response) => {
  try {
    const policies = await prisma.leavePolicy.findMany({
      orderBy: { seniority: 'asc' }
    });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách chính sách' });
  }
});

router.post('/policies', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const data = req.body;
    if (!data.name?.trim() || !data.type || data.seniority === undefined) {
      return res.status(400).json({ error: 'Tên chính sách, loại phép và số năm thâm niên không được để trống.' });
    }

    const newPolicy = await prisma.leavePolicy.create({
      data: {
        name: String(data.name).trim(),
        type: data.type,
        seniority: String(data.seniority),
        extraDays: String(data.extraDays !== undefined ? data.extraDays : 0),
        maxDays: String(data.maxDays !== undefined ? data.maxDays : 20)
      }
    });

    await createAuditLog({
      action: 'CREATE_LEAVE_POLICY',
      tableName: 'LeavePolicy',
      recordId: newPolicy.id,
      accountId: req.user?.accountId,
      details: `Tạo chính sách thâm niên phép "${newPolicy.name}" (Thâm niên: ${newPolicy.seniority} năm, cộng thêm: ${newPolicy.extraDays} ngày)`
    });

    return res.status(201).json(newPolicy);
  } catch (error) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
});

router.delete('/policies/:id', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const policy = await prisma.leavePolicy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({ error: 'Không tìm thấy chính sách để xóa.' });
    }

    await prisma.leavePolicy.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_LEAVE_POLICY',
      tableName: 'LeavePolicy',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa chính sách nghỉ phép "${policy.name}"`
    });

    return res.json({ message: 'Đã xóa chính sách' });
  } catch (error) {
    return res.status(400).json({ error: 'Lỗi khi xóa chính sách' });
  }
});

export default router;
