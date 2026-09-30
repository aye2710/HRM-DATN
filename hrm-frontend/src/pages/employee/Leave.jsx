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
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>Quản lý Nghỉ phép</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tạo đơn xin nghỉ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card text-center flex-col items-center glass">
          <span className="text-muted mb-2 uppercase text-sm font-semibold tracking-wider">Tổng phép năm</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{Number(balance.totalDays)}</span>
        </div>
        <div className="card text-center flex-col items-center glass">
          <span className="text-muted mb-2 uppercase text-sm font-semibold tracking-wider">Đã nghỉ</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>{Number(balance.usedDays)}</span>
        </div>
        <div className="card text-center flex-col items-center glass">
          <span className="text-muted mb-2 uppercase text-sm font-semibold tracking-wider">Còn lại</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{availableDays}</span>
        </div>
      </div>

      <div className="card glass">
        <h3 className="mb-4 text-lg">Lịch sử xin nghỉ phép</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Loại nghỉ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-4">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-4">Bạn chưa nộp đơn nghỉ phép nào.</td></tr>
              ) : (
                requests.map(lr => (
                  <tr key={lr.id}>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }} className="text-muted">{lr.id.substring(0, 8)}</td>
                    <td><span className={`badge ${lr.leaveType === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{lr.leaveType === 'PAID' ? 'Có lương' : 'Không lương'}</span></td>
                    <td>{formatDate(lr.startDate)}</td>
                    <td>{formatDate(lr.endDate)}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lr.reason}</td>
                    <td>
                      {lr.status === 'APPROVED' && <span className="badge badge-success flex items-center gap-1 w-max"><CheckCircle2 size={14}/> Đã duyệt</span>}
                      {lr.status === 'PENDING' && <span className="badge badge-warning flex items-center gap-1 w-max"><Clock size={14}/> Chờ duyệt</span>}
                      {lr.status === 'REJECTED' && <span className="badge badge-error flex items-center gap-1 w-max"><XCircle size={14}/> Từ chối</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
            <h2 className="mb-6">Tạo đơn xin nghỉ</h2>
            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Loại nghỉ</label>
                <select className="form-input w-full" value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})}>
                  <option value="PAID">Có lương (Trừ vào quỹ phép)</option>
                  <option value="UNPAID">Không lương</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Từ ngày</label>
                  <input type="date" required className="form-input w-full" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Đến ngày</label>
                  <input type="date" required className="form-input w-full" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Lý do nghỉ</label>
                <textarea required className="form-input w-full" rows="3" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Nhập lý do chi tiết..." />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Nộp đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
