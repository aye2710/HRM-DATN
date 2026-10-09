import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building, Users, Search, Plus, Filter, MoreVertical, Edit2, Trash2, X, AlertTriangle, Lock, Unlock, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

// Hàm sinh mã phòng ban thông minh theo chuẩn doanh nghiệp
const generateDeptCode = (deptName) => {
  if (!deptName || !deptName.trim()) return '';

  const clean = removeVietnameseTones(deptName.trim().toLowerCase());

  // 1. Đối chiếu từ điển quy ước doanh nghiệp phổ biến
  const keywordMap = [
    { regex: /nhan\s*su|tuyen\s*dung|hr/i, code: 'HR' },
    { regex: /tai\s*chinh|ke\s*toan|finance/i, code: 'TCKT' },
    { regex: /phat\s*trien|phan\s*mem|lap\s*trinh|dev|software/i, code: 'DEV' },
    { regex: /kiem\s*thu|tester|qa|qc/i, code: 'TEST' },
    { regex: /phan\s*tich|business\s*analyst|ba/i, code: 'BA' },
    { regex: /giam\s*doc|ban\s*giam\s*doc|board/i, code: 'BGD' },
    { regex: /marketing|truyen\s*thong|mkt/i, code: 'MKT' },
    { regex: /kinh\s*doanh|ban\s*hang|sales/i, code: 'KD' },
    { regex: /ky\s*thuat|cong\s*nghe|it/i, code: 'IT' },
    { regex: /van\s*hanh|operations|ops/i, code: 'OPS' },
    { regex: /hanh\s*chinh|admin/i, code: 'HC' },
    { regex: /phap\s*che|legal/i, code: 'LEGAL' },
    { regex: /cham\s*soc\s*khach\s*hang|cskh/i, code: 'CSKH' },
    { regex: /an\s*ninh|bao\s*mat|security/i, code: 'SEC' }
  ];

  for (const item of keywordMap) {
    if (item.regex.test(clean)) {
      return item.code;
    }
  }

  // 2. Nếu không khớp từ điển: Lược bỏ hư từ tiền tố ('phong', 'ban', 'to', 'khoi', 'trung tam') và lấy chữ cái đầu
  const words = clean
    .split(/[\s\-_]+/)
    .filter(w => !['phong', 'ban', 'to', 'khoi', 'trung', 'tam', 'bo', 'phan'].includes(w));

  const targetWords = words.length > 0 ? words : clean.split(/[\s\-_]+/);
  const initials = targetWords.map(w => w[0]?.toUpperCase()).join('');

  return initials.slice(0, 6);
};

export const Departments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({ code: '', name: '', managerName: '', quota: 15, parentId: '', status: 'ACTIVE' });
  const [isManualCode, setIsManualCode] = useState(false);

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
    setIsManualCode(false);
    setFormData({ code: '', name: '', managerName: '', quota: 15, parentId: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setIsManualCode(true);
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

  // Tự động sinh mã khi nhập Tên phòng ban
  const handleNameChange = (e) => {
    const newName = e.target.value;
    const updated = { ...formData, name: newName };
    if (!isManualCode && modalMode === 'add') {
      updated.code = generateDeptCode(newName);
    }
    setFormData(updated);
  };

  // Người dùng tùy chỉnh mã: Cưỡng chế in hoa, lọc ký tự hợp lệ
  const handleCodeChange = (e) => {
    const raw = e.target.value;
    const sanitized = removeVietnameseTones(raw)
      .toUpperCase()
      .replace(/[^A-Z0-9_\-]/g, '');
    setFormData({ ...formData, code: sanitized });
    setIsManualCode(true);
  };

  // Nút chủ động sinh lại mã gợi ý
  const handleRegenerateCode = () => {
    if (!formData.name.trim()) {
      toast('Vui lòng nhập tên phòng ban trước khi sinh mã!', { icon: 'ℹ️' });
      return;
    }
    const autoCode = generateDeptCode(formData.name);
    setFormData(prev => ({ ...prev, code: autoCode }));
    setIsManualCode(false);
    toast.success(`Đã sinh mã gợi ý: ${autoCode}`);
  };

  const handleSave = () => {
    const cleanName = formData.name.trim();
    const cleanCode = formData.code.trim().toUpperCase();

    if (!cleanName) {
      toast.error('Vui lòng nhập Tên phòng ban!');
      return;
    }

    if (!cleanCode || cleanCode.length < 2) {
      toast.error('Mã phòng ban phải có tối thiểu 2 ký tự (Ví dụ: HR, IT, MKT)!');
      return;
    }

    // Kiểm tra trùng lặp mã phòng ban
    const isDuplicate = departments.some(
      d => d.code.toUpperCase() === cleanCode && d.id !== editingId
    );
    if (isDuplicate) {
      toast.error(`Mã phòng ban "${cleanCode}" đã được sử dụng! Vui lòng chọn mã khác.`);
      return;
    }

    const payload = {
      ...formData,
      name: cleanName,
      code: cleanCode
    };

    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/departments', payload)
        .then(() => {
          toast.success('Đã thêm phòng ban thành công!');
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi thêm phòng ban'));
    } else {
      axios.put(`http://localhost:5000/api/departments/${editingId}`, payload)
        .then(() => {
          toast.success('Đã cập nhật phòng ban!');
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi sửa phòng ban'));
    }
  };

  const handleToggleStatus = (dept) => {
    const newStatus = (dept.status === 'ACTIVE' || dept.status === 'Hoạt động') ? 'INACTIVE' : 'ACTIVE';
    axios.put(`http://localhost:5000/api/departments/${dept.id}`, { ...dept, status: newStatus })
      .then(() => fetchDepartments())
      .catch(err => toast.error(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái'));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    axios.delete(`http://localhost:5000/api/departments/${deleteId}`)
      .then(() => {
        fetchDepartments();
        setDeleteId(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi xóa phòng ban');
        setDeleteId(null);
      });
  };

  const totalDepts = departments.length;
  const totalHeadcount = departments.reduce((acc, dept) => acc + (dept._count?.employees || 0), 0);

  const filteredDepartments = departments.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === '' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });
  
  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex-col gap-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Phòng ban</h1>
          <p className="text-muted text-sm">Quản lý cơ cấu phòng ban và số lượng nhân sự</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Thêm Phòng ban
        </button>
      </div>

      {/* Main Content */}
      <div className="card glass flex-col gap-4" style={{ flex: 1 }}>
        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-full max-w-2xl">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm mã PB, tên phòng ban..."
                className="form-input w-full"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <select
              className="form-input"
              style={{ width: '200px' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">-- Trạng thái --</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
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
                paginatedDepartments.map(dept => {
                  const currentHeadcount = dept._count?.employees || 0;
                  const status = dept.status || 'Hoạt động';

                  return (
                    <tr key={dept.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
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

        {(() => {
          const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
          if (totalPages <= 1) return null;
          return (
            <div className="flex justify-between items-center mt-4 px-2">
              <span className="text-sm text-muted">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDepartments.length)} trong tổng số {filteredDepartments.length} phòng ban
              </span>
              <div className="flex gap-2">
                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  Trước
                </button>
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                    style={{ minWidth: '40px', padding: '0.4rem 0.8rem' }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="btn btn-outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  Sau
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '600px', maxWidth: '95vw', padding: 0, animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {modalMode === 'add' ? 'Thêm Phòng ban Mới' : 'Cập nhật Phòng ban'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Tên phòng ban <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Ví dụ: Phòng Nhân sự, Tổ Phát triển..."
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-muted)]">
                    Mã phòng ban <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    title="Gợi ý mã chuẩn theo tên phòng ban"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Sparkles size={13} />
                    <span>Sinh mã gợi ý</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input w-full font-mono font-semibold"
                  value={formData.code}
                  onChange={handleCodeChange}
                  placeholder="Ví dụ: HR, DEV, BGD, TCKT..."
                  style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <span className="text-xs text-[var(--text-muted)]" style={{ fontSize: '0.75rem', marginTop: '-2px' }}>
                  💡 Tự động in hoa, không dấu (Tối thiểu 2 ký tự: A-Z, 0-9)
                </span>
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
                  className="form-input w-full"
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

            <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleSave} className="btn btn-primary">Lưu thông tin</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col items-center justify-center text-center gap-4" style={{ width: '400px', padding: '1.5rem', animation: 'zoomIn 0.2s ease-out' }}>
            <div className="flex items-center justify-center mb-2" style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'var(--bg-hover)' }}>
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
