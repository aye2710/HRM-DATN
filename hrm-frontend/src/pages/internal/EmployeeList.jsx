import React, { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { employees } from '../../mockData';

export const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hồ sơ nhân sự
          </h2>
          <p className="text-muted mt-2">Quản lý vòng đời nhân sự, hợp đồng và thử việc.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
          <Plus size={18} /> Thêm nhân sự
        </button>
      </div>

      <div className="card glass mb-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-col" style={{ flex: 1 }}>
            <label className="form-label text-muted">Tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nhập tên hoặc mã nhân viên..." 
                style={{ paddingLeft: '3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-col" style={{ width: '250px' }}>
            <label className="form-label text-muted">Phòng ban</label>
            <select className="form-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <option value="">Tất cả phòng ban</option>
              <option value="IT">IT Delivery</option>
              <option value="HR">Human Resources</option>
              <option value="Marketing">Marketing & Sales</option>
            </select>
          </div>
          <div className="flex-col" style={{ width: '250px' }}>
            <label className="form-label text-muted">Trạng thái hợp đồng</label>
            <select className="form-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Probation">Thử việc (Probation)</option>
              <option value="Official">Chính thức (Official)</option>
              <option value="Resigned">Đã nghỉ việc</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Chức vụ</th>
                <th>Phòng ban</th>
                <th>Ngày vào làm</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ transition: 'background-color 0.2s' }} className="hover:bg-white/5">
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: '2.5rem', height: '2.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>{emp.avatar}</div>
                      <div className="flex-col">
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{emp.department === 'IT' ? 'Engineering' : 'Staff'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{emp.position}</td>
                  <td><span className="badge badge-purple">{emp.department}</span></td>
                  <td>{emp.joinDate}</td>
                  <td>
                    {emp.status === 'Active' ? (
                      <span className="badge badge-success">Chính thức</span>
                    ) : (
                      <span className="badge badge-warning">Thử việc</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Chi tiết</button>
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
