import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle, Lock, Unlock, Sparkles } from 'lucide-react';
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

// Hàm sinh mã vị trí thông minh theo chuẩn doanh nghiệp [PB]-[VỊ_TRÍ]
const generatePositionCode = (title, deptCode = '') => {
  if (!title || !title.trim()) return '';

  const cleanTitle = removeVietnameseTones(title.trim().toLowerCase());

  // 1. Từ điển quy ước chức danh phổ biến
  const roleMap = [
    { regex: /front\s*end|frontend|\bfe\b/i, code: 'FE' },
    { regex: /back\s*end|backend|\bbe\b/i, code: 'BE' },
    { regex: /full\s*stack|fullstack|\bfs\b/i, code: 'FS' },
    { regex: /mobile|android|ios|flutter|react\s*native/i, code: 'MOB' },
    { regex: /devops|cloud|sre|ha\s*tang/i, code: 'DEVOPS' },
    { regex: /tester|kiem\s*thu|\bqa\b|\bqc\b/i, code: 'QA' },
    { regex: /data\s*engineer|data\s*analyst|ky\s*su\s*du\s*lieu|khoa\s*hoc\s*du\s*lieu/i, code: 'DATA' },
    { regex: /ui\s*\/\s*ux|uiux|designer|thiet\s*ke|do\s*hoa/i, code: 'UIUX' },
    { regex: /product\s*manager|product\s*owner|\bpm\b|\bpo\b/i, code: 'PM' },
    { regex: /scrum\s*master/i, code: 'SM' },
    { regex: /business\s*analyst|phan\s*tich\s*nghiep\s*vu|\bba\b/i, code: 'BA' },
    { regex: /tuyen\s*dung|recruiter|recruitment/i, code: 'REC' },
    { regex: /c&b|tien\s*luong|dai\s*ngo|compensation/i, code: 'CNB' },
    { regex: /nhan\s*su\s*tong\s*hop|hr\s*generalist|hrbp/i, code: 'HRBP' },
    { regex: /dao\s*tao|training|l&d/i, code: 'LND' },
    { regex: /ke\s*toan\s*thue|thue/i, code: 'TAX' },
    { regex: /ke\s*toan\s*tong\s*hop/i, code: 'KTTH' },
    { regex: /ke\s*toan\s*kho|kho/i, code: 'KHO' },
    { regex: /ke\s*toan\s*thanh\s*toan/i, code: 'KTTT' },
    { regex: /ke\s*toan/i, code: 'KT' },
    { regex: /thu\s*quy|treasury/i, code: 'TREAS' },
    { regex: /kiem\s*toan/i, code: 'AUDIT' },
    { regex: /content|bien\s*tap|copywriter/i, code: 'CONTENT' },
    { regex: /seo|digital\s*marketing/i, code: 'SEO' },
    { regex: /media|video|editor/i, code: 'MEDIA' },
    { regex: /kinh\s*doanh|ban\s*hang|sales/i, code: 'SALES' },
    { regex: /cham\s*soc\s*khach\s*hang|cskh|support/i, code: 'CSKH' },
    { regex: /phap\s*che|legal/i, code: 'LEGAL' },
    { regex: /an\s*ninh|bao\s*mat|security/i, code: 'SEC' },
    { regex: /hanh\s*chinh|admin/i, code: 'ADMIN' },
    { regex: /giam\s*doc\s*dieu\s*hanh|\bceo\b/i, code: 'CEO' },
    { regex: /giam\s*doc\s*cong\s*nghe|\bcto\b/i, code: 'CTO' },
    { regex: /giam\s*doc\s*tai\s*chinh|\bcfo\b/i, code: 'CFO' },
    { regex: /giam\s*doc\s*nhan\s*su|\bchro\b/i, code: 'CHRO' },
    { regex: /giam\s*doc\s*van\s*hanh|\bcoo\b/i, code: 'COO' },
    { regex: /giam\s*doc|director/i, code: 'DIR' },
    { regex: /truong\s*phong|lead/i, code: 'LEAD' }
  ];

  let roleCode = '';
  for (const item of roleMap) {
    if (item.regex.test(cleanTitle)) {
      roleCode = item.code;
      break;
    }
  }

  // 2. Nếu không khớp từ điển: lược bỏ hư từ và lấy các chữ cái đầu
  if (!roleCode) {
    const words = cleanTitle
      .split(/[\s\-_/]+/)
      .filter(w => !['nhan', 'vien', 'chuyen', 'to', 'truong', 'pho', 'can', 'bo', 'chuc', 'danh', 'vi', 'tri'].includes(w));
    const targetWords = words.length > 0 ? words : cleanTitle.split(/[\s\-_/]+/);
    roleCode = targetWords.map(w => w[0]?.toUpperCase()).join('').slice(0, 5);
  }

  const prefix = (deptCode || '').trim().toUpperCase();
  if (!prefix) {
    return roleCode;
  }

  // Tránh lặp tiền tố nếu roleCode đã trùng tiền tố phòng ban (VD: HR-HR -> HR)
  if (roleCode === prefix || roleCode.startsWith(`${prefix}-`)) {
    return roleCode;
  }

  return `${prefix}-${roleCode}`;
};

export const Positions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({ code: '', title: '', description: '', level: 'Staff', minSalary: 0, maxSalary: 0, departmentId: '', status: 'ACTIVE' });
  const [isManualCode, setIsManualCode] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, []);

  const fetchPositions = () => {
    axios.get('http://localhost:5000/api/positions')
      .then(res => setPositions(res.data))
      .catch(err => console.error(err));
  };

  const fetchDepartments = () => {
    axios.get('http://localhost:5000/api/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err));
  };

  const getDeptCode = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.code : '';
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setIsManualCode(false);
    setFormData({ code: '', title: '', description: '', level: 'Staff', minSalary: 0, maxSalary: 0, departmentId: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const handleOpenEdit = (pos) => {
    setModalMode('edit');
    setEditingId(pos.id);
    setIsManualCode(true);
    setFormData({
      code: pos.code || '',
      title: pos.title || '',
      description: pos.description || '',
      level: pos.level || 'Staff',
      minSalary: pos.minSalary || 0,
      maxSalary: pos.maxSalary || 0,
      departmentId: pos.departmentId || '',
      status: pos.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  // Tự động sinh mã khi nhập Tên vị trí
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const updated = { ...formData, title: newTitle };
    if (!isManualCode && modalMode === 'add') {
      const deptCode = getDeptCode(formData.departmentId);
      updated.code = generatePositionCode(newTitle, deptCode);
    }
    setFormData(updated);
  };

  // Cập nhật lại mã nếu đổi Phòng ban trực thuộc (khi chưa sửa tay)
  const handleDepartmentChange = (e) => {
    const newDeptId = e.target.value;
    const updated = { ...formData, departmentId: newDeptId };
    if (!isManualCode && modalMode === 'add') {
      const deptCode = getDeptCode(newDeptId);
      updated.code = generatePositionCode(formData.title, deptCode);
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
    if (!formData.title.trim()) {
      toast('Vui lòng nhập Tên vị trí trước khi sinh mã!', { icon: 'ℹ️' });
      return;
    }
    const deptCode = getDeptCode(formData.departmentId);
    const autoCode = generatePositionCode(formData.title, deptCode);
    setFormData(prev => ({ ...prev, code: autoCode }));
    setIsManualCode(false);
    toast.success(`Đã sinh mã gợi ý: ${autoCode}`);
  };

  const handleSave = () => {
    const cleanTitle = formData.title.trim();
    const cleanCode = formData.code.trim().toUpperCase();

    if (!cleanTitle) {
      toast.error('Vui lòng nhập Tên vị trí / Chức danh!');
      return;
    }

    if (!cleanCode || cleanCode.length < 2) {
      toast.error('Mã vị trí phải có tối thiểu 2 ký tự (Ví dụ: DEV-FE, HR-REC)!');
      return;
    }

    // Kiểm tra trùng lặp mã vị trí
    const isDuplicate = positions.some(
      p => p.code.toUpperCase() === cleanCode && p.id !== editingId
    );
    if (isDuplicate) {
      toast.error(`Mã vị trí "${cleanCode}" đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }

    if (formData.minSalary > 0 && formData.maxSalary > 0 && formData.minSalary > formData.maxSalary) {
      toast.error('Lương tối thiểu không được lớn hơn lương tối đa!');
      return;
    }

    const payload = {
      ...formData,
      title: cleanTitle,
      code: cleanCode
    };

    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/positions', payload)
        .then(() => {
          toast.success('Đã thêm vị trí thành công!');
          fetchPositions();
          setShowModal(false);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi thêm vị trí'));
    } else {
      axios.put(`http://localhost:5000/api/positions/${editingId}`, payload)
        .then(() => {
          toast.success('Đã cập nhật vị trí!');
          fetchPositions();
          setShowModal(false);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi sửa vị trí'));
    }
  };

  const handleToggleStatus = (pos) => {
    const newStatus = pos.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    axios.put(`http://localhost:5000/api/positions/${pos.id}`, { ...pos, status: newStatus })
      .then(() => fetchPositions())
      .catch(err => toast.error(err.response?.data?.error || 'Lỗi cập nhật trạng thái'));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    axios.delete(`http://localhost:5000/api/positions/${deleteId}`)
      .then(() => {
        fetchPositions();
        setDeleteId(null);
      })
      .catch(err => toast.error(err.response?.data?.error || 'Lỗi xóa vị trí'));
  };

  const filteredPositions = positions.filter(pos => {
    const matchSearch = pos.title?.toLowerCase().includes(searchTerm.toLowerCase()) || pos.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDepartment ? pos.departmentId === filterDepartment : true;
    const matchLevel = filterLevel ? pos.level === filterLevel : true;
    return matchSearch && matchDept && matchLevel;
  });

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const paginatedPositions = filteredPositions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex-col gap-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vị trí / Chức danh</h1>
          <p className="text-muted text-sm">Quản lý danh mục vị trí, cấp bậc và khung lương theo tiêu chuẩn</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Thêm Vị trí
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-full max-w-4xl">
            <div style={{ position: 'relative', width: '40%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm mã/tên vị trí..."
                className="form-input w-full"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <select
              className="form-input flex-1 bg-white border border-[var(--border)] text-[var(--text-heading)] rounded-lg outline-none"
              style={{ padding: '0.6rem 1rem' }}
              value={filterDepartment}
              onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
            >
              <option value="" className="text-black">-- Tất cả phòng ban --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="text-black">{d.name}</option>
              ))}
            </select>

            <select
              className="form-input flex-1 bg-white border border-[var(--border)] text-[var(--text-heading)] rounded-lg outline-none"
              style={{ padding: '0.6rem 1rem' }}
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }}
            >
              <option value="" className="text-black">-- Tất cả cấp bậc --</option>
              {Array.from(new Set(positions.map(p => p.level))).filter(Boolean).map(lvl => (
                <option key={lvl} value={lvl} className="text-black">{lvl}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề / Mã</th>
                <th>Phòng ban</th>
                <th>Cấp bậc</th>
                <th>Khung lương (VND)</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPositions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-8">Không tìm thấy vị trí nào</td>
                </tr>
              ) : (
                paginatedPositions.map(pos => (
                  <tr key={pos.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                          <Briefcase size={16} color="var(--accent)" />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pos.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pos.code}</span>
                        </div>
                      </div>
                    </td>
                    <td>{pos.department?.name || 'Chung (Toàn công ty)'}</td>
                    <td>
                      <span className="badge badge-info">{pos.level}</span>
                    </td>
                    <td>
                      <span className="money-text">
                        {pos.minSalary === 0 && pos.maxSalary === 0 ? 'Thỏa thuận' :
                          `${pos.minSalary.toLocaleString()} - ${pos.maxSalary.toLocaleString()}`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${pos.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                        {pos.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleToggleStatus(pos)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title={pos.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}>
                          {pos.status === 'ACTIVE' ? <Unlock size={16} color="var(--success)" /> : <Lock size={16} color="var(--warning)" />}
                        </button>
                        <button onClick={() => handleOpenEdit(pos)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Chỉnh sửa">
                          <Edit2 size={16} color="var(--text-muted)" />
                        </button>
                        <button onClick={() => setDeleteId(pos.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Xóa">
                          <Trash2 size={16} color="var(--error)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-2">
            <span className="text-sm text-muted">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPositions.length)} trong tổng số {filteredPositions.length} vị trí
            </span>
            <div className="flex gap-2">
              <button 
                className="btn btn-outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Trước
              </button>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  style={{ minWidth: '40px', padding: '0.5rem' }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '700px', maxWidth: '95vw', padding: 0, animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {modalMode === 'add' ? 'Thêm Vị trí Mới' : 'Cập nhật Vị trí'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Row 1: Tên vị trí & Phòng ban trực thuộc */}
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Tên vị trí / Chức danh <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Ví dụ: Frontend Developer, Chuyên viên Tuyển dụng..."
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Phòng ban trực thuộc</label>
                <select
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)] rounded-lg outline-none"
                  style={{ padding: '0.5rem' }}
                  value={formData.departmentId}
                  onChange={handleDepartmentChange}
                >
                  <option value="" className="text-black">-- Toàn công ty (Không thuộc PB nào) --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="text-black">{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Mã vị trí (với nút Gợi ý) & Cấp bậc */}
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-muted)]">
                    Mã vị trí <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    title="Gợi ý mã chuẩn theo tên vị trí và phòng ban"
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
                  placeholder="Ví dụ: DEV-FE, HR-REC..."
                  style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <span className="text-xs text-[var(--text-muted)]" style={{ fontSize: '0.75rem', marginTop: '-2px' }}>
                  💡 Tự động in hoa, không dấu (Cấu trúc: [PB]-[VỊ_TRÍ])
                </span>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Cấp bậc</label>
                <select
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)] rounded-lg outline-none"
                  style={{ padding: '0.5rem' }}
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Intern" className="text-black">Intern</option>
                  <option value="Fresher" className="text-black">Fresher</option>
                  <option value="Junior" className="text-black">Junior</option>
                  <option value="Mid" className="text-black">Mid-level</option>
                  <option value="Senior" className="text-black">Senior</option>
                  <option value="Manager" className="text-black">Manager</option>
                  <option value="Director" className="text-black">Director</option>
                </select>
              </div>

              {/* Row 3: Lương tối thiểu & Lương tối đa */}
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Lương tối thiểu (VND)</label>
                <input
                  type="number"
                  className="form-input w-full"
                  value={formData.minSalary}
                  onChange={e => setFormData({ ...formData, minSalary: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Lương tối đa (VND)</label>
                <input
                  type="number"
                  className="form-input w-full"
                  value={formData.maxSalary}
                  onChange={e => setFormData({ ...formData, maxSalary: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Row 4: Mô tả công việc */}
              <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Mô tả công việc</label>
                <textarea
                  className="form-input w-full"
                  style={{ minHeight: '80px', padding: '0.75rem' }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả tóm tắt vai trò..."
                />
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-hover)' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleSave} className="btn btn-primary">Lưu thông tin</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteId && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col items-center justify-center text-center gap-4" style={{ width: '400px', padding: '1.5rem', animation: 'zoomIn 0.2s ease-out' }}>
            <div className="flex items-center justify-center mb-2" style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'var(--bg-hover)' }}>
              <AlertTriangle size={32} color="var(--error)" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Xác nhận xóa?</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Thao tác này sẽ xóa vĩnh viễn vị trí này khỏi hệ thống.
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
