import React from 'react';
import { Settings, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { systemRoles } from '../../mockData';

export const SettingsRBAC = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cấu hình & Phân quyền (RBAC)
          </h2>
          <p className="text-muted mt-2">Quản lý các nhóm quyền truy cập vào các tính năng của hệ thống (Role-Based Access Control).</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
          <Shield size={18} /> Thêm Role mới
        </button>
      </div>

      <div className="card glass mb-8" style={{ borderLeft: '4px solid var(--warning)' }}>
        <div className="flex items-center gap-4">
          <AlertTriangle size={32} color="var(--warning)" />
          <div>
            <h4 style={{ margin: 0, marginBottom: '0.25rem', color: 'var(--text-main)' }}>Chế độ Super Admin</h4>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>Bạn đang sử dụng quyền lực tối cao. Bất kỳ thay đổi phân quyền nào ở đây sẽ tác động ngay lập tức đến tài khoản người dùng khác đang hoạt động.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {systemRoles.map(role => (
          <div key={role.id} className="card glass card-hover flex items-center justify-between" style={{ padding: '1.5rem 2rem' }}>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-3 mb-2">
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: role.id === 'ROLE_ADMIN' ? 'var(--error)' : 'var(--primary)' }}>
                  {role.name}
                </h3>
                <span className="badge badge-success">{role.status}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Mô tả: {role.description}</p>
              
              {/* Permission Tags */}
              <div className="flex gap-2">
                {role.id === 'ROLE_ADMIN' && <><span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>ALL PERMISSIONS</span></>}
                {role.id === 'ROLE_HR' && <><span className="badge badge-info">View Employees</span><span className="badge badge-info">Edit Payroll</span><span className="badge badge-info">Manage ATS</span></>}
                {role.id === 'ROLE_MANAGER' && <><span className="badge badge-info">View Department</span><span className="badge badge-info">Approve Leaves</span><span className="badge badge-info">Score KPIs</span></>}
                {role.id === 'ROLE_EMPLOYEE' && <><span className="badge badge-info">View Own Profile</span><span className="badge badge-info">Submit Leaves</span></>}
              </div>
            </div>
            
            <div className="flex-col items-end gap-4" style={{ width: '200px', borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
              <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.95rem' }}>
                <UserCheck size={18} /> {role.usersCount} Assigned Users
              </div>
              <button className="btn btn-outline w-full" style={{ padding: '0.5rem' }}>
                Edit Permissions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
