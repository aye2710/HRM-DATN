"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Áp dụng xác thực cho bảng điều khiển
router.use(auth_middleware_1.authenticateToken);
// GET /api/dashboard/stats - Thống kê nhanh bảng điều khiển thời gian thực
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalEmployees, activeEmployees, pendingLeaves, pendingOT, openJobPostings, todayAttendances, contracts] = await Promise.all([
            db_1.prisma.employee.count(),
            db_1.prisma.employee.count({ where: { status: { not: 'RESIGNED' } } }),
            db_1.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            db_1.prisma.oTRequest.count({ where: { status: 'PENDING' } }),
            db_1.prisma.jobPosting.count({ where: { status: 'OPEN' } }),
            db_1.prisma.attendance.count({ where: { date: today, checkIn: { not: null } } }),
            db_1.prisma.contract.findMany({
                where: { status: 'ACTIVE' },
                select: { baseSalary: true }
            })
        ]);
        // Tổng quỹ lương cơ bản hàng tháng từ các hợp đồng đang ACTIVE
        const totalPayroll = contracts.reduce((sum, c) => sum + Number(c.baseSalary || 0), 0);
        const estimatedPayroll = totalPayroll > 0
            ? `${(totalPayroll / 1000000).toFixed(1)}M`
            : `${(activeEmployees * 10)}M`;
        res.status(200).json({
            totalEmployees: activeEmployees || totalEmployees,
            pendingLeaves,
            pendingOT,
            openJobPostings,
            todayAttendances,
            estimatedPayroll,
            totalPayrollVND: totalPayroll
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
