import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// 1. Get all employees
router.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        position: true,
      },
      orderBy: { joinDate: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân viên' });
  }
});

// 2. Add employee
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, fullName, cccd, joinDate, departmentId, positionId } = req.body;
    const newEmployee = await prisma.employee.create({
      data: {
        code,
        fullName,
        cccd,
        joinDate: new Date(joinDate),
        departmentId,
        positionId
      }
    });
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm nhân viên' });
  }
});

export default router;
