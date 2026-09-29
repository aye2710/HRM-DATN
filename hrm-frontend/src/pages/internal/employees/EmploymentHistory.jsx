import React, { useState } from 'react';
import { Briefcase, Search, Plus, Filter, TrendingUp, DollarSign } from 'lucide-react';

const mockEmployments = [
  { id: 1, employee: 'Lê Đại Dương', title: 'Giám đốc Điều hành (CEO)', department: 'Ban Giám đốc', effectiveDate: '2023-01-01', changeReason: 'Bổ nhiệm', salary: '80,000,000 VND' },
  { id: 2, employee: 'Trần Văn X', title: 'Team Lead Frontend', department: 'Phòng Phát triển', effectiveDate: '2026-07-01', changeReason: 'Thăng chức (Promotion)', salary: '35,000,000 VND' },
  { id: 3, employee: 'Trần Văn X', title: 'Frontend Developer', department: 'Phòng Phát triển', effectiveDate: '2024-05-15', changeReason: 'Tuyển mới (New Hire)', salary: '20,000,000 VND' },
];

export const EmploymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Lịch sử Việc làm (Employment)</h1>
          <p className="text-muted text-sm">Tra cứu quá trình công tác, lịch sử thăng tiến và thay đổi mức lương</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Cập nhật Việc làm
        </button>
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
                <th>Chức danh (Job Title)</th>
                <th>Phòng ban</th>
                <th>Lý do thay đổi</th>
                <th>Ngày hiệu lực</th>
                <th>Mức lương / Trợ cấp</th>
              </tr>
            </thead>
            <tbody>
              {mockEmployments.filter(e => e.employee.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{emp.employee.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.employee}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 font-medium">
                      <Briefcase size={14} color="var(--primary)" />
                      {emp.title}
                    </div>
                  </td>
                  <td className="text-muted">{emp.department}</td>
                  <td>
                    <span className={`badge ${emp.changeReason.includes('Thăng chức') ? 'badge-success' : 'badge-purple'}`}>
                      {emp.changeReason.includes('Thăng chức') && <TrendingUp size={12} className="mr-1" />}
                      {emp.changeReason}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{emp.effectiveDate}</td>
                  <td>
                    <div className="flex items-center gap-1 font-bold text-main">
                      <DollarSign size={14} color="var(--text-muted)" />
                      <span className="money-text">{emp.salary}</span>
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
