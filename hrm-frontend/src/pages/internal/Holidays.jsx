import React, { useState } from 'react';
import { CalendarDays, Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';

const mockHolidays = [
  { id: 1, name: 'Tết Dương Lịch 2026', date: '2026-01-01', type: 'Quốc gia', paid: true },
  { id: 2, name: 'Tết Nguyên Đán 2026', date: '2026-02-15 tới 2026-02-21', type: 'Quốc gia', paid: true },
  { id: 3, name: 'Ngày Giải phóng miền Nam', date: '2026-04-30', type: 'Quốc gia', paid: true },
  { id: 4, name: 'Quốc tế Lao động', date: '2026-05-01', type: 'Quốc gia', paid: true },
  { id: 5, name: 'Kỷ niệm Thành lập Công ty', date: '2026-10-10', type: 'Công ty', paid: true },
];

export const Holidays = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Lịch Nghỉ Lễ</h1>
          <p className="text-muted text-sm">Cấu hình các ngày nghỉ lễ có lương trong năm của Công ty và Quốc gia</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Thêm Ngày lễ
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm kỳ nghỉ lễ..." 
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
                <th>Tên Kỳ nghỉ</th>
                <th>Thời gian (Ngày)</th>
                <th>Phân loại</th>
                <th>Hưởng lương</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockHolidays.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map(holiday => (
                <tr key={holiday.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <CalendarDays size={16} color="var(--error)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{holiday.name}</span>
                    </div>
                  </td>
                  <td><span className="text-main font-medium">{holiday.date}</span></td>
                  <td>
                    <span className={`badge ${holiday.type === 'Quốc gia' ? 'badge-error' : 'badge-primary'}`}>
                      {holiday.type}
                    </span>
                  </td>
                  <td>
                    {holiday.paid ? <span className="text-success font-medium">Có</span> : <span className="text-error font-medium">Không</span>}
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
