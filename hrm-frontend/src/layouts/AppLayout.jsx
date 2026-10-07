import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, CalendarRange, Briefcase, FileText, Settings, UserCircle, Menu, Bell, ChevronDown, ChevronRight, CheckSquare, Target, DollarSign, BarChart2, Shield, LogOut, Building, UserPlus, FileSignature, Monitor } from 'lucide-react';

const TopHeader = ({ portalName }) => {
  const fullName = localStorage.getItem('fullName') || 'Unknown User';
  const role = localStorage.getItem('role') || 'EMPLOYEE';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div className="top-header" style={{ padding: '0 2rem' }}>
      <div className="flex items-center gap-4">
        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent' }}>
          <Menu size={20} color="var(--text-main)" />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{portalName}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="var(--text-muted)" />
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: 'var(--error)', borderRadius: '50%' }}></span>
        </div>
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
  const isExactActive = location.pathname === item.to;
  const [isOpen, setIsOpen] = useState(isActive);

  React.useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
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
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '1.5rem', marginTop: '0.25rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive: childActive }) => `nav-link ${childActive ? 'active' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
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

const Sidebar = ({ links }) => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, backgroundColor: 'var(--primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
            <Shield size={18} />
          </div>
          <div className="flex-col">
            <span style={{ lineHeight: 1 }}>GHC HRM</span>
            <span style={{ fontSize: '0.7rem', color: '#a1b0cb', fontWeight: 400 }}>Enterprise Portal</span>
          </div>
        </h1>
      </div>
      
      <nav style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
        {links.map((link, index) => (
          <NavItem key={index} item={link} />
        ))}
      </nav>
      
      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
         <NavLink to="#" style={{ color: '#a1b0cb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
           <Settings size={18} /> Cài đặt
         </NavLink>
         <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#a1b0cb', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>
           <LogOut size={18} /> Đăng xuất
         </button>
      </div>
    </div>
  );
};

export const AppLayout = ({ portalName, navLinks }) => {
  return (
    <div className="app-layout">
      <Sidebar links={navLinks} />
      <div className="main-content">
        <TopHeader portalName={portalName} />
        <div className="page-content" style={{ backgroundColor: 'var(--bg-main)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

