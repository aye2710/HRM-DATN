import React, { useState } from 'react';
import { Settings, Search, Plus, Filter, Edit2, Trash2, CalendarHeart } from 'lucide-react';

const mockLeaveTypes = [
  { id: 1, name: 'Nghỉ phép năm (Annual Leave)', code: 'AL', defaultDays: 12, paid: true, carryForward: true, status: 'Hoạt động' },
  { id: 2, name: 'Nghỉ ốm (Sick Leave)', code: 'SL', defaultDays: 5, paid: true, carryForward: false, status: 'Hoạt động' },
  { id: 3, name: 'Nghỉ không lương (Unpaid Leave)', code: 'UL', defaultDays: 30, paid: false, carryForward: false, status: 'Hoạt động' },
  { id: 4, name: 'Nghỉ thai sản (Maternity Leave)', code: 'ML', defaultDays: 180, paid: true, carryForward: false, status: 'Hoạt động' },
];

export const LeaveTypes = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Loại Nghỉ phép</h1>
          <p className="text-muted text-sm">Cấu hình định mức, quy tắc hưởng lương và cộng dồn của từng loại phép</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Tạo Loại phép mới
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm loại phép..." 
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
                <th>Loại phép (Tên / Mã)</th>
                <th>Định mức mặc định</th>
                <th>Hưởng lương</th>
                <th>Cộng dồn năm sau</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaveTypes.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(leave => (
                <tr key={leave.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <CalendarHeart size={16} color="var(--success)" />
                      </div>
                      <div className="flex-col">
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{leave.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.code}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-main">{leave.defaultDays} ngày</span>
                  </td>
                  <td>
                    {leave.paid ? <span className="text-success font-medium">Có</span> : <span className="text-error font-medium">Không</span>}
                  </td>
                  <td>
                    {leave.carryForward ? <span className="text-success font-medium">Có</span> : <span className="text-error font-medium">Không</span>}
                  </td>
                  <td>
                    <span className={`badge ${leave.status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                      {leave.status}
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
