import React, { useState, useEffect } from 'react';
import { Settings, Search, Plus, Filter, Trash2, XCircle, CalendarHeart } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const LeaveTypes = () => {
  const [types, setTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', code: '', defaultDays: 12, paid: true, carryForward: false, status: 'Hoạt động'
  });

  const fetchTypes = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/leave-config/types')
      .then(res => setTypes(res.data))
      .catch(err => toast.error('Lỗi lấy dữ liệu loại phép'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/leave-config/types', formData)
      .then(() => {
        toast.success('Thêm loại phép thành công');
        setShowModal(false);
        setFormData({ name: '', code: '', defaultDays: 12, paid: true, carryForward: false, status: 'Hoạt động' });
        fetchTypes();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Lỗi thêm loại phép'));
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Xóa loại phép?', text: "Hành động này không thể hoàn tác", icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
      axios.delete(`http://localhost:5000/api/leave-config/types/${id}`)
        .then(() => { toast.success('Xóa thành công'); fetchTypes(); })
        .catch(err => toast.error('Lỗi xóa loại phép'));
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Loại Nghỉ phép</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Cấu hình định mức, quy tắc hưởng lương và cộng dồn của từng loại phép</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tạo Loại phép mới
        </button>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm loại phép..." 
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
                <th>Loại phép (Tên / Mã)</th>
                <th>Định mức mặc định</th>
                <th>Hưởng lương</th>
                <th>Cộng dồn năm sau</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có loại phép nào</td></tr>
              ) : (
                types.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-hover)' }}>
                          <CalendarHeart size={16} color="var(--success)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{leave.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.code}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{leave.defaultDays} ngày</span>
                    </td>
                    <td>
                      {leave.paid ? <span style={{ color: 'var(--success)', fontWeight: 500 }}>Có</span> : <span style={{ color: 'var(--error)', fontWeight: 500 }}>Không</span>}
                    </td>
                    <td>
                      {leave.carryForward ? <span style={{ color: 'var(--success)', fontWeight: 500 }}>Có</span> : <span style={{ color: 'var(--error)', fontWeight: 500 }}>Không</span>}
                    </td>
                    <td>
                      <span className={`badge ${leave.status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button onClick={() => handleDelete(leave.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Thêm Loại Phép</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Tên loại phép</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Mã code</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Số ngày mặc định (Năm)</label>
                <input required type="number" min="0" className="form-input" style={{ width: '100%' }} value={formData.defaultDays} onChange={e => setFormData({...formData, defaultDays: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={formData.paid} onChange={e => setFormData({...formData, paid: e.target.checked})} />
                  Hưởng nguyên lương
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={formData.carryForward} onChange={e => setFormData({...formData, carryForward: e.target.checked})} />
                  Được cộng dồn
                </label>
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
