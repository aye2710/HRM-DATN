import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Briefcase, UserPlus, CheckCircle, X, AlertTriangle, LayoutGrid, 
  List, Search, FileText, ChevronRight, Phone, Mail, UserCheck, 
  UserX, Download, Clock, ExternalLink, Filter, Calendar, Inbox
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const RecruitmentATS = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
      setJobPostings(jobRes.data || []);
      setCandidates(candRes.data || []);
      setDepartments(deptRes.data || []);
    })
    .catch(err => {
      console.error(err);
      toast.error("Lỗi khi tải dữ liệu tuyển dụng");
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobsAndCandidates();
  }, []);

  // --- Handlers for Forms ---
  const handleCreateJob = () => {
    if (!jobForm.title.trim()) return toast.error("Vui lòng nhập tiêu đề vị trí tuyển dụng");
    axios.post('http://localhost:5000/api/job-postings', jobForm)
      .then(() => {
        fetchJobsAndCandidates();
        setShowJobModal(false);
        setJobForm({ title: '', description: '', status: 'OPEN' });
        toast.success("Tạo tin tuyển dụng thành công!");
      })
      .catch(() => toast.error("Lỗi khi tạo tin tuyển dụng"));
  };

  const handleCreateCandidate = () => {
    if (!candidateForm.name.trim() || !candidateForm.email.trim() || !candidateForm.jobPostingId) {
      return toast.error("Vui lòng nhập Tên, Email và Chọn Vị trí tuyển dụng");
    }
    axios.post('http://localhost:5000/api/candidates', candidateForm)
      .then(() => {
        fetchJobsAndCandidates();
        setShowCandidateModal(false);
        setCandidateForm({ name: '', email: '', phone: '', cvUrl: '', jobPostingId: '' });
        toast.success("Đã thêm ứng viên vào hệ thống!");
      })
      .catch(() => toast.error("Lỗi khi thêm ứng viên"));
  };

  // --- Business Workflow Logic ---
  const validTransitions = {
    SOURCED: ['SCREENING', 'REJECTED'],
    APPLIED: ['SCREENING', 'REJECTED', 'SOURCED'],
    SCREENING: ['INTERVIEWING', 'REJECTED'],
    INTERVIEWING: ['OFFERING', 'REJECTED'],
    OFFERING: ['HIRED', 'REJECTED'],
    HIRED: [],
    REJECTED: ['SOURCED']
  };

  const getNextStageInfo = (currentStatus) => {
    switch (currentStatus) {
      case 'SOURCED':
      case 'APPLIED':
        return { target: 'SCREENING', label: 'Duyệt hồ sơ' };
      case 'SCREENING':
        return { target: 'INTERVIEWING', label: 'Mời phỏng vấn' };
      case 'INTERVIEWING':
        return { target: 'OFFERING', label: 'Gửi Offer' };
      case 'OFFERING':
        return { target: 'HIRED', label: 'Tiếp nhận (Hired)' };
      default:
        return null;
    }
  };

  const checkValidTransition = (currentStatus, newStatus) => {
    if (!validTransitions[currentStatus]) return false;
    return validTransitions[currentStatus].includes(newStatus);
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e, candidateId) => {
    e.dataTransfer.setData('candidateId', candidateId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    if (!candidateId) return;

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.status === newStatus) return;

    if (!checkValidTransition(candidate.status, newStatus)) {
      return toast.error("Thao tác không hợp lệ theo quy trình tuyển dụng chuẩn!");
    }

    setPendingDrop({ candidateId, newStatus, candidateName: candidate.name });
  };

  const confirmDrop = () => {
    if (!pendingDrop) return;
    const { candidateId, newStatus } = pendingDrop;

    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    setPendingDrop(null);

    axios.put(`http://localhost:5000/api/candidates/${candidateId}`, { status: newStatus })
      .then(() => toast.success(`Đã cập nhật trạng thái ứng viên!`))
      .catch(err => {
        console.error("Lỗi khi chuyển trạng thái", err);
        toast.error("Lỗi khi lưu trạng thái. Đang làm mới...");
        fetchJobsAndCandidates();
      });
  };

  const cancelDrop = () => {
    setPendingDrop(null);
  };

  const handleDirectTransition = (candidate, newStatus) => {
    if (!checkValidTransition(candidate.status, newStatus)) {
      return toast.error("Thao tác chuyển trạng thái không hợp lệ!");
    }
    setPendingDrop({ candidateId: candidate.id, newStatus, candidateName: candidate.name });
  };

  const statuses = [
    { id: 'SOURCED', title: 'Sàng lọc hồ sơ', color: '#64748B', bgLight: '#f8fafc' },
    { id: 'SCREENING', title: 'Sơ loại & Đánh giá', color: '#0284c7', bgLight: '#f0f9ff' },
    { id: 'INTERVIEWING', title: 'Phỏng vấn chuyên sâu', color: '#d97706', bgLight: '#fffbeb' },
    { id: 'OFFERING', title: 'Chốt đề nghị (Offer)', color: '#059669', bgLight: '#f0fdf4' },
    { id: 'HIRED', title: 'Tiếp nhận thành công', color: '#2563eb', bgLight: '#eff6ff' },
    { id: 'REJECTED', title: 'Từ chối / Lưu trữ', color: '#94a3b8', bgLight: '#f8fafc' }
  ];

  // Pipeline Filter logic
  const processedCandidates = useMemo(() => {
    return candidates.filter(c => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        (c.name && c.name.toLowerCase().includes(query)) || 
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)) ||
        (c.id && c.id.toLowerCase().includes(query));
      
      const matchesDept = filterDepartment ? c.jobPosting?.departmentId === filterDepartment : true;
      const matchesJob = filterJob ? c.jobPostingId === filterJob : true;
      const matchesStatus = filterStatus 
        ? (filterStatus === 'SOURCED' ? (c.status === 'SOURCED' || c.status === 'APPLIED') : c.status === filterStatus)
        : true;
      
      return matchesSearch && matchesDept && matchesJob && matchesStatus;
    });
  }, [candidates, searchQuery, filterDepartment, filterJob, filterStatus]);

  // High-Density ATS Metrics
  const stats = useMemo(() => {
    const total = candidates.length;
    const sourced = candidates.filter(c => c.status === 'SOURCED' || c.status === 'APPLIED').length;
    const screening = candidates.filter(c => c.status === 'SCREENING').length;
    const interviewing = candidates.filter(c => c.status === 'INTERVIEWING').length;
    const offering = candidates.filter(c => c.status === 'OFFERING').length;
    const hired = candidates.filter(c => c.status === 'HIRED').length;
    const rejected = candidates.filter(c => c.status === 'REJECTED').length;
    const activePipeline = sourced + screening + interviewing + offering;
    const hireRate = total > 0 ? Math.round((hired / total) * 100) : 0;

    return { total, activePipeline, interviewing, offering, hired, rejected, hireRate };
  }, [candidates]);

  // CSV Export for ATS data
  const handleExportCSV = () => {
    if (processedCandidates.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    const headers = ["Mã Ứng Viên", "Họ và tên", "Email", "Số điện thoại", "Vị trí ứng tuyển", "Phòng ban", "Trạng thái", "Link CV"];
    const rows = processedCandidates.map(c => [
      `"APP-${c.id.substring(0, 6).toUpperCase()}"`,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.jobPosting?.title || ''}"`,
      `"${c.jobPosting?.department?.name || ''}"`,
      `"${statuses.find(s => s.id === c.status)?.title || c.status}"`,
      `"${c.cvUrl || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Tuyen_Dung_ATS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã tải xuống file báo cáo tuyển dụng!");
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Executive Top Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        padding: '1.25rem 1.75rem',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              backgroundColor: '#EEF2FF', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Briefcase size={20} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Hệ thống Tuyển dụng Doanh nghiệp (ATS)
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Quản trị quy trình phỏng vấn chuẩn 6 giai đoạn, theo dõi ứng viên và chuyển tiếp tuyển dụng trực quan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <div style={{ backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px', display: 'flex', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setViewMode('kanban')} 
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
                backgroundColor: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
              title="Giao diện Kanban kéo thả"
            >
              <LayoutGrid size={16} /> Kanban
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
                backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
              title="Giao diện Bảng chi tiết"
            >
              <List size={16} /> Bảng dữ liệu
            </button>
          </div>

          <button onClick={handleExportCSV} className="btn btn-outline" style={{ height: 38, fontSize: '0.85rem' }}>
            <Download size={16} /> Xuất CSV
          </button>
          <button onClick={() => setShowCandidateModal(true)} className="btn btn-primary" style={{ height: 38, fontSize: '0.85rem' }}>
            <UserPlus size={16} /> Thêm Ứng viên
          </button>
        </div>
      </div>

      {/* 2. Filter Bar: 1 hàng chia 4 ô đều nhau */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0.75rem 1.25rem',
        border: '1px solid var(--border)', display: 'grid',
        gridTemplateColumns: (searchQuery || filterDepartment || filterJob || filterStatus) ? 'repeat(4, minmax(0, 1fr)) auto' : 'repeat(4, minmax(0, 1fr))',
        gap: '0.75rem', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        {/* Ô 1: Tìm kiếm */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email, SĐT hoặc mã..." 
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={searchQuery} 
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
          />
        </div>

        {/* Ô 2: Vị trí tuyển */}
        <div style={{ width: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterJob} 
            onChange={e => { setFilterJob(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả vị trí tuyển</option>
            {jobPostings.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        {/* Ô 3: Phòng ban */}
        <div style={{ width: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterDepartment} 
            onChange={e => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Ô 4: Trạng thái vòng */}
        <div style={{ width: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả trạng thái vòng</option>
            {statuses.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {/* Nút xóa bộ lọc */}
        {(searchQuery || filterDepartment || filterJob || filterStatus) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterDepartment('');
              setFilterJob('');
              setFilterStatus('');
              setCurrentPage(1);
            }}
            className="btn btn-outline"
            style={{ height: 38, fontSize: '0.8rem', padding: '0 0.85rem', whiteSpace: 'nowrap', color: '#64748B' }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* 4. Main ATS Workspace */}
      {viewMode === 'kanban' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(225px, 1fr))',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          minHeight: '560px'
        }} className="custom-scrollbar">
          {statuses.map(col => {
            const columnCandidates = processedCandidates.filter(c => 
              col.id === 'SOURCED'
                ? (c.status === 'SOURCED' || c.status === 'APPLIED')
                : c.status === col.id
            );

            return (
              <div 
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '75vh',
                  overflow: 'hidden'
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }} />
                    <h3 style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1E293B', margin: 0, letterSpacing: '0.2px' }}>
                      {col.title}
                    </h3>
                  </div>
                  <span style={{
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    border: '1px solid #E2E8F0'
                  }}>
                    {columnCandidates.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div style={{
                  padding: '0.75rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  flex: 1
                }} className="custom-scrollbar">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Đang tải...
                    </div>
                  ) : columnCandidates.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '2.5rem 1rem',
                      color: '#94A3B8', fontSize: '0.8rem',
                      border: '1px dashed #CBD5E1', borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                      <Inbox size={22} color="#CBD5E1" />
                      <span style={{ fontWeight: 500, color: '#64748B' }}>Chưa có hồ sơ</span>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Kéo thẻ vào đây để chuyển bước</span>
                    </div>
                  ) : (
                    columnCandidates.map(c => {
                      const nextStep = getNextStageInfo(c.status);
                      return (
                        <div 
                          key={c.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            cursor: 'grab',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.55rem'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 4px 8px -2px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.03)';
                            e.currentTarget.style.borderColor = '#CBD5E1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                          }}
                        >
                          {/* Card Head: ID & Date */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 600, color: '#64748B',
                              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                              padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.3px'
                            }}>
                              APP-{c.id.substring(0, 6).toUpperCase()}
                            </span>
                            {c.createdAt ? (
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} color="#94A3B8" /> {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Ứng viên</span>
                            )}
                          </div>

                          {/* Candidate Name & Position */}
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', marginBottom: '2px', lineHeight: 1.3 }}>
                              {c.name}
                            </div>
                            <div style={{
                              fontSize: '0.78rem', color: '#475569', fontWeight: 500,
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                              <Briefcase size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.jobPosting?.title || 'Chưa gán vị trí'}
                              </span>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.email}</span>
                            </div>
                            {c.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                                <span>{c.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Foot: View CV & Action Buttons (Pure Icon Buttons) */}
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', marginTop: '2px'
                          }}>
                            {c.cvUrl ? (
                              <a 
                                href={c.cvUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{
                                  height: 28, width: 28, padding: 0,
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#475569', textDecoration: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                onClick={(e) => e.stopPropagation()}
                                title="Xem hồ sơ / CV ứng viên"
                              >
                                <FileText size={14} />
                              </a>
                            ) : (
                              <span 
                                style={{
                                  height: 28, width: 28, padding: 0,
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC', border: '1px dashed #E2E8F0',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#CBD5E1', cursor: 'not-allowed'
                                }}
                                title="Chưa đính kèm hồ sơ CV"
                              >
                                <FileText size={14} />
                              </span>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {nextStep && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectTransition(c, nextStep.target);
                                  }}
                                  style={{
                                    height: 28, width: 28, padding: 0,
                                    borderRadius: '6px',
                                    backgroundColor: nextStep.target === 'HIRED' ? '#16A34A' : '#0F172A',
                                    color: '#FFFFFF',
                                    border: 'none', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = nextStep.target === 'HIRED' ? '#15803D' : '#334155'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = nextStep.target === 'HIRED' ? '#16A34A' : '#0F172A'}
                                  title={`Chuyển bước tiếp theo: ${nextStep.label}`}
                                >
                                  {nextStep.target === 'HIRED' ? (
                                    <UserCheck size={14} />
                                  ) : nextStep.target === 'OFFERING' ? (
                                    <Briefcase size={14} />
                                  ) : nextStep.target === 'INTERVIEWING' ? (
                                    <Calendar size={14} />
                                  ) : (
                                    <ChevronRight size={15} />
                                  )}
                                </button>
                              )}

                              {col.id !== 'REJECTED' && col.id !== 'HIRED' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectTransition(c, 'REJECTED');
                                  }}
                                  style={{
                                    height: 28, width: 28, padding: 0,
                                    borderRadius: '6px',
                                    backgroundColor: '#FFFFFF', color: '#94A3B8',
                                    border: '1px solid #E2E8F0', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                                    e.currentTarget.style.borderColor = '#FECACA';
                                    e.currentTarget.style.color = '#EF4444';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.color = '#94A3B8';
                                  }}
                                  title="Từ chối hồ sơ ứng viên"
                                >
                                  <UserX size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
          overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
        }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã UV</th>
                  <th>Ứng viên</th>
                  <th>Vị trí ứng tuyển</th>
                  <th>Phòng ban</th>
                  <th>Thông tin liên hệ</th>
                  <th>Hồ sơ CV</th>
                  <th>Vòng tuyển dụng</th>
                  <th style={{ textAlign: 'center' }}>Thao tác chuyển bước</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                      Đang tải danh sách hồ sơ...
                    </td>
                  </tr>
                ) : processedCandidates.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                      Không tìm thấy ứng viên nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  processedCandidates
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(c => {
                      const statusObj = statuses.find(s => s.id === c.status) || statuses[0];
                      const nextStep = getNextStageInfo(c.status);

                      return (
                        <tr key={c.id}>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              APP-{c.id.substring(0, 6).toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%',
                                backgroundColor: '#F1F5F9', color: '#334155',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.85rem'
                              }}>
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>{c.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                  {c.createdAt ? `Nộp: ${new Date(c.createdAt).toLocaleDateString('vi-VN')}` : 'Ứng viên'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.85rem' }}>
                              {c.jobPosting?.title || 'Chưa gán'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                              {c.jobPosting?.department?.name || 'Doanh nghiệp'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: '#334155' }}>{c.email}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c.phone || 'Chưa có SĐT'}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {c.cvUrl ? (
                              <a 
                                href={c.cvUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{
                                  height: 28, width: 28, padding: 0,
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#475569', textDecoration: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                title="Mở file CV ứng viên"
                              >
                                <FileText size={14} />
                              </a>
                            ) : (
                              <span 
                                style={{
                                  height: 28, width: 28, padding: 0,
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC', border: '1px dashed #E2E8F0',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#CBD5E1', cursor: 'not-allowed'
                                }}
                                title="Không đính kèm CV"
                              >
                                <FileText size={14} />
                              </span>
                            )}
                          </td>
                          <td>
                            <select 
                              className="form-input" 
                              style={{ 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                                backgroundColor: '#F8FAFC', color: '#334155',
                                border: '1px solid #CBD5E1', cursor: 'pointer'
                              }}
                              value={c.status} 
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (!checkValidTransition(c.status, newStatus)) {
                                  return toast.error("Không thể lùi trạng thái quy trình hoặc nhảy cóc!");
                                }
                                setPendingDrop({ candidateId: c.id, newStatus, candidateName: c.name });
                              }}
                            >
                              {statuses.map(s => <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.title}</option>)}
                            </select>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                              {nextStep && (
                                <button
                                  onClick={() => handleDirectTransition(c, nextStep.target)}
                                  style={{
                                    height: 28, width: 28, padding: 0,
                                    backgroundColor: nextStep.target === 'HIRED' ? '#16A34A' : '#0F172A',
                                    color: '#FFFFFF',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                  title={`Chuyển bước tiếp theo: ${nextStep.label}`}
                                >
                                  {nextStep.target === 'HIRED' ? (
                                    <UserCheck size={14} />
                                  ) : nextStep.target === 'OFFERING' ? (
                                    <Briefcase size={14} />
                                  ) : nextStep.target === 'INTERVIEWING' ? (
                                    <Calendar size={14} />
                                  ) : (
                                    <ChevronRight size={15} />
                                  )}
                                </button>
                              )}
                              {c.status !== 'REJECTED' && c.status !== 'HIRED' && (
                                <button
                                  onClick={() => handleDirectTransition(c, 'REJECTED')}
                                  style={{
                                    height: 28, width: 28, padding: 0,
                                    borderRadius: '6px',
                                    backgroundColor: '#FFFFFF', color: '#94A3B8',
                                    border: '1px solid #E2E8F0', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                                    e.currentTarget.style.borderColor = '#FECACA';
                                    e.currentTarget.style.color = '#EF4444';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.color = '#94A3B8';
                                  }}
                                  title="Từ chối ứng viên"
                                >
                                  <UserX size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {processedCandidates.length > itemsPerPage && (
            <div style={{
              padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, processedCandidates.length)} trong tổng số {processedCandidates.length} ứng viên
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ height: 32, padding: '0 10px', fontSize: '0.8rem' }}
                >
                  Trước
                </button>
                {Array.from({ length: Math.ceil(processedCandidates.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                    style={{ height: 32, minWidth: 32, padding: 0, fontSize: '0.8rem' }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === Math.ceil(processedCandidates.length / itemsPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ height: 32, padding: '0 10px', fontSize: '0.8rem' }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create Job Posting */}
      {showJobModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '520px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                Tạo Vị trí Tuyển dụng Mới
              </h3>
              <button onClick={() => setShowJobModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                  Tiêu đề vị trí tuyển dụng <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={jobForm.title} 
                  onChange={e => setJobForm({...jobForm, title: e.target.value})} 
                  placeholder="VD: Senior Backend Engineer (NodeJS/PostgreSQL)" 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                  Mô tả yêu cầu và phúc lợi
                </label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical' }} 
                  value={jobForm.description} 
                  onChange={e => setJobForm({...jobForm, description: e.target.value})} 
                  placeholder="Yêu cầu từ 2 năm kinh nghiệm, chế độ đãi ngộ hấp dẫn..." 
                />
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setShowJobModal(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleCreateJob} className="btn btn-primary">Lưu & Đăng tuyển</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Add Candidate */}
      {showCandidateModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '520px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                Tiếp nhận Hồ sơ Ứng viên Mới
              </h3>
              <button onClick={() => setShowCandidateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                  Vị trí ứng tuyển <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select 
                  className="form-input" 
                  value={candidateForm.jobPostingId} 
                  onChange={e => setCandidateForm({...candidateForm, jobPostingId: e.target.value})}
                >
                  <option value="">-- Chọn vị trí tuyển dụng --</option>
                  {jobPostings.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                  Họ và tên ứng viên <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={candidateForm.name} 
                  onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} 
                  placeholder="VD: Nguyễn Văn An" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={candidateForm.email} 
                    onChange={e => setCandidateForm({...candidateForm, email: e.target.value})} 
                    placeholder="ungvien@example.com" 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                    Số điện thoại
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={candidateForm.phone} 
                    onChange={e => setCandidateForm({...candidateForm, phone: e.target.value})} 
                    placeholder="0912 345 678" 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                  Link Hồ sơ CV (Drive / Dropbox / Website)
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={candidateForm.cvUrl} 
                  onChange={e => setCandidateForm({...candidateForm, cvUrl: e.target.value})} 
                  placeholder="https://drive.google.com/..." 
                />
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setShowCandidateModal(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleCreateCandidate} className="btn btn-primary">Xác nhận Thêm</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Confirmation Transition */}
      {pendingDrop && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '420px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#EEF2FF', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={28} />
            </div>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              Xác nhận Chuyển Giai đoạn
            </h3>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Bạn có chắc muốn chuyển ứng viên <strong style={{ color: 'var(--text-heading)' }}>{pendingDrop.candidateName}</strong> sang trạng thái{' '}
              <strong style={{ color: 'var(--primary)' }}>
                {statuses.find(s => s.id === pendingDrop.newStatus)?.title}
              </strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button onClick={cancelDrop} className="btn btn-outline" style={{ flex: 1 }}>Hủy bỏ</button>
              <button onClick={confirmDrop} className="btn btn-primary" style={{ flex: 1 }}>Xác nhận chuyển</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
