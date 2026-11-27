import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, UserPlus, Star, Clock, X, CheckCircle2, Edit2, Trash2, 
  Search, Filter, AlertTriangle, Video, MapPin, Check, ChevronRight,
  TrendingUp, Users, CalendarCheck, CalendarX, ArrowUpDown, UserX,
  ChevronDown, Plus, UserCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { PageHeader } from '../../../components/common/PageHeader';

// Hàm tiện ích: Chuẩn hóa mảng người phỏng vấn thành chuỗi lưu trữ
const formatInterviewersToString = (list) => {
  if (!list || list.length === 0) return '';
  return list.map(item => {
    const rolePart = item.title ? item.title : (item.department || '');
    if (rolePart) {
      return `${item.name} (${rolePart})`;
    }
    return item.name;
  }).join(' & ');
};

// Hàm tiện ích: Phân tích chuỗi text người phỏng vấn ngược lại thành các tags
const parseInterviewerString = (str, empList = []) => {
  if (!str || !str.trim()) return [];
  const parts = str.split(/\s*&\s*|\s*,\s*|\s*;\s*/).map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    const matchedEmp = empList.find(e => 
      e.fullName && (part.toLowerCase().includes(e.fullName.toLowerCase()) || e.fullName.toLowerCase().includes(part.toLowerCase()))
    );
    if (matchedEmp) {
      return {
        id: matchedEmp.id,
        name: matchedEmp.fullName,
        title: matchedEmp.position?.title || '',
        department: matchedEmp.department?.name || '',
        isExternal: false
      };
    }
    const match = part.match(/^([^(]+)(?:\((.*)\))?$/);
    const name = match ? match[1].trim() : part;
    const title = match && match[2] ? match[2].trim() : '';
    return {
      id: 'legacy-' + Math.random().toString(36).substr(2, 9),
      name: name || part,
      title: title || '',
      department: '',
      isExternal: false
    };
  });
};

export const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [modalMode, setModalMode] = useState('add');

  // Multi-select Hội đồng phỏng vấn nội bộ state
  const [selectedInterviewers, setSelectedInterviewers] = useState([]);
  const [interviewerSearch, setInterviewerSearch] = useState('');

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvaluation, setFilterEvaluation] = useState('');

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    candidateId: '',
    interviewerId: '',
    roundName: 'Phỏng vấn',
    scheduledAt: '',
    location: 'Trực tuyến (Google Meet / Zoom)'
  });

  const [feedbackForm, setFeedbackForm] = useState({
    score: 5,
    comments: ''
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/interviews'),
      axios.get('/api/candidates'),
      axios.get('/api/employees').catch(err => {
        console.warn('Could not fetch employees:', err);
        return { data: [] };
      })
    ]).then(([intRes, candRes, empRes]) => {
      setInterviews(intRes.data || []);
      setCandidates(candRes.data || []);
      setEmployees(empRes?.data || []);
    }).catch(err => {
      console.error(err);
      toast.error('Lỗi khi tải danh sách lịch phỏng vấn');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Danh sách nhân sự nội bộ còn đang làm việc
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => e.status !== 'RESIGNED');
  }, [employees]);

  // Bộ lọc nhân sự theo từ khóa tìm kiếm
  const filteredDropdownEmployees = useMemo(() => {
    if (!interviewerSearch.trim()) return activeEmployees;
    const s = interviewerSearch.toLowerCase().trim();
    return activeEmployees.filter(e => {
      const name = (e.fullName || '').toLowerCase();
      const code = (e.code || '').toLowerCase();
      const pos = (e.position?.title || '').toLowerCase();
      const dept = (e.department?.name || '').toLowerCase();
      return name.includes(s) || code.includes(s) || pos.includes(s) || dept.includes(s);
    });
  }, [activeEmployees, interviewerSearch]);

  const updateInterviewersState = (newList) => {
    setSelectedInterviewers(newList);
    const formatted = formatInterviewersToString(newList);
    setScheduleForm(prev => ({ ...prev, interviewerId: formatted }));
  };

  const handleToggleEmployee = (emp) => {
    const exists = selectedInterviewers.some(i => i.id === emp.id || i.name === emp.fullName);
    if (exists) {
      const next = selectedInterviewers.filter(i => i.id !== emp.id && i.name !== emp.fullName);
      updateInterviewersState(next);
    } else {
      const next = [
        ...selectedInterviewers,
        {
          id: emp.id,
          name: emp.fullName,
          title: emp.position?.title || '',
          department: emp.department?.name || '',
          isExternal: false
        }
      ];
      updateInterviewersState(next);
    }
  };

  const handleRemoveInterviewer = (id) => {
    const next = selectedInterviewers.filter(i => i.id !== id);
    updateInterviewersState(next);
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedInterview(null);
    setScheduleForm({ 
      candidateId: '', 
      interviewerId: '', 
      roundName: 'Phỏng vấn', 
      scheduledAt: '', 
      location: 'Trực tuyến (Google Meet / Zoom)' 
    });
    setSelectedInterviewers([]);
    setInterviewerSearch('');
    setShowScheduleModal(true);
  };

  const handleOpenEdit = (inv) => {
    setModalMode('edit');
    setSelectedInterviewId(inv.id);
    setSelectedInterview(inv);
    setScheduleForm({
      candidateId: inv.candidateId,
      interviewerId: inv.interviewerId || '',
      roundName: inv.roundName || 'Phỏng vấn',
      scheduledAt: new Date(inv.scheduledAt).toISOString().slice(0, 16),
      location: inv.location || 'Trực tuyến (Google Meet / Zoom)'
    });
    const parsed = parseInterviewerString(inv.interviewerId, employees);
    setSelectedInterviewers(parsed);
    setInterviewerSearch('');
    setShowScheduleModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ 
      title: 'Xác nhận hủy lịch', 
      text: 'Bạn có chắc chắn muốn hủy buổi phỏng vấn này?', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Đồng ý hủy', 
      cancelButtonText: 'Giữ lại',
      confirmButtonColor: '#EF4444'
    });
    if (result.isConfirmed) {
      axios.delete(`/api/interviews/${id}`)
        .then(() => { 
          toast.success("Đã hủy lịch phỏng vấn thành công!"); 
          fetchData(); 
        })
        .catch(() => toast.error("Lỗi khi hủy lịch phỏng vấn"));
    }
  };

  const handleReportNoShow = (inv) => {
    Swal.fire({
      title: 'Báo ứng viên vắng mặt (No-show)?',
      html: `
        <div style="text-align: left; font-size: 0.9rem; color: #334155; line-height: 1.5;">
          <p>Ứng viên <strong>${inv.candidate?.name}</strong> đã không đến tham gia buổi phỏng vấn đúng hẹn?</p>
          <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 10px 0; font-size: 0.85rem;">
            <div>• Vị trí: <strong>${inv.candidate?.jobPosting?.title || 'Chưa gán'}</strong></div>
            <div>• Giờ hẹn: <strong>${new Date(inv.scheduledAt).toLocaleString('vi-VN')}</strong></div>
          </div>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0;">
            Khi bấm <strong>"Loại hồ sơ (Bùng lịch)"</strong>, hệ thống sẽ hủy buổi hẹn và tự động chuyển trạng thái ứng viên sang <strong>Từ chối (REJECTED)</strong>.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Loại hồ sơ (Bùng lịch)',
      denyButtonText: 'Dời lại lịch hẹn',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#EF4444',
      denyButtonColor: '#0F172A',
      cancelButtonColor: '#94A3B8'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(`/api/interviews/${inv.id}/no-show`, { action: 'REJECT' });
          toast.success('Đã ghi nhận ứng viên vắng mặt và tự động loại hồ sơ.');
          fetchData();
        } catch (error) {
          toast.error('Lỗi khi ghi nhận vắng mặt');
        }
      } else if (result.isDenied) {
        handleOpenEdit(inv);
      }
    });
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleForm.candidateId || !scheduleForm.interviewerId || !scheduleForm.scheduledAt) {
      return toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc");
    }

    if (modalMode === 'add') {
      axios.post('/api/interviews', scheduleForm)
        .then(() => {
          toast.success("Đã lên lịch phỏng vấn thành công!");
          fetchData();
          setShowScheduleModal(false);
        })
        .catch(() => toast.error("Lỗi khi xếp lịch phỏng vấn"));
    } else {
      axios.put(`/api/interviews/${selectedInterviewId}`, scheduleForm)
        .then(() => {
          toast.success("Đã cập nhật thông tin lịch phỏng vấn!");
          fetchData();
          setShowScheduleModal(false);
        })
        .catch(() => toast.error("Lỗi khi cập nhật lịch phỏng vấn"));
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    axios.post(`/api/interviews/${selectedInterviewId}/feedback`, feedbackForm)
      .then(() => {
        setShowFeedbackModal(false);
        setFeedbackForm({ score: 5, comments: '' });
        
        Swal.fire({
          title: 'Đã lưu đánh giá!',
          text: 'Bạn có muốn quyết định ngay trạng thái tiếp theo của ứng viên?',
          icon: 'success',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Chốt Offer',
          denyButtonText: 'Từ chối (Loại)',
          cancelButtonText: 'Để sau',
          confirmButtonColor: '#10B981',
          denyButtonColor: '#EF4444'
        }).then((result) => {
          if (result.isConfirmed) {
            updateCandidateStatus(selectedInterviewId, 'OFFERING');
          } else if (result.isDenied) {
            updateCandidateStatus(selectedInterviewId, 'REJECTED');
          } else {
            fetchData();
          }
        });
      })
      .catch(() => toast.error("Lỗi khi lưu đánh giá kết quả"));
  };

  const updateCandidateStatus = (interviewId, status) => {
    const inv = interviews.find(i => i.id === interviewId);
    if (inv) {
      axios.put(`/api/candidates/${inv.candidateId}`, { status })
        .then(() => {
          toast.success(`Đã chuyển ứng viên sang trạng thái: ${status === 'OFFERING' ? 'Chốt Offer' : 'Từ chối'}!`);
          fetchData();
        })
        .catch(() => toast.error("Lỗi khi cập nhật trạng thái ứng viên"));
    }
  };

  const interviewingCandidates = candidates.filter(c => c.status === 'INTERVIEWING');

  // --- Thống kê KPIs ---
  const stats = useMemo(() => {
    const total = interviews.length;
    const pending = interviews.filter(i => !i.status || i.status === 'PENDING_CONFIRMATION').length;
    const confirmed = interviews.filter(i => i.status === 'CONFIRMED').length;
    const evaluated = interviews.filter(i => i.feedbacks && i.feedbacks.length > 0).length;
    const cancelled = interviews.filter(i => i.status === 'CANCELLED' || i.status === 'DECLINED').length;
    return { total, pending, confirmed, evaluated, cancelled };
  }, [interviews]);

  // --- Lọc dữ liệu ---
  const filteredInterviews = useMemo(() => {
    return interviews.filter(inv => {
      // 1. Tìm kiếm theo tên ứng viên, email, vị trí, người phỏng vấn
      const candName = inv.candidate?.name || '';
      const candEmail = inv.candidate?.email || '';
      const jobTitle = inv.candidate?.jobPosting?.title || '';
      const interviewer = inv.interviewerId || '';
      const searchMatch = !searchTerm || 
        candName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interviewer.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Lọc theo vị trí tuyển dụng
      const jobMatch = !filterJob || inv.candidate?.jobPosting?.title === filterJob;

      // 3. Lọc theo trạng thái xác nhận
      const statusMatch = !filterStatus || (
        filterStatus === 'PENDING' ? (!inv.status || inv.status === 'PENDING_CONFIRMATION') :
        inv.status === filterStatus
      );

      // 4. Lọc theo đánh giá
      const hasFeedback = inv.feedbacks && inv.feedbacks.length > 0;
      const evalMatch = !filterEvaluation || (
        filterEvaluation === 'DONE' ? hasFeedback :
        filterEvaluation === 'PENDING' ? !hasFeedback : true
      );

      return searchMatch && jobMatch && statusMatch && evalMatch;
    });
  }, [interviews, searchTerm, filterJob, filterStatus, filterEvaluation]);

  // --- Phân trang thống nhất ---
  const {
    currentPage,
    setCurrentPage,
    pageSize: itemsPerPage,
    setPageSize: setItemsPerPage,
    totalItems,
    totalPages,
    paginatedItems: paginatedInterviews,
  } = usePagination(filteredInterviews, 10);

  // Danh sách các vị trí tuyển dụng độc nhất
  const uniqueJobs = useMemo(() => {
    const jobs = new Set(interviews.map(i => i.candidate?.jobPosting?.title).filter(Boolean));
    return Array.from(jobs);
  }, [interviews]);

  // Helper hàm tạo màu Avatar theo chuỗi
  const getAvatarGradient = (name = '') => {
    const colors = [
      'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
      'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header chuẩn đồng bộ */}
      <PageHeader
        icon={<Calendar size={20} />}
        title="Quản lý Lịch Phỏng Vấn & Đánh Giá"
        subtitle="Điều phối hội đồng phỏng vấn, theo dõi phản hồi xác nhận 24h từ ứng viên và chấm điểm chuyên môn."
        actions={
          <button 
            onClick={handleOpenAdd} 
            className="btn btn-primary"
            style={{
              height: 38,
              padding: '0 1.15rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Calendar size={16} /> Lên lịch phỏng vấn mới
          </button>
        }
      />

      {/* 2. Toolbar & Bộ lọc Tìm kiếm (1 hàng chia 4 ô đều nhau) */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0.75rem 1.25rem',
        border: '1px solid var(--border)', display: 'grid',
        gridTemplateColumns: (searchTerm || filterJob || filterStatus || filterEvaluation) ? 'repeat(4, minmax(0, 1fr)) auto' : 'repeat(4, minmax(0, 1fr))',
        gap: '0.75rem', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        {/* Ô 1: Tìm Kiếm */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo ứng viên, người phỏng vấn..." 
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>

        {/* Ô 2: Lọc theo Vị trí tuyển dụng */}
        <div style={{ width: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterJob} 
            onChange={e => { setFilterJob(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả vị trí tuyển dụng</option>
            {uniqueJobs.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {/* Ô 3: Lọc Trạng thái xác nhận 24h */}
        <div style={{ width: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả trạng thái xác nhận 24h</option>
            <option value="PENDING">Chờ ứng viên phản hồi</option>
            <option value="CONFIRMED">Đã xác nhận tham gia</option>
            <option value="DECLINED">Đề xuất đổi lịch / Từ chối</option>
            <option value="CANCELLED">Đã hủy (quá hạn 24h)</option>
          </select>
        </div>

        {/* Ô 4: Lọc Trạng thái đánh giá */}
        <div style={{ width: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterEvaluation} 
            onChange={e => { setFilterEvaluation(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả kết quả đánh giá</option>
            <option value="DONE">Đã có điểm đánh giá</option>
            <option value="PENDING">Chưa có điểm đánh giá</option>
          </select>
        </div>

        {/* Nút xóa bộ lọc */}
        {(searchTerm || filterJob || filterStatus || filterEvaluation) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterJob('');
              setFilterStatus('');
              setFilterEvaluation('');
              setCurrentPage(1);
            }}
            className="btn btn-outline"
            style={{ height: 38, fontSize: '0.8rem', padding: '0 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* 4. Bảng Dữ Liệu Lịch Phỏng Vấn Chuẩn SaaS 2026 */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', minWidth: '120px' }}>
                  Thời gian
                </th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', minWidth: '220px' }}>
                  Ứng viên
                </th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', minWidth: '220px' }}>
                  Vị trí ứng tuyển
                </th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', minWidth: '170px' }}>
                  Người phỏng vấn
                </th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', minWidth: '200px' }}>
                  Xác nhận ứng viên (24h)
                </th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', minWidth: '180px', textAlign: 'right' }}>
                  Đánh giá kết quả
                </th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', width: '80px', textAlign: 'center' }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Clock size={24} className="animate-spin text-primary" />
                      <span>Đang tải danh sách lịch phỏng vấn...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedInterviews.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CalendarX size={32} color="#94A3B8" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Không tìm thấy lịch phỏng vấn nào</span>
                      <span style={{ fontSize: '0.8rem' }}>Thử thay đổi từ khóa tìm kiếm hoặc bấm Lên lịch mới</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInterviews.map((inv, idx) => {
                  const hasFeedback = inv.feedbacks && inv.feedbacks.length > 0;
                  const date = new Date(inv.scheduledAt);
                  const formattedDate = date.toLocaleDateString('vi-VN');
                  const formattedTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const isPast = date < new Date();
                  const isToday = new Date().toDateString() === date.toDateString();

                  const isPending = !inv.status || inv.status === 'PENDING_CONFIRMATION';
                  const isConfirmed = inv.status === 'CONFIRMED';
                  const isDeclined = inv.status === 'DECLINED';
                  const isCancelled = inv.status === 'CANCELLED';
                  const isCompleted = inv.status === 'COMPLETED' || hasFeedback;

                  const expiresAt = inv.expiresAt 
                    ? new Date(inv.expiresAt) 
                    : new Date(new Date(inv.createdAt || inv.scheduledAt).getTime() + 24 * 60 * 60 * 1000);
                  const remainingHours = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (3600 * 1000)));

                  return (
                    <tr 
                      key={inv.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                    >
                      {/* Cột 1: Giờ & Ngày hẹn */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0F172A', fontSize: '0.85rem', fontWeight: 600 }}>
                          <Clock size={13} color="#64748B" /> {formattedTime}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                          {formattedDate}
                        </div>
                        {isToday && (
                          <span style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                            Hôm nay
                          </span>
                        )}
                      </td>

                      {/* Cột 2: Ứng viên */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            backgroundColor: '#F1F5F9', color: '#334155',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                          }}>
                            {(inv.candidate?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {inv.candidate?.name || 'Ứng viên chưa rõ'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {inv.candidate?.email || 'Chưa có email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Vị trí ứng tuyển */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.35 }}>
                            {inv.candidate?.jobPosting?.title || 'Chưa gán vị trí'}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {inv.location?.includes('Google Meet') || inv.location?.includes('Zoom') ? <Video size={12} color="#64748B" /> : <MapPin size={12} color="#64748B" />}
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              {inv.location || 'Online Meet'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Người phỏng vấn */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem', fontWeight: 600
                          }}>
                            {(inv.interviewerId || 'HD').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                              {inv.interviewerId || 'Chưa phân công'}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              Hội đồng đánh giá
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái xác nhận 24h & Hiện diện */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        {isCompleted && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#F0FDF4', color: '#15803D',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.75rem', fontWeight: 500, border: '1px solid #BBF7D0',
                              width: 'fit-content'
                            }}>
                              Đã hoàn thành
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Đã có điểm đánh giá
                            </span>
                          </div>
                        )}

                        {!isCompleted && isPending && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#FFFBEB', color: '#B45309',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.75rem', fontWeight: 500, border: '1px solid #FDE68A',
                              width: 'fit-content'
                            }}>
                              Chờ phản hồi (còn {remainingHours}h)
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {inv.location?.includes('Google Meet') || inv.location?.includes('Zoom') ? <Video size={11} color="#64748B" /> : <MapPin size={11} color="#64748B" />}
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                {inv.location || 'Online Meet'}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isCompleted && isConfirmed && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#F0FDF4', color: '#15803D',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.75rem', fontWeight: 500, border: '1px solid #BBF7D0',
                              width: 'fit-content'
                            }}>
                              Đã xác nhận tham gia
                            </span>
                            {inv.candidateResponse && (
                              <div style={{ fontSize: '0.72rem', color: '#64748B', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={inv.candidateResponse}>
                                "{inv.candidateResponse}"
                              </div>
                            )}
                          </div>
                        )}

                        {!isCompleted && isDeclined && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {inv.candidateResponse?.includes('[XIN ĐỔI LỊCH]') ? (
                              <div>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  backgroundColor: '#F8FAFC', color: '#475569',
                                  padding: '2px 8px', borderRadius: '4px',
                                  fontSize: '0.75rem', fontWeight: 500, border: '1px solid #E2E8F0',
                                  width: 'fit-content'
                                }}>
                                  Đề xuất đổi lịch
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(inv)}
                                  style={{
                                    background: 'none', border: 'none', padding: 0,
                                    color: '#2563EB', fontSize: '0.72rem', fontWeight: 500,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px'
                                  }}
                                >
                                  Sắp xếp lại lịch hẹn →
                                </button>
                              </div>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                backgroundColor: '#F8FAFC', color: '#64748B',
                                padding: '2px 8px', borderRadius: '4px',
                                fontSize: '0.75rem', fontWeight: 500, border: '1px solid #E2E8F0',
                                width: 'fit-content'
                              }}>
                                Ứng viên từ chối
                              </span>
                            )}
                          </div>
                        )}

                        {!isCompleted && isCancelled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#F8FAFC', color: '#64748B',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.75rem', fontWeight: 500, border: '1px solid #E2E8F0',
                              width: 'fit-content'
                            }}>
                              {inv.candidateResponse?.includes('No-show') || inv.candidateResponse?.includes('vắng mặt') 
                                ? 'Bùng lịch / Vắng mặt' 
                                : 'Đã hủy (quá 24h)'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                              {inv.candidateResponse?.includes('No-show') || inv.candidateResponse?.includes('vắng mặt')
                                ? 'Ứng viên không đến'
                                : 'Không có phản hồi'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Đánh giá & Kết quả */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        {hasFeedback ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#F8FAFC', color: '#0F172A',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.78rem', fontWeight: 600, border: '1px solid #E2E8F0'
                            }} title={inv.feedbacks[0].comments}>
                              {inv.feedbacks[0].score}/10 Điểm
                            </span>

                            {/* Badge trạng thái ứng viên */}
                            {inv.candidate?.status === 'INTERVIEWING' && (
                              <button 
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Phê duyệt kết quả',
                                    text: `Chuyển ứng viên ${inv.candidate?.name} sang bước:`,
                                    icon: 'question',
                                    showCancelButton: true,
                                    showDenyButton: true,
                                    confirmButtonText: 'Chốt Offer',
                                    denyButtonText: 'Từ chối (Loại)',
                                    cancelButtonText: 'Để sau',
                                    confirmButtonColor: '#0F172A',
                                    denyButtonColor: '#EF4444'
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      updateCandidateStatus(inv.id, 'OFFERING');
                                    } else if (result.isDenied) {
                                      updateCandidateStatus(inv.id, 'REJECTED');
                                    }
                                  });
                                }}
                                style={{
                                  padding: '3px 8px', borderRadius: '5px',
                                  backgroundColor: '#0F172A', color: '#FFFFFF',
                                  border: 'none', fontSize: '0.72rem', fontWeight: 600,
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px'
                                }}
                              >
                                Chốt kết quả <ChevronRight size={12} />
                              </button>
                            )}
                            {inv.candidate?.status === 'OFFERING' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#047857', backgroundColor: '#F0FDF4', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                                Đang chốt Offer
                              </span>
                            )}
                            {inv.candidate?.status === 'REJECTED' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748B', backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                Không đạt
                              </span>
                            )}
                            {inv.candidate?.status === 'HIRED' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#1E40AF', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                                Đã nhận việc
                              </span>
                            )}
                          </div>
                        ) : (isCancelled || isDeclined) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                              Không đánh giá
                            </span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748B', backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                              Hồ sơ bị loại
                            </span>
                          </div>
                        ) : isPast ? (
                          <button 
                            onClick={() => { setSelectedInterviewId(inv.id); setShowFeedbackModal(true); }} 
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#0F172A',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Chấm điểm
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                            Chưa diễn ra
                          </span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {!isCancelled && !hasFeedback && (
                            <>
                              <button 
                                onClick={() => handleOpenEdit(inv)} 
                                style={{
                                  width: 30, height: 30, borderRadius: '6px',
                                  backgroundColor: 'transparent', border: '1px solid #E2E8F0',
                                  color: '#64748B', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Chỉnh sửa lịch hẹn"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleReportNoShow(inv)} 
                                style={{
                                  width: 30, height: 30, borderRadius: '6px',
                                  backgroundColor: 'transparent', border: '1px solid #E2E8F0',
                                  color: '#94A3B8', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                                  e.currentTarget.style.borderColor = '#FECACA';
                                  e.currentTarget.style.color = '#EF4444';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#E2E8F0';
                                  e.currentTarget.style.color = '#94A3B8';
                                }}
                                title="Báo ứng viên bùng hẹn / vắng mặt (No-show)"
                              >
                                <UserX size={13} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDelete(inv.id)} 
                            style={{
                              width: 30, height: 30, borderRadius: '6px',
                              backgroundColor: 'transparent', border: '1px solid #E2E8F0',
                              color: '#94A3B8', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#FEF2F2';
                              e.currentTarget.style.borderColor = '#FECACA';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = '#E2E8F0';
                              e.currentTarget.style.color = '#94A3B8';
                            }}
                            title="Xóa bản ghi"
                          >
                            <Trash2 size={13} />
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

        {/* Phân Trang */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setItemsPerPage}
          itemLabel="buổi phỏng vấn"
        />
      </div>

      {/* MODAL 1: Lên lịch phỏng vấn (Bố cục 2 cột rộng rãi, chuyên nghiệp) */}
      {showScheduleModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '960px', maxWidth: '96vw',
            maxHeight: '92vh', border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={22} color="var(--primary)" />
                  {modalMode === 'add' ? 'Lên lịch Phỏng vấn Mới' : 'Cập nhật Lịch Phỏng vấn'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Thiết lập thông tin buổi phỏng vấn và lựa chọn Hội đồng chuyên môn nội bộ
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowScheduleModal(false)} 
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form & 2-Column Body */}
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{
                padding: '1.5rem 1.75rem',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: '1fr 1.15fr',
                gap: '1.75rem',
                flex: 1
              }}>
                
                {/* CỘT 1: Thông tin Lịch hẹn & Ứng viên */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {modalMode === 'edit' && selectedInterview?.candidateResponse && (
                    <div style={{
                      padding: '0.85rem 1rem', borderRadius: '8px',
                      backgroundColor: selectedInterview.candidateResponse.includes('[XIN ĐỔI LỊCH]') ? '#FFFBEB' : '#FEF2F2',
                      border: '1px solid',
                      borderColor: selectedInterview.candidateResponse.includes('[XIN ĐỔI LỊCH]') ? '#FCD34D' : '#FECACA',
                      fontSize: '0.8125rem',
                      color: selectedInterview.candidateResponse.includes('[XIN ĐỔI LỊCH]') ? '#92400E' : '#991B1B'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                        {selectedInterview.candidateResponse.includes('[XIN ĐỔI LỊCH]') ? '🗓️ Phản hồi từ Ứng viên (Xin đổi lịch):' : 'Phản hồi từ Ứng viên:'}
                      </strong>
                      <div style={{ fontSize: '0.78rem', lineHeight: '1.45' }}>
                        {selectedInterview.candidateResponse}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                      Ứng viên tham gia phỏng vấn <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select 
                      required 
                      disabled={modalMode === 'edit'} 
                      className="form-input"
                      value={scheduleForm.candidateId} 
                      onChange={e => setScheduleForm({...scheduleForm, candidateId: e.target.value})}
                    >
                      <option value="">-- Chọn ứng viên đang mở phỏng vấn --</option>
                      {modalMode === 'edit' ? (
                        <option value={scheduleForm.candidateId}>{selectedInterview?.candidate?.name} - {selectedInterview?.candidate?.jobPosting?.title}</option>
                      ) : (
                        interviewingCandidates.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.jobPosting?.title || 'Chưa gán'})</option>
                        ))
                      )}
                    </select>
                    {interviewingCandidates.length === 0 && modalMode === 'add' && (
                      <p style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '4px' }}>
                        ⚠️ Không có ứng viên nào đang ở giai đoạn Phỏng vấn (hãy duyệt hồ sơ sang Phỏng vấn trước).
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                      Vòng phỏng vấn
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={scheduleForm.roundName} 
                      onChange={e => setScheduleForm({...scheduleForm, roundName: e.target.value})} 
                      placeholder="VD: Phỏng vấn Vòng 1, Chuyên môn, HR Interview..." 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                      Thời gian diễn ra phỏng vấn <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      required 
                      type="datetime-local" 
                      className="form-input" 
                      value={scheduleForm.scheduledAt} 
                      onChange={e => setScheduleForm({...scheduleForm, scheduledAt: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                      Hình thức / Địa điểm / Link họp trực tuyến
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={scheduleForm.location} 
                      onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})} 
                      placeholder="VD: Google Meet: meet.google.com/xyz hoặc Phòng họp Tầng 3" 
                    />
                  </div>

                  <div style={{
                    padding: '0.85rem 1rem', borderRadius: '8px',
                    backgroundColor: '#FFF7ED', border: '1px dashed #FDBA74',
                    fontSize: '0.78rem', color: '#C2410C', lineHeight: 1.45, marginTop: 'auto'
                  }}>
                    ⏰ <strong>Quy định xác nhận tự động 24H:</strong> Thông báo sẽ được đồng bộ ngay sang Cổng Ứng viên. Nếu ứng viên không xác nhận tham gia trong vòng <strong>24 giờ</strong>, hệ thống sẽ <strong>tự động hủy lịch</strong>.
                  </div>
                </div>

                {/* CỘT 2: Chọn Hội đồng Phỏng vấn Nội bộ */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={16} color="var(--primary)" />
                        Hội đồng Phỏng vấn Nội bộ <span style={{ color: '#EF4444' }}>*</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Chọn các nhân sự trong công ty tham gia hội đồng đánh giá
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: selectedInterviewers.length > 0 ? '#DCFCE7' : '#F1F5F9',
                      color: selectedInterviewers.length > 0 ? '#15803D' : '#64748B',
                      padding: '3px 8px', borderRadius: '12px'
                    }}>
                      Đã chọn: {selectedInterviewers.length}
                    </span>
                  </div>

                  {/* Khung hiển thị các nhân sự đã chọn */}
                  <div style={{
                    minHeight: '44px', maxHeight: '90px', overflowY: 'auto',
                    backgroundColor: '#FFFFFF', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px',
                    alignItems: 'center'
                  }}>
                    {selectedInterviewers.length === 0 ? (
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic', padding: '2px 4px' }}>
                        Chưa chọn nhân sự nào. Vui lòng bấm "Chọn" ở danh sách bên dưới.
                      </span>
                    ) : (
                      selectedInterviewers.map(item => (
                        <span
                          key={item.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
                            color: '#1D4ED8', padding: '2px 8px 2px 6px', borderRadius: '16px',
                            fontSize: '0.76rem', fontWeight: 500
                          }}
                        >
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%',
                            backgroundColor: '#DBEAFE', color: '#1E40AF',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 700
                          }}>
                            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                          </span>
                          <span>
                            <strong>{item.name}</strong>
                            {item.title && (
                              <span style={{ opacity: 0.85, marginLeft: '3px', fontSize: '0.7rem' }}>
                                ({item.title})
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterviewer(item.id)}
                            style={{
                              background: 'none', border: 'none', padding: 0,
                              cursor: 'pointer', color: '#3B82F6',
                              display: 'inline-flex', alignItems: 'center'
                            }}
                            title="Bỏ người này"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Ô tìm kiếm nhân sự nội bộ */}
                  <div style={{ position: 'relative' }}>
                    <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="form-input"
                      value={interviewerSearch}
                      onChange={e => setInterviewerSearch(e.target.value)}
                      placeholder={`Tìm kiếm theo tên, chức vụ, phòng ban (${activeEmployees.length} nhân sự)...`}
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '36px' }}
                    />
                    {interviewerSearch && (
                      <button
                        type="button"
                        onClick={() => setInterviewerSearch('')}
                        style={{
                          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px'
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Danh sách nhân sự nội bộ có thể chọn (nhúng trực tiếp, cuộn độc lập) */}
                  <div style={{
                    backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px',
                    height: '240px', overflowY: 'auto'
                  }}>
                    {filteredDropdownEmployees.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                        Không tìm thấy nhân viên nào phù hợp với từ khóa "{interviewerSearch}"
                      </div>
                    ) : (
                      filteredDropdownEmployees.map(emp => {
                        const isSelected = selectedInterviewers.some(i => i.id === emp.id || i.name === emp.fullName);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => handleToggleEmployee(emp)}
                            style={{
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid #F1F5F9',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                              transition: 'background-color 0.1s'
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                backgroundColor: isSelected ? '#DCFCE7' : '#F1F5F9',
                                color: isSelected ? '#15803D' : '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                              }}>
                                {emp.fullName ? emp.fullName.charAt(0).toUpperCase() : 'E'}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  color: isSelected ? '#15803D' : '#0F172A',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {emp.fullName}
                                  <span style={{ marginLeft: '5px', fontSize: '0.72rem', fontWeight: 400, color: '#64748B' }}>
                                    ({emp.code || 'NV'})
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {emp.position?.title || 'Chưa gán chức vụ'}
                                  {emp.department?.name ? ` • ${emp.department.name}` : ''}
                                </div>
                              </div>
                            </div>

                            <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                              {isSelected ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  fontSize: '0.72rem', fontWeight: 600, color: '#16A34A',
                                  backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px'
                                }}>
                                  <Check size={12} /> Đã chọn
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  fontSize: '0.72rem', fontWeight: 500, color: '#2563EB',
                                  backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px'
                                }}>
                                  <Plus size={12} /> Chọn
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '1rem 1.75rem', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedInterviewers.length > 0 ? (
                    <span>📋 <strong>Hội đồng:</strong> {scheduleForm.interviewerId}</span>
                  ) : (
                    <span style={{ color: '#DC2626' }}>* Chưa chọn người phỏng vấn</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-outline">
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={(interviewingCandidates.length === 0 && modalMode === 'add') || selectedInterviewers.length === 0}
                  >
                    {modalMode === 'add' ? 'Lên lịch ngay' : 'Lưu cập nhật'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Chấm điểm & Đánh giá ứng viên */}
      {showFeedbackModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '480px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  Đánh giá Kết quả Phỏng vấn
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ghi nhận điểm chuyên môn và nhận xét của Hội đồng
                </span>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', margin: 0 }}>
                      Điểm đánh giá chuyên môn
                    </label>
                    <span style={{
                      fontSize: '1.15rem', fontWeight: 800, color: '#D97706',
                      backgroundColor: '#FEF3C7', padding: '2px 10px', borderRadius: '6px'
                    }}>
                      {feedbackForm.score}/10
                    </span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    className="w-full accent-[var(--warning)]" 
                    value={feedbackForm.score} 
                    onChange={e => setFeedbackForm({...feedbackForm, score: e.target.value})} 
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>1 (Yếu)</span>
                    <span>5 (Trung bình)</span>
                    <span>8 (Tốt)</span>
                    <span>10 (Xuất sắc)</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                    Nhận xét chi tiết của Người phỏng vấn <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea 
                    required 
                    className="form-input" 
                    style={{ minHeight: '110px', resize: 'vertical' }} 
                    placeholder="Điểm mạnh kiến thức, tư duy giải quyết vấn đề, độ phù hợp văn hóa doanh nghiệp..."
                    value={feedbackForm.comments}
                    onChange={e => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                  />
                </div>
              </div>

              <div style={{
                padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="btn btn-outline">
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
                >
                  Lưu Đánh Giá
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
