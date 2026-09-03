import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, UserCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';

export const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    fullName: '',
    cccd: '',
    joinDate: '',
    status: 'ACTIVE',
    departmentId: '',
    positionId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        emp.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter ? emp.departmentId === deptFilter : true;
    const matchStatus = statusFilter ? emp.status === statusFilter : true;
    return matchSearch && matchDept && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success">Chính thức</span>;
      case 'PROBATION': return <span className="badge badge-warning">Thử việc</span>;
      case 'INTERNSHIP': return <span className="badge badge-info" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)' }}>Thực tập</span>;
      case 'ONBOARDING': return <span className="badge badge-info">Đang hội nhập</span>;
      case 'RESIGNED': return <span className="badge badge-error">Đã nghỉ việc</span>;
      default: return <span className="badge badge-purple">{status}</span>;
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      code: `NV${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      fullName: '',
      cccd: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      departmentId: '',
      positionId: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setFormData({
      id: emp.id,
      code: emp.code,
      fullName: emp.fullName,
      cccd: emp.cccd,
      joinDate: emp.joinDate ? emp.joinDate.split('T')[0] : '',
      status: emp.status,
      departmentId: emp.departmentId || '',
      positionId: emp.positionId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này? Dữ liệu không thể phục hồi.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Lỗi khi xóa nhân viên");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.fullName || !formData.cccd || !formData.joinDate) {
      return alert("Vui lòng điền đủ các trường bắt buộc (*)");
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/employees/${formData.id}`, formData);
        alert("Cập nhật thành công!");
      } else {
        await axios.post(`http://localhost:5000/api/employees`, formData);
        alert("Thêm mới thành công!");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Có lỗi xảy ra khi lưu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hồ sơ Nhân sự
          </h2>
          <p className="text-muted mt-2">Quản lý vòng đời, thông tin cá nhân và hợp đồng của toàn bộ nhân viên.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
          <Plus size={18} /> Thêm nhân sự mới
        </button>
      </div>

      <div className="card glass mb-4 flex-shrink-0">
        <div className="flex gap-4">
          <div className="flex-col" style={{ flex: 1 }}>
            <label className="form-label text-muted">Tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input w-full" 
                placeholder="Nhập tên hoặc mã nhân viên..." 
                style={{ paddingLeft: '3rem', background: 'rgba(255,255,255,0.02)' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-col" style={{ width: '250px' }}>
            <label className="form-label text-muted">Phòng ban</label>
            <select className="form-input w-full" style={{ background: 'rgba(255,255,255,0.02)' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="text-black">{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-col" style={{ width: '250px' }}>
            <label className="form-label text-muted">Trạng thái nhân sự</label>
            <select className="form-input w-full" style={{ background: 'rgba(255,255,255,0.02)' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE" className="text-black">Chính thức (Active)</option>
              <option value="PROBATION" className="text-black">Thử việc (Probation)</option>
              <option value="INTERNSHIP" className="text-black">Thực tập (Internship)</option>
              <option value="ONBOARDING" className="text-black">Đang hội nhập</option>
              <option value="RESIGNED" className="text-black">Đã nghỉ việc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
             <div className="p-8 text-center text-muted">Đang tải dữ liệu...</div>
          ) : filteredEmployees.length === 0 ? (
             <div className="p-12 text-center text-muted">Không tìm thấy nhân sự nào phù hợp.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[rgba(15,23,42,0.95)] backdrop-blur-md z-10">
                <tr className="border-b border-[rgba(255,255,255,0.1)]">
                  <th className="p-4 text-sm font-semibold text-muted">Mã NV</th>
                  <th className="p-4 text-sm font-semibold text-muted">Họ và Tên</th>
                  <th className="p-4 text-sm font-semibold text-muted">Chức vụ / Phòng ban</th>
                  <th className="p-4 text-sm font-semibold text-muted">Ngày vào làm</th>
                  <th className="p-4 text-sm font-semibold text-muted">Trạng thái</th>
                  <th className="p-4 text-sm font-semibold text-muted text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="p-4 font-semibold text-[var(--primary)]">{emp.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: '2.5rem', height: '2.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                          <UserCircle size={24} className="text-muted" />
                        </div>
                        <div className="flex-col">
                          <span className="font-semibold text-white">{emp.fullName}</span>
                          <span className="text-muted text-xs">CCCD: {emp.cccd}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{emp.position?.title || 'Chưa xếp chức vụ'}</div>
                      <div className="text-xs text-muted mt-1">{emp.department?.name || 'Chưa xếp phòng ban'}</div>
                    </td>
                    <td className="p-4">{new Date(emp.joinDate).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4">{getStatusBadge(emp.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(emp)} className="btn btn-outline p-2" title="Chỉnh sửa">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="btn btn-outline p-2" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--error)' }} title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Employee Modal */}
      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '600px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)] m-0">{isEditing ? 'Cập nhật Nhân viên' : 'Thêm Nhân viên mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors p-2"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem' }} className="grid grid-cols-2 gap-4">
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Mã Nhân Viên *</label>
                  <input type="text" required className="form-input w-full" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} disabled={isEditing} />
                </div>
                
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Họ và Tên *</label>
                  <input type="text" required className="form-input w-full" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>

                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Số CCCD *</label>
                  <input type="text" required className="form-input w-full" value={formData.cccd} onChange={e => setFormData({...formData, cccd: e.target.value})} />
                </div>

                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Ngày vào làm *</label>
                  <input type="date" required className="form-input w-full" style={{ colorScheme: 'dark' }} value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                </div>

                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Phòng ban</label>
                  <select className="form-input w-full" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
                  </select>
                </div>

                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Chức vụ (Vị trí)</label>
                  <select className="form-input w-full" value={formData.positionId} onChange={e => setFormData({...formData, positionId: e.target.value})}>
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map(p => <option key={p.id} value={p.id} className="text-black">{p.title}</option>)}
                  </select>
                </div>

                <div className="flex-col gap-2 col-span-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Trạng thái làm việc *</label>
                  <select className="form-input w-full" required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ONBOARDING" className="text-black">Đang hội nhập</option>
                    <option value="PROBATION" className="text-black">Thử việc (Probation)</option>
                    <option value="ACTIVE" className="text-black">Chính thức (Active)</option>
                    <option value="INTERNSHIP" className="text-black">Thực tập (Internship)</option>
                    <option value="RESIGNED" className="text-black">Đã nghỉ việc (Resigned)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
