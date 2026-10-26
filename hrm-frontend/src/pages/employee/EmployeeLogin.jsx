import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, User, LogIn, ArrowLeft, Eye, EyeOff, 
  Users
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const EmployeeLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Kiểm tra phiên đăng nhập hiện tại
  const currentToken = localStorage.getItem('token');
  const currentRole = localStorage.getItem('role');
  const currentFullName = localStorage.getItem('fullName');

  useEffect(() => {
    document.title = "Cổng Nhân Sự | Đăng Nhập Cán Bộ Nhân Viên";
    return () => {
      document.title = "HRM Pro";
    };
  }, []);

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
      localStorage.setItem('employeeId', user.employeeId || '');

      toast.success(`Chào mừng trở lại, ${user.fullName || loginUser}!`);

      // Điều hướng theo phân quyền vai trò
      if (user.role === 'EMPLOYEE') {
        navigate('/employee');
      } else {
        toast('Tài khoản Quản trị: Đang chuyển vào Cổng Quản trị Doanh nghiệp...', { icon: 'ℹ️' });
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
      
      {/* Khung Đăng Nhập Căn Giữa Hiện Đại */}
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
            color: '#065F46',
            backgroundColor: '#ECFDF5',
            padding: '4px 10px',
            borderRadius: '9999px'
          }}>
            Cổng Nhân Sự LLA
          </span>
        </div>

        {/* Header Tiêu Đề Form */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ 
            width: 50, height: 50, 
            borderRadius: '0.75rem', 
            backgroundColor: '#ECFDF5', 
            color: '#059669', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 10px rgba(5, 150, 105, 0.15)'
          }}>
            <Users size={26} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Đăng Nhập Cổng Nhân Sự
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.925rem' }}>
            Dành cho Cán bộ & Nhân viên chính thức / thử việc tại LLA
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
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              Đang có phiên: <strong>{currentFullName || 'Nhân viên'}</strong> ({currentRole})
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => navigate(currentRole === 'EMPLOYEE' ? '/employee' : '/internal')}
                style={{
                  backgroundColor: '#059669',
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
              Mã nhân viên hoặc Tên tài khoản
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
                  borderRadius: '0.5rem', 
                  border: '1px solid #CBD5E1', 
                  padding: '0 1rem 0 2.6rem', 
                  fontSize: '0.9rem',
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="Ví dụ: emp01 hoặc mã nhân viên..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10B981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                  e.target.style.backgroundColor = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#F8FAFC';
                }}
              />
            </div>
          </div>

          {/* Input Mật Khẩu */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Mật khẩu
              </label>
              <span 
                onClick={() => toast('Vui lòng liên hệ Phòng Hành chính - Nhân sự (HR) để được hỗ trợ đặt lại mật khẩu.', { icon: '🔑', duration: 4500 })}
                style={{ fontSize: '0.78rem', color: '#059669', cursor: 'pointer', fontWeight: 500 }}
              >
                Quên mật khẩu?
              </span>
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
                type={showPassword ? "text" : "password"} 
                required
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #CBD5E1', 
                  padding: '0 2.75rem 0 2.6rem', 
                  fontSize: '0.9rem',
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10B981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                  e.target.style.backgroundColor = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#F8FAFC';
                }}
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
              backgroundColor: '#059669',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'background-color 0.2s, transform 0.1s',
              marginTop: '0.5rem'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Đang xác thực thông tin...
              </>
            ) : (
              <>
                <LogIn size={18} /> Đăng nhập Cổng Nhân sự
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
          © 2026 LLA HR Enterprise • Cổng Thông Tin Nhân Viên
        </div>

      </div>

    </div>
  );
};
