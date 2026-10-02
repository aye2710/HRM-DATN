import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const LeaveMgmt = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho tìm kiếm, lọc và phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Logic lọc và tìm kiếm
  const filteredLeaves = leaves.filter(lr => {
    const matchesStatus = statusFilter === 'ALL' || lr.status === statusFilter;
    const empName = lr.employee?.fullName?.toLowerCase() || '';
    const empCode = lr.employee?.code?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    const matchesSearch = empName.includes(term) || empCode.includes(term);
    
    // Lọc theo ngày tạo đơn (createdAt)
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const createdDate = new Date(lr.createdAt);
      createdDate.setHours(0, 0, 0, 0); // Normalize time
      
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (createdDate < from) matchesDate = false;
      }
      
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (createdDate > to) matchesDate = false;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Logic phân trang
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const currentLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
            Duyệt Nghỉ Phép
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Quản lý và phê duyệt đơn xin nghỉ phép của nhân sự. Nếu duyệt loại Có lương, hệ thống sẽ tự trừ quỹ phép.</p>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm và Lọc */}
      <div className="card glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Tìm kiếm nhân sự</label>
          <Search size={18} style={{ position: 'absolute', left: '1rem', bottom: '0.6rem', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Mã NV, Tên NV..." 
            style={{ width: '100%', paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Từ ngày (Tạo đơn)</label>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '100%' }}
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Đến ngày (Tạo đơn)</label>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '100%' }}
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Trạng thái duyệt</label>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%' }}
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        
        {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo) && (
          <div>
            <button className="btn btn-outline" style={{ height: '2.6rem' }} onClick={() => {
              setSearchTerm(''); setStatusFilter('ALL'); setDateFrom(''); setDateTo(''); setCurrentPage(1);
            }}>
              Xóa lọc
            </button>
          </div>
        )}
      </div>

      <div className="card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày tạo</th>
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
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : currentLeaves.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy đơn xin nghỉ phép nào</td></tr>
              ) : (
                currentLeaves.map(lr => {
                  const emp = lr.employee;
                  return (
                    <tr key={lr.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{lr.id.substring(0,6).toUpperCase()}</td>
                      <td style={{ fontSize: '0.875rem' }}>{lr.createdAt ? new Date(lr.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp?.fullName || 'N/A'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{emp?.code}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{emp?.department?.name || '-'}</td>
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
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => handleUpdateStatus(lr.id, 'APPROVED')} className="btn" style={{ padding: '0.4rem 0.75rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: 'none' }}>
                              <CheckCircle size={16} /> Duyệt
                            </button>
                            <button onClick={() => handleUpdateStatus(lr.id, 'REJECTED')} className="btn" style={{ padding: '0.4rem 0.75rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', border: 'none' }}>
                              <XCircle size={16} /> Hủy
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLeaves.length)} trong số {filteredLeaves.length} đơn
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
              >
                Trang trước
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                {currentPage} / {totalPages}
              </span>
              <button 
                className="btn btn-outline" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

