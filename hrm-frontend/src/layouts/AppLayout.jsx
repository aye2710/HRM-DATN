import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, Menu, ChevronDown, ChevronRight, Shield, LogOut
} from 'lucide-react';

const TopHeader = ({ portalName, onToggleSidebar }) => {
  const fullName = localStorage.getItem('fullName') || 'Quản trị viên';
  const role = localStorage.getItem('role') || 'ADMIN';
  const initial = fullName.charAt(0).toUpperCase();

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
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>{initial}</div>
          <div className="flex-col">
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{fullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.to);
  const [isOpen, setIsOpen] = useState(isActive);

  React.useEffect(() => {
    setIsOpen(isActive);
  }, [isActive]);

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
                className={({ isActive: childActive }) => `nav-link ${childActive ? 'active' : ''}`}
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
  const navigate = useNavigate();
  const location = useLocation();
  const isEmployeePortal = location.pathname.startsWith('/employee');
  const settingsPath = isEmployeePortal ? '/employee/profile' : '/internal/system/parameters';

  if (collapsed) return null;

  const handleLogout = (e) => {
    e.preventDefault();
    const role = localStorage.getItem('role');
    localStorage.clear();
    if (role === 'EMPLOYEE') {
      navigate('/employee/login');
    } else {
      navigate('/admin');
    }
  };

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
      
      <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <NavLink
          to={settingsPath}
          style={{ color: '#a1b0cb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '0.65rem' }}
        >
          <Settings size={16} /> {isEmployeePortal ? 'Thông tin tài khoản' : 'Cấu hình tham số'}
        </NavLink>
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#a1b0cb', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
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
