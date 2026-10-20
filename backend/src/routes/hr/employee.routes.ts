import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// Áp dụng xác thực cho toàn bộ phân hệ quản trị nhân sự Core HR
router.use(authenticateToken);

// 0. GET /me: Lấy thông tin cá nhân của người dùng đang đăng nhập (dành cho Cổng ESS)
router.get('/me', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      // Trường hợp tài khoản quản trị hệ thống không gắn với Employee cụ thể
      return res.json({
        id: null,
        fullName: req.user?.username || 'Quản trị viên',
        code: 'ADMIN',
        role: req.user?.role || 'SUPER_ADMIN',
        department: { name: 'Ban Quản Trị Hệ Thống' },
        position: { title: 'Quản trị viên' }
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        position: true,
        contracts: { orderBy: { startDate: 'desc' } },
        relatives: true,
        degrees: true,
        certificates: true
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân viên tương ứng với tài khoản này.' });
    }

    return res.json(employee);
  } catch (error) {
    console.error('Error in GET /api/employees/me:', error);
    return res.status(500).json({ error: 'Lỗi server khi lấy thông tin cá nhân' });
  }
});

// 1. Get all employees
router.get('/', async (req: Request, res: Response) => {
  try {
    // Tự động chuyển các hợp đồng đã qua endDate sang EXPIRED
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
    const id = req.params.id as string;
    
    // Tự động chuyển các hợp đồng đã qua endDate sang EXPIRED
    await prisma.contract.updateMany({
      where: {
        employeeId: id,
        status: 'ACTIVE',
        endDate: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    const employee = await prisma.employee.findUnique({
      where: { id },
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

// 5. Terminate employee (Thôi việc / Nghỉ việc)
router.post('/:id/terminate', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    // Kiểm tra ràng buộc tài sản: Nhân viên còn giữ thiết bị chưa thu hồi thì không cho thôi việc
    const activeAssets = await prisma.assetAssignment.count({
      where: { employeeId: id, status: 'ACTIVE' }
    });
    if (activeAssets > 0) {
      return res.status(400).json({
        error: `Không thể hoàn tất thủ tục thôi việc! Nhân viên đang nắm giữ ${activeAssets} tài sản/thiết bị chưa hoàn trả. Vui lòng làm thủ tục thu hồi tài sản trước.`
      });
    }

    await prisma.$transaction(async (tx) => {
      // Lấy thông tin hiện tại
      const currentEmp = await tx.employee.findUnique({ where: { id } });
      if (!currentEmp) throw new Error('Không tìm thấy nhân viên');
      
      // Đổi status nhân viên sang RESIGNED
      await tx.employee.update({
        where: { id },
        data: { status: 'RESIGNED', departmentId: null, positionId: null }
      });
      
      // Đóng tất cả hợp đồng đang kích hoạt sang TERMINATED
      await tx.contract.updateMany({
        where: { employeeId: id, status: 'ACTIVE' },
        data: { status: 'TERMINATED', endDate: new Date() }
      });

      // Khóa tài khoản đăng nhập hệ thống (Vá lỗ hổng bảo mật)
      await tx.account.updateMany({
        where: { employeeId: id },
        data: { isActive: false }
      });
      
      // Ghi nhật ký lịch sử công tác
      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          departmentId: currentEmp.departmentId,
          positionId: currentEmp.positionId,
          changeReason: 'Nghỉ việc (Resigned)',
          effectiveDate: new Date()
        }
      });
    });
    
    return res.json({ message: 'Đã hoàn tất thủ tục thôi việc, khóa tài khoản và cập nhật hồ sơ thành công.' });
  } catch (error: any) {
    console.error('Error in POST /api/employees/:id/terminate:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi xử lý thôi việc' });
  }
});

// 6. Transfer employee (Điều chuyển công tác)
router.post('/:id/transfer', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { departmentId, positionId, changeReason } = req.body;

    if (!departmentId && !positionId) {
      return res.status(400).json({ error: 'Vui lòng chọn phòng ban hoặc vị trí chức danh mới cần điều chuyển.' });
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      const currentEmp = await tx.employee.findUnique({ where: { id } });
      if (!currentEmp) throw new Error('Không tìm thấy nhân viên');

      const emp = await tx.employee.update({
        where: { id },
        data: { 
          departmentId: departmentId || currentEmp.departmentId, 
          positionId: positionId || currentEmp.positionId 
        },
        include: { department: true, position: true }
      });
      
      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          departmentId: departmentId || currentEmp.departmentId,
          positionId: positionId || currentEmp.positionId,
          changeReason: changeReason || 'Điều chuyển công tác (Transfer)',
          effectiveDate: new Date()
        }
      });
      
      return emp;
    });
    
    return res.json(updated);
  } catch (error: any) {
    console.error('Error in POST /api/employees/:id/transfer:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi điều chuyển nhân sự' });
  }
});

// ==========================================
// 7. QUẢN LÝ NGƯỜI PHỤ THUỘC (RELATIVES / DEPENDENTS - THUẾ TNCN)
// ==========================================

// GET /api/employees/:id/relatives
router.get('/:id/relatives', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    const relatives = await prisma.relative.findMany({
      where: { employeeId },
      orderBy: { fullName: 'asc' }
    });
    return res.json(relatives);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi lấy danh sách người thân/người phụ thuộc' });
  }
});

// POST /api/employees/:id/relatives
router.post('/:id/relatives', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    const { fullName, relation, dateOfBirth, taxCode, isDependent } = req.body;

    if (!fullName || !relation) {
      return res.status(400).json({ error: 'Họ tên và mối quan hệ không được để trống' });
    }

    const relative = await prisma.relative.create({
      data: {
        employeeId,
        fullName: String(fullName).trim(),
        relation: String(relation).trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        taxCode: taxCode ? String(taxCode).trim() : null,
        isDependent: Boolean(isDependent)
      }
    });

    return res.status(201).json(relative);
  } catch (error) {
    console.error('Error adding relative:', error);
    return res.status(500).json({ error: 'Lỗi khi thêm thông tin người thân/người phụ thuộc' });
  }
});

// PUT /api/employees/:id/relatives/:relativeId
router.put('/:id/relatives/:relativeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { relativeId } = req.params;
    const { fullName, relation, dateOfBirth, taxCode, isDependent } = req.body;

    const updated = await prisma.relative.update({
      where: { id: relativeId },
      data: {
        ...(fullName && { fullName: String(fullName).trim() }),
        ...(relation && { relation: String(relation).trim() }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(taxCode !== undefined && { taxCode: taxCode ? String(taxCode).trim() : null }),
        ...(isDependent !== undefined && { isDependent: Boolean(isDependent) })
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật thông tin người phụ thuộc' });
  }
});

// DELETE /api/employees/:id/relatives/:relativeId
router.delete('/:id/relatives/:relativeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { relativeId } = req.params;
    await prisma.relative.delete({ where: { id: relativeId } });
    return res.json({ message: 'Đã xóa người thân/người phụ thuộc thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa người phụ thuộc' });
  }
});

// ==========================================
// 8. QUẢN LÝ BẰNG CẤP & HỌC VẤN (DEGREES)
// ==========================================

// GET /api/employees/:id/degrees
router.get('/:id/degrees', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    const degrees = await prisma.degree.findMany({
      where: { employeeId },
      orderBy: { gradYear: 'desc' }
    });
    return res.json(degrees);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi lấy danh sách bằng cấp' });
  }
});

// POST /api/employees/:id/degrees
router.post('/:id/degrees', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    const { degreeName, major, institution, gradYear } = req.body;

    if (!degreeName || !major || !institution) {
      return res.status(400).json({ error: 'Tên bằng cấp, chuyên ngành và trường đào tạo không được để trống' });
    }

    const degree = await prisma.degree.create({
      data: {
        employeeId,
        degreeName: String(degreeName).trim(),
        major: String(major).trim(),
        institution: String(institution).trim(),
        gradYear: gradYear ? parseInt(String(gradYear)) : null
      }
    });

    return res.status(201).json(degree);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi thêm bằng cấp' });
  }
});

// DELETE /api/employees/:id/degrees/:degreeId
router.delete('/:id/degrees/:degreeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { degreeId } = req.params;
    await prisma.degree.delete({ where: { id: degreeId } });
    return res.json({ message: 'Đã xóa bằng cấp thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa bằng cấp' });
  }
});

// ==========================================
// 9. QUẢN LÝ CHỨNG CHỈ NGHỀ NGHIỆP (CERTIFICATES)
// ==========================================

// GET /api/employees/:id/certificates
router.get('/:id/certificates', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    const certificates = await prisma.certificate.findMany({
      where: { employeeId },
      orderBy: { issueDate: 'desc' }
    });
    return res.json(certificates);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi lấy danh sách chứng chỉ' });
  }
});

// POST /api/employees/:id/certificates
router.post('/:id/certificates', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    const { name, issuedBy, issueDate, expiryDate } = req.body;

    if (!name || !issuedBy) {
      return res.status(400).json({ error: 'Tên chứng chỉ và đơn vị cấp không được để trống' });
    }

    const certificate = await prisma.certificate.create({
      data: {
        employeeId,
        name: String(name).trim(),
        issuedBy: String(issuedBy).trim(),
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });

    return res.status(201).json(certificate);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi thêm chứng chỉ' });
  }
});

// DELETE /api/employees/:id/certificates/:certId
router.delete('/:id/certificates/:certId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { certId } = req.params;
    await prisma.certificate.delete({ where: { id: certId } });
    return res.json({ message: 'Đã xóa chứng chỉ thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa chứng chỉ' });
  }
});

export default router;
