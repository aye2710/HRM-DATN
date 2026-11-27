import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  FileText,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Briefcase,
  CreditCard,
  HeartHandshake,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { DateInput } from '../../components/common/DateInput';

import { API_BASE_URL as ROOT_API_URL } from '../../services/api';
const API_BASE_URL = `${ROOT_API_URL}/api`;

export const CandidateMagicResponse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Trạng thái thao tác Interview
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    proposedDate: '',
    proposedTimeSlot: 'AFTERNOON',
    reason: 'Trùng lịch làm việc / công tác đột xuất',
    notes: ''
  });
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('Đã nhận được offer phù hợp từ công ty khác');

  // Trạng thái thao tác Offer
  const [offerStep, setOfferStep] = useState(1);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [showOfferReject, setShowOfferReject] = useState(false);
  const [offerRejectReason, setOfferRejectReason] = useState('Đã nhận được lời mời làm việc phù hợp hơn');
  const [offerRejectNotes, setOfferRejectNotes] = useState('');

  const [preOnboardingForm, setPreOnboardingForm] = useState({
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

  // Tải dữ liệu từ Magic Token
  const fetchMagicData = async () => {
    if (!token) {
      setErrorMsg('Thiếu mã phản hồi bảo mật (Token). Vui lòng nhấp vào liên kết gửi trong email của bạn.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE_URL}/candidate-auth/magic-respond/${token}`);
      setData(res.data);
      // Điền sẵn form nếu đã có dữ liệu preOnboarding trước đó
      if (res.data?.preOnboarding) {
        const po = res.data.preOnboarding;
        setPreOnboardingForm(prev => ({
          ...prev,
          cccd: po.cccd || '',
          gender: po.gender || 'MALE',
          dateOfBirth: po.dateOfBirth ? po.dateOfBirth.split('T')[0] : '',
          address: po.address || '',
          nationality: po.nationality || 'Việt Nam',
          maritalStatus: po.maritalStatus || 'SINGLE',
          taxCode: po.taxCode || '',
          bankName: po.bankName || 'Vietcombank',
          bankAccount: po.bankAccount || '',
          socialInsurance: po.socialInsurance || '',
          healthInsurance: po.healthInsurance || '',
          emergencyContactName: po.emergencyContactName || '',
          emergencyContactPhone: po.emergencyContactPhone || '',
          emergencyContactRelation: po.emergencyContactRelation || 'Bố/Mẹ'
        }));
      }
    } catch (err) {
      console.error('Fetch magic response error:', err);
      const msg = err.response?.data?.error || 'Liên kết phản hồi đã hết hạn hoặc không hợp lệ.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagicData();
  }, [token]);

  // Tính thời gian còn lại (SLA)
  const remainingTimeStr = useMemo(() => {
    const targetExpiresAt = data?.interview?.expiresAt || data?.offer?.expiresAt;
    if (!targetExpiresAt) return null;

    const diff = new Date(targetExpiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Đã hết hạn';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} giờ ${minutes} phút`;
  }, [data]);

  // Format ngày giờ hiển thị
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // 1. Phản hồi Lịch phỏng vấn: XÁC NHẬN
  const handleConfirmInterview = async () => {
    setInterviewSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/candidate-auth/magic-respond/${token}`, {
        action: 'CONFIRM',
        candidateNotes: interviewNotes || 'Ứng viên xác nhận tham gia đúng giờ qua email'
      });
      toast.success(res.data.message || 'Xác nhận tham gia thành công!');
      setSuccessMsg(res.data.message || 'Xác nhận tham gia thành công!');
      fetchMagicData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi xác nhận.');
    } finally {
      setInterviewSubmitting(false);
    }
  };

  // 2. Phản hồi Lịch phỏng vấn: ĐỔI LỊCH
  const handleSubmitReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleData.proposedDate) {
      return toast.error('Vui lòng chọn ngày mong muốn dời lịch.');
    }

    setInterviewSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/candidate-auth/magic-respond/${token}`, {
        action: 'RESCHEDULE',
        reason: rescheduleData.reason,
        proposedDate: rescheduleData.proposedDate,
        proposedTimeSlot: rescheduleData.proposedTimeSlot,
        candidateNotes: rescheduleData.notes
      });
      toast.success(res.data.message || 'Đã gửi đề xuất dời lịch đến HR!');
      setSuccessMsg(res.data.message || 'Đã gửi đề xuất dời lịch thành công!');
      setShowReschedule(false);
      fetchMagicData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi gửi đề xuất.');
    } finally {
      setInterviewSubmitting(false);
    }
  };

  // 3. Phản hồi Lịch phỏng vấn: TỪ CHỐI
  const handleSubmitDecline = async (e) => {
    e.preventDefault();
    setInterviewSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/candidate-auth/magic-respond/${token}`, {
        action: 'DECLINE',
        reason: declineReason,
        candidateNotes: interviewNotes
      });
      toast.success(res.data.message || 'Đã ghi nhận phản hồi từ chối.');
      setSuccessMsg(res.data.message || 'Đã ghi nhận phản hồi từ chối lịch phỏng vấn.');
      setShowDecline(false);
      fetchMagicData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi từ chối lịch phỏng vấn.');
    } finally {
      setInterviewSubmitting(false);
    }
  };

  // 4. Phản hồi Offer: ĐỒNG Ý & NỘP HỒ SƠ PRE-ONBOARDING
  const handleSubmitAcceptOffer = async (e) => {
    e.preventDefault();

    // Validate CCCD 12 số
    const cleanCccd = String(preOnboardingForm.cccd || '').trim();
    if (!/^\d{12}$/.test(cleanCccd)) {
      return toast.error('Số CCCD gắn chip không hợp lệ. Vui lòng nhập chính xác 12 chữ số.');
    }

    if (!preOnboardingForm.dateOfBirth || !preOnboardingForm.address?.trim()) {
      return toast.error('Vui lòng điền ngày sinh và địa chỉ thường trú.');
    }

    if (!preOnboardingForm.bankName?.trim() || !preOnboardingForm.bankAccount?.trim()) {
      return toast.error('Vui lòng điền tên ngân hàng và số tài khoản chính chủ để nhận lương.');
    }

    if (!preOnboardingForm.emergencyContactName?.trim() || !preOnboardingForm.emergencyContactPhone?.trim()) {
      return toast.error('Vui lòng điền thông tin người liên hệ khẩn cấp.');
    }

    setOfferSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/candidate-auth/magic-respond/${token}`, {
        action: 'ACCEPT',
        ...preOnboardingForm
      });
      toast.success(res.data.message || 'Chúc mừng bạn đã đồng ý nhận việc!');
      setSuccessMsg(res.data.message || 'Chúc mừng bạn đã đồng ý Offer và hoàn tất hồ sơ tiếp nhận!');
      fetchMagicData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi chấp nhận Offer.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  // 5. Phản hồi Offer: TỪ CHỐI
  const handleSubmitRejectOffer = async (e) => {
    e.preventDefault();
    const finalReason = `Lý do: ${offerRejectReason}. Lời nhắn: ${offerRejectNotes}`.trim();
    setOfferSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/candidate-auth/magic-respond/${token}`, {
        action: 'REJECT',
        declineReason: finalReason
      });
      toast.success(res.data.message || 'Đã ghi nhận phản hồi từ chối Offer.');
      setSuccessMsg(res.data.message || 'Bạn đã từ chối Thư mời nhận việc này.');
      setShowOfferReject(false);
      fetchMagicData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi từ chối Offer.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-base">Đang tải thông tin phản hồi từ hệ thống LLA...</p>
        <p className="text-slate-400 text-xs mt-1">Xác thực mã bảo mật một chạm (One-click token)</p>
      </div>
    );
  }

  // Error / Expired View
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Liên kết không khả dụng</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{errorMsg}</p>
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
            >
              Về Trang chủ Tuyển dụng
            </Link>
            <Link
              to="/candidate/login"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
            >
              Đăng nhập Cổng Ứng viên LLA
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { type, expired, interview, offer, candidate } = data || {};

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
              LLA
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">CÔNG TY TNHH LLA</h1>
              <p className="text-xs text-slate-500 font-medium">Hệ thống Phản hồi Tuyển dụng Trực tuyến (One-Click Response)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 transition"
            >
              <ExternalLink size={14} /> Trang tin Tuyển dụng
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/candidate/login"
              className="text-xs text-blue-600 hover:underline font-semibold transition"
            >
              Đăng nhập Cổng hồ sơ
            </Link>
          </div>
        </div>

        {/* SLA / Expiration Banner */}
        {remainingTimeStr && (
          <div className={`rounded-xl p-4 flex items-center justify-between text-sm ${
            expired || remainingTimeStr === 'Đã hết hạn'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <Clock size={18} className={expired ? 'text-red-600' : 'text-amber-600'} />
              <span>
                {expired || remainingTimeStr === 'Đã hết hạn'
                  ? 'Liên kết này đã quá hạn thời gian 24 giờ phản hồi.'
                  : `Thời hạn phản hồi tự động còn lại: `}
                <strong>{remainingTimeStr !== 'Đã hết hạn' && remainingTimeStr}</strong>
              </span>
            </div>
            <span className="text-xs bg-white/80 py-1 px-2.5 rounded-md font-semibold border border-current">
              SLA: 24 Giờ
            </span>
          </div>
        )}

        {/* Candidate Info Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Ứng viên nhận thư</span>
              <h2 className="text-xl font-bold text-slate-800">{candidate?.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Vị trí ứng tuyển</span>
              <p className="text-sm font-bold text-slate-700">{candidate?.jobTitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <Mail size={15} className="text-blue-500 shrink-0" />
              <span className="truncate">{candidate?.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <Phone size={15} className="text-emerald-500 shrink-0" />
              <span>{candidate?.phone || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <Building2 size={15} className="text-purple-500 shrink-0" />
              <span className="truncate">{candidate?.department}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CASE 1: THƯ MỜI PHỎNG VẤN (INTERVIEW RESPONSE) */}
        {/* ========================================================================= */}
        {type === 'INTERVIEW' && interview && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-white/20 text-xs font-bold py-1 px-3 rounded-full backdrop-blur-sm">
                  {interview.roundName || 'Vòng phỏng vấn'}
                </span>
                <span className="text-xs text-blue-100">Mã lịch hẹn: #{interview.id?.slice(0, 8)}</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Thư Mời Tham Dự Phỏng Vấn</h3>
              <p className="text-blue-100 text-sm mt-1">
                Kính mời bạn xác nhận tham dự buổi phỏng vấn trực tiếp hoặc đề xuất đổi lịch phù hợp.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Chi tiết lịch hẹn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                    <Clock size={16} /> Thời gian phỏng vấn
                  </div>
                  <div className="text-base font-bold text-slate-800">
                    {formatDateTime(interview.scheduledAt)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                    <MapPin size={16} /> Địa điểm / Hình thức
                  </div>
                  <div className="text-base font-bold text-slate-800">
                    {interview.location || 'Trực tuyến (Google Meet / Zoom)'}
                  </div>
                </div>
              </div>

              {/* TRẠNG THÁI HIỆN TẠI NẾU ĐÃ PHẢN HỒI HOẶC BỊ HỦY */}
              {interview.status === 'CONFIRMED' && (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-base">Bạn đã xác nhận tham gia phỏng vấn</h4>
                    <p className="text-sm text-emerald-700 mt-1">
                      {interview.candidateResponse || 'Ứng viên đã xác nhận tham gia đúng giờ.'}
                    </p>
                    <p className="text-xs text-emerald-600 mt-2">
                      Đã ghi nhận lúc: {formatDateTime(interview.respondedAt)}
                    </p>
                  </div>
                </div>
              )}

              {interview.status === 'DECLINED' && (
                <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
                  <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-base">Bạn đã gửi phản hồi đổi lịch / báo bận</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      {interview.candidateResponse || 'Ứng viên báo bận / xin đổi lịch.'}
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      Đã ghi nhận lúc: {formatDateTime(interview.respondedAt)}
                    </p>
                  </div>
                </div>
              )}

              {interview.status === 'CANCELLED' && (
                <div className="p-5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
                  <XCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-base">Lịch hẹn đã bị hủy</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {interview.candidateResponse || 'Lịch phỏng vấn này đã bị hủy hoặc quá hạn 24 giờ phản hồi.'}
                    </p>
                  </div>
                </div>
              )}

              {/* NẾU ĐANG CHỜ PHẢN HỒI (PENDING_CONFIRMATION) */}
              {interview.status === 'PENDING_CONFIRMATION' && !expired && (
                <div className="space-y-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Lời nhắn gửi Bộ phận Tuyển dụng (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      placeholder="VD: Em xin phép tham gia đúng giờ và đã chuẩn bị đầy đủ thiết bị..."
                      className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Nút hành động */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      disabled={interviewSubmitting}
                      onClick={handleConfirmInterview}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      {interviewSubmitting ? 'Đang lưu...' : 'Xác nhận tham gia'}
                    </button>

                    <button
                      type="button"
                      disabled={interviewSubmitting}
                      onClick={() => setShowReschedule(true)}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <Calendar size={18} /> Đề xuất dời lịch
                    </button>

                    <button
                      type="button"
                      disabled={interviewSubmitting}
                      onClick={() => setShowDecline(true)}
                      className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <XCircle size={18} /> Từ chối
                    </button>
                  </div>
                </div>
              )}

              {/* Form Modal Đề xuất dời lịch */}
              {showReschedule && (
                <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 mt-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" /> Đề xuất thời gian phỏng vấn mới
                  </h4>
                  <form onSubmit={handleSubmitReschedule} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Ngày bạn mong muốn: <span className="text-red-500">*</span>
                        </label>
                        <DateInput
                          value={rescheduleData.proposedDate}
                          onChange={(val) => setRescheduleData(prev => ({ ...prev, proposedDate: val }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Khung giờ thuận tiện:
                        </label>
                        <select
                          value={rescheduleData.proposedTimeSlot}
                          onChange={(e) => setRescheduleData(prev => ({ ...prev, proposedTimeSlot: e.target.value }))}
                          className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="MORNING">Buổi sáng (09:00 - 11:30)</option>
                          <option value="AFTERNOON">Buổi chiều (14:00 - 17:30)</option>
                          <option value="AFTER_HOURS">Sau giờ hành chính (Sau 17:30)</option>
                          <option value="ANY">Linh hoạt theo lịch sắp xếp của HR</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Lý do xin đổi lịch:</label>
                      <select
                        value={rescheduleData.reason}
                        onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Trùng lịch làm việc / công tác đột xuất">Trùng lịch làm việc / công tác đột xuất</option>
                        <option value="Có bài thi / lịch học tại trường">Có bài thi / lịch học tại trường</option>
                        <option value="Vấn đề sức khỏe cá nhân">Vấn đề sức khỏe cá nhân</option>
                        <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Lời nhắn gửi HR:</label>
                      <textarea
                        rows={2}
                        value={rescheduleData.notes}
                        onChange={(e) => setRescheduleData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Em xin phép được dời lịch và rất mong được Quý công ty hỗ trợ sắp xếp..."
                        className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReschedule(false)}
                        className="py-2 px-4 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={interviewSubmitting}
                        className="py-2 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition"
                      >
                        {interviewSubmitting ? 'Đang gửi...' : 'Gửi Đề Xuất Dời Lịch'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Modal Từ chối phỏng vấn */}
              {showDecline && (
                <div className="p-5 rounded-xl bg-red-50/70 border border-red-200 mt-4 space-y-3">
                  <h4 className="font-bold text-sm text-red-900 flex items-center gap-2">
                    <XCircle size={18} className="text-red-600" /> Xác nhận từ chối buổi phỏng vấn
                  </h4>
                  <form onSubmit={handleSubmitDecline} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Lý do từ chối:</label>
                      <select
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="Đã nhận được offer phù hợp từ công ty khác">Đã nhận được offer phù hợp từ công ty khác</option>
                        <option value="Định hướng công việc thay đổi">Định hướng công việc thay đổi</option>
                        <option value="Không còn nhu cầu tìm việc ở thời điểm hiện tại">Không còn nhu cầu tìm việc ở thời điểm hiện tại</option>
                        <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDecline(false)}
                        className="py-2 px-4 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={interviewSubmitting}
                        className="py-2 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition"
                      >
                        {interviewSubmitting ? 'Đang gửi...' : 'Xác Nhận Từ Chối'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: THƯ MỜI NHẬN VIỆC (JOB OFFER & PRE-ONBOARDING) */}
        {/* ========================================================================= */}
        {type === 'OFFER' && offer && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-white/20 text-xs font-bold py-1 px-3 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <Sparkles size={14} /> Thư Mời Nhận Việc (Job Offer Letter)
                </span>
                <span className="text-xs text-emerald-100">Mã Offer: #{offer.id?.slice(0, 8)}</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Chào mừng bạn gia nhập LLA!</h3>
              <p className="text-emerald-100 text-sm mt-1">
                Chúng tôi rất vui mừng kính gửi đến bạn thư mời nhận việc với các chế độ đãi ngộ bên dưới.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Chi tiết Offer */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Vị trí đảm nhận</span>
                  <span className="font-bold text-slate-800 text-base">{candidate?.jobTitle}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-sm">
                  <div>
                    <span className="text-xs text-slate-500">Mức lương chính thức:</span>
                    <p className="font-bold text-blue-700 text-lg">
                      {new Intl.NumberFormat('vi-VN').format(offer.baseSalary)} VNĐ/tháng
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Mức lương thử việc ({offer.probationRate}%):</span>
                    <p className="font-bold text-emerald-700 text-lg">
                      {new Intl.NumberFormat('vi-VN').format(Math.round((offer.baseSalary * offer.probationRate) / 100))} VNĐ/tháng
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Loại hợp đồng:</span>
                    <p className="font-semibold text-slate-800">
                      {offer.contractType === 'PROBATION' ? 'Hợp đồng Thử việc' : offer.contractType}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Ngày dự kiến nhận việc:</span>
                    <p className="font-semibold text-slate-800">{formatDateOnly(offer.startDate)}</p>
                  </div>
                </div>

                {offer.notes && (
                  <div className="border-t border-emerald-200/60 pt-3 text-xs text-slate-600 italic">
                    <span className="font-semibold not-italic text-emerald-800">Ghi chú từ HR: </span>
                    {offer.notes}
                  </div>
                )}
              </div>

              {/* TRẠNG THÁI HIỆN TẠI CỦA OFFER */}
              {offer.status === 'ACCEPTED' && (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-base">Bạn đã đồng ý nhận việc thành công!</h4>
                    <p className="text-sm text-emerald-700 mt-1">
                      Hồ sơ tiếp nhận (Pre-onboarding) của bạn đã được chuyển tới Phòng Nhân sự. Chúng tôi sẽ đón tiếp và bàn giao trang thiết bị vào ngày nhận việc ({formatDateOnly(offer.startDate)}).
                    </p>
                    <p className="text-xs text-emerald-600 mt-2">
                      Đã xác nhận lúc: {formatDateTime(offer.respondedAt)}
                    </p>
                  </div>
                </div>
              )}

              {offer.status === 'REJECTED' && (
                <div className="p-5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
                  <XCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-base">Thư mời nhận việc đã bị từ chối</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {offer.declineReason || 'Ứng viên đã từ chối Offer này.'}
                    </p>
                  </div>
                </div>
              )}

              {/* FORM XÁC NHẬN ĐỒNG Ý & ĐIỀN HỒ SƠ TIẾP NHẬN (PRE-ONBOARDING) */}
              {offer.status === 'PENDING' && !expired && (
                <div className="space-y-6">
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <HeartHandshake className="text-emerald-600" /> Hoàn tất Hồ sơ Tiếp nhận Nhân sự mới
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Vui lòng cung cấp CCCD và số tài khoản chính chủ để HR hoàn tất thủ tục hợp đồng và chi trả lương.
                        </p>
                      </div>

                      {/* Step Indicator */}
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          offerStep === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>1</span>
                        <span className="text-slate-300">━</span>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          offerStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>2</span>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitAcceptOffer} className="space-y-4">
                      {/* BƯỚC 1: THÔNG TIN NHÂN THÂN */}
                      {offerStep === 1 && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                            <span>Bước 1/2: Thông tin định danh & Căn cước công dân gắn chip (Bảo mật tuyệt đối).</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Số CCCD gắn chip (12 chữ số) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                maxLength={12}
                                required
                                value={preOnboardingForm.cccd}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, cccd: e.target.value.replace(/\D/g, '') }))}
                                placeholder="00120400xxxx"
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Ngày sinh <span className="text-red-500">*</span>
                              </label>
                              <DateInput
                                value={preOnboardingForm.dateOfBirth}
                                onChange={(val) => setPreOnboardingForm(prev => ({ ...prev, dateOfBirth: val }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                              <select
                                value={preOnboardingForm.gender}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Tình trạng hôn nhân</label>
                              <select
                                value={preOnboardingForm.maritalStatus}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, maritalStatus: e.target.value }))}
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="SINGLE">Độc thân</option>
                                <option value="MARRIED">Đã kết hôn</option>
                                <option value="DIVORCED">Ly hôn</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Địa chỉ thường trú / Nơi ở hiện tại <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={preOnboardingForm.address}
                              onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
                              className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setShowOfferReject(true)}
                              className="text-xs text-red-600 hover:underline font-semibold"
                            >
                              Từ chối Thư mời nhận việc
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const cleanCccd = String(preOnboardingForm.cccd || '').trim();
                                if (!/^\d{12}$/.test(cleanCccd)) {
                                  return toast.error('Số CCCD gắn chip phải có đủ 12 chữ số.');
                                }
                                if (!preOnboardingForm.dateOfBirth || !preOnboardingForm.address?.trim()) {
                                  return toast.error('Vui lòng điền ngày sinh và địa chỉ.');
                                }
                                setOfferStep(2);
                              }}
                              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition flex items-center gap-2"
                            >
                              Tiếp theo: Ngân hàng & Liên hệ khẩn cấp <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* BƯỚC 2: TÀI KHOẢN NGÂN HÀNG & LIÊN HỆ KHẨN CẤP */}
                      {offerStep === 2 && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                            <CreditCard size={18} className="text-blue-600 shrink-0" />
                            <span>Bước 2/2: Thông tin nhận lương & Liên hệ người thân trong trường hợp khẩn cấp.</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Tên Ngân Hàng <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={preOnboardingForm.bankName}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, bankName: e.target.value }))}
                                placeholder="Vietcombank, MB Bank, Techcombank..."
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Số Tài Khoản Chính Chủ <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={preOnboardingForm.bankAccount}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                                placeholder="0123456789"
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Người liên hệ khẩn cấp (Họ tên) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={preOnboardingForm.emergencyContactName}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                                placeholder="Nguyễn Văn A"
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Số điện thoại người liên hệ <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                value={preOnboardingForm.emergencyContactPhone}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                                placeholder="0987654321"
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Mối quan hệ</label>
                              <select
                                value={preOnboardingForm.emergencyContactRelation}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="Bố/Mẹ">Bố/Mẹ</option>
                                <option value="Vợ/Chồng">Vợ/Chồng</option>
                                <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                                <option value="Người thân/Bạn bè">Người thân/Bạn bè</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số thuế cá nhân (Tùy chọn)</label>
                              <input
                                type="text"
                                value={preOnboardingForm.taxCode}
                                onChange={(e) => setPreOnboardingForm(prev => ({ ...prev, taxCode: e.target.value }))}
                                placeholder="8012345678"
                                className="w-full text-sm py-2.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setOfferStep(1)}
                              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition flex items-center gap-1.5"
                            >
                              <ArrowLeft size={16} /> Quay lại Bước 1
                            </button>

                            <button
                              type="submit"
                              disabled={offerSubmitting}
                              className="py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle2 size={18} />
                              {offerSubmitting ? 'Đang nộp hồ sơ...' : 'Đồng Ý Nhận Việc & Gửi Hồ Sơ'}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* Form Từ chối Offer */}
              {showOfferReject && (
                <div className="p-5 rounded-xl bg-red-50/80 border border-red-200 mt-4 space-y-3">
                  <h4 className="font-bold text-sm text-red-900 flex items-center gap-2">
                    <XCircle size={18} className="text-red-600" /> Xác nhận từ chối Thư mời nhận việc (Offer)
                  </h4>
                  <form onSubmit={handleSubmitRejectOffer} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Lý do từ chối:</label>
                      <select
                        value={offerRejectReason}
                        onChange={(e) => setOfferRejectReason(e.target.value)}
                        className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="Đã nhận được lời mời làm việc phù hợp hơn">Đã nhận được lời mời làm việc phù hợp hơn</option>
                        <option value="Mức đãi ngộ chưa đạt kỳ vọng cá nhân">Mức đãi ngộ chưa đạt kỳ vọng cá nhân</option>
                        <option value="Khoảng cách địa lý / đi lại không thuận tiện">Khoảng cách địa lý / đi lại không thuận tiện</option>
                        <option value="Kế hoạch cá nhân thay đổi">Kế hoạch cá nhân thay đổi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Lời nhắn gửi Ban Tuyển dụng:</label>
                      <textarea
                        rows={2}
                        value={offerRejectNotes}
                        onChange={(e) => setOfferRejectNotes(e.target.value)}
                        placeholder="Em chân thành cảm ơn cơ hội và thư mời của Quý công ty..."
                        className="w-full text-sm py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowOfferReject(false)}
                        className="py-2 px-4 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={offerSubmitting}
                        className="py-2 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition"
                      >
                        {offerSubmitting ? 'Đang gửi...' : 'Xác Nhận Từ Chối Offer'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 py-4">
          © 2026 Công ty TNHH LLA. Hệ thống Quản trị Nhân sự & Tuyển dụng LLA HRM.
        </div>
      </div>
    </div>
  );
};
