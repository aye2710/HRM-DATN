"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// 1. Get all employees
router.get('/', async (req, res) => {
    try {
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
// 2. Add employee
router.post('/', async (req, res) => {
    try {
        const { code, fullName, cccd, joinDate, departmentId, positionId } = req.body;
        const newEmployee = await db_1.prisma.employee.create({
            data: {
                code,
                fullName,
                cccd,
                joinDate: new Date(joinDate),
                departmentId,
                positionId
            }
        });
        res.status(201).json(newEmployee);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm nhân viên' });
    }
});
// 3. Update employee
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { code, fullName, cccd, status, joinDate, departmentId, positionId } = req.body;
        // Check if code or cccd already exists for another employee
        const existing = await db_1.prisma.employee.findFirst({
            where: {
                OR: [{ code }, { cccd }],
                NOT: { id }
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'Mã nhân viên hoặc CCCD đã được sử dụng bởi người khác' });
        }
        const updatedEmployee = await db_1.prisma.employee.update({
            where: { id },
            data: {
                code,
                fullName,
                cccd,
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
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
    }
});
// 4. Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Check references before deleting
        const contractCount = await db_1.prisma.contract.count({ where: { employeeId: id } });
        if (contractCount > 0) {
            return res.status(400).json({ error: 'Không thể xóa nhân viên đã có hợp đồng' });
        }
        await db_1.prisma.employee.delete({ where: { id } });
        res.json({ message: 'Xóa nhân viên thành công' });
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
    }
});
exports.default = router;
