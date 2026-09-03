import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building, Users, Search, Plus, Filter, MoreVertical, Edit2, Trash2, X, AlertTriangle, Lock, Unlock } from 'lucide-react';
import axios from 'axios';

export const Departments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({ code: '', name: '', managerName: '', quota: 15, parentId: '', status: 'ACTIVE' });

  // Delete confirm state
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ code: '', name: '', managerName: '', quota: 15, parentId: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setFormData({
      code: dept.code,
      name: dept.name,
      managerName: dept.managerName || '',
      quota: dept.quota || 15,
      parentId: dept.parentId || '',
      status: dept.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      alert('Vui lòng nhập đủ Mã và Tên phòng ban!');
      return;
    }
    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/departments', formData)
        .then(() => {
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => alert(err.response?.data?.error || 'Lỗi thêm phòng ban'));
    } else {
      axios.put(`http://localhost:5000/api/departments/${editingId}`, formData)
        .then(() => {
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => alert(err.response?.data?.error || 'Lỗi sửa phòng ban'));
    }
  };

  const handleToggleStatus = (dept) => {
    const newStatus = (dept.status === 'ACTIVE' || dept.status === 'Hoạt động') ? 'INACTIVE' : 'ACTIVE';
    axios.put(`http://localhost:5000/api/departments/${dept.id}`, { ...dept, status: newStatus })
      .then(() => fetchDepartments())
      .catch(err => alert(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái'));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    axios.delete(`http://localhost:5000/api/departments/${deleteId}`)
      .then(() => {
        fetchDepartments();
        setDeleteId(null);
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Lỗi xóa phòng ban');
        setDeleteId(null);
      });
  };

  const totalDepts = departments.length;
  const totalHeadcount = departments.reduce((acc, dept) => acc + (dept._count?.employees || 0), 0);

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-col gap-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Phòng ban</h1>
          <p className="text-muted text-sm">Quản lý cơ cấu phòng ban và số lượng nhân sự</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Thêm Phòng ban
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card glass card-hover">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
              <Building size={24} color="var(--primary)" />
            </div>
            <div>
              <p className="text-muted text-sm font-medium mb-1">Tổng Phòng ban</p>
              <h3 className="text-2xl font-bold money-text">{totalDepts}</h3>
            </div>
          </div>
        </div>

        <div className="card glass card-hover">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
              <Users size={24} color="var(--success)" />
            </div>
            <div>
              <p className="text-muted text-sm font-medium mb-1">Tổng Nhân sự hiện tại</p>
              <h3 className="text-2xl font-bold money-text">{totalHeadcount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card glass flex-col gap-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm mã PB, tên phòng ban..."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-outline" style={{ padding: '0.75rem', height: '100%' }}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên Phòng ban</th>
                <th>Mã PB</th>
                <th>Người đại diện</th>
                <th>Trực thuộc</th>
                <th>Số lượng nhân sự</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-8">Đang tải dữ liệu từ server...</td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-8">Không tìm thấy phòng ban nào</td>
                </tr>
              ) : (
                filteredDepartments.map(dept => {
                  const currentHeadcount = dept._count?.employees || 0;
                  const status = dept.status || 'Hoạt động';

                  return (
                    <tr key={dept.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <Building size={16} color="var(--text-muted)" />
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{dept.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--primary)' }}>{dept.code}</td>
                      <td>{dept.managerName || '-'}</td>
                      <td>
                        {dept.parentId ? (
                          <span className="badge badge-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-muted)' }}>
                            {departments.find(d => d.id === dept.parentId)?.name || 'Không rõ'}
                          </span>
                        ) : (
                          <span className="text-muted text-sm italic">- Độc lập -</span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                          {currentHeadcount} nhân sự
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status === 'ACTIVE' || status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                          {status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleToggleStatus(dept)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title={status === 'ACTIVE' || status === 'Hoạt động' ? 'Khóa (Ngưng hoạt động)' : 'Mở khóa (Hoạt động)'}>
                            {status === 'ACTIVE' || status === 'Hoạt động' ? <Unlock size={16} color="var(--success)" /> : <Lock size={16} color="var(--warning)" />}
                          </button>
                          <button onClick={() => handleOpenEdit(dept)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Chỉnh sửa">
                            <Edit2 size={16} color="var(--text-muted)" />
                          </button>
                          <button onClick={() => setDeleteId(dept.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Xóa">
                            <Trash2 size={16} color="var(--error)" />
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

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '600px', maxWidth: '95vw', padding: 0, animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {modalMode === 'add' ? 'Thêm Phòng ban Mới' : 'Cập nhật Phòng ban'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Mã phòng ban (Ví dụ: IT, MKT)</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Nhập mã PB..."
                />
              </div>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Tên phòng ban</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên phòng ban..."
                />
              </div>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Người đại diện</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.managerName || ''}
                  onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="Họ tên người đại diện..."
                />
              </div>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Phòng ban trực thuộc (Cấp cha)</label>
                <select
                  className="form-input w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg outline-none"
                  style={{ padding: '0.5rem' }}
                  value={formData.parentId}
                  onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="" className="text-black">-- Không thuộc phòng nào (Độc lập) --</option>
                  {departments.filter(d => d.id !== editingId).map(d => (
                    <option key={d.id} value={d.id} className="text-black">{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleSave} className="btn btn-primary">Lưu thông tin</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col items-center justify-center text-center gap-4" style={{ width: '400px', padding: '1.5rem', animation: 'zoomIn 0.2s ease-out' }}>
            <div className="flex items-center justify-center mb-2" style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle size={32} color="var(--error)" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Xác nhận xóa?</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Thao tác này sẽ xóa vĩnh viễn phòng ban khỏi hệ thống. Các nhân viên thuộc phòng ban này (nếu có) sẽ bị mất dữ liệu liên kết.
            </p>

            <div className="flex justify-center w-full" style={{ gap: '0.75rem' }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
              <button onClick={handleDelete} className="btn" style={{ flex: 1, backgroundColor: 'var(--error)', color: 'white' }}>Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
