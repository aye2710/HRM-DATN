import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// GET: Lấy danh sách Ứng viên
router.get('/', async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        jobPosting: {
          include: {
            department: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng viên' });
  }
});

// GET: Tra cứu trạng thái hồ sơ theo email (kèm mã bảo mật hồ sơ hoặc SĐT để chống rò rỉ dữ liệu)
router.get('/track', async (req: Request, res: Response): Promise<any> => {
  try {
    const email = (req.query.email as string)?.trim();
    const code = (req.query.code as string)?.trim();
    
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email ứng tuyển' });
    }
    
    const applications = await prisma.candidate.findMany({
      where: { 
        email: { equals: email, mode: 'insensitive' },
        ...(code ? {
          OR: [
            { id: { contains: code.replace(/^LLA-/i, '').replace(/^APP-/i, ''), mode: 'insensitive' } },
            { phone: { contains: code } }
          ]
        } : {})
      },
      include: { 
        jobPosting: true,
        interviews: {
          select: { scheduledAt: true, roundName: true },
          orderBy: { scheduledAt: 'desc' },
          take: 1
        }
      },
      orderBy: { id: 'desc' }
    });
    
    const safeData = applications.map(app => ({
      id: app.id,
      jobTitle: app.jobPosting?.title || 'Không rõ',
      status: app.status,
      appliedAt: (app as any).createdAt || null,
      latestInterview: app.interviews.length > 0 ? app.interviews[0] : null
    }));
    
    return res.json(safeData);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi tra cứu hồ sơ' });
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
        status: (status as any) || 'SOURCED'
      }
    });
    res.status(201).json(newCandidate);
  } catch (error) {
    console.error("Lỗi khi thêm ứng viên:", error);
    res.status(500).json({ error: 'Lỗi khi thêm ứng viên' });
  }
});

// PUT: Cập nhật Ứng viên (thường dùng để cập nhật Status kéo thả)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
    
    // Nếu chuyển sang HIRED, thực hiện Transaction để Auto-provisioning
    if (status === 'HIRED') {
      const result = await prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái ứng viên
        const updatedCandidate = await tx.candidate.update({
          where: { id },
          data: { status: 'HIRED' },
          include: { jobPosting: true }
        });

        // Tự động tạo Employee
        const empCode = `EMP${Math.floor(Math.random() * 10000)}`;
        const newEmployee = await tx.employee.create({
          data: {
            code: empCode,
            fullName: updatedCandidate.name,
            cccd: null, // Nullable theo DB mới
            status: 'ONBOARDING',
            joinDate: new Date(),
            departmentId: updatedCandidate.jobPosting?.departmentId,
            positionId: updatedCandidate.jobPosting?.positionId
          }
        });

        // Tạo Hợp đồng thử việc mặc định
        await tx.contract.create({
          data: {
            employeeId: newEmployee.id,
            contractType: 'PROBATION',
            baseSalary: 10000000, // Lương tạm mặc định
            startDate: new Date(),
            status: 'ACTIVE'
          }
        });

        // Auto-close JobPosting logic
        if (updatedCandidate.jobPostingId) {
          const job = updatedCandidate.jobPosting;
          if (job && job.status === 'PUBLISHED') {
            const hiredCount = await tx.candidate.count({
              where: { jobPostingId: job.id, status: 'HIRED' }
            });
            if (hiredCount >= job.amount) {
              await tx.jobPosting.update({
                where: { id: job.id },
                data: { status: 'CLOSED' }
              });
            }
          }
        }

        return updatedCandidate;
      });
      return res.json(result);
    }

    // Các trường hợp cập nhật thông thường khác
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: { 
        name: name !== undefined ? name as string : undefined,
        email: email !== undefined ? email as string : undefined,
        phone: phone !== undefined ? phone as string : undefined,
        cvUrl: cvUrl !== undefined ? cvUrl as string : undefined,
        jobPostingId: jobPostingId !== undefined ? jobPostingId as string : undefined,
        status: status !== undefined ? status as any : undefined
      }
    });

    res.json(updatedCandidate);
  } catch (error) {
    console.error(error);
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
