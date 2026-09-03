"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// 1. Lấy danh sách nhân viên đang Onboarding
router.get('/newbies', async (req, res) => {
    try {
        const newbies = await db_1.prisma.employee.findMany({
            where: { status: 'ONBOARDING' },
            include: {
                department: true,
                position: true,
                onboardingTasks: true
            },
            orderBy: { joinDate: 'desc' }
        });
        res.json(newbies);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân sự Onboarding' });
    }
});
// 2. Chuyển đổi trạng thái (Check/Uncheck) của 1 task
router.post('/task/toggle', async (req, res) => {
    try {
        const { employeeId, taskName, category, isCompleted } = req.body;
        // Tìm task hiện tại
        let task = await db_1.prisma.onboardingTask.findFirst({
            where: { employeeId, taskName, category }
        });
        if (task) {
            task = await db_1.prisma.onboardingTask.update({
                where: { id: task.id },
                data: { isCompleted }
            });
        }
        else {
            task = await db_1.prisma.onboardingTask.create({
                data: { employeeId, taskName, category, isCompleted }
            });
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật tiến độ công việc' });
    }
});
// 3. Hoàn tất Hội nhập -> Chuyển sang PROBATION hoặc INTERNSHIP
router.post('/complete', async (req, res) => {
    try {
        const { employeeId } = req.body;
        const employee = await db_1.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { position: true }
        });
        if (!employee)
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        let nextStatus = 'PROBATION';
        if (employee.position?.level?.toLowerCase() === 'intern') {
            nextStatus = 'INTERNSHIP';
        }
        const updatedEmployee = await db_1.prisma.employee.update({
            where: { id: employeeId },
            data: { status: nextStatus }
        });
        res.json(updatedEmployee);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi hoàn tất hội nhập' });
    }
});
exports.default = router;
