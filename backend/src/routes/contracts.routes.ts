import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET: Lấy danh sách Hợp đồng
router.get('/', async (req: Request, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hợp đồng' });
  }
});

// POST: Tạo Hợp đồng mới
router.post('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, contractType, baseSalary, startDate, endDate, evaluationResult } = req.body;
    
    // Tạo hợp đồng
    const newContract = await prisma.contract.create({
      data: {
        employeeId,
        contractType,
        baseSalary,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      }
    });

    // Xử lý Đánh giá: Cập nhật Trạng thái Nhân viên nếu cần
    let updatedEmployee = null;
    if (evaluationResult === 'PASSED') {
      // Nếu hợp đồng mới là hợp đồng chính thức, đổi trạng thái nhân viên thành ACTIVE
      if (contractType === 'OFFICIAL_1Y' || contractType === 'INDEFINITE') {
        updatedEmployee = await prisma.employee.update({
          where: { id: employeeId },
          data: { status: 'ACTIVE' }
        });
      }
    }

    res.status(201).json({ contract: newContract, employee: updatedEmployee });
  } catch (error) {
    console.error("Create Contract Error:", error);
    res.status(500).json({ error: 'Lỗi khi tạo hợp đồng mới' });
  }
});

// DELETE: Xóa Hợp đồng
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.contract.delete({ where: { id } });
    res.json({ message: 'Xóa hợp đồng thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa hợp đồng' });
  }
});

export default router;
