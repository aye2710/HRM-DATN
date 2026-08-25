import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET: Lấy danh sách Ứng viên
router.get('/', async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        jobPosting: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng viên' });
  }
});

// GET: Tra cứu trạng thái hồ sơ theo email
router.get('/track', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email' });
    }
    
    const applications = await prisma.candidate.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tra cứu hồ sơ' });
  }
});

// POST: Thêm Ứng viên mới
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
    
    if (!name || !email || !jobPostingId) {
        return res.status(400).json({ error: 'Tên, email và Job Posting không được bỏ trống' });
    }

    const newCandidate = await prisma.candidate.create({
      data: { 
        name: name as string,
        email: email as string,
        phone: phone as string | undefined,
        cvUrl: cvUrl as string | undefined,
        jobPostingId: jobPostingId as string,
        status: (status as string) || 'APPLIED'
      }
    });
    res.status(201).json(newCandidate);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm ứng viên' });
  }
});

// PUT: Cập nhật Ứng viên (thường dùng để cập nhật Status kéo thả)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
    
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: { 
        name: name !== undefined ? name as string : undefined,
        email: email !== undefined ? email as string : undefined,
        phone: phone !== undefined ? phone as string : undefined,
        cvUrl: cvUrl !== undefined ? cvUrl as string : undefined,
        jobPostingId: jobPostingId !== undefined ? jobPostingId as string : undefined,
        status: status !== undefined ? status as string : undefined
      }
    });

    // AUTO-CLOSE LOGIC
    if (updatedCandidate.status === 'HIRED' && updatedCandidate.jobPostingId) {
      const job = await prisma.jobPosting.findUnique({ where: { id: updatedCandidate.jobPostingId } });
      if (job && job.status === 'PUBLISHED') {
        const hiredCount = await prisma.candidate.count({
          where: { jobPostingId: job.id, status: 'HIRED' }
        });
        if (hiredCount >= job.amount) {
          await prisma.jobPosting.update({
            where: { id: job.id },
            data: { status: 'CLOSED' }
          });
        }
      }
    }

    res.json(updatedCandidate);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật ứng viên' });
  }
});

// DELETE: Xóa Ứng viên
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    await prisma.candidate.delete({ where: { id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa ứng viên' });
  }
});

export default router;
