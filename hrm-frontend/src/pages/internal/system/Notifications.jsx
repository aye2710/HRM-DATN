import React, { useState } from 'react';
import { BellRing, Search, Plus, Filter, Edit2, Trash2, Mail, Smartphone } from 'lucide-react';

const mockNotifications = [
  { id: 1, name: 'Nhắc nhở Hợp đồng sắp hết hạn', trigger: 'Trước 30 ngày', channel: 'System, Email', target: 'HR Manager', status: 'Active' },
  { id: 2, name: 'Thông báo Chúc mừng Sinh nhật', trigger: 'Vào ngày Sinh nhật', channel: 'System, Slack', target: 'Toàn bộ nhân sự', status: 'Active' },
  { id: 3, name: 'Báo cáo Chấm công vắng mặt', trigger: '10:00 AM hàng ngày', channel: 'Email', target: 'Manager', status: 'Disabled' },
];

export const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Quản lý Thông báo</h1>
          <p className="text-muted text-sm">Cấu hình các kịch bản gửi thông báo tự động (System/Email/Slack)</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Tạo Cấu hình mới
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm mẫu thông báo..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-outline" style={{ padding: '0.75rem', height: '100%' }}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên Kịch bản Thông báo</th>
                <th>Sự kiện kích hoạt (Trigger)</th>
                <th>Kênh gửi (Channels)</th>
                <th>Người nhận (Target)</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockNotifications.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase())).map(notif => (
                <tr key={notif.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <BellRing size={16} color="var(--error)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{notif.name}</span>
                    </div>
                  </td>
                  <td className="text-muted text-sm">{notif.trigger}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {notif.channel.includes('System') && <Smartphone size={14} color="var(--primary)" />}
                      {notif.channel.includes('Email') && <Mail size={14} color="var(--warning)" />}
                      <span className="text-sm font-medium">{notif.channel}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{notif.target}</span></td>
                  <td>
                    <span className={`badge ${notif.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                      {notif.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                        <Edit2 size={16} color="var(--text-muted)" />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                        <Trash2 size={16} color="var(--error)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
