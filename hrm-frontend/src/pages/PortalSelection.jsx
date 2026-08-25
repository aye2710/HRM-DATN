import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserCircle, Briefcase } from 'lucide-react';

export const PortalSelection = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Internal Portal',
      description: 'Dành cho Admin, HR & C&B, Manager để quản lý hệ thống và nhân sự.',
      icon: <Building2 size={48} className="mb-4 text-primary" color="var(--primary)" />,
      path: '/internal',
      color: 'var(--primary)'
    },
    {
      title: 'Employee Portal',
      description: 'Dành cho Nhân viên tự quản lý chấm công, nghỉ phép, lương.',
      icon: <UserCircle size={48} className="mb-4 text-secondary" color="var(--secondary)" />,
      path: '/employee',
      color: 'var(--secondary)'
    },
    {
      title: 'Candidate Portal',
      description: 'Dành cho Ứng viên xem tin tuyển dụng và nộp hồ sơ.',
      icon: <Briefcase size={48} className="mb-4 text-accent" color="var(--accent)" />,
      path: '/candidate',
      color: 'var(--accent)'
    }
  ];

  return (
    <div className="flex-col items-center justify-center h-screen w-full bg-slate-50 p-6" style={{ background: 'var(--bg-color)' }}>
      <div className="flex-col items-center mb-10 text-center">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>HRM Enterprise System</h1>
        <p style={{ fontSize: '1.125rem' }}>Chọn cổng thông tin phù hợp với vai trò của bạn</p>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {portals.map((portal) => (
          <div 
            key={portal.path}
            className="card flex-col items-center text-center cursor-pointer glass"
            style={{ padding: '3rem 2rem' }}
            onClick={() => navigate(portal.path)}
          >
            {portal.icon}
            <h2 style={{ color: portal.color, marginBottom: '1rem' }}>{portal.title}</h2>
            <p>{portal.description}</p>
            <button className="btn btn-primary mt-4" style={{ backgroundColor: portal.color, marginTop: '2rem' }}>
              Truy cập ngay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
