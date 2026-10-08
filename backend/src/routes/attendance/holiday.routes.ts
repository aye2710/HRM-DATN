import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// Lấy danh sách ngày lễ
router.get('/', async (req: Request, res: Response) => {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách ngày lễ' });
  }
});

// Thêm ngày lễ
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, date } = req.body;
    const holiday = await prisma.holiday.create({
      data: { name, date: new Date(date) }
    });
    res.status(201).json(holiday);
  } catch (error) {
    res.status(400).json({ error: 'Lỗi thêm ngày lễ' });
  }
});

// Xóa ngày lễ
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.holiday.delete({ where: { id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(400).json({ error: 'Lỗi xóa ngày lễ' });
  }
});

export default router;
