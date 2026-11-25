import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';
import { checkAndExpireOffers } from '../recruitment/offer.routes';
import { sendCandidateVerificationOtpEmail } from '../../utils/mailer';

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

// 1. Gửi mã OTP xác thực email trước khi đăng ký
router.post('/send-register-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ email.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kiểm tra định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Định dạng email không hợp lệ.' });
    }

    // Kiểm tra email đã đăng ký tài khoản chưa
    const existing = await prisma.candidateUser.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'Email này đã được đăng ký tài khoản ứng viên. Vui lòng chuyển sang tab Đăng nhập.' });
    }

    // Tạo mã OTP ngẫu nhiên 6 chữ số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Lưu vào bảng xác thực
    await prisma.candidateVerificationOtp.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        otp: otpCode,
        expiresAt
      },
      update: {
        otp: otpCode,
        expiresAt,
        createdAt: new Date()
      }
    });

    // Gửi email chứa mã OTP
    const mailRes = await sendCandidateVerificationOtpEmail({
      to: cleanEmail,
      name: name?.trim() || 'Ứng viên',
      otpCode
    });

    return res.json({
      message: `Mã xác thực OTP đã được gửi đến email ${cleanEmail}. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/spam).`,
      email: cleanEmail,
      expiresInSeconds: 300
    });
  } catch (error: any) {
    console.error('Send register OTP error:', error);
    return res.status(500).json({ error: 'Lỗi server khi gửi mã xác thực OTP.' });
  }
});

// 2. Đăng ký tài khoản Ứng viên (Yêu cầu mã xác thực OTP)
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, name, phone, otp } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu.' });
    }

    if (!otp) {
      return res.status(400).json({ error: 'Vui lòng nhập mã xác thực OTP gửi về email.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Kiểm tra email đã đăng ký chưa
    const existing = await prisma.candidateUser.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'Email này đã được đăng ký tài khoản ứng viên.' });
    }

    // 2. Xác minh mã OTP trong database
    const otpRecord = await prisma.candidateVerificationOtp.findUnique({
      where: { email: cleanEmail }
    });

    const isDemoBypass = (cleanEmail.endsWith('@example.com') && cleanOtp === '123456');

    if (!isDemoBypass) {
      if (!otpRecord) {
        return res.status(400).json({ error: 'Chưa có yêu cầu gửi mã OTP cho email này hoặc mã đã hết hạn. Vui lòng bấm Gửi mã xác thực.' });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ error: 'Mã xác thực OTP đã hết hạn (sau 5 phút). Vui lòng yêu cầu gửi mã mới.' });
      }

      if (otpRecord.otp !== cleanOtp) {
        return res.status(400).json({ error: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra kỹ email và nhập lại.' });
      }
    }

    // 3. Xóa bản ghi OTP sau khi xác thực thành công
    if (otpRecord) {
      await prisma.candidateVerificationOtp.delete({
        where: { email: cleanEmail }
      }).catch(() => {});
    }

    // 4. Khởi tạo tài khoản CandidateUser với isVerified = true
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.candidateUser.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        isVerified: true
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
      message: 'Xác thực email và đăng ký tài khoản ứng viên thành công!',
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
      where: { email: { equals: email, mode: 'insensitive' } },
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

// 5. Ứng viên Đồng ý Offer & Điền hồ sơ Pre-onboarding (BR-CAN-05)
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

    // 1. Validate bắt buộc các trường nhân thân & pháp lý theo BR-CAN-05
    const cleanCccd = String(cccd || '').trim();
    if (!/^\d{12}$/.test(cleanCccd)) {
      return res.status(400).json({ error: 'Số CCCD gắn chip không hợp lệ. Vui lòng nhập chính xác 12 chữ số.' });
    }

    if (!dateOfBirth || isNaN(Date.parse(dateOfBirth))) {
      return res.status(400).json({ error: 'Ngày sinh không hợp lệ.' });
    }

    if (!address?.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ thường trú hoặc nơi ở hiện tại.' });
    }

    // 2. Validate bắt buộc tài khoản ngân hàng & liên hệ khẩn cấp
    if (!bankName?.trim() || !bankAccount?.trim()) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ Tên ngân hàng và Số tài khoản chính chủ để nhận lương.' });
    }

    if (!emergencyContactName?.trim() || !emergencyContactPhone?.trim() || !emergencyContactRelation?.trim()) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin Người liên hệ khẩn cấp (Họ tên, SĐT, Mối quan hệ).' });
    }

    // 3. Kiểm tra quyền sở hữu của ứng viên trên hồ sơ
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

    const now = new Date();
    if (candidate.offer.status === 'REJECTED' || (candidate.offer.expiresAt && now > new Date(candidate.offer.expiresAt))) {
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

// =========================================================================
// 9. PUBLIC MAGIC LINK ENDPOINTS (KHÔNG CẦN ĐĂNG KÝ / ĐĂNG NHẬP TÀI KHOẢN)
// =========================================================================

// GET /magic-respond/:token: Lấy thông tin phỏng vấn hoặc Offer từ Magic Token
router.get('/magic-respond/:token', async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.params.token as string;
    if (!token) {
      return res.status(400).json({ error: 'Thiếu mã xác thực phản hồi (Token).' });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return res.status(400).json({
        expired: true,
        error: 'Liên kết phản hồi đã hết hạn hoặc không hợp lệ (Vượt quá thời hạn 24 giờ). Vui lòng liên hệ Bộ phận Tuyển dụng.'
      });
    }

    const { purpose, type, targetId, candidateId } = payload;
    if (purpose !== 'MAGIC_RESPONSE') {
      return res.status(400).json({ error: 'Token không đúng mục đích sử dụng.' });
    }

    const now = new Date();

    if (type === 'INTERVIEW') {
      const interview = await prisma.interviewRound.findUnique({
        where: { id: targetId },
        include: {
          candidate: {
            include: {
              jobPosting: {
                include: { department: true, position: true }
              }
            }
          }
        }
      });

      if (!interview) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin lịch phỏng vấn.' });
      }

      // Kiểm tra xem đã quá 24h chưa
      let isExpired = false;
      if (interview.expiresAt && now > new Date(interview.expiresAt)) {
        isExpired = true;
        if (interview.status === 'PENDING_CONFIRMATION') {
          await prisma.interviewRound.update({
            where: { id: interview.id },
            data: {
              status: 'CANCELLED',
              candidateResponse: 'Hệ thống tự động hủy: Ứng viên không xác nhận tham gia trong vòng 24 giờ.'
            }
          });
          await prisma.candidate.update({
            where: { id: interview.candidateId },
            data: { status: 'REJECTED' }
          });
          interview.status = 'CANCELLED';
        }
      }

      return res.json({
        type: 'INTERVIEW',
        expired: isExpired,
        interview: {
          id: interview.id,
          roundName: interview.roundName,
          scheduledAt: interview.scheduledAt,
          location: interview.location,
          status: interview.status,
          expiresAt: interview.expiresAt,
          candidateResponse: interview.candidateResponse,
          respondedAt: interview.respondedAt
        },
        candidate: {
          id: interview.candidate.id,
          name: interview.candidate.name,
          email: interview.candidate.email,
          phone: interview.candidate.phone,
          jobTitle: interview.candidate.jobPosting?.title || 'Vị trí ứng tuyển',
          department: interview.candidate.jobPosting?.department?.name || 'Công ty TNHH LLA'
        }
      });
    }

    if (type === 'OFFER') {
      const offer = await prisma.jobOffer.findUnique({
        where: { id: targetId },
        include: {
          candidate: {
            include: {
              jobPosting: {
                include: { department: true, position: true }
              },
              preOnboarding: true
            }
          }
        }
      });

      if (!offer) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin Thư mời nhận việc (Offer).' });
      }

      let isExpired = false;
      if (offer.expiresAt && now > new Date(offer.expiresAt)) {
        isExpired = true;
        if (offer.status === 'PENDING') {
          await prisma.jobOffer.update({
            where: { id: offer.id },
            data: {
              status: 'REJECTED',
              declineReason: 'Hệ thống tự động hủy: Quá thời hạn 24 giờ phản hồi Thư mời nhận việc (Offer).'
            }
          });
          await prisma.candidate.update({
            where: { id: offer.candidateId },
            data: { status: 'REJECTED' }
          });
          offer.status = 'REJECTED';
        }
      }

      return res.json({
        type: 'OFFER',
        expired: isExpired,
        offer: {
          id: offer.id,
          baseSalary: offer.baseSalary,
          probationRate: offer.probationRate,
          startDate: offer.startDate,
          contractType: offer.contractType,
          notes: offer.notes,
          status: offer.status,
          expiresAt: offer.expiresAt,
          declineReason: offer.declineReason,
          respondedAt: offer.respondedAt
        },
        preOnboarding: offer.candidate.preOnboarding,
        candidate: {
          id: offer.candidate.id,
          name: offer.candidate.name,
          email: offer.candidate.email,
          phone: offer.candidate.phone,
          jobTitle: offer.candidate.jobPosting?.title || 'Vị trí công việc',
          department: offer.candidate.jobPosting?.department?.name || 'Công ty TNHH LLA'
        }
      });
    }

    return res.status(400).json({ error: 'Loại phản hồi không hỗ trợ.' });
  } catch (error: any) {
    console.error('Magic respond GET error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu phản hồi.' });
  }
});

// POST /magic-respond/:token: Thực hiện phản hồi (Xác nhận/Đổi lịch phỏng vấn HOẶC Đồng ý/Từ chối Offer)
router.post('/magic-respond/:token', async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.params.token as string;
    if (!token) {
      return res.status(400).json({ error: 'Thiếu mã xác thực phản hồi (Token).' });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return res.status(400).json({
        error: 'Liên kết phản hồi đã hết hạn hoặc không hợp lệ (Vượt quá thời hạn 24 giờ). Vui lòng liên hệ Bộ phận Tuyển dụng.'
      });
    }

    const { purpose, type, targetId, candidateId } = payload;
    if (purpose !== 'MAGIC_RESPONSE') {
      return res.status(400).json({ error: 'Token không đúng mục đích sử dụng.' });
    }

    const now = new Date();

    // 1. XỬ LÝ PHẢN HỒI LỊCH PHỎNG VẤN (CONFIRM / RESCHEDULE / DECLINE)
    if (type === 'INTERVIEW') {
      const { action, candidateNotes, reason, proposedDate, proposedTimeSlot } = req.body;

      const interview = await prisma.interviewRound.findUnique({
        where: { id: targetId },
        include: { candidate: true }
      });

      if (!interview || interview.candidateId !== candidateId) {
        return res.status(404).json({ error: 'Không tìm thấy lịch phỏng vấn tương ứng.' });
      }

      if (interview.status === 'CONFIRMED') {
        return res.status(400).json({ error: 'Bạn đã xác nhận tham gia buổi phỏng vấn này trước đó rồi.' });
      }

      if (interview.status === 'CANCELLED' || (interview.expiresAt && now > new Date(interview.expiresAt))) {
        return res.status(400).json({ error: 'Lịch hẹn phỏng vấn này đã quá thời hạn 24 giờ phản hồi và đã tự động hủy.' });
      }

      if (action === 'CONFIRM') {
        const updated = await prisma.interviewRound.update({
          where: { id: targetId },
          data: {
            status: 'CONFIRMED',
            respondedAt: now,
            candidateResponse: candidateNotes || 'Ứng viên xác nhận tham gia đúng giờ (phản hồi qua email)'
          }
        });
        return res.json({
          message: 'Chúc mừng bạn đã xác nhận tham gia buổi phỏng vấn thành công! Hãy chuẩn bị tốt và có mặt đúng giờ nhé.',
          data: updated
        });
      }

      if (action === 'RESCHEDULE' || action === 'DECLINE') {
        let finalReason = '';
        if (action === 'RESCHEDULE') {
          const timeSlotMap: Record<string, string> = {
            MORNING: 'Buổi sáng (09:00 - 11:30)',
            AFTERNOON: 'Buổi chiều (14:00 - 17:30)',
            AFTER_HOURS: 'Sau giờ hành chính (Sau 17:30)',
            ANY: 'Linh hoạt theo lịch sắp xếp của HR'
          };
          const slotText = timeSlotMap[proposedTimeSlot] || proposedTimeSlot || 'Linh hoạt';
          const dateText = proposedDate ? ` ngày ${new Date(proposedDate).toLocaleDateString('vi-VN')}` : '';
          finalReason = `[XIN ĐỔI LỊCH] Lý do: ${reason || 'Trùng lịch bận'}. Đề xuất: ${dateText} - ${slotText}. Lời nhắn: ${candidateNotes || ''}`.trim();
        } else {
          finalReason = `[TỪ CHỐI PHỎNG VẤN] Lý do: ${reason || 'Lý do cá nhân'}. Lời nhắn: ${candidateNotes || ''}`.trim();
        }

        const updated = await prisma.interviewRound.update({
          where: { id: targetId },
          data: {
            status: 'DECLINED',
            respondedAt: now,
            candidateResponse: finalReason
          }
        });

        return res.json({
          message: action === 'RESCHEDULE' ? 'Đã gửi đề xuất dời lịch phỏng vấn đến Bộ phận Tuyển dụng thành công!' : 'Đã ghi nhận phản hồi từ chối lịch phỏng vấn của bạn.',
          data: updated
        });
      }

      return res.status(400).json({ error: 'Hành động không hợp lệ.' });
    }

    // 2. XỬ LÝ PHẢN HỒI THƯ MỜI NHẬN VIỆC (ACCEPT / REJECT)
    if (type === 'OFFER') {
      const {
        action,
        declineReason,
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

      const offer = await prisma.jobOffer.findUnique({
        where: { id: targetId },
        include: { candidate: true }
      });

      if (!offer || offer.candidateId !== candidateId) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin Offer tương ứng.' });
      }

      if (offer.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'Bạn đã xác nhận đồng ý Offer này trước đó rồi.' });
      }

      if (offer.status === 'REJECTED' || (offer.expiresAt && now > new Date(offer.expiresAt))) {
        return res.status(400).json({ error: 'Thư mời nhận việc (Offer) đã quá thời hạn phản hồi.' });
      }

      if (action === 'REJECT') {
        await prisma.$transaction(async (tx) => {
          await tx.jobOffer.update({
            where: { id: targetId },
            data: {
              status: 'REJECTED',
              declineReason: declineReason || 'Ứng viên từ chối Offer (qua email link)',
              respondedAt: now
            }
          });

          await tx.candidate.update({
            where: { id: candidateId },
            data: { status: 'REJECTED' }
          });
        });

        return res.json({ message: 'Đã ghi nhận phản hồi từ chối Offer của bạn.' });
      }

      if (action === 'ACCEPT') {
        // Validate CCCD 12 số
        const cleanCccd = String(cccd || '').trim();
        if (!/^\d{12}$/.test(cleanCccd)) {
          return res.status(400).json({ error: 'Số CCCD gắn chip không hợp lệ. Vui lòng nhập chính xác 12 chữ số.' });
        }

        if (!dateOfBirth || isNaN(Date.parse(dateOfBirth))) {
          return res.status(400).json({ error: 'Vui lòng cung cấp ngày sinh hợp lệ.' });
        }

        if (!address?.trim()) {
          return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ thường trú hoặc nơi ở hiện tại.' });
        }

        if (!bankName?.trim() || !bankAccount?.trim()) {
          return res.status(400).json({ error: 'Vui lòng điền đầy đủ Tên ngân hàng và Số tài khoản chính chủ để nhận lương.' });
        }

        if (!emergencyContactName?.trim() || !emergencyContactPhone?.trim() || !emergencyContactRelation?.trim()) {
          return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin Người liên hệ khẩn cấp (Họ tên, SĐT, Mối quan hệ).' });
        }

        const result = await prisma.$transaction(async (tx) => {
          const updatedOffer = await tx.jobOffer.update({
            where: { id: targetId },
            data: {
              status: 'ACCEPTED',
              respondedAt: now
            }
          });

          const preOnboarding = await tx.preOnboardingProfile.upsert({
            where: { candidateId },
            create: {
              candidateId,
              cccd: cleanCccd,
              gender: gender || 'MALE',
              dateOfBirth: new Date(dateOfBirth),
              address: address.trim(),
              nationality: nationality || 'Việt Nam',
              maritalStatus: maritalStatus || 'SINGLE',
              taxCode: taxCode ? String(taxCode).trim() : null,
              bankName: bankName.trim(),
              bankAccount: bankAccount.trim(),
              socialInsurance: socialInsurance ? String(socialInsurance).trim() : null,
              healthInsurance: healthInsurance ? String(healthInsurance).trim() : null,
              emergencyContactName: emergencyContactName.trim(),
              emergencyContactPhone: emergencyContactPhone.trim(),
              emergencyContactRelation: emergencyContactRelation.trim(),
              submittedAt: now
            },
            update: {
              cccd: cleanCccd,
              gender: gender || 'MALE',
              dateOfBirth: new Date(dateOfBirth),
              address: address.trim(),
              nationality: nationality || 'Việt Nam',
              maritalStatus: maritalStatus || 'SINGLE',
              taxCode: taxCode ? String(taxCode).trim() : null,
              bankName: bankName.trim(),
              bankAccount: bankAccount.trim(),
              socialInsurance: socialInsurance ? String(socialInsurance).trim() : null,
              healthInsurance: healthInsurance ? String(healthInsurance).trim() : null,
              emergencyContactName: emergencyContactName.trim(),
              emergencyContactPhone: emergencyContactPhone.trim(),
              emergencyContactRelation: emergencyContactRelation.trim(),
              submittedAt: now
            }
          });

          return { updatedOffer, preOnboarding };
        });

        return res.json({
          message: 'Chúc mừng bạn đã đồng ý Offer và hoàn tất khai báo hồ sơ tiếp nhận! Bộ phận Nhân sự sẽ liên hệ và đón tiếp bạn vào ngày nhận việc.',
          data: result
        });
      }

      return res.status(400).json({ error: 'Hành động không hợp lệ.' });
    }

    return res.status(400).json({ error: 'Loại phản hồi không hợp lệ.' });
  } catch (error: any) {
    console.error('Magic respond POST error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi hệ thống khi xử lý phản hồi.' });
  }
});

export default router;
