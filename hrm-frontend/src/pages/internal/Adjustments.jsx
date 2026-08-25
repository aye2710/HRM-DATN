import React, { useState } from 'react';
import { RefreshCcw, Search, Filter, CheckCircle, XCircle } from 'lucide-react';

const mockAdjustments = [
  { id: 1, employee: 'Nguyễn Văn A', date: '2026-08-20', type: 'Thiếu Check-in', oldTime: '-', newTime: '08:00', reason: 'Quên chấm công đầu giờ', status: 'Pending' },
  { id: 2, employee: 'Lê C', date: '2026-08-19', type: 'Sai giờ làm', oldTime: '14:00', newTime: '17:30', reason: 'Đi gặp khách hàng nên không check-out tại công ty', status: 'Approved' },
  { id: 3, employee: 'Trần Thị B', date: '2026-08-15', type: 'Thiếu Check-out', oldTime: '-', newTime: '18:00', reason: 'Hệ thống lỗi không nhận diện khuôn mặt', status: 'Rejected' },
];

export const Adjustments = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Điều chỉnh Chấm công</h1>
          <p className="text-muted text-sm">Xử lý các yêu cầu cập nhật lại giờ vào/ra bị lỗi hoặc quên chấm công</p>
        </div>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự..." 
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
                <th>Ngày / Phân loại</th>
                <th>Yêu cầu điều chỉnh</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th className="text-center">Phê duyệt</th>
              </tr>
            </thead>
            <tbody>
              {mockAdjustments.filter(a => a.employee.toLowerCase().includes(searchTerm.toLowerCase())).map(adj => (
                <tr key={adj.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{adj.employee.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{adj.employee}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-col gap-1">
                      <span className="text-sm font-medium">{adj.date}</span>
                      <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>{adj.type}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted line-through">{adj.oldTime}</span>
                      <RefreshCcw size={12} color="var(--primary)" />
                      <span className="text-main font-bold">{adj.newTime}</span>
                    </div>
                  </td>
                  <td className="text-muted text-sm max-w-[200px]" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {adj.reason}
                  </td>
                  <td>
                    {adj.status === 'Pending' && <span className="badge badge-warning">Chờ duyệt</span>}
                    {adj.status === 'Approved' && <span className="badge badge-success">Đã duyệt</span>}
                    {adj.status === 'Rejected' && <span className="badge badge-error">Từ chối</span>}
                  </td>
                  <td className="text-center">
                    {adj.status === 'Pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--success)' }} title="Duyệt">
                          <CheckCircle size={18} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--error)' }} title="Từ chối">
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">Đã xử lý</span>
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
