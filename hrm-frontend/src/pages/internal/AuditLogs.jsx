import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, History } from 'lucide-react';

const mockLogs = [
  { id: 1, action: 'UPDATE_SALARY', user: 'admin.hr', resource: 'Employee: Trần Văn X', oldVal: '20,000,000', newVal: '35,000,000', ip: '192.168.1.45', time: '2026-08-25 14:30:22' },
  { id: 2, action: 'DELETE_CONTRACT', user: 'admin.hr', resource: 'Contract: Lê C', oldVal: 'Active', newVal: 'Deleted', ip: '192.168.1.45', time: '2026-08-24 09:15:00' },
  { id: 3, action: 'LOGIN_FAILED', user: 'unknown', resource: 'System', oldVal: '-', newVal: '-', ip: '113.190.x.x', time: '2026-08-23 22:40:11' },
];

export const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Nhật ký Kiểm toán (Audit Logs)</h1>
          <p className="text-muted text-sm">Theo dõi và lưu vết mọi lịch sử thay đổi dữ liệu nhạy cảm trong hệ thống</p>
        </div>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo hành động hoặc User..." 
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
                <th>Thời gian</th>
                <th>Hành động (Action)</th>
                <th>Người thực hiện</th>
                <th>Đối tượng bị tác động</th>
                <th>Chi tiết (Cũ ➜ Mới)</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.filter(l => l.action.toLowerCase().includes(searchTerm.toLowerCase()) || l.user.toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
                <tr key={log.id}>
                  <td className="text-muted text-sm font-mono">{log.time}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={14} color={log.action.includes('DELETE') || log.action.includes('FAILED') ? 'var(--error)' : 'var(--warning)'} />
                      <span className="font-bold text-sm" style={{ color: log.action.includes('DELETE') || log.action.includes('FAILED') ? 'var(--error)' : 'var(--text-main)' }}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{log.user}</span></td>
                  <td className="text-sm font-medium">{log.resource}</td>
                  <td>
                    {log.oldVal !== '-' ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted line-through">{log.oldVal}</span>
                        <span>➜</span>
                        <span className="text-main font-bold">{log.newVal}</span>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">-</span>
                    )}
                  </td>
                  <td className="text-muted text-xs font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
