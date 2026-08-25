import React, { useState } from 'react';
import { UserMinus, Search, Plus, Filter, MessageSquare, Briefcase } from 'lucide-react';

const mockTerminations = [
  { id: 1, employee: 'Trần Thị B', department: 'Phòng Kinh doanh', type: 'Tự nguyện (Resignation)', lastDate: '2026-09-15', handover: 'Pending', status: 'Pending Approval' },
  { id: 2, employee: 'Phạm D', department: 'Phòng Kế toán', type: 'Hết hạn Hợp đồng', lastDate: '2026-08-31', handover: 'In Progress', status: 'Approved' },
  { id: 3, employee: 'Lê C', department: 'Phòng Nhân sự', type: 'Sa thải (Termination)', lastDate: '2026-08-01', handover: 'Completed', status: 'Completed' },
];

export const Terminations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Nghỉ việc & Thanh lý</h1>
          <p className="text-muted text-sm">Xử lý quy trình nghỉ việc, bàn giao tài sản và phỏng vấn thôi việc (Exit Interview)</p>
        </div>
        <button className="btn btn-danger">
          <UserMinus size={18} /> Khởi tạo Quy trình Nghỉ việc
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự nghỉ việc..." 
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
                <th>Phân loại</th>
                <th>Ngày làm việc cuối</th>
                <th>Bàn giao (Handover)</th>
                <th>Trạng thái (Workflow)</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockTerminations.filter(t => t.employee.toLowerCase().includes(searchTerm.toLowerCase())).map(term => (
                <tr key={term.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                        {term.employee.charAt(0)}
                      </div>
                      <div className="flex-col gap-1">
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{term.employee}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{term.department}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{term.type}</span>
                  </td>
                  <td className="text-muted text-sm font-medium">{term.lastDate}</td>
                  <td>
                    {term.handover === 'Pending' && <span className="badge badge-warning">Chưa bắt đầu</span>}
                    {term.handover === 'In Progress' && <span className="badge badge-info">Đang bàn giao</span>}
                    {term.handover === 'Completed' && <span className="badge badge-success">Đã xong</span>}
                  </td>
                  <td>
                    {term.status === 'Pending Approval' && <span className="badge badge-warning">Chờ Duyệt</span>}
                    {term.status === 'Approved' && <span className="badge badge-info">Đang Xử lý</span>}
                    {term.status === 'Completed' && <span className="badge badge-purple">Hoàn tất</span>}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Phỏng vấn nghỉ việc (Exit Interview)">
                        <MessageSquare size={16} color="var(--primary)" />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Checklist bàn giao">
                        <Briefcase size={16} color="var(--text-muted)" />
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
