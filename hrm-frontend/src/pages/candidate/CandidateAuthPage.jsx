import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Lock, Mail, User, Phone, CheckCircle2, ArrowRight, ShieldCheck, 
  Sparkles, ArrowLeft, Eye, EyeOff, Briefcase, Award, Rocket, Check, HelpCircle
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
    document.title = tab === 'login' 
      ? 'Đăng nhập Ứng viên | Cổng tuyển dụng LLA' 
      : 'Đăng ký tài khoản Ứng viên | Cổng tuyển dụng LLA';
    return () => { document.title = 'HRM Pro'; };
  }, [tab]);

  // Demo fill helper
  const handleFillDemoCandidate = () => {
    setLoginData({
      email: 'candidate@example.com',
      password: 'password123'
    });
    toast.success('Đã điền tài khoản ứng viên mẫu!');
  };

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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp.');
    }
    if (registerData.password.length < 6) {
      return toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/candidate-auth/register', {
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password
      });
      const { token, user } = res.data;
      localStorage.setItem('candidateToken', token);
      localStorage.setItem('candidateUser', JSON.stringify(user));
      toast.success('Đăng ký tài khoản ứng viên thành công!');
      navigate(redirectParam);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#F8FAFC',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      <style>{`
        .candidate-auth-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }
        .candidate-showcase-panel {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          background: linear-gradient(145deg, #0B132B 0%, #1C2541 50%, #1E3A8A 100%);
          color: #FFFFFF;
          padding: 3.5rem 3.5rem;
          position: relative;
          overflow: hidden;
        }
        .candidate-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justifyContent: center;
          alignItems: center;
          background-color: #FFFFFF;
          padding: 2.5rem 2rem;
          position: relative;
          overflow-y: auto;
        }
        @media (max-width: 1024px) {
          .candidate-showcase-panel {
            display: none !important;
          }
          .candidate-form-panel {
            flex: 1 1 100% !important;
            padding: 3rem 1.5rem !important;
            background-color: #F8FAFC !important;
          }
          .candidate-form-card {
            background-color: #FFFFFF !important;
            padding: 2.5rem 2rem !important;
            border-radius: 1.25rem !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px #E2E8F0 !important;
          }
        }
      `}</style>

      <div className="candidate-auth-wrapper">
        
        {/* CỘT TRÁI: Showcase Banner Đẳng cấp (Sáng rõ, tương phản cao) */}
        <div className="candidate-showcase-panel">
          {/* Ambient Lighting */}
          <div style={{
            position: 'absolute',
            top: '-15%',
            left: '-15%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-15%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Top Brand Info */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Link 
              to="/" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#93C5FD',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '2rem',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={16} /> Quay lại Cổng Tuyển dụng LLA
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.4)'
              }}>
                LLA
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', display: 'block', letterSpacing: '-0.01em' }}>
                  LLA Talent Community
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Cổng kết nối Cơ hội Việc làm & Nhân tài
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Highlights */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px', margin: '2rem 0' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#93C5FD',
              fontSize: '0.8125rem',
              fontWeight: 700,
              marginBottom: '1.5rem'
            }}>
              <Sparkles size={15} /> Trải nghiệm Ứng tuyển Số hóa Toàn diện
            </div>

            {/* CHỮ TIÊU ĐỀ RÕ RÀNG VỚI MÀU TRẮNG TINH KHÔI */}
            <h2 style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
              color: '#FFFFFF'
            }}>
              Kết nối ước mơ, <br />
              <span style={{
                background: 'linear-gradient(90deg, #60A5FA 0%, #C084FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                bứt phá sự nghiệp tại LLA.
              </span>
            </h2>

            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '2rem' }}>
              Theo dõi toàn diện quy trình ứng tuyển từ lúc nộp hồ sơ, lịch phỏng vấn đến nhận Offer và chuẩn bị ngày đầu tiên đi làm.
            </p>

            {/* 3 Khối Tính Năng Nổi Bật */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.3)',
                  color: '#60A5FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Rocket size={19} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', display: 'block', marginBottom: '0.2rem' }}>
                    Theo dõi tiến độ realtime
                  </strong>
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.45, display: 'block' }}>
                    Biết ngay hồ sơ đang ở vòng Sơ loại, Kiểm tra chuyên môn hay Phỏng vấn.
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.3)',
                  color: '#4ADE80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Award size={19} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', display: 'block', marginBottom: '0.2rem' }}>
                    Nhận & Phản hồi Offer trực tuyến
                  </strong>
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.45, display: 'block' }}>
                    Minh bạch mức lương, phụ cấp, hợp đồng thử việc và xác nhận nhận việc 1-chạm.
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.3)',
                  color: '#FBBF24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', display: 'block', marginBottom: '0.2rem' }}>
                    Khảo sát Pre-onboarding tiện lợi
                  </strong>
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.45, display: 'block' }}>
                    Đăng ký thiết bị máy tính, size đồng phục trước ngày đi làm đầu tiên.
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            color: '#94A3B8'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="#4ADE80" /> Bảo mật theo Nghị định 13/2023/NĐ-CP
            </span>
            <span>Hotline: 024 8888 9999</span>
          </div>
        </div>

        {/* CỘT PHẢI: Form Đăng nhập & Đăng ký (Rộng rãi, dễ đọc, căn giữa hoàn hảo) */}
        <div className="candidate-form-panel">
          
          <div className="candidate-form-card" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
            
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
                onClick={() => setTab('login')}
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

                {/* Nút Demo Autofill Nhanh */}
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F0F9FF',
                  borderRadius: '0.5rem',
                  border: '1px dashed #7DD3FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#0369A1', lineHeight: 1.4 }}>
                    💡 <strong>Tài khoản Demo:</strong> Điền nhanh để kiểm tra hệ thống
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemoCandidate}
                    style={{
                      border: 'none',
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Điền mẫu
                  </button>
                </div>
              </form>
            ) : (
              /* TAB: REGISTER */
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
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
                      Email <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="email@..."
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
                  <span>Dữ liệu cá nhân được mã hóa và bảo vệ nghiêm ngặt theo Nghị định 13/2023/NĐ-CP.</span>
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
                  {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất Đăng ký'} <Sparkles size={17} />
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

      </div>
    </div>
  );
};
