import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET: Lấy danh sách Job Posting
router.get('/', async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.jobPosting.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tuyển dụng' });
  }
});

// POST: Tạo Job Posting
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, status, amount, deadline, departmentId, positionId, salaryRange, jobType, level } = req.body;
    
    if (!title) return res.status(400).json({ error: 'Tiêu đề không được bỏ trống' });

    const newJob = await prisma.jobPosting.create({
      data: { 
        title: title as string,
        description: (description as string) || '',
        status: (status as string) || 'DRAFT',
        amount: amount ? parseInt(amount as string) : 1,
        deadline: deadline ? new Date(deadline as string) : null,
        departmentId: departmentId ? (departmentId as string) : null,
        positionId: positionId ? (positionId as string) : null,
        salaryRange: salaryRange ? (salaryRange as string) : null,
        jobType: jobType ? (jobType as string) : 'Full-time',
        level: level ? (level as string) : null
      }
    });
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm tin tuyển dụng' });
  }
});

// PUT: Cập nhật Job Posting
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, status, amount, deadline, departmentId, positionId, salaryRange, jobType, level } = req.body;
    
    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: { 
        title: title as string,
        description: description as string,
        status: status as string,
        amount: amount ? parseInt(amount as string) : undefined,
        deadline: deadline ? new Date(deadline as string) : null,
        departmentId: departmentId === '' ? null : (departmentId ? (departmentId as string) : undefined),
        positionId: positionId === '' ? null : (positionId ? (positionId as string) : undefined),
        salaryRange: salaryRange !== undefined ? (salaryRange as string) : undefined,
        jobType: jobType !== undefined ? (jobType as string) : undefined,
        level: level !== undefined ? (level as string) : undefined
      }
    });
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật tin tuyển dụng' });
  }
});

// DELETE: Xóa Job Posting
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const candidateCount = await prisma.candidate.count({ where: { jobPostingId: id } });
    if (candidateCount > 0) {
      return res.status(400).json({ error: 'Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển' });
    }

    await prisma.jobPosting.delete({ where: { id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa tin tuyển dụng' });
  }
});

export default router;
