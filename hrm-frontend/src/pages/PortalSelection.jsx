import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, User, Building2, LogIn, ArrowLeft, Shield, Eye, EyeOff, 
  CheckCircle2, Users, BarChart3, Clock, Sparkles 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const PortalSelection = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cập nhật title theo yêu cầu
  useEffect(() => {
    document.title = "Hệ Thống Quản Trị Nhân Sự Doanh Nghiệp (HRM)";
    return () => {
      document.title = "HRM Pro";
    };
  }, []);

  // Kiểm tra phiên đăng nhập hiện tại
  const currentToken = localStorage.getItem('token');
  const currentRole = localStorage.getItem('role');
  const currentFullName = localStorage.getItem('fullName');

  const handleLogoutCurrent = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('employeeCode');
    localStorage.removeItem('employeeId');
    toast.success('Đã đăng xuất tài khoản hiện tại.');
    window.location.reload();
  };

  const executeLogin = async (loginUser, loginPass) => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        username: loginUser.trim(), 
        password: loginPass 
      });
      
      const { token, user } = res.data;
      
      // Lưu thông tin phiên đăng nhập
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('fullName', user.fullName || loginUser);
      localStorage.setItem('employeeCode', user.employeeCode || '');
      localStorage.setItem('employeeId', res.data.user.employeeId || '');

      toast.success(`Chào mừng trở lại, ${user.fullName || loginUser}!`);

      // Điều hướng theo phân quyền vai trò
      if (user.role === 'EMPLOYEE') {
        toast('Tài khoản Nhân viên: Đang chuyển vào Cổng Nhân sự...', { icon: 'ℹ️' });
        navigate('/employee');
      } else {
        navigate('/internal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Tài khoản hoặc mật khẩu không chính xác.');
      toast.error('Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu.');
      return;
    }
    executeLogin(username, password);
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
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        padding: '2.5rem 2.25rem',
        position: 'relative'
      }}>
        {/* Top Header Link */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => navigate('/')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Trang chủ Tuyển dụng
          </button>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#1E40AF',
            backgroundColor: '#EFF6FF',
            padding: '4px 10px',
            borderRadius: '9999px'
          }}>
            Admin Portal
          </span>
        </div>
          
          {/* Header Tiêu Đề Form */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              width: 48, height: 48, 
              borderRadius: '0.75rem', 
              backgroundColor: '#EFF6FF', 
              color: '#2563EB', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Shield size={24} />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Đăng Nhập Quản Trị
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.925rem' }}>
              Hệ Thống Quản Trị Nhân Sự Doanh Nghiệp (HRM) - Dành riêng cho Ban Giám Đốc, Quản lý & HR Admin
            </p>
          </div>

          {/* Hộp Thông Báo Lỗi */}
          {error && (
            <div style={{ 
              padding: '0.85rem 1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#FEF2F2', 
              border: '1px solid #FCA5A5', 
              color: '#DC2626', 
              fontSize: '0.875rem', 
              marginBottom: '1.25rem' 
            }}>
              {error}
            </div>
          )}

          {/* Hộp Thông Báo Phiên Đang Đăng Nhập */}
          {currentToken && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                Đang có phiên đăng nhập: <strong>{currentFullName || 'Nhân viên'}</strong> ({currentRole})
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => navigate(currentRole === 'EMPLOYEE' ? '/employee' : '/internal')}
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Vào Cổng {currentRole}
                </button>
                <button
                  type="button"
                  onClick={handleLogoutCurrent}
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Input Tài Khoản */}
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.45rem' }}>
                Tài khoản nội bộ
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    paddingLeft: '44px', 
                    paddingRight: '14px',
                    borderRadius: '0.5rem',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.925rem',
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                    e.target.style.backgroundColor = '#FFFFFF';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = '#F8FAFC';
                  }}
                  placeholder="admin hoặc emp01"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Input Mật Khẩu */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Mật khẩu
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Mặc định: 123456</span>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    paddingLeft: '44px', 
                    paddingRight: '44px',
                    borderRadius: '0.5rem',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.925rem',
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                    e.target.style.backgroundColor = '#FFFFFF';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = '#F8FAFC';
                  }}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Nút Submit Đăng Nhập */}
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                height: '46px', 
                borderRadius: '0.5rem', 
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'background-color 0.2s, transform 0.1s',
                marginTop: '0.5rem'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
            >
              {loading ? (
                <>
                  <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  Đang xác thực bảo mật...
                </>
              ) : (
                <>
                  <LogIn size={18} /> Đăng nhập hệ thống
                </>
              )}
            </button>
          </form>

        {/* Footer bản quyền */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #E2E8F0',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#94A3B8'
        }}>
          © 2026 LLA HR Enterprise • Cổng Quản Trị Hệ Thống
        </div>

      </div>

    </div>
  );
};
