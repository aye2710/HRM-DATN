"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_1 = require("../../utils/audit");
const router = (0, express_1.Router)();
// Áp dụng xác thực cho toàn bộ phân hệ Ngày lễ
router.use(auth_middleware_1.authenticateToken);
const hrOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF');
// 1. Lấy danh sách ngày lễ (Toàn bộ nhân viên xem được để theo dõi lịch nghỉ)
router.get('/', async (req, res) => {
    try {
        const holidays = await db_1.prisma.holiday.findMany({
            orderBy: { date: 'asc' }
        });
        res.json(holidays);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách ngày lễ' });
    }
});
// 2. Thêm ngày lễ (Chỉ HR / Admin)
router.post('/', hrOnly, async (req, res) => {
    try {
        const { name, date } = req.body;
        if (!name?.trim() || !date) {
            return res.status(400).json({ error: 'Tên ngày lễ và ngày áp dụng không được để trống.' });
        }
        const holidayDate = new Date(date);
        holidayDate.setHours(0, 0, 0, 0);
        const existing = await db_1.prisma.holiday.findFirst({
            where: { date: holidayDate }
        });
        if (existing) {
            return res.status(400).json({ error: `Đã tồn tại ngày nghỉ lễ "${existing.name}" vào ngày này.` });
        }
        const holiday = await db_1.prisma.holiday.create({
            data: { name: name.trim(), date: holidayDate }
        });
        await (0, audit_1.createAuditLog)({
            action: 'CREATE_HOLIDAY',
            tableName: 'Holiday',
            recordId: holiday.id,
            accountId: req.user?.accountId,
            details: `Khai báo ngày nghỉ lễ "${holiday.name}" ngày ${date} (Điều 112 BLLĐ 2019)`
        });
        return res.status(201).json(holiday);
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi thêm ngày lễ' });
    }
});
// 3. Xóa ngày lễ (Chỉ HR / Admin)
router.delete('/:id', hrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const holiday = await db_1.prisma.holiday.findUnique({ where: { id } });
        if (!holiday) {
            return res.status(404).json({ error: 'Không tìm thấy ngày lễ để xóa.' });
        }
        await db_1.prisma.holiday.delete({ where: { id } });
        await (0, audit_1.createAuditLog)({
            action: 'DELETE_HOLIDAY',
            tableName: 'Holiday',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Xóa ngày nghỉ lễ "${holiday.name}"`
        });
        return res.json({ message: 'Xóa thành công' });
    }
    catch (error) {
        return res.status(400).json({ error: 'Lỗi xóa ngày lễ' });
    }
});
exports.default = router;
