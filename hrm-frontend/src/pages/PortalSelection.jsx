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
        username: loginUser, 
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

  // Tính năng 1-Click Demo Login
  const handleQuickLogin = (demoRole) => {
    if (demoRole === 'ADMIN') {
      setUsername('admin');
      setPassword('123456');
      executeLogin('admin', '123456');
    } else {
      setUsername('emp01');
      setPassword('123456');
      executeLogin('emp01', '123456');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      backgroundColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* CỘT TRÁI: Brand & Feature Highlights (Split Layout đẳng cấp) */}
      <div style={{ 
        flex: '1.1', 
        background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)', 
        color: '#FFFFFF', 
        padding: '3.5rem 4rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient background glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '450px', height: '450px', background: '#2563EB', opacity: 0.15, filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '450px', height: '450px', background: '#7C3AED', opacity: 0.12, filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Top Brand Logo */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: 44, height: 44, 
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)', 
              borderRadius: '0.75rem', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#FFFFFF', fontWeight: 800, fontSize: '1.4rem',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.35)'
            }}>
              L
            </div>
            <div>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'block', lineHeight: 1.1 }}>
                LLA Enterprise HRM
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>
                Hệ Thống Quản Trị Nhân Sự Doanh Nghiệp Toàn Diện
              </span>
            </div>
          </div>
        </div>

        {/* Center Content: Features List */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '520px', margin: '2rem 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', backgroundColor: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            <Sparkles size={14} /> Nền tảng số hóa quản trị nhân lực 2026
          </div>

          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
            Tự động hóa vận hành, <br/>
            <span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              tối ưu hiệu suất tổ chức.
            </span>
          </h2>
          
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Hệ sinh thái kết nối xuyên suốt từ Tuyển dụng thông minh (ATS), Hồ sơ điện tử, Ca kíp & Chấm công, Tính lương tự động đến Quản trị mục tiêu KPI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80', marginTop: '2px', flexShrink: 0 }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#F1F5F9', display: 'block' }}>Hồ sơ Core HR & Cơ cấu Tổ chức</strong>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Phân cấp phòng ban, chức vụ, hợp đồng và lộ trình hội nhập Onboarding.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', marginTop: '2px', flexShrink: 0 }}>
                <Clock size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#F1F5F9', display: 'block' }}>Chấm công & Tính lương Đa nguồn</strong>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Xử lý ca kíp linh hoạt, ân hạn đi muộn, tính thuế TNCN và bảo hiểm tự động.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', marginTop: '2px', flexShrink: 0 }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#F1F5F9', display: 'block' }}>Đánh giá Hiệu suất KPI & RBAC</strong>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Thiết lập chu kỳ KPI, chấm điểm minh bạch và phân quyền bảo mật chặt chẽ.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bên trái */}
        <div style={{ position: 'relative', zIndex: 10, fontSize: '0.8125rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <span>© 2026 LLA HRM Enterprise v2.4</span>
          <span>Bảo mật chuẩn ISO/IEC 27001</span>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng Nhập Sang Trọng & Chuẩn CSS */}
      <div style={{ 
        flex: '0.9', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '3rem 2.5rem',
        backgroundColor: '#FFFFFF',
        position: 'relative'
      }}>
        
        {/* Nút quay lại Cổng Tuyển Dụng trên góc trái */}
        <button 
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2.5rem',
            border: 'none',
            background: 'transparent',
            color: '#64748B',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          className="hover:bg-slate-100"
        >
          <ArrowLeft size={16} /> Về Cổng Tuyển Dụng LLA
        </button>

        {/* Container Form */}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
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
              Dành cho Quản trị viên (Admin) và Cán bộ Nhân viên nội bộ
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

          {/* Phân Cách & Tính Năng Đăng Nhập Nhanh 1-Chạm (Dành cho Chấm thi / Demo ĐATN) */}
          <div style={{ marginTop: '2rem', paddingTop: '1.75rem', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ĐĂNG NHẬP NHANH (DÀNH CHO HỘI ĐỒNG / DEMO)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={loading}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #BFDBFE',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-blue-100"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={15} /> Quản trị (Admin)
                </div>
                <span style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: 500 }}>admin / 123456</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('EMPLOYEE')}
                disabled={loading}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-slate-200"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={15} /> Nhân viên (Emp)
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>emp01 / 123456</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
