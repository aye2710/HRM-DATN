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
exports.default = router;
