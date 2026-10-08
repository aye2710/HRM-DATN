import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Mail, User, Phone, CheckCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const CandidateAuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

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
      toast.success('Đăng ký tài khoản thành công!');
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
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
              onClick={() => setTab('login')}
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
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email *</label>
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
                disabled={loading}
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
                {loading ? 'Đang khởi tạo...' : (
                  <>
                    <CheckCircle size={16} /> Tạo tài khoản ứng viên
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
