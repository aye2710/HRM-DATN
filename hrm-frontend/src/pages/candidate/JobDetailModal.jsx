import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MapPin, Briefcase, Clock, DollarSign, Calendar, 
  CheckCircle2, Share2, Sparkles, Building, ArrowRight, ShieldCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const JobDetailModal = ({ isOpen, onClose, job, onApply }) => {
  if (!isOpen || !job) return null;

  const handleShare = () => {
    const url = `${window.location.origin}/candidate#job-${job.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết vị trí tuyển dụng!');
    } else {
      toast.success('Đã sao chép liên kết!');
    }
  };

  return createPortal(
    <div 
      className="flex items-center justify-center animate-fade-in" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 110, 
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(6px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="card glass flex-col overflow-hidden relative" 
        style={{ 
          width: '760px', 
          maxWidth: '96vw', 
          maxHeight: '90vh',
          padding: 0,
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          style={{ 
            padding: '1.75rem 2rem', 
            borderBottom: '1px solid var(--border)', 
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(248, 250, 252, 0.8) 100%)',
            position: 'relative'
          }}
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="badge badge-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                  {job.department?.name || 'Công nghệ & Kỹ thuật'}
                </span>
                <span className="badge badge-info" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                  {job.level || 'Mid'} Level
                </span>
                <span className="badge badge-warning" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                  {job.jobType || 'Full-time'}
                </span>
                {job.experienceLevel && (
                  <span className="badge" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' }}>
                    Kinh nghiệm: {job.experienceLevel}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', lineHeight: 1.25 }}>
                {job.title}
              </h2>
              <div className="flex items-center gap-5 text-muted" style={{ fontSize: '0.875rem', flexWrap: 'wrap' }}>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} /> {job.location || 'Hà Nội'} {job.workplaceType ? `(${job.workplaceType})` : ''}
                </span>
                <span className="flex items-center gap-1.5"><Building size={16} /> LLA Technology</span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--success)', fontWeight: 700 }}>
                  <DollarSign size={16} /> {job.salaryRange || 'Thỏa thuận hấp dẫn'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                title="Chia sẻ vị trí tuyển dụng"
                className="btn btn-outline"
                style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Share2 size={16} />
              </button>
              <button 
                onClick={onClose}
                className="btn btn-outline"
                style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Info Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem', 
            backgroundColor: 'var(--bg-muted)', 
            padding: '1.25rem', 
            borderRadius: '0.75rem',
            border: '1px solid var(--border)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Mức thu nhập</span>
              <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>{job.salaryRange || 'Thương lượng'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Hạn nộp hồ sơ</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Tuyển liên tục'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Hình thức làm việc</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{job.jobType || 'Full-time'} (Hybrid)</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Kinh nghiệm yêu cầu</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{job.level ? `${job.level} (từ 1 - 3+ năm)` : 'Phù hợp theo cấp bậc'}</strong>
            </div>
          </div>

          {/* Job Description (Mô tả công việc) */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} color="var(--primary)" /> 1. Mô tả công việc (Job Description)
            </h3>
            {job.description ? (
              <p style={{ color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.925rem' }}>
                {job.description}
              </p>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: 1.8, fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Tham gia phân tích, thiết kế và phát triển các module trọng điểm của hệ thống phần mềm doanh nghiệp LLA.</li>
                <li>Xây dựng kiến trúc mã nguồn sạch, tối ưu hiệu năng và đảm bảo khả năng mở rộng (Scalability).</li>
                <li>Phối hợp cùng Product Owner, UI/UX Designer và Tech Lead để chuyển giao tính năng theo quy trình Agile/Scrum.</li>
                <li>Tham gia rà soát mã nguồn (Code Review), tối ưu cơ sở dữ liệu và triển khai tự động hóa CI/CD.</li>
                <li>Nghiên cứu áp dụng các công nghệ mới nhằm nâng cao chất lượng trải nghiệm của hàng nghìn người dùng.</li>
              </ul>
            )}
          </div>

          {/* Job Requirements (Yêu cầu công việc) */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} color="var(--primary)" /> 2. Yêu cầu ứng viên (Requirements)
            </h3>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-main)', lineHeight: 1.8, fontSize: '0.925rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Tốt nghiệp Cao đẳng/Đại học chuyên ngành CNTT, Công nghệ phần mềm hoặc các chứng chỉ tương đương.</li>
              <li>Nắm vững nền tảng lập trình hướng đối tượng (OOP), cấu trúc dữ liệu, thuật toán và Design Patterns.</li>
              <li>Có kinh nghiệm thực tế với công nghệ phù hợp (Node.js/TypeScript, React/Vue, PostgreSQL/MySQL, Docker/Redis).</li>
              <li>Tư duy giải quyết vấn đề nhạy bén, chủ động trong công việc và tinh thần trách nhiệm cao với sản phẩm.</li>
              <li>Kỹ năng làm việc nhóm tốt, ham học hỏi và thích nghi nhanh với công nghệ tiên tiến.</li>
            </ul>
          </div>

          {/* Perks & Benefits (Quyền lợi) */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary)" /> 3. Quyền lợi & Đãi ngộ (Perks & Benefits)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>💰 Lương thưởng & Thăng tiến</strong>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mức lương cạnh tranh, tháng 13, thưởng hiệu suất dự án. Review định kỳ 2 lần/năm.</p>
              </div>
              <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--success)', display: 'block', marginBottom: '0.25rem' }}>🏥 Bảo hiểm & Sức khỏe</strong>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Đóng Full 100% BHXH theo lương thực nhận. Gói bảo hiểm sức khỏe khám chữa bệnh cao cấp.</p>
              </div>
              <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--warning)', display: 'block', marginBottom: '0.25rem' }}>💻 Trang thiết bị & Tiện ích</strong>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Cấp MacBook Pro M3 mới 100% cùng màn hình mở rộng. Trà, cafe, đồ ăn nhẹ miễn phí.</p>
              </div>
              <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <strong style={{ fontSize: '0.875rem', color: '#6366f1', display: 'block', marginBottom: '0.25rem' }}>🎓 Đào tạo & Chứng chỉ</strong>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tài trợ 100% chi phí thi chứng chỉ quốc tế (AWS, Azure, PMP) lên đến $1,500/năm.</p>
              </div>
            </div>
          </div>

          {/* Recruitment SLA / Timeline */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="var(--primary)" /> Quy trình ứng tuyển dự kiến (SLA)
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <div><strong>Vòng 1:</strong> Tiếp nhận hồ sơ (Phản hồi trong 48h)</div>
              <div><strong>Vòng 2:</strong> Phỏng vấn chuyên môn (Kết quả trong 3 ngày)</div>
              <div><strong>Vòng 3:</strong> Thư mời nhận việc (Gửi trong 24h)</div>
            </div>
          </div>

        </div>

        {/* Modal Footer CTA */}
        <div 
          style={{ 
            padding: '1.25rem 2rem', 
            borderTop: '1px solid var(--border)', 
            backgroundColor: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>Cam kết bảo mật dữ liệu theo Nghị định 13/2023/NĐ-CP</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={onClose} 
              className="btn btn-outline" 
              style={{ borderRadius: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
            >
              Đóng
            </button>
            <button 
              onClick={() => {
                onClose();
                onApply(job);
              }} 
              className="btn btn-primary" 
              style={{ 
                borderRadius: '0.5rem', 
                padding: '0.65rem 1.75rem', 
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              Nộp CV Ứng Tuyển <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
