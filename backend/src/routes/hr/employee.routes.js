"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Áp dụng xác thực cho toàn bộ phân hệ quản trị nhân sự Core HR
router.use(auth_middleware_1.authenticateToken);
// Phân quyền cho cán bộ phụ trách nhân sự
const hrOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'CB_SPECIALIST');
// Helper: Cho phép HR quản trị HOẶC chính nhân sự tự thao tác hồ sơ cá nhân qua ESS (Chống IDOR)
const canManageOrSelf = (req, targetEmployeeId) => {
    const role = req.user?.role?.toUpperCase();
    if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF', 'CB_SPECIALIST'].includes(role)) {
        return true;
    }
    return req.user?.employeeId === targetEmployeeId;
};
// 0. GET /me: Lấy thông tin cá nhân của người dùng đang đăng nhập (dành cho Cổng ESS)
router.get('/me', async (req, res) => {
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
        const employee = await db_1.prisma.employee.findUnique({
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
    }
    catch (error) {
        console.error('Error in GET /api/employees/me:', error);
        return res.status(500).json({ error: 'Lỗi server khi lấy thông tin cá nhân' });
    }
});
// 1. Get all employees
router.get('/', async (req, res) => {
    try {
        // Tự động chuyển các hợp đồng đã qua endDate sang EXPIRED
        await db_1.prisma.contract.updateMany({
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
        const employees = await db_1.prisma.employee.findMany({
            include: {
                department: true,
                position: true,
                contracts: { orderBy: { startDate: 'desc' } }
            },
            orderBy: { joinDate: 'desc' }
        });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân viên' });
    }
});
// 1.5 Get employment history
router.get('/history', async (req, res) => {
    try {
        const history = await db_1.prisma.employmentHistory.findMany({
            include: {
                employee: true,
                department: true,
                position: true
            },
            orderBy: { effectiveDate: 'desc' }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử việc làm' });
    }
});
// 2. Add employee (HR Only + Quota Check + Input Validation)
router.post('/', hrOnly, async (req, res) => {
    try {
        const { code, fullName, cccd, email, phone, joinDate, departmentId, positionId } = req.body;
        if (!code?.trim() || !fullName?.trim() || !joinDate) {
            return res.status(400).json({ error: 'Mã nhân viên, Họ và tên và Ngày vào làm không được để trống.' });
        }
        const cleanCode = String(code).trim().toUpperCase();
        const cleanCccd = cccd ? String(cccd).trim() : null;
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        if (cleanCccd && !/^\d{9}(\d{3})?$/.test(cleanCccd)) {
            return res.status(400).json({ error: 'Số CCCD/CMND không hợp lệ (yêu cầu 9 hoặc 12 chữ số).' });
        }
        // Kiểm tra định biên phòng ban
        if (departmentId) {
            const dept = await db_1.prisma.department.findUnique({
                where: { id: departmentId },
                include: { _count: { select: { employees: { where: { status: { not: 'RESIGNED' } } } } } }
            });
            if (dept && dept.quota && dept._count.employees >= dept.quota) {
                return res.status(400).json({
                    error: `Phòng ban "${dept.name}" đã đủ định biên nhân sự (${dept._count.employees}/${dept.quota}). Không thể tuyển thêm!`
                });
            }
        }
        // Kiểm tra trùng lặp
        const existing = await db_1.prisma.employee.findFirst({
            where: {
                OR: [
                    { code: cleanCode },
                    ...(cleanCccd ? [{ cccd: cleanCccd }] : []),
                    ...(cleanEmail ? [{ email: cleanEmail }] : [])
                ]
            }
        });
        if (existing) {
            if (existing.code === cleanCode)
                return res.status(400).json({ error: 'Mã nhân viên đã tồn tại trong hệ thống.' });
            if (cleanCccd && existing.cccd === cleanCccd)
                return res.status(400).json({ error: 'Số CCCD đã tồn tại trong hệ thống.' });
            if (cleanEmail && existing.email === cleanEmail)
                return res.status(400).json({ error: 'Địa chỉ Email đã tồn tại trong hệ thống.' });
        }
        const newEmployee = await db_1.prisma.$transaction(async (tx) => {
            const emp = await tx.employee.create({
                data: {
                    code: cleanCode,
                    fullName: String(fullName).trim(),
                    cccd: cleanCccd,
                    email: cleanEmail,
                    phone: phone ? String(phone).trim() : null,
                    joinDate: new Date(joinDate),
                    departmentId: departmentId || null,
                    positionId: positionId || null,
                    status: 'ACTIVE'
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
    }
    catch (error) {
        console.error('Error adding employee:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Mã nhân viên, CCCD hoặc Email đã tồn tại.' });
        }
        return res.status(500).json({ error: 'Lỗi khi thêm nhân viên' });
    }
});
// 2.5 Get employee details
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Tự động chuyển các hợp đồng đã qua endDate sang EXPIRED
        await db_1.prisma.contract.updateMany({
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
        const employee = await db_1.prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                position: true,
                contracts: { orderBy: { startDate: 'desc' } },
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
                }
            }
        });
        if (!employee)
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        res.json(employee);
    }
    catch (error) {
        console.error('Error in GET /api/employees/:id:', error);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin nhân viên' });
    }
});
// 3. Update employee (HR Only)
router.put('/:id', hrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { code, fullName, cccd, email, phone, gender, dateOfBirth, address, status, joinDate, departmentId, positionId, nationality, maritalStatus, taxCode, bankName, bankAccount, socialInsurance, healthInsurance, emergencyContactName, emergencyContactPhone, emergencyContactRelation } = req.body;
        const cleanCode = code ? String(code).trim().toUpperCase() : undefined;
        const cleanCccd = cccd ? String(cccd).trim() : null;
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        if (cleanCccd && !/^\d{9}(\d{3})?$/.test(cleanCccd)) {
            return res.status(400).json({ error: 'Số CCCD/CMND không hợp lệ (yêu cầu 9 hoặc 12 chữ số).' });
        }
        // Check if code, cccd, or email already exists for another employee
        const orConditions = [];
        if (cleanCode)
            orConditions.push({ code: cleanCode });
        if (cleanCccd)
            orConditions.push({ cccd: cleanCccd });
        if (cleanEmail)
            orConditions.push({ email: cleanEmail });
        if (orConditions.length > 0) {
            const existing = await db_1.prisma.employee.findFirst({
                where: {
                    OR: orConditions,
                    NOT: { id }
                }
            });
            if (existing) {
                if (cleanCode && existing.code === cleanCode)
                    return res.status(400).json({ error: 'Mã nhân viên đã tồn tại ở hồ sơ khác.' });
                if (cleanCccd && existing.cccd === cleanCccd)
                    return res.status(400).json({ error: 'Số CCCD đã tồn tại ở hồ sơ khác.' });
                if (cleanEmail && existing.email === cleanEmail)
                    return res.status(400).json({ error: 'Email đã tồn tại ở hồ sơ khác.' });
            }
        }
        const updatedEmployee = await db_1.prisma.employee.update({
            where: { id },
            data: {
                ...(cleanCode && { code: cleanCode }),
                ...(fullName && { fullName: String(fullName).trim() }),
                cccd: cleanCccd,
                email: cleanEmail,
                phone: phone ? String(phone).trim() : null,
                gender: gender ? gender : null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                address: address ? address : null,
                nationality: nationality ? nationality : null,
                maritalStatus: maritalStatus ? maritalStatus : null,
                taxCode: taxCode ? String(taxCode).trim() : null,
                bankName: bankName ? bankName : null,
                bankAccount: bankAccount ? String(bankAccount).trim() : null,
                socialInsurance: socialInsurance ? socialInsurance : null,
                healthInsurance: healthInsurance ? healthInsurance : null,
                emergencyContactName: emergencyContactName ? emergencyContactName : null,
                emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone : null,
                emergencyContactRelation: emergencyContactRelation ? emergencyContactRelation : null,
                ...(status && { status }),
                joinDate: joinDate ? new Date(joinDate) : undefined,
                departmentId: departmentId || null,
                positionId: positionId || null
            },
            include: {
                department: true,
                position: true
            }
        });
        return res.json(updatedEmployee);
    }
    catch (error) {
        console.error('Error updating employee:', error);
        return res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
    }
});
// 4. Delete employee (HR Only + Delete Constraint BR-CHR-01-03)
router.delete('/:id', hrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const emp = await db_1.prisma.employee.findUnique({
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
        const activeAssets = await db_1.prisma.assetAssignment.count({ where: { employeeId: id } });
        if (activeAssets > 0) {
            return res.status(400).json({ error: 'Không thể xóa nhân viên đang có dữ liệu tài sản/thiết bị chưa giải quyết.' });
        }
        await db_1.prisma.$transaction(async (tx) => {
            await tx.employmentHistory.deleteMany({ where: { employeeId: id } });
            await tx.relative.deleteMany({ where: { employeeId: id } });
            await tx.degree.deleteMany({ where: { employeeId: id } });
            await tx.certificate.deleteMany({ where: { employeeId: id } });
            await tx.onboardingTask.deleteMany({ where: { employeeId: id } });
            await tx.account.deleteMany({ where: { employeeId: id } });
            await tx.employee.delete({ where: { id } });
        });
        return res.json({ message: 'Xóa nhân viên thành công' });
    }
    catch (error) {
        console.error('Error deleting employee:', error);
        return res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
    }
});
// 5. Terminate employee (Thôi việc / Nghỉ việc - SOP-26 / Mẫu F03 - HR Only)
router.post('/:id/terminate', hrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { lastWorkingDate, terminationReason, note } = req.body;
        // Kiểm tra ràng buộc tài sản: Nhân viên còn giữ thiết bị chưa thu hồi thì không cho thôi việc (SOP-26)
        const activeAssets = await db_1.prisma.assetAssignment.count({
            where: { employeeId: id, status: 'ACTIVE' }
        });
        if (activeAssets > 0) {
            return res.status(400).json({
                error: `Không thể hoàn tất thủ tục thôi việc! Nhân viên đang nắm giữ ${activeAssets} tài sản/thiết bị chưa hoàn trả. Vui lòng lập Biên bản thu hồi tài sản BM-02 (SOP-26) trước.`
            });
        }
        const effectiveDate = lastWorkingDate ? new Date(lastWorkingDate) : new Date();
        await db_1.prisma.$transaction(async (tx) => {
            // Lấy thông tin hiện tại
            const currentEmp = await tx.employee.findUnique({ where: { id } });
            if (!currentEmp)
                throw new Error('Không tìm thấy nhân viên');
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
    }
    catch (error) {
        console.error('Error in POST /api/employees/:id/terminate:', error);
        return res.status(400).json({ error: error.message || 'Lỗi khi xử lý thôi việc' });
    }
});
// 5b. Cron Check: Tự động khóa tài khoản nhân sự nghỉ việc lúc 18:00 (SOP-26 Security Check)
router.post('/cron/auto-lock-resigned', hrOnly, async (req, res) => {
    try {
        const resignedWithActiveAccounts = await db_1.prisma.account.findMany({
            where: {
                isActive: true,
                employee: { status: 'RESIGNED' }
            },
            include: { employee: true }
        });
        if (resignedWithActiveAccounts.length > 0) {
            await db_1.prisma.account.updateMany({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Lỗi khi tự động khóa tài khoản thôi việc' });
    }
});
// 6. Transfer employee (Điều chuyển công tác - HR Only + Quota Check)
router.post('/:id/transfer', hrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { departmentId, positionId, changeReason } = req.body;
        if (!departmentId && !positionId) {
            return res.status(400).json({ error: 'Vui lòng chọn phòng ban hoặc vị trí chức danh mới cần điều chuyển.' });
        }
        // Kiểm tra định biên phòng ban đích
        if (departmentId) {
            const currentEmp = await db_1.prisma.employee.findUnique({ where: { id }, select: { departmentId: true } });
            if (currentEmp?.departmentId !== departmentId) {
                const destDept = await db_1.prisma.department.findUnique({
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
        const updated = await db_1.prisma.$transaction(async (tx) => {
            const currentEmp = await tx.employee.findUnique({ where: { id } });
            if (!currentEmp)
                throw new Error('Không tìm thấy nhân viên');
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
    }
    catch (error) {
        console.error('Error in POST /api/employees/:id/transfer:', error);
        return res.status(400).json({ error: error.message || 'Lỗi khi điều chuyển nhân sự' });
    }
});
// ==========================================
// ==========================================
// 7. QUẢN LÝ NGƯỜI PHỤ THUỘC (RELATIVES / DEPENDENTS - THUẾ TNCN)
// ==========================================
// GET /api/employees/:id/relatives
router.get('/:id/relatives', async (req, res) => {
    try {
        const employeeId = req.params.id;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin người thân của nhân viên này.' });
        }
        const relatives = await db_1.prisma.relative.findMany({
            where: { employeeId },
            orderBy: { fullName: 'asc' }
        });
        return res.json(relatives);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi lấy danh sách người thân/người phụ thuộc' });
    }
});
// POST /api/employees/:id/relatives
router.post('/:id/relatives', async (req, res) => {
    try {
        const employeeId = req.params.id;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền thêm người thân cho nhân viên này.' });
        }
        const { fullName, relation, dateOfBirth, taxCode, isDependent } = req.body;
        if (!fullName || !relation) {
            return res.status(400).json({ error: 'Họ tên và mối quan hệ không được để trống' });
        }
        const relative = await db_1.prisma.relative.create({
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
    }
    catch (error) {
        console.error('Error adding relative:', error);
        return res.status(500).json({ error: 'Lỗi khi thêm thông tin người thân/người phụ thuộc' });
    }
});
// PUT /api/employees/:id/relatives/:relativeId
router.put('/:id/relatives/:relativeId', async (req, res) => {
    try {
        const { id: employeeId, relativeId } = req.params;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền sửa thông tin người thân của nhân viên này.' });
        }
        const { fullName, relation, dateOfBirth, taxCode, isDependent } = req.body;
        const updated = await db_1.prisma.relative.update({
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
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi cập nhật thông tin người phụ thuộc' });
    }
});
// DELETE /api/employees/:id/relatives/:relativeId
router.delete('/:id/relatives/:relativeId', async (req, res) => {
    try {
        const { id: employeeId, relativeId } = req.params;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa thông tin người thân của nhân viên này.' });
        }
        await db_1.prisma.relative.delete({ where: { id: relativeId } });
        return res.json({ message: 'Đã xóa người thân/người phụ thuộc thành công' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa người phụ thuộc' });
    }
});
// ==========================================
// 8. QUẢN LÝ BẰNG CẤP & HỌC VẤN (DEGREES)
// ==========================================
// GET /api/employees/:id/degrees
router.get('/:id/degrees', async (req, res) => {
    try {
        const employeeId = req.params.id;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền xem bằng cấp của nhân viên này.' });
        }
        const degrees = await db_1.prisma.degree.findMany({
            where: { employeeId },
            orderBy: { gradYear: 'desc' }
        });
        return res.json(degrees);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi lấy danh sách bằng cấp' });
    }
});
// POST /api/employees/:id/degrees
router.post('/:id/degrees', async (req, res) => {
    try {
        const employeeId = req.params.id;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền thêm bằng cấp cho nhân viên này.' });
        }
        const { degreeName, major, institution, gradYear } = req.body;
        if (!degreeName || !major || !institution) {
            return res.status(400).json({ error: 'Tên bằng cấp, chuyên ngành và trường đào tạo không được để trống' });
        }
        const degree = await db_1.prisma.degree.create({
            data: {
                employeeId,
                degreeName: String(degreeName).trim(),
                major: String(major).trim(),
                institution: String(institution).trim(),
                gradYear: gradYear ? parseInt(String(gradYear)) : null
            }
        });
        return res.status(201).json(degree);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi thêm bằng cấp' });
    }
});
// DELETE /api/employees/:id/degrees/:degreeId
router.delete('/:id/degrees/:degreeId', async (req, res) => {
    try {
        const { id: employeeId, degreeId } = req.params;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa bằng cấp của nhân viên này.' });
        }
        await db_1.prisma.degree.delete({ where: { id: degreeId } });
        return res.json({ message: 'Đã xóa bằng cấp thành công' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa bằng cấp' });
    }
});
// ==========================================
// 9. QUẢN LÝ CHỨNG CHỈ NGHỀ NGHIỆP (CERTIFICATES)
// ==========================================
// GET /api/employees/:id/certificates
router.get('/:id/certificates', async (req, res) => {
    try {
        const employeeId = req.params.id;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền xem chứng chỉ của nhân viên này.' });
        }
        const certificates = await db_1.prisma.certificate.findMany({
            where: { employeeId },
            orderBy: { issueDate: 'desc' }
        });
        return res.json(certificates);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi lấy danh sách chứng chỉ' });
    }
});
// POST /api/employees/:id/certificates
router.post('/:id/certificates', async (req, res) => {
    try {
        const employeeId = req.params.id;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền thêm chứng chỉ cho nhân viên này.' });
        }
        const { name, issuedBy, issueDate, expiryDate } = req.body;
        if (!name || !issuedBy) {
            return res.status(400).json({ error: 'Tên chứng chỉ và đơn vị cấp không được để trống' });
        }
        const certificate = await db_1.prisma.certificate.create({
            data: {
                employeeId,
                name: String(name).trim(),
                issuedBy: String(issuedBy).trim(),
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        });
        return res.status(201).json(certificate);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi thêm chứng chỉ' });
    }
});
// DELETE /api/employees/:id/certificates/:certId
router.delete('/:id/certificates/:certId', async (req, res) => {
    try {
        const { id: employeeId, certId } = req.params;
        if (!canManageOrSelf(req, employeeId)) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa chứng chỉ của nhân viên này.' });
        }
        await db_1.prisma.certificate.delete({ where: { id: certId } });
        return res.json({ message: 'Đã xóa chứng chỉ thành công' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa chứng chỉ' });
    }
});
exports.default = router;
