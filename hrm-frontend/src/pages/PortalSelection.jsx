import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Building2, UserCircle, LogIn } from 'lucide-react';
import axios from 'axios';

export const PortalSelection = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu đã login, redirect luôn
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'EMPLOYEE') navigate('/employee');
      else navigate('/internal');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      
      const { token, user } = res.data;
      
      // Lưu thông tin đăng nhập
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('fullName', user.fullName || username);
      localStorage.setItem('employeeCode', user.employeeCode || '');
      localStorage.setItem('employeeId', res.data.user.employeeId || '');

      // Điều hướng dựa vào Role
      if (user.role === 'EMPLOYEE') {
        navigate('/employee');
      } else {
        navigate('/internal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col items-center justify-center h-screen w-full bg-slate-50 relative" style={{ background: 'var(--bg-color)' }}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(50px)' }}></div>
      </div>

      <div className="card glass relative flex flex-col items-center p-8" style={{ zIndex: 50, width: '100%', maxWidth: '420px', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="flex-col items-center text-center mb-8 w-full">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', boxShadow: '0 10px 20px rgba(105, 108, 255, 0.3)' }}>
            <Building2 size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HRM Enterprise
          </h1>
          <p className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>Đăng nhập vào Hệ thống Quản trị</p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 relative" style={{ zIndex: 60 }}>
          {error && (
            <div className="p-3 rounded-lg text-sm text-center" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(255, 62, 29, 0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-semibold text-[var(--text-main)]">Tài khoản</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input 
                type="text" 
                required
                className="form-input w-full" 
                style={{ paddingLeft: '2.5rem', height: '3rem', backgroundColor: 'var(--bg-main)' }} 
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-semibold text-[var(--text-main)]">Mật khẩu</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input 
                type="password" 
                required
                className="form-input w-full" 
                style={{ paddingLeft: '2.5rem', height: '3rem', backgroundColor: 'var(--bg-main)' }} 
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full mt-2 flex items-center justify-center gap-2" 
            style={{ height: '3.2rem', fontSize: '1.05rem', fontWeight: 600, borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
          >
            {loading ? 'Đang xác thực...' : <><LogIn size={20} /> Đăng nhập hệ thống</>}
          </button>
        </form>

        <div className="w-full text-center mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Tài khoản Demo:</span><br/>
            Admin: admin / 123456<br/>
            Nhân viên: emp01 / 123456
          </p>
        </div>
      </div>
    </div>
  );
};

