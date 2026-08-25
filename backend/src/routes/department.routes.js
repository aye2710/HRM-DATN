"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET: Lấy danh sách phòng ban
router.get('/', async (req, res) => {
    try {
        const departments = await db_1.prisma.department.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { code: 'asc' }
        });
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách phòng ban' });
    }
});
// POST: Thêm phòng ban mới
router.post('/', async (req, res) => {
    try {
        const { code, name, managerName, quota, status, parentId } = req.body;
        const existing = await db_1.prisma.department.findUnique({ where: { code } });
        if (existing) {
            return res.status(400).json({ error: 'Mã phòng ban đã tồn tại' });
        }
        const newDept = await db_1.prisma.department.create({
            data: {
                code: code,
                name: name,
                managerName: managerName,
                quota: quota ? parseInt(quota) : 15,
                status: status || 'ACTIVE',
                parentId: parentId ? parentId : null
            }
        });
        res.status(201).json(newDept);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm phòng ban' });
    }
});
// PUT: Cập nhật phòng ban
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { code, name, managerName, quota, status, parentId } = req.body;
        const updatedDept = await db_1.prisma.department.update({
            where: { id },
            data: {
                code: code,
                name: name,
                managerName: managerName,
                quota: quota ? parseInt(quota) : 15,
                status: status || 'ACTIVE',
                parentId: parentId === '' ? null : (parentId ? parentId : undefined)
            }
        });
        res.json(updatedDept);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật phòng ban' });
    }
});
// DELETE: Xóa phòng ban
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const employeeCount = await db_1.prisma.employee.count({ where: { departmentId: id } });
        if (employeeCount > 0) {
            return res.status(400).json({ error: 'Không thể xóa phòng ban đang có nhân viên' });
        }
        await db_1.prisma.department.delete({ where: { id } });
        res.json({ message: 'Xóa phòng ban thành công' });
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa phòng ban' });
    }
});
exports.default = router;
