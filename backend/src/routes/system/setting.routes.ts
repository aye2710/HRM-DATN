import express, { Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = express.Router();

const adminOnly = requireRole('ADMIN', 'SUPER_ADMIN');
const hrOrAdmin = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');

// ==========================================
// 1. SYSTEM SETTINGS (Cấu hình tham số)
// ==========================================

const DEFAULT_SETTINGS = [
  // Lương & Thuế
  {
    category: 'PAYROLL',
    key: 'INSURANCE_RATE',
    name: 'Tỷ lệ trích BHXH, BHYT, BHTN của người lao động',
    value: '10.5',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Bao gồm BHXH 8%, BHYT 1.5%, BHTN 1% trừ trực tiếp vào lương tháng.'
  },
  {
    category: 'PAYROLL',
    key: 'PERSONAL_DEDUCTION',
    name: 'Mức giảm trừ gia cảnh bản thân (Thuế TNCN)',
    value: '11000000',
    dataType: 'NUMBER',
    unit: 'VNĐ / tháng',
    description: 'Mức miễn trừ tính thuế TNCN cho cá nhân người nộp thuế theo Luật Thuế TNCN hiện hành.'
  },
  {
    category: 'PAYROLL',
    key: 'DEPENDENT_DEDUCTION',
    name: 'Mức giảm trừ mỗi người phụ thuộc',
    value: '4400000',
    dataType: 'NUMBER',
    unit: 'VNĐ / người / tháng',
    description: 'Mức giảm trừ cho mỗi người phụ thuộc có đăng ký MST hợp lệ.'
  },
  {
    category: 'PAYROLL',
    key: 'MAX_INSURANCE_SALARY',
    name: 'Mức trần lương tính đóng BHXH bắt buộc',
    value: '46800000',
    dataType: 'NUMBER',
    unit: 'VNĐ',
    description: 'Tương đương 20 lần mức lương cơ sở (2.340.000 VNĐ x 20).'
  },
  {
    category: 'PAYROLL',
    key: 'STANDARD_WORKING_DAYS',
    name: 'Số ngày công chuẩn trung bình tháng',
    value: '22',
    dataType: 'NUMBER',
    unit: 'Ngày',
    description: 'Số ngày công định mức trong tháng làm căn cứ chia đơn giá ngày lương.'
  },
  {
    category: 'PAYROLL',
    key: 'PAYROLL_CUTOFF_DAY',
    name: 'Ngày chốt bảng chấm công hàng tháng',
    value: '25',
    dataType: 'NUMBER',
    unit: 'Hàng tháng',
    description: 'Chu kỳ tính lương chốt từ ngày 26 tháng trước đến ngày 25 tháng này.'
  },

  // Làm thêm giờ (OT)
  {
    category: 'ATTENDANCE',
    key: 'OT_RATE_NORMAL',
    name: 'Hệ số lương làm thêm giờ ngày làm việc thường',
    value: '150',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Tối thiểu 150% theo Điều 98 Bộ luật Lao động.'
  },
  {
    category: 'ATTENDANCE',
    key: 'OT_RATE_WEEKEND',
    name: 'Hệ số lương làm thêm giờ ngày nghỉ hàng tuần',
    value: '200',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Tối thiểu 200% áp dụng vào ngày Thứ 7, Chủ nhật.'
  },
  {
    category: 'ATTENDANCE',
    key: 'OT_RATE_HOLIDAY',
    name: 'Hệ số lương làm thêm giờ ngày Lễ, Tết có hưởng lương',
    value: '300',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Tối thiểu 300% chưa kể tiền lương ngày lễ đối với người lao động hưởng lương ngày.'
  },

  // Quản trị Nhân sự & Quy trình
  {
    category: 'HR',
    key: 'PROBATION_MAX_DAYS',
    name: 'Thời gian thử việc tối đa chức danh đại học trở lên',
    value: '60',
    dataType: 'NUMBER',
    unit: 'Ngày',
    description: 'Điều 27 Bộ luật Lao động 2019: Tối đa 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ từ cao đẳng trở lên.'
  },
  {
    category: 'HR',
    key: 'ANNUAL_LEAVE_BASE',
    name: 'Số ngày nghỉ phép năm tiêu chuẩn',
    value: '12',
    dataType: 'NUMBER',
    unit: 'Ngày / năm',
    description: 'Điều 113 Bộ luật Lao động: Người lao động làm đủ 12 tháng được nghỉ 12 ngày phép nguyên lương.'
  },
  {
    category: 'HR',
    key: 'SENIORITY_LEAVE_STEP',
    name: 'Số năm thâm niên được cộng thêm 01 ngày phép',
    value: '5',
    dataType: 'NUMBER',
    unit: 'Năm',
    description: 'Điều 114 Bộ luật Lao động: Cứ đủ 05 năm làm việc thì số ngày nghỉ phép năm được tăng thêm tương ứng 01 ngày.'
  },
  {
    category: 'HR',
    key: 'AUTO_LOCK_RESIGNED_ACCOUNTS',
    name: 'Tự động vô hiệu hóa tài khoản khi nhân sự Thôi việc',
    value: 'true',
    dataType: 'BOOLEAN',
    unit: '',
    description: 'Khóa tài khoản hệ thống ngay khi Quyết định Thôi việc có hiệu lực nhằm bảo mật dữ liệu doanh nghiệp.'
  }
];

export const seedDefaultSettings = async () => {
  const count = await prisma.systemSetting.count();
  if (count === 0) {
    for (const s of DEFAULT_SETTINGS) {
      await prisma.systemSetting.create({ data: s });
    }
  }
};

// GET /api/settings - Lấy toàn bộ tham số nghiệp vụ (Cần đăng nhập)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    await seedDefaultSettings();
    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }]
    });

    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/bulk - Cập nhật hàng loạt tham số nghiệp vụ (Super Admin / Admin Only)
router.put('/bulk', authenticateToken, adminOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Dữ liệu cập nhật không hợp lệ' });
    }

    const updatedItems = [];
    for (const item of updates) {
      if (item.key && item.value !== undefined) {
        const updated = await prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: {
            category: item.category || 'GENERAL',
            key: item.key,
            name: item.name || item.key,
            value: String(item.value),
            dataType: item.dataType || 'STRING',
            unit: item.unit || '',
            description: item.description || ''
          }
        });
        updatedItems.push(updated);
      }
    }

    await createAuditLog({
      action: 'UPDATE_SETTINGS',
      tableName: 'SystemSetting',
      recordId: 'BULK',
      accountId: req.user?.accountId,
      details: `Đã cập nhật ${updatedItems.length} tham số nghiệp vụ hệ thống.`
    });

    res.json({ message: 'Lưu cấu hình tham số nghiệp vụ thành công', settings: updatedItems });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for other routes to get numerical or string parameter value
export const getSettingValue = async (key: string, defaultValue: number | string): Promise<any> => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return defaultValue;
    if (setting.dataType === 'NUMBER' || setting.dataType === 'PERCENT') {
      const num = Number(setting.value);
      return isNaN(num) ? defaultValue : num;
    }
    return setting.value;
  } catch (e) {
    return defaultValue;
  }
};

// ==========================================
// 2. RBAC & PERMISSIONS (Quản lý Quyền hạn)
// ==========================================

const DEFAULT_PERMISSIONS = [
  // Hồ sơ & Nhân sự
  { action: 'EMP_VIEW', description: 'Xem danh sách & hồ sơ nhân viên' },
  { action: 'EMP_EDIT', description: 'Thêm mới & Chỉnh sửa hồ sơ' },
  { action: 'EMP_DECISION', description: 'Ban hành Quyết định nhân sự' },
  { action: 'EMP_CONTRACT', description: 'Quản lý Hợp đồng lao động' },

  // Tiền lương & Đãi ngộ
  { action: 'PAY_VIEW', description: 'Xem bảng lương toàn công ty' },
  { action: 'PAY_CALC', description: 'Chạy động cơ tính lương tự động' },
  { action: 'PAY_LOCK', description: 'Khóa sổ / Mở khóa sổ kỳ lương' },
  { action: 'PAY_EXPORT', description: 'Xuất dữ liệu bảng lương (Excel/CSV)' },

  // Chấm công & Nghỉ phép
  { action: 'ATT_VIEW', description: 'Xem bảng công & lịch sử chấm công' },
  { action: 'ATT_ADJUST', description: 'Điều chỉnh công & Giải trình' },
  { action: 'LEAVE_APPROVE', description: 'Phê duyệt đơn xin nghỉ phép' },

  // Tuyển dụng & KPI
  { action: 'REC_MANAGE', description: 'Quản lý Tin tuyển dụng & Ứng viên' },
  { action: 'REC_OFFER', description: 'Gửi Thư mời nhận việc (Offer)' },
  { action: 'KPI_REVIEW', description: 'Đánh giá & Chấm điểm KPI' },

  // Quản trị & Bảo mật
  { action: 'SYS_AUDIT', description: 'Xem Nhật ký kiểm toán (Audit Trail)' },
  { action: 'SYS_RBAC', description: 'Cấu hình Phân quyền & Vai trò (RBAC)' },
  { action: 'SYS_NOTIF', description: 'Cấu hình Thông báo tự động' },
];

export const seedDefaultPermissionsAndRoles = async () => {
  // 1. Seed permissions
  for (const p of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: { description: p.description },
      create: { action: p.action, description: p.description }
    });
  }

  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map(p => [p.action, p.id]));

  // 2. Seed standard roles
  const rolesToEnsure = [
    {
      name: 'ADMIN',
      description: 'Quản trị viên toàn quyền hệ thống (Super Administrator)',
      perms: DEFAULT_PERMISSIONS.map(p => p.action)
    },
    {
      name: 'HR_MANAGER',
      description: 'Quản lý Nhân sự, Tiền lương và Tuyển dụng',
      perms: [
        'EMP_VIEW', 'EMP_EDIT', 'EMP_DECISION', 'EMP_CONTRACT',
        'PAY_VIEW', 'PAY_CALC', 'PAY_EXPORT',
        'ATT_VIEW', 'ATT_ADJUST', 'LEAVE_APPROVE',
        'REC_MANAGE', 'REC_OFFER', 'KPI_REVIEW',
        'SYS_AUDIT'
      ]
    },
    {
      name: 'MANAGER',
      description: 'Trưởng phòng ban chuyên môn',
      perms: ['EMP_VIEW', 'ATT_VIEW', 'LEAVE_APPROVE', 'REC_MANAGE', 'KPI_REVIEW']
    },
    {
      name: 'EMPLOYEE',
      description: 'Nhân viên cổng tự phục vụ (Self-service)',
      perms: ['EMP_VIEW', 'ATT_VIEW']
    }
  ];

  for (const roleDef of rolesToEnsure) {
    let role = await prisma.role.findUnique({ where: { name: roleDef.name } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.description
        }
      });
    }

    // Check if role has permissions assigned
    const assignedCount = await prisma.rolePermission.count({ where: { roleId: role.id } });
    if (assignedCount === 0) {
      for (const action of roleDef.perms) {
        const permId = permMap.get(action);
        if (permId) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
            update: {},
            create: { roleId: role.id, permissionId: permId }
          });
        }
      }
    }
  }
};

// GET /api/settings/permissions - Lấy danh mục quyền hạn
router.get('/permissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    await seedDefaultPermissionsAndRoles();
    const permissions = await prisma.permission.findMany({
      orderBy: { action: 'asc' }
    });
    res.json(permissions);
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/roles - Lấy danh sách vai trò và quyền hạn
router.get('/roles', authenticateToken, async (req: Request, res: Response) => {
  try {
    await seedDefaultPermissionsAndRoles();
    const roles = await prisma.role.findMany({
      include: {
        accounts: { select: { id: true } },
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      usersCount: r.accounts.length,
      isSystem: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'].includes(r.name.toUpperCase()),
      permissions: r.permissions.map(p => p.permission.action)
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/roles - Tạo vai trò mới (Admin Only)
router.post('/roles', authenticateToken, adminOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { name, description, cloneFromRoleId, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên vai trò không được để trống' });
    }

    const formattedName = name.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await prisma.role.findUnique({ where: { name: formattedName } });
    if (existing) {
      return res.status(400).json({ error: `Vai trò "${formattedName}" đã tồn tại` });
    }

    let permActionsToAssign: string[] = Array.isArray(permissions) ? permissions : [];

    // Clone from role if provided and perms not explicitly specified
    if (cloneFromRoleId && permActionsToAssign.length === 0) {
      const source = await prisma.role.findUnique({
        where: { id: cloneFromRoleId },
        include: { permissions: { include: { permission: true } } }
      });
      if (source) {
        permActionsToAssign = source.permissions.map(p => p.permission.action);
      }
    }

    const newRole = await prisma.role.create({
      data: {
        name: formattedName,
        description: description?.trim() || null
      }
    });

    if (permActionsToAssign.length > 0) {
      const dbPerms = await prisma.permission.findMany({
        where: { action: { in: permActionsToAssign } }
      });
      for (const p of dbPerms) {
        await prisma.rolePermission.create({
          data: { roleId: newRole.id, permissionId: p.id }
        });
      }
    }

    await createAuditLog({
      action: 'CREATE_ROLE',
      tableName: 'Role',
      recordId: newRole.id,
      accountId: req.user?.accountId,
      details: `Khởi tạo vai trò mới: ${formattedName} với ${permActionsToAssign.length} quyền.`
    });

    res.status(201).json({
      message: 'Khởi tạo vai trò thành công',
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        usersCount: 0,
        isSystem: false,
        permissions: permActionsToAssign
      }
    });
  } catch (error: any) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/roles/:id - Cập nhật thông tin vai trò (Admin Only)
router.put('/roles/:id', authenticateToken, adminOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ error: 'Không tìm thấy vai trò' });
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(description !== undefined && { description: description?.trim() || null })
      }
    });

    await createAuditLog({
      action: 'UPDATE_ROLE',
      tableName: 'Role',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Cập nhật thông tin vai trò: ${role.name}`
    });

    res.json({ message: 'Cập nhật vai trò thành công', role: updated });
  } catch (error: any) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/roles/:id/permissions - Cập nhật ma trận quyền hạn cho vai trò (Admin Only)
router.put('/roles/:id/permissions', authenticateToken, adminOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Array of permission strings (actions)

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Danh sách quyền không hợp lệ' });
    }

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ error: 'Không tìm thấy vai trò' });
    }

    // Bảo vệ quyền Super Admin cốt lõi
    if (role.name === 'ADMIN' || role.name === 'SUPER_ADMIN') {
      if (!permissions.includes('SYS_RBAC') || !permissions.includes('SYS_AUDIT')) {
        return res.status(400).json({ error: 'Không thể tước quyền Quản trị hệ thống của Quản trị viên!' });
      }
    }

    // Tra cứu danh sách ID quyền
    const dbPerms = await prisma.permission.findMany({
      where: { action: { in: permissions } }
    });

    // Thực hiện cập nhật trong Transaction
    await prisma.$transaction(async (tx) => {
      // Xóa toàn bộ liên kết quyền cũ
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Tạo liên kết quyền mới
      for (const p of dbPerms) {
        await tx.rolePermission.create({
          data: {
            roleId: id,
            permissionId: p.id
          }
        });
      }
    });

    await createAuditLog({
      action: 'UPDATE_ROLE_PERMISSIONS',
      tableName: 'RolePermission',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Cập nhật quyền hạn vai trò [${role.name}]: cấp ${dbPerms.length} quyền.`
    });

    res.json({
      message: `Cập nhật phân quyền cho vai trò ${role.name} thành công`,
      permissions: dbPerms.map(p => p.action)
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/settings/roles/:id - Xóa vai trò (Admin Only)
router.delete('/roles/:id', authenticateToken, adminOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { accounts: true }
    });

    if (!role) {
      return res.status(404).json({ error: 'Không tìm thấy vai trò' });
    }

    if (['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'].includes(role.name.toUpperCase())) {
      return res.status(400).json({ error: 'Không thể xóa vai trò mặc định của hệ thống' });
    }

    if (role.accounts.length > 0) {
      return res.status(400).json({
        error: `Không thể xóa vai trò này vì đang có ${role.accounts.length} tài khoản sử dụng`
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });
    });

    await createAuditLog({
      action: 'DELETE_ROLE',
      tableName: 'Role',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Đã xóa vai trò tùy chỉnh: ${role.name}`
    });

    res.json({ message: `Đã xóa vai trò ${role.name} thành công` });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. AUDIT LOGS (Nhật ký Kiểm toán Hệ thống)
// ==========================================

// GET /api/settings/audit-logs - Tra cứu nhật ký kiểm toán (HR / Admin Only)
router.get('/audit-logs', authenticateToken, hrOrAdmin, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string || '').trim();
    const action = (req.query.action as string || '').trim();

    const where: any = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { tableName: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { recordId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    // Enrich logs with account username & employee fullName
    const accountIds = Array.from(new Set(logs.map(l => l.accountId).filter(id => id && id !== 'SYSTEM')));
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        username: true,
        employee: { select: { fullName: true, code: true } }
      }
    });

    const accountMap = new Map(accounts.map(a => [
      a.id,
      a.employee?.fullName ? `${a.employee.fullName} (${a.username})` : a.username
    ]));

    const formattedLogs = logs.map(l => ({
      id: l.id,
      action: l.action,
      resource: `${l.tableName} [${l.recordId}]`,
      user: l.accountId === 'SYSTEM' ? 'SYSTEM' : (accountMap.get(l.accountId) || l.accountId),
      details: l.details || '',
      time: l.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      createdAt: l.createdAt
    }));

    res.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/audit-logs - Ghi vết kiểm toán thủ công (Manual audit entry)
router.post('/audit-logs', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { action, resource, details } = req.body;
    if (!action || !resource) {
      return res.status(400).json({ error: 'Hành động và Đối tượng không được để trống' });
    }

    const log = await createAuditLog({
      action: action.trim().toUpperCase(),
      tableName: 'MANUAL_ENTRY',
      recordId: resource.trim(),
      accountId: req.user?.accountId,
      details: details || null
    });

    res.status(201).json({ message: 'Ghi nhật ký kiểm toán thành công', log });
  } catch (error: any) {
    console.error('Error logging audit entry:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
