import { Router } from 'express';
import { prisma } from '../../db';

const router = Router();

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
router.post('/', async (req, res) => {
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
    res.status(201).json(newPosition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update position
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, description, level, minSalary, maxSalary, departmentId, status } = req.body;

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
    res.json(updatedPosition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete position
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if position has employees
    const pos = await prisma.position.findUnique({
        where: { id },
        include: { _count: { select: { employees: true } } }
    });
    
    if (pos && pos._count.employees > 0) {
        return res.status(400).json({ error: 'Không thể xóa vị trí đang có nhân viên' });
    }

    await prisma.position.delete({ where: { id } });
    res.json({ message: 'Đã xóa vị trí' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
