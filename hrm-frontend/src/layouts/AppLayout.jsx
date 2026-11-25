import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, ChevronDown, ChevronRight, Shield, LogOut, User, X
} from 'lucide-react';

const TopHeader = ({ portalName, onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmployeePortal = location.pathname.startsWith('/employee');
  const fullName = localStorage.getItem('fullName') || 'Quản trị viên';
  const username = localStorage.getItem('username') || (isEmployeePortal ? 'employee' : 'admin');
  const role = localStorage.getItem('role') || 'ADMIN';
  const initial = fullName.charAt(0).toUpperCase();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    const currentRole = localStorage.getItem('role');
    localStorage.clear();
    if (currentRole === 'EMPLOYEE') {
      navigate('/employee/login');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="top-header" style={{ padding: '0 2rem' }}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          title="Thu gọn / Mở rộng menu"
          className="btn btn-outline"
          style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Menu size={20} color="var(--text-main)" />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{portalName}</h2>
      </div>
      <div className="flex items-center gap-6" ref={menuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-3"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}
        >
          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>{initial}</div>
          <div className="flex-col" style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{fullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</span>
          </div>
          <ChevronDown size={16} color="var(--text-muted)" />
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 240,
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -2px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              zIndex: 50,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Vai trò: {role}</div>
            </div>
            <div style={{ padding: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setAccountModalOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#334155',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <User size={16} /> Thông tin tài khoản
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      {accountModalOpen && (
        <div
          onClick={() => setAccountModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Thông tin tài khoản</h3>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.35rem', fontWeight: 700 }}>{initial}</div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                    {role}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', borderRadius: '0.75rem', padding: '0.9rem 1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tên đăng nhập:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vai trò hệ thống:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Cổng truy cập:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{isEmployeePortal ? 'Employee Self-Service' : 'Enterprise Admin Portal'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', padding: '0.9rem 1.25rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              {isEmployeePortal && (
                <button
                  type="button"
                  onClick={() => {
                    setAccountModalOpen(false);
                    navigate('/employee/profile');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Xem hồ sơ nhân sự
                </button>
              )}
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                style={{
                  padding: '0.5rem 1.15rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DECISION_TYPE_MAP = {
  PROMOTION: '/internal/decisions/promotion',
  DEMOTION: '/internal/decisions/demotion',
  TRANSFER: '/internal/decisions/transfer',
  TERMINATION: '/internal/decisions/termination',
  SALARY_ADJUSTMENT: '/internal/decisions/salary',
  REWARD: '/internal/decisions/reward',
  DISCIPLINE: '/internal/decisions/discipline'
};

const NavItem = ({ item }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');

  const isActive = location.pathname.startsWith(item.to);
  const [isOpen, setIsOpen] = useState(isActive);

  React.useEffect(() => {
    setIsOpen(isActive);
  }, [isActive]);

  const isChildActive = (childTo, childActive) => {
    if (childActive) return true;
    if (location.pathname.includes('/decisions/create')) {
      if (typeParam && DECISION_TYPE_MAP[typeParam] === childTo) return true;
      if (!typeParam && childTo === '/internal/decisions/all') return true;
    }
    return false;
  };

  if (item.children) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`nav-link ${isActive ? 'active' : ''}`}
          style={{ justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '1.35rem', marginTop: '0.15rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive: childActive }) => `nav-link ${isChildActive(child.to, childActive) ? 'active' : ''}`}
                style={{ padding: '0.32rem 0.85rem', fontSize: '0.82rem' }}
              >
                {child.icon ? child.icon : <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />}
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive: linkActive }) => `nav-link ${linkActive ? 'active' : ''}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
};

const Sidebar = ({ links, collapsed }) => {
  if (collapsed) return null;

  return (
    <div className="sidebar">
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 30, height: 30, backgroundColor: 'var(--primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>
            <Shield size={16} />
          </div>
          <div className="flex-col">
            <span style={{ lineHeight: 1, fontWeight: 800, letterSpacing: '-0.01em' }}>LLA HRM</span>
            <span style={{ fontSize: '0.68rem', color: '#93C5FD', fontWeight: 500 }}>Enterprise Platform</span>
          </div>
        </h1>
      </div>
      
      <nav style={{ padding: '0.65rem 0', display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, overflowY: 'auto' }}>
        {links.map((link, index) => (
          <NavItem key={index} item={link} />
        ))}
      </nav>
    </div>
  );
};

export const AppLayout = ({ portalName, navLinks }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar links={navLinks} collapsed={sidebarCollapsed} />
      <div className="main-content">
        <TopHeader
          portalName={portalName}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        />
        <div className="page-content" style={{ backgroundColor: 'var(--bg-main)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
