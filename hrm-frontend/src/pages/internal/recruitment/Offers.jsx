import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle,
  X,
  Search,
  FileText,
  UserCheck,
  Send,
  Eye,
  Calendar,
  CreditCard,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  User
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Offers = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      .then((res) => setCandidates(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Tiếp nhận nhân sự khi ứng viên đến nhận việc (1-click confirmation)
  const handleOpenOnboard = async (candidate) => {
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
            <div>• Lương thỏa thuận: <strong>${candidate.offer ? Number(candidate.offer.baseSalary).toLocaleString('vi-VN') + ' đ' : 'Chưa có'}</strong></div>
            <div>• Loại hợp đồng: <strong>${contractLabel}</strong></div>
          </div>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0;">
            ⚡ <em>Hệ thống sẽ tự động cấp Mã nhân sự mới, đồng bộ hồ sơ nhân thân đã khai và chuyển ngay vào phân hệ <strong>Hội nhập (Onboarding)</strong>.</em>
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✓ Tiếp nhận & Bắt đầu Onboarding',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#94a3b8'
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
      notes: candidate.offer?.notes || 'Chào mừng bạn gia nhập đội ngũ Công ty TNHH LLA!'
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
      cancelButtonText: 'Không'
    });
    if (!result.isConfirmed) return;

    axios
      .post(`http://localhost:5000/api/offers/${candidateId}/reject`)
      .then(() => {
        toast.success('Đã hủy Offer.');
        fetchOffers();
      })
      .catch((err) => toast.error('Lỗi khi từ chối Offer'));
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Quản lý Offer & Tiếp nhận</h1>
          <p className="page-subtitle">
            Theo dõi thỏa thuận tuyển dụng hai chiều và kích hoạt hồ sơ nhân sự mới
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email ứng viên..."
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách Offer...</div>
        ) : filteredCandidates.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Briefcase size={40} color="var(--border)" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '1rem' }}>Chưa có ứng viên nào</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Không có ứng viên nào đang ở vòng chốt Offer.</p>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Ứng viên</th>
                <th style={{ width: '22%' }}>Vị trí tuyển dụng</th>
                <th style={{ width: '20%' }}>Gói Thỏa thuận Offer</th>
                <th style={{ width: '18%' }}>Phản hồi Ứng viên</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => {
                const offer = c.offer;
                const po = c.preOnboarding;
                const isAccepted = offer?.status === 'ACCEPTED';
                const isRejected = offer?.status === 'REJECTED';
                const isPending = offer?.status === 'PENDING';

                return (
                  <tr key={c.id}>
                    {/* Cột 1: Ứng viên */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)', fontWeight: 700 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                          {c.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Vị trí & Phòng ban */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.jobPosting?.title}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                          <Building size={11} style={{ marginRight: '2px' }} />
                          {c.jobPosting?.department?.name || 'Chưa rõ'}
                        </span>
                      </div>
                    </td>

                    {/* Cột 3: Gói Offer */}
                    <td>
                      {offer ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>
                            {Number(offer.baseSalary).toLocaleString('vi-VN')} đ
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Ngày bắt đầu: {new Date(offer.startDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-gray">Chưa tạo Offer</span>
                      )}
                    </td>

                    {/* Cột 4: Trạng thái phản hồi */}
                    <td>
                      {isAccepted ? (
                        <div>
                          <span className="badge badge-success" style={{ fontWeight: 600 }}>
                            <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Đã đồng ý Offer
                          </span>
                          {po && (
                            <button
                              onClick={() => handleViewProfile(c)}
                              style={{
                                display: 'block',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--primary)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: '0.35rem',
                                padding: 0
                              }}
                            >
                              👁️ Xem hồ sơ tự khai
                            </button>
                          )}
                        </div>
                      ) : isRejected ? (
                        <div>
                          <span className="badge badge-error" style={{ fontWeight: 600 }}>
                            <XCircle size={12} style={{ marginRight: '4px' }} /> {offer?.declineReason?.includes('24') ? 'Quá hạn 24h (Tự hủy)' : 'Ứng viên từ chối'}
                          </span>
                          {offer?.declineReason && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '0.2rem', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={offer.declineReason}>
                              {offer.declineReason}
                            </div>
                          )}
                        </div>
                      ) : isPending ? (
                        <div>
                          <span className="badge badge-warning" style={{ fontWeight: 600 }}>
                            <Clock size={12} style={{ marginRight: '4px' }} /> Chờ phản hồi (24h)
                          </span>
                          {offer?.expiresAt && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Hạn: {new Date(offer.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(offer.expiresAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-gray">Chờ gửi thư</span>
                      )}
                    </td>

                    {/* Cột 5: Thao tác */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {isAccepted ? (
                          <button
                            onClick={() => handleOpenOnboard(c)}
                            className="btn btn-primary"
                            style={{
                              height: '32px',
                              padding: '0 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: 'var(--success)',
                              borderColor: 'var(--success)'
                            }}
                          >
                            <UserCheck size={14} /> Tiếp nhận NV
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSendOffer(c)}
                            className="btn btn-outline"
                            style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 500 }}
                          >
                            <Send size={13} /> {offer ? 'Sửa Offer' : 'Gửi Offer'}
                          </button>
                        )}

                        <button
                          onClick={() => handleReject(c.id)}
                          title="Hủy Offer"
                          className="btn btn-outline"
                          style={{
                            height: '32px',
                            padding: '0 0.5rem',
                            color: 'var(--error)',
                            borderColor: 'var(--border)'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>



      {/* 2. Modal Xem Hồ sơ tự khai Pre-Onboarding */}
      {showViewProfileModal && viewingProfile && createPortal(
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
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
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Hồ sơ Ứng viên Tự khai báo
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ứng viên: <strong>{viewingProfile.name}</strong> • Email: {viewingProfile.email}
                </p>
              </div>
              <button onClick={() => setShowViewProfileModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Nhóm 1: Nhân thân */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-main)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. Thông tin cá nhân & Giấy tờ
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Số CCCD / CMND:</span> <strong>{viewingProfile.preOnboarding?.cccd || '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Ngày sinh:</span> <strong>{viewingProfile.preOnboarding?.dateOfBirth ? new Date(viewingProfile.preOnboarding.dateOfBirth).toLocaleDateString('vi-VN') : '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Giới tính:</span> <strong>{viewingProfile.preOnboarding?.gender === 'MALE' ? 'Nam' : viewingProfile.preOnboarding?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Tình trạng hôn nhân:</span> <strong>{viewingProfile.preOnboarding?.maritalStatus || 'Độc thân'}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Địa chỉ thường trú:</span> <strong>{viewingProfile.preOnboarding?.address || '--'}</strong></div>
                </div>
              </div>

              {/* Nhóm 2: Ngân hàng & Thuế */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-main)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Tài khoản nhận lương & Mã số thuế
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Ngân hàng:</span> <strong>{viewingProfile.preOnboarding?.bankName || '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Số tài khoản:</span> <strong>{viewingProfile.preOnboarding?.bankAccount || '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Mã số thuế:</span> <strong>{viewingProfile.preOnboarding?.taxCode || '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Mã số BHXH:</span> <strong>{viewingProfile.preOnboarding?.socialInsurance || '--'}</strong></div>
                </div>
              </div>

              {/* Nhóm 3: Khẩn cấp */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-main)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Người liên hệ khẩn cấp
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Họ tên:</span> <strong>{viewingProfile.preOnboarding?.emergencyContactName || '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Quan hệ:</span> <strong>{viewingProfile.preOnboarding?.emergencyContactRelation || '--'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>SĐT:</span> <strong>{viewingProfile.preOnboarding?.emergencyContactPhone || '--'}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-muted)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowViewProfileModal(false)} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>Đóng</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. Modal Tạo / Gửi Offer */}
      {showSendOfferModal && selectedCandidate && createPortal(
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowSendOfferModal(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Gửi Thư mời nhận việc (Offer)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ứng viên: <strong>{selectedCandidate.name}</strong> • {selectedCandidate.jobPosting?.title}
                </p>
              </div>
              <button onClick={() => setShowSendOfferModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendOfferSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#FFF7ED',
                    borderRadius: '0.5rem',
                    border: '1px dashed #FDBA74',
                    fontSize: '0.8rem',
                    color: '#C2410C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Clock size={18} style={{ flexShrink: 0 }} />
                  <span>
                    ⏰ <strong>Thời hạn phản hồi 24h:</strong> Hệ thống giới hạn thời gian phản hồi Offer trong <strong>24 giờ</strong> kể từ thời điểm gửi. Nếu sau 24h ứng viên không phản hồi, thư mời sẽ tự động bị hủy.
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                      {Number(offerForm.baseSalary || 0).toLocaleString('vi-VN')} đ/tháng
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Mặc định 85%
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
                      className="form-select"
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
                    className="form-textarea"
                    value={offerForm.notes}
                    onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-muted)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSendOfferModal(false)} className="btn btn-outline" disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 600 }} disabled={isSubmitting}>
                  <Send size={15} /> {isSubmitting ? 'Đang gửi...' : 'Gửi Offer tới Ứng viên'}
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
