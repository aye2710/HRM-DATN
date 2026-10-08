import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// GET: Lấy danh sách lịch phỏng vấn
router.get('/', async (req: Request, res: Response) => {
  try {
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

// POST: Tạo lịch phỏng vấn mới
router.post('/', async (req: Request, res: Response) => {
  try {
    const { candidateId, interviewerId, roundName, scheduledAt } = req.body;
    
    if (!candidateId || !interviewerId || !scheduledAt || !roundName) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const newInterview = await prisma.interviewRound.create({
      data: { 
        candidateId: candidateId as string,
        interviewerId: interviewerId as string, // Currently string (name)
        roundName: roundName as string,
        scheduledAt: new Date(scheduledAt)
      },
      include: {
        candidate: true
      }
    });
    res.status(201).json(newInterview);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo lịch phỏng vấn' });
  }
});

// POST: Thêm đánh giá (Feedback) cho lịch phỏng vấn
router.post('/:id/feedback', async (req: Request, res: Response) => {
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
    const { interviewerId, roundName, scheduledAt } = req.body;
    const updated = await prisma.interviewRound.update({
      where: { id },
      data: {
        interviewerId,
        roundName,
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
