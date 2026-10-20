import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// ==========================================
// 1. PUBLIC ENDPOINTS (Cổng Tuyển Dụng Ứng Viên)
// ==========================================

// GET: Tra cứu trạng thái hồ sơ theo email và mã bảo mật (BR-CAN-08)
router.get('/track', async (req: Request, res: Response): Promise<any> => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    const code = (req.query.code as string)?.trim();
    
    // Bắt buộc cả 2 yếu tố xác thực theo chuẩn BR-CAN-08
    if (!email || !code) {
      return res.status(400).json({ 
        error: 'Vui lòng cung cấp cả Địa chỉ Email và Mã hồ sơ bảo mật (hoặc SĐT đã đăng ký) để tra cứu.' 
      });
    }
    
    const cleanCode = code.replace(/^(LLA-|APP-)/i, '').trim();
    
    const applications = await prisma.candidate.findMany({
      where: { 
        email: { equals: email, mode: 'insensitive' },
        OR: [
          { id: { startsWith: cleanCode, mode: 'insensitive' } },
          { phone: { equals: code } }
        ]
      },
      include: { 
        jobPosting: {
          select: {
            title: true,
            department: { select: { name: true } }
          }
        },
        interviews: {
          select: { scheduledAt: true, roundName: true, status: true, location: true },
          orderBy: { scheduledAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (applications.length === 0) {
      return res.status(404).json({ 
        error: 'Không tìm thấy hồ sơ nào khớp với Email và Mã xác thực bạn đã cung cấp.' 
      });
    }
    
    const safeData = applications.map(app => ({
      id: `LLA-${app.id.substring(0, 8).toUpperCase()}`,
      jobTitle: app.jobPosting?.title || 'Không rõ',
      department: app.jobPosting?.department?.name || '',
      status: app.status,
      appliedAt: app.createdAt || null,
      latestInterview: app.interviews.length > 0 ? {
        roundName: app.interviews[0].roundName,
        scheduledAt: app.interviews[0].scheduledAt,
        status: app.interviews[0].status
      } : null
    }));
    
    return res.json(safeData);
  } catch (error) {
    console.error('Error tracking candidate:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tra cứu hồ sơ.' });
  }
});

// POST: Nộp hồ sơ Ứng viên mới trực tuyến (UC-CAN-03-01 & BR-CAN-03, BR-CAN-04)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, phone, cvUrl, jobPostingId } = req.body;
    
    // 1. Validate Input cơ bản
    if (!name?.trim() || !email?.trim() || !jobPostingId?.trim()) {
      return res.status(400).json({ error: 'Họ tên, email và vị trí tuyển dụng không được để trống.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Định dạng email không hợp lệ.' });
    }

    // 2. BR-CAN-01: Kiểm tra vị trí tuyển dụng có đang mở (PUBLISHED) không
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId.trim() },
      select: { id: true, status: true, title: true }
    });

    if (!job || job.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Vị trí tuyển dụng này hiện không mở tiếp nhận hồ sơ.' });
    }

    // 3. BR-CAN-04: Kiểm tra chống nộp trùng lặp (Cùng email cho cùng 1 job)
    const existing = await prisma.candidate.findFirst({
      where: {
        email: cleanEmail,
        jobPostingId: job.id
      }
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'Email của bạn đã nộp hồ sơ cho vị trí này rồi! Vui lòng theo dõi trong mục "Hồ sơ của tôi".' 
      });
    }

    // 4. BR-CAN-03: Cố định status = 'APPLIED' (Triệt tiêu Mass Assignment)
    const newCandidate = await prisma.candidate.create({
      data: { 
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        cvUrl: cvUrl ? cvUrl.trim() : null,
        jobPostingId: job.id,
        status: 'APPLIED'
      },
      include: {
        jobPosting: { select: { title: true } }
      }
    });

    const trackingCode = `LLA-APP-${newCandidate.id.substring(0, 6).toUpperCase()}`;

    return res.status(201).json({
      ...newCandidate,
      trackingCode,
      message: 'Nộp hồ sơ ứng tuyển thành công!'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email của bạn đã nộp hồ sơ cho vị trí này rồi! Vui lòng theo dõi trong mục "Hồ sơ của tôi".' 
      });
    }
    console.error("Lỗi khi thêm ứng viên:", error);
    return res.status(500).json({ error: 'Lỗi khi thêm ứng viên' });
  }
});

// ==========================================
// 2. INTERNAL HR & ATS MANAGEMENT ENDPOINTS (Bắt buộc Token)
// ==========================================
router.use(authenticateToken);

// GET: Lấy danh sách Ứng viên (cho ATS Kanban)
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
      orderBy: { createdAt: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng viên' });
  }
});

// PUT: Cập nhật Ứng viên (thường dùng để cập nhật Status kéo thả)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
    
    // Nếu chuyển sang HIRED
    if (status === 'HIRED') {
      const result = await prisma.$transaction(async (tx) => {
        const candidate = await tx.candidate.findUnique({
          where: { id },
          include: { jobPosting: true, offer: true }
        });

        if (!candidate) throw new Error('Không tìm thấy ứng viên');

        // Cập nhật trạng thái ứng viên
        const updatedCandidate = await tx.candidate.update({
          where: { id },
          data: { status: 'HIRED' },
          include: { jobPosting: true }
        });

        // Kiểm tra xem đã có Employee được tạo qua luồng Onboarding trước đó chưa
        const existingEmp = await tx.employee.findFirst({
          where: { email: candidate.email }
        });

        if (!existingEmp) {
          // Sinh mã nhân viên chuẩn định dạng NV0001
          const count = await tx.employee.count();
          let nextNum = count + 1;
          let candidateCode = `NV${String(nextNum).padStart(4, '0')}`;
          while (await tx.employee.findUnique({ where: { code: candidateCode } })) {
            nextNum++;
            candidateCode = `NV${String(nextNum).padStart(4, '0')}`;
          }

          const baseSalary = candidate.offer ? Number(candidate.offer.baseSalary) : 10000000;

          const newEmployee = await tx.employee.create({
            data: {
              code: candidateCode,
              fullName: updatedCandidate.name,
              email: candidate.email,
              phone: candidate.phone,
              cccd: null,
              status: 'ONBOARDING',
              joinDate: candidate.offer?.startDate || new Date(),
              departmentId: updatedCandidate.jobPosting?.departmentId,
              positionId: updatedCandidate.jobPosting?.positionId
            }
          });

          // Tạo Hợp đồng thử việc
          await tx.contract.create({
            data: {
              employeeId: newEmployee.id,
              contractType: candidate.offer?.contractType || 'PROBATION',
              baseSalary: baseSalary,
              startDate: candidate.offer?.startDate || new Date(),
              status: 'ACTIVE'
            }
          });
        }

        // Auto-close JobPosting logic nếu tuyển đủ chỉ tiêu
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
