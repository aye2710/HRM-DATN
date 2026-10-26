import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Lock, Mail, User, Phone, CheckCircle2, ArrowRight, ShieldCheck, 
  Sparkles, ArrowLeft, Eye, EyeOff, Briefcase, Award, Rocket, Check, HelpCircle,
  KeyRound, RotateCcw, MailCheck
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const CandidateAuthPage = ({ defaultTab = 'login' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const redirectParam = searchParams.get('redirect') || '/?view=apps';

  const [tab, setTab] = useState(modeParam || defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification states
  const [registerStep, setRegisterStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    document.title = tab === 'login' 
      ? 'Đăng nhập Ứng viên | Cổng tuyển dụng LLA' 
      : 'Đăng ký tài khoản Ứng viên | Cổng tuyển dụng LLA';
    return () => { document.title = 'HRM Pro'; };
  }, [tab]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/candidate-auth/login', loginData);
      const { token, user } = res.data;
      localStorage.setItem('candidateToken', token);
      localStorage.setItem('candidateUser', JSON.stringify(user));
      toast.success(`Chào mừng trở lại, ${user.name}!`);
      navigate(redirectParam);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!registerData.name?.trim()) {
      return toast.error('Vui lòng nhập họ và tên của bạn.');
    }
    if (!registerData.email?.trim()) {
      return toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
    }
    if (registerData.password !== registerData.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp.');
    }
    if (registerData.password.length < 6) {
      return toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    setSendingOtp(true);
    try {
      const res = await axios.post('http://localhost:5000/api/candidate-auth/send-register-otp', {
        name: registerData.name,
        email: registerData.email
      });
      toast.success(res.data.message || 'Mã xác thực OTP đã được gửi về email của bạn!');
      setRegisterStep('otp');
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      return toast.error('Vui lòng nhập chính xác 6 chữ số mã OTP.');
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/candidate-auth/register', {
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        otp: otp.trim()
      });
      const { token, user } = res.data;
      localStorage.setItem('candidateToken', token);
      localStorage.setItem('candidateUser', JSON.stringify(user));
      toast.success('Xác thực email và tạo tài khoản ứng viên thành công!');
      navigate(redirectParam);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      backgroundColor: '#F8FAFC',
      backgroundImage: `
        radial-gradient(at 15% 15%, rgba(37, 99, 235, 0.08) 0px, transparent 50%),
        radial-gradient(at 85% 85%, rgba(99, 102, 241, 0.08) 0px, transparent 50%)
      `,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        padding: '2.5rem 2.25rem',
        position: 'relative',
        zIndex: 2
      }}>
            
            {/* Header Mobile / Back Link */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link 
                to="/" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#64748B',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <ArrowLeft size={16} /> Trang chủ Tuyển dụng
              </Link>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#2563EB',
                backgroundColor: '#EFF6FF',
                padding: '4px 10px',
                borderRadius: '9999px'
              }}>
                Ứng viên LLA
              </span>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 0.4rem 0',
                letterSpacing: '-0.02em'
              }}>
                {tab === 'login' ? 'Đăng nhập Ứng viên' : 'Đăng ký tài khoản mới'}
              </h1>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {tab === 'login' 
                  ? 'Đăng nhập để xem danh sách hồ sơ, lịch phỏng vấn và Offer của bạn.'
                  : 'Tạo tài khoản để tham gia mạng lưới nhân tài và nộp hồ sơ nhanh chóng.'}
              </p>
            </div>

            {/* Tab Switcher (Đăng nhập / Đăng ký) */}
            <div style={{
              display: 'flex',
              padding: '4px',
              backgroundColor: '#F1F5F9',
              borderRadius: '0.625rem',
              marginBottom: '1.5rem',
              border: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setRegisterStep('form'); setOtp(''); }}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: tab === 'login' ? '#FFFFFF' : 'transparent',
                  color: tab === 'login' ? '#2563EB' : '#64748B',
                  boxShadow: tab === 'login' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: tab === 'register' ? '#FFFFFF' : 'transparent',
                  color: tab === 'register' ? '#2563EB' : '#64748B',
                  boxShadow: tab === 'register' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Đăng ký tài khoản
              </button>
            </div>

            {/* TAB: LOGIN */}
            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.4rem' }}>
                    Email ứng tuyển
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="ungvien@example.com"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 1rem 0 2.6rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>
                      Mật khẩu
                    </label>
                    <span 
                      style={{ fontSize: '0.75rem', color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => toast('Để đặt lại mật khẩu, vui lòng liên hệ phòng nhân sự qua email: tuyendung@lla.vn')}
                    >
                      Quên mật khẩu?
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="Nhập mật khẩu của bạn"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 2.6rem 0 2.6rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: '46px',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.925rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    marginTop: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563EB')}
                >
                  {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'} <ArrowRight size={17} />
                </button>
              </form>
            ) : registerStep === 'form' ? (
              /* TAB: REGISTER - BƯỚC 1: ĐIỀN THÔNG TIN */
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                    Họ và tên ứng viên <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      required
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 1rem 0 2.6rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                      Email nhận mã OTP <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="ungvien@gmail.com"
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 0.75rem 0 2.3rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                      Số điện thoại
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="0988..."
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 0.75rem 0 2.3rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                    Mật khẩu (tối thiểu 6 ký tự) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 2.5rem 0 2.6rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                    Xác nhận mật khẩu <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 2.5rem 0 2.6rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                  <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>Dữ liệu cá nhân được mã hóa an toàn và bảo mật theo tiêu chuẩn doanh nghiệp.</span>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  style={{
                    height: '46px',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.925rem',
                    fontWeight: 700,
                    cursor: sendingOtp ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    marginTop: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !sendingOtp && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                  onMouseLeave={(e) => !sendingOtp && (e.currentTarget.style.backgroundColor = '#2563EB')}
                >
                  {sendingOtp ? 'Đang gửi mã xác thực...' : 'Tiếp tục: Nhận mã OTP qua Email'} <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              /* TAB: REGISTER - BƯỚC 2: NHẬP MÃ XÁC THỰC OTP */
              <form onSubmit={handleVerifyOtpAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => setRegisterStep('form')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748B',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <ArrowLeft size={15} /> Sửa thông tin đăng ký
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={15} /> Bước 2/2: Xác thực email
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(22, 101, 52, 0.15)'
                    }}>
                      <MailCheck size={22} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534', marginBottom: '3px' }}>
                    Kiểm tra hộp thư đến của bạn
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#374151' }}>
                    Mã xác thực 6 chữ số đã được gửi đến:
                    <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.9rem', marginTop: '2px' }}>
                      {registerData.email}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                    (Vui lòng kiểm tra hộp thư đến hoặc hòm thư rác/spam)
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#1E293B', textAlign: 'center', marginBottom: '0.5rem' }}>
                    Nhập mã xác thực OTP (6 chữ số)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={20} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        height: '52px',
                        padding: '0 1rem 0 3rem',
                        borderRadius: '0.625rem',
                        border: '2px solid #93C5FD',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        letterSpacing: '10px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        backgroundColor: '#FFFFFF',
                        color: '#1E40AF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748B' }}>Chưa nhận được mã?</span>
                  {countdown > 0 ? (
                    <span style={{ color: '#64748B', fontWeight: 500 }}>
                      Gửi lại sau <strong>{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={sendingOtp}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#2563EB',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <RotateCcw size={14} /> Gửi lại mã OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.trim().length !== 6}
                  style={{
                    height: '46px',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.925rem',
                    fontWeight: 700,
                    cursor: (loading || otp.trim().length !== 6) ? 'not-allowed' : 'pointer',
                    opacity: (otp.trim().length !== 6 && !loading) ? 0.65 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (!loading && otp.trim().length === 6) && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                  onMouseLeave={(e) => (!loading && otp.trim().length === 6) && (e.currentTarget.style.backgroundColor = '#2563EB')}
                >
                  {loading ? 'Đang kích hoạt...' : 'Xác nhận & Hoàn tất Đăng ký'} <CheckCircle2 size={17} />
                </button>
              </form>
            )}

            {/* Chuyển đổi Đăng nhập / Đăng ký */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748B' }}>
              {tab === 'login' ? (
                <>
                  Chưa có tài khoản ứng viên?{' '}
                  <span
                    onClick={() => setTab('register')}
                    style={{ color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đăng ký ngay
                  </span>
                </>
              ) : (
                <>
                  Đã có tài khoản ứng viên?{' '}
                  <span
                    onClick={() => setTab('login')}
                    style={{ color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đăng nhập tại đây
                  </span>
                </>
              )}
            </div>

            {/* Footer bản quyền */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#94A3B8'
            }}>
              © 2026 LLA HR Enterprise • Cổng Ứng viên Tuyển dụng
            </div>

        </div>

    </div>
  );
};
