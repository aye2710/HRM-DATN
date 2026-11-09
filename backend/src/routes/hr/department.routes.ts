import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const hrOrgOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');

// Áp dụng bảo mật cho toàn bộ phân hệ Cơ cấu tổ chức
router.use(authenticateToken);

// GET: Lấy danh sách phòng ban (kèm số lượng nhân sự thực tế)
router.get('/', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true, children: true, positions: true }
        }
      },
      orderBy: { code: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phòng ban' });
  }
});

// POST: Thêm phòng ban mới
router.post('/', hrOrgOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, name, managerName, quota, status, parentId } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Mã phòng ban và tên phòng ban không được bỏ trống' });
    }

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Mã phòng ban đã tồn tại trong hệ thống' });
    }

    const newDept = await prisma.department.create({
      data: {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        managerName: managerName ? String(managerName).trim() : null,
        quota: quota ? parseInt(String(quota)) : 15,
        status: (status as string) || 'ACTIVE',
        parentId: parentId ? (parentId as string) : null
      }
    });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    await createAuditLog({
      action: 'CREATE_DEPARTMENT',
      tableName: 'Department',
      recordId: newDept.id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details: `Khởi tạo phòng ban mới: "${newDept.name}" (Mã: ${newDept.code}, Định biên: ${newDept.quota} người, Trạng thái: ${newDept.status})`
    });

    return res.status(201).json(newDept);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi thêm phòng ban' });
  }
});

// Helper: Sinh mã phòng ban thông minh phía server nếu người dùng để trống
const generateServerDeptCode = (deptName: string, existingCodes: Set<string>): string => {
  if (!deptName || !deptName.trim()) return 'PB';
  const clean = deptName.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const keywordMap = [
    { regex: /nhan\s*su|tuyen\s*dung|hr/i, code: 'HR' },
    { regex: /tai\s*chinh|ke\s*toan|finance/i, code: 'TCKT' },
    { regex: /phat\s*trien|phan\s*mem|lap\s*trinh|dev|software/i, code: 'DEV' },
    { regex: /kiem\s*thu|tester|qa|qc/i, code: 'TEST' },
    { regex: /phan\s*tich|business\s*analyst|ba/i, code: 'BA' },
    { regex: /giam\s*doc|ban\s*giam\s*doc|board/i, code: 'BGD' },
    { regex: /marketing|truyen\s*thong|mkt/i, code: 'MKT' },
    { regex: /kinh\s*doanh|ban\s*hang|sales/i, code: 'KD' },
    { regex: /ky\s*thuat|cong\s*nghe|it/i, code: 'IT' },
    { regex: /van\s*hanh|operations|ops/i, code: 'OPS' },
    { regex: /hanh\s*chinh|admin/i, code: 'HC' },
    { regex: /phap\s*che|legal/i, code: 'LEGAL' },
    { regex: /cham\s*soc\s*khach\s*hang|cskh/i, code: 'CSKH' },
    { regex: /an\s*ninh|bao\s*mat|security/i, code: 'SEC' }
  ];

  let baseCode = '';
  for (const item of keywordMap) {
    if (item.regex.test(clean)) {
      baseCode = item.code;
      break;
    }
  }

  if (!baseCode) {
    const words = clean.split(/[\s\-_]+/).filter(w => !['phong', 'ban', 'to', 'khoi', 'trung', 'tam', 'bo', 'phan'].includes(w));
    const targetWords = words.length > 0 ? words : clean.split(/[\s\-_]+/);
    baseCode = targetWords.map(w => w[0]?.toUpperCase()).join('').slice(0, 6);
  }

  if (!baseCode) baseCode = 'PB';

  let finalCode = baseCode;
  let counter = 2;
  while (existingCodes.has(finalCode.toUpperCase())) {
    finalCode = `${baseCode}${counter}`;
    counter++;
  }
  return finalCode;
};

// POST: Nạp hàng loạt phòng ban từ file Excel
router.post('/bulk-import', hrOrgOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const { departments } = req.body;
    if (!Array.isArray(departments) || departments.length === 0) {
      return res.status(400).json({ error: 'Danh sách phòng ban không hợp lệ hoặc rỗng.' });
    }

    const currentDepts = await prisma.department.findMany({
      select: { id: true, code: true, name: true }
    });

    const existingCodes = new Set(currentDepts.map(d => d.code.toUpperCase()));
    const deptMapByName = new Map<string, string>();
    const deptMapByCode = new Map<string, string>();

    currentDepts.forEach(d => {
      deptMapByName.set(d.name.trim().toLowerCase(), d.id);
      deptMapByCode.set(d.code.trim().toUpperCase(), d.id);
    });

    const results = {
      total: departments.length,
      successCount: 0,
      skippedCount: 0,
      errors: [] as string[]
    };

    const createdDepts: any[] = [];

    for (let i = 0; i < departments.length; i++) {
      const item = departments[i];
      const rawName = String(item.name || '').trim();

      if (!rawName) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1}: Tên phòng ban không được bỏ trống.`);
        continue;
      }

      // Kiểm tra trùng tên phòng ban
      if (deptMapByName.has(rawName.toLowerCase())) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1}: Phòng ban "${rawName}" đã tồn tại trong hệ thống.`);
        continue;
      }

      // Xử lý mã phòng ban
      let code = item.code ? String(item.code).trim().toUpperCase() : '';
      if (!code) {
        code = generateServerDeptCode(rawName, existingCodes);
      }

      if (existingCodes.has(code)) {
        // Tự động thêm hậu tố để tránh lỗi trùng mã
        let counter = 2;
        let altCode = `${code}${counter}`;
        while (existingCodes.has(altCode)) {
          counter++;
          altCode = `${code}${counter}`;
        }
        code = altCode;
      }

      // Xử lý định biên và trạng thái
      const quota = Math.max(1, parseInt(String(item.quota || 15)) || 15);
      const managerName = item.managerName ? String(item.managerName).trim() : null;
      const status = item.status && String(item.status).toUpperCase().includes('KHÓA') ? 'INACTIVE' : 'ACTIVE';

      // Xử lý phòng ban cấp cha (nếu có)
      let parentId: string | null = null;
      if (item.parentName) {
        const pName = String(item.parentName).trim().toLowerCase();
        parentId = deptMapByName.get(pName) || null;
      }
      if (!parentId && item.parentCode) {
        const pCode = String(item.parentCode).trim().toUpperCase();
        parentId = deptMapByCode.get(pCode) || null;
      }

      try {
        const newDept = await prisma.department.create({
          data: {
            code,
            name: rawName,
            managerName,
            quota,
            status,
            parentId
          }
        });

        existingCodes.add(code);
        deptMapByName.set(rawName.toLowerCase(), newDept.id);
        deptMapByCode.set(code, newDept.id);
        createdDepts.push(newDept);
        results.successCount++;
      } catch (err: any) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1} (${rawName}): ${err.message || 'Lỗi khi lưu phòng ban'}`);
      }
    }

    if (results.successCount > 0) {
      await createAuditLog({
        action: 'CREATE_DEPARTMENT_BATCH',
        tableName: 'Department',
        recordId: 'BATCH_IMPORT',
        accountId: (req as any).user?.accountId || 'ADMIN',
        details: `Nhập thành công ${results.successCount}/${results.total} phòng ban từ file Excel.`
      });
    }

    return res.status(200).json({
      message: `Đã nạp thành công ${results.successCount}/${results.total} phòng ban vào hệ thống.`,
      ...results
    });
  } catch (error: any) {
    console.error('Error in bulk import departments:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nhập hàng loạt phòng ban' });
  }
});

// PUT: Cập nhật phòng ban (kèm thuật toán chống vòng lặp phả hệ cha-con và Audit Log)
router.put('/:id', hrOrgOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { code, name, managerName, quota, status, parentId } = req.body;

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) {
      return res.status(404).json({ error: 'Không tìm thấy phòng ban' });
    }

    // 1. Chống tự chọn chính mình làm phòng ban cha
    if (parentId && parentId === id) {
      return res.status(400).json({ error: 'Phòng ban không thể làm phòng ban cha của chính nó!' });
    }

    // 2. Thuật toán đệ quy kiểm tra chống vòng lặp (Anti-circular Tree Hierarchy)
    if (parentId) {
      let currentParentId: string | null = parentId;
      while (currentParentId) {
        if (currentParentId === id) {
          return res.status(400).json({ 
            error: 'Không thể thiết lập phòng ban cấp dưới làm phòng ban cha (phát hiện vòng lặp phân cấp tổ chức).' 
          });
        }
        const parentDept = await prisma.department.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        currentParentId = parentDept?.parentId || null;
      }
    }

    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        ...(code && { code: String(code).trim().toUpperCase() }),
        ...(name && { name: String(name).trim() }),
        managerName: managerName !== undefined ? (managerName ? String(managerName).trim() : null) : undefined,
        quota: quota !== undefined ? parseInt(String(quota)) : undefined,
        status: status || undefined,
        parentId: parentId === '' ? null : (parentId ? String(parentId) : undefined)
      }
    });

    // 3. Ghi nhận nhật ký kiểm toán (Audit Trail)
    let action = 'UPDATE_DEPARTMENT';
    let details = `Cập nhật thông tin phòng ban: "${updatedDept.name}" (${updatedDept.code}).`;

    if (status && status !== existingDept.status) {
      if (status === 'INACTIVE') {
        action = 'LOCK_DEPARTMENT';
        details = `Khóa / Đóng băng phòng ban: "${updatedDept.name}" (Mã: ${updatedDept.code}). Chuyển trạng thái từ ACTIVE sang INACTIVE.`;
      } else {
        action = 'UNLOCK_DEPARTMENT';
        details = `Mở khóa / Kích hoạt lại phòng ban: "${updatedDept.name}" (Mã: ${updatedDept.code}). Chuyển trạng thái sang ACTIVE.`;
      }
    } else {
      const changes: string[] = [];
      if (name && name !== existingDept.name) changes.push(`Tên: "${existingDept.name}" -> "${name}"`);
      if (code && code !== existingDept.code) changes.push(`Mã: "${existingDept.code}" -> "${code}"`);
      if (managerName !== undefined && managerName !== existingDept.managerName) changes.push(`Người đại diện: "${existingDept.managerName || 'Chưa có'}" -> "${managerName || 'Chưa có'}"`);
      if (quota !== undefined && Number(quota) !== existingDept.quota) changes.push(`Định biên: ${existingDept.quota} -> ${quota}`);
      if (parentId !== undefined && parentId !== existingDept.parentId) changes.push(`Luân chuyển phòng ban cha`);
      if (changes.length > 0) details += ` Các mục thay đổi: ${changes.join(', ')}.`;
    }

    await createAuditLog({
      action,
      tableName: 'Department',
      recordId: updatedDept.id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details
    });

    return res.json(updatedDept);
  } catch (error: any) {
    console.error('Error updating department:', error);
    return res.status(500).json({ error: 'Lỗi khi cập nhật phòng ban' });
  }
});

// DELETE: Xóa phòng ban (Kiểm tra toàn diện tất cả các bảng quan hệ kèm Audit Log)
router.delete('/:id', hrOrgOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const deptToDelete = await prisma.department.findUnique({ where: { id } });
    if (!deptToDelete) {
      return res.status(404).json({ error: 'Không tìm thấy phòng ban' });
    }

    // 1. Kiểm tra nhân viên đang thuộc phòng ban
    const employeeCount = await prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      return res.status(400).json({ error: `Không thể xóa phòng ban đang có ${employeeCount} nhân viên làm việc!` });
    }

    // 2. Kiểm tra các phòng ban con trực thuộc
    const childCount = await prisma.department.count({ where: { parentId: id } });
    if (childCount > 0) {
      return res.status(400).json({ error: `Không thể xóa phòng ban đang có ${childCount} phòng ban con trực thuộc!` });
    }

    // 3. Kiểm tra vị trí chức danh liên kết
    const positionCount = await prisma.position.count({ where: { departmentId: id } });
    if (positionCount > 0) {
      return res.status(400).json({ error: `Không thể xóa phòng ban đang có ${positionCount} vị trí chức danh liên kết!` });
    }

    // 4. Kiểm tra tin tuyển dụng liên kết
    const jobCount = await prisma.jobPosting.count({ where: { departmentId: id } });
    if (jobCount > 0) {
      return res.status(400).json({ error: `Không thể xóa phòng ban đang có ${jobCount} tin tuyển dụng liên kết!` });
    }

    await prisma.department.delete({ where: { id } });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    await createAuditLog({
      action: 'DELETE_DEPARTMENT',
      tableName: 'Department',
      recordId: id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details: `Xóa vĩnh viễn phòng ban: "${deptToDelete.name}" (Mã: ${deptToDelete.code})`
    });

    return res.json({ message: 'Xóa phòng ban thành công' });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ error: 'Lỗi khi xóa phòng ban' });
  }
});

export default router;
