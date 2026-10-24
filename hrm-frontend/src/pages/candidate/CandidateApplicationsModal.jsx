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
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Send
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

  // Modal Báo bận / Xin đổi lịch phỏng vấn
  const [interviewDeclineModal, setInterviewDeclineModal] = useState({
    isOpen: false,
    interview: null,
    app: null,
    actionType: 'RESCHEDULE', // 'RESCHEDULE' | 'DECLINE'
    quickReason: 'Trùng lịch làm việc / công tác đột xuất',
    proposedDate: '',
    proposedTimeSlot: 'AFTERNOON',
    notes: 'Kính gửi Quý công ty, do trùng lịch làm việc / công tác đột xuất vào khung giờ trên, em xin phép kính đề xuất dời buổi phỏng vấn sang thời gian khác để chuẩn bị tốt nhất. Rất mong Quý công ty thông cảm và tạo điều kiện hỗ trợ.',
    submitting: false
  });

  // Modal Từ chối Offer
  const [offerRejectModal, setOfferRejectModal] = useState({
    isOpen: false,
    app: null,
    quickReason: 'Đã nhận được lời mời làm việc phù hợp hơn',
    notes: 'Kính gửi Quý công ty, em chân thành cảm ơn cơ hội và thư mời nhận việc. Sau khi cân nhắc kỹ, em xin phép từ chối cơ hội này do định hướng công việc cá nhân. Chúc Quý công ty ngày càng phát triển.',
    submitting: false
  });

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

  const handleOpenRejectOffer = (app) => {
    setOfferRejectModal({
      isOpen: true,
      app,
      quickReason: 'Đã nhận được lời mời làm việc phù hợp hơn',
      notes: 'Kính gửi Quý công ty, em chân thành cảm ơn cơ hội và thư mời nhận việc. Sau khi cân nhắc kỹ, em xin phép từ chối cơ hội này do định hướng công việc cá nhân. Chúc Quý công ty ngày càng phát triển.',
      submitting: false
    });
  };

  const handleSubmitRejectOffer = async () => {
    const { app, quickReason, notes } = offerRejectModal;
    if (!app) return;

    const finalReason = `Lý do: ${quickReason}. Lời nhắn: ${notes}`.trim();
    setOfferRejectModal(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('candidateToken');
    try {
      await axios.post(
        `http://localhost:5000/api/candidate-auth/offers/${app.id}/reject`,
        { declineReason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã ghi nhận phản hồi từ chối Offer.');
      setOfferRejectModal({
        isOpen: false,
        app: null,
        quickReason: '',
        notes: '',
        submitting: false
      });
      fetchApplications();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi từ chối Offer.');
      setOfferRejectModal(prev => ({ ...prev, submitting: false }));
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

  const handleOpenDeclineModal = (inv, app) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setInterviewDeclineModal({
      isOpen: true,
      interview: inv,
      app: app,
      actionType: 'RESCHEDULE',
      quickReason: 'Trùng lịch làm việc / công tác đột xuất',
      proposedDate: tomorrowStr,
      proposedTimeSlot: 'AFTERNOON',
      notes: 'Kính gửi Quý công ty, do trùng lịch làm việc / công tác đột xuất vào khung giờ trên, em xin phép kính đề xuất dời buổi phỏng vấn sang thời gian khác để chuẩn bị tốt nhất. Rất mong Quý công ty thông cảm và tạo điều kiện hỗ trợ.',
      submitting: false
    });
  };

  const handleSelectDeclineActionType = (type) => {
    if (type === 'RESCHEDULE') {
      setInterviewDeclineModal(prev => ({
        ...prev,
        actionType: 'RESCHEDULE',
        quickReason: 'Trùng lịch làm việc / công tác đột xuất',
        notes: 'Kính gửi Quý công ty, do trùng lịch làm việc / công tác đột xuất vào khung giờ trên, em xin phép kính đề xuất dời buổi phỏng vấn sang thời gian khác để chuẩn bị tốt nhất. Rất mong Quý công ty thông cảm và tạo điều kiện hỗ trợ.'
      }));
    } else {
      setInterviewDeclineModal(prev => ({
        ...prev,
        actionType: 'DECLINE',
        quickReason: 'Đã nhận được offer phù hợp từ công ty khác',
        notes: 'Kính gửi Quý công ty, em chân thành cảm ơn cơ hội phỏng vấn. Tuy nhiên do kế hoạch công việc mới, em xin phép từ chối tham gia buổi phỏng vấn này. Chúc Quý công ty sớm tìm được ứng viên phù hợp.'
      }));
    }
  };

  const handleSelectQuickReason = (reason) => {
    setInterviewDeclineModal(prev => {
      let template = prev.notes;
      if (prev.actionType === 'RESCHEDULE') {
        template = `Kính gửi Quý công ty, do ${reason.toLowerCase()} vào khung giờ trên, em xin phép kính đề xuất dời lịch phỏng vấn sang thời gian khác để có thể chuẩn bị tốt nhất. Rất mong Quý công ty thông cảm và hỗ trợ sắp xếp.`;
      } else {
        template = `Kính gửi Quý công ty, em chân thành cảm ơn cơ hội phỏng vấn. Do ${reason.toLowerCase()}, em xin phép từ chối tham gia buổi phỏng vấn này. Chúc Quý công ty sớm tìm được ứng viên phù hợp.`;
      }
      return {
        ...prev,
        quickReason: reason,
        notes: template
      };
    });
  };

  const handleSubmitDeclineInterview = async () => {
    const { interview, actionType, quickReason, proposedDate, proposedTimeSlot, notes } = interviewDeclineModal;
    if (!interview) return;

    let finalReason = '';
    if (actionType === 'RESCHEDULE') {
      const timeSlotMap = {
        MORNING: 'Buổi sáng (09:00 - 11:30)',
        AFTERNOON: 'Buổi chiều (14:00 - 17:30)',
        AFTER_HOURS: 'Sau giờ hành chính (Sau 17:30)',
        ANY: 'Linh hoạt theo lịch sắp xếp của HR'
      };
      const timeSlotText = timeSlotMap[proposedTimeSlot] || proposedTimeSlot;
      const dateText = proposedDate ? ` ngày ${new Date(proposedDate).toLocaleDateString('vi-VN')}` : '';
      finalReason = `[XIN ĐỔI LỊCH] Lý do: ${quickReason}. Đề xuất dời sang:${dateText} - ${timeSlotText}. Lời nhắn: ${notes}`.trim();
    } else {
      finalReason = `[TỪ CHỐI PHỎNG VẤN] Lý do: ${quickReason}. Lời nhắn: ${notes}`.trim();
    }

    setInterviewDeclineModal(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('candidateToken');
    try {
      const res = await axios.post(
        `http://localhost:5000/api/candidate-auth/interviews/${interview.id}/decline`,
        { declineReason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || (actionType === 'RESCHEDULE' ? 'Đã gửi đề xuất dời lịch phỏng vấn đến HR thành công!' : 'Đã ghi nhận phản hồi từ chối lịch phỏng vấn.'));
      setInterviewDeclineModal({
        isOpen: false,
        interview: null,
        app: null,
        actionType: 'RESCHEDULE',
        quickReason: '',
        proposedDate: '',
        proposedTimeSlot: 'AFTERNOON',
        notes: '',
        submitting: false
      });
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi gửi phản hồi.');
      setInterviewDeclineModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const renderStatusBadge = (status) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
      lineHeight: 1.2
    };
    switch (status) {
      case 'SOURCED':
      case 'APPLIED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
            <FileText size={12} /> Đang sàng lọc hồ sơ
          </span>
        );
      case 'SCREENING':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4' }}>
            <Clock size={12} /> Vòng sơ loại
          </span>
        );
      case 'INTERVIEWING':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
            <Calendar size={12} /> Đang phỏng vấn
          </span>
        );
      case 'OFFERING':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
            <Sparkles size={12} /> Đã có Thư mời (Offer)
          </span>
        );
      case 'HIRED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
            <CheckCircle2 size={12} /> Đã tiếp nhận chính thức
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
            <XCircle size={12} /> Chưa phù hợp đợt này
          </span>
        );
      default:
        return (
          <span style={{ ...baseStyle, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
            {status}
          </span>
        );
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
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
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
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Hồ sơ ứng tuyển & Thư mời nhận việc
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                    Tài khoản ứng viên: <strong style={{ color: '#0F172A', fontWeight: 600 }}>{candidateUser?.email}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Đóng"
                style={{
                  border: 'none',
                  background: '#F1F5F9',
                  color: '#64748B',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} />
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
                gap: '1.25rem',
                backgroundColor: '#F8FAFC'
              }}
            >
              {loading ? (
                <div style={{ padding: '3.5rem 0', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
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
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1'
                  }}
                >
                  <Briefcase size={44} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>
                    Chưa có đơn ứng tuyển nào
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', maxWidth: '380px' }}>
                    Hãy khám phá các vị trí công việc đang mở tuyển và nộp hồ sơ để bắt đầu hành trình sự nghiệp nhé!
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
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem'
                      }}
                    >
                      {/* Job Title & Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                              {app.jobPosting?.title || 'Vị trí ứng tuyển'}
                            </h4>
                            {renderStatusBadge(app.status)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', fontSize: '0.8125rem', color: '#64748B', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Building size={14} color="#64748B" /> {app.jobPosting?.department?.name || 'Phòng ban chuyên môn'}
                            </span>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ backgroundColor: '#F1F5F9', padding: '1px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                              #{app.id.substring(0, 8).toUpperCase()}
                            </span>
                            {app.cvUrl && (
                              <>
                                <span style={{ color: '#CBD5E1' }}>•</span>
                                <a
                                  href={app.cvUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                                >
                                  <FileText size={13} /> Xem CV đính kèm
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* KHU VỰC LỊCH PHỎNG VẤN (CLEAN EVENT CARD - FLAT MODERN DESIGN) */}
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
                                  borderRadius: '10px',
                                  border: '1px solid #E2E8F0',
                                  borderLeft: isConfirmed 
                                    ? '4px solid #10B981' 
                                    : isDeclined || isCancelled || isExpired 
                                    ? '4px solid #EF4444' 
                                    : '4px solid #2563EB',
                                  backgroundColor: '#F8FAFC',
                                  padding: '1.15rem 1.25rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.85rem'
                                }}
                              >
                                {/* Header của Lịch phỏng vấn */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '6px',
                                      backgroundColor: isConfirmed ? '#ECFDF5' : '#EFF6FF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: isConfirmed ? '#059669' : '#2563EB'
                                    }}>
                                      <Calendar size={15} />
                                    </div>
                                    <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0F172A' }}>
                                      Lịch hẹn phỏng vấn: {inv.roundName}
                                    </span>
                                  </div>

                                  {/* Badge trạng thái */}
                                  {isPending && !isExpired && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                      <Clock size={12} /> Chờ xác nhận (còn {remainingHours}h {remainingMinutes}p)
                                    </span>
                                  )}
                                  {isPending && isExpired && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                                      <XCircle size={12} /> Quá hạn phản hồi (24h)
                                    </span>
                                  )}
                                  {isConfirmed && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                                      <CheckCircle2 size={12} /> Đã xác nhận tham gia
                                    </span>
                                  )}
                                  {isDeclined && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                                      <XCircle size={12} /> Đã từ chối lịch hẹn
                                    </span>
                                  )}
                                  {isCancelled && !isExpired && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                                      Đã hủy lịch phỏng vấn
                                    </span>
                                  )}
                                </div>

                                {/* Thông tin chi tiết lịch hẹn - PHẲNG, KHÔNG LỒNG HỘP */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                  gap: '1rem',
                                  padding: '0.75rem 0',
                                  borderTop: '1px solid #E2E8F0',
                                  borderBottom: '1px solid #E2E8F0'
                                }}>
                                  <div>
                                    <span style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Thời gian phỏng vấn</span>
                                    <span style={{ color: '#0F172A', fontSize: '0.875rem', fontWeight: 700, display: 'block', marginTop: '3px' }}>
                                      {new Date(inv.scheduledAt).toLocaleString('vi-VN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </span>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Hình thức / Địa điểm</span>
                                    <span style={{ color: '#2563EB', fontSize: '0.875rem', fontWeight: 600, display: 'block', marginTop: '3px', wordBreak: 'break-all' }}>
                                      {inv.location || 'Online Meeting (Google Meet)'}
                                    </span>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Người phỏng vấn (HR/Lead)</span>
                                    <span style={{ color: '#0F172A', fontSize: '0.875rem', fontWeight: 600, display: 'block', marginTop: '3px' }}>
                                      {inv.interviewerId}
                                    </span>
                                  </div>
                                </div>

                                {/* Ghi chú nếu đã xác nhận / từ chối */}
                                {inv.candidateResponse && (
                                  <div style={{ fontSize: '0.8125rem', color: isConfirmed ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                                    <span>Phản hồi của bạn: "{inv.candidateResponse}"</span>
                                  </div>
                                )}

                                {/* Nút thao tác xác nhận / từ chối */}
                                {isPending && !isExpired && (
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDeclineModal(inv, app)}
                                      className="btn btn-outline"
                                      style={{
                                        fontSize: '0.8125rem',
                                        padding: '0.45rem 0.95rem',
                                        height: '36px',
                                        borderRadius: '8px',
                                        color: '#DC2626',
                                        borderColor: '#FECACA'
                                      }}
                                    >
                                      Báo bận / Xin đổi lịch
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleConfirmInterview(inv.id)}
                                      className="btn btn-primary"
                                      style={{
                                        fontSize: '0.8125rem',
                                        padding: '0.45rem 1.15rem',
                                        height: '36px',
                                        borderRadius: '8px',
                                        backgroundColor: '#10B981',
                                        borderColor: '#10B981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                      }}
                                    >
                                      <CheckCircle2 size={15} /> Xác nhận tham gia
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* KHU VỰC THƯ MỜI NHẬN VIỆC (EXECUTIVE OFFER CARD - FLAT MODERN DESIGN) */}
                      {hasOffer && (() => {
                        const isOfferPending = offer.status === 'PENDING';
                        const offerExpiresAt = offer.expiresAt
                          ? new Date(offer.expiresAt)
                          : new Date(new Date(offer.createdAt || app.updatedAt || Date.now()).getTime() + 24 * 60 * 60 * 1000);
                        const offerRemainingMs = offerExpiresAt.getTime() - Date.now();
                        const offerRemainingHours = Math.max(0, Math.floor(offerRemainingMs / (1000 * 60 * 60)));
                        const offerRemainingMinutes = Math.max(0, Math.floor((offerRemainingMs % (1000 * 60 * 60)) / (1000 * 60)));
                        const isOfferExpired = (offerRemainingMs <= 0 && isOfferPending) || (offer.status === 'REJECTED' && offer.declineReason?.includes('24'));

                        return (
                          <div
                            style={{
                              borderRadius: '10px',
                              border: '1px solid #E2E8F0',
                              borderLeft: offer.status === 'ACCEPTED'
                                ? '4px solid #10B981'
                                : isOfferExpired
                                ? '4px solid #94A3B8'
                                : '4px solid #4F46E5',
                              backgroundColor: offer.status === 'ACCEPTED'
                                ? '#F0FDF4'
                                : isOfferExpired
                                ? '#F8FAFC'
                                : '#EEF2FF',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.85rem'
                            }}
                          >
                            {/* Banner Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '6px',
                                  backgroundColor: offer.status === 'ACCEPTED' ? '#DCFCE7' : isOfferExpired ? '#F1F5F9' : '#E0E7FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: offer.status === 'ACCEPTED' ? '#059669' : isOfferExpired ? '#64748B' : '#4338CA'
                                }}>
                                  <Award size={15} />
                                </div>
                                <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0F172A' }}>
                                  Thư mời nhận việc chính thức (Job Offer Letter)
                                </span>
                              </div>

                              {isOfferPending && !isOfferExpired && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                  <Clock size={12} /> Chờ phản hồi (còn {offerRemainingHours}h {offerRemainingMinutes}p)
                                </span>
                              )}
                              {isOfferExpired && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
                                  <Clock size={12} /> Đã quá hạn phản hồi (24h)
                                </span>
                              )}
                              {offer.status === 'ACCEPTED' && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                                  <CheckCircle2 size={12} /> Đã đồng ý tiếp nhận
                                </span>
                              )}
                              {offer.status === 'REJECTED' && !isOfferExpired && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                                  <XCircle size={12} /> Đã từ chối Offer
                                </span>
                              )}
                            </div>

                            {/* 3 Metric Summary - PHẲNG, TINH TẾ */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '1.25rem',
                              padding: '0.85rem 0',
                              borderTop: '1px solid rgba(203, 213, 225, 0.6)',
                              borderBottom: '1px solid rgba(203, 213, 225, 0.6)',
                              alignItems: 'baseline'
                            }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                                  Lương thỏa thuận
                                </span>
                                <div style={{ 
                                  fontSize: '1.25rem', 
                                  fontWeight: 800, 
                                  color: isOfferExpired ? '#64748B' : '#0F172A', 
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  gap: '4px'
                                }}>
                                  {Number(offer.baseSalary).toLocaleString('vi-VN')}
                                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>đ / tháng</span>
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                                  Ngày bắt đầu làm việc
                                </span>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                                  {offer.startDate ? new Date(offer.startDate).toLocaleDateString('vi-VN') : 'Thỏa thuận'}
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                                  Loại hợp đồng
                                </span>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                                  {offer.contractType === 'PROBATION' ? 'Thử việc (Hưởng 85% lương)' : offer.contractType || 'Thử việc'}
                                </div>
                              </div>
                            </div>

                            {offer.notes && (
                              <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>
                                "{offer.notes}"
                              </div>
                            )}

                            {/* Expired Notice - LỊCH SỰ, TRANG TRỌNG */}
                            {isOfferExpired && (
                              <div style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: '6px',
                                backgroundColor: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                fontSize: '0.8125rem',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <Clock size={15} style={{ flexShrink: 0, color: '#64748B' }} />
                                <span>Thư mời nhận việc đã hết thời hạn 24 giờ phản hồi và đã được lưu trữ tự động.</span>
                              </div>
                            )}

                            {/* Cảnh báo đếm ngược 24h nếu đang chờ xác nhận */}
                            {isOfferPending && !isOfferExpired && (
                              <div style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: '6px',
                                backgroundColor: '#FEF3C7',
                                border: '1px solid #FDE68A',
                                fontSize: '0.8rem',
                                color: '#92400E',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <Clock size={15} style={{ flexShrink: 0 }} />
                                <span>Vui lòng phản hồi trong vòng <strong>24 giờ</strong> (Còn lại: <strong>{offerRemainingHours}h {offerRemainingMinutes}p</strong>).</span>
                              </div>
                            )}

                            {/* ACTION BUTTONS */}
                            {isOfferPending && !isOfferExpired && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectOffer(app)}
                                  className="btn btn-outline"
                                  style={{
                                    fontSize: '0.8125rem',
                                    padding: '0.45rem 0.95rem',
                                    height: '36px',
                                    borderRadius: '8px',
                                    color: '#DC2626',
                                    borderColor: '#FECACA'
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
                                    padding: '0.45rem 1.15rem',
                                    height: '36px',
                                    borderRadius: '8px',
                                    backgroundColor: '#4F46E5',
                                    borderColor: '#4F46E5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  <CheckCircle2 size={15} /> Chấp nhận Offer & Khai báo thông tin
                                </button>
                              </div>
                            )}

                            {offer.status === 'ACCEPTED' && (
                              <div
                                style={{
                                  padding: '0.75rem 1rem',
                                  backgroundColor: '#ECFDF5',
                                  borderRadius: '8px',
                                  border: '1px solid #A7F3D0',
                                  fontSize: '0.8125rem',
                                  color: '#065F46',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <ShieldCheck size={17} style={{ flexShrink: 0 }} />
                                <span>
                                  Hồ sơ tiếp nhận đã gửi thành công! Vui lòng có mặt tại văn phòng vào{' '}
                                  <strong>{new Date(offer.startDate).toLocaleDateString('vi-VN')}</strong>.
                                </span>
                              </div>
                            )}

                            {offer.status === 'REJECTED' && offer.declineReason && (
                              <div style={{ fontSize: '0.8125rem', color: '#991B1B' }}>
                                Lý do bạn từ chối: {offer.declineReason}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Báo bận / Xin đổi lịch phỏng vấn */}
      {interviewDeclineModal.isOpen && createPortal(
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !interviewDeclineModal.submitting) {
              setInterviewDeclineModal(prev => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, #FFFBEB, #FFFFFF)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                    flexShrink: 0
                  }}
                >
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Báo bận & Đề xuất đổi lịch phỏng vấn
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Gửi phản hồi đến Hội đồng tuyển dụng để sắp xếp lại thời gian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInterviewDeclineModal(prev => ({ ...prev, isOpen: false }))}
                disabled={interviewDeclineModal.submitting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div
              className="custom-scrollbar"
              style={{
                padding: '1.25rem 1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Thẻ tóm tắt lịch hẹn hiện tại */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8125rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {interviewDeclineModal.interview?.name || 'Buổi phỏng vấn'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {interviewDeclineModal.app?.jobPosting?.title}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>
                      {interviewDeclineModal.interview?.scheduledAt
                        ? new Date(interviewDeclineModal.interview.scheduledAt).toLocaleString('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : '--'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={14} />
                    <span>{interviewDeclineModal.interview?.location || 'Google Meet'}</span>
                  </div>
                </div>
              </div>

              {/* Lựa chọn loại yêu cầu */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Bạn muốn phản hồi như thế nào?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectDeclineActionType('RESCHEDULE')}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '0.625rem',
                      border: '2px solid',
                      borderColor: interviewDeclineModal.actionType === 'RESCHEDULE' ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: interviewDeclineModal.actionType === 'RESCHEDULE' ? 'rgba(37, 99, 235, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <RotateCcw size={16} color={interviewDeclineModal.actionType === 'RESCHEDULE' ? 'var(--primary)' : 'var(--text-muted)'} />
                      <strong style={{ fontSize: '0.8125rem', color: interviewDeclineModal.actionType === 'RESCHEDULE' ? 'var(--primary)' : 'var(--text-main)' }}>
                        Xin dời sang lịch khác
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      (Đề xuất thời gian rảnh để giữ cơ hội)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDeclineActionType('DECLINE')}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '0.625rem',
                      border: '2px solid',
                      borderColor: interviewDeclineModal.actionType === 'DECLINE' ? 'var(--error)' : 'var(--border)',
                      backgroundColor: interviewDeclineModal.actionType === 'DECLINE' ? 'rgba(239, 68, 68, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <XCircle size={16} color={interviewDeclineModal.actionType === 'DECLINE' ? 'var(--error)' : 'var(--text-muted)'} />
                      <strong style={{ fontSize: '0.8125rem', color: interviewDeclineModal.actionType === 'DECLINE' ? 'var(--error)' : 'var(--text-main)' }}>
                        Từ chối tham gia
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      (Hủy bỏ buổi phỏng vấn này)
                    </span>
                  </button>
                </div>
              </div>

              {/* Gợi ý lý do nhanh (Quick chips) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Lý do chính (chọn nhanh):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(interviewDeclineModal.actionType === 'RESCHEDULE'
                    ? [
                        'Trùng lịch làm việc / công tác đột xuất',
                        'Trùng lịch thi cử / bảo vệ đồ án',
                        'Có việc gia đình đột xuất',
                        'Sức khỏe không đảm bảo'
                      ]
                    : [
                        'Đã nhận offer phù hợp từ công ty khác',
                        'Định hướng công việc cá nhân thay đổi',
                        'Khoảng cách địa lý không phù hợp',
                        'Không thể sắp xếp thời gian tham gia'
                      ]
                  ).map(reason => {
                    const isSelected = interviewDeclineModal.quickReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => handleSelectQuickReason(reason)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--primary)' : '#CBD5E1',
                          backgroundColor: isSelected ? 'var(--primary)' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isSelected && '✓ '}
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nếu là XIN DỜI LỊCH: Nhập ngày & khung giờ đề xuất */}
              {interviewDeclineModal.actionType === 'RESCHEDULE' && (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    🗓️ Thời gian bạn có thể tham gia (Đề xuất):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Ngày đề xuất
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="form-input w-full bg-white"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                        value={interviewDeclineModal.proposedDate}
                        onChange={e => setInterviewDeclineModal(prev => ({ ...prev, proposedDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Khung giờ thuận tiện
                      </label>
                      <select
                        className="form-input w-full bg-white"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                        value={interviewDeclineModal.proposedTimeSlot}
                        onChange={e => setInterviewDeclineModal(prev => ({ ...prev, proposedTimeSlot: e.target.value }))}
                      >
                        <option value="MORNING">Buổi sáng (09:00 - 11:30)</option>
                        <option value="AFTERNOON">Buổi chiều (14:00 - 17:30)</option>
                        <option value="AFTER_HOURS">Sau giờ hành chính (Sau 17:30)</option>
                        <option value="ANY">Linh hoạt theo lịch của HR</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Lời nhắn gửi HR / Hội đồng phỏng vấn */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Lời nhắn gửi Hội đồng tuyển dụng:
                </label>
                <textarea
                  className="form-input w-full bg-white"
                  rows={3}
                  style={{ fontSize: '0.8125rem', resize: 'vertical' }}
                  placeholder="Nhập thêm chi tiết hoặc lời nhắn để HR tiện sắp xếp..."
                  value={interviewDeclineModal.notes}
                  onChange={e => setInterviewDeclineModal(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                onClick={() => setInterviewDeclineModal(prev => ({ ...prev, isOpen: false }))}
                className="btn btn-outline"
                disabled={interviewDeclineModal.submitting}
                style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleSubmitDeclineInterview}
                className="btn btn-primary"
                disabled={interviewDeclineModal.submitting}
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.5rem 1.25rem',
                  backgroundColor: interviewDeclineModal.actionType === 'RESCHEDULE' ? '#D97706' : 'var(--error)',
                  borderColor: interviewDeclineModal.actionType === 'RESCHEDULE' ? '#D97706' : 'var(--error)'
                }}
              >
                {interviewDeclineModal.submitting ? (
                  'Đang gửi...'
                ) : (
                  <>
                    <Send size={15} />
                    {interviewDeclineModal.actionType === 'RESCHEDULE' ? 'Gửi đề xuất dời lịch' : 'Xác nhận từ chối'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Từ chối Offer */}
      {offerRejectModal.isOpen && createPortal(
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !offerRejectModal.submitting) {
              setOfferRejectModal(prev => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, #FEF2F2, #FFFFFF)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--error)'
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Từ chối Thư mời nhận việc (Offer)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {offerRejectModal.app?.jobPosting?.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfferRejectModal(prev => ({ ...prev, isOpen: false }))}
                disabled={offerRejectModal.submitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  fontSize: '0.8rem',
                  color: '#991B1B'
                }}
              >
                ⚠️ <strong>Lưu ý:</strong> Quyết định từ chối Offer là cuối cùng và không thể hoàn tác. Quá trình ứng tuyển cho vị trí này sẽ kết thúc.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Lý do chính (chọn nhanh):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[
                    'Đã nhận được lời mời làm việc phù hợp hơn',
                    'Chế độ đãi ngộ chưa đạt kỳ vọng',
                    'Thời gian bắt đầu làm việc chưa phù hợp',
                    'Định hướng công việc cá nhân thay đổi'
                  ].map(reason => {
                    const isSelected = offerRejectModal.quickReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setOfferRejectModal(prev => ({ ...prev, quickReason: reason }))}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--error)' : '#CBD5E1',
                          backgroundColor: isSelected ? 'var(--error)' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected && '✓ '}
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Lời nhắn gửi Quý công ty:
                </label>
                <textarea
                  className="form-input w-full bg-white"
                  rows={3}
                  style={{ fontSize: '0.8125rem' }}
                  value={offerRejectModal.notes}
                  onChange={e => setOfferRejectModal(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                onClick={() => setOfferRejectModal(prev => ({ ...prev, isOpen: false }))}
                className="btn btn-outline"
                disabled={offerRejectModal.submitting}
                style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
              >
                Suy nghĩ lại
              </button>
              <button
                type="button"
                onClick={handleSubmitRejectOffer}
                className="btn btn-primary"
                disabled={offerRejectModal.submitting}
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.5rem 1.25rem',
                  backgroundColor: 'var(--error)',
                  borderColor: 'var(--error)'
                }}
              >
                {offerRejectModal.submitting ? 'Đang xử lý...' : 'Xác nhận từ chối Offer'}
              </button>
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
