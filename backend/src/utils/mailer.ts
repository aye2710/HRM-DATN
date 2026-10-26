import nodemailer from 'nodemailer';

interface WelcomeEmailParams {
  to: string;
  fullName: string;
  employeeCode: string;
  username: string;
  temporaryPassword: string;
  positionTitle?: string;
  departmentName?: string;
}

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user,
      pass
    }
  });
};

export const sendWelcomeAccountEmail = async ({
  to,
  fullName,
  employeeCode,
  username,
  temporaryPassword,
  positionTitle = 'Nhân sự mới',
  departmentName = 'Trụ sở chính'
}: WelcomeEmailParams): Promise<{ success: boolean; simulated?: boolean; error?: string }> => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173/employee/login';
  const from = process.env.EMAIL_FROM || `"Công ty TNHH LLA - Phòng Nhân Sự" <${process.env.SMTP_USER || 'xongtruc2004@gmail.com'}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .box-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; margin: 0 0 14px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
        .info-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #64748b; font-weight: 500; }
        .info-value { color: #0f172a; font-weight: 700; font-family: monospace; font-size: 15px; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 32px; borderRadius: 8px; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.3); }
        .notice { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; font-size: 13px; color: #92400e; border-radius: 4px; margin-bottom: 20px; }
        .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>CÔNG TY TNHH LLA</h1>
          <p>Hệ Thống Quản Trị Nhân Sự Doanh Nghiệp (Enterprise HRM Portal)</p>
        </div>
        <div class="content">
          <div class="greeting">Kính gửi Anh/Chị ${fullName},</div>
          <div class="text">
            Chào mừng Anh/Chị đã chính thức gia nhập đại gia đình <strong>Công ty TNHH LLA</strong> với vị trí <strong>${positionTitle}</strong> thuộc <strong>${departmentName}</strong>!
            <br><br>
            Phòng Nhân sự đã khởi tạo tài khoản Cổng Thông tin Nhân viên (Employee Self-Service) để Anh/Chị truy cập quản lý hồ sơ, theo dõi hợp đồng, chấm công và phiếu lương cá nhân.
          </div>

          <div class="box">
            <div class="box-title">Thông tin tài khoản đăng nhập</div>
            <div class="info-row">
              <span class="info-label">Mã nhân viên:</span>
              <span class="info-value" style="color: #2563eb;">${employeeCode}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tên đăng nhập (Username):</span>
              <span class="info-value">${username}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mật khẩu khởi tạo:</span>
              <span class="info-value" style="color: #dc2626; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">${temporaryPassword}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${portalUrl}" class="btn" target="_blank">ĐĂNG NHẬP CỔNG NHÂN SỰ</a>
          </div>

          <div class="notice">
            🔒 <strong>Lưu ý bảo mật:</strong> Vì lý do an toàn thông tin, vui lòng đăng nhập và đổi mật khẩu mới trong vòng 24 giờ kể từ khi nhận được email này.
          </div>

          <div class="text" style="font-size: 13px; margin-bottom: 0;">
            Nếu gặp khó khăn trong quá trình đăng nhập, Anh/Chị vui lòng liên hệ trực tiếp với Phòng Nhân sự hoặc Bộ phận IT Support để được hỗ trợ.
          </div>
        </div>
        <div class="footer">
          © 2026 Công ty TNHH LLA. Email này được gửi tự động từ Hệ thống Quản trị Nhân sự LLA HRM.
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n================================================================');
    console.log('📧 [GMAIL SIMULATION] THÔNG BÁO TÀI KHOẢN NHÂN SỰ MỚI');
    console.log(`Gửi tới: ${to} (Họ tên: ${fullName})`);
    console.log(`Mã NV: ${employeeCode} | Username: ${username} | Mật khẩu: ${temporaryPassword}`);
    console.log('Link portal:', portalUrl);
    console.log('ℹ️ Ghi chú: Điền 16 ký tự Google App Password vào SMTP_PASS trong backend/.env để bắn mail thật.');
    console.log('================================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const plainText = `Kính gửi Anh/Chị ${fullName},\n\nChào mừng Anh/Chị đã chính thức gia nhập Công ty TNHH LLA (${positionTitle} - ${departmentName})!\n\nThông tin tài khoản Cổng Nhân sự (Employee Self-Service):\n- Mã nhân viên: ${employeeCode}\n- Tên đăng nhập: ${username}\n- Mật khẩu khởi tạo: ${temporaryPassword}\n- Link đăng nhập: ${portalUrl}\n\nVui lòng đăng nhập và đổi mật khẩu trong vòng 24 giờ.\n\nTrân trọng,\nPhòng Nhân sự - Công ty TNHH LLA`;

    const info = await transporter.sendMail({
      from,
      to,
      subject: `Thông tin Tài khoản Cổng Nhân sự LLA - ${fullName} (${employeeCode})`,
      text: plainText,
      html: htmlContent
    });
    console.log(`✅ [GMAIL SENT] Đã gửi email tài khoản tới ${to} (MessageId: ${info.messageId})`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error('❌ [GMAIL ERROR] Lỗi khi gửi email chào mừng:', error.message);
    return { success: false, error: error.message };
  }
};

interface VerificationOtpParams {
  to: string;
  name: string;
  otpCode: string;
}

export const sendCandidateVerificationOtpEmail = async ({
  to,
  name,
  otpCode
}: VerificationOtpParams): Promise<{ success: boolean; simulated?: boolean; error?: string }> => {
  const from = process.env.EMAIL_FROM || `"Tuyển dụng LLA" <${process.env.SMTP_USER || 'xongtruc2004@gmail.com'}>`;

  const plainText = `Xin chào ${name || 'Bạn'},\n\nMã xác thực OTP của bạn tại Cổng Tuyển Dụng Công ty TNHH LLA là: ${otpCode}\n\nMã này có hiệu lực trong vòng 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nBộ phận Tuyển Dụng - Công ty TNHH LLA`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .otp-box { text-align: center; background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px 16px; margin: 20px 0; }
        .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; margin-bottom: 10px; }
        .otp-code { font-family: 'Consolas', 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534; }
        .otp-expiry { font-size: 12px; color: #dc2626; margin-top: 10px; font-weight: 600; }
        .notice { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 14px; font-size: 13px; color: #991b1b; border-radius: 4px; margin-top: 20px; line-height: 1.5; }
        .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>CÔNG TY TNHH LLA</h1>
          <p>Cổng Tuyển Dụng & Ứng Tuyển Trực Tuyến</p>
        </div>
        <div class="content">
          <div class="greeting">Kính chào ${name || 'Anh/Chị'},</div>
          <div class="text">
            Bạn đang thực hiện đăng ký tài khoản ứng viên tại <strong>Cổng Tuyển Dụng Công ty TNHH LLA</strong>. Để hoàn tất xác minh địa chỉ email chính chủ và bảo vệ hồ sơ ứng tuyển của bạn, vui lòng nhập mã xác thực OTP sau:
          </div>

          <div class="otp-box">
            <div class="otp-label">MÃ XÁC THỰC OTP (6 CHỮ SỐ)</div>
            <div class="otp-code">${otpCode}</div>
            <div class="otp-expiry">⏱ Mã này có hiệu lực trong vòng 5 phút</div>
          </div>

          <div class="notice">
            🔒 <strong>Bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Bộ phận Tuyển dụng LLA không bao giờ yêu cầu bạn cung cấp mã xác thực qua điện thoại hay tin nhắn.
          </div>

          <div class="text" style="font-size: 13px; color: #64748b; margin-top: 16px; margin-bottom: 0;">
            Nếu bạn không yêu cầu đăng ký tài khoản trên Cổng Tuyển Dụng LLA, vui lòng bỏ qua email này.
          </div>
        </div>
        <div class="footer">
          © 2026 Công ty TNHH LLA. Thư xác thực được gửi tự động từ LLA Recruitment System.
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n================================================================');
    console.log('📧 [GMAIL SIMULATION] MÃ XÁC THỰC OTP ỨNG VIÊN');
    console.log(`Gửi tới: ${to} (Họ tên: ${name})`);
    console.log(`MÃ OTP: ${otpCode} (Hiệu lực 5 phút)`);
    console.log('================================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Mã xác thực OTP tài khoản Tuyển dụng LLA: ${otpCode}`,
      text: plainText,
      html: htmlContent
    });
    console.log(`✅ [GMAIL SENT] Đã gửi mã OTP (${otpCode}) tới ${to} (MessageId: ${info.messageId})`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error('❌ [GMAIL ERROR] Lỗi khi gửi OTP xác thực:', error.message);
    return { success: false, error: error.message };
  }
};

