import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// GET: Lấy danh sách phòng ban
router.get('/', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, name, managerName, quota, status, parentId } = req.body;

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Mã phòng ban đã tồn tại' });
    }

    const newDept = await prisma.department.create({
      data: {
        code: code as string,
        name: name as string,
        managerName: managerName as string | undefined,
        quota: quota ? parseInt(quota as string) : 15,
        status: (status as string) || 'ACTIVE',
        parentId: parentId ? (parentId as string) : null
      }
    });
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm phòng ban' });
  }
});

// PUT: Cập nhật phòng ban
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { code, name, managerName, quota, status, parentId } = req.body;

    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        code: code as string,
        name: name as string,
        managerName: managerName as string | undefined,
        quota: quota ? parseInt(quota as string) : 15,
        status: (status as string) || 'ACTIVE',
        parentId: parentId === '' ? null : (parentId ? (parentId as string) : undefined)
      }
    });
    res.json(updatedDept);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật phòng ban' });
  }
});

// DELETE: Xóa phòng ban
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const employeeCount = await prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      return res.status(400).json({ error: 'Không thể xóa phòng ban đang có nhân viên' });
    }

    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Xóa phòng ban thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa phòng ban' });
  }
});

export default router;
