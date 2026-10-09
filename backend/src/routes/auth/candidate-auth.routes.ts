import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';
import { checkAndExpireOffers } from '../recruitment/offer.routes';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';

// Middleware xác thực Token dành cho Ứng viên
export const authenticateCandidateToken = (req: any, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện chức năng này.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
    }
    req.candidateUser = user;
    next();
  });
};

// 1. Đăng ký tài khoản Ứng viên
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kiểm tra email đã đăng ký chưa
    const existing = await prisma.candidateUser.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email này đã được đăng ký tài khoản ứng viên.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.candidateUser.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone ? phone.trim() : null
      }
    });

    const token = jwt.sign(
      {
        candidateUserId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: 'CANDIDATE'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Đăng ký tài khoản ứng viên thành công!',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone
      }
    });
  } catch (error: any) {
    console.error('Candidate register error:', error);
    return res.status(500).json({ error: 'Lỗi server khi đăng ký tài khoản ứng viên.' });
  }
});

// 2. Đăng nhập Ứng viên
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập Email và Mật khẩu.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.candidateUser.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign(
      {
        candidateUserId: user.id,
        email: user.email,
        name: user.name,
        role: 'CANDIDATE'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error('Candidate login error:', error);
    return res.status(500).json({ error: 'Lỗi server khi đăng nhập ứng viên.' });
  }
});

// 3. Lấy thông tin cá nhân hiện tại
router.get('/me', authenticateCandidateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const user = await prisma.candidateUser.findUnique({
      where: { id: req.candidateUser.candidateUserId },
      select: { id: true, email: true, name: true, phone: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin tài khoản.' });
  }
});

// 4. Lấy danh sách hồ sơ ứng tuyển của Ứng viên hiện tại (tự động theo dõi)
router.get('/my-applications', authenticateCandidateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const email = req.candidateUser.email;

    // Tự động quét và hủy các lịch phỏng vấn và Offer đã quá 24h mà ứng viên chưa xác nhận
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

    await checkAndExpireOffers();

    const applications = await prisma.candidate.findMany({
      where: { email },
      include: {
        jobPosting: {
          include: { department: true, position: true }
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' }
        },
        offer: true,
        preOnboarding: true
      },
      orderBy: { id: 'desc' }
    });

    return res.json(applications);
  } catch (error) {
    console.error('Fetch my-applications error:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách hồ sơ ứng tuyển.' });
  }
});

// 5. Ứng viên Đồng ý Offer & Điền hồ sơ Pre-onboarding
router.post('/offers/:candidateId/accept', authenticateCandidateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { candidateId } = req.params;
    const email = req.candidateUser.email;
    const {
      cccd,
      gender,
      dateOfBirth,
      address,
      nationality,
      maritalStatus,
      taxCode,
      bankName,
      bankAccount,
      socialInsurance,
      healthInsurance,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation
    } = req.body;

    // Kiểm tra candidate có đúng của ứng viên này không
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { offer: true }
    });

    if (!candidate || candidate.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên hồ sơ này.' });
    }

    if (!candidate.offer) {
      return res.status(400).json({ error: 'Hồ sơ này chưa có thư mời nhận việc (Offer).' });
    }

    if (candidate.offer.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Bạn đã xác nhận đồng ý Offer này trước đó rồi.' });
    }

    if (candidate.offer.status === 'REJECTED' || (candidate.offer.expiresAt && new Date() > new Date(candidate.offer.expiresAt))) {
      return res.status(400).json({ error: 'Thư mời nhận việc (Offer) đã quá thời hạn 24 giờ phản hồi và đã bị tự động hủy.' });
    }

    // Thực hiện Transaction cập nhật Offer và lưu PreOnboardingProfile
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật Offer
      const updatedOffer = await tx.jobOffer.update({
        where: { id: candidate.offer!.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date()
        }
      });

      // 2. Lưu/Cập nhật thông tin PreOnboarding
      const preOnboarding = await tx.preOnboardingProfile.upsert({
        where: { candidateId },
        create: {
          candidateId,
          cccd: cccd ? String(cccd).trim() : null,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          nationality: nationality || 'Việt Nam',
          maritalStatus: maritalStatus || null,
          taxCode: taxCode || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          socialInsurance: socialInsurance || null,
          healthInsurance: healthInsurance || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          emergencyContactRelation: emergencyContactRelation || null,
          submittedAt: new Date()
        },
        update: {
          cccd: cccd ? String(cccd).trim() : null,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          nationality: nationality || 'Việt Nam',
          maritalStatus: maritalStatus || null,
          taxCode: taxCode || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          socialInsurance: socialInsurance || null,
          healthInsurance: healthInsurance || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          emergencyContactRelation: emergencyContactRelation || null,
          submittedAt: new Date()
        }
      });

      return { updatedOffer, preOnboarding };
    });

    return res.json({
      message: 'Chúc mừng bạn đã đồng ý Offer và hoàn tất khai báo hồ sơ tiếp nhận! Bộ phận Nhân sự sẽ đón tiếp bạn vào ngày nhận việc.',
      data: result
    });
  } catch (error: any) {
    console.error('Accept offer error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấp nhận Offer.' });
  }
});

// 6. Ứng viên Từ chối Offer
router.post('/offers/:candidateId/reject', authenticateCandidateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { candidateId } = req.params;
    const email = req.candidateUser.email;
    const { declineReason } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { offer: true }
    });

    if (!candidate || candidate.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên hồ sơ này.' });
    }

    if (!candidate.offer) {
      return res.status(400).json({ error: 'Hồ sơ này chưa có Offer.' });
    }

    if (candidate.offer.status === 'REJECTED' || (candidate.offer.expiresAt && new Date() > new Date(candidate.offer.expiresAt))) {
      return res.status(400).json({ error: 'Thư mời nhận việc (Offer) đã quá thời hạn 24 giờ phản hồi.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.jobOffer.update({
        where: { id: candidate.offer!.id },
        data: {
          status: 'REJECTED',
          declineReason: declineReason || 'Ứng viên từ chối Offer',
          respondedAt: new Date()
        }
      });

      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: 'REJECTED' }
      });
    });

    return res.json({ message: 'Bạn đã từ chối Offer thành công.' });
  } catch (error: any) {
    console.error('Decline offer error:', error);
    return res.status(500).json({ error: 'Lỗi khi từ chối Offer.' });
  }
});

// 7. Ứng viên Xác nhận tham gia Lịch phỏng vấn (trong hạn 24h)
router.post('/interviews/:id/confirm', authenticateCandidateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const interviewId = req.params.id as string;
    const email = req.candidateUser.email;
    const { candidateNotes } = req.body;

    // Tìm lịch phỏng vấn kèm thông tin ứng viên
    const interview = await prisma.interviewRound.findUnique({
      where: { id: interviewId },
      include: { candidate: true }
    });

    if (!interview || interview.candidate.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên lịch hẹn này.' });
    }

    if (interview.status !== 'PENDING_CONFIRMATION') {
      return res.status(400).json({ error: `Lịch phỏng vấn hiện đang ở trạng thái "${interview.status}", không thể xác nhận lại.` });
    }

    const now = new Date();
    // Kiểm tra quá hạn 24 giờ
    if (interview.expiresAt && now > new Date(interview.expiresAt)) {
      await prisma.interviewRound.update({
        where: { id: interviewId },
        data: {
          status: 'CANCELLED',
          candidateResponse: 'Đã quá hạn 24 giờ xác nhận. Hệ thống tự động hủy lịch.'
        }
      });
      return res.status(400).json({ error: 'Lịch hẹn phỏng vấn đã quá hạn 24 giờ để xác nhận và đã tự động hủy.' });
    }

    const updated = await prisma.interviewRound.update({
      where: { id: interviewId },
      data: {
        status: 'CONFIRMED',
        respondedAt: now,
        candidateResponse: candidateNotes || 'Ứng viên đã xác nhận tham gia đúng hẹn'
      }
    });

    return res.json({
      message: 'Bạn đã xác nhận tham gia phỏng vấn thành công! Hãy chuẩn bị tốt và có mặt đúng giờ nhé.',
      data: updated
    });
  } catch (error: any) {
    console.error('Confirm interview error:', error);
    return res.status(500).json({ error: 'Lỗi server khi xác nhận lịch phỏng vấn.' });
  }
});

// 8. Ứng viên Từ chối / Báo bận Lịch phỏng vấn
router.post('/interviews/:id/decline', authenticateCandidateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const interviewId = req.params.id as string;
    const email = req.candidateUser.email;
    const { declineReason } = req.body;

    const interview = await prisma.interviewRound.findUnique({
      where: { id: interviewId },
      include: { candidate: true }
    });

    if (!interview || interview.candidate.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên lịch hẹn này.' });
    }

    const updated = await prisma.interviewRound.update({
      where: { id: interviewId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        candidateResponse: declineReason || 'Ứng viên báo bận / xin đổi lịch hẹn khác'
      }
    });

    return res.json({
      message: 'Đã ghi nhận phản hồi từ chối lịch phỏng vấn.',
      data: updated
    });
  } catch (error: any) {
    console.error('Decline interview error:', error);
    return res.status(500).json({ error: 'Lỗi server khi từ chối lịch phỏng vấn.' });
  }
});

export default router;
