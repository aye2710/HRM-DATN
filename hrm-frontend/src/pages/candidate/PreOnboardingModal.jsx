import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle,
  UserCheck,
  CreditCard,
  Phone,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const PreOnboardingModal = ({ isOpen, onClose, candidate, offer, onSuccess }) => {
  const [step, setStep] = useState(1); // Step 1: Personal info, Step 2: Financial & Emergency
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    cccd: '',
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
    nationality: 'Việt Nam',
    maritalStatus: 'SINGLE',
    taxCode: '',
    bankName: 'Vietcombank',
    bankAccount: '',
    socialInsurance: '',
    healthInsurance: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Bố/Mẹ'
  });

  if (!isOpen || !candidate) return null;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.cccd || !formData.dateOfBirth || !formData.address) {
      return toast.error('Vui lòng điền số CCCD, ngày sinh và địa chỉ thường trú.');
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('candidateToken');
    if (!token) {
      return toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/candidate-auth/offers/${candidate.id}/accept`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(res.data.message || 'Chúc mừng bạn đã chấp nhận Offer và hoàn tất hồ sơ!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(to right, rgba(34, 197, 94, 0.05), rgba(37, 99, 235, 0.03))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success" style={{ fontWeight: 600 }}>Pre-Onboarding</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Khai báo thông tin Tiếp nhận
              </h3>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ứng viên: <strong>{candidate.name}</strong> • Vị trí: <strong>{candidate.jobPosting?.title}</strong>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Tracker Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--bg-muted)'
          }}
        >
          <div
            onClick={() => setStep(1)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              color: step === 1 ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: step === 1 ? '#FFFFFF' : 'transparent',
              borderBottom: step === 1 ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: step === 1 ? 'var(--primary)' : 'var(--border)',
                color: '#fff',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              1
            </span>
            Thông tin Cá nhân & Giấy tờ
          </div>

          <div
            onClick={() => {
              if (formData.cccd && formData.dateOfBirth && formData.address) setStep(2);
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: formData.cccd ? 'pointer' : 'not-allowed',
              color: step === 2 ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: step === 2 ? '#FFFFFF' : 'transparent',
              borderBottom: step === 2 ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: step === 2 ? 'var(--primary)' : 'var(--border)',
                color: '#fff',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              2
            </span>
            Tài khoản Nhận lương & Khẩn cấp
          </div>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }} className="custom-scrollbar">
          {step === 1 ? (
            <form id="step1-form" onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: 'rgba(34, 197, 94, 0.06)',
                  borderRadius: '0.625rem',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem'
                }}
              >
                <HeartHandshake size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                <span>
                  Vui lòng cung cấp chính xác thông tin pháp lý bên dưới để phòng Nhân sự chuẩn bị hồ sơ và hợp đồng lao động trước ngày bạn đến công ty.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Số CCCD / CMND <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12 chữ số trên thẻ căn cước"
                    className="form-input"
                    value={formData.cccd}
                    onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Ngày tháng năm sinh <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Giới tính</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { val: 'MALE', label: 'Nam' },
                      { val: 'FEMALE', label: 'Nữ' },
                      { val: 'OTHER', label: 'Khác' }
                    ].map((g) => (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g.val })}
                        style={{
                          flex: 1,
                          height: '38px',
                          border: '1px solid',
                          borderColor: formData.gender === g.val ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: formData.gender === g.val ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                          color: formData.gender === g.val ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: formData.gender === g.val ? 600 : 400,
                          borderRadius: '0.375rem',
                          fontSize: '0.8125rem',
                          cursor: 'pointer'
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tình trạng hôn nhân</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { val: 'SINGLE', label: 'Độc thân' },
                      { val: 'MARRIED', label: 'Đã kết hôn' }
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, maritalStatus: m.val })}
                        style={{
                          flex: 1,
                          height: '38px',
                          border: '1px solid',
                          borderColor: formData.maritalStatus === m.val ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: formData.maritalStatus === m.val ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                          color: formData.maritalStatus === m.val ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: formData.maritalStatus === m.val ? 600 : 400,
                          borderRadius: '0.375rem',
                          fontSize: '0.8125rem',
                          cursor: 'pointer'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Địa chỉ thường trú / Nơi ở hiện tại <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </form>
          ) : (
            <form id="step2-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Thông tin Tài khoản nhận lương
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ngân hàng nhận lương</label>
                    <select
                      className="form-select"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    >
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="MBBank">MBBank (Quân Đội)</option>
                      <option value="ACB">ACB (Á Châu)</option>
                      <option value="VPBank">VPBank</option>
                      <option value="VietinBank">VietinBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="TPBank">TPBank</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Số tài khoản ngân hàng</label>
                    <input
                      type="text"
                      placeholder="Số tài khoản chính chủ"
                      className="form-input"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mã số thuế cá nhân (nếu có)</label>
                    <input
                      type="text"
                      placeholder="10 hoặc 13 chữ số"
                      className="form-input"
                      value={formData.taxCode}
                      onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mã số BHXH (nếu có)</label>
                    <input
                      type="text"
                      placeholder="Số sổ BHXH"
                      className="form-input"
                      value={formData.socialInsurance}
                      onChange={(e) => setFormData({ ...formData, socialInsurance: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Thông tin Liên hệ khẩn cấp
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Họ tên người thân</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn B"
                      className="form-input"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mối quan hệ</label>
                    <input
                      type="text"
                      placeholder="Bố / Mẹ / Vợ / ..."
                      className="form-input"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="0987654321"
                      className="form-input"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-outline"
              style={{ fontSize: '0.8125rem' }}
            >
              <ArrowLeft size={16} /> Quay lại Bước 1
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ fontSize: '0.8125rem' }}
            >
              Xem lại sau
            </button>
          )}

          {step === 1 ? (
            <button
              type="submit"
              form="step1-form"
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
            >
              Tiếp tục sang Bước 2 <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              form="step2-form"
              disabled={loading}
              className="btn btn-primary"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: 'var(--success)',
                borderColor: 'var(--success)',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
              }}
            >
              {loading ? 'Đang gửi hồ sơ...' : (
                <>
                  <CheckCircle size={16} /> Hoàn tất & Chấp nhận Offer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
