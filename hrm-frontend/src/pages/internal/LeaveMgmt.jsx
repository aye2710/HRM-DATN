import React from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { leaveRequests } from '../../mockData';

export const LeaveMgmt = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Duyệt Nghỉ Phép
          </h2>
          <p className="text-muted mt-2">Quản lý và phê duyệt đơn xin nghỉ phép của nhân sự.</p>
        </div>
      </div>

      <div className="card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Nhân viên</th>
                <th>Loại nghỉ</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Số ngày</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(lr => (
                <tr key={lr.id} style={{ transition: 'background-color 0.2s' }} className="hover:bg-white/5">
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{lr.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lr.empName}</td>
                  <td><span className="badge badge-purple" style={{ background: 'transparent', border: '1px solid var(--primary)' }}>{lr.type}</span></td>
                  <td>{lr.startDate}</td>
                  <td>{lr.endDate}</td>
                  <td style={{ fontWeight: 600 }}>{lr.days}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lr.reason}</td>
                  <td>
                    {lr.status === 'Approved' && <span className="badge badge-success">Đã duyệt</span>}
                    {lr.status === 'Pending' && <span className="badge badge-warning">Chờ duyệt</span>}
                    {lr.status === 'Rejected' && <span className="badge badge-error">Từ chối</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {lr.status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <button className="btn" style={{ padding: '0.4rem 0.75rem', background: 'var(--success-bg)', color: 'var(--success)' }}>
                          <CheckCircle size={16} /> Duyệt
                        </button>
                        <button className="btn" style={{ padding: '0.4rem 0.75rem', background: 'var(--error-bg)', color: 'var(--error)' }}>
                          <XCircle size={16} /> Hủy
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.875rem' }}>Đã xử lý</span>
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
