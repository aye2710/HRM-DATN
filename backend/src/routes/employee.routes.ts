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

// 1.5 Get employment history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const history = await prisma.employmentHistory.findMany({
      include: {
        employee: true,
        department: true,
        position: true
      },
      orderBy: { effectiveDate: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử việc làm' });
  }
});

// 2. Add employee
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, fullName, cccd, joinDate, departmentId, positionId } = req.body;
    
    const newEmployee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          code,
          fullName,
          cccd: cccd ? cccd : null,
          joinDate: new Date(joinDate),
          departmentId: departmentId || null,
          positionId: positionId || null
        }
      });
      
      await tx.employmentHistory.create({
        data: {
          employeeId: emp.id,
          departmentId: departmentId || null,
          positionId: positionId || null,
          changeReason: 'Tuyển mới (New Hire)'
        }
      });
      
      return emp;
    });
    
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm nhân viên' });
  }
});

// 2.5 Get employee details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        position: true,
        contracts: { orderBy: { startDate: 'desc' } },
        account: true,
        relatives: true,
        degrees: true,
        certificates: true
      }
    });
    if (!employee) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    res.json(employee);
  } catch (error) {
    console.error('Error in GET /api/employees/:id:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin nhân viên' });
  }
});

// 3. Update employee
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { 
      code, fullName, cccd, email, phone, gender, dateOfBirth, address, status, joinDate, departmentId, positionId,
      nationality, maritalStatus, taxCode, bankName, bankAccount, socialInsurance, healthInsurance,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation
    } = req.body;
    
    // Check if code or cccd already exists for another employee
    const orConditions: any[] = [{ code }];
    if (cccd) orConditions.push({ cccd });
    if (email) orConditions.push({ email });

    const existing = await prisma.employee.findFirst({
      where: {
        OR: orConditions,
        NOT: { id }
      }
    });

    if (existing) {
      if (existing.code === code) return res.status(400).json({ error: 'Mã nhân viên đã tồn tại' });
      if (existing.cccd === cccd) return res.status(400).json({ error: 'CCCD đã tồn tại' });
      if (existing.email === email) return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        code,
        fullName,
        cccd: cccd ? cccd : null,
        email: email ? email : null,
        phone: phone ? phone : null,
        gender: gender ? gender : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address ? address : null,
        nationality: nationality ? nationality : null,
        maritalStatus: maritalStatus ? maritalStatus : null,
        taxCode: taxCode ? taxCode : null,
        bankName: bankName ? bankName : null,
        bankAccount: bankAccount ? bankAccount : null,
        socialInsurance: socialInsurance ? socialInsurance : null,
        healthInsurance: healthInsurance ? healthInsurance : null,
        emergencyContactName: emergencyContactName ? emergencyContactName : null,
        emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone : null,
        emergencyContactRelation: emergencyContactRelation ? emergencyContactRelation : null,
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
      // Lấy thông tin hiện tại
      const currentEmp = await tx.employee.findUnique({ where: { id } });
      
      // Đổi status nhân viên
      await tx.employee.update({
        where: { id },
        data: { status: 'RESIGNED', departmentId: null, positionId: null }
      });
      
      // Đóng các hợp đồng đang kích hoạt
      await tx.contract.updateMany({
        where: { employeeId: id, status: 'ACTIVE' },
        data: { status: 'TERMINATED', endDate: new Date() }
      });
      
      // Ghi lịch sử nghỉ việc
      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          departmentId: currentEmp?.departmentId,
          positionId: currentEmp?.positionId,
          changeReason: 'Nghỉ việc (Resigned)'
        }
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
    
    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: { departmentId: departmentId || null, positionId: positionId || null }
      });
      
      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          departmentId: departmentId || null,
          positionId: positionId || null,
          changeReason: 'Điều chuyển (Transfer)'
        }
      });
      
      return emp;
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi điều chuyển nhân sự' });
  }
});

export default router;
