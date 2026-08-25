import React from 'react';
import { Users, UserPlus, Clock, FileText } from 'lucide-react';
import { employees } from '../../mockData';

export const InternalDashboard = () => {
  const stats = [
    { label: 'Tổng Nhân Sự', value: employees.length, icon: <Users size={24} />, color: 'var(--primary)', trend: '+2 this month' },
    { label: 'Tuyển dụng', value: 4, icon: <UserPlus size={24} />, color: 'var(--accent)', trend: 'Open roles' },
    { label: 'Vắng Mặt (Hôm nay)', value: 1, icon: <Clock size={24} />, color: 'var(--warning)', trend: 'Nguyễn Văn A' },
    { label: 'Action Required', value: 5, icon: <FileText size={24} />, color: 'var(--error)', trend: 'Pending requests' },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            System Dashboard
          </h2>
          <p className="text-muted mt-2">Tổng quan tình hình nhân sự và các cảnh báo hệ thống.</p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card glass card-hover" style={{ borderLeft: `4px solid ${stat.color}`, padding: '1.5rem' }}>
            <div className="flex items-start justify-between mb-4">
              <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div className="flex-col">
              <span className="text-muted mb-1" style={{ fontSize: '0.95rem', fontWeight: 500 }}>{stat.label}</span>
              <div className="flex items-end gap-3">
                <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{stat.value}</span>
                <span style={{ fontSize: '0.85rem', color: stat.color, marginBottom: '0.5rem', fontWeight: 600 }}>{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Onboarding Table */}
        <div className="card glass">
          <h3 className="mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Nhân sự mới gia nhập</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Phòng ban</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 3).map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>{emp.avatar}</div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600 }}>{emp.name}</span>
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{emp.id}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{emp.department}</span></td>
                    <td><span className="badge badge-info">Onboarding</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* To-Do List */}
        <div className="card glass">
          <h3 className="mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Cần xử lý (To-do)</h3>
          <div className="flex-col gap-4">
            <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-4">
                <div style={{ padding: '0.75rem', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '50%' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Duyệt đơn nghỉ phép</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Phạm Thị D (2 ngày) - Nghỉ ốm</p>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Review</button>
            </div>
            
            <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-4">
                <div style={{ padding: '0.75rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: '50%' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Chốt bảng lương Tháng 8</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Hạn chót: 25/08/2026</p>
                </div>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Processing</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
