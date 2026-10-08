import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MapPin, Briefcase, Clock, ChevronRight, CheckCircle2, Rocket, Heart, Coffee, UserCircle, Users, Quote, CheckSquare, Search, FileText, X, Sparkles, LogOut } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CandidateAuthModal } from './CandidateAuthModal';
import { CandidateApplicationsModal } from './CandidateApplicationsModal';


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

  // Application Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  
  // Tracking Modal State
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackEmail, setTrackEmail] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
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
    document.title = "Tuyển dụng | Công ty TNHH LLA";
    
    axios.get('http://localhost:5000/api/job-postings')
      .then(res => {
        const publishedJobs = res.data.filter(job => job.status === 'PUBLISHED');
        setJobPostings(publishedJobs);
      })
      .catch(err => console.error("Lỗi lấy danh sách job", err))
      .finally(() => setLoading(false));

    return () => { document.title = "HRM Pro"; };
  }, []);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setFormData({
      name: candidateUser ? candidateUser.name : '',
      email: candidateUser ? candidateUser.email : '',
      phone: candidateUser?.phone || '',
      cvUrl: ''
    });
    setApplySuccess(false);
    setShowApplyModal(true);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.cvUrl) {
      toast.error("Vui lòng điền đầy đủ Họ tên, Email và Link CV");
      return;
    }

    setIsSubmitting(true);
    
    // Call backend API to submit candidate
    axios.post('http://localhost:5000/api/candidates', {
      ...formData,
      jobPostingId: selectedJob.id,
      status: 'SOURCED'
    })
    .then(() => {
      setApplySuccess(true);
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
    if (!trackEmail) return;
    
    setIsTracking(true);
    axios.get(`http://localhost:5000/api/candidates/track?email=${encodeURIComponent(trackEmail)}`)
      .then(res => {
        setTrackResults(res.data);
      })
      .catch(err => {
        toast.error("Có lỗi xảy ra khi tra cứu.");
        console.error(err);
      })
      .finally(() => {
        setIsTracking(false);
      });
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'APPLIED': return { text: 'Đang sàng lọc', color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'INTERVIEWING': return { text: 'Chờ phỏng vấn', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'OFFERED': return { text: 'Đã có kết quả (Offer)', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'HIRED': return { text: 'Nhận việc', color: 'var(--text-main)', bg: 'rgba(255, 255, 255, 0.1)' };
      case 'REJECTED': return { text: 'Chưa phù hợp', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' };
      default: return { text: 'Đang xử lý', color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      
      {/* Top Navbar */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0.85rem 4rem', backgroundColor: 'rgba(255, 255, 255, 0.92)', 
        backdropFilter: 'blur(12px)', position: 'fixed', top: 0, width: '100%', zIndex: 50,
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)' }}>
            L
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            LLA Careers
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <a href="#about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>Về chúng tôi</a>
          <a href="#jobs" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>Vị trí tuyển dụng</a>
          
          {candidateUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <button 
                onClick={() => setShowAppsModal(true)} 
                className="btn btn-outline"
                style={{
                  height: '36px',
                  borderRadius: '9999px',
                  padding: '0 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--primary)',
                  borderColor: 'rgba(37, 99, 235, 0.3)',
                  backgroundColor: 'rgba(37, 99, 235, 0.04)'
                }}
              >
                <Sparkles size={14} color="var(--primary)" /> Đơn ứng tuyển & Offer
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '3px 8px 3px 4px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
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
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {candidateUser.name}
                </span>
                <button
                  onClick={handleCandidateLogout}
                  title="Đăng xuất"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    marginLeft: '2px'
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginLeft: '0.5rem' }}>
              <button 
                onClick={() => { setTrackResults(null); setTrackEmail(''); setShowTrackModal(true); }} 
                className="btn btn-outline"
                style={{
                  height: '36px',
                  borderRadius: '9999px',
                  padding: '0 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Search size={14} /> Tra cứu nhanh
              </button>
              <button 
                className="btn btn-primary" 
                style={{
                  height: '36px',
                  borderRadius: '9999px',
                  padding: '0 1.1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }} 
                onClick={() => setShowAuthModal(true)}
              >
                <UserCircle size={16} /> Đăng nhập Ứng viên
              </button>
            </div>
          )}

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>

          <button 
            onClick={() => navigate('/')}
            title="Đến Cổng Quản trị Doanh nghiệp (Nội bộ)"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            Quản trị nội bộ ➔
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <div style={{ 
        padding: '9rem 2rem 5rem 2rem', 
        textAlign: 'center', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.05) 0%, rgba(248, 250, 252, 0) 100%)'
      }}>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="badge badge-purple mb-4 animate-fade-in" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            ✨ Best IT Workplace 2026
          </div>
          <h1 className="animate-fade-in" style={{ fontSize: '3.5rem', color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: 1.15, fontWeight: 800 }}>
            Kiến tạo tương lai cùng <br/> <span className="text-gradient">Công ty TNHH LLA</span>
          </h1>
          <p className="animate-fade-in" style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '2.25rem', maxWidth: '650px', lineHeight: 1.6 }}>
            Trở thành một phần của đội ngũ kỹ sư tinh hoa. Chúng tôi xây dựng những giải pháp công nghệ mang tính biểu tượng và thay đổi cách thế giới vận hành.
          </p>
          <div className="animate-fade-in" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#jobs" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem', height: '46px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', boxShadow: '0 8px 18px rgba(37, 99, 235, 0.25)' }}>
              <Search size={18} /> Khám phá cơ hội ngay
            </a>
            <button 
              onClick={() => { setTrackResults(null); setTrackEmail(''); setShowTrackModal(true); }}
              className="btn btn-outline" 
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', height: '46px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Tra cứu hồ sơ
            </button>
          </div>
        </div>
        
        {/* Ambient Glow */}
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '380px', height: '380px', background: 'var(--primary)', filter: 'blur(160px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '5%', right: '20%', width: '350px', height: '350px', background: 'var(--accent)', filter: 'blur(160px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none' }}></div>
      </div>

      {/* Workspace & Gallery */}
      <div id="workspace" style={{ padding: '4rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Không gian làm việc</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Cơ sở vật chất hiện đại, truyền cảm hứng sáng tạo mỗi ngày</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="card glass" style={{ padding: '0.5rem', overflow: 'hidden', borderRadius: '1.5rem' }}>
              <img src="/images/office1.jpg" alt="LLA Office Workspace" style={{ width: '100%', height: '350px', objectFit: 'cover', borderRadius: '1rem', transition: 'transform 0.5s' }} className="hover:scale-105" />
            </div>
            <div className="card glass" style={{ padding: '0.5rem', overflow: 'hidden', borderRadius: '1.5rem' }}>
              <img src="/images/office2.jpg" alt="LLA Office Pantry" style={{ width: '100%', height: '350px', objectFit: 'cover', borderRadius: '1rem', transition: 'transform 0.5s' }} className="hover:scale-105" />
            </div>
          </div>
        </div>
      </div>

      {/* Core Values & Perks */}
      <div id="about" style={{ padding: '6rem 2rem', position: 'relative', zIndex: 10, backgroundColor: 'var(--bg-hover)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Đãi ngộ & Văn hóa</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Môi trường lý tưởng để bạn tỏa sáng và bứt phá giới hạn</p>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="card glass text-center flex-col items-center card-hover" style={{ padding: '2.5rem 2rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Rocket size={40} color="var(--primary)" />
              </div>
              <h3 className="mb-3" style={{ fontSize: '1.35rem' }}>Lương thưởng Top 10%</h3>
              <p className="text-muted">Mức lương cạnh tranh theo chuẩn thị trường IT. Thưởng dự án, thưởng tháng 13 và review tăng lương 2 lần/năm.</p>
            </div>
            <div className="card glass text-center flex-col items-center card-hover" style={{ padding: '2.5rem 2rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Heart size={40} color="var(--success)" />
              </div>
              <h3 className="mb-3" style={{ fontSize: '1.35rem' }}>Bảo hiểm cao cấp</h3>
              <p className="text-muted">Gói bảo hiểm sức khỏe (Health Care) riêng biệt cho nhân viên và gia đình. Đóng Full BHXH theo quy định.</p>
            </div>
            <div className="card glass text-center flex-col items-center card-hover" style={{ padding: '2.5rem 2rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Coffee size={40} color="var(--accent)" />
              </div>
              <h3 className="mb-3" style={{ fontSize: '1.35rem' }}>Flexible & Relax</h3>
              <p className="text-muted">Ân hạn đi muộn 15 phút/ngày. Cấp MacBook Pro M3, Pantry phục vụ trà, cafe, snack miễn phí cả ngày.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recruitment Process */}
      <div id="process" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="text-center mb-16">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Quy trình tuyển dụng tinh gọn</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Chỉ mất 7-10 ngày từ lúc nộp CV đến khi nhận Offer</p>
          </div>
          
          <div className="flex justify-between relative">
            <div style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 1 }}></div>
            
            <div className="flex-col items-center text-center relative" style={{ zIndex: 2, width: '25%' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <FileText size={32} color="var(--primary)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>1. Nộp CV</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Ứng tuyển online 1 chạm</p>
            </div>
            
            <div className="flex-col items-center text-center relative" style={{ zIndex: 2, width: '25%' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users size={32} color="var(--accent)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>2. Phỏng vấn</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>1 vòng chuyên môn + Culture fit</p>
            </div>
            
            <div className="flex-col items-center text-center relative" style={{ zIndex: 2, width: '25%' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckSquare size={32} color="var(--success)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>3. Nhận Offer</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Thỏa thuận & Ký điện tử</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ padding: '6rem 2rem', backgroundColor: 'var(--bg-hover)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Lời chia sẻ từ đội ngũ</h2>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="card glass p-8">
              <Quote size={40} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                "Từ lúc gia nhập LLA, tôi thực sự ấn tượng với tốc độ phát triển và văn hóa làm việc cởi mở. Mọi ý tưởng đều được lắng nghe và hệ thống quản trị nhân sự ở đây cực kỳ minh bạch."
              </p>
              <div className="flex items-center gap-4">
                <div className="avatar" style={{ background: '#3b82f6' }}>P</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Phạm Minh Hoàng</h4>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Senior Backend Engineer</span>
                </div>
              </div>
            </div>
            <div className="card glass p-8">
              <Quote size={40} color="var(--accent)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                "Sự hỗ trợ tuyệt đối từ công ty giúp tôi cân bằng giữa công việc và cuộc sống. Các chế độ phúc lợi như bảo hiểm và phụ cấp OT luôn được trả đúng hạn và rõ ràng."
              </p>
              <div className="flex items-center gap-4">
                <div className="avatar" style={{ background: '#ec4899' }}>T</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Trần Thu Trang</h4>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Product Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Openings */}
      <div id="jobs" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '3rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Vị trí đang mở</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Tham gia vào các dự án trọng điểm toàn cầu</p>
          </div>

          <div className="flex-col gap-6">
            {loading ? (
              <div className="text-center text-muted py-8">Đang tải danh sách việc làm...</div>
            ) : jobPostings.length === 0 ? (
              <div className="text-center text-muted py-8">Hiện tại chưa có vị trí nào đang mở tuyển dụng.</div>
            ) : (
              jobPostings.map(job => (
                <div key={job.id} className="card glass card-hover flex items-center justify-between" style={{ padding: '2rem', cursor: 'pointer', borderLeft: '4px solid var(--primary)' }}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>{job.title}</h3>
                      <span className="badge badge-info">{job.level || 'Intern'} - {job.jobType || 'Full-time'}</span>
                    </div>
                    <div className="flex items-center gap-6 text-muted mt-3" style={{ fontSize: '0.95rem' }}>
                      <span className="flex items-center gap-2"><MapPin size={18} /> Trụ sở chính</span>
                      <span className="flex items-center gap-2"><Briefcase size={18} /> {job.department?.name || 'Tất cả phòng ban'}</span>
                      <span className="flex items-center gap-2" style={{ color: 'var(--success)', fontWeight: 600 }}><span className="badge badge-success" style={{background: 'transparent'}}>💰 {job.salaryRange || 'Thỏa thuận'}</span></span>
                    </div>
                  </div>
                  <button onClick={() => handleApplyClick(job)} className="btn btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: '0.5rem' }}>
                    Nộp CV <ChevronRight size={18} />
                  </button>
                </div>
              ))
            )}
            
            <div className="card glass text-center mt-8" style={{ padding: '3rem', borderStyle: 'dashed' }}>
              <h3 className="mb-2" style={{ color: 'var(--text-muted)' }}>Không tìm thấy vị trí phù hợp?</h3>
              <p className="text-muted mb-4">Đừng lo! Gửi CV cho chúng tôi, LLA luôn chào đón các tài năng bất cứ lúc nào.</p>
              <button className="btn btn-outline" style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }}>Gửi CV Ngẫu Nhiên</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border)', padding: '4rem 2rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>L</div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>Công ty TNHH LLA</span>
            </div>
            <p className="text-muted" style={{ maxWidth: '320px', lineHeight: 1.6, fontSize: '0.9rem' }}>Kiến tạo các giải pháp phần mềm đẳng cấp thế giới bằng sự đổi mới không ngừng.</p>
          </div>
          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
            <div className="flex-col gap-2">
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Công ty</h4>
              <a href="#about" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Về LLA</a>
              <a href="#workspace" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Không gian làm việc</a>
              <a href="#jobs" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Tuyển dụng</a>
            </div>
            <div className="flex-col gap-2">
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Hỗ trợ</h4>
              <a href="#process" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Quy trình ứng tuyển</a>
              <a href="#" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Liên hệ Tuyển dụng</a>
              <a href="#" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Chính sách bảo mật</a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '2rem', fontSize: '0.85rem' }}>
          <p>© 2026 Công ty TNHH LLA. Đồ án Tốt Nghiệp HRM Enterprise.</p>
        </div>
      </footer>

      {/* Application Modal */}
      {showApplyModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            {/* Modal Header */}
            <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)' }}>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">Ứng tuyển vị trí</h3>
                <p className="text-[var(--primary)] font-medium">{selectedJob?.title}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {applySuccess ? (
                <div className="flex-col items-center justify-center text-center py-8 animate-fade-in">
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <CheckCircle2 size={40} color="var(--success)" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-heading)] mb-2">Ứng tuyển thành công!</h3>
                  <p className="text-muted mb-6">Hồ sơ của bạn đã được gửi đến bộ phận Nhân sự của LLA. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.</p>
                  <button onClick={() => setShowApplyModal(false)} className="btn btn-primary w-full">Đóng cửa sổ</button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="flex-col gap-4">
                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Họ và tên <span className="text-[var(--error)]">*</span></label>
                    <input type="text" required className="form-input w-full bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nguyễn Văn A" />
                  </div>
                  
                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Email <span className="text-[var(--error)]">*</span></label>
                    <input type="email" required className="form-input w-full bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="nguyenvana@email.com" />
                  </div>
                  
                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Số điện thoại</label>
                    <input type="tel" className="form-input w-full bg-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0901234567" />
                  </div>

                  <div className="flex-col gap-2 mb-4">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Đường dẫn CV (Google Drive, Notion...) <span className="text-[var(--error)]">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <FileText size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="url" required className="form-input w-full bg-white" style={{ paddingLeft: '2.5rem' }} value={formData.cvUrl} onChange={e => setFormData({...formData, cvUrl: e.target.value})} placeholder="https://drive.google.com/..." />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Vui lòng đảm bảo link CV của bạn được cấp quyền truy cập công khai (Anyone with the link can view).</p>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full flex justify-center items-center gap-2" style={{ padding: '0.85rem' }}>
                    {isSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi Hồ Sơ Ứng Tuyển'}
                    {!isSubmitting && <Rocket size={18} />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tracking Modal */}
      {showTrackModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(14, 165, 233, 0.1), transparent)' }}>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">Tra cứu kết quả ứng tuyển</h3>
                <p className="text-[var(--text-muted)] text-sm">Xem trạng thái hồ sơ của bạn tại LLA</p>
              </div>
              <button onClick={() => setShowTrackModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handleTrackSubmit} className="flex gap-2 mb-6">
                <input 
                  type="email" 
                  required 
                  className="form-input flex-1 bg-white" 
                  value={trackEmail} 
                  onChange={e => setTrackEmail(e.target.value)} 
                  placeholder="Nhập email ứng tuyển..." 
                />
                <button type="submit" disabled={isTracking} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  {isTracking ? 'Đang tìm...' : 'Tra cứu'}
                </button>
              </form>

              {trackResults && (
                <div className="flex-col gap-3">
                  <h4 className="text-[var(--text-main)] font-medium mb-2 border-b border-[var(--border)] pb-2">Lịch sử ứng tuyển ({trackResults.length})</h4>
                  
                  {trackResults.length === 0 ? (
                    <div className="text-center py-6 text-muted bg-white rounded-lg border border-[var(--border)]">
                      Không tìm thấy hồ sơ ứng tuyển nào với email này.
                    </div>
                  ) : (
                    <div className="flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {trackResults.map(res => {
                        const styleInfo = getStatusText(res.status);
                        return (
                          <div key={res.id} className="flex-col p-4 rounded-xl border border-[var(--border)] bg-white gap-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-[var(--text-heading)] mb-1">{res.jobTitle}</div>
                                <div className="text-xs text-muted">ID: #{res.id.substring(0,6).toUpperCase()}</div>
                              </div>
                              <div style={{ background: styleInfo.bg, color: styleInfo.color, padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600 }}>
                                {styleInfo.text}
                              </div>
                            </div>
                            {res.latestInterview && (
                              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-sm text-[var(--text-main)] bg-[rgba(99,102,241,0.05)] p-2 rounded-lg">
                                <Clock size={16} className="text-[var(--primary)]" />
                                <div>
                                  <span className="font-medium">{res.latestInterview.roundName}:</span> 
                                  {" "} {new Date(res.latestInterview.scheduledAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
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
