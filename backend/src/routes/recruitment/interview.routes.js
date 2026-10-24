"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndExpireInterviews = void 0;
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use((0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'LINE_MANAGER'));
// Hàm tiện ích: Tự động kiểm tra và hủy các lịch hẹn phỏng vấn quá 24h mà ứng viên chưa xác nhận
const checkAndExpireInterviews = async () => {
    try {
        const now = new Date();
        // Chỉ hủy các lịch hẹn PENDING_CONFIRMATION quá 24h VÀ chưa từng có feedback
        const expiredInterviews = await db_1.prisma.interviewRound.findMany({
            where: {
                status: 'PENDING_CONFIRMATION',
                expiresAt: { lte: now },
                feedbacks: { none: {} }
            },
            select: { id: true, candidateId: true }
        });
        if (expiredInterviews.length > 0) {
            const expiredIds = expiredInterviews.map(i => i.id);
            const candidateIds = expiredInterviews.map(i => i.candidateId);
            await db_1.prisma.interviewRound.updateMany({
                where: { id: { in: expiredIds } },
                data: {
                    status: 'CANCELLED',
                    candidateResponse: 'Hệ thống tự động hủy: Ứng viên không xác nhận tham gia trong vòng 24 giờ.'
                }
            });
            // Tự động chuyển ứng viên sang REJECTED (Loại vì quá hạn phản hồi)
            await db_1.prisma.candidate.updateMany({
                where: {
                    id: { in: candidateIds },
                    status: 'INTERVIEWING'
                },
                data: {
                    status: 'REJECTED'
                }
            });
        }
    }
    catch (error) {
        console.error('Error auto-expiring interviews:', error);
    }
};
exports.checkAndExpireInterviews = checkAndExpireInterviews;
// GET: Lấy danh sách lịch phỏng vấn (tự động cập nhật các lịch hết hạn 24h)
router.get('/', async (req, res) => {
    try {
        await (0, exports.checkAndExpireInterviews)();
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
// POST: Tạo lịch phỏng vấn mới (thiết lập hạn chót 24h để ứng viên xác nhận)
router.post('/', async (req, res) => {
    try {
        const { candidateId, interviewerId, roundName, scheduledAt, location } = req.body;
        if (!candidateId || !interviewerId || !scheduledAt) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ Ứng viên, Người phỏng vấn và Thời gian phỏng vấn.' });
        }
        const candidate = await db_1.prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin ứng viên.' });
        }
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 giờ kể từ thời điểm tạo
        const newInterview = await db_1.prisma.interviewRound.create({
            data: {
                candidateId: candidateId,
                interviewerId: interviewerId,
                roundName: roundName || 'Phỏng vấn',
                scheduledAt: new Date(scheduledAt),
                location: location || 'Trực tuyến (Google Meet / Zoom)',
                status: 'PENDING_CONFIRMATION',
                createdAt: now,
                expiresAt: expiresAt
            },
            include: {
                candidate: {
                    include: {
                        jobPosting: true
                    }
                }
            }
        });
        // Cập nhật trạng thái candidate sang INTERVIEWING nếu đang ở trạng thái trước đó
        if (['SOURCED', 'APPLIED', 'SCREENING'].includes(candidate.status)) {
            await db_1.prisma.candidate.update({
                where: { id: candidateId },
                data: { status: 'INTERVIEWING' }
            });
        }
        return res.status(201).json(newInterview);
    }
    catch (error) {
        console.error('Create interview error:', error);
        return res.status(500).json({ error: 'Lỗi khi tạo lịch phỏng vấn' });
    }
});
// PATCH: Cập nhật trạng thái lịch phỏng vấn (CONFIRMED, DECLINED, CANCELLED, COMPLETED)
router.patch('/:id/status', async (req, res) => {
    try {
        const id = req.params.id;
        const { status, candidateResponse } = req.body;
        const updated = await db_1.prisma.interviewRound.update({
            where: { id },
            data: {
                status,
                candidateResponse,
                respondedAt: new Date()
            }
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái phỏng vấn' });
    }
});
// POST: Thêm đánh giá (Feedback) cho lịch phỏng vấn (BR-REC-03-03: Thang điểm 1-10)
router.post('/:id/feedback', async (req, res) => {
    try {
        const interviewRoundId = req.params.id;
        const { score, comments } = req.body;
        if (score === undefined || score === null) {
            return res.status(400).json({ error: 'Vui lòng cung cấp điểm số đánh giá chuyên môn.' });
        }
        const numScore = Number(score);
        if (isNaN(numScore) || !Number.isInteger(numScore) || numScore < 1 || numScore > 10) {
            return res.status(400).json({ error: 'Điểm số đánh giá phải là số nguyên nằm trong thang điểm từ 1 đến 10.' });
        }
        const interview = await db_1.prisma.interviewRound.findUnique({
            where: { id: interviewRoundId },
            include: { feedbacks: true }
        });
        if (!interview) {
            return res.status(404).json({ error: 'Không tìm thấy lịch phỏng vấn tương ứng.' });
        }
        if (interview.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Lịch phỏng vấn này đã bị hủy, không thể gửi đánh giá kết quả.' });
        }
        const result = await db_1.prisma.$transaction(async (tx) => {
            // Nếu đã có đánh giá trước đó, cập nhật lại
            if (interview.feedbacks.length > 0) {
                const existingFb = interview.feedbacks[0];
                const updatedFb = await tx.candidateFeedback.update({
                    where: { id: existingFb.id },
                    data: {
                        score: numScore,
                        comments: comments
                    }
                });
                await tx.interviewRound.update({
                    where: { id: interviewRoundId },
                    data: { status: 'COMPLETED' }
                });
                return updatedFb;
            }
            // Tạo mới đánh giá và cập nhật trạng thái lịch thành COMPLETED
            const newFeedback = await tx.candidateFeedback.create({
                data: {
                    interviewRoundId,
                    score: numScore,
                    comments: comments
                }
            });
            await tx.interviewRound.update({
                where: { id: interviewRoundId },
                data: { status: 'COMPLETED' }
            });
            return newFeedback;
        });
        return res.status(201).json(result);
    }
    catch (error) {
        console.error("Lỗi khi lưu feedback:", error);
        return res.status(500).json({ error: 'Lỗi khi lưu đánh giá phỏng vấn' });
    }
});
// PUT: Cập nhật lịch phỏng vấn
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { interviewerId, roundName, scheduledAt, location, status } = req.body;
        const now = new Date();
        const updated = await db_1.prisma.interviewRound.update({
            where: { id },
            data: {
                interviewerId,
                roundName,
                location,
                status: status || 'PENDING_CONFIRMATION',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
                expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                candidateResponse: null,
                respondedAt: null
            }
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi cập nhật lịch phỏng vấn' });
    }
});
// DELETE: Hủy lịch phỏng vấn (Transaction an toàn, không bị lỗi khóa ngoại P2003)
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db_1.prisma.$transaction(async (tx) => {
            // 1. Xóa các feedbacks gắn với vòng phỏng vấn này
            await tx.candidateFeedback.deleteMany({
                where: { interviewRoundId: id }
            });
            // 2. Xóa lịch phỏng vấn
            await tx.interviewRound.delete({
                where: { id }
            });
        });
        return res.json({ message: 'Đã hủy lịch phỏng vấn thành công.' });
    }
    catch (error) {
        console.error("Lỗi khi hủy lịch phỏng vấn:", error);
        return res.status(500).json({ error: 'Lỗi khi hủy lịch phỏng vấn' });
    }
});
// POST: Ghi nhận ứng viên bùng lịch / vắng mặt không lý do (No-Show)
router.post('/:id/no-show', async (req, res) => {
    try {
        const id = req.params.id;
        const { reason, action } = req.body; // action: 'REJECT' (mặc định) | 'RESCHEDULE'
        const interview = await db_1.prisma.interviewRound.findUnique({
            where: { id },
            include: { candidate: true }
        });
        if (!interview) {
            return res.status(404).json({ error: 'Không tìm thấy lịch phỏng vấn.' });
        }
        const cancelReason = reason || 'Ứng viên vắng mặt không lý do (No-show)';
        await db_1.prisma.$transaction(async (tx) => {
            // 1. Cập nhật lịch thành CANCELLED
            await tx.interviewRound.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    candidateResponse: cancelReason,
                    respondedAt: new Date()
                }
            });
            // 2. Tự động loại hồ sơ ứng viên nếu không phải dời lịch
            if (action !== 'RESCHEDULE') {
                await tx.candidate.update({
                    where: { id: interview.candidateId },
                    data: { status: 'REJECTED' }
                });
            }
        });
        return res.json({ success: true, message: 'Đã ghi nhận ứng viên vắng mặt (No-show) và cập nhật hồ sơ.' });
    }
    catch (error) {
        console.error('Error marking no-show:', error);
        return res.status(500).json({ error: 'Lỗi khi xử lý trạng thái vắng mặt' });
    }
});
exports.default = router;
