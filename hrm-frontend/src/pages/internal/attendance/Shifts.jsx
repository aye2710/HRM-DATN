import React, { useState, useEffect } from 'react';
import { Clock, Search, Plus, Edit2, Trash2, X, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    startTime: '08:00',
    endTime: '17:30',
    breakTime: '12:00 - 13:30',
    workHours: 8,
    isActive: true
  });

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/shifts');
      setShifts(res.data || []);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenModal = (shift = null) => {
    if (shift) {
      setFormData({
        id: shift.id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakTime: shift.breakTime || '',
        workHours: Number(shift.workHours),
        isActive: shift.isActive
      });
    } else {
      setFormData({
        id: null,
        name: '',
        startTime: '08:00',
        endTime: '17:30',
        breakTime: '12:00 - 13:30',
        workHours: 8,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startTime || !formData.endTime) {
      return toast.error('Vui lòng điền đủ thông tin ca làm việc');
    }

    try {
      const payload = {
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakTime: formData.breakTime || null,
        workHours: Number(formData.workHours),
        isActive: formData.isActive
      };

      if (formData.id) {
        await axios.put(`http://localhost:5000/api/attendance/shifts/${formData.id}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/attendance/shifts', payload);
      }

      toast.success(formData.id ? 'Đã cập nhật thông số ca làm việc' : 'Đã thêm ca làm việc mới');
      setIsModalOpen(false);
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu ca làm việc');
    }
  };

  const addMinutesToTime = (timeStr, mins) => {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  const filteredShifts = shifts.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* 1. Compact Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.9rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            backgroundColor: '#EFF6FF', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Clock size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Cấu hình Ca làm việc & Quy tắc Đối soát Máy chấm công
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
              Thiết lập khung giờ chuẩn để hệ thống tự động phân tích log Vân tay / FaceID thành công chuẩn, đi muộn hoặc thiếu giờ ra.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ height: 34, padding: '0 0.9rem', fontSize: '0.8rem' }}>
          <Plus size={15} /> Thêm Ca làm việc
        </button>
      </div>

      {/* 2. Thanh Quy tắc Đối soát Log Máy chấm công tự động (Chuẩn Công ty LLA) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '0.75rem'
      }}>
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.65rem', padding: '0.75rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
          <CheckCircle2 size={18} color="#15803D" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.45 }}>
            <strong style={{ color: '#14532D', display: 'block', marginBottom: 2 }}>1. Ân hạn đi muộn ≤ 5 phút (08:00 – 08:05)</strong>
            Quét vân tay vào ca không quá <strong>5 phút</strong> và có quét ra cuối ca ➔ Tự động tính đủ <strong>1.0 công</strong>, không phạt.
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.65rem', padding: '0.75rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.45 }}>
            <strong style={{ color: '#78350F', display: 'block', marginBottom: 2 }}>2. Đi muộn 5 phút – 1 tiếng (08:06 – 09:00)</strong>
            Phải làm <strong>Đơn xin đi muộn</strong> trình PM ký (tối đa <strong>3 lần/tháng</strong> vẫn được tính đủ công; không làm đơn hoặc từ lần thứ 4 sẽ bị phạt).
          </div>
        </div>

        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.65rem', padding: '0.75rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
          <Cpu size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78rem', color: '#991B1B', lineHeight: 1.45 }}>
            <strong style={{ color: '#7F1D1D', display: 'block', marginBottom: 2 }}>3. Đi muộn &gt; 1 tiếng &amp; Quên Check-in/out</strong>
            Đi muộn <strong>&gt; 1 tiếng (sau 09:00)</strong> mất công buổi sáng (0.5 công). Quên vân tay phải làm <strong>Đơn xin xác nhận chấm công</strong>.
          </div>
        </div>
      </div>

      {/* 3. Bảng Danh sách Ca làm việc */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Tìm tên ca làm việc..." 
              className="form-input"
              style={{ paddingLeft: '2.1rem', width: '100%', height: 34, fontSize: '0.8125rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Tổng số: <strong>{filteredShifts.length}</strong> ca làm việc đang cấu hình
          </span>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 700 }}>Tên Ca làm việc</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700 }}>Khung giờ chuẩn</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700 }}>Mốc tính đi muộn (&gt;5p)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700 }}>Nghỉ giữa ca</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>Định mức</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 700 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Đang tải dữ liệu...</td></tr>
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    Không tìm thấy ca làm việc phù hợp.
                  </td>
                </tr>
              ) : (
                filteredShifts.map(shift => {
                  const graceLimit = addMinutesToTime(shift.startTime, 5);
                  return (
                    <tr key={shift.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.8rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={14} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{shift.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Áp dụng đồng bộ Máy chấm công</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}>
                          Sau {graceLimit} ➔ Báo vàng ⚠
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: '#475569', fontFamily: 'monospace' }}>
                        {shift.breakTime || '12:00 - 13:30'}
                      </td>
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{Number(shift.workHours)}h (1.0 công)</span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: shift.isActive ? '#DCFCE7' : '#FEE2E2',
                          color: shift.isActive ? '#15803D' : '#B91C1C'
                        }}>
                          {shift.isActive ? 'Đang áp dụng' : 'Ngưng áp dụng'}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            className="btn btn-outline"
                            style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Chỉnh sửa ca làm việc"
                            onClick={() => handleOpenModal(shift)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ height: 28, padding: '0 0.5rem', color: '#DC2626', borderColor: '#FECACA' }}
                            title="Xóa"
                            onClick={() => {
                              Swal.fire({
                                title: 'Xóa ca làm việc?',
                                text: `Bạn có chắc chắn muốn xóa "${shift.name}" không?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#DC2626',
                                confirmButtonText: 'Đồng ý xóa',
                                cancelButtonText: 'Hủy'
                              }).then(async (result) => {
                                if (result.isConfirmed) {
                                  try {
                                    await axios.delete(`http://localhost:5000/api/attendance/shifts/${shift.id}`);
                                    fetchShifts();
                                    toast.success('Đã xóa ca làm việc thành công');
                                  } catch (e) {
                                    toast.error('Lỗi khi xóa ca làm việc');
                                  }
                                }
                              });
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Ca */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Cập nhật Ca làm việc' : 'Thêm Ca làm việc mới'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveShift}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="form-label">Tên ca làm việc *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Ca Hành chính Văn phòng"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Giờ bắt đầu (In) *</label>
                    <input
                      required
                      type="time"
                      className="form-input"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Giờ kết thúc (Out) *</label>
                    <input
                      required
                      type="time"
                      className="form-input"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Khung giờ nghỉ trưa (Break time)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.breakTime}
                    onChange={e => setFormData({ ...formData, breakTime: e.target.value })}
                    placeholder="VD: 12:00 - 13:30"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Định mức giờ công *</label>
                    <input
                      required
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={formData.workHours}
                      onChange={e => setFormData({ ...formData, workHours: e.target.value })}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem', color: '#0F172A' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    Đang áp dụng
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu cấu hình ca</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
