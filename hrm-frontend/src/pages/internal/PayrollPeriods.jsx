import React, { useState } from 'react';
import { CalendarClock, Search, Plus, Filter, Lock, PlayCircle, CheckCircle } from 'lucide-react';

const mockPeriods = [
  { id: 1, name: 'Kỳ lương Tháng 8/2026', startDate: '2026-08-01', endDate: '2026-08-31', employees: 62, gross: '1,250,000,000', status: 'Processing' },
  { id: 2, name: 'Kỳ lương Tháng 7/2026', startDate: '2026-07-01', endDate: '2026-07-31', employees: 60, gross: '1,180,000,000', status: 'Completed' },
  { id: 3, name: 'Kỳ lương Tháng 6/2026', startDate: '2026-06-01', endDate: '2026-06-30', employees: 58, gross: '1,120,000,000', status: 'Completed' },
  { id: 4, name: 'Kỳ lương Tháng 9/2026', startDate: '2026-09-01', endDate: '2026-09-30', employees: 0, gross: '0', status: 'Draft' },
];

export const PayrollPeriods = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Kỳ Lương</h1>
          <p className="text-muted text-sm">Quản lý vòng đời chốt công, tính lương và chi trả</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Tạo Kỳ lương mới
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm kỳ lương..." 
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
                <th>Kỳ tính lương</th>
                <th>Thời gian</th>
                <th>Số nhân sự</th>
                <th>Tổng Quỹ lương (VND)</th>
                <th>Trạng thái (Workflow)</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockPeriods.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(period => (
                <tr key={period.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                        <CalendarClock size={16} color="var(--warning)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{period.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-col gap-1">
                      <span className="text-sm font-medium">{period.startDate}</span>
                      <span className="text-xs text-muted">đến {period.endDate}</span>
                    </div>
                  </td>
                  <td className="font-bold text-muted">{period.employees}</td>
                  <td>
                    <span className="money-text font-bold text-main">{period.gross}</span>
                  </td>
                  <td>
                    {period.status === 'Draft' && <span className="badge badge-info">Bản nháp</span>}
                    {period.status === 'Processing' && <span className="badge badge-warning">Đang xử lý</span>}
                    {period.status === 'Completed' && <span className="badge badge-success">Đã hoàn tất</span>}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {period.status === 'Draft' && (
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--primary)' }} title="Bắt đầu tính lương">
                          <PlayCircle size={16} />
                        </button>
                      )}
                      {period.status === 'Processing' && (
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--warning)' }} title="Chốt kỳ lương (Lock)">
                          <Lock size={16} />
                        </button>
                      )}
                      {period.status === 'Completed' && (
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--success)' }} title="Đã trả lương">
                          <CheckCircle size={16} />
                        </button>
                      )}
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
