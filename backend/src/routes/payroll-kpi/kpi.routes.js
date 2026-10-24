"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_1 = require("../../utils/audit");
const router = (0, express_1.Router)();
const hrOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');
const managerOrHr = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');
// ==========================================
// 1. ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE REVIEW)
// ==========================================
// Lấy danh sách kỳ đánh giá & các bài đánh giá (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem của mình)
router.get('/reviews', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userRole = req.user?.role?.toUpperCase();
        const where = {};
        if (userRole === 'EMPLOYEE') {
            where.employeeId = req.user.employeeId;
        }
        const reviews = await db_1.prisma.performanceReview.findMany({
            where,
            include: {
                employee: {
                    select: { fullName: true, code: true, department: { select: { name: true } } }
                },
                reviewCycle: true
            },
            orderBy: { id: 'desc' }
        });
        // Tính toán phân loại Curve (A, B, C)
        const formatted = reviews.map(r => {
            const scoreNum = Number(r.score);
            let finalGrade = 'C';
            if (scoreNum >= 90)
                finalGrade = 'A';
            else if (scoreNum >= 70)
                finalGrade = 'B';
            return {
                id: r.id,
                empId: r.employee.code,
                name: r.employee.fullName,
                department: r.employee.department?.name || 'Không xác định',
                selfScore: scoreNum,
                managerScore: scoreNum,
                finalGrade,
                note: r.comments || '',
                cycleName: r.reviewCycle?.name || 'Kỳ đánh giá'
            };
        });
        return res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu đánh giá' });
    }
});
// Lấy danh sách KPI & Đánh giá của 1 nhân viên cụ thể (Cổng ESS - Chặn IDOR)
router.get('/employee/:employeeId', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const userRole = req.user?.role?.toUpperCase();
        if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin đánh giá KPI của nhân viên khác.' });
        }
        const [kpis, reviews] = await Promise.all([
            db_1.prisma.kPI.findMany({
                where: { employeeId },
                orderBy: { id: 'desc' }
            }),
            db_1.prisma.performanceReview.findMany({
                where: { employeeId },
                include: { reviewCycle: true },
                orderBy: { id: 'desc' }
            })
        ]);
        const formattedKpis = kpis.map((k) => {
            const targetVal = Number(k.target || 100);
            const achievedVal = Number(k.achieved || 0);
            const progress = targetVal > 0 ? Math.min(100, Math.round((achievedVal / targetVal) * 100)) : 0;
            return {
                id: k.id,
                title: k.description,
                target: `Chỉ tiêu: ${targetVal}`,
                weight: 25,
                progress,
                selfScore: (progress / 10).toFixed(1),
                status: progress >= 90 ? 'EXCELLENT' : (progress >= 70 ? 'ON_TRACK' : 'NEEDS_ATTENTION'),
                comment: `Đạt ${achievedVal}/${targetVal}`
            };
        });
        return res.json({
            kpis: formattedKpis,
            reviews
        });
    }
    catch (error) {
        console.error('Error fetching employee KPI:', error);
        return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu KPI cá nhân' });
    }
});
// Chấm điểm và cập nhật phiếu đánh giá (Quản lý / HR, Chống tự chấm điểm)
router.put('/reviews/:id', auth_middleware_1.authenticateToken, managerOrHr, async (req, res) => {
    try {
        const id = req.params.id;
        const { score, comments } = req.body;
        if (score === undefined || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100) {
            return res.status(400).json({ error: 'Điểm đánh giá phải là số từ 0 đến 100.' });
        }
        const review = await db_1.prisma.performanceReview.findUnique({
            where: { id },
            include: { reviewCycle: true, employee: { select: { fullName: true } } }
        });
        if (!review) {
            return res.status(404).json({ error: 'Không tìm thấy phiếu đánh giá' });
        }
        // Chống tự chấm điểm phiếu đánh giá của chính mình
        if (req.user?.employeeId && review.employeeId === req.user.employeeId) {
            return res.status(403).json({ error: 'Quản lý không thể tự chấm điểm đánh giá hiệu suất của chính mình.' });
        }
        // Kiểm tra thời hạn chấm điểm
        const today = new Date();
        const endDate = new Date(review.reviewCycle.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (today > endDate) {
            return res.status(400).json({
                error: 'Đã quá hạn chót để chấm điểm cho kỳ đánh giá này.'
            });
        }
        const updatedReview = await db_1.prisma.performanceReview.update({
            where: { id },
            data: {
                score: Number(score),
                comments: comments ? String(comments).trim() : null
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'UPDATE_PERFORMANCE_REVIEW',
            tableName: 'PerformanceReview',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Chấm điểm KPI nhân viên ${review.employee.fullName}: ${score} điểm. Nhận xét: ${comments || 'Không'}`
        });
        return res.json(updatedReview);
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi khi cập nhật phiếu đánh giá' });
    }
});
// ==========================================
// 2. KỲ ĐÁNH GIÁ (REVIEW CYCLES)
// ==========================================
// Tạo kỳ đánh giá mới (HR Manager Only)
router.post('/cycles', auth_middleware_1.authenticateToken, hrOnly, async (req, res) => {
    try {
        const { name, startDate, endDate } = req.body;
        if (!name?.trim() || !startDate || !endDate) {
            return res.status(400).json({ error: 'Vui lòng nhập tên kỳ và ngày bắt đầu/kết thúc' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return res.status(400).json({ error: 'Ngày bắt đầu kỳ đánh giá không thể sau ngày kết thúc.' });
        }
        const cycle = await db_1.prisma.reviewCycle.create({
            data: {
                name: String(name).trim(),
                startDate: start,
                endDate: end
            }
        });
        // Tự động tạo PerformanceReview (nháp) cho toàn bộ nhân sự ACTIVE
        const employees = await db_1.prisma.employee.findMany({ where: { status: 'ACTIVE' } });
        for (const emp of employees) {
            await db_1.prisma.performanceReview.create({
                data: {
                    employeeId: emp.id,
                    reviewCycleId: cycle.id,
                    score: 0,
                    comments: 'Đang đánh giá...'
                }
            });
        }
        await (0, audit_1.createAuditLog)({
            action: 'CREATE_REVIEW_CYCLE',
            tableName: 'ReviewCycle',
            recordId: cycle.id,
            accountId: req.user?.accountId,
            details: `Mở kỳ đánh giá mới: "${cycle.name}" cho ${employees.length} nhân sự.`
        });
        return res.status(201).json({ message: 'Đã mở kỳ đánh giá mới và khởi tạo dữ liệu cho nhân sự', cycle });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi tạo kỳ đánh giá' });
    }
});
// ==========================================
// 3. MẪU ĐÁNH GIÁ (KPI TEMPLATES)
// ==========================================
// Lấy danh sách mẫu KPI
router.get('/templates', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const templates = await db_1.prisma.kPITemplate.findMany({
            orderBy: { id: 'desc' }
        });
        return res.json(templates);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy mẫu KPI' });
    }
});
// Tạo mẫu KPI mới (HR Manager Only)
router.post('/templates', auth_middleware_1.authenticateToken, hrOnly, async (req, res) => {
    try {
        const { name, department, criteria, weight, status } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: 'Tên mẫu KPI không được để trống.' });
        }
        const newTemplate = await db_1.prisma.kPITemplate.create({
            data: {
                name: String(name).trim(),
                department: department ? String(department).trim() : 'Toàn công ty',
                criteria: Number(criteria) || 1,
                weight: weight || '25%',
                status: status || 'Active'
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'CREATE_KPI_TEMPLATE',
            tableName: 'KPITemplate',
            recordId: newTemplate.id,
            accountId: req.user?.accountId,
            details: `Tạo mẫu KPI: "${newTemplate.name}"`
        });
        return res.status(201).json(newTemplate);
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi khi tạo mẫu KPI' });
    }
});
// Xóa mẫu KPI (HR Manager Only)
router.delete('/templates/:id', auth_middleware_1.authenticateToken, hrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const template = await db_1.prisma.kPITemplate.findUnique({ where: { id } });
        if (!template) {
            return res.status(404).json({ error: 'Không tìm thấy mẫu KPI để xóa.' });
        }
        await db_1.prisma.kPITemplate.delete({ where: { id } });
        await (0, audit_1.createAuditLog)({
            action: 'DELETE_KPI_TEMPLATE',
            tableName: 'KPITemplate',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Xóa mẫu KPI: "${template.name}"`
        });
        return res.json({ message: 'Đã xóa mẫu KPI' });
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi khi xóa mẫu KPI' });
    }
});
// ==========================================
// 4. QUẢN LÝ MỤC TIÊU CÁ NHÂN (KPI)
// ==========================================
// Lấy danh sách KPI (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem KPI của mình)
router.get('/kpi', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userRole = req.user?.role?.toUpperCase();
        const where = {};
        if (userRole === 'EMPLOYEE') {
            where.employeeId = req.user.employeeId;
        }
        const kpis = await db_1.prisma.kPI.findMany({
            where,
            include: {
                employee: {
                    select: { fullName: true, code: true }
                }
            },
            orderBy: { id: 'desc' }
        });
        return res.json(kpis);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách KPI' });
    }
});
// Gán KPI mới cho nhân viên (Quản lý / HR Only)
router.post('/kpi', auth_middleware_1.authenticateToken, managerOrHr, async (req, res) => {
    try {
        const { employeeId, description, target } = req.body;
        if (!employeeId || !description?.trim() || target === undefined) {
            return res.status(400).json({ error: 'Thiếu thông tin gán KPI bắt buộc (nhân viên, mô tả, chỉ tiêu)' });
        }
        const newKpi = await db_1.prisma.kPI.create({
            data: {
                employeeId,
                description: String(description).trim(),
                target: Number(target),
                achieved: 0
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'ASSIGN_KPI',
            tableName: 'KPI',
            recordId: newKpi.id,
            accountId: req.user?.accountId,
            details: `Gán KPI "${newKpi.description}" (Chỉ tiêu: ${target}) cho nhân viên ${employeeId}`
        });
        return res.status(201).json(newKpi);
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi khi gán KPI mới' });
    }
});
// Cập nhật tiến độ KPI (achieved)
router.put('/kpi/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { achieved, description, target } = req.body;
        const userRole = req.user?.role?.toUpperCase();
        const existingKpi = await db_1.prisma.kPI.findUnique({ where: { id } });
        if (!existingKpi) {
            return res.status(404).json({ error: 'Không tìm thấy mục tiêu KPI.' });
        }
        // Nếu là nhân viên, chỉ được cập nhật tiến độ (achieved) trên KPI của chính mình
        if (userRole === 'EMPLOYEE') {
            if (existingKpi.employeeId !== req.user?.employeeId) {
                return res.status(403).json({ error: 'Bạn không có quyền cập nhật tiến độ KPI của người khác.' });
            }
            if (description !== undefined || target !== undefined) {
                return res.status(403).json({ error: 'Chỉ Quản lý hoặc HR mới có quyền điều chỉnh mô tả hoặc chỉ tiêu KPI.' });
            }
        }
        const updatedKpi = await db_1.prisma.kPI.update({
            where: { id },
            data: {
                ...(achieved !== undefined && { achieved: Number(achieved) }),
                ...(userRole !== 'EMPLOYEE' && description !== undefined && { description: String(description).trim() }),
                ...(userRole !== 'EMPLOYEE' && target !== undefined && { target: Number(target) })
            }
        });
        return res.json(updatedKpi);
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi khi cập nhật KPI' });
    }
});
// Xóa KPI (Quản lý / HR Only)
router.delete('/kpi/:id', auth_middleware_1.authenticateToken, managerOrHr, async (req, res) => {
    try {
        const id = req.params.id;
        const existingKpi = await db_1.prisma.kPI.findUnique({ where: { id } });
        if (!existingKpi) {
            return res.status(404).json({ error: 'Không tìm thấy mục tiêu KPI để xóa.' });
        }
        await db_1.prisma.kPI.delete({ where: { id } });
        await (0, audit_1.createAuditLog)({
            action: 'DELETE_KPI',
            tableName: 'KPI',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Xóa KPI "${existingKpi.description}"`
        });
        return res.json({ message: 'Đã xóa KPI thành công' });
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi khi xóa KPI' });
    }
});
exports.default = router;
