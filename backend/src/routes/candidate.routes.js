"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET: Lấy danh sách Ứng viên
router.get('/', async (req, res) => {
    try {
        const candidates = await db_1.prisma.candidate.findMany({
            include: {
                jobPosting: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(candidates);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng viên' });
    }
});
// GET: Tra cứu trạng thái hồ sơ theo email
router.get('/track', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ error: 'Vui lòng cung cấp email' });
        }
        const applications = await db_1.prisma.candidate.findMany({
            where: { email },
            include: { jobPosting: true },
            orderBy: { id: 'desc' }
        });
        const safeData = applications.map(app => ({
            id: app.id,
            jobTitle: app.jobPosting?.title || 'Không rõ',
            status: app.status
        }));
        res.json(safeData);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi tra cứu hồ sơ' });
    }
});
// POST: Thêm Ứng viên mới
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
        if (!name || !email || !jobPostingId) {
            return res.status(400).json({ error: 'Tên, email và Job Posting không được bỏ trống' });
        }
        const newCandidate = await db_1.prisma.candidate.create({
            data: {
                name: name,
                email: email,
                phone: phone,
                cvUrl: cvUrl,
                jobPostingId: jobPostingId,
                status: status || 'APPLIED'
            }
        });
        res.status(201).json(newCandidate);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm ứng viên' });
    }
});
// PUT: Cập nhật Ứng viên (thường dùng để cập nhật Status kéo thả)
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
        const updatedCandidate = await db_1.prisma.candidate.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                email: email !== undefined ? email : undefined,
                phone: phone !== undefined ? phone : undefined,
                cvUrl: cvUrl !== undefined ? cvUrl : undefined,
                jobPostingId: jobPostingId !== undefined ? jobPostingId : undefined,
                status: status !== undefined ? status : undefined
            }
        });
        // AUTO-CLOSE LOGIC
        if (updatedCandidate.status === 'HIRED' && updatedCandidate.jobPostingId) {
            const job = await db_1.prisma.jobPosting.findUnique({ where: { id: updatedCandidate.jobPostingId } });
            if (job && job.status === 'PUBLISHED') {
                const hiredCount = await db_1.prisma.candidate.count({
                    where: { jobPostingId: job.id, status: 'HIRED' }
                });
                if (hiredCount >= job.amount) {
                    await db_1.prisma.jobPosting.update({
                        where: { id: job.id },
                        data: { status: 'CLOSED' }
                    });
                }
            }
        }
        res.json(updatedCandidate);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật ứng viên' });
    }
});
// DELETE: Xóa Ứng viên
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db_1.prisma.candidate.delete({ where: { id } });
        res.json({ message: 'Xóa thành công' });
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa ứng viên' });
    }
});
exports.default = router;
