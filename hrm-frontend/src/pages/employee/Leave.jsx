import React from 'react';
import { CalendarRange, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { leaveRequests } from '../../mockData';

export const EmployeeLeave = () => {
  const myLeaves = leaveRequests.filter(lr => lr.empName === 'Nguyễn Văn A' || lr.empName === 'Phạm Thị D'); // Mock filter

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2>Quản lý Nghỉ phép</h2>
        <button className="btn btn-primary">
          <Plus size={18} /> Tạo đơn xin nghỉ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card text-center flex-col items-center glass">
          <span className="text-muted mb-2">Tổng phép năm</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>12</span>
        </div>
        <div className="card text-center flex-col items-center glass">
          <span className="text-muted mb-2">Đã nghỉ</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>2</span>
        </div>
        <div className="card text-center flex-col items-center glass">
          <span className="text-muted mb-2">Còn lại</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>10</span>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4">Lịch sử xin nghỉ phép</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Loại nghỉ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Số ngày</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.map(lr => (
                <tr key={lr.id}>
                  <td style={{ fontWeight: 500 }}>{lr.id}</td>
                  <td>{lr.type}</td>
                  <td>{lr.startDate}</td>
                  <td>{lr.endDate}</td>
                  <td>{lr.days}</td>
                  <td>{lr.reason}</td>
                  <td>
                    {lr.status === 'Approved' && <span className="badge badge-success flex items-center gap-1"><CheckCircle2 size={14}/> Đã duyệt</span>}
                    {lr.status === 'Pending' && <span className="badge badge-warning flex items-center gap-1"><Clock size={14}/> Chờ duyệt</span>}
                    {lr.status === 'Rejected' && <span className="badge badge-error flex items-center gap-1"><XCircle size={14}/> Từ chối</span>}
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
