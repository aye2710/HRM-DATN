import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Search, Plus, Filter, Edit2, Trash2, Users, X, AlertTriangle, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const Requisitions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [requisitions, setRequisitions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState('');
  
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    amount: 1, 
    deadline: '', 
    status: 'DRAFT', 
    departmentId: '',
    positionId: '',
    salaryRange: '',
    jobType: 'Full-time',
    level: 'Intern'
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://localhost:5000/api/job-postings'),
      axios.get('http://localhost:5000/api/departments'),
      axios.get('http://localhost:5000/api/positions')
    ])
    .then(([jobRes, deptRes, posRes]) => {
      setRequisitions(jobRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ title: '', description: '', amount: 1, deadline: '', status: 'DRAFT', departmentId: '', positionId: '', salaryRange: '', jobType: 'Full-time', level: 'Intern' });
    setShowModal(true);
  };

  const handleOpenEdit = (req) => {
    setModalMode('edit');
    setEditingId(req.id);
    setFormData({
      title: req.title,
      description: req.description || '',
      amount: req.amount || 1,
      deadline: req.deadline ? new Date(req.deadline).toISOString().split('T')[0] : '',
      status: req.status || 'DRAFT',
      departmentId: req.departmentId || '',
      positionId: req.positionId || '',
      salaryRange: req.salaryRange || '',
      jobType: req.jobType || 'Full-time',
      level: req.level || 'Intern'
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title) return toast.error("Vui lòng nhập tên chiến dịch tuyển dụng");
    
    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/job-postings', formData)
        .then(() => {
          toast.success("Thêm yêu cầu tuyển dụng thành công!");
          fetchData();
          setShowModal(false);
        })
        .catch(err => {
          const errMsg = err.response?.data?.error || "Lỗi khi thêm yêu cầu";
          Swal.fire({
            title: 'Kiểm Soát Định Biên',
            text: errMsg,
            icon: 'warning',
            confirmButtonText: 'Đã hiểu',
            confirmButtonColor: '#7c3aed'
          });
        });
    } else {
      axios.put(`http://localhost:5000/api/job-postings/${editingId}`, formData)
        .then(() => {
          toast.success("Cập nhật thành công!");
          fetchData();
          setShowModal(false);
        })
        .catch(err => {
          const errMsg = err.response?.data?.error || "Lỗi khi cập nhật";
          Swal.fire({
            title: 'Kiểm Soát Định Biên',
            text: errMsg,
            icon: 'warning',
            confirmButtonText: 'Đã hiểu',
            confirmButtonColor: '#7c3aed'
          });
        });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Xác nhận xóa', text: 'Bạn có chắc muốn xóa Yêu cầu này?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' });
    if (result.isConfirmed) {
      axios.delete(`http://localhost:5000/api/job-postings/${id}`)
        .then(() => fetchData())
        .catch(err => toast.error(err.response?.data?.error || "Lỗi xóa"));
    }
  };

  const handlePositionChange = (e) => {
    const posId = e.target.value;
    const selectedPos = positions.find(p => p.id === posId);
    
    if (selectedPos) {
      // Format salary
      let salaryText = 'Thỏa thuận';
      if (selectedPos.minSalary > 0 && selectedPos.maxSalary > 0) {
        salaryText = `${selectedPos.minSalary.toLocaleString('vi-VN')} - ${selectedPos.maxSalary.toLocaleString('vi-VN')} VNĐ`;
      } else if (selectedPos.minSalary > 0) {
        salaryText = `Từ ${selectedPos.minSalary.toLocaleString('vi-VN')} VNĐ`;
      } else if (selectedPos.maxSalary > 0) {
        salaryText = `Lên đến ${selectedPos.maxSalary.toLocaleString('vi-VN')} VNĐ`;
      }

      setFormData({
        ...formData,
        positionId: posId,
        departmentId: selectedPos.departmentId || formData.departmentId,
        level: selectedPos.level || formData.level,
        salaryRange: salaryText
      });
    } else {
      setFormData({ ...formData, positionId: posId });
    }
  };

  const filteredRequisitions = requisitions.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === '' || r.departmentId === deptFilter;
    const matchStatus = statusFilter === '' || r.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const paginatedRequisitions = filteredRequisitions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex-col gap-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Yêu cầu Tuyển dụng</h1>
          <p className="text-muted text-sm">Quản lý các chiến dịch tuyển dụng của các phòng ban</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Tạo Yêu cầu mới
        </button>
      </div>

      <div className="card glass flex-col gap-4" style={{ flex: 1 }}>
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-full">
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm chiến dịch..." 
                className="form-input w-full"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <select
              className="form-input"
              style={{ width: '200px' }}
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">-- Tất cả phòng ban --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            
            <select
              className="form-input"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">-- Trạng thái --</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Phát hành</option>
              <option value="CLOSED">Ngừng phát hành</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Chiến dịch / Vị trí</th>
                <th>Phòng ban</th>
                <th>Số lượng</th>
                <th>Mức lương</th>
                <th>Hạn chót</th>
                <th>Tiến độ</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-8">Đang tải dữ liệu...</td>
                </tr>
              ) : paginatedRequisitions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-8">Chưa có yêu cầu tuyển dụng nào</td>
                </tr>
              ) : (
                paginatedRequisitions.map(req => {
                  const hiredCount = req.candidates ? req.candidates.filter(c => c.status === 'HIRED').length : 0;
                  const ratio = req.amount > 0 ? (hiredCount / req.amount) * 100 : 0;

                  return (
                    <tr key={req.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                            <Briefcase size={16} color="var(--primary)" />
                          </div>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {req.position?.title ? `${req.position.title} • ` : ''}
                              {req.level || 'Intern'} • {req.jobType || 'Full-time'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {req.department?.name || '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 font-bold">
                          <Users size={14} color="var(--text-muted)" /> {req.amount}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--success)', fontWeight: 500 }}>{req.salaryRange || 'Thỏa thuận'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted">
                          <Calendar size={14} /> 
                          {req.deadline ? new Date(req.deadline).toLocaleDateString('vi-VN') : 'Không có'}
                        </div>
                      </td>
                      <td>
                        <div className="flex-col gap-1">
                          <div className="flex justify-between items-center" style={{ fontSize: '0.85rem' }}>
                            <span>{hiredCount} / {req.amount}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{Math.round(ratio)}%</span>
                          </div>
                          <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, ratio)}%`, backgroundColor: 'var(--success)', borderRadius: '3px' }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${req.status === 'PUBLISHED' ? 'badge-success' : req.status === 'CLOSED' ? 'badge-error' : 'badge-purple'}`}>
                          {req.status === 'PUBLISHED' ? 'Phát hành' : req.status === 'CLOSED' ? 'Ngừng phát hành' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEdit(req)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                            <Edit2 size={16} color="var(--text-muted)" />
                          </button>
                          <button onClick={() => handleDelete(req.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
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
          const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);
          if (totalPages <= 1) return null;
          return (
            <div className="flex justify-between items-center mt-4 px-2">
              <span className="text-sm text-muted">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRequisitions.length)} trong tổng số {filteredRequisitions.length} chiến dịch
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

      {/* Modal */}
      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '650px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {modalMode === 'add' ? 'Tạo Yêu cầu Tuyển dụng' : 'Cập nhật Yêu cầu'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)]"><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Tiêu đề chiến dịch</label>
                <input type="text" className="form-input w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Tuyển gấp 5 Lập trình viên ReactJS" />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Phòng ban yêu cầu (Cố định theo vị trí)</label>
                <select className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" style={{ padding: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }} value={formData.departmentId} disabled>
                  <option value="" className="text-black">-- Tự động điền --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="text-black">{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Vị trí (Chức danh)</label>
                <select className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" style={{ padding: '0.5rem' }} value={formData.positionId} onChange={handlePositionChange}>
                  <option value="" className="text-black">-- Chọn vị trí --</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id} className="text-black">
                      {p.title} {p.level ? `- ${p.level}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Mức lương (Cố định theo vị trí)</label>
                <input type="text" className="form-input w-full" style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--bg-hover)' }} value={formData.salaryRange} disabled placeholder="Tự động điền..." />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Cấp bậc (Cố định theo vị trí)</label>
                <select className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" style={{ padding: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }} value={formData.level} disabled>
                  <option value="Intern" className="text-black">Intern</option>
                  <option value="Fresher" className="text-black">Fresher</option>
                  <option value="Junior" className="text-black">Junior</option>
                  <option value="Mid-level" className="text-black">Mid-level</option>
                  <option value="Senior" className="text-black">Senior</option>
                  <option value="Manager" className="text-black">Manager</option>
                  <option value="Director" className="text-black">Director</option>
                </select>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Loại hình</label>
                <select className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" style={{ padding: '0.5rem' }} value={formData.jobType} onChange={e => setFormData({...formData, jobType: e.target.value})}>
                  <option value="Full-time" className="text-black">Toàn thời gian (Full-time)</option>
                  <option value="Part-time" className="text-black">Bán thời gian (Part-time)</option>
                  <option value="Internship" className="text-black">Thực tập (Internship)</option>
                  <option value="Freelance" className="text-black">Tự do (Freelance)</option>
                </select>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Số lượng cần tuyển</label>
                <input type="number" className="form-input w-full" value={formData.amount} onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 1})} min="1" />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Hạn chót (Deadline)</label>
                <input type="date" className="form-input w-full" style={{ colorScheme: 'dark' }} value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Trạng thái phát hành</label>
                <select className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" style={{ padding: '0.5rem' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="DRAFT" className="text-black">Nháp (DRAFT)</option>
                  <option value="PUBLISHED" className="text-black">Phát hành (PUBLISHED)</option>
                  <option value="CLOSED" className="text-black">Ngừng phát hành (CLOSED)</option>
                </select>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Mô tả chi tiết</label>
                <textarea className="form-input w-full" style={{ minHeight: '80px', padding: '0.75rem' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Yêu cầu công việc, quyền lợi..." />
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
    </div>
  );
};
