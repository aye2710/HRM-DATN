import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// Hàm tiện ích: Tự động kiểm tra và hủy các Offer quá 24h mà ứng viên chưa phản hồi
export const checkAndExpireOffers = async () => {
  try {
    const now = new Date();
    const expiredOffers = await prisma.jobOffer.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lte: now
        }
      }
    });

    if (expiredOffers.length > 0) {
      const expiredCandidateIds = expiredOffers.map((o) => o.candidateId);
      await prisma.jobOffer.updateMany({
        where: {
          id: { in: expiredOffers.map((o) => o.id) }
        },
        data: {
          status: 'REJECTED',
          declineReason: 'Hệ thống tự động hủy: Quá thời hạn 24 giờ phản hồi Thư mời nhận việc (Offer).'
        }
      });

      await prisma.candidate.updateMany({
        where: {
          id: { in: expiredCandidateIds },
          status: 'OFFERING'
        },
        data: {
          status: 'REJECTED'
        }
      });
    }
  } catch (error) {
    console.error('Error auto-expiring offers:', error);
  }
};

// GET: Lấy danh sách Offer và tình trạng phản hồi của Ứng viên
router.get('/', async (req: Request, res: Response) => {
  try {
    await checkAndExpireOffers();

    const candidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { status: 'OFFERING' },
          { offer: { isNot: null } }
        ]
      },
      include: {
        jobPosting: {
          include: { department: true, position: true }
        },
        offer: true,
        preOnboarding: true
      },
      orderBy: { id: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Offer:", error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Offer' });
  }
});

// POST: HR Tạo & Gửi Offer cho Ứng viên (Giới hạn 24h phản hồi)
router.post('/send-offer', async (req: Request, res: Response): Promise<any> => {
  try {
    const { candidateId, baseSalary, probationRate, startDate, contractType, notes } = req.body;

    if (!candidateId || !baseSalary || !startDate) {
      return res.status(400).json({ error: 'Vui lòng nhập Lương thỏa thuận và Ngày dự kiến nhận việc.' });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Không tìm thấy ứng viên.' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Hạn chót 24h

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật hoặc tạo mới JobOffer
      const offer = await tx.jobOffer.upsert({
        where: { candidateId },
        create: {
          candidateId,
          baseSalary: Number(baseSalary),
          probationRate: Number(probationRate) || 85,
          startDate: new Date(startDate),
          contractType: contractType || 'PROBATION',
          notes: notes || null,
          status: 'PENDING',
          createdAt: now,
          expiresAt: expiresAt
        },
        update: {
          baseSalary: Number(baseSalary),
          probationRate: Number(probationRate) || 85,
          startDate: new Date(startDate),
          contractType: contractType || 'PROBATION',
          notes: notes || null,
          status: 'PENDING',
          respondedAt: null,
          declineReason: null,
          createdAt: now,
          expiresAt: expiresAt
        }
      });

      // 2. Chuyển trạng thái Candidate sang OFFERING
      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: 'OFFERING' }
      });

      return offer;
    });

    return res.status(201).json({ message: 'Đã gửi Thư mời nhận việc (Offer) tới Ứng viên (Hạn chót 24h)!', offer: result });
  } catch (error: any) {
    console.error("Lỗi khi gửi Offer:", error);
    return res.status(500).json({ error: error.message || 'Lỗi hệ thống khi gửi Offer.' });
  }
});

// POST: HR Tiếp nhận & Kích hoạt Nhân viên khi Ứng viên đến công ty
router.post('/accept', async (req: Request, res: Response): Promise<any> => {
  try {
    const { candidateId, employeeCode, joinDate, cccd, baseSalary, contractType, departmentId, positionId } = req.body;
    
    if (!candidateId) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (candidateId).' });
    }

    // Thực hiện Transaction để đảm bảo tính toàn vẹn dữ liệu
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lấy thông tin ứng viên kèm hồ sơ Pre-Onboarding & Offer
      const candidate = await tx.candidate.findUnique({
        where: { id: candidateId },
        include: {
          jobPosting: {
            include: { department: true, position: true }
          },
          offer: true,
          preOnboarding: true
        }
      });
      if (!candidate) throw new Error("Không tìm thấy ứng viên");

      const po = candidate.preOnboarding;
      const offer = candidate.offer;

      // Tự động sinh mã nhân viên nếu chưa truyền vào
      let finalCode = employeeCode ? String(employeeCode).trim() : '';
      if (!finalCode) {
        const count = await tx.employee.count();
        let nextNum = count + 1;
        let candidateCode = `NV${String(nextNum).padStart(4, '0')}`;
        while (await tx.employee.findUnique({ where: { code: candidateCode } })) {
          nextNum++;
          candidateCode = `NV${String(nextNum).padStart(4, '0')}`;
        }
        finalCode = candidateCode;
      }

      // 2. Tạo bản ghi Nhân viên (Employee) với đầy đủ dữ liệu từ Pre-Onboarding
      const newEmployee = await tx.employee.create({
        data: {
          code: finalCode,
          fullName: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          cccd: po?.cccd || (cccd ? String(cccd).trim() : null),
          gender: po?.gender || null,
          dateOfBirth: po?.dateOfBirth ? new Date(po.dateOfBirth) : null,
          address: po?.address || null,
          nationality: po?.nationality || 'Việt Nam',
          maritalStatus: po?.maritalStatus || null,
          taxCode: po?.taxCode || null,
          bankName: po?.bankName || null,
          bankAccount: po?.bankAccount || null,
          socialInsurance: po?.socialInsurance || null,
          healthInsurance: po?.healthInsurance || null,
          emergencyContactName: po?.emergencyContactName || null,
          emergencyContactPhone: po?.emergencyContactPhone || null,
          emergencyContactRelation: po?.emergencyContactRelation || null,
          status: 'ONBOARDING', // Đưa vào lộ trình Hội nhập (Onboarding) để IT/HR bàn giao thiết bị & tài khoản
          joinDate: new Date(joinDate || offer?.startDate || new Date()),
          departmentId: departmentId || candidate.jobPosting?.departmentId || null,
          positionId: positionId || candidate.jobPosting?.positionId || null
        }
      });

      // 3. Tạo bản ghi Hợp đồng lao động đầu tiên
      const finalSalary = baseSalary ? Number(baseSalary) : (offer ? Number(offer.baseSalary) : 10000000);
      const finalContractType = contractType || offer?.contractType || 'PROBATION';
      const contractStartDate = new Date(joinDate || offer?.startDate || new Date());

      await tx.contract.create({
        data: {
          employeeId: newEmployee.id,
          contractType: finalContractType,
          baseSalary: finalSalary,
          startDate: contractStartDate,
          status: 'ACTIVE'
        }
      });

      // 3.5. Tạo bản ghi Lịch sử công tác ban đầu (EmploymentHistory)
      await tx.employmentHistory.create({
        data: {
          employeeId: newEmployee.id,
          departmentId: departmentId || candidate.jobPosting?.departmentId || null,
          positionId: positionId || candidate.jobPosting?.positionId || null,
          changeReason: 'Tuyển mới (New Hire)',
          salary: finalSalary,
          effectiveDate: contractStartDate
        }
      });

      // 4. Đổi trạng thái Ứng viên thành HIRED
      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: 'HIRED' }
      });

      // 5. Nếu có offer, đánh dấu là ACCEPTED
      if (offer && offer.status !== 'ACCEPTED') {
        await tx.jobOffer.update({
          where: { id: offer.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() }
        });
      }

      return newEmployee;
    });

    res.status(201).json({ message: 'Kích hoạt hồ sơ nhân viên thành công!', employee: result });
  } catch (error: any) {
    console.error("Lỗi khi tiếp nhận ứng viên:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Mã nhân viên hoặc CCCD đã tồn tại trong hệ thống.' });
    }
    res.status(500).json({ error: error.message || 'Lỗi hệ thống khi khởi tạo hồ sơ nhân viên.' });
  }
});

// POST: Từ chối / Hủy Offer
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.id as string;
    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: 'REJECTED' }
      });
      await tx.jobOffer.updateMany({
        where: { candidateId },
        data: { status: 'REJECTED', respondedAt: new Date() }
      });
    });
    res.json({ message: 'Đã hủy Offer thành công.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi từ chối Offer' });
  }
});

export default router;
