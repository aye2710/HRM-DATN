import React, { useState, useEffect } from 'react';
import { Clock, Search, Plus, Filter, Edit2, Trash2, X } from 'lucide-react';
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
      setShifts(res.data);
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
      return toast.error("Vui lòng điền đủ thông tin");
    }
    
    try {
      // Vì API post /shifts của tôi trong code backend hỗ trợ cả thêm (chưa update sửa logic), 
      // Nhưng để đơn giản, hiện tại ta có thể xóa cái cũ thêm cái mới nếu id tồn tại, 
      // HOẶC gọi API tạo mới
      if (formData.id) {
        // Thực tế backend chưa có API PUT /shifts/:id. Ta sẽ xoá cái cũ đi rồi tạo cái mới (hack nhanh)
        await axios.delete(`http://localhost:5000/api/attendance/shifts/${formData.id}`);
      }
      
      await axios.post('http://localhost:5000/api/attendance/shifts', {
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakTime: formData.breakTime || null,
        workHours: Number(formData.workHours),
        isActive: formData.isActive
      });

      toast.success(formData.id ? 'Đã cập nhật ca làm việc' : 'Đã thêm ca làm việc mới');
      setIsModalOpen(false);
      fetchShifts();
    } catch (error) {
      toast.error('Lỗi khi lưu ca làm việc');
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={24} color="var(--primary)" /> Ca làm việc
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Cấu hình thời gian làm việc và nghỉ ngơi theo từng ca</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Thêm Ca mới
        </button>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '350px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm ca làm việc..." 
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
                <th>Tên Ca</th>
                <th>Giờ làm việc</th>
                <th>Giờ nghỉ (Break)</th>
                <th>Tổng công (Giờ)</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : shifts.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Không tìm thấy ca làm việc phù hợp. Vui lòng thêm mới.
                  </td>
                </tr>
              ) : (
                shifts.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(shift => (
                  <tr key={shift.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--bg-hover)' }}>
                          <Clock size={16} color="var(--warning)" />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{shift.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', color: 'var(--primary)' }}>{shift.startTime} - {shift.endTime}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{shift.breakTime || '-'}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 'bold' }}>{Number(shift.workHours)}h</span>
                    </td>
                    <td>
                      <span className={`badge ${shift.isActive ? 'badge-success' : 'badge-error'}`}>
                        {shift.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Sửa" onClick={() => handleOpenModal(shift)}>
                          <Edit2 size={16} color="var(--text-muted)" />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Xóa" onClick={() => {
                          Swal.fire({
                            title: 'Xóa ca làm việc?',
                            text: `Bạn có chắc chắn muốn xóa ca làm việc "${shift.name}" không?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: 'var(--error)',
                            cancelButtonColor: 'var(--text-muted)',
                            confirmButtonText: 'Đồng ý xóa',
                            cancelButtonText: 'Hủy'
                          }).then(async (result) => {
                            if (result.isConfirmed) {
                              try {
                                await axios.delete(`http://localhost:5000/api/attendance/shifts/${shift.id}`);
                                fetchShifts();
                                toast.success('Đã xóa ca làm việc thành công');
                              } catch(e) {
                                toast.error('Lỗi khi xóa ca làm việc');
                              }
                            }
                          });
                        }}>
                          <Trash2 size={16} color="var(--error)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card glass animate-fade-in" style={{ width: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                {formData.id ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Tên ca làm việc</label>
                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Ca Hành chính" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Giờ bắt đầu</label>
                  <input required type="time" className="form-input" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Giờ kết thúc</label>
                  <input required type="time" className="form-input" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Giờ nghỉ ngơi (Break time)</label>
                <input type="text" className="form-input" value={formData.breakTime} onChange={e => setFormData({...formData, breakTime: e.target.value})} placeholder="VD: 12:00 - 13:30" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Tổng công (Số giờ)</label>
                  <input required type="number" step="0.5" className="form-input" value={formData.workHours} onChange={e => setFormData({...formData, workHours: e.target.value})} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.8rem' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem' }} />
                  <label htmlFor="isActive" style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)', cursor: 'pointer' }}>Hoạt động</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
