import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const LeaveMgmt = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/leaves')
      .then(res => setLeaves(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    const actionText = newStatus === 'APPROVED' ? 'Duyệt' : 'Từ chối';
    const result = await Swal.fire({ title: 'Xác nhận', text: `Bạn có chắc muốn ${actionText} đơn này?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' });
    if (!result.isConfirmed) return;
    
    axios.put(`http://localhost:5000/api/leaves/${id}/status`, { status: newStatus, approverId: 'admin_id' })
      .then(() => {
        toast.success('Cập nhật trạng thái thành công');
        fetchLeaves();
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái đơn');
      });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Duyệt Nghỉ Phép
          </h2>
          <p className="text-muted mt-2">Quản lý và phê duyệt đơn xin nghỉ phép của nhân sự. Nếu duyệt loại Có lương, hệ thống sẽ tự trừ quỹ phép.</p>
        </div>
      </div>

      <div className="card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Loại nghỉ</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center text-muted p-8">Đang tải dữ liệu...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan="9" className="text-center text-muted p-8">Không có đơn xin nghỉ phép nào</td></tr>
              ) : (
                leaves.map(lr => {
                  const emp = lr.employee;
                  return (
                    <tr key={lr.id} style={{ transition: 'background-color 0.2s' }} className="hover:bg-white/5">
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{lr.id.substring(0,6).toUpperCase()}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp?.fullName || 'N/A'}</div>
                        <div className="text-muted text-xs">{emp?.code}</div>
                      </td>
                      <td className="text-sm">{emp?.department?.name || '-'}</td>
                      <td>
                        <span className={`badge ${lr.leaveType === 'PAID' ? 'badge-success' : 'badge-warning'}`} style={{ background: 'transparent', border: `1px solid ${lr.leaveType === 'PAID' ? 'var(--success)' : 'var(--warning)'}` }}>
                          {lr.leaveType === 'PAID' ? 'Có Lương' : 'Không Lương'}
                        </span>
                      </td>
                      <td>{new Date(lr.startDate).toLocaleDateString('vi-VN')}</td>
                      <td>{new Date(lr.endDate).toLocaleDateString('vi-VN')}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={lr.reason}>{lr.reason || '-'}</td>
                      <td>
                        {lr.status === 'APPROVED' && <span className="badge badge-success">Đã duyệt</span>}
                        {lr.status === 'PENDING' && <span className="badge badge-warning">Chờ duyệt</span>}
                        {lr.status === 'REJECTED' && <span className="badge badge-error">Từ chối</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {lr.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleUpdateStatus(lr.id, 'APPROVED')} className="btn" style={{ padding: '0.4rem 0.75rem', background: 'var(--success-bg)', color: 'var(--success)' }}>
                              <CheckCircle size={16} /> Duyệt
                            </button>
                            <button onClick={() => handleUpdateStatus(lr.id, 'REJECTED')} className="btn" style={{ padding: '0.4rem 0.75rem', background: 'var(--error-bg)', color: 'var(--error)' }}>
                              <XCircle size={16} /> Hủy
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

