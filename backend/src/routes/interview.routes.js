"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET: Lấy danh sách lịch phỏng vấn
router.get('/', async (req, res) => {
    try {
        const interviews = await db_1.prisma.interviewRound.findMany({
            include: {
                candidate: {
                    include: {
                        jobPosting: true
                    }
                },
                feedbacks: true
            },
            orderBy: { scheduledAt: 'asc' }
        });
        res.json(interviews);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách phỏng vấn' });
    }
});
// POST: Tạo lịch phỏng vấn mới
router.post('/', async (req, res) => {
    try {
        const { candidateId, interviewerId, roundName, scheduledAt } = req.body;
        if (!candidateId || !interviewerId || !scheduledAt || !roundName) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        const newInterview = await db_1.prisma.interviewRound.create({
            data: {
                candidateId: candidateId,
                interviewerId: interviewerId, // Currently string (name)
                roundName: roundName,
                scheduledAt: new Date(scheduledAt)
            },
            include: {
                candidate: true
            }
        });
        res.status(201).json(newInterview);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi tạo lịch phỏng vấn' });
    }
});
// POST: Thêm đánh giá (Feedback) cho lịch phỏng vấn
router.post('/:id/feedback', async (req, res) => {
    try {
        const interviewRoundId = req.params.id;
        const { score, comments } = req.body;
        if (score === undefined) {
            return res.status(400).json({ error: 'Thiếu điểm số đánh giá' });
        }
        const newFeedback = await db_1.prisma.candidateFeedback.create({
            data: {
                interviewRoundId,
                score: parseInt(score),
                comments: comments
            }
        });
        res.status(201).json(newFeedback);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lưu đánh giá phỏng vấn' });
    }
});
exports.default = router;
