import React, { useState } from 'react';
import { Target, Search, Filter, CheckCircle, ChevronRight } from 'lucide-react';

const mockProgress = [
  { id: 1, employee: 'Phạm Y', position: 'Frontend Developer', joinDate: '2026-08-20', progress: 80, status: 'On Track' },
  { id: 2, employee: 'Trần Z', position: 'Sales Executive', joinDate: '2026-08-22', progress: 45, status: 'Behind' },
  { id: 3, employee: 'Nguyễn K', position: 'HR Intern', joinDate: '2026-08-01', progress: 100, status: 'Completed' },
];

export const OnboardingProgress = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Tiến độ Hội nhập</h1>
          <p className="text-muted text-sm">Theo dõi mức độ hoàn thành các checklist của nhân viên mới</p>
        </div>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự mới..." 
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
                <th>Nhân viên mới (Newbie)</th>
                <th>Vị trí</th>
                <th>Ngày gia nhập</th>
                <th>Tiến độ hoàn thành</th>
                <th>Trạng thái</th>
                <th className="text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {mockProgress.filter(p => p.employee.toLowerCase().includes(searchTerm.toLowerCase())).map(prog => (
                <tr key={prog.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{prog.employee.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{prog.employee}</span>
                    </div>
                  </td>
                  <td>{prog.position}</td>
                  <td className="text-muted text-sm">{prog.joinDate}</td>
                  <td>
                    <div className="flex items-center gap-3 w-48">
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${prog.progress}%`, height: '100%', backgroundColor: prog.progress === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }}></div>
                      </div>
                      <span className="text-xs font-bold w-8">{prog.progress}%</span>
                    </div>
                  </td>
                  <td>
                    {prog.status === 'On Track' && <span className="badge badge-info">Đúng tiến độ</span>}
                    {prog.status === 'Behind' && <span className="badge badge-warning">Chậm tiến độ</span>}
                    {prog.status === 'Completed' && <span className="badge badge-success"><CheckCircle size={12} className="mr-1"/> Hoàn tất</span>}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                      <ChevronRight size={20} color="var(--text-muted)" />
                    </button>
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
