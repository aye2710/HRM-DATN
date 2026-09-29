import React, { useState } from 'react';
import { Clock, Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';

const mockShifts = [
  { id: 1, name: 'Ca Hành chính', startTime: '08:00', endTime: '17:30', breakTime: '12:00 - 13:30', workHours: 8, status: 'Hoạt động' },
  { id: 2, name: 'Ca Sáng (Part-time)', startTime: '08:00', endTime: '12:00', breakTime: '-', workHours: 4, status: 'Hoạt động' },
  { id: 3, name: 'Ca Chiều (Part-time)', startTime: '13:30', endTime: '17:30', breakTime: '-', workHours: 4, status: 'Hoạt động' },
  { id: 4, name: 'Ca Đêm (Bảo vệ)', startTime: '22:00', endTime: '06:00', breakTime: '02:00 - 03:00', workHours: 7, status: 'Ngưng hoạt động' },
];

export const Shifts = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Ca làm việc</h1>
          <p className="text-muted text-sm">Cấu hình thời gian làm việc và nghỉ ngơi theo từng ca</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Thêm Ca mới
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm ca làm việc..." 
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
                <th>Tên Ca</th>
                <th>Giờ làm việc</th>
                <th>Giờ nghỉ (Break)</th>
                <th>Tổng công (Giờ)</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockShifts.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(shift => (
                <tr key={shift.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <Clock size={16} color="var(--warning)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{shift.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="money-text font-medium text-main">{shift.startTime} - {shift.endTime}</span>
                  </td>
                  <td className="text-muted">{shift.breakTime}</td>
                  <td>
                    <span className="badge badge-info">{shift.workHours}h</span>
                  </td>
                  <td>
                    <span className={`badge ${shift.status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                      {shift.status}
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
