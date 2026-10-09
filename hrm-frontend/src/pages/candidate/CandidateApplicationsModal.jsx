import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Sparkles,
  Building,
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PreOnboardingModal } from './PreOnboardingModal';

export const CandidateApplicationsModal = ({ isOpen, onClose, candidateUser }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showPreOnboard, setShowPreOnboard] = useState(false);

  const fetchApplications = async () => {
    const token = localStorage.getItem('candidateToken');
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/candidate-auth/my-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ:', err);
      toast.error('Không thể tải danh sách hồ sơ ứng tuyển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApplications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAcceptOffer = (app) => {
    setSelectedCandidate(app);
    setSelectedOffer(app.offer);
    setShowPreOnboard(true);
  };

  const handleRejectOffer = async (app) => {
    const reason = window.prompt('Vui lòng cho biết lý do bạn từ chối thư mời nhận việc này (nếu có):');
    if (reason === null) return;

    const token = localStorage.getItem('candidateToken');
    try {
      await axios.post(
        `http://localhost:5000/api/candidate-auth/offers/${app.id}/reject`,
        { declineReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã ghi nhận phản hồi từ chối Offer.');
      fetchApplications();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi từ chối Offer.');
    }
  };

  const handleConfirmInterview = async (interviewId) => {
    const token = localStorage.getItem('candidateToken');
    try {
      const res = await axios.post(
        `http://localhost:5000/api/candidate-auth/interviews/${interviewId}/confirm`,
        { candidateNotes: 'Ứng viên xác nhận tham gia phỏng vấn đúng giờ' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || 'Đã xác nhận tham gia phỏng vấn thành công!');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi xác nhận phỏng vấn.');
      fetchApplications();
    }
  };

  const handleDeclineInterview = async (interviewId) => {
    const reason = window.prompt('Vui lòng cho biết lý do bạn từ chối hoặc xin đổi lịch hẹn khác:');
    if (reason === null) return;

    const token = localStorage.getItem('candidateToken');
    try {
      const res = await axios.post(
        `http://localhost:5000/api/candidate-auth/interviews/${interviewId}/decline`,
        { declineReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || 'Đã ghi nhận phản hồi từ chối lịch phỏng vấn.');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi từ chối lịch phỏng vấn.');
      fetchApplications();
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SOURCED':
      case 'APPLIED':
        return <span className="badge badge-purple">Đang sàng lọc CV</span>;
      case 'SCREENING':
        return <span className="badge badge-info">Vòng sơ tuyển</span>;
      case 'INTERVIEWING':
        return <span className="badge badge-warning">Đang phỏng vấn</span>;
      case 'OFFERING':
        return <span className="badge badge-success">✨ Đã có Offer</span>;
      case 'HIRED':
        return <span className="badge badge-success">Đã tiếp nhận làm việc</span>;
      case 'REJECTED':
        return <span className="badge badge-error">Chưa phù hợp</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <>
      {createPortal(
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, rgba(37, 99, 235, 0.04), transparent)'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Hồ sơ ứng tuyển & Thư mời Offer
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tài khoản: <strong style={{ color: 'var(--text-main)' }}>{candidateUser?.email}</strong>
                </p>
              </div>

              <button
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="custom-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}
            >
              {loading ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Đang tải thông tin hồ sơ...
                </div>
              ) : applications.length === 0 ? (
                <div
                  style={{
                    padding: '4rem 1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Briefcase size={44} color="var(--border)" style={{ marginBottom: '1rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    Chưa có đơn ứng tuyển nào
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                    Hãy khám phá các vị trí công việc đang mở tuyển và nộp hồ sơ để bắt đầu hành trình cùng LLA nhé!
                  </p>
                </div>
              ) : (
                applications.map((app) => {
                  const offer = app.offer;
                  const po = app.preOnboarding;
                  const hasOffer = !!offer;

                  return (
                    <div
                      key={app.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        borderColor: hasOffer && offer.status === 'PENDING' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)'
                      }}
                    >
                      {/* Job Title & Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {app.jobPosting?.title || 'Vị trí ứng tuyển'}
                            </h4>
                            {renderStatusBadge(app.status)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Building size={14} /> {app.jobPosting?.department?.name || 'Phòng ban chuyên môn'}
                            </span>
                            <span>•</span>
                            <span>Mã đơn: #{app.id.substring(0, 8).toUpperCase()}</span>
                            {app.cvUrl && (
                              <>
                                <span>•</span>
                                <a
                                  href={app.cvUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <FileText size={13} /> Xem CV
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* KHU VỰC LỊCH PHỎNG VẤN & XÁC NHẬN TRONG 24H */}
                      {app.interviews && app.interviews.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {app.interviews.map((inv) => {
                            const isPending = !inv.status || inv.status === 'PENDING_CONFIRMATION';
                            const isConfirmed = inv.status === 'CONFIRMED';
                            const isDeclined = inv.status === 'DECLINED';
                            const isCancelled = inv.status === 'CANCELLED';

                            // Tính toán thời gian 24 giờ còn lại
                            const expiresAt = inv.expiresAt 
                              ? new Date(inv.expiresAt) 
                              : new Date(new Date(inv.createdAt || inv.scheduledAt).getTime() + 24 * 60 * 60 * 1000);
                            const remainingMs = expiresAt.getTime() - Date.now();
                            const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
                            const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
                            const isExpired = remainingMs <= 0 && isPending;

                            return (
                              <div
                                key={inv.id}
                                style={{
                                  borderRadius: '0.75rem',
                                  border: '1px solid',
                                  borderColor: isConfirmed
                                    ? 'rgba(34, 197, 94, 0.4)'
                                    : isDeclined || isCancelled || isExpired
                                    ? 'rgba(239, 68, 68, 0.3)'
                                    : 'rgba(245, 158, 11, 0.5)',
                                  backgroundColor: isConfirmed
                                    ? 'rgba(34, 197, 94, 0.04)'
                                    : isDeclined || isCancelled || isExpired
                                    ? 'rgba(239, 68, 68, 0.04)'
                                    : '#FFFBEB',
                                  padding: '1.15rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.75rem'
                                }}
                              >
                                {/* Header của Lịch phỏng vấn */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={18} color={isConfirmed ? 'var(--success)' : isPending ? '#D97706' : 'var(--error)'} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                      Lịch hẹn Phỏng vấn: {inv.roundName}
                                    </span>
                                  </div>

                                  {/* Badge trạng thái */}
                                  {isPending && !isExpired && (
                                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309' }}>
                                      ⏳ Chờ bạn xác nhận (Hạn chót 24h)
                                    </span>
                                  )}
                                  {isPending && isExpired && (
                                    <span className="badge badge-error" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      ⚠️ Đã quá hạn 24h (Tự động hủy)
                                    </span>
                                  )}
                                  {isConfirmed && (
                                    <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      ✓ Bạn đã xác nhận tham gia
                                    </span>
                                  )}
                                  {isDeclined && (
                                    <span className="badge badge-error" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      ✗ Đã từ chối lịch hẹn
                                    </span>
                                  )}
                                  {isCancelled && !isExpired && (
                                    <span className="badge badge-error" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      Đã hủy lịch phỏng vấn
                                    </span>
                                  )}
                                </div>

                                {/* Thông tin chi tiết lịch hẹn */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
                                  <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>Thời gian phỏng vấn</span>
                                    <strong style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                                      {new Date(inv.scheduledAt).toLocaleString('vi-VN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </strong>
                                  </div>

                                  <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>Hình thức / Địa điểm</span>
                                    <strong style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
                                      {inv.location || 'Online Meeting (Google Meet)'}
                                    </strong>
                                  </div>

                                  <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block' }}>Người phỏng vấn (HR/Lead)</span>
                                    <strong style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
                                      {inv.interviewerId}
                                    </strong>
                                  </div>
                                </div>

                                {/* Cảnh báo đếm ngược 24h nếu đang chờ xác nhận */}
                                {isPending && !isExpired && (
                                  <div style={{
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#FFF7ED',
                                    border: '1px dashed #FDBA74',
                                    fontSize: '0.8rem',
                                    color: '#C2410C',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                  }}>
                                    <span>
                                      ⏰ <strong>Lưu ý:</strong> Vui lòng xác nhận tham gia. Nếu sau <strong>24 giờ</strong> không phản hồi, lịch hẹn sẽ tự động bị hủy (Còn lại: <strong>{remainingHours} giờ {remainingMinutes} phút</strong>).
                                    </span>
                                  </div>
                                )}

                                {/* Ghi chú nếu đã xác nhận / từ chối / hủy */}
                                {inv.candidateResponse && (
                                  <div style={{ fontSize: '0.8rem', color: isConfirmed ? 'var(--success)' : 'var(--error)', fontStyle: 'italic' }}>
                                    Phản hồi: "{inv.candidateResponse}"
                                  </div>
                                )}

                                {/* Nút thao tác xác nhận / từ chối */}
                                {isPending && !isExpired && (
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleDeclineInterview(inv.id)}
                                      className="btn btn-outline"
                                      style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--error)',
                                        borderColor: 'rgba(239, 68, 68, 0.4)',
                                        padding: '0.45rem 0.95rem'
                                      }}
                                    >
                                      ✗ Báo bận / Xin đổi lịch
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleConfirmInterview(inv.id)}
                                      className="btn btn-primary"
                                      style={{
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#16A34A',
                                        borderColor: '#16A34A',
                                        padding: '0.45rem 1.15rem'
                                      }}
                                    >
                                      ✓ Xác nhận tham gia phỏng vấn
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* KHU VỰC THƯ MỜI NHẬN VIỆC (OFFER LETTER) */}
                      {hasOffer && (
                        <div
                          style={{
                            borderRadius: '0.75rem',
                            border: '1px solid',
                            borderColor:
                              offer.status === 'ACCEPTED'
                                ? 'rgba(34, 197, 94, 0.3)'
                                : offer.status === 'REJECTED'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'rgba(245, 158, 11, 0.4)',
                            backgroundColor:
                              offer.status === 'ACCEPTED'
                                ? 'rgba(34, 197, 94, 0.03)'
                                : offer.status === 'REJECTED'
                                ? 'rgba(239, 68, 68, 0.03)'
                                : 'rgba(245, 158, 11, 0.03)',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.875rem'
                          }}
                        >
                          {/* Banner Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Award size={18} color={offer.status === 'ACCEPTED' ? 'var(--success)' : 'var(--warning)'} />
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                Thư mời nhận việc chính thức (Job Offer Letter)
                              </span>
                            </div>

                            {offer.status === 'PENDING' && (
                              <span className="badge badge-warning" style={{ fontWeight: 600 }}>
                                Đang chờ bạn phản hồi
                              </span>
                            )}
                            {offer.status === 'ACCEPTED' && (
                              <span className="badge badge-success" style={{ fontWeight: 600 }}>
                                ✓ Bạn đã chấp nhận Offer
                              </span>
                            )}
                            {offer.status === 'REJECTED' && (
                              <span className="badge badge-error" style={{ fontWeight: 600 }}>
                                Đã từ chối
                              </span>
                            )}
                          </div>

                          {/* 3 Metric Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            <div
                              style={{
                                padding: '0.75rem',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Lương thỏa thuận
                              </span>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.15rem' }}>
                                {Number(offer.baseSalary).toLocaleString('vi-VN')} đ
                              </div>
                            </div>

                            <div
                              style={{
                                padding: '0.75rem',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Ngày nhận việc
                              </span>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                                {offer.startDate ? new Date(offer.startDate).toLocaleDateString('vi-VN') : 'Thỏa thuận'}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: '0.75rem',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Loại hợp đồng
                              </span>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                                {offer.contractType === 'PROBATION' ? 'Thử việc (85%)' : offer.contractType || 'Thử việc'}
                              </div>
                            </div>
                          </div>

                          {offer.notes && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              "{offer.notes}"
                            </div>
                          )}

                          {/* ACTION BUTTONS */}
                          {offer.status === 'PENDING' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRejectOffer(app)}
                                className="btn btn-outline"
                                style={{
                                  fontSize: '0.8125rem',
                                  color: 'var(--error)',
                                  borderColor: 'rgba(239, 68, 68, 0.4)'
                                }}
                              >
                                Từ chối Offer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAcceptOffer(app)}
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  backgroundColor: 'var(--success)',
                                  borderColor: 'var(--success)',
                                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
                                }}
                              >
                                <CheckCircle2 size={16} /> Chấp nhận Offer & Khai báo thông tin nhận việc
                              </button>
                            </div>
                          )}

                          {offer.status === 'ACCEPTED' && (
                            <div
                              style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                color: 'var(--success-fg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <ShieldCheck size={18} />
                              <span>
                                <strong>Hồ sơ tiếp nhận đã gửi thành công!</strong> Vui lòng có mặt tại văn phòng vào{' '}
                                <strong>{new Date(offer.startDate).toLocaleDateString('vi-VN')}</strong> để hoàn tất thủ tục bàn giao.
                              </span>
                            </div>
                          )}

                          {offer.status === 'REJECTED' && offer.declineReason && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--error)' }}>
                              Lý do bạn từ chối: {offer.declineReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pre-Onboarding Modal */}
      {showPreOnboard && selectedCandidate && (
        <PreOnboardingModal
          isOpen={showPreOnboard}
          onClose={() => setShowPreOnboard(false)}
          candidate={selectedCandidate}
          offer={selectedOffer}
          onSuccess={() => {
            fetchApplications();
          }}
        />
      )}
    </>
  );
};
