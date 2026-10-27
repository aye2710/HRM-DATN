import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Briefcase, Search, Plus, Filter, Edit2, Trash2, Users, X, 
  AlertTriangle, Calendar, Sparkles, MapPin, Building, FileText, 
  Clock, UserCheck, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Danh mục chuẩn các cấp bậc
const REQUISITION_LEVELS = [
  'Intern', 'Fresher', 'Junior', 'Staff', 'Mid-level', 'Senior', 'Team Lead', 'Manager', 'Director'
];

export const Requisitions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [requisitions, setRequisitions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState('');
  
  const getTodayStr = () => new Date().toLocaleDateString('en-CA');

  const initialFormState = { 
    title: '', 
    description: '', 
    amount: 1, 
    publishDate: new Date().toLocaleDateString('en-CA'),
    deadline: '', 
    status: 'DRAFT', 
    departmentId: '',
    positionId: '',
    salaryRange: '',
    jobType: 'Full-time',
    level: 'Mid-level',
    location: '',
    workplaceType: 'On-site',
    experienceLevel: '',
    recruitmentReason: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://localhost:5000/api/job-postings'),
      axios.get('http://localhost:5000/api/departments'),
      axios.get('http://localhost:5000/api/positions'),
      axios.get('http://localhost:5000/api/employees').catch(() => ({ data: [] }))
    ])
    .then(([jobRes, deptRes, posRes, empRes]) => {
      setRequisitions(jobRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
      setEmployees(empRes.data || []);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      ...initialFormState,
      publishDate: getTodayStr()
    });
    setShowModal(true);
  };

  const handleOpenEdit = (req) => {
    setModalMode('edit');
    setEditingId(req.id);
    const todayStr = getTodayStr();
    setFormData({
      title: req.title || '',
      description: req.description || '',
      amount: req.amount || 1,
      publishDate: req.publishDate ? new Date(req.publishDate).toLocaleDateString('en-CA') : todayStr,
      deadline: req.deadline ? new Date(req.deadline).toLocaleDateString('en-CA') : '',
      status: req.status || 'DRAFT',
      departmentId: req.departmentId || '',
      positionId: req.positionId || '',
      salaryRange: req.salaryRange || '',
      jobType: req.jobType || 'Full-time',
      level: req.level || 'Mid-level',
      location: req.location || '',
      workplaceType: req.workplaceType || 'On-site',
      experienceLevel: req.experienceLevel || '',
      recruitmentReason: req.recruitmentReason || ''
    });
    setShowModal(true);
  };

  // Chọn vị trí -> tự động liên kết phòng ban, mức lương, cấp bậc và sinh tiêu đề gợi ý
  const handlePositionChange = (e) => {
    const posId = e.target.value;
    const selectedPos = positions.find(p => p.id === posId);
    
    if (selectedPos) {
      let salaryText = 'Thỏa thuận';
      if (selectedPos.minSalary > 0 && selectedPos.maxSalary > 0) {
        salaryText = `${selectedPos.minSalary.toLocaleString('vi-VN')} - ${selectedPos.maxSalary.toLocaleString('vi-VN')} VNĐ`;
      } else if (selectedPos.minSalary > 0) {
        salaryText = `Từ ${selectedPos.minSalary.toLocaleString('vi-VN')} VNĐ`;
      } else if (selectedPos.maxSalary > 0) {
        salaryText = `Lên đến ${selectedPos.maxSalary.toLocaleString('vi-VN')} VNĐ`;
      }

      const newLevel = selectedPos.level || 'Mid-level';
      
      // Khử trùng lặp cấp bậc nếu tên vị trí đã chứa cấp bậc (VD: "Chuyên viên DevOps (Junior)")
      const titleBase = selectedPos.title.trim();
      const hasLevel = new RegExp(`\\(${newLevel}\\)|\\b${newLevel}\\b`, 'i').test(titleBase);
      const levelSuffix = hasLevel ? '' : ` (${newLevel})`;
      const countPrefix = formData.amount > 1 ? `${formData.amount} ` : '';
      const autoTitle = `Tuyển dụng ${countPrefix}${titleBase}${levelSuffix}`;

      setFormData({
        ...formData,
        positionId: posId,
        departmentId: selectedPos.departmentId || '',
        level: newLevel,
        salaryRange: salaryText,
        title: autoTitle
      });
    } else {
      setFormData({ 
        ...formData, 
        positionId: posId,
        departmentId: '',
        level: 'Mid-level',
        salaryRange: ''
      });
    }
  };

  // Nút sinh tiêu đề gợi ý chủ động
  const handleSuggestTitle = () => {
    const selectedPos = positions.find(p => p.id === formData.positionId);
    if (!selectedPos) {
      toast('Vui lòng chọn Vị trí (Chức danh) trước khi tạo tiêu đề!', { icon: 'ℹ️' });
      return;
    }
    const countPrefix = formData.amount > 1 ? `${formData.amount} ` : '';
    const titleBase = selectedPos.title.trim();
    const currLevel = formData.level || selectedPos.level || '';
    const hasLevel = currLevel && new RegExp(`\\(${currLevel}\\)|\\b${currLevel}\\b`, 'i').test(titleBase);
    const levelSuffix = (!currLevel || hasLevel) ? '' : ` (${currLevel})`;
    const generated = `Tuyển dụng ${countPrefix}${titleBase}${levelSuffix}`;
    setFormData(prev => ({ ...prev, title: generated }));
    toast.success('Đã cập nhật tiêu đề gợi ý!');
  };

  // Khi đổi ngày phát hành -> đồng bộ ngày kết thúc nếu ngày kết thúc < ngày phát hành
  const handlePublishDateChange = (newPublishDate) => {
    setFormData(prev => {
      const nextState = { ...prev, publishDate: newPublishDate };
      if (nextState.deadline && nextState.deadline < newPublishDate) {
        nextState.deadline = newPublishDate;
      }
      return nextState;
    });
  };

  // Nút chọn nhanh ngày kết thúc (+15, +30, +45 ngày tính từ ngày phát hành)
  const handleQuickDeadline = (days) => {
    const baseStr = formData.publishDate || getTodayStr();
    const d = new Date(baseStr);
    d.setDate(d.getDate() + days);
    setFormData(prev => ({ ...prev, deadline: d.toLocaleDateString('en-CA') }));
  };

  // Nút điền mẫu JD chuẩn tự động
  const handleGenerateJdTemplate = () => {
    const selectedPos = positions.find(p => p.id === formData.positionId);
    const posTitle = selectedPos ? selectedPos.title : (formData.title || 'Vị trí công tác');
    const levelText = formData.level || 'Chính thức';
    const locText = formData.location ? `tại ${formData.location} (${formData.workplaceType || 'On-site'})` : '';

    const template = `📌 1. MÔ TẢ CÔNG VIỆC:
- Tiếp nhận và trực tiếp triển khai các nhiệm vụ chuyên môn theo vai trò ${posTitle} ${locText}.
- Phối hợp chặt chẽ với các phòng ban liên quan để đảm bảo tiến độ và chất lượng dự án.
- Nghiên cứu, đề xuất các giải pháp cải tiến quy trình làm việc nhằm nâng cao hiệu suất chung.
- Báo cáo định kỳ kết quả công việc và tiến độ cho Trưởng bộ phận.

🎯 2. YÊU CẦU ỨNG VIÊN:
- Trình độ: Tốt nghiệp Cao đẳng/Đại học chuyên ngành liên quan hoặc có năng lực thực tế tương đương.
- Cấp bậc / Kinh nghiệm: ${levelText} (${formData.experienceLevel || 'Phù hợp với cấp bậc ứng tuyển'}).
- Kỹ năng giao tiếp, làm việc nhóm tốt, có tinh thần trách nhiệm và chủ động trong công việc.
- Tư duy logic, khả năng giải quyết vấn đề và ham học hỏi nghiệp vụ/công nghệ mới.

🎁 3. QUYỀN LỢI ĐƯỢC HƯỞNG:
- Thu nhập cạnh tranh: ${formData.salaryRange || 'Thỏa thuận theo năng lực'}.
- Đóng BHXH, BHYT, BHTN đầy đủ theo quy định của Luật Lao động.
- Thưởng hiệu quả kinh doanh, thưởng dự án, thưởng các dịp lễ tết và tháng lương 13.
- Cơ hội đào tạo nâng cao chuyên môn và lộ trình thăng tiến nghề nghiệp rõ ràng.
- Môi trường làm việc trẻ trung, năng động, teambuilding định kỳ hàng năm.`;

    setFormData(prev => ({ ...prev, description: template }));
    toast.success('Đã điền mẫu JD chuẩn!');
  };

  const handleSave = () => {
    if (!formData.title?.trim()) return toast.error("Vui lòng nhập tên chiến dịch tuyển dụng");
    if (!formData.positionId) return toast.error("Vui lòng chọn Vị trí (Chức danh) cần tuyển");
    if (!formData.deadline) return toast.error("Vui lòng chọn Ngày kết thúc");
    
    const today = getTodayStr();
    if (formData.publishDate && formData.publishDate < today) {
      return toast.error("Ngày phát hành không được chọn ngày trong quá khứ!");
    }
    const minEndDate = formData.publishDate || today;
    if (formData.deadline < minEndDate) {
      return toast.error("Ngày kết thúc không được bé hơn Ngày phát hành!");
    }
    
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
    const result = await Swal.fire({ 
      title: 'Xác nhận xóa', 
      text: 'Bạn có chắc muốn xóa Yêu cầu này?', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Đồng ý', 
      cancelButtonText: 'Hủy' 
    });
    if (result.isConfirmed) {
      axios.delete(`http://localhost:5000/api/job-postings/${id}`)
        .then(() => {
          toast.success("Đã xóa yêu cầu tuyển dụng!");
          fetchData();
        })
        .catch(err => toast.error(err.response?.data?.error || "Lỗi xóa"));
    }
  };

  // Tính định biên phòng ban hiện tại
  const selectedDept = departments.find(d => d.id === formData.departmentId);
  const currentEmpCount = selectedDept?._count?.employees || 0;
  const deptQuota = selectedDept?.quota || 15;
  const remainingQuota = Math.max(0, deptQuota - currentEmpCount);
  const isOverQuota = selectedDept && formData.amount > remainingQuota;

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
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">Yêu cầu Tuyển dụng</h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              ĐỊNH BIÊN TUYỂN DỤNG
            </span>
          </div>
          <p className="text-muted text-sm">Quản lý các chiến dịch tuyển dụng và kiểm soát trần định biên nhân sự theo phòng ban</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Lập Phiếu Tuyển dụng
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
                <th>Ngày phát hành</th>
                <th>Ngày kết thúc</th>
                <th>Tiến độ</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-8">Đang tải dữ liệu...</td>
                </tr>
              ) : paginatedRequisitions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-8">Chưa có yêu cầu tuyển dụng nào</td>
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
                              {req.location ? ` • ${req.location}` : ''}
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
                        <span className="text-xs font-medium text-[var(--text-main)]">
                          {req.publishDate 
                            ? new Date(req.publishDate).toLocaleDateString('vi-VN') 
                            : (req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'))}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium" style={{ color: req.deadline ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {req.deadline ? new Date(req.deadline).toLocaleDateString('vi-VN') : '-'}
                        </span>
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
                        {(() => {
                          const todayStr = getTodayStr();
                          const isFuturePublish = req.publishDate && new Date(req.publishDate).toISOString().split('T')[0] > todayStr;
                          
                          if (req.status === 'PUBLISHED') {
                            if (isFuturePublish) {
                              return (
                                <span className="badge badge-warning" title={`Tự động đăng lên trang tuyển vào ngày ${new Date(req.publishDate).toLocaleDateString('vi-VN')}`}>
                                  Chờ đăng ({new Date(req.publishDate).toLocaleDateString('vi-VN')})
                                </span>
                              );
                            }
                            return <span className="badge badge-success">Phát hành</span>;
                          }
                          if (req.status === 'CLOSED') {
                            return <span className="badge badge-error">Ngừng phát hành</span>;
                          }
                          return <span className="badge badge-purple">Bản nháp</span>;
                        })()}
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
          <div className="card glass flex-col overflow-hidden" style={{ width: '820px', maxWidth: '96vw', maxHeight: '92vh', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">
                  {modalMode === 'add' ? 'Lập Phiếu Yêu Cầu Tuyển Dụng' : 'Cập Nhật Phiếu Yêu Cầu Tuyển Dụng'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Kiểm tra trần định biên nhân sự phòng ban và bảo vệ ngân sách quỹ lương
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem', overflowY: 'auto' }}>
              {/* Row 1: Vị trí & Phòng ban */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Vị trí (Chức danh) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select 
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" 
                  style={{ padding: '0.55rem' }} 
                  value={formData.positionId} 
                  onChange={handlePositionChange}
                >
                  <option value="" className="text-black">-- Chọn vị trí cần tuyển --</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id} className="text-black">
                      {p.title} {p.code ? `(${p.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-muted)]">
                    Phòng ban phụ trách <span className="text-xs text-[var(--text-muted)] font-normal">(Cố định theo vị trí)</span>
                  </label>
                  {selectedDept && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      isOverQuota ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      Định biên: {currentEmpCount}/{deptQuota} (Trống {remainingQuota})
                    </span>
                  )}
                </div>
                <select 
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" 
                  style={{ padding: '0.55rem', opacity: 0.75, cursor: 'not-allowed', backgroundColor: 'var(--bg-hover)' }} 
                  value={formData.departmentId} 
                  disabled
                >
                  <option value="" className="text-black">-- Tự động theo vị trí --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="text-black">{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Tiêu đề chiến dịch */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 2' }}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-muted)]">
                    Tiêu đề chiến dịch <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestTitle}
                    className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Sparkles size={13} />
                    <span>Gợi ý tiêu đề chuẩn</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  className="form-input w-full font-medium" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="VD: Tuyển dụng 2 Frontend Developer (Mid-level)" 
                />
              </div>

              {/* Row 3: Cấp bậc & Mức lương (Cố định theo vị trí đã chọn) */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Cấp bậc chuyên môn <span className="text-xs text-[var(--text-muted)] font-normal">(Cố định theo vị trí)</span>
                </label>
                <select 
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" 
                  style={{ padding: '0.55rem', opacity: 0.75, cursor: 'not-allowed', backgroundColor: 'var(--bg-hover)' }} 
                  value={formData.level} 
                  disabled
                >
                  {REQUISITION_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl} className="text-black">{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Mức lương dự kiến <span className="text-xs text-[var(--text-muted)] font-normal">(Cố định theo vị trí)</span>
                </label>
                <input 
                  type="text" 
                  className="form-input w-full font-medium" 
                  style={{ opacity: 0.75, cursor: 'not-allowed', backgroundColor: 'var(--bg-hover)' }} 
                  value={formData.salaryRange} 
                  disabled
                  placeholder="Tự động theo vị trí..." 
                />
              </div>

              {/* Row 4: Yêu cầu kinh nghiệm & Loại hình làm việc */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Yêu cầu kinh nghiệm</label>
                <input 
                  type="text" 
                  className="form-input w-full font-medium" 
                  value={formData.experienceLevel} 
                  onChange={e => setFormData({...formData, experienceLevel: e.target.value})} 
                  placeholder="VD: 1 - 2 năm kinh nghiệm, Không yêu cầu..." 
                />
              </div>

              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Loại hình làm việc</label>
                <select 
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" 
                  style={{ padding: '0.55rem' }} 
                  value={formData.jobType} 
                  onChange={e => setFormData({...formData, jobType: e.target.value})}
                >
                  <option value="Full-time" className="text-black">Toàn thời gian (Full-time)</option>
                  <option value="Part-time" className="text-black">Bán thời gian (Part-time)</option>
                </select>
              </div>

              {/* Row 5: Địa điểm làm việc & Chế độ làm việc */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Địa điểm làm việc</label>
                <input 
                  type="text" 
                  className="form-input w-full font-medium" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Toàn quốc..." 
                />
              </div>

              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Chế độ làm việc</label>
                <select 
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" 
                  style={{ padding: '0.55rem' }} 
                  value={formData.workplaceType} 
                  onChange={e => setFormData({...formData, workplaceType: e.target.value})}
                >
                  <option value="On-site" className="text-black">Tại văn phòng (On-site)</option>
                  <option value="Hybrid" className="text-black">Linh hoạt kết hợp (Hybrid)</option>
                  <option value="Remote" className="text-black">Làm việc từ xa (Remote 100%)</option>
                </select>
              </div>

              {/* Row 6: Số lượng tuyển & Lý do tuyển dụng */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Số lượng cần tuyển <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="number" 
                  className="form-input w-full font-bold" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: Math.max(1, parseInt(e.target.value) || 1)})} 
                  min="1" 
                />
                {isOverQuota && (
                  <span className="text-xs text-red-500 font-medium flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
                    <AlertTriangle size={12} /> Cảnh báo: Vượt {formData.amount - remainingQuota} chỉ tiêu so với định biên còn trống ({remainingQuota})!
                  </span>
                )}
              </div>

              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Lý do tuyển dụng</label>
                <input 
                  type="text" 
                  className="form-input w-full font-medium" 
                  value={formData.recruitmentReason} 
                  onChange={e => setFormData({...formData, recruitmentReason: e.target.value})} 
                  placeholder="VD: Mở rộng quy mô, thay thế nhân sự nghỉ..." 
                />
              </div>

              {/* Row 7: Ngày phát hành & Ngày kết thúc */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Ngày phát hành <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="date" 
                  className="form-input w-full font-medium" 
                  style={{ colorScheme: 'dark' }} 
                  value={formData.publishDate} 
                  onChange={e => handlePublishDateChange(e.target.value)} 
                  min={getTodayStr()}
                />
              </div>

              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 1' }}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-muted)]">
                    Ngày kết thúc <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <div className="flex gap-1">
                    {[15, 30, 45].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleQuickDeadline(days)}
                        className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-hover)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                        style={{ border: '1px solid var(--border)', fontSize: '0.7rem' }}
                        title={`Cộng thêm ${days} ngày từ ngày phát hành`}
                      >
                        +{days}d
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  type="date" 
                  className="form-input w-full font-medium" 
                  style={{ colorScheme: 'dark' }} 
                  value={formData.deadline} 
                  onChange={e => setFormData({...formData, deadline: e.target.value})} 
                  min={formData.publishDate || getTodayStr()}
                />
              </div>

              {/* Row 8: Trạng thái phát hành */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 2' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Trạng thái phát hành</label>
                <select 
                  className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" 
                  style={{ padding: '0.55rem' }} 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="DRAFT" className="text-black">Nháp (DRAFT - Nội bộ)</option>
                  <option value="PUBLISHED" className="text-black">Phát hành (PUBLISHED - Công khai)</option>
                  <option value="CLOSED" className="text-black">Ngừng phát hành (CLOSED - Đã đóng)</option>
                </select>
              </div>

              {/* Row 9: Mô tả chi tiết JD */}
              <div className="flex-col gap-1.5" style={{ gridColumn: 'span 2' }}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Mô tả công việc & Quyền lợi (JD)</label>
                  <button
                    type="button"
                    onClick={handleGenerateJdTemplate}
                    className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Sparkles size={13} />
                    <span>Điền mẫu JD chuẩn</span>
                  </button>
                </div>
                <textarea 
                  className="form-input w-full font-mono text-xs" 
                  style={{ minHeight: '130px', padding: '0.75rem', lineHeight: '1.6' }} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Mô tả công việc, yêu cầu ứng viên và chế độ đãi ngộ..." 
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
    </div>
  );
};
