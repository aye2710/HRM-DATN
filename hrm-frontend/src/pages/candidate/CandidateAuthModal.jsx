import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Mail, User, Phone, CheckCircle, ArrowRight, ShieldCheck, Sparkles, KeyRound, RotateCcw, ArrowLeft, MailCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const CandidateAuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/candidate-auth/login', loginData);
      const { token, user } = res.data;
      localStorage.setItem('candidateToken', token);
      localStorage.setItem('candidateUser', JSON.stringify(user));
      toast.success(`Xin chào, ${user.name}!`);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
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
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Card */}
        <div
          style={{
            padding: '1.75rem 1.75rem 1.25rem 1.75rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(124, 58, 237, 0.04) 100%)',
            borderBottom: '1px solid var(--border)',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {tab === 'login' ? 'Cổng thông tin Ứng viên' : 'Đăng ký tài khoản'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Theo dõi tiến độ tuyển dụng & nhận thư mời Offer
              </p>
            </div>
          </div>

          {/* Segmented Control Pill */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '9999px',
              padding: '3px',
              marginTop: '1rem',
              border: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              onClick={() => { setTab('login'); setRegisterStep('form'); setOtp(''); }}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '9999px',
                padding: '0.45rem 0',
                fontSize: '0.8125rem',
                fontWeight: tab === 'login' ? 600 : 500,
                color: tab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: tab === 'login' ? '#FFFFFF' : 'transparent',
                boxShadow: tab === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '9999px',
                padding: '0.45rem 0',
                fontSize: '0.8125rem',
                fontWeight: tab === 'register' ? 600 : 500,
                color: tab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: tab === 'register' ? '#FFFFFF' : 'transparent',
                boxShadow: tab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Đăng ký mới
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div style={{ padding: '1.5rem 1.75rem 1.75rem 1.75rem' }}>
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Email ứng tuyển</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderRadius: '0.625rem' }}
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderRadius: '0.625rem' }}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '0.625rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                {loading ? 'Đang xác thực...' : (
                  <>
                    Đăng nhập tài khoản <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : registerStep === 'form' ? (
            /* BƯỚC 1: ĐIỀN THÔNG TIN ĐĂNG KÝ */
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Họ và tên *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderRadius: '0.625rem' }}
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email chính chủ (nhận mã OTP) *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="ungvien@gmail.com"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderRadius: '0.625rem' }}
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Số điện thoại</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    placeholder="0912345678"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderRadius: '0.625rem' }}
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    placeholder="≥ 6 ký tự"
                    className="form-input"
                    style={{ borderRadius: '0.625rem' }}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhập lại MK *</label>
                  <input
                    type="password"
                    required
                    placeholder="Khớp mật khẩu"
                    className="form-input"
                    style={{ borderRadius: '0.625rem' }}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '0.625rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginTop: '0.35rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                {sendingOtp ? 'Đang gửi mã OTP...' : (
                  <>
                    Tiếp tục: Nhận mã OTP <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* BƯỚC 2: NHẬP MÃ XÁC THỰC OTP */
            <form onSubmit={handleVerifyOtpAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setRegisterStep('form')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <ArrowLeft size={14} /> Sửa thông tin
                </button>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Bước 2/2: Xác thực email
                </span>
              </div>

              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '0.75rem',
                padding: '0.875rem 1rem',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MailCheck size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534', marginBottom: '2px' }}>
                  Kiểm tra hộp thư đến
                </div>
                <div style={{ fontSize: '0.78rem', color: '#374151' }}>
                  Mã 6 chữ số đã gửi đến: <strong style={{ color: '#1E40AF' }}>{registerData.email}</strong>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', display: 'block', marginBottom: '0.5rem' }}>
                  Nhập mã xác thực OTP (6 chữ số)
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="form-input"
                    style={{
                      height: '48px',
                      paddingLeft: '2.5rem',
                      borderRadius: '0.625rem',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      fontFamily: 'monospace',
                      color: 'var(--primary)'
                    }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Không nhận được mã?</span>
                {countdown > 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>
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
                      color: 'var(--primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RotateCcw size={13} /> Gửi lại mã OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '0.625rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  cursor: (loading || otp.trim().length !== 6) ? 'not-allowed' : 'pointer',
                  opacity: (otp.trim().length !== 6 && !loading) ? 0.65 : 1
                }}
              >
                {loading ? 'Đang kích hoạt...' : (
                  <>
                    <CheckCircle size={16} /> Xác nhận & Đăng ký
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
