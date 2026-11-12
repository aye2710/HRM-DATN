import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

const hasTextFieldChanged = (incoming: unknown, existing: string | null | undefined): boolean => {
  if (incoming === undefined) return false;
  return String(incoming ?? '').trim() !== String(existing ?? '').trim();
};

const hasIdFieldChanged = (incoming: unknown, existing: string | null | undefined): boolean => {
  if (incoming === undefined) return false;
  const normalizedIncoming = incoming === '' || incoming === null ? null : String(incoming);
  const normalizedExisting = existing || null;
  return normalizedIncoming !== normalizedExisting;
};

const hasDateFieldChanged = (incoming: unknown, existing: Date | null | undefined): boolean => {
  if (incoming === undefined) return false;
  const incomingStr = incoming ? String(incoming).trim().slice(0, 10) : '';
  if (!incomingStr && !existing) return false;
  if (!incomingStr || !existing) return true;
  const utcStr = existing.toISOString().slice(0, 10);
  const localStr = existing.toLocaleDateString('en-CA');
  return incomingStr !== utcStr && incomingStr !== localStr;
};

// GET: Lấy danh sách Job Posting (hỗ trợ ?status=PUBLISHED cho Cổng tuyển dụng công khai)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const statusQuery = req.query.status as string;

    // BR-CAN-01: Cổng ứng viên chỉ nhận tin PUBLISHED và đã đến hoặc qua ngày phát hành
    if (statusQuery === 'PUBLISHED') {
      const now = new Date();
      const publicJobs = await prisma.jobPosting.findMany({
        where: { 
          status: 'PUBLISHED',
          OR: [
            { publishDate: null },
            { publishDate: { lte: now } }
          ]
        },
        include: {
          department: {
            select: { name: true }
          },
          position: {
            select: { title: true }
          }
        },
        orderBy: { title: 'asc' }
      });
      return res.json(publicJobs);
    }

    // Luồng quản trị nội bộ: Yêu cầu xác thực Token
    return authenticateToken(req, res, async () => {
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
        return res.json(jobs);
      } catch (err) {
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tuyển dụng nội bộ' });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách tin tuyển dụng' });
  }
});

// POST: Tạo Job Posting (Bảo vệ bằng authenticateToken + requireRole)
router.post('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      title, description, status, amount, publishDate, deadline, departmentId, positionId, 
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
        publishDate: publishDate ? new Date(publishDate as string) : new Date(),
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

// PUT: Cập nhật Job Posting (Khóa thông tin cốt lõi khi đang Phát hành hoặc đã có ứng viên)
router.put('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER'), async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const {
      title, description, status, amount, publishDate, deadline, departmentId, positionId,
      salaryRange, jobType, level, location, workplaceType, experienceLevel,
      recruitmentReason, recruiterName, targetStartDate
    } = req.body;

    const existingJob = await prisma.jobPosting.findUnique({
      where: { id },
      include: { _count: { select: { candidates: true } } }
    });
    if (!existingJob) {
      return res.status(404).json({ error: 'Không tìm thấy tin tuyển dụng.' });
    }

    const candidateCount = existingJob._count.candidates;
    const hiredCount = await prisma.candidate.count({
      where: { jobPostingId: id, status: 'HIRED' }
    });

    // 1. Khi đã có ứng viên ứng tuyển (bất kể trạng thái): khóa cố định Vị trí và Phòng ban
    if (candidateCount > 0 && (hasIdFieldChanged(positionId, existingJob.positionId) || hasIdFieldChanged(departmentId, existingJob.departmentId))) {
      return res.status(400).json({
        error: `Chiến dịch đã có ${candidateCount} ứng viên ứng tuyển, không thể thay đổi Vị trí hoặc Phòng ban để đảm bảo toàn vẹn hồ sơ.`
      });
    }

    // 2. Khi đang Phát hành (PUBLISHED): khóa các trường cốt lõi, chỉ mở gia hạn ngày kết thúc, số lượng & trạng thái
    const isPublished = existingJob.status === 'PUBLISHED';
    if (isPublished) {
      const coreModified =
        hasTextFieldChanged(title, existingJob.title) ||
        hasTextFieldChanged(description, existingJob.description) ||
        hasIdFieldChanged(positionId, existingJob.positionId) ||
        hasIdFieldChanged(departmentId, existingJob.departmentId) ||
        hasTextFieldChanged(salaryRange, existingJob.salaryRange) ||
        hasTextFieldChanged(jobType, existingJob.jobType) ||
        hasTextFieldChanged(level, existingJob.level) ||
        hasTextFieldChanged(location, existingJob.location) ||
        hasTextFieldChanged(workplaceType, existingJob.workplaceType) ||
        hasTextFieldChanged(experienceLevel, existingJob.experienceLevel) ||
        hasTextFieldChanged(recruitmentReason, existingJob.recruitmentReason) ||
        hasTextFieldChanged(recruiterName, existingJob.recruiterName) ||
        hasDateFieldChanged(publishDate, existingJob.publishDate) ||
        hasDateFieldChanged(targetStartDate, existingJob.targetStartDate);

      if (coreModified) {
        return res.status(400).json({
          error: 'Chiến dịch đang Phát hành công khai! Không được sửa thông tin cốt lõi (Vị trí, Tiêu đề, Mức lương, Ngày phát hành, JD...). Chỉ được gia hạn Ngày kết thúc, điều chỉnh Số lượng hoặc Ngừng phát hành.'
        });
      }

      if (status === 'DRAFT' && candidateCount > 0) {
        return res.status(400).json({
          error: `Chiến dịch đã có ${candidateCount} ứng viên ứng tuyển, vui lòng chuyển sang "Ngừng phát hành" thay vì đưa về Bản nháp.`
        });
      }
    }

    // 3. Kiểm tra Số lượng cần tuyển (>= số đã HIRED và không vượt trần định biên)
    const parsedAmount = amount !== undefined ? parseInt(amount as string) : existingJob.amount;
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: 'Số lượng cần tuyển phải lớn hơn hoặc bằng 1.' });
    }
    if (parsedAmount < hiredCount) {
      return res.status(400).json({
        error: `Số lượng cần tuyển (${parsedAmount}) không được nhỏ hơn số nhân sự đã tiếp nhận (${hiredCount}).`
      });
    }

    const effectiveDeptId = departmentId === '' ? null : (departmentId ? String(departmentId) : existingJob.departmentId);
    if (effectiveDeptId) {
      const dept = await prisma.department.findUnique({
        where: { id: effectiveDeptId },
        include: {
          _count: {
            select: { employees: { where: { status: { not: 'RESIGNED' } } } }
          }
        }
      });

      if (dept) {
        const currentEmployees = dept._count.employees;
        const remainingNeeded = Math.max(0, parsedAmount - hiredCount);
        const quota = dept.quota || 15;

        if (currentEmployees + remainingNeeded > quota) {
          return res.status(400).json({
            error: `Phòng ban "${dept.name}" vượt trần định biên! (Hiện có: ${currentEmployees}/${quota}, cần tuyển thêm: ${remainingNeeded}).`
          });
        }
      }
    }

    // 4. Kiểm tra Ngày kết thúc >= Ngày phát hành
    const effectivePublish = publishDate !== undefined ? (publishDate ? new Date(publishDate as string) : null) : existingJob.publishDate;
    const effectiveDeadline = deadline !== undefined ? (deadline ? new Date(deadline as string) : null) : existingJob.deadline;
    if (effectivePublish && effectiveDeadline) {
      const pubKey = effectivePublish.toISOString().slice(0, 10);
      const endKey = effectiveDeadline.toISOString().slice(0, 10);
      if (endKey < pubKey) {
        return res.status(400).json({ error: 'Ngày kết thúc không được nhỏ hơn Ngày phát hành.' });
      }
    }

    // Nếu đang PUBLISHED, chỉ cập nhật đúng các trường vận hành được phép (status, deadline, amount)
    const updateData = isPublished
      ? {
          status: status !== undefined ? (status as string) : undefined,
          amount: parsedAmount,
          deadline: deadline !== undefined ? (deadline ? new Date(deadline as string) : null) : undefined
        }
      : {
          title: title as string,
          description: description as string,
          status: status as string,
          amount: parsedAmount,
          publishDate: publishDate !== undefined ? (publishDate ? new Date(publishDate as string) : null) : undefined,
          deadline: deadline !== undefined ? (deadline ? new Date(deadline as string) : null) : undefined,
          targetStartDate: targetStartDate !== undefined ? (targetStartDate ? new Date(targetStartDate as string) : null) : undefined,
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
        };

    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: updateData
    });
    return res.json(updatedJob);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật tin tuyển dụng' });
  }
});

// DELETE: Xóa Job Posting (Chỉ Admin và HR Manager; chặn xóa khi đang PUBLISHED hoặc đã có ứng viên)
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: { _count: { select: { candidates: true } } }
    });
    if (!job) {
      return res.status(404).json({ error: 'Không tìm thấy tin tuyển dụng.' });
    }
    if (job.status === 'PUBLISHED') {
      return res.status(400).json({ error: 'Không thể xóa tin tuyển dụng đang ở trạng thái Phát hành! Vui lòng chuyển sang Ngừng phát hành trước.' });
    }
    if (job._count.candidates > 0) {
      return res.status(400).json({ error: 'Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển.' });
    }

    await prisma.jobPosting.delete({ where: { id } });
    return res.json({ message: 'Xóa tin tuyển dụng thành công.' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa tin tuyển dụng' });
  }
});

export default router;
