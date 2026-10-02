import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// ==========================================
// 1. LEAVE TYPES CONFIG (Cấu hình loại phép)
// ==========================================
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = await prisma.leaveTypeConfig.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách loại phép' });
  }
});

router.post('/types', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newType = await prisma.leaveTypeConfig.create({
      data: {
        name: data.name,
        code: data.code,
        defaultDays: parseInt(data.defaultDays),
        paid: data.paid,
        carryForward: data.carryForward,
        status: data.status || 'Hoạt động'
      }
    });
    res.status(201).json(newType);
  } catch (error) {
    res.status(400).json({ error: 'Mã loại phép đã tồn tại hoặc dữ liệu không hợp lệ' });
  }
});

router.delete('/types/:id', async (req: Request, res: Response) => {
  try {
    await prisma.leaveTypeConfig.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa loại phép' });
  } catch (error) {
    res.status(400).json({ error: 'Lỗi khi xóa loại phép' });
  }
});

// ==========================================
// 2. LEAVE POLICIES (Chính sách nghỉ phép)
// ==========================================
router.get('/policies', async (req: Request, res: Response) => {
  try {
    const policies = await prisma.leavePolicy.findMany();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách chính sách' });
  }
});

router.post('/policies', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newPolicy = await prisma.leavePolicy.create({
      data: {
        name: data.name,
        type: data.type,
        seniority: data.seniority,
        extraDays: data.extraDays,
        maxDays: data.maxDays
      }
    });
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
});

router.delete('/policies/:id', async (req: Request, res: Response) => {
  try {
    await prisma.leavePolicy.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa chính sách' });
  } catch (error) {
    res.status(400).json({ error: 'Lỗi khi xóa chính sách' });
  }
});

export default router;
