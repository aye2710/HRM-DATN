import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

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
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
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
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'INTERVIEWING' }
    });

    res.status(201).json(newInterview);
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo lịch phỏng vấn' });
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

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái phỏng vấn' });
  }
});

// POST: Thêm đánh giá (Feedback) cho lịch phỏng vấn
router.post('/:id/feedback', async (req: Request, res: Response): Promise<any> => {
  try {
    const interviewRoundId = req.params.id as string;
    const { score, comments } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({ error: 'Thiếu điểm số đánh giá' });
    }

    const newFeedback = await prisma.candidateFeedback.create({
      data: { 
        interviewRoundId,
        score: parseInt(score),
        comments: comments as string | undefined
      }
    });
    res.status(201).json(newFeedback);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu đánh giá phỏng vấn' });
  }
});

// PUT: Cập nhật lịch phỏng vấn
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { interviewerId, roundName, scheduledAt, location, status } = req.body;
    const updated = await prisma.interviewRound.update({
      where: { id },
      data: {
        interviewerId,
        roundName,
        location,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật lịch phỏng vấn' });
  }
});

// DELETE: Hủy lịch phỏng vấn
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.interviewRound.delete({
      where: { id }
    });
    res.json({ message: 'Đã hủy lịch phỏng vấn' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi hủy lịch phỏng vấn' });
  }
});

export default router;
