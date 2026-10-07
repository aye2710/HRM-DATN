import React, { useState } from 'react';
import { KeyRound, Search, Plus, Filter, ShieldCheck, Mail } from 'lucide-react';

const mockAccounts = [
  { id: 1, employee: 'Phạm Y', account: 'pham.y@congty.com', system: 'Google Workspace', status: 'Active', role: 'User' },
  { id: 2, employee: 'Phạm Y', account: 'pham.y', system: 'Jira Software', status: 'Pending', role: 'Developer' },
  { id: 3, employee: 'Trần Z', account: 'tran.z@congty.com', system: 'Slack', status: 'Active', role: 'User' },
  { id: 4, employee: 'Lê C', account: 'le.c', system: 'HRM Admin Portal', status: 'Disabled', role: 'HR Manager' },
];

export const SystemAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tài khoản Hệ thống</h1>
          <p className="text-muted text-sm">Quản lý cấp phát và thu hồi quyền truy cập các phần mềm nội bộ</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Yêu cầu cấp Tài khoản
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự hoặc tài khoản..." 
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
                <th>Nhân viên</th>
                <th>Hệ thống (Phần mềm)</th>
                <th>Tên Tài khoản / Email</th>
                <th>Phân quyền (Role)</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockAccounts.filter(a => a.employee.toLowerCase().includes(searchTerm.toLowerCase()) || a.account.toLowerCase().includes(searchTerm.toLowerCase())).map(acc => (
                <tr key={acc.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{acc.employee}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} color="var(--primary)" />
                      {acc.system}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Mail size={14} color="var(--text-muted)" />
                      <span className="font-mono text-sm">{acc.account}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{acc.role}</span></td>
                  <td>
                    {acc.status === 'Pending' && <span className="badge badge-warning">Chờ IT cấp</span>}
                    {acc.status === 'Active' && <span className="badge badge-success">Đang hoạt động</span>}
                    {acc.status === 'Disabled' && <span className="badge badge-error">Đã vô hiệu hóa</span>}
                  </td>
                  <td className="text-center">
                    {acc.status === 'Pending' ? (
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
                        Đánh dấu Cấp xong
                      </button>
                    ) : acc.status === 'Active' ? (
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                        Thu hồi (Revoke)
                      </button>
                    ) : (
                      <span className="text-muted text-xs">Không khả dụng</span>
                    )}
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
