import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  MapPin, Briefcase, Clock, ChevronRight, CheckCircle2, Rocket, Heart, 
  Coffee, UserCircle, Users, Quote, CheckSquare, Search, FileText, X, 
  Sparkles, LogOut, ShieldCheck, Shield, ChevronDown, Award, TrendingUp, BookOpen, 
  Upload, Link2, Copy, HelpCircle, Building2, Send, ExternalLink, Calendar,
  DollarSign, Check
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CandidateAuthModal } from './CandidateAuthModal';
import { CandidateApplicationsModal } from './CandidateApplicationsModal';
import { JobDetailModal } from './JobDetailModal';

export const CandidateLandingPage = () => {
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Candidate Auth State
  const [candidateUser, setCandidateUser] = useState(() => {
    try {
      const stored = localStorage.getItem('candidateUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);

  // Job Detail Modal State
  const [selectedDetailJob, setSelectedDetailJob] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Application Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [submittedCandidateCode, setSubmittedCandidateCode] = useState('');

  // CV Upload Type: 'file' | 'link'
  const [cvInputType, setCvInputType] = useState('file');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  // Tracking Modal State
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackEmail, setTrackEmail] = useState('');
  const [trackSecurityCode, setTrackSecurityCode] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // Talent Pool Modal State
  const [showTalentPoolModal, setShowTalentPoolModal] = useState(false);
  const [talentPoolForm, setTalentPoolForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'Phần mềm (Software Engineering)',
    cvUrl: ''
  });
  const [isSubmittingTalentPool, setIsSubmittingTalentPool] = useState(false);

  // Filter & Search State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Form Data for Applying
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cvUrl: ''
  });

  const handleCandidateLogout = () => {
    localStorage.removeItem('candidateToken');
    localStorage.removeItem('candidateUser');
    setCandidateUser(null);
    toast.success('Đã đăng xuất tài khoản ứng viên.');
  };

  useEffect(() => {
    document.title = "Tuyển dụng & Sự nghiệp | Công ty TNHH LLA";

    // Mở modal đơn ứng tuyển nếu vừa đăng nhập xong chuyển hướng về
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'apps') {
      const stored = localStorage.getItem('candidateUser');
      if (stored) {
        setShowAppsModal(true);
      }
    }

    axios.get('http://localhost:5000/api/job-postings')
      .then(res => {
        const publishedJobs = res.data.filter(job => job.status === 'PUBLISHED');
        setJobPostings(publishedJobs);
      })
      .catch(err => console.error("Lỗi lấy danh sách job", err))
      .finally(() => setLoading(false));

    return () => { document.title = "HRM Pro"; };
  }, []);

  // Filtered Jobs Memo
  const filteredJobs = useMemo(() => {
    return jobPostings.filter(job => {
      // Keyword match
      const titleMatch = job.title?.toLowerCase().includes(searchKeyword.toLowerCase().trim());
      const descMatch = job.description?.toLowerCase().includes(searchKeyword.toLowerCase().trim());
      const deptMatch = job.department?.name?.toLowerCase().includes(searchKeyword.toLowerCase().trim());
      const matchesKeyword = !searchKeyword.trim() || titleMatch || descMatch || deptMatch;

      // Department filter
      const matchesDept = filterDept === 'ALL' || job.department?.name === filterDept;

      // Level filter
      const matchesLevel = filterLevel === 'ALL' || (job.level && job.level.toLowerCase() === filterLevel.toLowerCase());

      // Type filter
      const matchesType = filterType === 'ALL' || (job.jobType && job.jobType.toLowerCase() === filterType.toLowerCase());

      return matchesKeyword && matchesDept && matchesLevel && matchesType;
    });
  }, [jobPostings, searchKeyword, filterDept, filterLevel, filterType]);

  // Unique Departments from list
  const departmentsList = useMemo(() => {
    const set = new Set();
    jobPostings.forEach(j => {
      if (j.department?.name) set.add(j.department.name);
    });
    return Array.from(set);
  }, [jobPostings]);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setFormData({
      name: candidateUser ? candidateUser.name : '',
      email: candidateUser ? candidateUser.email : '',
      phone: candidateUser?.phone || '',
      cvUrl: ''
    });
    setUploadedFileName('');
    setCvInputType('file');
    setConsentChecked(false);
    setApplySuccess(false);
    setSubmittedCandidateCode('');
    setShowApplyModal(true);
  };

  const handleOpenDetail = (job) => {
    setSelectedDetailJob(job);
    setShowDetailModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Dung lượng file tối đa là 10MB");
        return;
      }
      setUploadedFileName(file.name);
      // Simulate file upload or convert to data URL/mock path
      const fakeUploadedUrl = `https://careers.lla.vn/uploads/cv/${Date.now()}_${encodeURIComponent(file.name)}`;
      setFormData(prev => ({ ...prev, cvUrl: fakeUploadedUrl }));
      toast.success(`Đã đính kèm file: ${file.name}`);
    }
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.cvUrl) {
      toast.error("Vui lòng điền đầy đủ Họ tên, Email và đính kèm CV!");
      return;
    }

    if (!consentChecked) {
      toast.error("Vui lòng đồng ý với điều khoản xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP");
      return;
    }

    setIsSubmitting(true);

    axios.post('http://localhost:5000/api/candidates', {
      ...formData,
      jobPostingId: selectedJob.id,
      status: 'SOURCED'
    })
    .then(res => {
      const generatedCode = `LLA-APP-${res.data.id ? res.data.id.substring(0, 6).toUpperCase() : Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedCandidateCode(generatedCode);
      setApplySuccess(true);
      toast.success("Nộp hồ sơ thành công!");
    })
    .catch(err => {
      toast.error("Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại!");
      console.error(err);
    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackEmail.trim()) {
      toast.error("Vui lòng nhập email ứng tuyển");
      return;
    }

    setIsTracking(true);
    const query = new URLSearchParams({ email: trackEmail.trim() });
    if (trackSecurityCode.trim()) {
      query.append('code', trackSecurityCode.trim());
    }

    axios.get(`http://localhost:5000/api/candidates/track?${query.toString()}`)
      .then(res => {
        setTrackResults(res.data);
      })
      .catch(err => {
        toast.error("Có lỗi xảy ra khi tra cứu hồ sơ.");
        console.error(err);
      })
      .finally(() => {
        setIsTracking(false);
      });
  };

  const handleTalentPoolSubmit = (e) => {
    e.preventDefault();
    if (!talentPoolForm.name || !talentPoolForm.email) {
      toast.error("Vui lòng điền đủ họ tên và email");
      return;
    }
    setIsSubmittingTalentPool(true);
    setTimeout(() => {
      setIsSubmittingTalentPool(false);
      setShowTalentPoolModal(false);
      toast.success("Chúc mừng! Bạn đã gia nhập Mạng lưới Tài năng LLA thành công. HR sẽ liên hệ khi có vị trí phù hợp.");
      setTalentPoolForm({ name: '', email: '', phone: '', specialty: 'Phần mềm (Software Engineering)', cvUrl: '' });
    }, 800);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPLIED':
      case 'SOURCED':
        return { text: 'Đang sàng lọc hồ sơ', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', step: '1/3' };
      case 'SCREENING':
        return { text: 'Đã qua sơ tuyển', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.1)', step: '1/3' };
      case 'INTERVIEWING':
        return { text: 'Đang xếp lịch phỏng vấn', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', step: '2/3' };
      case 'OFFERED':
        return { text: 'Đã nhận Thư mời (Offer)', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', step: '3/3' };
      case 'HIRED':
        return { text: 'Tuyển dụng thành công', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.12)', step: 'Hoàn tất' };
      case 'REJECTED':
        return { text: 'Hồ sơ chưa phù hợp', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', step: '--' };
      default:
        return { text: 'Đang xử lý', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', step: '--' };
    }
  };

  const faqList = [
    {
      q: "Sau khi nộp CV, bao lâu tôi sẽ nhận được phản hồi từ HR?",
      a: "Bộ phận Tuyển dụng LLA cam kết phản hồi tất cả ứng viên trong vòng tối đa 48 giờ làm việc kể từ lúc tiếp nhận hồ sơ qua email hoặc điện thoại."
    },
    {
      q: "Công ty có hỗ trợ chế độ làm việc từ xa (Remote / Hybrid) không?",
      a: "Có! Tùy theo tính chất vị trí và cấp bậc, LLA áp dụng chính sách Hybrid linh hoạt (lên văn phòng 2 - 3 ngày/tuần) và ân hạn đi muộn 15 phút mỗi ngày nhằm tạo điều kiện tốt nhất cho nhân sự cân bằng cuộc sống."
    },
    {
      q: "Chế độ thử việc và bảo hiểm tại LLA được tính như thế nào?",
      a: "Thời gian thử việc tiêu chuẩn là 2 tháng nhận 85% - 100% lương theo thỏa thuận. Khi ký hợp đồng chính thức, nhân sự được đóng Full 100% Bảo hiểm xã hội trên lương thực tế và hưởng gói Bảo hiểm sức khỏe tư nhân VIP riêng biệt."
    },
    {
      q: "Nếu vị trí hiện tại chưa phù hợp thì tôi có thể gửi hồ sơ lưu trữ không?",
      a: "Hoàn toàn được! Bạn có thể sử dụng chức năng 'Gia nhập Mạng lưới Tài năng (Talent Pool)'. Hồ sơ của bạn sẽ được lưu trữ an toàn và ưu tiên liên hệ phỏng vấn đầu tiên ngay khi có vị trí mới mở ra."
    },
    {
      q: "Dữ liệu cá nhân của tôi được bảo mật như thế nào theo Nghị định 13/2023/NĐ-CP?",
      a: "LLA cam kết bảo vệ dữ liệu cá nhân theo đúng Nghị định 13/2023/NĐ-CP. Thông tin hồ sơ chỉ được sử dụng cho mục đích tuyển dụng nội bộ, không chia sẻ cho bên thứ ba. Các thông tin nhạy cảm (CCCD, STK, MST) chỉ được yêu cầu khi bạn đã chính thức đồng ý Thư mời nhận việc (Offer)."
    }
  ];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#0F172A', overflowX: 'hidden' }}>
      
      {/* 1. Top Navbar (Header tinh gọn, ĐÃ ẨN NÚT Quản trị nội bộ) */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0.85rem 3.5rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(16px)', position: 'fixed', top: 0, width: '100%', zIndex: 50,
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div style={{ 
            width: 36, height: 36, 
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', 
            borderRadius: '0.5rem', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'white', fontWeight: 800, fontSize: '1.2rem', 
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' 
          }}>
            L
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.1 }}>
              LLA Careers
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Cổng Tuyển Dụng Doanh Nghiệp</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="#jobs" style={{ color: '#0F172A', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
            Vị trí tuyển dụng
          </a>
          <a href="#culture" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
            Văn hóa & Đãi ngộ
          </a>
          <a href="#growth" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
            Cơ hội phát triển
          </a>
          <a href="#process" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
            Quy trình SLA
          </a>
          <a href="#faq" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
            Hỏi đáp FAQ
          </a>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => { setTrackResults(null); setTrackEmail(''); setTrackSecurityCode(''); setShowTrackModal(true); }} 
            className="btn btn-outline"
            style={{
              height: '38px',
              borderRadius: '0.5rem',
              padding: '0 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderColor: '#CBD5E1',
              color: '#334155'
            }}
          >
            <Search size={15} /> Tra cứu hồ sơ
          </button>

          {candidateUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button 
                onClick={() => setShowAppsModal(true)} 
                className="btn btn-primary"
                style={{
                  height: '38px',
                  borderRadius: '0.5rem',
                  padding: '0 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Sparkles size={14} /> Đơn của tôi & Offer
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '3px 10px 3px 5px',
                  borderRadius: '0.5rem',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {candidateUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {candidateUser.name}
                </span>
                <button
                  onClick={handleCandidateLogout}
                  title="Đăng xuất"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/candidate/login')}
              className="btn btn-primary" 
              style={{
                height: '38px',
                borderRadius: '0.5rem',
                padding: '0 1.25rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                cursor: 'pointer'
              }} 
            >
              <UserCircle size={16} /> Đăng nhập Ứng viên
            </button>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <div style={{ 
        padding: '7.5rem 2rem 3.5rem 2rem', 
        textAlign: 'center', 
        position: 'relative', 
        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.07) 0%, rgba(248, 250, 252, 1) 100%)'
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.35rem 0.95rem', borderRadius: '9999px', 
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
            color: '#1D4ED8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.25rem' 
          }}>
            <Award size={16} /> Top 10 Môi Trường Công Nghệ Tốt Nhất Việt Nam 2026 (Anphabe & VCCI)
          </div>

          <h1 style={{ fontSize: '3.25rem', color: '#0F172A', marginBottom: '1.25rem', lineHeight: 1.18, fontWeight: 800, letterSpacing: '-0.025em' }}>
            Kiến tạo tương lai số cùng <br/>
            <span style={{ 
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              Công ty TNHH LLA
            </span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem', maxWidth: '680px', lineHeight: 1.65 }}>
            Gia nhập đội ngũ hơn 500 kỹ sư tinh hoa. Chúng tôi xây dựng những giải pháp công nghệ biểu tượng, 
            minh bạch chế độ đãi ngộ và trao quyền tối đa để bạn bứt phá giới hạn nghề nghiệp.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <a 
              href="#jobs" 
              className="btn btn-primary" 
              style={{ 
                padding: '0.75rem 2rem', fontSize: '0.95rem', height: '46px', 
                borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                textDecoration: 'none', fontWeight: 600, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)' 
              }}
            >
              <Search size={18} /> Khám phá {jobPostings.length} vị trí đang tuyển
            </a>
            <button 
              onClick={() => { setTrackResults(null); setTrackEmail(''); setTrackSecurityCode(''); setShowTrackModal(true); }}
              className="btn btn-outline" 
              style={{ 
                padding: '0.75rem 1.75rem', fontSize: '0.95rem', height: '46px', 
                borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#1E293B', fontWeight: 600
              }}
            >
              Tra cứu hồ sơ ứng tuyển
            </button>
          </div>

          {/* Key Stats Counter Bar (Con số ấn tượng) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1.5rem', 
            width: '100%', 
            maxWidth: '820px',
            backgroundColor: '#FFFFFF',
            padding: '1.5rem 2rem',
            borderRadius: '1rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563EB' }}>500+</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>Kỹ sư & Chuyên gia</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10B981' }}>98%</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>Tỷ lệ nhân sự hài lòng</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F59E0B' }}>12+</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>Năm kiến tạo giải pháp</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#6366F1' }}>100%</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>Đóng Full BHXH Gross</div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. VỊ TRÍ ĐANG TUYỂN DỤNG (ĐÃ ĐƯA LÊN CAO NGAY SAU HERO) */}
      <div id="jobs" style={{ padding: '4rem 2rem 5rem 2rem', maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CƠ HỘI NGHỀ NGHIỆP TẠI LLA
          </span>
          <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
            Vị trí đang mở tuyển dụng
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Tìm kiếm cơ hội phù hợp với năng lực và mục tiêu phát triển của bạn. Tất cả vị trí đều công khai mức lương và mô tả chi tiết.
          </p>
        </div>

        {/* Thanh Tìm Kiếm & Bộ Lọc Nâng Cao (Search & Multi-Filter Bar) */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          padding: '1.25rem', 
          borderRadius: '0.875rem', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
            
            {/* Keyword Search */}
            <div style={{ position: 'relative', gridColumn: 'span 2' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Tìm theo chức danh, từ khóa hoặc kỹ năng..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.6rem', height: '42px', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
              />
            </div>

            {/* Department Filter */}
            <div>
              <select 
                value={filterDept} 
                onChange={e => setFilterDept(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
              >
                <option value="ALL">Tất cả phòng ban</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <select 
                value={filterLevel} 
                onChange={e => setFilterLevel(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
              >
                <option value="ALL">Tất cả cấp bậc</option>
                <option value="Intern">Intern / Thực tập</option>
                <option value="Junior">Junior (1 - 2 năm)</option>
                <option value="Mid">Mid-Level (2 - 4 năm)</option>
                <option value="Senior">Senior (4+ năm)</option>
                <option value="Manager">Lead / Manager</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
              >
                <option value="ALL">Tất cả hình thức</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

          </div>

          {/* Results Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F1F5F9', fontSize: '0.8125rem' }}>
            <span style={{ color: '#475569' }}>
              Hiển thị <strong>{filteredJobs.length}</strong> / {jobPostings.length} vị trí tuyển dụng
            </span>
            {(searchKeyword || filterDept !== 'ALL' || filterLevel !== 'ALL' || filterType !== 'ALL') && (
              <button 
                onClick={() => { setSearchKeyword(''); setFilterDept('ALL'); setFilterLevel('ALL'); setFilterType('ALL'); }}
                style={{ border: 'none', background: 'transparent', color: '#2563EB', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Xóa tất cả bộ lọc ↺
              </button>
            )}
          </div>
        </div>

        {/* Job Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              <div className="animate-spin" style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', marginBottom: '0.75rem' }}></div>
              <div>Đang tải danh sách việc làm từ hệ thống...</div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
              <Briefcase size={44} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '0.5rem' }}>Không tìm thấy vị trí tuyển dụng phù hợp</h3>
              <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                Thử thay đổi từ khóa tìm kiếm hoặc tham gia ngay Mạng lưới Tài năng của LLA để nhận thông báo việc làm mới nhất.
              </p>
              <button 
                onClick={() => setShowTalentPoolModal(true)}
                className="btn btn-primary"
                style={{ borderRadius: '0.5rem', padding: '0.65rem 1.5rem', fontWeight: 600 }}
              >
                Gửi CV vào Talent Pool
              </button>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div 
                key={job.id} 
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '0.875rem', 
                  border: '1px solid #E2E8F0',
                  padding: '1.5rem 1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
                className="card-hover"
              >
                <div style={{ flex: 1 }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                      {job.department?.name || 'Kỹ thuật & Công nghệ'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#334155' }}>
                      {job.level || 'Mid'} Level
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                      {job.jobType || 'Full-time'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => handleOpenDetail(job)}
                    style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem 0', cursor: 'pointer' }}
                  >
                    {job.title}
                  </h3>

                  {/* Meta details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#64748B', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={15} /> Hà Nội / TP.HCM
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16A34A', fontWeight: 700 }}>
                      <DollarSign size={15} /> {job.salaryRange || 'Thương lượng hấp dẫn'}
                    </span>
                    {job.deadline && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={15} /> Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleOpenDetail(job)}
                    className="btn btn-outline"
                    style={{ padding: '0.65rem 1.15rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, borderColor: '#CBD5E1', color: '#334155' }}
                  >
                    Xem chi tiết JD
                  </button>
                  <button 
                    onClick={() => handleApplyClick(job)}
                    className="btn btn-primary"
                    style={{ padding: '0.65rem 1.35rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Nộp CV <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Talent Pool Banner */}
          <div style={{ 
            backgroundColor: '#EFF6FF', 
            borderRadius: '0.875rem', 
            border: '1px solid #BFDBFE', 
            padding: '2rem', 
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E3A8A', margin: '0 0 0.35rem 0' }}>
                Chưa tìm thấy vị trí phù hợp với năng lực của bạn?
              </h3>
              <p style={{ margin: 0, color: '#3B82F6', fontSize: '0.875rem' }}>
                Gia nhập Mạng lưới Tài năng LLA (Talent Pool) - Đón đầu cơ hội nghề nghiệp tương lai ngay khi có dự án mới.
              </p>
            </div>
            <button 
              onClick={() => setShowTalentPoolModal(true)}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}
            >
              Gửi CV vào Talent Pool ➔
            </button>
          </div>

        </div>

      </div>

      {/* 4. VĂN HÓA & GIÁ TRỊ CỐT LÕI (Core Values) */}
      <div id="culture" style={{ backgroundColor: '#FFFFFF', padding: '5rem 2rem', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              VĂN HÓA DOANH NGHIỆP
            </span>
            <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
              4 Giá trị cốt lõi định hình LLA
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
              Chúng tôi tin rằng văn hóa làm việc minh bạch và tôn trọng là nền tảng để mỗi cá nhân phát huy tối đa tiềm năng.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ padding: '1.75rem', borderRadius: '0.875rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '1.25rem' }}>
                <Rocket size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Khát vọng Dẫn đầu (Excellence)
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Đặt tiêu chuẩn cao trong từng dòng code và giải pháp. Không thỏa hiệp với chất lượng trung bình.
              </p>
            </div>

            <div style={{ padding: '1.75rem', borderRadius: '0.875rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '1.25rem' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Khách hàng là Trung tâm
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Mọi công nghệ và quy trình đều hướng đến việc giải quyết bài toán thực tế và mang lại giá trị đo lường được cho người dùng.
              </p>
            </div>

            <div style={{ padding: '1.75rem', borderRadius: '0.875rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', marginBottom: '1.25rem' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Đổi mới Không ngừng
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Khuyến khích thử nghiệm ý tưởng mới, sẵn sàng học hỏi từ thất bại và liên tục cập nhật công nghệ hiện đại.
              </p>
            </div>

            <div style={{ padding: '1.75rem', borderRadius: '0.875rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', marginBottom: '1.25rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Chính trực & Tử tế
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Minh bạch trong thông tin, công bằng trong đãi ngộ và đối xử với đồng nghiệp bằng sự thấu hiểu và tôn trọng.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* 5. ĐÃI NGỘ & PHÚC LỢI TOÀN DIỆN (Perks) */}
      <div id="perks" style={{ padding: '5rem 2rem', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CHẾ ĐỘ ĐÃI NGỘ TOÀN DIỆN
          </span>
          <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
            Phúc lợi xứng tầm tài năng
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Cam kết đãi ngộ cạnh tranh minh bạch, chăm sóc toàn diện từ sức khỏe đến lộ trình cuộc sống.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '1.25rem' }}>
              <DollarSign size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>Thu nhập & Thưởng</h3>
            <ul style={{ paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.8, margin: 0 }}>
              <li>Mức lương cạnh tranh theo chuẩn thị trường IT 2026.</li>
              <li>Lương tháng 13 đảm bảo + Thưởng hiệu suất dự án theo quý.</li>
              <li>Định kỳ đánh giá hiệu suất (Review lương) 2 lần/năm.</li>
              <li>Phụ cấp chuyên cần, dự án và làm việc ngoài giờ minh bạch.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '1.25rem' }}>
              <Heart size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>Sức khỏe & Bảo hiểm</h3>
            <ul style={{ paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.8, margin: 0 }}>
              <li>Đóng Full 100% Bảo hiểm xã hội trên mức lương thực nhận.</li>
              <li>Gói bảo hiểm sức khỏe khám chữa bệnh cao cấp (Healthcare).</li>
              <li>Khám sức khỏe tổng quát định kỳ hàng năm tại bệnh viện quốc tế.</li>
              <li>14 - 16 ngày phép năm hưởng nguyên lương.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', marginBottom: '1.25rem' }}>
              <Coffee size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>Tiện ích & Linh hoạt</h3>
            <ul style={{ paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.8, margin: 0 }}>
              <li>Cấp máy tính MacBook Pro M3 mới 100% cùng màn hình mở rộng.</li>
              <li>Chính sách Hybrid linh hoạt, ân hạn đi muộn 15 phút mỗi ngày.</li>
              <li>Khu vực Pantry trà, cafe, hoa quả và đồ ăn nhẹ miễn phí cả ngày.</li>
              <li>Du lịch công ty (Company Trip) hàng năm và teambuilding định kỳ.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* 6. CƠ HỘI PHÁT TRIỂN NGHỀ NGHIỆP (Growth) */}
      <div id="growth" style={{ backgroundColor: '#FFFFFF', padding: '5rem 2rem', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PHÁT TRIỂN NĂNG LỰC
            </span>
            <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
              Đầu tư không giới hạn vào sự phát triển của bạn
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
              Không chỉ là nơi làm việc, LLA là bệ phóng giúp bạn đạt tới những cột mốc chuyên gia hàng đầu.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            <div style={{ borderLeft: '4px solid #2563EB', paddingLeft: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563EB', fontWeight: 700, marginBottom: '0.5rem' }}>
                <TrendingUp size={20} /> Lộ trình thăng tiến kép (Dual Career Ladder)
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.65 }}>
                Bạn có thể chọn theo nhánh <strong>Chuyên gia Kỹ thuật (Specialist/Architect)</strong> hoặc <strong>Quản lý (Management Track)</strong>. Thu nhập và cơ hội thăng tiến của hai nhánh hoàn toàn tương đương.
              </p>
            </div>

            <div style={{ borderLeft: '4px solid #10B981', paddingLeft: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>
                <BookOpen size={20} /> Ngân sách học tập $1,500/năm/nhân sự
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.65 }}>
                Tài trợ 100% chi phí thi các chứng chỉ quốc tế uy tín (AWS Solutions Architect, CKA, PMP, Scrum Master) cùng tài khoản học tập Coursera/Udemy không giới hạn.
              </p>
            </div>

            <div style={{ borderLeft: '4px solid #F59E0B', paddingLeft: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D97706', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Users size={20} /> Mentorship 1-1 & Tech Talk định kỳ
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.65 }}>
                Mỗi nhân sự mới đều được đồng hành bởi một Mentor dày dạn kinh nghiệm. Diễn đàn Tech Talk hàng tuần mở ra cơ hội trao đổi kiến trúc phần mềm quy mô lớn.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* 7. KHÔNG GIAN LÀM VIỆC THỰC TẾ (Workspace Gallery) */}
      <div id="workspace" style={{ padding: '5rem 2rem', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            KHÔNG GIAN LÀM VIỆC
          </span>
          <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
            Văn phòng truyền cảm hứng sáng tạo
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Không gian mở, ánh sáng tự nhiên và trang thiết bị chuẩn quốc tế giúp bạn luôn tràn đầy năng lượng làm việc.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
            <img 
              src="/images/office1.jpg" 
              alt="Khu vực làm việc kỹ thuật LLA" 
              loading="lazy"
              style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} 
            />
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FFFFFF' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block' }}>Khu vực kỹ thuật & R&D</strong>
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Trang bị bàn nâng hạ tự động và màn hình đôi sắc nét</span>
            </div>
          </div>

          <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
            <img 
              src="/images/office2.jpg" 
              alt="Khu vực Pantry & Relax LLA" 
              loading="lazy"
              style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} 
            />
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FFFFFF' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block' }}>Pantry & Relax Lounge</strong>
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Khu vực thư giãn, máy pha cafe hạt tự động và đồ ăn nhẹ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. QUY TRÌNH TUYỂN DỤNG TINH GỌN & CAM KẾT SLA (Process) */}
      <div id="process" style={{ backgroundColor: '#FFFFFF', padding: '5rem 2rem', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CAM KẾT THỜI GIAN
            </span>
            <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
              Quy trình tuyển dụng chuẩn SLA
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
              Quy trình tinh gọn, nhanh chóng, cam kết phản hồi minh bạch tại từng vòng.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', position: 'relative' }}>
            
            <div style={{ backgroundColor: '#F8FAFC', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#EFF6FF', border: '2px solid #2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', margin: '0 auto 1.25rem auto' }}>
                <FileText size={26} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>BƯỚC 1</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0.25rem 0 0.5rem 0' }}>Nộp hồ sơ (Apply)</h3>
              <div style={{ display: 'inline-block', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                ⚡ Phản hồi trong 48 giờ
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Nộp CV trực tuyến 1 chạm qua website. Hệ thống cấp ngay Mã hồ sơ để bạn tra cứu tiến độ real-time.
              </p>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ECFDF5', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', margin: '0 auto 1.25rem auto' }}>
                <Users size={26} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>BƯỚC 2</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0.25rem 0 0.5rem 0' }}>Phỏng vấn chuyên môn</h3>
              <div style={{ display: 'inline-block', backgroundColor: '#ECFDF5', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                ⚡ Kết quả sau 3 ngày
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                1 vòng chuyên môn kỹ thuật sâu cùng Tech Lead và 1 vòng trao đổi văn hóa (Culture fit) cởi mở, tôn trọng.
              </p>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FEF3C7', border: '2px solid #D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', margin: '0 auto 1.25rem auto' }}>
                <CheckSquare size={26} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>BƯỚC 3</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0.25rem 0 0.5rem 0' }}>Offer & Pre-Onboarding</h3>
              <div style={{ display: 'inline-block', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                ⚡ Thư mời trong 24 giờ
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Nhận Thư mời làm việc điện tử trên Portal, ký xác nhận online và hoàn tất hồ sơ hội nhập trước ngày đi làm.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* 9. CHIA SẺ TỪ ĐỘI NGŨ (Testimonials Đa dạng vai trò) */}
      <div style={{ padding: '5rem 2rem', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            NGƯỜI THẬT VIỆC THẬT
          </span>
          <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
            Chia sẻ từ các thành viên tại LLA
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '600px', margin: '0 auto' }}>
            Lắng nghe trải nghiệm thực tế từ các kỹ sư, chuyên viên kiểm thử và quản lý sản phẩm.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <Quote size={32} color="#2563EB" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              "Từ một Senior Developer lên Tech Lead, tôi được trao toàn quyền quyết định về mặt kiến trúc công nghệ. Mọi đóng góp đều được ghi nhận xứng đáng."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                H
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Phạm Minh Hoàng</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Tech Lead • 4 năm gắn bó</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <Quote size={32} color="#059669" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              "Môi trường Agile tại LLA cực kỳ chuyên nghiệp. Đội ngũ phối hợp nhịp nhàng và văn hóa phản hồi tích cực giúp sản phẩm phát triển vượt tiến độ."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#EC4899', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                T
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Trần Thu Trang</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Product Owner • 3 năm gắn bó</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <Quote size={32} color="#D97706" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              "Chế độ bảo hiểm và ngân sách thi chứng chỉ là điều tôi trân trọng nhất. Công ty đã tài trợ cho tôi 2 chứng chỉ AWS và Scrum Master trong năm qua."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                A
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Nguyễn Đức Anh</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Senior QA Engineer • 2 năm</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <Quote size={32} color="#7C3AED" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              "Với vai trò HR, tôi tự hào khi toàn bộ quy trình từ Offer đến Pre-onboarding đều minh bạch, không có tình trạng chậm trễ hay nợ phúc lợi nhân viên."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#7C3AED', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                N
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Lê Bảo Ngọc</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Talent Acquisition • 3 năm</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 10. CÂU HỎI THƯỜNG GẶP (FAQ Accordion) */}
      <div id="faq" style={{ backgroundColor: '#FFFFFF', padding: '5rem 2rem', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GIẢI ĐÁP THẮC MẮC
            </span>
            <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.75rem 0' }}>
              Câu hỏi thường gặp (FAQ)
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B' }}>
              Những thắc mắc phổ biến nhất của các ứng viên trước khi ứng tuyển tại LLA.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqList.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '0.75rem', 
                    overflow: 'hidden',
                    backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF'
                  }}
                >
                  <button 
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{ 
                      width: '100%', 
                      padding: '1.25rem 1.5rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: isOpen ? '#2563EB' : '#0F172A'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.7, borderTop: '1px solid #F1F5F9' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 11. FOOTER TOÀN DIỆN & PHÁP LÝ BẢO MẬT (Chuyển nút Quản trị xuống đây kín đáo) */}
      <footer style={{ backgroundColor: '#0F172A', color: '#94A3B8', padding: '4.5rem 2rem 2.5rem 2rem' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '3rem', marginBottom: '3.5rem' }}>
            
            {/* Col 1: Company Profile */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 34, height: 34, background: '#2563EB', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800 }}>L</div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>Công ty TNHH LLA</span>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#94A3B8', marginBottom: '1.25rem' }}>
                Đơn vị tiên phong cung cấp giải pháp chuyển đổi số và quản trị nguồn nhân lực doanh nghiệp tại Việt Nam.
              </p>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                MST: 0109988776 do Sở KH&ĐT cấp
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>Về Tuyển Dụng</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <li><a href="#jobs" style={{ color: '#94A3B8', textDecoration: 'none' }}>Vị trí đang mở tuyển dụng</a></li>
                <li><a href="#culture" style={{ color: '#94A3B8', textDecoration: 'none' }}>Văn hóa & Đãi ngộ</a></li>
                <li><a href="#growth" style={{ color: '#94A3B8', textDecoration: 'none' }}>Lộ trình phát triển năng lực</a></li>
                <li><a href="#process" style={{ color: '#94A3B8', textDecoration: 'none' }}>Quy trình tuyển dụng SLA</a></li>
                <li><a href="#faq" style={{ color: '#94A3B8', textDecoration: 'none' }}>Câu hỏi thường gặp</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Security (Tuân thủ Nghị định 13) */}
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>Pháp lý & Bảo mật</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981' }}>
                  <ShieldCheck size={16} /> Tuân thủ Nghị định 13/2023/NĐ-CP
                </li>
                <li><span style={{ color: '#94A3B8' }}>Chính sách bảo vệ dữ liệu ứng viên</span></li>
                <li><span style={{ color: '#94A3B8' }}>Quy chế thu thập & lưu trữ hồ sơ</span></li>
                <li><span style={{ color: '#94A3B8' }}>Quyền yêu cầu xóa thông tin cá nhân</span></li>
              </ul>
            </div>

            {/* Col 4: Contact HR */}
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>Liên hệ Tuyển dụng</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.7, margin: '0 0 0.5rem 0' }}>
                📍 Tòa nhà LLA Innovation Tower, Cầu Giấy, Hà Nội
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '0 0 0.5rem 0' }}>
                ✉️ Email: <strong style={{ color: '#FFFFFF' }}>tuyendung@lla.vn</strong>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '0 0 1rem 0' }}>
                📞 Hotline: <strong style={{ color: '#FFFFFF' }}>024 8888 9999</strong>
              </p>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Hidden Internal Portal Link */}
          <div style={{ 
            borderTop: '1px solid #1E293B', 
            paddingTop: '2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.8125rem',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              © 2026 Công ty TNHH LLA. Đồ án Tốt Nghiệp Hệ thống Quản trị Doanh nghiệp HRM Enterprise.
            </div>

            {/* Kín đáo chuyển nút Quản trị nội bộ xuống góc nhỏ ở footer */}
            <div>
              <button 
                onClick={() => navigate('/login')}
                title="Dành cho Quản trị viên và Hội đồng chấm ĐATN"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#475569',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                🔐 Cổng Quản trị Doanh nghiệp (Nội bộ)
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL 1: Job Detail Modal */}
      <JobDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        job={selectedDetailJob}
        onApply={(job) => handleApplyClick(job)}
      />

      {/* MODAL 2: Enhanced Application Modal (Nộp CV trực tiếp hoặc link, kèm cam kết bảo mật NĐ 13) */}
      {showApplyModal && createPortal(
        <div 
          className="flex items-center justify-center animate-fade-in" 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            zIndex: 120, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
            padding: '1rem'
          }}
          onClick={() => setShowApplyModal(false)}
        >
          <div 
            className="card glass flex-col overflow-hidden relative" 
            style={{ 
              width: '560px', maxWidth: '96vw', padding: 0, 
              backgroundColor: '#FFFFFF', borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(to right, rgba(37, 99, 235, 0.05), transparent)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
                    Ứng tuyển vị trí
                  </h3>
                  <p style={{ margin: 0, color: '#2563EB', fontWeight: 600, fontSize: '0.9rem' }}>
                    {selectedJob?.title}
                  </p>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem' }}>
              {applySuccess ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                    <CheckCircle2 size={38} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                    Ứng tuyển thành công!
                  </h3>
                  <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Hồ sơ của bạn đã được chuyển tới Hội đồng Tuyển dụng LLA. Chúng tôi sẽ liên hệ lại trong vòng <strong>48 giờ làm việc</strong>.
                  </p>

                  {/* Candidate Code Box */}
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Mã hồ sơ bảo mật của bạn:</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.25rem', color: '#2563EB', letterSpacing: '0.05em' }}>{submittedCandidateCode}</strong>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(submittedCandidateCode);
                          toast.success('Đã sao chép mã hồ sơ!');
                        }}
                        title="Sao chép mã"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '0.35rem' }}>
                      (Lưu lại mã này để tra cứu trạng thái hồ sơ trên website)
                    </span>
                  </div>

                  <button onClick={() => setShowApplyModal(false)} className="btn btn-primary" style={{ width: '100%', height: '42px', borderRadius: '0.5rem', fontWeight: 600 }}>
                    Hoàn tất & Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      Họ và tên <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Nguyễn Văn A" 
                      style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Email liên hệ <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="email" 
                        required 
                        className="form-input" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="nguyenvana@gmail.com" 
                        style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Số điện thoại <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="tel" 
                        required 
                        className="form-input" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        placeholder="0987654321" 
                        style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                      />
                    </div>
                  </div>

                  {/* CV Input Switch: Direct File Upload vs Online Link */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                        Hồ sơ ứng tuyển (CV) <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => setCvInputType('file')}
                          style={{
                            border: 'none',
                            background: cvInputType === 'file' ? '#EFF6FF' : 'transparent',
                            color: cvInputType === 'file' ? '#2563EB' : '#64748B',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Tải file trực tiếp
                        </button>
                        <button 
                          type="button"
                          onClick={() => setCvInputType('link')}
                          style={{
                            border: 'none',
                            background: cvInputType === 'link' ? '#EFF6FF' : 'transparent',
                            color: cvInputType === 'link' ? '#2563EB' : '#64748B',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Dán link Online
                        </button>
                      </div>
                    </div>

                    {cvInputType === 'file' ? (
                      <div style={{ 
                        border: '2px dashed #CBD5E1', 
                        borderRadius: '0.75rem', 
                        padding: '1.25rem', 
                        textAlign: 'center',
                        backgroundColor: '#F8FAFC',
                        position: 'relative'
                      }}>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        {uploadedFileName ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#2563EB', fontWeight: 600 }}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <span>{uploadedFileName}</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={24} color="#64748B" style={{ margin: '0 auto 0.4rem auto' }} />
                            <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 600 }}>
                              Kéo thả file CV hoặc <span style={{ color: '#2563EB' }}>chọn từ máy tính</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                              Định dạng hỗ trợ: PDF, DOC, DOCX (Tối đa 10MB)
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <Link2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="url" 
                          required 
                          className="form-input" 
                          style={{ paddingLeft: '2.5rem', width: '100%', height: '40px', backgroundColor: '#F8FAFC' }} 
                          value={formData.cvUrl} 
                          onChange={e => setFormData({...formData, cvUrl: e.target.value})} 
                          placeholder="https://drive.google.com/file/... hoặc Notion link" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Legal Consent Checkbox (Nghị định 13/2023/NĐ-CP) */}
                  <div style={{ 
                    backgroundColor: '#F8FAFC', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '0.5rem', 
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem'
                  }}>
                    <input 
                      type="checkbox" 
                      id="consent-check"
                      checked={consentChecked}
                      onChange={e => setConsentChecked(e.target.checked)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <label htmlFor="consent-check" style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, cursor: 'pointer' }}>
                      Tôi đồng ý để <strong>Công ty TNHH LLA</strong> thu thập và xử lý dữ liệu cá nhân cho mục đích tuyển dụng phù hợp với <strong>Nghị định 13/2023/NĐ-CP</strong> và cam kết các thông tin khai báo là hoàn toàn chính xác.
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="btn btn-primary" 
                    style={{ width: '100%', height: '44px', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSubmitting ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Ứng Tuyển'}
                    {!isSubmitting && <Send size={16} />}
                  </button>

                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Secure Tracking Modal (Tra cứu an toàn qua Email + Mã hồ sơ hoặc SĐT) */}
      {showTrackModal && createPortal(
        <div 
          className="flex items-center justify-center animate-fade-in" 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            zIndex: 120, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
            padding: '1rem'
          }}
          onClick={() => setShowTrackModal(false)}
        >
          <div 
            className="card glass flex-col overflow-hidden relative" 
            style={{ 
              width: '560px', maxWidth: '96vw', padding: 0, 
              backgroundColor: '#FFFFFF', borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(to right, rgba(14, 165, 233, 0.08), transparent)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
                    Tra cứu tiến độ ứng tuyển
                  </h3>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.8125rem' }}>
                    Bảo mật quyền riêng tư: Nhập email cùng Mã hồ sơ hoặc Số điện thoại để tra cứu
                  </p>
                </div>
                <button onClick={() => setShowTrackModal(false)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1.75rem' }}>
              <form onSubmit={handleTrackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    value={trackEmail} 
                    onChange={e => setTrackEmail(e.target.value)} 
                    placeholder="Nhập email ứng tuyển..." 
                    style={{ height: '42px', backgroundColor: '#F8FAFC' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={trackSecurityCode} 
                    onChange={e => setTrackSecurityCode(e.target.value)} 
                    placeholder="Mã hồ sơ / SĐT (tùy chọn)" 
                    style={{ height: '42px', backgroundColor: '#F8FAFC' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isTracking} 
                  className="btn btn-primary" 
                  style={{ height: '42px', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Search size={16} /> {isTracking ? 'Đang xác minh & tìm kiếm...' : 'Tra cứu hồ sơ ngay'}
                </button>
              </form>

              {trackResults && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                    Kết quả tìm thấy ({trackResults.length} hồ sơ)
                  </h4>
                  
                  {trackResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', color: '#64748B', fontSize: '0.875rem' }}>
                      Không tìm thấy hồ sơ ứng tuyển nào khớp với thông tin cung cấp. Vui lòng kiểm tra lại email hoặc mã hồ sơ.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
                      {trackResults.map(res => {
                        const styleInfo = getStatusBadge(res.status);
                        return (
                          <div key={res.id} style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div>
                                <strong style={{ fontSize: '1rem', color: '#0F172A', display: 'block' }}>{res.jobTitle}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Mã: #{res.id.substring(0, 8).toUpperCase()}</span>
                              </div>
                              <span style={{ backgroundColor: styleInfo.bg, color: styleInfo.color, padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                                {styleInfo.text}
                              </span>
                            </div>

                            {res.latestInterview && (
                              <div style={{ backgroundColor: '#EFF6FF', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem' }}>
                                <Clock size={15} />
                                <span>Lịch {res.latestInterview.roundName}: {new Date(res.latestInterview.scheduledAt).toLocaleString('vi-VN')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: Talent Pool Modal (Gia nhập mạng lưới tài năng) */}
      {showTalentPoolModal && createPortal(
        <div 
          className="flex items-center justify-center animate-fade-in" 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            zIndex: 120, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
            padding: '1rem'
          }}
          onClick={() => setShowTalentPoolModal(false)}
        >
          <div 
            className="card glass flex-col overflow-hidden relative" 
            style={{ 
              width: '520px', maxWidth: '96vw', padding: 0, 
              backgroundColor: '#FFFFFF', borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(to right, rgba(37, 99, 235, 0.08), transparent)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
                    Gia nhập Mạng lưới Tài năng
                  </h3>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.8125rem' }}>
                    Để lại thông tin để được ưu tiên kết nối khi LLA mở vị trí phù hợp
                  </p>
                </div>
                <button onClick={() => setShowTalentPoolModal(false)} className="btn btn-outline" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleTalentPoolSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Họ và tên <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={talentPoolForm.name} 
                  onChange={e => setTalentPoolForm({...talentPoolForm, name: e.target.value})} 
                  placeholder="Nguyễn Văn A" 
                  style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Email liên hệ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  value={talentPoolForm.email} 
                  onChange={e => setTalentPoolForm({...talentPoolForm, email: e.target.value})} 
                  placeholder="nguyenvana@gmail.com" 
                  style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lĩnh vực chuyên môn bạn quan tâm
                </label>
                <select 
                  className="form-input" 
                  value={talentPoolForm.specialty}
                  onChange={e => setTalentPoolForm({...talentPoolForm, specialty: e.target.value})}
                  style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                >
                  <option value="Phần mềm Backend / Node.js / Java">Phát triển Backend (Node.js / Java / Golang)</option>
                  <option value="Phần mềm Frontend / React / Vue">Phát triển Frontend (React / Vue / Next.js)</option>
                  <option value="Kiểm thử chất lượng QA / QC">Kiểm thử phần mềm (QA Manual & Automation)</option>
                  <option value="Phân tích nghiệp vụ BA / PO">Phân tích nghiệp vụ BA & Product Owner</option>
                  <option value="Hạ tầng DevOps / Cloud / System">DevOps & Điện toán đám mây (Cloud/AWS)</option>
                  <option value="Marketing & Truyền thông">Marketing & Truyền thông số</option>
                  <option value="Nhân sự & Vận hành">Nhân sự & Quản trị vận hành</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Link CV hoặc LinkedIn Profile
                </label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={talentPoolForm.cvUrl} 
                  onChange={e => setTalentPoolForm({...talentPoolForm, cvUrl: e.target.value})} 
                  placeholder="https://linkedin.com/in/... hoặc link CV" 
                  style={{ width: '100%', height: '40px', backgroundColor: '#F8FAFC' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingTalentPool} 
                className="btn btn-primary" 
                style={{ width: '100%', height: '44px', borderRadius: '0.5rem', fontWeight: 600, marginTop: '0.5rem' }}
              >
                {isSubmittingTalentPool ? 'Đang gửi thông tin...' : 'Gia Nhập Mạng Lưới Tài Năng'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Candidate Auth Modal */}
      <CandidateAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setCandidateUser(user);
          setShowAppsModal(true);
        }}
      />

      {/* Candidate Applications & Offer Modal */}
      <CandidateApplicationsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        candidateUser={candidateUser}
      />
    </div>
  );
};
