"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET: Lấy danh sách Job Posting
router.get('/', async (req, res) => {
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
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tuyển dụng' });
    }
});
// POST: Tạo Job Posting
router.post('/', async (req, res) => {
    try {
        const { title, description, status, amount, deadline, departmentId, positionId, salaryRange, jobType, level } = req.body;
        if (!title)
            return res.status(400).json({ error: 'Tiêu đề không được bỏ trống' });
        const newJob = await db_1.prisma.jobPosting.create({
            data: {
                title: title,
                description: description || '',
                status: status || 'DRAFT',
                amount: amount ? parseInt(amount) : 1,
                deadline: deadline ? new Date(deadline) : null,
                departmentId: departmentId ? departmentId : null,
                positionId: positionId ? positionId : null,
                salaryRange: salaryRange ? salaryRange : null,
                jobType: jobType ? jobType : 'Full-time',
                level: level ? level : null
            }
        });
        res.status(201).json(newJob);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm tin tuyển dụng' });
    }
});
// PUT: Cập nhật Job Posting
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, status, amount, deadline, departmentId, positionId, salaryRange, jobType, level } = req.body;
        const updatedJob = await db_1.prisma.jobPosting.update({
            where: { id },
            data: {
                title: title,
                description: description,
                status: status,
                amount: amount ? parseInt(amount) : undefined,
                deadline: deadline ? new Date(deadline) : null,
                departmentId: departmentId === '' ? null : (departmentId ? departmentId : undefined),
                positionId: positionId === '' ? null : (positionId ? positionId : undefined),
                salaryRange: salaryRange !== undefined ? salaryRange : undefined,
                jobType: jobType !== undefined ? jobType : undefined,
                level: level !== undefined ? level : undefined
            }
        });
        res.json(updatedJob);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật tin tuyển dụng' });
    }
});
// DELETE: Xóa Job Posting
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const candidateCount = await db_1.prisma.candidate.count({ where: { jobPostingId: id } });
        if (candidateCount > 0) {
            return res.status(400).json({ error: 'Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển' });
        }
        await db_1.prisma.jobPosting.delete({ where: { id } });
        res.json({ message: 'Xóa thành công' });
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa tin tuyển dụng' });
    }
});
exports.default = router;
