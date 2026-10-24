"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET: Lấy danh sách Job Posting (hỗ trợ ?status=PUBLISHED cho Cổng tuyển dụng công khai)
router.get('/', async (req, res, next) => {
    try {
        const statusQuery = req.query.status;
        // BR-CAN-01: Cổng ứng viên chỉ nhận tin PUBLISHED và đã đến hoặc qua ngày phát hành
        if (statusQuery === 'PUBLISHED') {
            const now = new Date();
            const publicJobs = await db_1.prisma.jobPosting.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { publishDate: null },
                        { publishDate: { lte: now } }
                    ]
                },
                include: {
                    department: {
                        select: { name: true }
                    },
                    position: {
                        select: { title: true }
                    }
                },
                orderBy: { title: 'asc' }
            });
            return res.json(publicJobs);
        }
        // Luồng quản trị nội bộ: Yêu cầu xác thực Token
        return (0, auth_middleware_1.authenticateToken)(req, res, async () => {
            try {
                const jobs = await db_1.prisma.jobPosting.findMany({
                    include: {
                        _count: {
                            select: { candidates: true }
                        },
                        candidates: {
                            select: { status: true }
                        },
                        department: {
                            select: { name: true }
                        },
                        position: {
                            select: { title: true }
                        }
                    },
                    orderBy: { title: 'asc' }
                });
                return res.json(jobs);
            }
            catch (err) {
                return res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tuyển dụng nội bộ' });
            }
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tuyển dụng' });
    }
});
// POST: Tạo Job Posting (Bảo vệ bằng authenticateToken + requireRole)
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER'), async (req, res) => {
    try {
        const { title, description, status, amount, publishDate, deadline, departmentId, positionId, salaryRange, jobType, level, location, workplaceType, experienceLevel, recruitmentReason, recruiterName, targetStartDate } = req.body;
        if (!title)
            return res.status(400).json({ error: 'Tiêu đề không được bỏ trống' });
        // 1. Kiểm tra Định biên nhân sự (Quota) của phòng ban
        if (departmentId) {
            const dept = await db_1.prisma.department.findUnique({
                where: { id: departmentId },
                include: {
                    _count: {
                        select: {
                            employees: {
                                where: { status: { not: 'RESIGNED' } }
                            }
                        }
                    }
                }
            });
            if (dept) {
                const currentEmployees = dept._count.employees;
                const requestedAmount = amount ? parseInt(amount) : 1;
                const quota = dept.quota || 15;
                if (currentEmployees + requestedAmount > quota) {
                    return res.status(400).json({
                        error: `Phòng ban "${dept.name}" đã vượt trần định biên nhân sự! (Hiện tại: ${currentEmployees}/${quota} nhân sự, đang yêu cầu tuyển thêm: ${requestedAmount}). Cần phê duyệt nâng định biên trước khi đăng tuyển.`
                    });
                }
            }
        }
        const newJob = await db_1.prisma.jobPosting.create({
            data: {
                title: title,
                description: description || '',
                status: status || 'DRAFT',
                amount: amount ? parseInt(amount) : 1,
                publishDate: publishDate ? new Date(publishDate) : null,
                deadline: deadline ? new Date(deadline) : null,
                targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
                departmentId: departmentId ? departmentId : null,
                positionId: positionId ? positionId : null,
                salaryRange: salaryRange ? salaryRange : null,
                jobType: jobType ? jobType : 'Full-time',
                level: level ? level : null,
                location: location || 'Hà Nội',
                workplaceType: workplaceType || 'On-site',
                experienceLevel: experienceLevel || 'Không yêu cầu',
                recruitmentReason: recruitmentReason || 'EXPANSION',
                recruiterName: recruiterName || null
            }
        });
        return res.status(201).json(newJob);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi thêm tin tuyển dụng' });
    }
});
// PUT: Cập nhật Job Posting
router.put('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER'), async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, status, amount, publishDate, deadline, departmentId, positionId, salaryRange, jobType, level, location, workplaceType, experienceLevel, recruitmentReason, recruiterName, targetStartDate } = req.body;
        // Kiểm tra định biên nếu có thay đổi số lượng hoặc phòng ban
        if (departmentId && amount) {
            const dept = await db_1.prisma.department.findUnique({
                where: { id: departmentId },
                include: {
                    _count: {
                        select: {
                            employees: {
                                where: { status: { not: 'RESIGNED' } }
                            }
                        }
                    }
                }
            });
            if (dept) {
                const currentEmployees = dept._count.employees;
                const requestedAmount = parseInt(amount);
                const quota = dept.quota || 15;
                if (currentEmployees + requestedAmount > quota) {
                    return res.status(400).json({
                        error: `Phòng ban "${dept.name}" vượt trần định biên! (Hiện có: ${currentEmployees}/${quota}, yêu cầu tuyển: ${requestedAmount}).`
                    });
                }
            }
        }
        const updatedJob = await db_1.prisma.jobPosting.update({
            where: { id },
            data: {
                title: title,
                description: description,
                status: status,
                amount: amount ? parseInt(amount) : undefined,
                publishDate: publishDate !== undefined ? (publishDate ? new Date(publishDate) : null) : undefined,
                deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
                targetStartDate: targetStartDate !== undefined ? (targetStartDate ? new Date(targetStartDate) : null) : undefined,
                departmentId: departmentId === '' ? null : (departmentId ? departmentId : undefined),
                positionId: positionId === '' ? null : (positionId ? positionId : undefined),
                salaryRange: salaryRange !== undefined ? salaryRange : undefined,
                jobType: jobType !== undefined ? jobType : undefined,
                level: level !== undefined ? level : undefined,
                location: location !== undefined ? location : undefined,
                workplaceType: workplaceType !== undefined ? workplaceType : undefined,
                experienceLevel: experienceLevel !== undefined ? experienceLevel : undefined,
                recruitmentReason: recruitmentReason !== undefined ? recruitmentReason : undefined,
                recruiterName: recruiterName !== undefined ? recruiterName : undefined
            }
        });
        res.json(updatedJob);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật tin tuyển dụng' });
    }
});
// DELETE: Xóa Job Posting (Chỉ Admin và HR Manager)
router.delete('/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
    try {
        const id = req.params.id;
        const candidateCount = await db_1.prisma.candidate.count({ where: { jobPostingId: id } });
        if (candidateCount > 0) {
            return res.status(400).json({ error: 'Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển.' });
        }
        await db_1.prisma.jobPosting.delete({ where: { id } });
        return res.json({ message: 'Xóa tin tuyển dụng thành công.' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa tin tuyển dụng' });
    }
});
exports.default = router;
