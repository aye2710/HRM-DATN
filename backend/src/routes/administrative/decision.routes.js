"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_1 = require("../../utils/audit");
const router = (0, express_1.Router)();
// Áp dụng xác thực danh tính cho toàn bộ phân hệ Quyết định Nhân sự
router.use(auth_middleware_1.authenticateToken);
const hrManagerOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');
// 1. GET: Danh sách Quyết định Nhân sự (Chống IDOR: Nhân viên chỉ xem quyết định của bản thân)
router.get('/', async (req, res) => {
    try {
        const { type, status } = req.query;
        let employeeId = req.query.employeeId;
        const userRole = req.user?.role?.toUpperCase();
        // Chặn IDOR: Nhân viên thông thường chỉ được xem các quyết định áp dụng cho chính mình
        if (userRole === 'EMPLOYEE') {
            employeeId = req.user.employeeId;
        }
        let whereClause = {};
        if (type)
            whereClause.type = type;
        if (status)
            whereClause.status = status;
        if (employeeId)
            whereClause.employeeId = employeeId;
        const decisions = await db_1.prisma.decision.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: { id: true, fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
                },
                newDepartment: { select: { id: true, name: true } },
                newPosition: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(decisions);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách quyết định nhân sự' });
    }
});
// 2. GET: Chi tiết 1 Quyết định (Chống IDOR)
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const userRole = req.user?.role?.toUpperCase();
        const decision = await db_1.prisma.decision.findUnique({
            where: { id },
            include: {
                employee: {
                    include: { department: true, position: true, contracts: { where: { status: 'ACTIVE' } } }
                },
                newDepartment: true,
                newPosition: true
            }
        });
        if (!decision)
            return res.status(404).json({ error: 'Không tìm thấy quyết định' });
        // Chặn IDOR: Nhân viên chỉ xem được quyết định của chính mình
        if (userRole === 'EMPLOYEE' && decision.employeeId !== req.user?.employeeId) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin quyết định này.' });
        }
        return res.json(decision);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy thông tin quyết định' });
    }
});
// 3. POST: Khởi tạo Quyết định Nhân sự mới (HR Manager / Admin Only)
router.post('/', hrManagerOnly, async (req, res) => {
    try {
        const { decisionNumber, title, type, employeeId, oldSalary, newSalary, oldDepartmentId, newDepartmentId, oldPositionId, newPositionId, reason, effectiveDate, signBy } = req.body;
        if (!title?.trim() || !type || !employeeId) {
            return res.status(400).json({ error: 'Vui lòng điền đủ Tiêu đề, Loại quyết định và Nhân sự áp dụng' });
        }
        // Tự sinh số quyết định nếu không nhập (VD: QĐ-2026/001/LLA)
        let finalDecNumber = decisionNumber ? String(decisionNumber).trim().toUpperCase() : null;
        if (!finalDecNumber) {
            const year = new Date().getFullYear();
            const count = await db_1.prisma.decision.count();
            finalDecNumber = `QĐ-${year}/${String(count + 1).padStart(3, '0')}/LLA`;
        }
        // Lấy thông tin hiện tại của nhân sự để lưu snapshot
        const emp = await db_1.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { contracts: { where: { status: 'ACTIVE' } } }
        });
        if (!emp)
            return res.status(404).json({ error: 'Nhân sự không tồn tại' });
        if (emp.status === 'RESIGNED') {
            return res.status(400).json({ error: 'Không thể ban hành quyết định mới cho nhân sự đã thôi việc (RESIGNED)!' });
        }
        const currentSalary = emp.contracts[0]?.baseSalary || 0;
        const currentDeptId = emp.departmentId || null;
        const currentPosId = emp.positionId || null;
        const newDecision = await db_1.prisma.decision.create({
            data: {
                decisionNumber: finalDecNumber,
                title: String(title).trim(),
                type,
                employeeId,
                oldSalary: oldSalary !== undefined ? oldSalary : currentSalary,
                newSalary: newSalary !== undefined ? newSalary : null,
                oldDepartmentId: oldDepartmentId || currentDeptId,
                newDepartmentId: newDepartmentId || null,
                oldPositionId: oldPositionId || currentPosId,
                newPositionId: newPositionId || null,
                reason: reason ? String(reason).trim() : '',
                effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
                status: 'PENDING',
                signBy: signBy ? String(signBy).trim() : 'Ban Giám Đốc'
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'CREATE_DECISION',
            tableName: 'Decision',
            recordId: newDecision.id,
            accountId: req.user?.accountId,
            details: `Khởi tạo quyết định nhân sự: [${newDecision.decisionNumber}] ${newDecision.title} cho nhân sự ${emp.fullName}`
        });
        return res.status(201).json(newDecision);
    }
    catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Số quyết định đã tồn tại, vui lòng chọn số khác!' });
        }
        return res.status(500).json({ error: 'Lỗi khi tạo quyết định nhân sự' });
    }
});
// 4. PUT: Phê duyệt & Ban hành Quyết định (HR Manager / Admin Only)
// Tự động kiểm tra thu hồi tài sản khi thôi việc, đồng bộ Hồ sơ, Hợp đồng & Lịch sử
router.put('/:id/approve', hrManagerOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { signBy } = req.body;
        const result = await db_1.prisma.$transaction(async (tx) => {
            const decision = await tx.decision.findUnique({
                where: { id },
                include: { employee: true }
            });
            if (!decision)
                throw new Error('Không tìm thấy quyết định');
            if (decision.status === 'APPROVED') {
                throw new Error('Quyết định này đã được phê duyệt và ban hành trước đó!');
            }
            const empId = decision.employeeId;
            const effDate = decision.effectiveDate || new Date();
            // Kiểm soát thu hồi tài sản trước khi cho thôi việc
            if (decision.type === 'TERMINATION') {
                const activeAssets = await tx.assetAssignment.count({
                    where: { employeeId: empId, status: 'ACTIVE' }
                });
                if (activeAssets > 0) {
                    throw new Error(`Không thể phê duyệt quyết định thôi việc! Nhân viên đang nắm giữ ${activeAssets} tài sản/thiết bị chưa hoàn trả. Vui lòng làm thủ tục thu hồi tài sản trước.`);
                }
            }
            const updatedDecision = await tx.decision.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    signDate: new Date(),
                    signBy: signBy || decision.signBy || 'Ban Giám Đốc'
                }
            });
            // Áp dụng biến động nghiệp vụ theo loại quyết định:
            // A. ĐIỀU CHỈNH LƯƠNG
            if (decision.type === 'SALARY_ADJUSTMENT' && decision.newSalary) {
                const activeContract = await tx.contract.findFirst({
                    where: { employeeId: empId, status: 'ACTIVE' }
                });
                if (activeContract) {
                    await tx.contract.update({
                        where: { id: activeContract.id },
                        data: { baseSalary: decision.newSalary }
                    });
                }
                await tx.employmentHistory.create({
                    data: {
                        employeeId: empId,
                        departmentId: decision.oldDepartmentId || undefined,
                        positionId: decision.oldPositionId || undefined,
                        changeReason: `Điều chỉnh lương theo ${decision.decisionNumber}: ${Number(decision.oldSalary || 0).toLocaleString()} ➔ ${Number(decision.newSalary).toLocaleString()} VNĐ`,
                        salary: decision.newSalary,
                        effectiveDate: effDate
                    }
                });
            }
            // B. BỔ NHIỆM / THĂNG CHỨC
            if (decision.type === 'PROMOTION' && decision.newPositionId) {
                await tx.employee.update({
                    where: { id: empId },
                    data: { positionId: decision.newPositionId }
                });
                await tx.employmentHistory.create({
                    data: {
                        employeeId: empId,
                        departmentId: decision.newDepartmentId || decision.oldDepartmentId || undefined,
                        positionId: decision.newPositionId,
                        changeReason: `Bổ nhiệm chức vụ mới theo ${decision.decisionNumber}`,
                        effectiveDate: effDate
                    }
                });
            }
            // C. ĐIỀU CHUYỂN PHÒNG BAN
            if (decision.type === 'TRANSFER' && decision.newDepartmentId) {
                await tx.employee.update({
                    where: { id: empId },
                    data: {
                        departmentId: decision.newDepartmentId,
                        positionId: decision.newPositionId || undefined
                    }
                });
                await tx.employmentHistory.create({
                    data: {
                        employeeId: empId,
                        departmentId: decision.newDepartmentId,
                        positionId: decision.newPositionId || decision.oldPositionId || undefined,
                        changeReason: `Điều chuyển đơn vị công tác theo ${decision.decisionNumber}`,
                        effectiveDate: effDate
                    }
                });
            }
            // D. THÔI VIỆC / CHẤM DỨT HỢP ĐỒNG
            if (decision.type === 'TERMINATION') {
                // Cập nhật trạng thái nhân sự thành RESIGNED
                await tx.employee.update({
                    where: { id: empId },
                    data: { status: 'RESIGNED' }
                });
                // Khóa tài khoản đăng nhập hệ thống của nhân sự
                await tx.account.updateMany({
                    where: { employeeId: empId },
                    data: { isActive: false }
                });
                // Chấm dứt các hợp đồng lao động đang hiệu lực
                await tx.contract.updateMany({
                    where: { employeeId: empId, status: 'ACTIVE' },
                    data: { status: 'TERMINATED', endDate: effDate }
                });
                await tx.employmentHistory.create({
                    data: {
                        employeeId: empId,
                        changeReason: `Thôi việc theo quyết định ${decision.decisionNumber}`,
                        effectiveDate: effDate
                    }
                });
            }
            // E. KHEN THƯỞNG / KỶ LUẬT
            if (decision.type === 'REWARD' || decision.type === 'DISCIPLINE') {
                await tx.employmentHistory.create({
                    data: {
                        employeeId: empId,
                        changeReason: `${decision.type === 'REWARD' ? 'Khen thưởng' : 'Kỷ luật'}: ${decision.title} (${decision.decisionNumber})`,
                        effectiveDate: effDate
                    }
                });
            }
            return { updatedDecision, decNumber: decision.decisionNumber, decType: decision.type, empName: decision.employee?.fullName };
        });
        await (0, audit_1.createAuditLog)({
            action: 'APPROVE_DECISION',
            tableName: 'Decision',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Phê duyệt và ban hành quyết định [${result.decNumber} - ${result.decType}] cho nhân sự ${result.empName}`
        });
        return res.json({
            message: `Đã phê duyệt và ban hành quyết định ${result.decNumber} thành công! Hồ sơ nhân sự, hợp đồng và tài khoản đã được tự động đồng bộ.`,
            decision: result.updatedDecision
        });
    }
    catch (error) {
        console.error('Error approving decision:', error);
        return res.status(400).json({ error: error.message || 'Lỗi khi phê duyệt quyết định' });
    }
});
// 5. PUT: Từ chối / Hủy quyết định (HR Manager / Admin Only)
router.put('/:id/reject', hrManagerOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { reason } = req.body;
        const existing = await db_1.prisma.decision.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy quyết định' });
        }
        if (existing.status === 'APPROVED') {
            return res.status(400).json({ error: 'Không thể từ chối quyết định đã được phê duyệt và ban hành!' });
        }
        const updated = await db_1.prisma.decision.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reason: reason ? `[TỪ CHỐI]: ${reason}` : undefined
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'REJECT_DECISION',
            tableName: 'Decision',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Từ chối quyết định ${existing.decisionNumber}. Lý do: ${reason || 'Không'}`
        });
        return res.json({ message: 'Đã từ chối quyết định', decision: updated });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi từ chối quyết định' });
    }
});
// 6. DELETE: Xóa quyết định nháp (HR Manager / Admin Only - Chặn xóa quyết định đã ban hành)
router.delete('/:id', hrManagerOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const dec = await db_1.prisma.decision.findUnique({ where: { id } });
        if (!dec)
            return res.status(404).json({ error: 'Không tìm thấy quyết định' });
        if (dec.status === 'APPROVED') {
            return res.status(400).json({ error: 'Không thể xóa quyết định đã được ban hành!' });
        }
        await db_1.prisma.decision.delete({ where: { id } });
        await (0, audit_1.createAuditLog)({
            action: 'DELETE_DECISION',
            tableName: 'Decision',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Xóa quyết định ${dec.decisionNumber}`
        });
        return res.json({ message: 'Đã xóa quyết định thành công' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa quyết định' });
    }
});
exports.default = router;
