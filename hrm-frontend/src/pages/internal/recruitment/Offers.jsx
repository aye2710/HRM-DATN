import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  X,
  Search,
  FileText,
  UserCheck,
  Send,
  Calendar,
  CreditCard,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  CheckCheck,
  Check,
  XCircle,
  Building,
  User,
  Users,
  Award,
  Filter,
  ExternalLink,
  Trash2,
  ArrowRight,
  Edit3,
  RotateCcw,
  Mail,
  FileCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// Avatar styling helpers (Bảng màu pastel hiện đại & monogram chữ cái)
const getAvatarStyle = (name) => {
  const styles = [
    { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }, // Blue
    { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // Purple
    { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Emerald
    { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' }, // Orange
    { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' }, // Pink
    { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' }, // Teal
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return styles[Math.abs(hash) % styles.length];
};

const getInitials = (name) => {
  if (!name) return 'UV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Offers = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Pagination state (Chuẩn theo Positions.jsx & Interviews.jsx)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // 1. Modal Xem Hồ sơ Khai báo của Ứng viên (Pre-Onboarding Details)
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);

  // 2. Modal Gửi / Cập nhật Offer
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerForm, setOfferForm] = useState({
    candidateId: '',
    baseSalary: '15000000',
    probationRate: '85',
    startDate: '',
    contractType: 'PROBATION',
    notes: ''
  });

  const fetchOffers = () => {
    setLoading(true);
    axios
      .get('http://localhost:5000/api/offers')
      .then((res) => setCandidates(res.data || []))
      .catch((err) => {
        console.error(err);
        toast.error('Lỗi khi tải danh sách Offer');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Tiếp nhận nhân sự khi ứng viên đến nhận việc
  const handleOpenOnboard = async (candidate) => {
    if (candidate.status === 'HIRED') {
      toast.error('Ứng viên này đã được tiếp nhận thành nhân viên chính thức trước đó!');
      return;
    }

    const isIntern =
      candidate.jobPosting?.position?.level?.toLowerCase() === 'intern' ||
      candidate.offer?.contractType === 'INTERNSHIP';
    const contractLabel = isIntern ? 'Hợp đồng Thực tập sinh' : 'Hợp đồng Thử việc (85%)';

    const result = await Swal.fire({
      title: 'Tiếp nhận Nhân sự Mới',
      html: `
        <div style="text-align: left; font-size: 0.9rem; line-height: 1.6; color: #334155;">
          <p style="margin-bottom: 8px;">Xác nhận tiếp nhận ứng viên <strong>${candidate.name}</strong> vào làm việc tại công ty?</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 12px 0;">
            <div>• Vị trí: <strong>${candidate.jobPosting?.title || 'Chưa rõ'}</strong></div>
            <div>• Phòng ban: <strong>${candidate.jobPosting?.department?.name || 'Chưa rõ'}</strong></div>
            <div>• Lương thỏa thuận: <strong>${candidate.offer ? Number(candidate.offer.baseSalary).toLocaleString('vi-VN') + ' ₫' : 'Chưa có'}</strong></div>
            <div>• Loại hợp đồng: <strong>${contractLabel}</strong></div>
          </div>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0;">
            Hệ thống sẽ tự động cấp Mã nhân sự mới, đồng bộ hồ sơ nhân thân đã khai và chuyển ngay vào phân hệ <strong>Hội nhập (Onboarding)</strong>.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Tiếp nhận & Bắt đầu Onboarding',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#0F172A',
      cancelButtonColor: '#94A3B8'
    });

    if (result.isConfirmed) {
      const loadingToast = toast.loading('Đang khởi tạo hồ sơ nhân sự...');
      try {
        await axios.post('http://localhost:5000/api/offers/accept', {
          candidateId: candidate.id
        });
        toast.dismiss(loadingToast);
        toast.success(`Tiếp nhận nhân sự ${candidate.name} thành công! Đã chuyển sang phân hệ Hội nhập.`);
        fetchOffers();
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi tiếp nhận nhân sự.');
      }
    }
  };

  // Mở modal xem hồ sơ ứng viên tự khai
  const handleViewProfile = (candidate) => {
    setViewingProfile(candidate);
    setShowViewProfileModal(true);
  };

  // Mở modal tạo / gửi Offer
  const handleOpenSendOffer = (candidate) => {
    setSelectedCandidate(candidate);
    setOfferForm({
      candidateId: candidate.id,
      baseSalary: candidate.offer ? String(candidate.offer.baseSalary) : '15000000',
      probationRate: candidate.offer ? String(candidate.offer.probationRate) : '85',
      startDate: candidate.offer?.startDate
        ? new Date(candidate.offer.startDate).toISOString().split('T')[0]
        : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      contractType: candidate.offer?.contractType || 'PROBATION',
      notes: candidate.offer?.notes || 'Chào mừng bạn gia nhập đội ngũ Công ty!'
    });
    setShowSendOfferModal(true);
  };

  // Submit gửi Offer
  const handleSendOfferSubmit = (e) => {
    e.preventDefault();
    if (!offerForm.baseSalary || !offerForm.startDate) {
      return toast.error('Vui lòng điền Lương thỏa thuận và Ngày nhận việc.');
    }

    setIsSubmitting(true);
    axios
      .post('http://localhost:5000/api/offers/send-offer', offerForm)
      .then(() => {
        toast.success('Đã gửi Thư mời nhận việc (Offer) tới Cổng ứng viên!');
        setShowSendOfferModal(false);
        fetchOffers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Lỗi khi gửi Offer.');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleReject = async (candidateId) => {
    const result = await Swal.fire({
      title: 'Hủy Offer',
      text: 'Bạn có chắc chắn muốn Hủy Offer của ứng viên này? Trạng thái sẽ chuyển về REJECTED.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Không',
      confirmButtonColor: '#EF4444'
    });
    if (!result.isConfirmed) return;

    axios
      .post(`http://localhost:5000/api/offers/${candidateId}/reject`)
      .then(() => {
        toast.success('Đã hủy Offer.');
        fetchOffers();
      })
      .catch(() => toast.error('Lỗi khi từ chối Offer'));
  };

  // --- KPIs Thống kê ---
  const stats = useMemo(() => {
    const total = candidates.length;
    const pending = candidates.filter((c) => c.offer?.status === 'PENDING').length;
    const accepted = candidates.filter((c) => c.offer?.status === 'ACCEPTED').length;
    const rejected = candidates.filter((c) => c.offer?.status === 'REJECTED').length;
    return { total, pending, accepted, rejected };
  }, [candidates]);

  // Danh sách duy nhất cho bộ lọc
  const uniqueJobs = useMemo(() => {
    const jobs = new Set(candidates.map((c) => c.jobPosting?.title).filter(Boolean));
    return Array.from(jobs);
  }, [candidates]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(candidates.map((c) => c.jobPosting?.department?.name).filter(Boolean));
    return Array.from(depts);
  }, [candidates]);

  // Lọc dữ liệu
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.jobPosting?.title && c.jobPosting.title.toLowerCase().includes(q));

      const matchStatus =
        !filterStatus ||
        (filterStatus === 'NO_OFFER' && !c.offer) ||
        (filterStatus === 'HIRED' && c.status === 'HIRED') ||
        (filterStatus === 'ACCEPTED' && c.offer?.status === 'ACCEPTED' && c.status !== 'HIRED') ||
        (filterStatus !== 'HIRED' && filterStatus !== 'ACCEPTED' && c.offer && c.offer.status === filterStatus);

      const matchJob = !filterJob || c.jobPosting?.title === filterJob;

      const matchDept = !filterDepartment || c.jobPosting?.department?.name === filterDepartment;

      return matchSearch && matchStatus && matchJob && matchDept;
    });
  }, [candidates, searchQuery, filterStatus, filterJob, filterDepartment]);

  // Phân trang
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage, itemsPerPage]);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Trang Chuẩn Doanh Nghiệp */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              backgroundColor: '#EEF2FF', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.1)'
            }}>
              <Briefcase size={20} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
              Quản lý Thỏa thuận Offer
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Theo dõi thỏa thuận tuyển dụng hai chiều, thời hạn phản hồi 24h và bàn giao ứng viên sang phân hệ Hội nhập.
          </p>
        </div>
      </div>

      {/* 2. Toolbar & Bộ lọc Tìm kiếm (Flex gọn gàng, không bị kéo dãn) */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0.75rem 1.25rem',
        border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap',
        gap: '0.75rem', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        {/* Ô 1: Tìm Kiếm */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email, SĐT..." 
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={searchQuery} 
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
          />
        </div>

        {/* Ô 2: Lọc Trạng thái Offer */}
        <div style={{ width: '210px', maxWidth: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả trạng thái Offer</option>
            <option value="ACCEPTED">Đã đồng ý Offer</option>
            <option value="HIRED">Đã tiếp nhận thành Nhân viên</option>
            <option value="PENDING">Chờ phản hồi (24h)</option>
            <option value="REJECTED">Từ chối / Quá hạn 24h</option>
            <option value="NO_OFFER">Chưa gửi Offer</option>
          </select>
        </div>

        {/* Ô 3: Lọc theo Vị trí tuyển dụng */}
        <div style={{ width: '220px', maxWidth: '100%' }}>
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

        {/* Ô 4: Lọc theo Phòng ban */}
        <div style={{ width: '200px', maxWidth: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterDepartment} 
            onChange={e => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả phòng ban</option>
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Nút xóa bộ lọc */}
        {(searchQuery || filterStatus || filterJob || filterDepartment) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('');
              setFilterJob('');
              setFilterDepartment('');
              setCurrentPage(1);
            }}
            className="btn btn-outline"
            style={{ height: 38, fontSize: '0.8rem', padding: '0 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* 4. Bảng Dữ Liệu Offer Chuẩn SaaS */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', height: 44 }}>
                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '26%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ứng viên
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '21%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Vị trí tuyển dụng
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '21%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gói thỏa thuận Offer
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '18%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tình trạng Offer
                </th>
                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '14%', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Clock size={24} className="animate-spin text-primary" />
                      <span>Đang tải danh sách Offer...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={32} color="#94A3B8" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>Không tìm thấy ứng viên nào</span>
                      <span style={{ fontSize: '0.8rem' }}>Thử thay đổi bộ lọc hoặc thêm ứng viên mới vào giai đoạn Offer</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((c, idx) => {
                  const offer = c.offer;
                  const po = c.preOnboarding;
                  const isHired = c.status === 'HIRED';
                  const isAccepted = offer?.status === 'ACCEPTED';
                  const isRejected = offer?.status === 'REJECTED';
                  const isPending = offer?.status === 'PENDING';

                  const expiresAt = offer?.expiresAt ? new Date(offer.expiresAt) : null;
                  const remainingHours = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (3600 * 1000))) : null;
                  const avatar = getAvatarStyle(c.name);
                  const initials = getInitials(c.name);

                  return (
                    <tr 
                      key={c.id} 
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                    >
                      {/* Cột 1: Ứng viên */}
                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '10px',
                            backgroundColor: avatar.bg, color: avatar.text,
                            border: `1px solid ${avatar.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}>
                            {initials}
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {c.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                              <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={c.email}>
                                {c.email}
                              </span>
                              {c.phone && (
                                <>
                                  <span style={{ color: '#CBD5E1' }}>•</span>
                                  <span style={{ whiteSpace: 'nowrap' }}>{c.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Vị trí tuyển dụng */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={c.jobPosting?.title}>
                            {c.jobPosting?.title || 'Chưa gán vị trí'}
                          </div>
                          <div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.73rem', fontWeight: 500, color: '#475569'
                            }}>
                              <Building size={11} color="#64748B" />
                              <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '170px' }}>
                                {c.jobPosting?.department?.name || 'Toàn công ty'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Gói Thỏa thuận Offer */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        {offer ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                {Number(offer.baseSalary).toLocaleString('vi-VN')}
                              </span>
                              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#2563EB' }}>₫/tháng</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748B' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Calendar size={11} color="#94A3B8" />
                                <span>{new Date(offer.startDate).toLocaleDateString('vi-VN')}</span>
                              </span>
                              <span style={{ color: '#CBD5E1' }}>•</span>
                              <span style={{ backgroundColor: '#F8FAFC', padding: '1px 5px', borderRadius: '3px', border: '1px solid #E2E8F0', fontWeight: 500 }}>
                                Thử việc {offer.probationRate || 85}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                            Chưa tạo Offer
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Tình trạng Offer */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        {isHired ? (
                          <div>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              backgroundColor: '#ECFDF5', color: '#047857',
                              padding: '3px 9px', borderRadius: '12px',
                              fontSize: '0.74rem', fontWeight: 700, border: '1px solid #A7F3D0'
                            }}>
                              <CheckCircle2 size={13} />
                              <span>Đã tiếp nhận</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '3px', fontWeight: 500, paddingLeft: '2px' }}>
                              Đã là Nhân viên
                            </div>
                          </div>
                        ) : isAccepted ? (
                          <div>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              backgroundColor: '#EFF6FF', color: '#1D4ED8',
                              padding: '3px 9px', borderRadius: '12px',
                              fontSize: '0.74rem', fontWeight: 700, border: '1px solid #BFDBFE'
                            }}>
                              <CheckCheck size={13} />
                              <span>Đã đồng ý Offer</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', marginTop: '3px', paddingLeft: '2px' }}>
                              {po ? (
                                <span style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                                  <FileCheck size={11} /> Có hồ sơ Online
                                </span>
                              ) : (
                                <span style={{ color: '#64748B' }}>Chờ hồ sơ Online</span>
                              )}
                            </div>
                          </div>
                        ) : isPending ? (
                          <div>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              backgroundColor: '#FFFBEB', color: '#B45309',
                              padding: '3px 9px', borderRadius: '12px',
                              fontSize: '0.74rem', fontWeight: 700, border: '1px solid #FDE68A'
                            }}>
                              <Clock size={13} />
                              <span>Chờ phản hồi</span>
                            </div>
                            <div style={{
                              fontSize: '0.72rem', marginTop: '3px', paddingLeft: '2px',
                              color: remainingHours !== null && remainingHours <= 6 ? '#DC2626' : '#92400E',
                              fontWeight: 600
                            }}>
                              {remainingHours !== null ? `Còn ${remainingHours}h phản hồi` : 'Trong hạn 24h'}
                            </div>
                          </div>
                        ) : isRejected ? (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            backgroundColor: '#FEF2F2', color: '#991B1B',
                            padding: '3px 9px', borderRadius: '12px',
                            fontSize: '0.74rem', fontWeight: 600, border: '1px solid #FECACA'
                          }}>
                            <XCircle size={13} />
                            <span>{offer?.declineReason?.includes('24') ? 'Quá hạn 24h' : 'Từ chối Offer'}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            Chờ gửi thư mời
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                          {isHired ? (
                            po ? (
                              <button
                                onClick={() => handleViewProfile(c)}
                                className="btn btn-outline"
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderColor: '#CBD5E1', color: '#334155' }}
                                title="Xem hồ sơ khai báo sơ bộ"
                              >
                                <FileText size={14} />
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={13} /> Hoàn tất
                              </span>
                            )
                          ) : isAccepted ? (
                            <button
                              onClick={() => navigate('/internal/onboarding/pre-onboarding')}
                              className="btn btn-primary"
                              style={{
                                height: 28, width: 28, padding: 0,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
                              }}
                              title="Bàn giao sang phân hệ Hội nhập (Pre-onboarding)"
                            >
                              <ArrowRight size={14} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenSendOffer(c)}
                                className="btn btn-outline"
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title={offer ? 'Chỉnh sửa thỏa thuận Offer' : 'Tạo và gửi Thư mời nhận việc'}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(c.id)}
                                title="Từ chối / Hủy Offer"
                                style={{
                                  height: 28, width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: '#FFFFFF', color: '#94A3B8', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                              >
                                <X size={14} />
                              </button>
                            </>
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

        {/* 5. Thanh Phân Trang Chuẩn Positions.jsx */}
        {filteredCandidates.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#FAFAFA',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Hiển thị <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredCandidates.length)}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredCandidates.length)}</strong> trong tổng số <strong>{filteredCandidates.length}</strong> ứng viên
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Hiển thị:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="form-input"
                  style={{ height: '30px', padding: '0 0.5rem', fontSize: '0.78rem', backgroundColor: '#FFFFFF', width: 'auto' }}
                >
                  <option value={5}>5 dòng</option>
                  <option value={8}>8 dòng</option>
                  <option value={15}>15 dòng</option>
                  <option value={25}>25 dòng</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button 
                className="btn btn-outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  height: 32, padding: '0 12px', fontSize: '0.8rem',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage <= 1 ? 0.5 : 1
                }}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  style={{
                    height: 32, minWidth: 32, padding: '0 8px',
                    fontSize: '0.8rem', fontWeight: currentPage === page ? 700 : 500,
                    backgroundColor: currentPage === page ? '#0F172A' : '#FFFFFF',
                    borderColor: currentPage === page ? '#0F172A' : '#E2E8F0',
                    color: currentPage === page ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button 
                className="btn btn-outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  height: 32, padding: '0 12px', fontSize: '0.8rem',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= totalPages ? 0.5 : 1
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Xem Hồ sơ tự khai Pre-Onboarding */}
      {showViewProfileModal && viewingProfile && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowViewProfileModal(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '85vh',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Hồ sơ Khai báo Onboarding của Ứng viên
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Ứng viên: <strong>{viewingProfile.name}</strong> • Email: {viewingProfile.email}
                </p>
              </div>
              <button onClick={() => setShowViewProfileModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Nhóm 1: Nhân thân */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', backgroundColor: '#FAFAFA' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. Thông tin cá nhân & Giấy tờ
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Số CCCD / CMND:</span> <strong>{viewingProfile.preOnboarding?.cccd || '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Ngày sinh:</span> <strong>{viewingProfile.preOnboarding?.dateOfBirth ? new Date(viewingProfile.preOnboarding.dateOfBirth).toLocaleDateString('vi-VN') : '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Giới tính:</span> <strong>{viewingProfile.preOnboarding?.gender === 'MALE' ? 'Nam' : viewingProfile.preOnboarding?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Tình trạng hôn nhân:</span> <strong>{viewingProfile.preOnboarding?.maritalStatus || 'Độc thân'}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Địa chỉ thường trú:</span> <strong>{viewingProfile.preOnboarding?.address || '--'}</strong></div>
                </div>
              </div>

              {/* Nhóm 2: Ngân hàng & Thuế */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', backgroundColor: '#FAFAFA' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Tài khoản nhận lương & Thuế
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Ngân hàng:</span> <strong>{viewingProfile.preOnboarding?.bankName || '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Số tài khoản:</span> <strong>{viewingProfile.preOnboarding?.bankAccount || '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Mã số thuế cá nhân:</span> <strong>{viewingProfile.preOnboarding?.taxCode || '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Mã số BHXH:</span> <strong>{viewingProfile.preOnboarding?.socialInsurance || '--'}</strong></div>
                </div>
              </div>

              {/* Nhóm 3: Khẩn cấp */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', backgroundColor: '#FAFAFA' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Người liên hệ khẩn cấp
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Họ tên:</span> <strong>{viewingProfile.preOnboarding?.emergencyContactName || '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Mối quan hệ:</span> <strong>{viewingProfile.preOnboarding?.emergencyContactRelation || '--'}</strong></div>
                  <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Số điện thoại:</span> <strong>{viewingProfile.preOnboarding?.emergencyContactPhone || '--'}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowViewProfileModal(false)} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>Đóng</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Tạo / Gửi Offer */}
      {showSendOfferModal && selectedCandidate && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSendOfferModal(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Gửi Thư mời nhận việc (Offer)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Ứng viên: <strong>{selectedCandidate.name}</strong> • {selectedCandidate.jobPosting?.title}
                </p>
              </div>
              <button onClick={() => setShowSendOfferModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendOfferSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <Clock size={16} color="#475569" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Quy định phản hồi 24h:</strong> Hệ thống giới hạn thời gian phản hồi Offer trong <strong>24 giờ</strong> kể từ thời điểm gửi. Sau 24h nếu ứng viên không phản hồi, thư mời sẽ tự động chuyển sang trạng thái hết hạn.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Lương thỏa thuận (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100000"
                      className="form-input"
                      value={offerForm.baseSalary}
                      onChange={(e) => setOfferForm({ ...offerForm, baseSalary: e.target.value })}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                      {Number(offerForm.baseSalary || 0).toLocaleString('vi-VN')} ₫/tháng
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tỷ lệ thử việc (%)</label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="100"
                      className="form-input"
                      value={offerForm.probationRate}
                      onChange={(e) => setOfferForm({ ...offerForm, probationRate: e.target.value })}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                      Mặc định 85% theo BLLĐ
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ngày dự kiến nhận việc *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Loại Hợp đồng</label>
                    <select
                      className="form-input"
                      value={offerForm.contractType}
                      onChange={(e) => setOfferForm({ ...offerForm, contractType: e.target.value })}
                    >
                      <option value="PROBATION">Thử việc (Probation)</option>
                      <option value="INTERNSHIP">Thực tập sinh</option>
                      <option value="OFFICIAL_1Y">Chính thức 1 năm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Lời nhắn từ Bộ phận Tuyển dụng</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    style={{ resize: 'vertical' }}
                    value={offerForm.notes}
                    onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSendOfferModal(false)} className="btn btn-outline" disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 600, backgroundColor: '#0F172A', borderColor: '#0F172A' }} disabled={isSubmitting}>
                  <Send size={14} /> {isSubmitting ? 'Đang gửi...' : 'Gửi Offer tới Ứng viên'}
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
