import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, CalendarRange, Briefcase, FileText, Settings, UserCircle, Menu, Bell, ChevronDown, ChevronRight, CheckSquare, Target, DollarSign, BarChart2, Shield, LogOut, Building, UserPlus, FileSignature, Monitor } from 'lucide-react';

const TopHeader = ({ portalName }) => (
  <div className="top-header" style={{ padding: '0 2rem' }}>
    <div className="flex items-center gap-4">
      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent' }}>
        <Menu size={20} color="var(--text-main)" />
      </button>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>{portalName}</h2>
    </div>
    <div className="flex items-center gap-6">
      <div style={{ position: 'relative', cursor: 'pointer' }}>
        <Bell size={20} color="var(--text-muted)" />
        <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: 'var(--error)', borderRadius: '50%' }}></span>
      </div>
      <div className="flex items-center gap-3">
        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>A</div>
        <div className="flex-col">
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Nguyễn Văn A</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin / HR</span>
        </div>
      </div>
    </div>
  </div>
);

const NavItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.to);
  const isExactActive = location.pathname === item.to;

  if (item.children) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.65rem 1.25rem', cursor: 'pointer',
            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
            backgroundColor: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
            fontWeight: 500, transition: 'all 0.2s'
          }}
          className="hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.05)', marginLeft: '2rem', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                style={({ isActive: childActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', textDecoration: 'none',
                  color: childActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: childActive ? 600 : 400,
                  fontSize: '0.9rem', transition: 'all 0.2s',
                  borderLeft: childActive ? '2px solid var(--primary)' : '2px solid transparent'
                })}
                className="hover:text-white"
              >
                {child.icon ? child.icon : <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />}
                {child.label}
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
      style={({ isActive: linkActive }) => ({
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.65rem 1.25rem', textDecoration: 'none',
        color: linkActive ? 'var(--primary)' : 'var(--text-muted)',
        backgroundColor: linkActive ? 'var(--primary-light)' : 'transparent',
        borderRight: linkActive ? '3px solid var(--primary)' : '3px solid transparent',
        fontWeight: linkActive ? 600 : 500, transition: 'all 0.2s'
      })}
      className="hover:bg-white/5 hover:text-white"
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
};

const Sidebar = ({ links }) => (
  <div className="sidebar" style={{ background: '#0B1120', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ width: 32, height: 32, backgroundColor: 'var(--primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
          <Shield size={18} />
        </div>
        <div className="flex-col">
          <span style={{ lineHeight: 1 }}>GHC HRM</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>Enterprise Portal</span>
        </div>
      </h1>
    </div>
    
    <nav style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
      {links.map((link, index) => (
        <NavItem key={index} item={link} />
      ))}
    </nav>
    
    <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
       <NavLink to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
         <Settings size={18} /> Cài đặt
       </NavLink>
       <NavLink to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
         <LogOut size={18} /> Đăng xuất
       </NavLink>
    </div>
  </div>
);

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
