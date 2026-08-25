import React, { useState } from 'react';
import { RefreshCw, Search, Plus, Filter, ArrowRight } from 'lucide-react';

const mockTransfers = [
  { id: 1, employee: 'Lê C', fromDept: 'Phòng Nhân sự', toDept: 'Phòng Phát triển', fromPos: 'HR Executive', toPos: 'Scrum Master', date: '2026-09-01', status: 'Pending' },
  { id: 2, employee: 'Phạm D', fromDept: 'Phòng Kế toán', toDept: 'Phòng Kinh doanh', fromPos: 'Accountant', toPos: 'Sales Executive', date: '2026-08-15', status: 'Approved' },
  { id: 3, employee: 'Trần Văn X', fromDept: 'Phòng Phát triển', toDept: 'Chi nhánh ĐN', fromPos: 'Frontend Dev', toPos: 'Team Lead', date: '2026-07-01', status: 'Completed' },
];

export const Transfers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Điều chuyển Nhân sự</h1>
          <p className="text-muted text-sm">Quản lý luân chuyển phòng ban, thăng tiến và thay đổi vị trí</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Tạo Đề xuất Điều chuyển
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự điều chuyển..." 
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
                <th>Từ (Đơn vị cũ)</th>
                <th>Sang (Đơn vị mới)</th>
                <th>Ngày hiệu lực</th>
                <th>Trạng thái (Workflow)</th>
              </tr>
            </thead>
            <tbody>
              {mockTransfers.filter(t => t.employee.toLowerCase().includes(searchTerm.toLowerCase())).map(transfer => (
                <tr key={transfer.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{transfer.employee.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{transfer.employee}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-col gap-1">
                      <span className="text-sm font-medium">{transfer.fromDept}</span>
                      <span className="text-xs text-muted">{transfer.fromPos}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <ArrowRight size={16} color="var(--primary)" />
                      <div className="flex-col gap-1">
                        <span className="text-sm font-medium text-main">{transfer.toDept}</span>
                        <span className="text-xs text-primary">{transfer.toPos}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted text-sm">{transfer.date}</td>
                  <td>
                    {transfer.status === 'Pending' && <span className="badge badge-warning">Chờ duyệt</span>}
                    {transfer.status === 'Approved' && <span className="badge badge-info">Đã duyệt</span>}
                    {transfer.status === 'Completed' && <span className="badge badge-success">Đã hoàn tất</span>}
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
