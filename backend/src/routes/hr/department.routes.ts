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
