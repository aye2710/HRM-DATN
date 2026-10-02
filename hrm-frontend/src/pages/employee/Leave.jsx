import React, { useState, useEffect } from 'react';
import { CalendarRange, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';


export const EmployeeLeave = () => {
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState({ totalDays: 12, usedDays: 0 });
  const [loading, setLoading] = useState(true);
  const employeeId = localStorage.getItem('employeeId');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'PAID',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchData = async () => {
    if (!employeeId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/leaves/employee/${employeeId}`);
      setRequests(res.data.requests);
      setBalance(res.data.balance);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/leaves', {
        employeeId,
        ...formData
      });
      toast.success('Nộp đơn thành công');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi nộp đơn');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const availableDays = Number(balance.totalDays) - Number(balance.usedDays);

  return (
    <div className="animate-fade-in" style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarRange size={24} color="var(--primary)" /> Quản lý Nghỉ phép
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Theo dõi quỹ phép cá nhân và tạo đơn xin nghỉ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tạo đơn xin nghỉ
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>Tổng phép năm</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{Number(balance.totalDays)}</span>
        </div>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>Đã nghỉ</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{Number(balance.usedDays)}</span>
        </div>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>Còn lại</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{availableDays}</span>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Lịch sử xin nghỉ phép</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày nộp đơn</th>
                <th>Loại nghỉ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-4">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">Bạn chưa nộp đơn nghỉ phép nào.</td></tr>
              ) : (
                requests.map(lr => (
                  <tr key={lr.id}>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }} className="text-muted">{lr.id.substring(0, 8)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{lr.createdAt ? new Date(lr.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td><span className={`badge ${lr.leaveType === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{lr.leaveType === 'PAID' ? 'Có lương' : 'Không lương'}</span></td>
                    <td>{formatDate(lr.startDate)}</td>
                    <td>{formatDate(lr.endDate)}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lr.reason}</td>
                    <td>
                      {lr.status === 'APPROVED' && <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14}/> Đã duyệt</span>}
                      {lr.status === 'PENDING' && <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14}/> Chờ duyệt</span>}
                      {lr.status === 'REJECTED' && <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14}/> Từ chối</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card glass animate-fade-in" style={{ width: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Tạo đơn xin nghỉ</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Loại nghỉ</label>
                <select className="form-input" style={{ width: '100%' }} value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})}>
                  <option value="PAID">Có lương (Trừ vào quỹ phép)</option>
                  <option value="UNPAID">Không lương</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Từ ngày</label>
                  <input type="date" required className="form-input" style={{ width: '100%' }} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Đến ngày</label>
                  <input type="date" required className="form-input" style={{ width: '100%' }} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Lý do nghỉ</label>
                <textarea required className="form-input" style={{ width: '100%', resize: 'vertical' }} rows="3" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Nhập lý do chi tiết..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Nộp đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
