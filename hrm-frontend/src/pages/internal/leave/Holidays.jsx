import React, { useState, useEffect } from 'react';
import { CalendarDays, Search, Plus, Filter, Trash2, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', date: '' });

  const fetchHolidays = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/holidays')
      .then(res => setHolidays(res.data))
      .catch(err => toast.error('Lỗi lấy danh sách nghỉ lễ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/holidays', formData)
      .then(() => {
        toast.success('Thêm ngày lễ thành công');
        setShowModal(false);
        setFormData({ name: '', date: '' });
        fetchHolidays();
      })
      .catch(err => toast.error('Lỗi khi thêm ngày lễ'));
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Xóa ngày lễ?', text: "Hành động này không thể hoàn tác", icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
      axios.delete(`http://localhost:5000/api/holidays/${id}`)
        .then(() => {
          toast.success('Xóa thành công');
          fetchHolidays();
        })
        .catch(err => toast.error('Lỗi khi xóa'));
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Lịch Nghỉ Lễ</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Cấu hình các ngày nghỉ lễ có lương trong năm của Công ty và Quốc gia</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Thêm Ngày lễ
        </button>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm kỳ nghỉ lễ..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên Kỳ nghỉ</th>
                <th>Thời gian (Ngày)</th>
                <th>Phân loại</th>
                <th>Hưởng lương</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : holidays.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có lịch nghỉ lễ nào</td></tr>
              ) : (
                holidays.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map(holiday => (
                  <tr key={holiday.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-hover)' }}>
                          <CalendarDays size={16} color="var(--error)" />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{holiday.name}</span>
                      </div>
                    </td>
                    <td><span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{new Date(holiday.date).toLocaleDateString('vi-VN')}</span></td>
                    <td>
                      <span className="badge badge-error">Quốc gia</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--success)', fontWeight: 500 }}>Có</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button onClick={() => handleDelete(holiday.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
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

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card glass animate-fade-in" style={{ width: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Thêm Ngày Lễ</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Tên ngày lễ</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} placeholder="VD: Tết Nguyên Đán" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Ngày nghỉ</label>
                <input required type="date" className="form-input" style={{ width: '100%' }} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
