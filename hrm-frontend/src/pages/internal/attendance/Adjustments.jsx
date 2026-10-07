import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Adjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/adjustments');
      setAdjustments(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải yêu cầu điều chỉnh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    const isApprove = status === 'APPROVED';
    
    Swal.fire({
      title: isApprove ? 'Duyệt yêu cầu?' : 'Từ chối yêu cầu?',
      text: isApprove 
        ? 'Bạn có chắc chắn muốn duyệt yêu cầu điều chỉnh công này?' 
        : 'Bạn có chắc chắn muốn từ chối yêu cầu điều chỉnh công này?',
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? 'var(--success)' : 'var(--error)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: isApprove ? 'Đồng ý duyệt' : 'Đồng ý từ chối',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`http://localhost:5000/api/attendance/adjustments/${id}/status`, { status });
          toast.success(isApprove ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu');
          fetchAdjustments();
        } catch (err) {
          toast.error('Lỗi xử lý yêu cầu');
        }
      }
    });
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCcw size={24} color="var(--primary)" /> Điều chỉnh Chấm công
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Xử lý các yêu cầu cập nhật lại giờ vào/ra bị lỗi hoặc quên chấm công</p>
        </div>
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
                <th>Ngày / Phân loại</th>
                <th>Yêu cầu điều chỉnh</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Phê duyệt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : adjustments.filter(a => a.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Không có yêu cầu điều chỉnh nào.
                  </td>
                </tr>
              ) : (
                adjustments.filter(a => a.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map(adj => (
                  <tr key={adj.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}>{adj.employee?.fullName?.charAt(0)}</div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{adj.employee?.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{new Date(adj.date).toLocaleDateString('vi-VN')}</span>
                        <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>{adj.type}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{adj.oldTime || '--:--'}</span>
                        <RefreshCcw size={12} color="var(--primary)" />
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{adj.newTime}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={adj.reason}>
                      {adj.reason}
                    </td>
                    <td>
                      {adj.status === 'PENDING' && <span className="badge badge-warning">Chờ duyệt</span>}
                      {adj.status === 'APPROVED' && <span className="badge badge-success">Đã duyệt</span>}
                      {adj.status === 'REJECTED' && <span className="badge badge-error">Từ chối</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {adj.status === 'PENDING' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--success)' }} title="Duyệt" onClick={() => handleUpdateStatus(adj.id, 'APPROVED')}>
                            <CheckCircle size={18} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--error)' }} title="Từ chối" onClick={() => handleUpdateStatus(adj.id, 'REJECTED')}>
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
