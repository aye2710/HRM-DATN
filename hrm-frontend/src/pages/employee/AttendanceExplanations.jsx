import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Send, Printer, ArrowLeft, Clock, Plus, CheckCircle2, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../components/common/TablePagination';
import {
  ExplanationA4Preview,
  MonthNavigator,
  formatExplanationTypeBadge,
  getAuthHeaders,
  getExplanationCategory,
} from '../../components/attendance/AttendanceShared';

const FORM_CATEGORIES = {
  CONFIRM_ATTENDANCE: {
    key: 'CONFIRM_ATTENDANCE',
    tabLabel: '📄 Xác nhận chấm công',
    title: 'Trang Lập & In Đơn Xin Xác Nhận Chấm Công (Công ty LLA)',
    defaultSubType: 'Đơn xác nhận chấm công (Quên Check-out)',
    defaultReason: 'do chưa làm dấu vân tay / quên quét dấu vân tay lúc ra về',
    reasonLabel: 'Lý do xin xác nhận chấm công (VD: quên quét vân tay lúc về) *',
  },
  LATE_PERMISSION: {
    key: 'LATE_PERMISSION',
    tabLabel: '⏰ Xin phép đi muộn',
    title: 'Trang Lập & In Đơn Xin Phép Đi Muộn (Công ty LLA)',
    defaultDuration: '1 tiếng',
    defaultSubType: 'Đơn xin phép đi muộn (5p - 60p)',
    defaultReason: 'Em xin phép đến muộn do có việc cá nhân đột xuất đầu giờ sáng ạ',
    reasonLabel: 'Lý do xin đi muộn (Hiển thị trực tiếp vào tờ đơn bên phải) *',
  },
  EARLY_LEAVE_PERMISSION: {
    key: 'EARLY_LEAVE_PERMISSION',
    tabLabel: '🏃 Xin phép về sớm',
    title: 'Trang Lập & In Đơn Xin Phép Về Sớm (Công ty LLA)',
    defaultDuration: '1 tiếng',
    defaultSubType: 'Đơn xin phép về sớm (Trước giờ tan ca)',
    defaultReason: 'Em xin phép về sớm để giải quyết công việc gia đình và cam kết hoàn thành đầu việc được giao ạ',
    reasonLabel: 'Lý do xin về sớm (Hiển thị trực tiếp vào tờ đơn bên phải) *',
  },
};

export const EmployeeExplanations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'FORM_PAGE'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myAdjustments, setMyAdjustments] = useState([]);
  const [empProfile, setEmpProfile] = useState(null);

  const [requestForm, setRequestForm] = useState({
    id: null,
    formCategory: 'CONFIRM_ATTENDANCE',
    date: now.toISOString().split('T')[0],
    subType: FORM_CATEGORIES.CONFIRM_ATTENDANCE.defaultSubType,
    duration: '1 tiếng',
    oldTime: '',
    reason: FORM_CATEGORIES.CONFIRM_ATTENDANCE.defaultReason,
    status: 'PENDING',
    readOnly: false,
  });

  const fullName = localStorage.getItem('fullName') || 'Nhân viên';
  const employeeId = localStorage.getItem('employeeId');

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (employeeId) {
      try {
        const [adjRes, profRes] = await Promise.all([
          axios.get('http://localhost:5000/api/attendance/adjustments', { headers }),
          axios.get(`http://localhost:5000/api/employees/${employeeId}`, { headers }).catch(() => ({ data: null })),
        ]);
        if (Array.isArray(adjRes.data)) setMyAdjustments(adjRes.data);
        if (profRes?.data) setEmpProfile(profRes.data);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const openNewForm = (category = 'CONFIRM_ATTENDANCE', prefill = {}) => {
    const cfg = FORM_CATEGORIES[category] || FORM_CATEGORIES.CONFIRM_ATTENDANCE;
    setRequestForm({
      id: null,
      formCategory: category,
      date: prefill.date || now.toISOString().split('T')[0],
      subType: prefill.subType || cfg.defaultSubType,
      duration: prefill.duration || prefill.lateDuration || cfg.defaultDuration || '',
      oldTime: prefill.oldTime || (category === 'CONFIRM_ATTENDANCE' ? '07:54 / — (Thiếu giờ)' : ''),
      reason: prefill.reason || cfg.defaultReason,
      status: 'PENDING',
      readOnly: false,
    });
    setViewMode('FORM_PAGE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openExistingDoc = (adj) => {
    const category = getExplanationCategory(adj.type);
    setRequestForm({
      id: adj.id,
      formCategory: category,
      date: adj.date ? new Date(adj.date).toISOString().split('T')[0] : now.toISOString().split('T')[0],
      subType: adj.type,
      duration: '',
      oldTime: adj.oldTime || '',
      reason: adj.reason || '',
      status: adj.status || 'PENDING',
      readOnly: true,
    });
    setViewMode('FORM_PAGE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const prefillState = location.state?.prefill;
    if (prefillState) {
      openNewForm(prefillState.category || 'CONFIRM_ATTENDANCE', prefillState);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const monthAdjustments = useMemo(() => {
    return myAdjustments.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      return (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
    });
  }, [myAdjustments, selectedMonth, selectedYear]);

  const filteredAdjustments = useMemo(() => {
    if (statusFilter === 'ALL') return monthAdjustments;
    return monthAdjustments.filter(a => a.status === statusFilter);
  }, [monthAdjustments, statusFilter]);

  const usedLateQuota = useMemo(() => {
    return monthAdjustments.filter(
      a => a.status !== 'REJECTED' && String(a.type || '').toLowerCase().includes('đi muộn')
    ).length;
  }, [monthAdjustments]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedAdjustments,
    resetPage,
  } = usePagination(filteredAdjustments, 10);

  useEffect(() => {
    resetPage();
  }, [selectedMonth, selectedYear, statusFilter, resetPage]);

  const handleSwitchCategory = (cat) => {
    const cfg = FORM_CATEGORIES[cat];
    setRequestForm(prev => ({
      ...prev,
      id: null,
      readOnly: false,
      formCategory: cat,
      subType: cfg.defaultSubType,
      duration: cfg.defaultDuration || '',
      reason: cfg.defaultReason,
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.date || !requestForm.reason.trim()) {
      return toast.error('Vui lòng chọn ngày và nhập lý do!');
    }
    setSubmitting(true);
    try {
      let finalType = requestForm.subType;
      if (requestForm.formCategory === 'LATE_PERMISSION') {
        finalType = `Đơn xin phép đi muộn (muộn ${requestForm.duration || '1 tiếng'})`;
      } else if (requestForm.formCategory === 'EARLY_LEAVE_PERMISSION') {
        finalType = `Đơn xin phép về sớm (sớm ${requestForm.duration || '1 tiếng'})`;
      }

      const res = await axios.post(
        'http://localhost:5000/api/attendance/adjustments',
        {
          employeeId,
          date: requestForm.date,
          type: finalType,
          oldTime: requestForm.oldTime || null,
          reason: requestForm.reason.trim(),
        },
        { headers: getAuthHeaders() }
      );
      toast.success('Đã lưu & gửi đơn thành công! Bạn có thể bấm "In biên bản A4" ngay bên phải để trình PM ký.');
      await fetchData();
      if (res.data?.adjustment) {
        setRequestForm(prev => ({
          ...prev,
          id: res.data.adjustment.id,
          subType: res.data.adjustment.type,
          readOnly: true,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi gửi đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const deptName = empProfile?.department?.name || 'Phòng chuyên môn';
  const positionTitle = empProfile?.position?.title || 'Nhân viên';

  if (viewMode === 'FORM_PAGE') {
    const activeCfg = FORM_CATEGORIES[requestForm.formCategory] || FORM_CATEGORIES.CONFIRM_ATTENDANCE;

    return (
      <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '0.85rem 1.25rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setViewMode('LIST')}
              className="btn btn-outline"
              style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              <ArrowLeft size={15} /> Quay lại danh sách đơn
            </button>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {activeCfg.title}
              </h1>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Soạn thông tin ở cột trái ➔ Xem trước trực tiếp văn bản chuẩn A4 ở cột phải và in trình Trưởng bộ phận ký
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{ height: 35, padding: '0 0.95rem', fontSize: '0.8rem', fontWeight: 700, borderColor: '#2563EB', color: '#1D4ED8', backgroundColor: '#EFF6FF' }}
          >
            <Printer size={15} /> In biên bản A4 (Trình PM ký)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem', alignItems: 'start' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block' }}>
                1. Chọn loại đơn &amp; Điền thông tin giải trình
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Nhân viên điền ngày, lý do thực tế; không tự ý chỉnh sửa log giờ của máy chấm công.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', backgroundColor: '#F1F5F9', padding: '0.35rem', borderRadius: '0.5rem' }}>
              {Object.values(FORM_CATEGORIES).map(cat => {
                const active = requestForm.formCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleSwitchCategory(cat.key)}
                    style={{
                      padding: '0.5rem 0.4rem',
                      borderRadius: '0.4rem',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      backgroundColor: active ? '#FFFFFF' : 'transparent',
                      color: active ? '#1D4ED8' : '#64748B',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    {cat.tabLabel}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Họ và tên người làm đơn</label>
                  <input type="text" className="form-input" value={fullName} disabled style={{ backgroundColor: '#F8FAFC' }} />
                </div>
                <div>
                  <label className="form-label">Chức vụ &amp; Bộ phận</label>
                  <input type="text" className="form-input" value={`${positionTitle} - ${deptName}`} disabled style={{ backgroundColor: '#F8FAFC' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Ngày áp dụng *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={requestForm.date}
                    max={now.toISOString().split('T')[0]}
                    onChange={e => setRequestForm({ ...requestForm, date: e.target.value, readOnly: false })}
                    required
                  />
                </div>

                {requestForm.formCategory === 'CONFIRM_ATTENDANCE' ? (
                  <div>
                    <label className="form-label">Trường hợp quên chấm công *</label>
                    <select
                      className="form-input"
                      style={{ width: '100%' }}
                      value={requestForm.subType}
                      onChange={e => setRequestForm({ ...requestForm, subType: e.target.value, readOnly: false })}
                    >
                      <option value="Đơn xác nhận chấm công (Quên Check-out)">Quên Check-out lúc về</option>
                      <option value="Đơn xác nhận chấm công (Quên Check-in)">Quên Check-in lúc vào</option>
                      <option value="Đơn xác nhận chấm công (Chưa làm dấu vân tay)">Chưa làm / Lỗi dấu vân tay</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="form-label">
                      {requestForm.formCategory === 'EARLY_LEAVE_PERMISSION' ? 'Thời lượng về sớm *' : 'Thời lượng đi muộn (5p – 1h) *'}
                    </label>
                    <select
                      className="form-input"
                      style={{ width: '100%' }}
                      value={requestForm.duration}
                      onChange={e => setRequestForm({ ...requestForm, duration: e.target.value, readOnly: false })}
                    >
                      <option value="15 phút">15 phút</option>
                      <option value="30 phút">30 phút</option>
                      <option value="45 phút">45 phút</option>
                      <option value="1 tiếng">1 tiếng (60 phút)</option>
                      {requestForm.formCategory === 'EARLY_LEAVE_PERMISSION' && (
                        <option value="2 tiếng">2 tiếng</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {requestForm.formCategory === 'LATE_PERMISSION' && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.78rem',
                  backgroundColor: usedLateQuota >= 3 ? '#FEF2F2' : '#FFFBEB',
                  border: usedLateQuota >= 3 ? '1px solid #FECACA' : '1px solid #FDE68A',
                  color: usedLateQuota >= 3 ? '#991B1B' : '#92400E',
                  lineHeight: 1.45
                }}>
                  {usedLateQuota >= 3 ? (
                    <>⚠️ <strong>Cảnh báo vượt hạn mức:</strong> Bạn đã dùng <strong>{usedLateQuota}/3 lần</strong> xin đi muộn được tính công miễn phạt trong tháng {selectedMonth}/{selectedYear}.</>
                  ) : (
                    <>ℹ️ <strong>Hạn mức tháng {selectedMonth}/{selectedYear}:</strong> Đây là lần xin đi muộn thứ <strong>{usedLateQuota + 1}/3</strong> trong tháng. Đi muộn 5 phút – 1 tiếng có đơn được duyệt vẫn được <strong>tính đủ 1.0 công</strong>.</>
                  )}
                </div>
              )}

              <div>
                <label className="form-label">{activeCfg.reasonLabel}</label>
                <textarea
                  rows={4}
                  className="form-input"
                  value={requestForm.reason}
                  onChange={e => setRequestForm({ ...requestForm, reason: e.target.value, readOnly: false })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setViewMode('LIST')} className="btn btn-secondary">
                  Hủy / Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ borderColor: '#2563EB', color: '#1D4ED8' }}
                >
                  <Printer size={15} /> In biên bản A4
                </button>
                {!requestForm.readOnly && (
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Send size={15} /> {submitting ? 'Đang gửi...' : 'Lưu & Gửi đơn lên HCNS'}
                  </button>
                )}
              </div>
            </form>
          </div>

          <ExplanationA4Preview
            fullName={fullName}
            positionTitle={positionTitle}
            deptName={deptName}
            date={requestForm.date}
            category={requestForm.formCategory}
            durationLabel={requestForm.duration}
            subType={requestForm.subType}
            reason={requestForm.reason}
            status={requestForm.status}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.9rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '8px',
            backgroundColor: '#EFF6FF', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <FileText size={19} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Giải Trình Công &amp; Đơn Xin Đi Muộn / Về Sớm
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
              Quản lý đơn xác nhận quên chấm công, xin phép đi muộn, xin về sớm và in biên bản A4 trình ký (Tháng {selectedMonth}/{selectedYear}).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <MonthNavigator
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelectMonth={setSelectedMonth}
            onSelectYear={setSelectedYear}
          />
          <button
            onClick={() => openNewForm('CONFIRM_ATTENDANCE')}
            className="btn btn-primary"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <Plus size={15} /> Xác nhận công
          </button>
          <button
            onClick={() => openNewForm('LATE_PERMISSION')}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderColor: '#F59E0B', color: '#B45309', backgroundColor: '#FFFBEB' }}
          >
            <Clock size={15} /> Xin đi muộn
          </button>
          <button
            onClick={() => openNewForm('EARLY_LEAVE_PERMISSION')}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderColor: '#EA580C', color: '#C2410C', backgroundColor: '#FFF7ED' }}
          >
            <Clock size={15} /> Xin về sớm
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tổng đơn tháng {selectedMonth}/{selectedYear}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>{monthAdjustments.length} đơn</div>
          </div>
          <FileText size={20} color="#2563EB" />
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Đang chờ duyệt</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#D97706' }}>
              {monthAdjustments.filter(a => a.status === 'PENDING').length} đơn
            </div>
          </div>
          <AlertTriangle size={20} color="#D97706" />
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Hạn mức đi muộn miễn phạt</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: usedLateQuota >= 3 ? '#DC2626' : '#059669' }}>
              {usedLateQuota} / 3 lần
            </div>
          </div>
          <CheckCircle2 size={20} color={usedLateQuota >= 3 ? '#DC2626' : '#059669'} />
        </div>
      </div>

      {/* Bảng danh sách đơn */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '0.8rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Danh sách Đơn giải trình Tháng {selectedMonth}/{selectedYear} ({filteredAdjustments.length})
            </strong>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Bấm <strong>"Mở trang Xem &amp; In đơn"</strong> để xem văn bản chuẩn A4 trình Trưởng bộ phận ký xác nhận
            </div>
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: 180, height: 34, fontSize: '0.82rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">HCNS đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.7rem 1.1rem', textAlign: 'left', fontWeight: 700 }}>Ngày áp dụng</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Loại Biên bản / Đơn</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Lý do trình bày</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Kết quả đối soát</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                <th style={{ padding: '0.7rem 1.1rem', textAlign: 'right', fontWeight: 700 }}>Biên bản A4</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Đang tải danh sách đơn...
                  </td>
                </tr>
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Chưa có đơn giải trình nào phù hợp trong tháng {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                paginatedAdjustments.map(adj => {
                  const badge = formatExplanationTypeBadge(adj.type);
                  return (
                    <tr key={adj.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.7rem 1.1rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {new Date(adj.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {adj.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', color: '#334155' }}>
                        {adj.reason}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', fontWeight: 600, color: '#15803D', whiteSpace: 'nowrap' }}>
                        {adj.newTime}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: adj.status === 'APPROVED' ? '#DCFCE7' : adj.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                          color: adj.status === 'APPROVED' ? '#15803D' : adj.status === 'REJECTED' ? '#B91C1C' : '#B45309'
                        }}>
                          {adj.status === 'APPROVED' ? 'HCNS đã duyệt' : adj.status === 'REJECTED' ? 'Từ chối' : 'Chờ PM & HCNS duyệt'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openExistingDoc(adj)}
                          className="btn btn-outline"
                          style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, color: '#1D4ED8', borderColor: '#BFDBFE' }}
                        >
                          <Printer size={13} /> Mở trang Xem &amp; In đơn
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="đơn"
          />
        )}
      </div>
    </div>
  );
};

