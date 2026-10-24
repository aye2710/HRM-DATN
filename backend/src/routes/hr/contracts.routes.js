"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Áp dụng xác thực cho toàn bộ phân hệ Quản lý Hợp đồng lao động
router.use(auth_middleware_1.authenticateToken);
const cbOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'CB_SPECIALIST', 'HR_STAFF');
// GET: Lấy danh sách Hợp đồng
router.get('/', async (req, res) => {
    try {
        // Tự động chuyển các hợp đồng đã hết hạn (endDate < hiện tại) sang EXPIRED
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
        const contracts = await db_1.prisma.contract.findMany({
            include: {
                employee: {
                    select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
                }
            },
            orderBy: { startDate: 'desc' }
        });
        res.json(contracts);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách hợp đồng' });
    }
});
// POST: Tạo Hợp đồng mới (CB/HR Only + Ràng buộc BLLĐ 2019)
router.post('/', cbOnly, async (req, res) => {
    try {
        const { employeeId, contractType, baseSalary, startDate, endDate, evaluationResult, fileUrl } = req.body;
        if (!employeeId || !contractType || !baseSalary || !startDate) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ: Nhân viên, loại hợp đồng, lương cơ bản và ngày bắt đầu.' });
        }
        const emp = await db_1.prisma.employee.findUnique({ where: { id: employeeId } });
        if (!emp) {
            return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân sự để ký hợp đồng.' });
        }
        if (emp.status === 'RESIGNED') {
            return res.status(400).json({ error: 'Không thể tạo hợp đồng mới cho nhân viên đã thôi việc (RESIGNED).' });
        }
        const start = new Date(startDate);
        let end = endDate ? new Date(endDate) : null;
        if (contractType === 'INDEFINITE') {
            end = null; // Hợp đồng không xác định thời hạn không có endDate
        }
        else if (end && end < start) {
            return res.status(400).json({ error: 'Ngày kết thúc hợp đồng không thể trước ngày bắt đầu.' });
        }
        // Tuân thủ Điều 27 Bộ luật Lao động 2019: Thời hạn thử việc tối đa không quá 60 ngày
        if (contractType === 'PROBATION') {
            if (!end) {
                return res.status(400).json({ error: 'Hợp đồng thử việc bắt buộc phải có ngày kết thúc (Điều 27 BLLĐ 2019).' });
            }
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 60) {
                return res.status(400).json({
                    error: `Thời gian thử việc không được vượt quá 60 ngày theo Điều 27 Bộ luật Lao động 2019 (Hiện tại: ${diffDays} ngày).`
                });
            }
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const contractStart = new Date(startDate);
        contractStart.setHours(0, 0, 0, 0);
        const result = await db_1.prisma.$transaction(async (tx) => {
            // Quy tắc BR-CHR-02-01 (Tính độc quyền hiệu lực):
            // Chỉ chuyển hợp đồng cũ sang EXPIRED nếu hợp đồng mới đã đến ngày hiệu lực (startDate <= now)
            if (contractStart <= now) {
                await tx.contract.updateMany({
                    where: {
                        employeeId,
                        status: 'ACTIVE'
                    },
                    data: {
                        status: 'EXPIRED'
                    }
                });
            }
            // Tạo hợp đồng mới
            const newContract = await tx.contract.create({
                data: {
                    employeeId,
                    contractType,
                    baseSalary: Number(baseSalary),
                    startDate: start,
                    endDate: end,
                    fileUrl: fileUrl || null,
                    status: 'ACTIVE'
                }
            });
            // Xử lý Đánh giá Thử việc: Cập nhật Trạng thái Nhân viên
            let updatedEmployee = null;
            if (evaluationResult === 'PASSED') {
                if (contractType === 'OFFICIAL_1Y' || contractType === 'INDEFINITE') {
                    updatedEmployee = await tx.employee.update({
                        where: { id: employeeId },
                        data: { status: 'ACTIVE' }
                    });
                }
            }
            else if (evaluationResult === 'FAILED') {
                // Thử việc không đạt -> Chuyển nhân viên sang RESIGNED
                updatedEmployee = await tx.employee.update({
                    where: { id: employeeId },
                    data: { status: 'RESIGNED' }
                });
            }
            return { contract: newContract, employee: updatedEmployee };
        });
        return res.status(201).json(result);
    }
    catch (error) {
        console.error("Create Contract Error:", error);
        return res.status(500).json({ error: 'Lỗi khi tạo hợp đồng mới' });
    }
});
// PATCH: Cập nhật thông tin / tải ảnh hợp đồng đã ký (CB/HR Only)
router.patch('/:id', cbOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { fileUrl, status, contractType, baseSalary, startDate, endDate } = req.body;
        const updated = await db_1.prisma.contract.update({
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
    }
    catch (error) {
        console.error("Update Contract Error:", error);
        return res.status(500).json({ error: 'Lỗi khi cập nhật hợp đồng' });
    }
});
// DELETE: Xóa Hợp đồng (CB/HR Only)
router.delete('/:id', cbOnly, async (req, res) => {
    try {
        const id = req.params.id;
        await db_1.prisma.contract.delete({ where: { id } });
        return res.json({ message: 'Xóa hợp đồng thành công' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa hợp đồng' });
    }
});
exports.default = router;
