import React, { useState, useEffect } from 'react';
import { FileBadge, Search, Plus, Filter, Trash2, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const LeavePolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', type: 'Nghỉ phép năm', seniority: '', extraDays: '', maxDays: ''
  });

  const fetchPolicies = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/leave-config/policies')
      .then(res => setPolicies(res.data))
      .catch(err => toast.error('Lỗi lấy dữ liệu chính sách'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/leave-config/policies', formData)
      .then(() => {
        toast.success('Thêm chính sách thành công');
        setShowModal(false);
        setFormData({ name: '', type: 'Nghỉ phép năm', seniority: '', extraDays: '', maxDays: '' });
        fetchPolicies();
      })
      .catch(err => toast.error('Lỗi thêm chính sách'));
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Xóa chính sách?', text: "Hành động này không thể hoàn tác", icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
      axios.delete(`http://localhost:5000/api/leave-config/policies/${id}`)
        .then(() => { toast.success('Xóa thành công'); fetchPolicies(); })
        .catch(err => toast.error('Lỗi xóa chính sách'));
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>Chính sách Nghỉ phép</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Cấu hình điều kiện hưởng và số ngày tối đa dựa theo thâm niên</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Thêm Chính sách
        </button>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm chính sách..." 
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
                <th>Tên Chính sách</th>
                <th>Áp dụng cho Loại phép</th>
                <th>Điều kiện Thâm niên</th>
                <th>Ngày cộng thêm</th>
                <th>Tối đa</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : policies.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có chính sách nào</td></tr>
              ) : (
                policies.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(policy => (
                  <tr key={policy.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-hover)' }}>
                          <FileBadge size={16} color="var(--primary)" />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{policy.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{policy.type}</span></td>
                    <td><span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{policy.seniority}</span></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 500 }}>{policy.extraDays}</span></td>
                    <td><span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{policy.maxDays}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button onClick={() => handleDelete(policy.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Thêm Chính Sách</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Tên chính sách</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Loại nghỉ áp dụng</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Thâm niên yêu cầu</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} placeholder="VD: 5 năm" value={formData.seniority} onChange={e => setFormData({...formData, seniority: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Ngày phép cộng thêm</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} placeholder="VD: +1 ngày" value={formData.extraDays} onChange={e => setFormData({...formData, extraDays: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Số ngày nghỉ tối đa</label>
                <input required type="text" className="form-input" style={{ width: '100%' }} placeholder="VD: 15 ngày" value={formData.maxDays} onChange={e => setFormData({...formData, maxDays: e.target.value})} />
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
