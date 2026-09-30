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
        contracts: { orderBy: { startDate: 'desc' } }
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
        cccd: cccd ? cccd : null,
        joinDate: new Date(joinDate),
        departmentId: departmentId || null,
        positionId: positionId || null
      }
    });
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm nhân viên' });
  }
});

// 3. Update employee
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { code, fullName, cccd, status, joinDate, departmentId, positionId } = req.body;
    
    // Check if code or cccd already exists for another employee
    const orConditions: any[] = [{ code }];
    if (cccd) {
      orConditions.push({ cccd });
    }

    const existing = await prisma.employee.findFirst({
      where: {
        OR: orConditions,
        NOT: { id }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Mã nhân viên hoặc CCCD đã được sử dụng bởi người khác' });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        code,
        fullName,
        cccd: cccd ? cccd : null,
        status,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        departmentId: departmentId || null,
        positionId: positionId || null
      },
      include: {
        department: true,
        position: true
      }
    });
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
  }
});

// 4. Delete employee
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check references before deleting
    const contractCount = await prisma.contract.count({ where: { employeeId: id } });
    if (contractCount > 0) {
      return res.status(400).json({ error: 'Không thể xóa nhân viên đã có hợp đồng' });
    }

    await prisma.employee.delete({ where: { id } });
    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
  }
});

// 5. Terminate employee (Nghỉ việc)
router.post('/:id/terminate', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    await prisma.$transaction(async (tx) => {
      // Đổi status nhân viên
      await tx.employee.update({
        where: { id },
        data: { status: 'RESIGNED' }
      });
      // Đóng các hợp đồng đang kích hoạt
      await tx.contract.updateMany({
        where: { employeeId: id, status: 'ACTIVE' },
        data: { status: 'TERMINATED', endDate: new Date() }
      });
    });
    
    res.json({ message: 'Đã cập nhật trạng thái nghỉ việc' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xử lý nghỉ việc' });
  }
});

// 6. Transfer employee (Điều chuyển)
router.post('/:id/transfer', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { departmentId, positionId } = req.body;
    
    const updated = await prisma.employee.update({
      where: { id },
      data: { departmentId, positionId }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi điều chuyển nhân sự' });
  }
});

export default router;
