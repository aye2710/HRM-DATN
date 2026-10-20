import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// GET: Lấy danh sách Hợp đồng
router.get('/', async (req: Request, res: Response) => {
  try {
    // Tự động chuyển các hợp đồng đã hết hạn (endDate < hiện tại) sang EXPIRED
    await prisma.contract.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

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
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId, contractType, baseSalary, startDate, endDate, evaluationResult, fileUrl } = req.body;
    
    // Quy tắc BR-CHR-02-01 (Tính độc quyền hiệu lực):
    // Một nhân viên tại một thời điểm chỉ có tối đa 1 hợp đồng ACTIVE.
    // Nếu có hợp đồng cũ đang ACTIVE -> chuyển sang EXPIRED
    await prisma.contract.updateMany({
      where: {
        employeeId,
        status: 'ACTIVE'
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // Tạo hợp đồng mới
    const newContract = await prisma.contract.create({
      data: {
        employeeId,
        contractType,
        baseSalary,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        fileUrl: fileUrl || null,
        status: 'ACTIVE'
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

    return res.status(201).json({ contract: newContract, employee: updatedEmployee });
  } catch (error) {
    console.error("Create Contract Error:", error);
    return res.status(500).json({ error: 'Lỗi khi tạo hợp đồng mới' });
  }
});

// PATCH: Cập nhật thông tin / tải ảnh hợp đồng đã ký
router.patch('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { fileUrl, status, contractType, baseSalary, startDate, endDate } = req.body;
    
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...(fileUrl !== undefined && { fileUrl }),
        ...(status !== undefined && { status }),
        ...(contractType !== undefined && { contractType }),
        ...(baseSalary !== undefined && { baseSalary }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null })
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Update Contract Error:", error);
    return res.status(500).json({ error: 'Lỗi khi cập nhật hợp đồng' });
  }
});

// DELETE: Xóa Hợp đồng
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.contract.delete({ where: { id } });
    return res.json({ message: 'Xóa hợp đồng thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa hợp đồng' });
  }
});

export default router;
