import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Áp dụng xác thực cho toàn bộ phân hệ quản trị nhân sự Core HR
router.use(authenticateToken);

// Phân quyền cho cán bộ phụ trách nhân sự
const hrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'CB_SPECIALIST');

// Helper: Cho phép HR quản trị HOẶC chính nhân sự tự thao tác hồ sơ cá nhân qua ESS (Chống IDOR)
const canManageOrSelf = (req: any, targetEmployeeId: string): boolean => {
  const role = req.user?.role?.toUpperCase();
  if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF', 'CB_SPECIALIST'].includes(role)) {
    return true;
  }
  return req.user?.employeeId === targetEmployeeId;
};

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
        contracts: { orderBy: { startDate: 'desc' }, include: { appendices: { orderBy: { effectiveDate: 'desc' } } } },
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
        manager: { select: { id: true, fullName: true, code: true } },
        contracts: { orderBy: { startDate: 'desc' }, include: { appendices: { orderBy: { effectiveDate: 'desc' } } } }
      },
      orderBy: { joinDate: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    console.error('Error in GET /api/employees:', error);
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

// 2. Add employee (HR Only + Quota Check + Input Validation + Comprehensive Fields)
router.post('/', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      code, fullName, cccd, cccdIssueDate, cccdIssuePlace, cccdExpiryDate,
      birthPlace, hometown, ethnicity, religion, dataConsent, dataConsentDate,
      email, phone, gender, dateOfBirth, address, permanentAddress, temporaryAddress, currentAddress,
      nationality, maritalStatus, taxCode, bankName, bankBranch, bankAccount, bankAccountHolder,
      socialInsurance, healthInsurance, emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      emergencyContacts, highestEducation, workExperience, attachedFiles,
      status, managementRole, managerId, workLocation, employmentType,
      probationStartDate, probationEndDate, officialJoinDate, resignationDate, resignationReason,
      joinDate, departmentId, positionId 
    } = req.body;
    
    if (!code?.trim() || !fullName?.trim() || !joinDate) {
      return res.status(400).json({ error: 'Mã nhân viên, Họ và tên và Ngày vào làm không được để trống.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanCccd = cccd ? String(cccd).trim() : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanTaxCode = taxCode ? String(taxCode).trim() : null;

    if (cleanCccd && !/^\d{9}(\d{3})?$/.test(cleanCccd)) {
      return res.status(400).json({ error: 'Số CCCD không hợp lệ (yêu cầu 9 hoặc 12 chữ số).' });
    }

    // Kiểm tra định biên phòng ban
    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { _count: { select: { employees: { where: { status: { not: 'RESIGNED' } } } } } }
      });
      if (dept && dept.quota && dept._count.employees >= dept.quota) {
        return res.status(400).json({
          error: `Phòng ban "${dept.name}" đã đủ định biên nhân sự (${dept._count.employees}/${dept.quota}). Không thể tuyển thêm!`
        });
      }
    }

    // Kiểm tra trùng lặp đa trường (Code, CCCD, Email, Phone, MST)
    const orConditions: any[] = [{ code: cleanCode }];
    if (cleanCccd) orConditions.push({ cccd: cleanCccd });
    if (cleanEmail) orConditions.push({ email: cleanEmail });
    if (cleanPhone) orConditions.push({ phone: cleanPhone });
    if (cleanTaxCode) orConditions.push({ taxCode: cleanTaxCode });

    const existing = await prisma.employee.findFirst({
      where: { OR: orConditions }
    });

    if (existing) {
      if (existing.code === cleanCode) return res.status(400).json({ error: 'Mã nhân viên đã tồn tại trong hệ thống.' });
      if (cleanCccd && existing.cccd === cleanCccd) return res.status(400).json({ error: 'Số CCCD đã tồn tại trong hệ thống.' });
      if (cleanEmail && existing.email === cleanEmail) return res.status(400).json({ error: 'Địa chỉ Email đã tồn tại trong hệ thống.' });
      if (cleanPhone && existing.phone === cleanPhone) return res.status(400).json({ error: 'Số điện thoại đã tồn tại trong hệ thống.' });
      if (cleanTaxCode && existing.taxCode === cleanTaxCode) return res.status(400).json({ error: 'Mã số thuế đã tồn tại trong hệ thống.' });
    }

    const newEmployee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          code: cleanCode,
          fullName: String(fullName).trim(),
          cccd: cleanCccd,
          cccdIssueDate: cccdIssueDate ? new Date(cccdIssueDate) : null,
          cccdIssuePlace: cccdIssuePlace ? String(cccdIssuePlace).trim() : null,
          cccdExpiryDate: cccdExpiryDate ? new Date(cccdExpiryDate) : null,
          birthPlace: birthPlace ? String(birthPlace).trim() : null,
          hometown: hometown ? String(hometown).trim() : null,
          ethnicity: ethnicity ? String(ethnicity).trim() : null,
          religion: religion ? String(religion).trim() : null,
          dataConsent: dataConsent !== undefined ? Boolean(dataConsent) : true,
          dataConsentDate: dataConsentDate ? new Date(dataConsentDate) : new Date(),

          email: cleanEmail,
          phone: cleanPhone,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: permanentAddress || address || null,
          permanentAddress: permanentAddress ? String(permanentAddress).trim() : (address || null),
          temporaryAddress: temporaryAddress ? String(temporaryAddress).trim() : null,
          currentAddress: currentAddress ? String(currentAddress).trim() : null,
          nationality: nationality ? String(nationality).trim() : 'Việt Nam',
          maritalStatus: maritalStatus || null,
          taxCode: cleanTaxCode,
          bankName: bankName ? String(bankName).trim() : null,
          bankBranch: bankBranch ? String(bankBranch).trim() : null,
          bankAccount: bankAccount ? String(bankAccount).trim() : null,
          bankAccountHolder: bankAccountHolder ? String(bankAccountHolder).trim() : null,
          socialInsurance: socialInsurance ? String(socialInsurance).trim() : null,
          healthInsurance: healthInsurance ? String(healthInsurance).trim() : null,
          emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : null,
          emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
          emergencyContactRelation: emergencyContactRelation ? String(emergencyContactRelation).trim() : null,
          emergencyContacts: emergencyContacts ? (typeof emergencyContacts === 'string' ? emergencyContacts : JSON.stringify(emergencyContacts)) : null,
          
          highestEducation: highestEducation || null,
          workExperience: workExperience ? (typeof workExperience === 'string' ? workExperience : JSON.stringify(workExperience)) : null,
          attachedFiles: attachedFiles ? (typeof attachedFiles === 'string' ? attachedFiles : JSON.stringify(attachedFiles)) : null,
          
          status: status || 'ACTIVE',
          managementRole: managementRole || 'STAFF',
          managerId: managerId || null,
          workLocation: workLocation || 'Trụ sở chính',
          employmentType: employmentType || 'FULL_TIME',
          probationStartDate: probationStartDate ? new Date(probationStartDate) : null,
          probationEndDate: probationEndDate ? new Date(probationEndDate) : null,
          officialJoinDate: officialJoinDate ? new Date(officialJoinDate) : null,
          resignationDate: resignationDate ? new Date(resignationDate) : null,
          resignationReason: resignationReason ? String(resignationReason).trim() : null,
          
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
    
    return res.status(201).json(newEmployee);
  } catch (error: any) {
    console.error('Error adding employee:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Mã nhân viên, CCCD, Email, SĐT hoặc MST đã tồn tại.' });
    }
    return res.status(500).json({ error: 'Lỗi khi thêm nhân viên' });
  }
});

// 2.1 Get all pending profile change requests across all employees (HR Only)
router.get('/change-requests/pending', hrOnly, async (req: Request, res: Response) => {
  try {
    const requests = await prisma.profileChangeRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            fullName: true,
            email: true,
            phone: true,
            department: { select: { name: true } },
            position: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending change requests:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu chờ duyệt' });
  }
});

// 2.2 Approve a profile change request (HR Only)
router.put('/change-requests/:requestId/approve', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { requestId } = req.params;
    const request = await prisma.profileChangeRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu thay đổi hồ sơ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Yêu cầu này đã được xử lý trước đó (${request.status}).` });
    }

    const proposed = JSON.parse(request.proposedData || '{}');
    const reviewerName = req.user?.fullName || req.user?.username || 'Cán bộ Nhân sự';

    // Xử lý các trường ngày tháng nếu có
    const updatePayload: any = { ...proposed };
    if (updatePayload.dateOfBirth) updatePayload.dateOfBirth = new Date(updatePayload.dateOfBirth);
    if (updatePayload.cccdIssueDate) updatePayload.cccdIssueDate = new Date(updatePayload.cccdIssueDate);
    if (updatePayload.cccdExpiryDate) updatePayload.cccdExpiryDate = new Date(updatePayload.cccdExpiryDate);

    // Cập nhật dữ liệu vào Employee và chuyển trạng thái Request sang APPROVED
    await prisma.$transaction([
      prisma.employee.update({
        where: { id: request.employeeId },
        data: updatePayload
      }),
      prisma.profileChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedBy: reviewerName,
          reviewedAt: new Date()
        }
      })
    ]);

    return res.json({
      success: true,
      message: 'Đã phê duyệt và cập nhật thành công các thông tin vào hồ sơ nhân viên!'
    });
  } catch (error) {
    console.error('Error approving change request:', error);
    return res.status(500).json({ error: 'Lỗi khi phê duyệt yêu cầu thay đổi' });
  }
});

// 2.3 Reject a profile change request (HR Only)
router.put('/change-requests/:requestId/reject', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { requestId } = req.params;
    const { rejectReason } = req.body;
    const reviewerName = req.user?.fullName || req.user?.username || 'Cán bộ Nhân sự';

    const request = await prisma.profileChangeRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu thay đổi hồ sơ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Yêu cầu này đã được xử lý trước đó (${request.status}).` });
    }

    await prisma.profileChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectReason: rejectReason || 'Thông tin chưa chính xác hoặc thiếu tài liệu minh chứng.',
        reviewedBy: reviewerName,
        reviewedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Đã từ chối yêu cầu thay đổi hồ sơ của nhân viên.'
    });
  } catch (error) {
    console.error('Error rejecting change request:', error);
    return res.status(500).json({ error: 'Lỗi khi từ chối yêu cầu thay đổi' });
  }
});

// 2.4 Get change requests for a specific employee
router.get('/:id/change-requests', async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    if (!canManageOrSelf(req, id)) {
      return res.status(403).json({ error: 'Không có quyền xem yêu cầu này.' });
    }

    const requests = await prisma.profileChangeRequest.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử yêu cầu của nhân viên' });
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
        manager: { select: { id: true, fullName: true, code: true, position: { select: { title: true } } } },
        contracts: { orderBy: { startDate: 'desc' }, include: { appendices: { orderBy: { effectiveDate: 'desc' } } } },
        account: true,
        relatives: true,
        degrees: true,
        certificates: true,
        assetAssignments: {
          include: { asset: true },
          orderBy: { assignedDate: 'desc' }
        },
        decisions: {
          include: {
            newDepartment: { select: { name: true } },
            newPosition: { select: { title: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        employmentHistories: {
          include: { department: true, position: true },
          orderBy: { effectiveDate: 'desc' }
        },
        profileChangeRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!employee) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    res.json(employee);
  } catch (error) {
    console.error('Error in GET /api/employees/:id:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin nhân viên' });
  }
});

// 3. Update employee (HR Full Update OR Employee Self-Service Personal Update with Approval Workflow)
router.put('/:id', async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    if (!canManageOrSelf(req, id)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa hồ sơ nhân sự này.' });
    }

    const userRole = req.user?.role?.toUpperCase();
    const isHR = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF', 'CB_SPECIALIST'].includes(userRole);
    const { 
      code, fullName, cccd, cccdIssueDate, cccdIssuePlace, cccdExpiryDate,
      birthPlace, hometown, ethnicity, religion, dataConsent, dataConsentDate,
      email, personalEmail, phone, gender, dateOfBirth, address, permanentAddress, temporaryAddress, currentAddress,
      nationality, maritalStatus, taxCode, bankName, bankBranch, bankAccount, bankAccountHolder,
      socialInsurance, healthInsurance, emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      emergencyContacts, highestEducation, workExperience, attachedFiles,
      status, managementRole, managerId, workLocation, employmentType,
      probationStartDate, probationEndDate, officialJoinDate, resignationDate, resignationReason,
      joinDate, departmentId, positionId 
    } = req.body;
    
    const cleanCode = code ? String(code).trim().toUpperCase() : undefined;
    const cleanCccd = cccd ? String(cccd).trim() : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPersonalEmail = personalEmail ? String(personalEmail).trim().toLowerCase() : null;
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanTaxCode = taxCode ? String(taxCode).trim() : null;

    if (cleanCccd && !/^\d{9}(\d{3})?$/.test(cleanCccd)) {
      return res.status(400).json({ error: 'Số CCCD không hợp lệ (yêu cầu 9 hoặc 12 chữ số).' });
    }

    // NẾU LÀ NHÂN VIÊN TỰ SỬA QUA CỔNG ESS:
    if (!isHR) {
      const currentEmp = await prisma.employee.findUnique({ where: { id } });
      if (!currentEmp) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

      // 🟢 1. Các trường tự sửa trực tiếp có hiệu lực ngay
      const immediateUpdate: any = {};
      if (phone !== undefined) immediateUpdate.phone = cleanPhone;
      if (personalEmail !== undefined) immediateUpdate.personalEmail = cleanPersonalEmail;
      if (currentAddress !== undefined) immediateUpdate.currentAddress = currentAddress?.trim() || null;
      if (emergencyContactName !== undefined) immediateUpdate.emergencyContactName = emergencyContactName?.trim() || null;
      if (emergencyContactPhone !== undefined) immediateUpdate.emergencyContactPhone = emergencyContactPhone?.trim() || null;
      if (emergencyContactRelation !== undefined) immediateUpdate.emergencyContactRelation = emergencyContactRelation?.trim() || null;

      // 🟡 2. Các trường nhạy cảm cần HR phê duyệt
      const sensitiveFields = [
        'fullName', 'gender', 'dateOfBirth', 'nationality', 'ethnicity',
        'birthPlace', 'hometown', 'maritalStatus', 'permanentAddress',
        'cccd', 'cccdIssueDate', 'cccdExpiryDate', 'cccdIssuePlace',
        'highestEducation', 'bankName', 'bankBranch', 'bankAccount',
        'bankAccountHolder', 'taxCode', 'socialInsurance', 'healthInsurance'
      ];

      const proposedChanges: any = {};
      for (const field of sensitiveFields) {
        if (req.body[field] !== undefined) {
          const newVal = req.body[field];
          const oldVal = (currentEmp as any)[field];

          if (['dateOfBirth', 'cccdIssueDate', 'cccdExpiryDate'].includes(field)) {
            const oldStr = oldVal ? new Date(oldVal).toISOString().split('T')[0] : '';
            const newStr = newVal ? new Date(newVal).toISOString().split('T')[0] : '';
            if (oldStr !== newStr && newStr) {
              proposedChanges[field] = newStr;
            }
          } else {
            const oldStr = String(oldVal || '').trim();
            const newStr = String(newVal || '').trim();
            if (oldStr !== newStr && newStr) {
              proposedChanges[field] = newStr;
            }
          }
        }
      }

      // Cập nhật các trường immediate
      const updated = await prisma.employee.update({
        where: { id },
        data: immediateUpdate,
        include: { department: true, position: true }
      });

      // Tạo ProfileChangeRequest nếu có thay đổi nhạy cảm
      let createdRequest = null;
      if (Object.keys(proposedChanges).length > 0) {
        // Hủy các request PENDING cũ cùng loại nếu có
        await prisma.profileChangeRequest.updateMany({
          where: { employeeId: id, status: 'PENDING' },
          data: { status: 'REJECTED', rejectReason: 'Được thay thế bởi yêu cầu cập nhật mới hơn.' }
        });

        createdRequest = await prisma.profileChangeRequest.create({
          data: {
            employeeId: id,
            requestType: 'PROFILE_UPDATE',
            proposedData: JSON.stringify(proposedChanges),
            note: req.body.requestNote || 'Đề xuất cập nhật hồ sơ cá nhân qua Cổng tự phục vụ',
            attachmentUrl: req.body.attachmentUrl || null,
            status: 'PENDING'
          }
        });
      }

      return res.json({
        success: true,
        hasPendingApproval: createdRequest !== null,
        message: createdRequest 
          ? 'Thông tin liên hệ cơ bản đã được cập nhật. Các thông tin định danh & tài chính (CCCD, Ngân hàng, MST, BHXH...) đã gửi đến Ban Nhân sự chờ phê duyệt!'
          : 'Hồ sơ cá nhân đã được cập nhật thành công!',
        employee: updated,
        changeRequest: createdRequest
      });
    }

    // NẾU LÀ ADMIN / HR QUẢN TRỊ: Cập nhật trực tiếp toàn quyền
    const orConditions: any[] = [];
    if (cleanCode) orConditions.push({ code: cleanCode });
    if (cleanCccd) orConditions.push({ cccd: cleanCccd });
    if (cleanEmail) orConditions.push({ email: cleanEmail });
    if (cleanPhone) orConditions.push({ phone: cleanPhone });
    if (cleanTaxCode) orConditions.push({ taxCode: cleanTaxCode });

    if (orConditions.length > 0) {
      const existing = await prisma.employee.findFirst({
        where: {
          OR: orConditions,
          NOT: { id }
        }
      });

      if (existing) {
        if (cleanCode && existing.code === cleanCode) return res.status(400).json({ error: 'Mã nhân viên đã tồn tại ở hồ sơ khác.' });
        if (cleanCccd && existing.cccd === cleanCccd) return res.status(400).json({ error: 'Số CCCD đã tồn tại ở hồ sơ khác.' });
        if (cleanEmail && existing.email === cleanEmail) return res.status(400).json({ error: 'Email đã tồn tại ở hồ sơ khác.' });
        if (cleanPhone && existing.phone === cleanPhone) return res.status(400).json({ error: 'Số điện thoại đã tồn tại ở hồ sơ khác.' });
        if (cleanTaxCode && existing.taxCode === cleanTaxCode) return res.status(400).json({ error: 'Mã số thuế đã tồn tại ở hồ sơ khác.' });
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(cleanCode && { code: cleanCode }),
        ...(fullName && { fullName: String(fullName).trim() }),
        cccd: cleanCccd,
        cccdIssueDate: cccdIssueDate ? new Date(cccdIssueDate) : null,
        cccdIssuePlace: cccdIssuePlace ? String(cccdIssuePlace).trim() : null,
        cccdExpiryDate: cccdExpiryDate ? new Date(cccdExpiryDate) : null,
        birthPlace: birthPlace ? String(birthPlace).trim() : null,
        hometown: hometown ? String(hometown).trim() : null,
        ethnicity: ethnicity ? String(ethnicity).trim() : null,
        religion: religion ? String(religion).trim() : null,
        ...(dataConsent !== undefined && { dataConsent: Boolean(dataConsent) }),
        ...(dataConsentDate && { dataConsentDate: new Date(dataConsentDate) }),

        email: cleanEmail,
        phone: cleanPhone,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: permanentAddress || address || null,
        permanentAddress: permanentAddress ? String(permanentAddress).trim() : (address || null),
        temporaryAddress: temporaryAddress ? String(temporaryAddress).trim() : null,
        currentAddress: currentAddress ? String(currentAddress).trim() : null,
        nationality: nationality ? String(nationality).trim() : null,
        maritalStatus: maritalStatus || null,
        taxCode: cleanTaxCode,
        bankName: bankName ? String(bankName).trim() : null,
        bankBranch: bankBranch ? String(bankBranch).trim() : null,
        bankAccount: bankAccount ? String(bankAccount).trim() : null,
        bankAccountHolder: bankAccountHolder ? String(bankAccountHolder).trim() : null,
        socialInsurance: socialInsurance ? String(socialInsurance).trim() : null,
        healthInsurance: healthInsurance ? String(healthInsurance).trim() : null,
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : null,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
        emergencyContactRelation: emergencyContactRelation ? String(emergencyContactRelation).trim() : null,
        ...(emergencyContacts !== undefined && { 
          emergencyContacts: emergencyContacts ? (typeof emergencyContacts === 'string' ? emergencyContacts : JSON.stringify(emergencyContacts)) : null 
        }),
        
        highestEducation: highestEducation || null,
        ...(workExperience !== undefined && { 
          workExperience: workExperience ? (typeof workExperience === 'string' ? workExperience : JSON.stringify(workExperience)) : null 
        }),
        ...(attachedFiles !== undefined && { 
          attachedFiles: attachedFiles ? (typeof attachedFiles === 'string' ? attachedFiles : JSON.stringify(attachedFiles)) : null 
        }),
        
        ...(isHR && {
          ...(status && { status }),
          ...(managementRole && { managementRole }),
          managerId: managerId !== undefined ? (managerId || null) : undefined,
          ...(workLocation && { workLocation }),
          ...(employmentType && { employmentType }),
          ...(probationStartDate !== undefined && { probationStartDate: probationStartDate ? new Date(probationStartDate) : null }),
          ...(probationEndDate !== undefined && { probationEndDate: probationEndDate ? new Date(probationEndDate) : null }),
          ...(officialJoinDate !== undefined && { officialJoinDate: officialJoinDate ? new Date(officialJoinDate) : null }),
          ...(resignationDate !== undefined && { resignationDate: resignationDate ? new Date(resignationDate) : null }),
          ...(resignationReason !== undefined && { resignationReason: resignationReason ? String(resignationReason).trim() : null }),
          ...(joinDate && { joinDate: new Date(joinDate) }),
          ...(departmentId !== undefined && { departmentId: departmentId || null }),
          ...(positionId !== undefined && { positionId: positionId || null })
        })
      },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, fullName: true, code: true, position: { select: { title: true } } } }
      }
    });
    return res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
  }
});

// 4. Delete employee (HR Only + Delete Constraint BR-CHR-01-03)
router.delete('/:id', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contracts: true,
            attendances: true,
            leaveRequests: true,
            otRequests: true,
            payslips: true
          }
        }
      }
    });

    if (!emp) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân viên để xóa.' });
    }

    const counts = emp._count;
    if (counts.contracts > 0 || counts.attendances > 0 || counts.leaveRequests > 0 || counts.otRequests > 0 || counts.payslips > 0) {
      return res.status(400).json({
        error: 'Không thể xóa hồ sơ nhân viên đã phát sinh dữ liệu giao dịch (Hợp đồng, Chấm công, Nghỉ phép hoặc Bảng lương). Hãy thực hiện thủ tục Thôi việc (Offboarding) để bảo lưu dữ liệu theo luật lao động!'
      });
    }

    const activeAssets = await prisma.assetAssignment.count({ where: { employeeId: id } });
    if (activeAssets > 0) {
      return res.status(400).json({ error: 'Không thể xóa nhân viên đang có dữ liệu tài sản/thiết bị chưa giải quyết.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.employmentHistory.deleteMany({ where: { employeeId: id } });
      await tx.relative.deleteMany({ where: { employeeId: id } });
      await tx.degree.deleteMany({ where: { employeeId: id } });
      await tx.certificate.deleteMany({ where: { employeeId: id } });
      await tx.onboardingTask.deleteMany({ where: { employeeId: id } });
      await tx.account.deleteMany({ where: { employeeId: id } });
      await tx.employee.delete({ where: { id } });
    });

    return res.json({ message: 'Xóa nhân viên thành công' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
  }
});

// 5. Terminate employee (Thôi việc / Nghỉ việc - SOP-26 / Mẫu F03 - HR Only)
router.post('/:id/terminate', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { lastWorkingDate, terminationReason, note } = req.body;
    
    // Kiểm tra ràng buộc tài sản: Nhân viên còn giữ thiết bị chưa thu hồi thì không cho thôi việc (SOP-26)
    const activeAssets = await prisma.assetAssignment.count({
      where: { employeeId: id, status: 'ACTIVE' }
    });
    if (activeAssets > 0) {
      return res.status(400).json({
        error: `Không thể hoàn tất thủ tục thôi việc! Nhân viên đang nắm giữ ${activeAssets} tài sản/thiết bị chưa hoàn trả. Vui lòng lập Biên bản thu hồi tài sản BM-02 (SOP-26) trước.`
      });
    }

    const effectiveDate = lastWorkingDate ? new Date(lastWorkingDate) : new Date();

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
        data: { status: 'TERMINATED', endDate: effectiveDate }
      });

      // Tự động thu hồi quyền & Khóa tài khoản lúc 18:00 ngày làm việc cuối cùng (SOP-26 / An toàn bảo mật)
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
          changeReason: terminationReason || 'Nghỉ việc theo quy trình SOP-26 (Mẫu F03)',
          effectiveDate
        }
      });
    });
    
    return res.json({ 
      message: `Đã hoàn tất thủ tục thôi việc (SOP-26 / Mẫu F03). Tài khoản nhân sự đã được khóa an ninh theo quy định.`,
      effectiveDate
    });
  } catch (error: any) {
    console.error('Error in POST /api/employees/:id/terminate:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi xử lý thôi việc' });
  }
});

// 5b. Cron Check: Tự động khóa tài khoản nhân sự nghỉ việc lúc 18:00 (SOP-26 Security Check)
router.post('/cron/auto-lock-resigned', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const resignedWithActiveAccounts = await prisma.account.findMany({
      where: {
        isActive: true,
        employee: { status: 'RESIGNED' }
      },
      include: { employee: true }
    });

    if (resignedWithActiveAccounts.length > 0) {
      await prisma.account.updateMany({
        where: {
          id: { in: resignedWithActiveAccounts.map(a => a.id) }
        },
        data: { isActive: false }
      });
    }

    return res.json({
      message: `Kiểm tra an ninh SOP-26 hoàn tất: Đã tự động rà soát và khóa ${resignedWithActiveAccounts.length} tài khoản của nhân viên đã thôi việc.`,
      lockedCount: resignedWithActiveAccounts.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Lỗi khi tự động khóa tài khoản thôi việc' });
  }
});

// 6. Transfer employee (Điều chuyển công tác - HR Only + Quota Check + Salary/Appendix Support)
router.post('/:id/transfer', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { departmentId, positionId, changeReason, newSalary } = req.body;

    if (!departmentId && !positionId && !newSalary) {
      return res.status(400).json({ error: 'Vui lòng chọn phòng ban, vị trí chức danh mới hoặc mức lương mới cần điều chuyển.' });
    }

    // Kiểm tra định biên phòng ban đích
    if (departmentId) {
      const currentEmp = await prisma.employee.findUnique({ where: { id }, select: { departmentId: true } });
      if (currentEmp?.departmentId !== departmentId) {
        const destDept = await prisma.department.findUnique({
          where: { id: departmentId },
          include: { _count: { select: { employees: { where: { status: { not: 'RESIGNED' } } } } } }
        });
        if (destDept && destDept.quota && destDept._count.employees >= destDept.quota) {
          return res.status(400).json({
            error: `Phòng ban đích "${destDept.name}" đã đạt trần định biên nhân sự (${destDept._count.employees}/${destDept.quota}). Không thể điều chuyển thêm!`
          });
        }
      }
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      const currentEmp = await tx.employee.findUnique({ 
        where: { id },
        include: { contracts: { where: { status: 'ACTIVE' } } }
      });
      if (!currentEmp) throw new Error('Không tìm thấy nhân viên');

      const empUpdateData: any = {};
      if (departmentId) empUpdateData.departmentId = departmentId;
      if (positionId) empUpdateData.positionId = positionId;

      const emp = await tx.employee.update({
        where: { id },
        data: empUpdateData,
        include: { department: true, position: true }
      });

      // Nếu có hợp đồng ACTIVE và có thay đổi vị trí / lương -> Tự động sinh Phụ lục HĐLĐ
      const activeContract = currentEmp.contracts[0];
      if (activeContract && (positionId || newSalary || departmentId)) {
        const appendixCount = await tx.contractAppendix.count({ where: { contractId: activeContract.id } });
        const year = new Date().getFullYear();
        const appNumber = `PLHĐ-${year}/${String(appendixCount + 1).padStart(2, '0')}/${activeContract.contractNumber ? activeContract.contractNumber.split('/')[0] : 'LLA'}`;

        const changes = [];
        if (positionId && emp.position) changes.push(`chức danh mới: ${emp.position.title}`);
        if (departmentId && emp.department) changes.push(`đơn vị mới: ${emp.department.name}`);
        if (newSalary) changes.push(`mức lương mới: ${Number(newSalary).toLocaleString('vi-VN')} VNĐ/tháng (mức cũ: ${Number(activeContract.baseSalary).toLocaleString('vi-VN')} VNĐ)`);

        await tx.contractAppendix.create({
          data: {
            appendixNumber: appNumber,
            contractId: activeContract.id,
            title: `Phụ lục điều chuyển vị trí công tác`,
            changeType: newSalary ? 'SALARY_ADJUSTMENT' : 'POSITION_CHANGE',
            oldSalary: activeContract.baseSalary,
            newSalary: newSalary ? Number(newSalary) : activeContract.baseSalary,
            effectiveDate: new Date(),
            content: `Hai bên thống nhất điều chuyển và áp dụng ${changes.join(', ')} kể từ ngày ${new Date().toLocaleDateString('vi-VN')}.`
          }
        });

        if (newSalary) {
          await tx.contract.update({
            where: { id: activeContract.id },
            data: { baseSalary: Number(newSalary) }
          });
        }
      }
      
      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          departmentId: departmentId || currentEmp.departmentId,
          positionId: positionId || currentEmp.positionId,
          changeReason: changeReason || `Điều chuyển công tác (Transfer)${newSalary ? ` - Lương mới: ${Number(newSalary).toLocaleString()} VNĐ` : ''}`,
          salary: newSalary ? Number(newSalary) : (activeContract?.baseSalary ? Number(activeContract.baseSalary) : undefined),
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
// ==========================================
// 7. QUẢN LÝ NGƯỜI PHỤ THUỘC (RELATIVES / DEPENDENTS - THUẾ TNCN)
// ==========================================

// GET /api/employees/:id/relatives
router.get('/:id/relatives', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin người thân của nhân viên này.' });
    }

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
router.post('/:id/relatives', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm người thân cho nhân viên này.' });
    }

    const { fullName, relation, dateOfBirth, taxCode, isDependent, cccd, taxDeductionStart, taxDeductionEnd, proofDocument } = req.body;

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
        isDependent: Boolean(isDependent),
        cccd: cccd ? String(cccd).trim() : null,
        taxDeductionStart: taxDeductionStart ? new Date(taxDeductionStart) : null,
        taxDeductionEnd: taxDeductionEnd ? new Date(taxDeductionEnd) : null,
        proofDocument: proofDocument ? String(proofDocument).trim() : null
      }
    });

    return res.status(201).json(relative);
  } catch (error) {
    console.error('Error adding relative:', error);
    return res.status(500).json({ error: 'Lỗi khi thêm thông tin người thân/người phụ thuộc' });
  }
});

// PUT /api/employees/:id/relatives/:relativeId
router.put('/:id/relatives/:relativeId', async (req: any, res: Response): Promise<any> => {
  try {
    const { id: employeeId, relativeId } = req.params;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa thông tin người thân của nhân viên này.' });
    }

    const { fullName, relation, dateOfBirth, taxCode, isDependent, cccd, taxDeductionStart, taxDeductionEnd, proofDocument } = req.body;

    const updated = await prisma.relative.update({
      where: { id: relativeId },
      data: {
        ...(fullName && { fullName: String(fullName).trim() }),
        ...(relation && { relation: String(relation).trim() }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(taxCode !== undefined && { taxCode: taxCode ? String(taxCode).trim() : null }),
        ...(isDependent !== undefined && { isDependent: Boolean(isDependent) }),
        ...(cccd !== undefined && { cccd: cccd ? String(cccd).trim() : null }),
        ...(taxDeductionStart !== undefined && { taxDeductionStart: taxDeductionStart ? new Date(taxDeductionStart) : null }),
        ...(taxDeductionEnd !== undefined && { taxDeductionEnd: taxDeductionEnd ? new Date(taxDeductionEnd) : null }),
        ...(proofDocument !== undefined && { proofDocument: proofDocument ? String(proofDocument).trim() : null })
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật thông tin người phụ thuộc' });
  }
});

// DELETE /api/employees/:id/relatives/:relativeId
router.delete('/:id/relatives/:relativeId', async (req: any, res: Response): Promise<any> => {
  try {
    const { id: employeeId, relativeId } = req.params;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa thông tin người thân của nhân viên này.' });
    }

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
router.get('/:id/degrees', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem bằng cấp của nhân viên này.' });
    }

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
router.post('/:id/degrees', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm bằng cấp cho nhân viên này.' });
    }

    const { degreeName, major, institution, gradYear, classification, fileUrl } = req.body;

    if (!degreeName || !major || !institution) {
      return res.status(400).json({ error: 'Tên bằng cấp, chuyên ngành và trường đào tạo không được để trống' });
    }

    const degree = await prisma.degree.create({
      data: {
        employeeId,
        degreeName: String(degreeName).trim(),
        major: String(major).trim(),
        institution: String(institution).trim(),
        gradYear: gradYear ? parseInt(String(gradYear)) : null,
        classification: classification ? String(classification).trim() : null,
        fileUrl: fileUrl || null
      }
    });

    return res.status(201).json(degree);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi thêm bằng cấp' });
  }
});

// DELETE /api/employees/:id/degrees/:degreeId
router.delete('/:id/degrees/:degreeId', async (req: any, res: Response): Promise<any> => {
  try {
    const { id: employeeId, degreeId } = req.params;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bằng cấp của nhân viên này.' });
    }

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
router.get('/:id/certificates', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem chứng chỉ của nhân viên này.' });
    }

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
router.post('/:id/certificates', async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.id as string;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm chứng chỉ cho nhân viên này.' });
    }

    const { name, issuedBy, issueDate, expiryDate, fileUrl } = req.body;

    if (!name || !issuedBy) {
      return res.status(400).json({ error: 'Tên chứng chỉ và đơn vị cấp không được để trống' });
    }

    const certificate = await prisma.certificate.create({
      data: {
        employeeId,
        name: String(name).trim(),
        issuedBy: String(issuedBy).trim(),
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        fileUrl: fileUrl || null
      }
    });

    return res.status(201).json(certificate);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi thêm chứng chỉ' });
  }
});

// DELETE /api/employees/:id/certificates/:certId
router.delete('/:id/certificates/:certId', async (req: any, res: Response): Promise<any> => {
  try {
    const { id: employeeId, certId } = req.params;
    if (!canManageOrSelf(req, employeeId)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa chứng chỉ của nhân viên này.' });
    }

    await prisma.certificate.delete({ where: { id: certId } });
    return res.json({ message: 'Đã xóa chứng chỉ thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa chứng chỉ' });
  }
});

export default router;
