import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, UserPlus, CheckCircle, X, AlertTriangle, LayoutGrid, List, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';


export const RecruitmentATS = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState('table'); // Mở table luôn để kiểm tra
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [departments, setDepartments] = useState([]);

  // Modals state
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [pendingDrop, setPendingDrop] = useState(null);
  
  // Forms data
  const [jobForm, setJobForm] = useState({ title: '', description: '', status: 'OPEN' });
  const [candidateForm, setCandidateForm] = useState({ name: '', email: '', phone: '', cvUrl: '', jobPostingId: '' });

  const fetchJobsAndCandidates = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://localhost:5000/api/job-postings'),
      axios.get('http://localhost:5000/api/candidates'),
      axios.get('http://localhost:5000/api/departments')
    ])
    .then(([jobRes, candRes, deptRes]) => {
      setJobPostings(jobRes.data);
      setCandidates(candRes.data);
      setDepartments(deptRes.data);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobsAndCandidates();
  }, []);

  // --- Handlers for Forms ---
  const handleCreateJob = () => {
    if (!jobForm.title) return toast.error("Vui lòng nhập tiêu đề Job");
    axios.post('http://localhost:5000/api/job-postings', jobForm)
      .then(() => {
        fetchJobsAndCandidates();
        setShowJobModal(false);
        setJobForm({ title: '', description: '', status: 'OPEN' });
      })
      .catch(err => toast.error("Lỗi khi tạo Job"));
  };

  const handleCreateCandidate = () => {
    if (!candidateForm.name || !candidateForm.email || !candidateForm.jobPostingId) {
      return toast.error("Vui lòng nhập Tên, Email và Chọn Job ứng tuyển");
    }
    axios.post('http://localhost:5000/api/candidates', candidateForm)
      .then(() => {
        fetchJobsAndCandidates();
        setShowCandidateModal(false);
        setCandidateForm({ name: '', email: '', phone: '', cvUrl: '', jobPostingId: '' });
      })
      .catch(err => toast.error("Lỗi khi thêm ứng viên"));
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e, candidateId) => {
    e.dataTransfer.setData('candidateId', candidateId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Cho phép drop
  };

  const validTransitions = {
    SOURCED: ['SCREENING', 'REJECTED'],
    SCREENING: ['INTERVIEWING', 'REJECTED'],
    INTERVIEWING: ['OFFERING', 'REJECTED'],
    OFFERING: ['HIRED', 'REJECTED'],
    HIRED: [],
    REJECTED: ['SOURCED']
  };

  const checkValidTransition = (currentStatus, newStatus) => {
    if (!validTransitions[currentStatus]) return false;
    return validTransitions[currentStatus].includes(newStatus);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    if (!candidateId) return;

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.status === newStatus) return;

    // Validate business logic: only forward or reject
    if (!checkValidTransition(candidate.status, newStatus)) {
      return toast.error("Thao tác không hợp lệ! Ứng viên chỉ có thể đi tiếp vòng sau hoặc bị Từ chối, không thể lùi lại quy trình.");
    }

    // Show custom modal instead of window.confirm
    setPendingDrop({ candidateId, newStatus, candidateName: candidate.name });
  };

  const confirmDrop = () => {
    if (!pendingDrop) return;
    const { candidateId, newStatus } = pendingDrop;

    // Cập nhật state ngay lập tức để mượt
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    setPendingDrop(null); // Đóng modal

    // Gọi API update status
    axios.put(`http://localhost:5000/api/candidates/${candidateId}`, { status: newStatus })
      .catch(err => {
        console.error("Lỗi khi chuyển trạng thái", err);
        toast.error("Lỗi khi lưu trạng thái ứng viên. Sẽ reload lại dữ liệu.");
        fetchJobsAndCandidates();
      });
  };

  const cancelDrop = () => {
    setPendingDrop(null);
  };

  const statuses = [
    { id: 'SOURCED', title: 'SÀNG LỌC CV', color: 'var(--primary)', badgeColor: 'badge-purple' },
    { id: 'SCREENING', title: 'ĐÁNH GIÁ (SCREENING)', color: 'var(--info)', badgeColor: 'badge-info' },
    { id: 'INTERVIEWING', title: 'PHỎNG VẤN', color: 'var(--warning)', badgeColor: 'badge-warning' },
    { id: 'OFFERING', title: 'CHỐT OFFER', color: 'var(--success)', badgeColor: 'badge-success' },
    { id: 'HIRED', title: 'NHẬN VIỆC (HIRED)', color: 'var(--text-main)', badgeColor: 'badge-primary' },
    { id: 'REJECTED', title: 'TỪ CHỐI', color: 'var(--error)', badgeColor: 'badge-error' }
  ];

  const processedCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment ? c.jobPosting?.departmentId === filterDepartment : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Quản lý Tuyển dụng (ATS)
          </h2>
          <p className="text-muted mt-2">Kéo thả thẻ ứng viên để thay đổi trạng thái tuyển dụng.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-white p-1 rounded-lg flex border border-[var(--border)]">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-colors flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-white text-[var(--text-heading)]' : 'text-muted hover:text-[var(--primary)]'}`} title="Dạng Bảng kéo thả">
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors flex items-center gap-1 ${viewMode === 'table' ? 'bg-white text-[var(--text-heading)]' : 'text-muted hover:text-[var(--primary)]'}`} title="Dạng Danh sách">
              <List size={18} />
            </button>
          </div>
          <button onClick={() => setShowCandidateModal(true)} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            <UserPlus size={18} /> Thêm Ứng viên
          </button>
          <button onClick={() => setShowJobModal(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            <Briefcase size={18} /> Tạo Job Post mới
          </button>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-4 items-center w-full">
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm ứng viên theo tên, email..." 
                className="form-input w-full bg-white" 
                style={{ paddingLeft: '2.5rem' }}
                value={searchQuery} 
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              />
            </div>
            <select 
              className="form-input bg-white" 
              style={{ width: '200px' }}
              value={filterDepartment} 
              onChange={e => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }} className="custom-scrollbar">
            {statuses.map(statusCol => {
              const columnCandidates = processedCandidates.filter(c => c.status === statusCol.id);
              
              return (
                <div 
                  key={statusCol.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statusCol.id)}
              style={{ flex: '0 0 320px', height: '100%', background: 'var(--bg-card)', borderRadius: '1rem', padding: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-muted)' }}>{statusCol.title}</h3>
                <span className={`badge ${statusCol.badgeColor}`} style={{ borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  {columnCandidates.length}
                </span>
              </div>
              
              <div className="flex-col gap-3 custom-scrollbar" style={{ flex: 1, paddingRight: '0.5rem', minHeight: 0, overflowY: 'auto' }}>
                {loading ? (
                   <p className="text-center text-muted text-sm py-4">Đang tải...</p>
                ) : columnCandidates.length === 0 ? (
                  <p className="text-center text-muted text-sm py-4 italic" style={{ opacity: 0.5 }}>Trống</p>
                ) : (
                  columnCandidates.map(c => (
                    <div 
                      key={c.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, statusCol.id);
                      }}
                      className="card card-hover" 
                      style={{ padding: '1rem', cursor: 'grab', borderLeft: `3px solid ${statusCol.color}`, flexShrink: 0, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{c.name}</h4>
                        {statusCol.id === 'OFFERING' && <CheckCircle size={16} color="var(--success)" />}
                        {statusCol.id === 'INTERVIEWING' && <span className="badge badge-warning" style={{ fontSize: '0.7rem', background: 'transparent' }}>Phỏng vấn</span>}
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        Ứng tuyển: <span style={{ color: 'var(--text-main)' }}>{c.jobPosting?.title || 'Không rõ'}</span>
                      </p>
                      <div className="flex justify-between items-center text-muted" style={{ fontSize: '0.8rem' }}>
                        <span>{c.email}</span>
                        {c.cvUrl && (
                          <a 
                            href={c.cvUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[var(--primary)] hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()} // Prevent drag conflict if any
                          >
                            Xem CV
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
          </div>
        </div>
      ) : (
        <div className="card glass overflow-hidden flex-1 flex flex-col p-6" style={{ minHeight: 0 }}>
          <div className="table-container overflow-y-auto flex-1 custom-scrollbar" style={{ border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white backdrop-blur-md z-10">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-4 text-sm font-semibold text-muted">Ứng viên</th>
                  <th className="p-4 text-sm font-semibold text-muted">Vị trí ứng tuyển</th>
                  <th className="p-4 text-sm font-semibold text-muted">Phòng ban</th>
                  <th className="p-4 text-sm font-semibold text-muted">Liên hệ</th>
                  <th className="p-4 text-sm font-semibold text-muted">Hồ sơ CV</th>
                  <th className="p-4 text-sm font-semibold text-muted">Trạng thái (Click đổi)</th>
                </tr>
              </thead>
              <tbody>
                {processedCandidates
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map(c => {
                    const statusObj = statuses.find(s => s.id === c.status) || statuses[0];
                    return (
                      <tr key={c.id} className="border-b border-[var(--border)] hover:bg-white transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-[var(--text-heading)]">{c.name}</div>
                          <div className="text-xs text-muted">ID: #{c.id.substring(0,6).toUpperCase()}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-[var(--text-main)] font-medium">{c.jobPosting?.title || 'Không rõ'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[var(--text-muted)] text-sm font-medium">{c.jobPosting?.department?.name || 'Không rõ'}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{c.email}</div>
                          <div className="text-sm text-muted">{c.phone || '--'}</div>
                        </td>
                        <td className="p-4">
                          {c.cvUrl ? (
                            <a href={c.cvUrl} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline text-sm font-medium">Xem CV</a>
                          ) : (
                            <span className="text-muted text-sm">Không có</span>
                          )}
                        </td>
                        <td className="p-4">
                          <select 
                            className="form-input text-sm font-semibold cursor-pointer outline-none" 
                            style={{ 
                              backgroundColor: 'var(--bg-hover)', 
                              border: `1px solid ${statusObj.color}`, 
                              color: statusObj.color,
                              padding: '0.4rem 0.75rem',
                              borderRadius: '9999px'
                            }}
                            value={c.status} 
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (!checkValidTransition(c.status, newStatus)) {
                                return toast.error("Thao tác không hợp lệ! Ứng viên chỉ có thể đi tiếp vòng sau hoặc bị Từ chối, không thể lùi lại quy trình.");
                              }
                              setPendingDrop({ candidateId: c.id, newStatus, candidateName: c.name })
                            }}
                          >
                            {statuses.map(s => <option key={s.id} value={s.id} className="text-black">{s.title}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                })}
                {processedCandidates.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted">Không tìm thấy ứng viên nào phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {(() => {
            const totalFiltered = processedCandidates.length;
            const totalPages = Math.ceil(totalFiltered / itemsPerPage);
            if (totalPages <= 1) return null;
            return (
              <div className="flex justify-between items-center mt-4 px-2 flex-shrink-0">
                <span className="text-sm text-muted">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalFiltered)} trong tổng số {totalFiltered} ứng viên
                </span>
                <div className="flex gap-2 items-center">
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
      )}

      {/* MODALS */}
      {showJobModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Tạo Tin tuyển dụng</h3>
              <button onClick={() => setShowJobModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-col gap-4" style={{ padding: '1.5rem' }}>
              <div className="flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Tiêu đề (Vị trí tuyển dụng)</label>
                <input type="text" className="form-input w-full" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} placeholder="VD: Lập trình viên Backend Node.js" />
              </div>
              <div className="flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Mô tả tóm tắt</label>
                <textarea className="form-input w-full" style={{ minHeight: '80px', padding: '0.75rem' }} value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} placeholder="Mô tả yêu cầu..." />
              </div>
            </div>
            <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-hover)' }}>
              <button onClick={() => setShowJobModal(false)} className="btn btn-outline">Hủy</button>
              <button onClick={handleCreateJob} className="btn btn-primary">Lưu thông tin</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showCandidateModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Thêm Ứng viên mới</h3>
              <button onClick={() => setShowCandidateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-col gap-4" style={{ padding: '1.5rem' }}>
              <div className="flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Tin tuyển dụng (Job Posting)</label>
                <select className="form-input w-full bg-white border border-[var(--border)] text-[var(--text-heading)]" style={{ padding: '0.5rem' }} value={candidateForm.jobPostingId} onChange={e => setCandidateForm({...candidateForm, jobPostingId: e.target.value})}>
                  <option value="" className="text-black">-- Chọn tin tuyển dụng --</option>
                  {jobPostings.filter(j => j.status === 'PUBLISHED').map(j => (
                    <option key={j.id} value={j.id} className="text-black">{j.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Họ tên ứng viên</label>
                <input type="text" className="form-input w-full" value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} placeholder="Nhập tên..." />
              </div>
              <div className="flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Email</label>
                <input type="email" className="form-input w-full" value={candidateForm.email} onChange={e => setCandidateForm({...candidateForm, email: e.target.value})} placeholder="Email..." />
              </div>
              <div className="flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Số điện thoại</label>
                <input type="text" className="form-input w-full" value={candidateForm.phone} onChange={e => setCandidateForm({...candidateForm, phone: e.target.value})} placeholder="SĐT..." />
              </div>
            </div>
            <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-hover)' }}>
              <button onClick={() => setShowCandidateModal(false)} className="btn btn-outline">Hủy</button>
              <button onClick={handleCreateCandidate} className="btn btn-primary">Thêm ứng viên</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {pendingDrop && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden text-center" style={{ width: '400px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <AlertTriangle size={32} color="var(--primary)" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Xác nhận chuyển trạng thái</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Bạn có chắc chắn muốn chuyển ứng viên <strong className="text-[var(--text-heading)]">{pendingDrop.candidateName}</strong> sang trạng thái <strong className="text-[var(--primary)]">{statuses.find(s => s.id === pendingDrop.newStatus)?.title}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={cancelDrop} className="btn btn-outline flex-1">Hủy bỏ</button>
              <button onClick={confirmDrop} className="btn btn-primary flex-1">Đồng ý chuyển</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
