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
        const newQuota = quota ? parseInt(quota) : 15;
        // Validate Parent Quota (Top-Down Quota logic)
        if (parentId) {
            const parent = await db_1.prisma.department.findUnique({
                where: { id: parentId },
                include: { children: true }
            });
            if (parent) {
                const childrenSum = parent.children.reduce((sum, child) => sum + child.quota, 0);
                if (childrenSum + newQuota > parent.quota) {
                    return res.status(400).json({
                        error: `Vượt ngân sách định biên! Phòng cha hiện tại chỉ còn dư tối đa ${parent.quota - childrenSum} suất.`
                    });
                }
            }
        }
        const newDept = await db_1.prisma.department.create({
            data: {
                code: code,
                name: name,
                managerName: managerName,
                quota: newQuota,
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
        const newQuota = quota ? parseInt(quota) : 15;
        const finalParentId = parentId === '' ? null : (parentId ? parentId : undefined);
        // 1. Validate Children Quota (If this dept is a parent, its new quota cannot be less than its children's sum)
        const self = await db_1.prisma.department.findUnique({
            where: { id },
            include: { children: true }
        });
        if (self && self.children.length > 0) {
            const myChildrenSum = self.children.reduce((sum, child) => sum + child.quota, 0);
            if (newQuota < myChildrenSum) {
                return res.status(400).json({
                    error: `Định biên mới (${newQuota}) không được nhỏ hơn tổng định biên đang phân bổ cho các phòng con (${myChildrenSum}).`
                });
            }
        }
        // 2. Validate Parent Quota (If this dept has a parent, its new quota cannot exceed the parent's budget)
        if (finalParentId !== undefined && finalParentId !== null) {
            const parent = await db_1.prisma.department.findUnique({
                where: { id: finalParentId },
                include: { children: true }
            });
            if (parent) {
                const otherChildrenSum = parent.children.filter(c => c.id !== id).reduce((sum, child) => sum + child.quota, 0);
                if (otherChildrenSum + newQuota > parent.quota) {
                    return res.status(400).json({
                        error: `Vượt ngân sách định biên! Phòng cha hiện tại chỉ còn dư tối đa ${parent.quota - otherChildrenSum} suất.`
                    });
                }
            }
        }
        const updatedDept = await db_1.prisma.department.update({
            where: { id },
            data: {
                code: code,
                name: name,
                managerName: managerName,
                quota: newQuota,
                status: status || 'ACTIVE',
                parentId: finalParentId
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
