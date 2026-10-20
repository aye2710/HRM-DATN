import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'LINE_MANAGER'));

// Hàm tiện ích: Tự động kiểm tra và hủy các lịch hẹn phỏng vấn quá 24h mà ứng viên chưa xác nhận
export const checkAndExpireInterviews = async () => {
  try {
    const now = new Date();
    await prisma.interviewRound.updateMany({
      where: {
        status: 'PENDING_CONFIRMATION',
        expiresAt: {
          lte: now
        }
      },
      data: {
        status: 'CANCELLED',
        candidateResponse: 'Hệ thống tự động hủy: Ứng viên không xác nhận trong vòng 24 giờ kể từ khi gửi lời mời.'
      }
    });
  } catch (error) {
    console.error('Error auto-expiring interviews:', error);
  }
};

// GET: Lấy danh sách lịch phỏng vấn (tự động cập nhật các lịch hết hạn 24h)
router.get('/', async (req: Request, res: Response) => {
  try {
    await checkAndExpireInterviews();

    const interviews = await prisma.interviewRound.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phỏng vấn' });
  }
});

// POST: Tạo lịch phỏng vấn mới (thiết lập hạn chót 24h để ứng viên xác nhận)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { candidateId, interviewerId, roundName, scheduledAt, location } = req.body;
    
    if (!candidateId || !interviewerId || !scheduledAt || !roundName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ Ứng viên, Người phỏng vấn, Vòng thi và Thời gian phỏng vấn.' });
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin ứng viên.' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 giờ kể từ thời điểm tạo

    const newInterview = await prisma.interviewRound.create({
      data: { 
        candidateId: candidateId as string,
        interviewerId: interviewerId as string,
        roundName: roundName as string,
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
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: 'INTERVIEWING' }
      });
    }

    return res.status(201).json(newInterview);
  } catch (error) {
    console.error('Create interview error:', error);
    return res.status(500).json({ error: 'Lỗi khi tạo lịch phỏng vấn' });
  }
});

// PATCH: Cập nhật trạng thái lịch phỏng vấn (CONFIRMED, DECLINED, CANCELLED, COMPLETED)
router.patch('/:id/status', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { status, candidateResponse } = req.body;

    const updated = await prisma.interviewRound.update({
      where: { id },
      data: {
        status,
        candidateResponse,
        respondedAt: new Date()
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái phỏng vấn' });
  }
});

// POST: Thêm đánh giá (Feedback) cho lịch phỏng vấn (BR-REC-03-03: Thang điểm 1-10)
router.post('/:id/feedback', async (req: Request, res: Response): Promise<any> => {
  try {
    const interviewRoundId = req.params.id as string;
    const { score, comments } = req.body;
    
    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Vui lòng cung cấp điểm số đánh giá chuyên môn.' });
    }

    const numScore = Number(score);
    if (isNaN(numScore) || !Number.isInteger(numScore) || numScore < 1 || numScore > 10) {
      return res.status(400).json({ error: 'Điểm số đánh giá phải là số nguyên nằm trong thang điểm từ 1 đến 10.' });
    }

    const interview = await prisma.interviewRound.findUnique({
      where: { id: interviewRoundId },
      include: { feedbacks: true }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Không tìm thấy lịch phỏng vấn tương ứng.' });
    }

    if (interview.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Lịch phỏng vấn này đã bị hủy, không thể gửi đánh giá kết quả.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Nếu đã có đánh giá trước đó, cập nhật lại
      if (interview.feedbacks.length > 0) {
        const existingFb = interview.feedbacks[0];
        const updatedFb = await tx.candidateFeedback.update({
          where: { id: existingFb.id },
          data: {
            score: numScore,
            comments: comments as string | undefined
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
          comments: comments as string | undefined
        }
      });

      await tx.interviewRound.update({
        where: { id: interviewRoundId },
        data: { status: 'COMPLETED' }
      });

      return newFeedback;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Lỗi khi lưu feedback:", error);
    return res.status(500).json({ error: 'Lỗi khi lưu đánh giá phỏng vấn' });
  }
});

// PUT: Cập nhật lịch phỏng vấn
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { interviewerId, roundName, scheduledAt, location, status } = req.body;
    const now = new Date();
    const updated = await prisma.interviewRound.update({
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
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật lịch phỏng vấn' });
  }
});

// DELETE: Hủy lịch phỏng vấn (Transaction an toàn, không bị lỗi khóa ngoại P2003)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    console.error("Lỗi khi hủy lịch phỏng vấn:", error);
    return res.status(500).json({ error: 'Lỗi khi hủy lịch phỏng vấn' });
  }
});

export default router;
