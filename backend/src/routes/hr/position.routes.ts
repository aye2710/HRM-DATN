import { Router } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const hrOrgOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');

// Áp dụng bảo mật xác thực cho danh mục vị trí chức danh
router.use(authenticateToken);

// Get all positions
router.get('/', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        department: {
          select: { name: true }
        }
      },
      orderBy: { title: 'asc' }
    });
    res.json(positions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create position
router.post('/', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { code, title, description, level, minSalary, maxSalary, departmentId, status } = req.body;
    
    // Check code existence
    const existingCode = await prisma.position.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: 'Mã vị trí đã tồn tại' });
    }

    const newPosition = await prisma.position.create({
      data: {
        code,
        title,
        description: description || '',
        level,
        minSalary: minSalary || 0,
        maxSalary: maxSalary || 0,
        departmentId: departmentId || null,
        status: status || 'ACTIVE'
      }
    });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    await createAuditLog({
      action: 'CREATE_POSITION',
      tableName: 'Position',
      recordId: newPosition.id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details: `Khởi tạo vị trí chức danh mới: "${newPosition.title}" (Mã: ${newPosition.code}, Cấp bậc: ${newPosition.level}, Dải lương: ${newPosition.minSalary} - ${newPosition.maxSalary})`
    });

    return res.status(201).json(newPosition);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update position
router.put('/:id', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { code, title, description, level, minSalary, maxSalary, departmentId, status } = req.body;

    const existingPos = await prisma.position.findUnique({ where: { id } });
    if (!existingPos) {
      return res.status(404).json({ error: 'Không tìm thấy vị trí chức danh' });
    }

    // Check code if changed
    if (code) {
        const existingCode = await prisma.position.findFirst({
            where: { code, id: { not: id } }
        });
        if (existingCode) {
            return res.status(400).json({ error: 'Mã vị trí đã tồn tại' });
        }
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: {
        code,
        title,
        description,
        level,
        minSalary,
        maxSalary,
        departmentId: departmentId || null,
        status
      }
    });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    let action = 'UPDATE_POSITION';
    let details = `Cập nhật vị trí chức danh: "${updatedPosition.title}" (${updatedPosition.code}).`;

    if (status && status !== existingPos.status) {
      if (status === 'INACTIVE') {
        action = 'LOCK_POSITION';
        details = `Khóa / Đóng băng vị trí chức danh: "${updatedPosition.title}" (Mã: ${updatedPosition.code}). Trạng thái sang INACTIVE.`;
      } else {
        action = 'UNLOCK_POSITION';
        details = `Mở khóa / Kích hoạt lại vị trí chức danh: "${updatedPosition.title}" (Mã: ${updatedPosition.code}). Trạng thái sang ACTIVE.`;
      }
    } else {
      const changes: string[] = [];
      if (title && title !== existingPos.title) changes.push(`Chức danh: "${existingPos.title}" -> "${title}"`);
      if (code && code !== existingPos.code) changes.push(`Mã: "${existingPos.code}" -> "${code}"`);
      if (level && level !== existingPos.level) changes.push(`Cấp bậc: ${existingPos.level} -> ${level}`);
      if (minSalary !== undefined && minSalary !== existingPos.minSalary) changes.push(`Lương sàn: ${existingPos.minSalary} -> ${minSalary}`);
      if (maxSalary !== undefined && maxSalary !== existingPos.maxSalary) changes.push(`Lương trần: ${existingPos.maxSalary} -> ${maxSalary}`);
      if (changes.length > 0) details += ` Các mục thay đổi: ${changes.join(', ')}.`;
    }

    await createAuditLog({
      action,
      tableName: 'Position',
      recordId: updatedPosition.id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details
    });

    return res.json(updatedPosition);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete position
router.delete('/:id', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    // Check if position has employees
    const pos = await prisma.position.findUnique({
        where: { id },
        include: { _count: { select: { employees: true } } }
    });
    
    if (!pos) {
      return res.status(404).json({ error: 'Không tìm thấy vị trí' });
    }

    if (pos._count.employees > 0) {
        return res.status(400).json({ error: 'Không thể xóa vị trí đang có nhân viên' });
    }

    await prisma.position.delete({ where: { id } });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    await createAuditLog({
      action: 'DELETE_POSITION',
      tableName: 'Position',
      recordId: id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details: `Xóa vị trí chức danh: "${pos.title}" (Mã: ${pos.code})`
    });

    return res.json({ message: 'Đã xóa vị trí' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
