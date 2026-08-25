import React from 'react';
import { Search, Download, Filter, AlertCircle, Clock } from 'lucide-react';
import { attendanceList } from '../../mockData';

export const AttendanceMgmt = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2>Quản lý Chấm công</h2>
          <p className="text-muted mt-1">Giám sát giờ giấc & Tự động tính công theo bộ luật LLA</p>
        </div>
        <button className="btn btn-primary">
          <Download size={18} /> Xuất Excel Chấm Công
        </button>
      </div>

      <div className="card glass mb-6 card-hover">
        <div className="flex gap-4 mb-2">
          <div className="flex-col" style={{ width: '220px' }}>
            <label className="form-label">Ngày chấm công</label>
            <input type="date" className="form-input" defaultValue="2026-08-17" />
          </div>
          <div className="flex-col" style={{ flex: 1 }}>
            <label className="form-label">Tìm kiếm nhân sự</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" placeholder="Nhập Mã NV, Tên NV..." style={{ paddingLeft: '2.75rem' }} />
            </div>
          </div>
          <div className="flex-col" style={{ width: '220px' }}>
            <label className="form-label">Trạng thái (Bộ lọc)</label>
            <select className="form-input">
              <option value="">Tất cả trạng thái</option>
              <option value="On Time">Đúng giờ (kể cả Ân hạn)</option>
              <option value="Late">Đi muộn (Bị trừ công)</option>
              <option value="Night">Làm ca đêm</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-muted" style={{ fontSize: '0.85rem' }}>
        <AlertCircle size={16} color="var(--warning)" />
        <span><strong>Luật công ty:</strong> Khung giờ hành chính 08:30 - 17:30. Cho phép ân hạn (Grace Period) đi muộn tối đa 15 phút (08:45). Từ 08:46 trừ 0.5 công, từ 09:01 trừ 1.0 công.</span>
      </div>

      <div className="card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Tên nhân sự</th>
                <th>Ca làm việc</th>
                <th><div className="flex items-center gap-2"><Clock size={14}/> Check-in</div></th>
                <th><div className="flex items-center gap-2"><Clock size={14}/> Check-out</div></th>
                <th>Trạng thái (Auto)</th>
                <th>Khấu trừ / Phạt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((att, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{att.empId}</td>
                  <td style={{ fontWeight: 500 }}>{att.name}</td>
                  <td>{att.shift}</td>
                  <td style={{ color: att.deduction > 0 ? 'var(--error)' : 'var(--text-main)', fontWeight: att.deduction > 0 ? 600 : 400 }}>
                    {att.checkIn || '--:--'}
                  </td>
                  <td>{att.checkOut || '--:--'}</td>
                  <td>
                    <span className={`badge ${att.deduction > 0 ? 'badge-error' : (att.status.includes('Ca Đêm') ? 'badge-purple' : 'badge-success')}`}>
                      {att.status}
                    </span>
                  </td>
                  <td>
                    {att.deduction > 0 ? (
                      <span style={{ color: 'var(--error)', fontWeight: 600 }}>- {att.deduction} công</span>
                    ) : (
                      <span className="text-muted">Không trừ</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Sửa</button>
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
