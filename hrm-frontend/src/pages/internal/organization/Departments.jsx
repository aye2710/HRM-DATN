import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building, Users, Search, Plus, Filter, MoreVertical, Edit2, Trash2, X, AlertTriangle, Lock, Unlock } from 'lucide-react';
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

// Hàm sinh mã phòng ban thông minh theo chuẩn doanh nghiệp (tự động khử trùng lặp)
const generateDeptCode = (deptName, existingDepartments = [], currentId = '') => {
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

  let baseCode = '';
  for (const item of keywordMap) {
    if (item.regex.test(clean)) {
      baseCode = item.code;
      break;
    }
  }

  // 2. Nếu không khớp từ điển: Lược bỏ hư từ tiền tố ('phong', 'ban', 'to', 'khoi', 'trung tam') và lấy chữ cái đầu
  if (!baseCode) {
    const words = clean
      .split(/[\s\-_]+/)
      .filter(w => !['phong', 'ban', 'to', 'khoi', 'trung', 'tam', 'bo', 'phan'].includes(w));

    const targetWords = words.length > 0 ? words : clean.split(/[\s\-_]+/);
    baseCode = targetWords.map(w => w[0]?.toUpperCase()).join('').slice(0, 6);
  }

  if (!baseCode) {
    baseCode = 'PB';
  }

  // 3. Tự động kiểm tra trùng lặp với danh sách phòng ban hiện có
  let finalCode = baseCode;
  let counter = 2;
  const isCodeTaken = (c) => existingDepartments.some(d => d.code?.toUpperCase() === c.toUpperCase() && d.id !== currentId);
  while (isCodeTaken(finalCode)) {
    finalCode = `${baseCode}${counter}`;
    counter++;
  }

  return finalCode;
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

  // Delete confirm state
  const [deleteId, setDeleteId] = useState(null);
  // Lock/Unlock confirm state
  const [lockTarget, setLockTarget] = useState(null);

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

  // Tự động sinh mã phòng ban khi nhập Tên phòng ban
  const handleNameChange = (e) => {
    const newName = e.target.value;
    const autoCode = modalMode === 'add' ? generateDeptCode(newName, departments, editingId) : formData.code;
    setFormData({
      ...formData,
      name: newName,
      code: autoCode
    });
  };

  const handleSave = () => {
    const cleanName = formData.name.trim();
    let cleanCode = formData.code ? formData.code.trim().toUpperCase() : '';

    if (!cleanName) {
      toast.error('Vui lòng nhập Tên phòng ban!');
      return;
    }

    if (!cleanCode) {
      cleanCode = generateDeptCode(cleanName, departments, editingId);
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
      toast.error(`Mã phòng ban "${cleanCode}" đã được sử dụng! Vui lòng chọn tên khác.`);
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

  const handleConfirmToggleStatus = () => {
    if (!lockTarget) return;
    const isCurrentlyActive = lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    axios.put(`http://localhost:5000/api/departments/${lockTarget.id}`, { ...lockTarget, status: newStatus })
      .then(() => {
        toast.success(newStatus === 'ACTIVE' ? 'Đã mở khóa phòng ban!' : 'Đã khóa phòng ban!');
        fetchDepartments();
        setLockTarget(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái');
        setLockTarget(null);
      });
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
  const totalQuota = departments.reduce((acc, dept) => acc + (dept.quota || 15), 0);
  const totalFillRate = totalQuota > 0 ? Math.round((totalHeadcount / totalQuota) * 100) : 0;

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
          <p className="text-muted text-sm">Quản lý cơ cấu phòng ban, định biên nhân sự và tỷ lệ lấp đầy tổ chức</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Thêm Phòng ban
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng số phòng ban</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{totalDepts} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#16A34A' }}>({departments.filter(d => d.status === 'ACTIVE').length} hoạt động)</span></div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nhân sự thực tế</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{totalHeadcount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>nhân viên</span></div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
            <Filter size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tỷ lệ lấp đầy định biên</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: totalFillRate > 100 ? '#DC2626' : '#9333EA' }}>{totalFillRate}%</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, marginTop: 2 }}>
              {totalHeadcount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>/ {totalQuota} định biên</span>
            </div>
            <div style={{ width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ width: `${Math.min(100, totalFillRate)}%`, height: '100%', backgroundColor: totalFillRate > 100 ? '#DC2626' : '#9333EA' }} />
            </div>
          </div>
        </div>
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
                <th>Mã PB</th>
                <th>Tên Phòng ban</th>
                <th>Người đại diện</th>
                <th>Trực thuộc</th>
                <th style={{ minWidth: '180px' }}>Nhân sự / Định biên</th>
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
                        <span style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          {dept.code}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                            <Building size={16} color="var(--text-muted)" />
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{dept.name}</span>
                        </div>
                      </td>
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
                        {(() => {
                          const quota = dept.quota || 15;
                          const fillPercent = Math.round((currentHeadcount / quota) * 100);
                          const isOver = currentHeadcount > quota;
                          const isFull = currentHeadcount === quota;
                          const barColor = isOver ? '#DC2626' : (isFull || fillPercent >= 80) ? '#16A34A' : '#2563EB';

                          return (
                            <div style={{ minWidth: 160 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                  {currentHeadcount} <span style={{ fontWeight: 400, color: '#64748B' }}>/ {quota} người</span>
                                </span>
                                <span 
                                  style={{ 
                                    fontSize: '0.6875rem', 
                                    fontWeight: 600,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: isOver ? '#FEF2F2' : isFull ? '#F0FDF4' : '#EFF6FF',
                                    color: isOver ? '#DC2626' : isFull ? '#16A34A' : '#2563EB',
                                    border: `1px solid ${isOver ? '#FECACA' : isFull ? '#BBF7D0' : '#BFDBFE'}`
                                  }}
                                >
                                  {isOver ? `Vượt ${currentHeadcount - quota} ⚠` : isFull ? 'Đủ 100%' : `Còn ${quota - currentHeadcount}`}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${Math.min(100, fillPercent)}%`, 
                                    height: '100%', 
                                    backgroundColor: barColor,
                                    borderRadius: 3,
                                    transition: 'width 0.3s ease'
                                  }} 
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${status === 'ACTIVE' || status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                          {status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 28px)', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => setLockTarget(dept)} 
                            style={{
                              height: 28, width: 28, padding: 0,
                              borderRadius: '6px',
                              backgroundColor: (status === 'ACTIVE' || status === 'Hoạt động') ? '#F0FDF4' : '#FEF3C7',
                              border: `1px solid ${(status === 'ACTIVE' || status === 'Hoạt động') ? '#BBF7D0' : '#FDE68A'}`,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={status === 'ACTIVE' || status === 'Hoạt động' ? 'Khóa (Ngưng hoạt động)' : 'Mở khóa (Hoạt động)'}
                          >
                            {status === 'ACTIVE' || status === 'Hoạt động' ? <Unlock size={14} color="#16A34A" /> : <Lock size={14} color="#D97706" />}
                          </button>
                          
                          <button 
                            onClick={() => handleOpenEdit(dept)} 
                            style={{
                              height: 28, width: 28, padding: 0,
                              borderRadius: '6px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#475569',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#2563EB'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                            title="Chỉnh sửa thông tin phòng ban"
                          >
                            <Edit2 size={14} />
                          </button>
                          
                          <button 
                            onClick={() => setDeleteId(dept.id)} 
                            style={{
                              height: 28, width: 28, padding: 0,
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              color: '#94A3B8',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#94A3B8'; }}
                            title="Xóa phòng ban"
                          >
                            <Trash2 size={14} />
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
                  placeholder="Nhập tên phòng ban..."
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Mã phòng ban <span className="text-xs text-[var(--text-muted)] font-normal">(Hệ thống tự sinh)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  className="form-input w-full font-mono font-semibold"
                  value={formData.code}
                  placeholder="Hệ thống tự sinh theo tên..."
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.75, cursor: 'not-allowed', backgroundColor: 'var(--bg-hover)' }}
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

              <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Định biên nhân sự (Số người tối đa được duyệt) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  className="form-input w-full font-semibold"
                  value={formData.quota || 15}
                  onChange={e => setFormData({ ...formData, quota: Math.max(1, parseInt(e.target.value) || 1) })}
                  placeholder="Ví dụ: 15"
                />
                <span className="text-xs text-[var(--text-muted)]">
                  Chỉ tiêu nhân sự trần được duyệt cho phòng ban này để đo lường tỷ lệ lấp đầy và kiểm soát tuyển dụng.
                </span>
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

      {/* Lock/Unlock Confirmation Modal */}
      {lockTarget && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col items-center justify-center text-center gap-4" style={{ width: '420px', padding: '1.5rem', animation: 'zoomIn 0.2s ease-out' }}>
            <div className="flex items-center justify-center mb-2" style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: (lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' }}>
              {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? (
                <Lock size={32} color="#F59E0B" />
              ) : (
                <Unlock size={32} color="#10B981" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">
              {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? 'Xác nhận khóa phòng ban?' : 'Xác nhận mở khóa phòng ban?'}
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? (
                <>Phòng ban <strong>{lockTarget.name}</strong> ({lockTarget.code}) sẽ chuyển sang trạng thái <strong>Ngưng hoạt động</strong>. Bạn có chắc chắn muốn khóa?</>
              ) : (
                <>Phòng ban <strong>{lockTarget.name}</strong> ({lockTarget.code}) sẽ được mở khóa và chuyển sang trạng thái <strong>Hoạt động</strong>.</>
              )}
            </p>

            <div className="flex justify-center w-full" style={{ gap: '0.75rem' }}>
              <button onClick={() => setLockTarget(null)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
              <button 
                onClick={handleConfirmToggleStatus} 
                className="btn" 
                style={{ 
                  flex: 1, 
                  backgroundColor: (lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? '#F59E0B' : '#10B981', 
                  color: 'white',
                  border: 'none'
                }}
              >
                {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
              </button>
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
