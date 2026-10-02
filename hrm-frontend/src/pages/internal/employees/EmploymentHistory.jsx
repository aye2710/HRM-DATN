import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, Filter, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';

export const EmploymentHistory = () => {
  const [employments, setEmployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/employees/history')
      .then(res => setEmployments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} color="var(--primary)" /> Lịch sử Việc làm
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Tra cứu quá trình công tác, lịch sử thăng tiến và thay đổi mức lương</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Cập nhật Việc làm
        </button>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '350px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-outline" style={{ padding: '0.5rem', flexShrink: 0 }}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="table-container" style={{ margin: '0 1.5rem 1.5rem 1.5rem' }}>
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
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu lịch sử...</td></tr>
              ) : (
                <>
                  {employments.filter(e => e.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar" style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold' }}>{emp.employee?.fullName?.charAt(0) || 'N'}</div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.employee?.fullName || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                          <Briefcase size={14} color="var(--primary)" />
                          {emp.position?.title || '—'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{emp.department?.name || '—'}</td>
                      <td>
                        <span className={`badge ${emp.changeReason?.includes('Thăng') || emp.changeReason?.includes('Điều chuyển') ? 'badge-success' : emp.changeReason?.includes('Nghỉ việc') ? 'badge-error' : 'badge-purple'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {(emp.changeReason?.includes('Thăng') || emp.changeReason?.includes('Điều chuyển')) && <TrendingUp size={12} />}
                          {emp.changeReason}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {new Date(emp.effectiveDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          <DollarSign size={14} color="var(--text-muted)" />
                          <span>{emp.salary ? Number(emp.salary).toLocaleString() + ' đ' : 'Theo Hợp đồng'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employments.filter(e => e.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Không tìm thấy lịch sử việc làm phù hợp
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
