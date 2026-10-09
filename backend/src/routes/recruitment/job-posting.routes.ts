import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

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
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      title, description, status, amount, deadline, departmentId, positionId, 
      salaryRange, jobType, level, location, workplaceType, experienceLevel, 
      recruitmentReason, recruiterName, targetStartDate 
    } = req.body;
    
    if (!title) return res.status(400).json({ error: 'Tiêu đề không được bỏ trống' });

    // 1. Kiểm tra Định biên nhân sự (Quota) của phòng ban
    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId as string },
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
        const requestedAmount = amount ? parseInt(amount as string) : 1;
        const quota = dept.quota || 15;

        if (currentEmployees + requestedAmount > quota) {
          return res.status(400).json({
            error: `Phòng ban "${dept.name}" đã vượt trần định biên nhân sự! (Hiện tại: ${currentEmployees}/${quota} nhân sự, đang yêu cầu tuyển thêm: ${requestedAmount}). Cần phê duyệt nâng định biên trước khi đăng tuyển.`
          });
        }
      }
    }

    const newJob = await prisma.jobPosting.create({
      data: { 
        title: title as string,
        description: (description as string) || '',
        status: (status as string) || 'DRAFT',
        amount: amount ? parseInt(amount as string) : 1,
        deadline: deadline ? new Date(deadline as string) : null,
        targetStartDate: targetStartDate ? new Date(targetStartDate as string) : null,
        departmentId: departmentId ? (departmentId as string) : null,
        positionId: positionId ? (positionId as string) : null,
        salaryRange: salaryRange ? (salaryRange as string) : null,
        jobType: jobType ? (jobType as string) : 'Full-time',
        level: level ? (level as string) : null,
        location: location || 'Hà Nội',
        workplaceType: workplaceType || 'On-site',
        experienceLevel: experienceLevel || 'Không yêu cầu',
        recruitmentReason: recruitmentReason || 'EXPANSION',
        recruiterName: recruiterName || null
      }
    });
    return res.status(201).json(newJob);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi thêm tin tuyển dụng' });
  }
});

// PUT: Cập nhật Job Posting
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { 
      title, description, status, amount, deadline, departmentId, positionId, 
      salaryRange, jobType, level, location, workplaceType, experienceLevel, 
      recruitmentReason, recruiterName, targetStartDate 
    } = req.body;

    // Kiểm tra định biên nếu có thay đổi số lượng hoặc phòng ban
    if (departmentId && amount) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId as string },
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
        const requestedAmount = parseInt(amount as string);
        const quota = dept.quota || 15;

        if (currentEmployees + requestedAmount > quota) {
          return res.status(400).json({
            error: `Phòng ban "${dept.name}" vượt trần định biên! (Hiện có: ${currentEmployees}/${quota}, yêu cầu tuyển: ${requestedAmount}).`
          });
        }
      }
    }
    
    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: { 
        title: title as string,
        description: description as string,
        status: status as string,
        amount: amount ? parseInt(amount as string) : undefined,
        deadline: deadline ? new Date(deadline as string) : null,
        targetStartDate: targetStartDate ? new Date(targetStartDate as string) : null,
        departmentId: departmentId === '' ? null : (departmentId ? (departmentId as string) : undefined),
        positionId: positionId === '' ? null : (positionId ? (positionId as string) : undefined),
        salaryRange: salaryRange !== undefined ? (salaryRange as string) : undefined,
        jobType: jobType !== undefined ? (jobType as string) : undefined,
        level: level !== undefined ? (level as string) : undefined,
        location: location !== undefined ? (location as string) : undefined,
        workplaceType: workplaceType !== undefined ? (workplaceType as string) : undefined,
        experienceLevel: experienceLevel !== undefined ? (experienceLevel as string) : undefined,
        recruitmentReason: recruitmentReason !== undefined ? (recruitmentReason as string) : undefined,
        recruiterName: recruiterName !== undefined ? (recruiterName as string) : undefined
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
