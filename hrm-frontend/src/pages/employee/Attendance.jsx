import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, Cpu, FileText, Send, Printer, AlertTriangle, CheckCircle2,
  ArrowLeft, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const EmployeeAttendance = () => {
  const now = new Date();
  const [currentTime, setCurrentTime] = useState(now.toLocaleTimeString('vi-VN'));

  // Bộ lọc Tháng / Năm (Xem được các tháng trước, tháng hiện tại chỉ tới ngày hôm nay 29/10)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Chế độ hiển thị toàn trang: 'LIST' (Bảng công & Danh sách đơn) | 'FORM_PAGE' (Trang soạn thảo & In biên bản A4, KHÔNG dùng popup)
  const [viewMode, setViewMode] = useState('LIST');

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [myAdjustments, setMyAdjustments] = useState([]);
  const [empProfile, setEmpProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State cho Trang lập & in đơn (Full-Page)
  const [requestForm, setRequestForm] = useState({
    id: null,
    formCategory: 'CONFIRM_ATTENDANCE', // 'CONFIRM_ATTENDANCE' | 'LATE_PERMISSION'
    date: now.toISOString().split('T')[0],
    subType: 'Đơn xác nhận chấm công (Quên Check-out)',
    lateDuration: '1 tiếng',
    oldTime: '',
    reason: 'do chưa làm dấu vân tay',
    status: 'PENDING',
    readOnly: false
  });

  const fullName = localStorage.getItem('fullName') || 'Lê Hữu Trúc';
  const employeeCode = localStorage.getItem('employeeCode') || 'NV0144';
  const employeeId = localStorage.getItem('employeeId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const monthQueryStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const fetchAttendanceData = async () => {
    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (employeeId) {
      try {
        const [attRes, adjRes, profRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/attendance/employee/${employeeId}?month=${monthQueryStr}`, { headers }),
          axios.get('http://localhost:5000/api/attendance/adjustments', { headers }),
          axios.get(`http://localhost:5000/api/employees/${employeeId}`, { headers }).catch(() => ({ data: null }))
        ]);

        const recordsList = Array.isArray(attRes.data) ? attRes.data : (attRes.data?.records || []);
        // Đảm bảo chỉ hiển thị các ngày <= ngày hôm nay (29/10/2026)
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const validRecords = recordsList.filter(r => r.date && new Date(r.date) <= todayEnd);

        setAttendanceRecords(validRecords);
        if (Array.isArray(adjRes.data)) setMyAdjustments(adjRes.data);
        if (profRes?.data) setEmpProfile(profRes.data);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [employeeId, selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    if (isCurrentMonth) {
      return toast('Hiện tại đang ở tháng hiện hành, chưa có dữ liệu tháng tương lai.');
    }
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Tính số phút đi muộn so với 08:00
  const getLateMinutes = (checkInIso) => {
    if (!checkInIso) return 0;
    const d = new Date(checkInIso);
    if (isNaN(d.getTime())) return 0;
    const totalMins = d.getHours() * 60 + d.getMinutes();
    const startMins = 8 * 60; // 08:00
    return Math.max(0, totalMins - startMins);
  };

  // Đếm số đơn xin đi muộn trong tháng đang chọn (Quy định LLA: Tối đa 3 lần/tháng được tính công & miễn phạt)
  const monthLateRequests = useMemo(() => {
    return myAdjustments.filter(a => {
      if (!a.date || a.status === 'REJECTED') return false;
      const d = new Date(a.date);
      const isSameMonth = (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      const isLateForm = String(a.type || '').toLowerCase().includes('đi muộn');
      return isSameMonth && isLateForm;
    });
  }, [myAdjustments, selectedMonth, selectedYear]);

  const usedLateQuota = monthLateRequests.length;

  // Lọc danh sách đơn của tháng đang chọn
  const filteredMonthAdjustments = useMemo(() => {
    return myAdjustments.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      return (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
    });
  }, [myAdjustments, selectedMonth, selectedYear]);

  const todayRecord = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    return attendanceRecords.find(r => r.date && r.date.startsWith(todayStr)) || null;
  }, [attendanceRecords]);

  // Mở trang lập đơn mới (Toàn trang - không dùng popup)
  const openFullPageForm = (category, prefill = {}) => {
    if (category === 'LATE_PERMISSION') {
      setRequestForm({
        id: null,
        formCategory: 'LATE_PERMISSION',
        date: prefill.date || now.toISOString().split('T')[0],
        subType: 'Đơn xin phép đi muộn (5p - 60p)',
        lateDuration: prefill.lateDuration || '1 tiếng',
        oldTime: prefill.oldTime || '08:45 (Đi muộn > 5p)',
        reason: prefill.reason || 'Em xin phép đến muộn 1 tiếng do em có lịch học trên trường ca sáng từ 6h30 đến 8h30 ạ',
        status: 'PENDING',
        readOnly: false
      });
    } else {
      setRequestForm({
        id: null,
        formCategory: 'CONFIRM_ATTENDANCE',
        date: prefill.date || now.toISOString().split('T')[0],
        subType: prefill.subType || 'Đơn xác nhận chấm công (Quên Check-out)',
        lateDuration: '',
        oldTime: prefill.oldTime || '07:54 / — (Thiếu giờ ra)',
        reason: prefill.reason || 'do chưa làm dấu vân tay / quên quét dấu vân tay lúc ra về',
        status: 'PENDING',
        readOnly: false
      });
    }
    setViewMode('FORM_PAGE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mở trang xem & in đơn đã tạo (Toàn trang - không dùng popup)
  const openExistingDocFullPage = (adj) => {
    const isLate = String(adj.type || '').toLowerCase().includes('đi muộn');
    setRequestForm({
      id: adj.id,
      formCategory: isLate ? 'LATE_PERMISSION' : 'CONFIRM_ATTENDANCE',
      date: adj.date ? new Date(adj.date).toISOString().split('T')[0] : now.toISOString().split('T')[0],
      subType: adj.type,
      lateDuration: '1 tiếng',
      oldTime: adj.oldTime || '',
      reason: adj.reason || '',
      status: adj.status || 'PENDING',
      readOnly: true
    });
    setViewMode('FORM_PAGE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.date || !requestForm.reason.trim()) {
      return toast.error('Vui lòng chọn ngày và nhập lý do!');
    }
    setSubmitting(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const finalType =
        requestForm.formCategory === 'LATE_PERMISSION'
          ? `Đơn xin phép đi muộn (muộn ${requestForm.lateDuration || '1 tiếng'})`
          : requestForm.subType;

      const res = await axios.post(
        'http://localhost:5000/api/attendance/adjustments',
        {
          employeeId,
          date: requestForm.date,
          type: finalType,
          oldTime: requestForm.oldTime || null,
          reason: requestForm.reason.trim()
        },
        { headers }
      );
      toast.success('Đã lưu & gửi đơn thành công! Bạn có thể bấm "In biên bản A4" ngay bên phải để trình PM ký.');
      await fetchAttendanceData();
      if (res.data?.adjustment) {
        setRequestForm(prev => ({
          ...prev,
          id: res.data.adjustment.id,
          readOnly: true
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi gửi đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const deptName = empProfile?.department?.name || 'IT';
  const positionTitle = empProfile?.position?.title || 'BA';

  const totalMonthDays = useMemo(() => {
    return attendanceRecords.reduce((sum, r) => sum + Number(r.workingDay || 0), 0);
  }, [attendanceRecords]);

  // ============================================================================
  // CHẾ ĐỘ 1: TRANG SOẠN THẢO & XEM TRƯỚC BIÊN BẢN A4 TOÀN MÀN HÌNH (KHÔNG POPUP)
  // ============================================================================
  if (viewMode === 'FORM_PAGE') {
    const parsedDate = requestForm.date ? new Date(requestForm.date) : now;
    const dayStr = String(parsedDate.getDate()).padStart(2, '0');
    const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const yearStr = parsedDate.getFullYear();

    return (
      <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Thanh điều hướng Trang Lập Đơn */}
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
              <ArrowLeft size={15} /> Quay lại Bảng chấm công
            </button>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {requestForm.formCategory === 'LATE_PERMISSION'
                  ? 'Trang Lập & In Đơn Xin Phép Đi Muộn (Công ty LLA)'
                  : 'Trang Lập & In Đơn Xin Xác Nhận Chấm Công (Công ty LLA)'}
              </h1>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Soạn thông tin ở cột trái ➔ Xem trước trực tiếp văn bản chuẩn A4 ở cột phải và in trình Trưởng bộ phận ký
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-outline"
              style={{ height: 35, padding: '0 0.95rem', fontSize: '0.8rem', fontWeight: 700, borderColor: '#2563EB', color: '#1D4ED8', backgroundColor: '#EFF6FF' }}
            >
              <Printer size={15} /> In biên bản A4 (Trình PM ký)
            </button>
          </div>
        </div>

        {/* Bố cục 2 cột Toàn Trang: Cột Trái (Form nhập) - Cột Phải (Tờ A4 Live Preview) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem', alignItems: 'start' }}>
          
          {/* CỘT TRÁI: FORM NHẬP THÔNG TIN ĐƠN */}
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
                1. Chọn mẫu đơn &amp; Điền thông tin
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Nhân viên chỉ điền ngày và lý do thực tế, không tự ý chỉnh sửa giờ hệ thống.
              </span>
            </div>

            {/* Chuyển đổi giữa 2 mẫu đơn */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#F1F5F9', padding: '0.35rem', borderRadius: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRequestForm(prev => ({
                  ...prev,
                  id: null,
                  readOnly: false,
                  formCategory: 'CONFIRM_ATTENDANCE',
                  subType: 'Đơn xác nhận chấm công (Quên Check-out)',
                  reason: 'do chưa làm dấu vân tay'
                }))}
                style={{
                  padding: '0.55rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor: requestForm.formCategory === 'CONFIRM_ATTENDANCE' ? '#FFFFFF' : 'transparent',
                  color: requestForm.formCategory === 'CONFIRM_ATTENDANCE' ? '#1D4ED8' : '#64748B',
                  boxShadow: requestForm.formCategory === 'CONFIRM_ATTENDANCE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                📄 Mẫu 1: Đơn xác nhận công
              </button>
              <button
                type="button"
                onClick={() => setRequestForm(prev => ({
                  ...prev,
                  id: null,
                  readOnly: false,
                  formCategory: 'LATE_PERMISSION',
                  subType: 'Đơn xin phép đi muộn (5p - 60p)',
                  lateDuration: '1 tiếng',
                  reason: 'Em xin phép đến muộn 1 tiếng do em có lịch học trên trường ca sáng từ 6h30 đến 8h30 ạ'
                }))}
                style={{
                  padding: '0.55rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor: requestForm.formCategory === 'LATE_PERMISSION' ? '#FFFFFF' : 'transparent',
                  color: requestForm.formCategory === 'LATE_PERMISSION' ? '#B45309' : '#64748B',
                  boxShadow: requestForm.formCategory === 'LATE_PERMISSION' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                ⏰ Mẫu 2: Đơn xin đi muộn
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Họ và tên người làm đơn</label>
                  <input type="text" className="form-input" value={fullName} disabled style={{ backgroundColor: '#F8FAFC' }} />
                </div>
                <div>
                  <label className="form-label">Chức vụ &amp; Bộ phận</label>
                  <input type="text" className="form-input" value={`${positionTitle} - Phòng ${deptName}`} disabled style={{ backgroundColor: '#F8FAFC' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Ngày cần xác nhận / xin phép *</label>
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
                    <label className="form-label">Thời lượng đi muộn (5p – 1h) *</label>
                    <select
                      className="form-input"
                      style={{ width: '100%' }}
                      value={requestForm.lateDuration}
                      onChange={e => setRequestForm({ ...requestForm, lateDuration: e.target.value, readOnly: false })}
                    >
                      <option value="15 phút">Muộn 15 phút</option>
                      <option value="30 phút">Muộn 30 phút</option>
                      <option value="45 phút">Muộn 45 phút</option>
                      <option value="1 tiếng">Muộn 1 tiếng (Tối đa 60 phút)</option>
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
                    <>⚠️ <strong>Cảnh báo vượt hạn mức:</strong> Bạn đã dùng <strong>{usedLateQuota}/3 lần</strong> xin đi muộn được tính công miễn phạt trong tháng {selectedMonth}/{selectedYear}. Các lần từ thứ 4 trở đi sẽ bị phạt theo quy chế.</>
                  ) : (
                    <>ℹ️ <strong>Hạn mức tháng {selectedMonth}/{selectedYear}:</strong> Đây là lần xin đi muộn thứ <strong>{usedLateQuota + 1}/3</strong> trong tháng. Đi muộn trong khoảng 5 phút – 1 tiếng có đơn được duyệt vẫn được <strong>tính đủ 1.0 công</strong>.</>
                  )}
                </div>
              )}

              <div>
                <label className="form-label">
                  {requestForm.formCategory === 'LATE_PERMISSION'
                    ? 'Lý do xin đi muộn (Hiển thị trực tiếp vào tờ đơn bên phải) *'
                    : 'Lý do xin xác nhận chấm công (VD: do chưa làm dấu vân tay / quên quét vân tay lúc về) *'}
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  value={requestForm.reason}
                  onChange={e => setRequestForm({ ...requestForm, reason: e.target.value, readOnly: false })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className="btn btn-secondary"
                >
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

          {/* CỘT PHẢI: TỜ GIẤY A4 XEM TRƯỚC TRỰC TIẾP (LIVE DOCUMENT PREVIEW) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            padding: '2rem 2.25rem',
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000000',
            lineHeight: 1.6,
            fontSize: '15px'
          }}>
            {requestForm.formCategory === 'LATE_PERMISSION' ? (
              /* MẪU 2: ĐƠN XIN PHÉP ĐI MUỘN (ĐÚNG MẪU CÔNG TY LLA) */
              <div>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ textDecoration: 'underline', marginBottom: '1.25rem' }}>Độc lập – Tự do – Hạnh phúc</div>
                  <div style={{ fontSize: '19px', margin: '1rem 0' }}>ĐƠN XIN PHÉP</div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Kính gửi:</strong> Trưởng bộ phận {deptName}
                </div>
                <div>
                  Tên tôi là: <strong>{fullName}</strong>, hiện đang làm việc tại phòng {deptName} của Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA.
                </div>
                <div>
                  Tôi xin phép được đi muộn ngày <strong>{dayStr}/{monthStr}/{yearStr}</strong> (muộn {requestForm.lateDuration || '1 tiếng'})
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>Lý do xin đi muộn:</strong> {requestForm.reason}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  Rất mong được trưởng bộ phận {deptName} phê duyệt.
                </div>
                <div style={{ marginBottom: '1.25rem' }}>Trân trọng cảm ơn!</div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', marginTop: '1rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '0.75rem', width: '50%', verticalAlign: 'top' }}>
                        <strong>Trưởng bộ phận</strong><br />
                        <em>(Phê duyệt và ký tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>Ngô Xuân Cương</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.75rem', width: '50%', verticalAlign: 'top' }}>
                        <em>Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}</em><br />
                        <strong>Người làm đơn</strong><br />
                        <em>(Ký tên)</em>
                        <div style={{ height: '55px' }} />
                        <strong>{fullName}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* MẪU 1: ĐƠN XIN XÁC NHẬN CHẤM CÔNG (ĐÚNG MẪU CÔNG TY LLA) */
              <div>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div>Độc lập – Tự do – Hạnh phúc</div>
                  <div>—–</div>
                </div>
                <div style={{ textAlign: 'right', fontStyle: 'italic', margin: '0.5rem 0 1rem' }}>
                  Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}
                </div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '19px', marginBottom: '1rem' }}>
                  ĐƠN XIN XÁC NHẬN CHẤM CÔNG
                </div>

                <div style={{ marginBottom: '0.75rem', paddingLeft: '1.25rem' }}>
                  <strong>Kính gửi:</strong> - Giám đốc Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA<br />
                  <span style={{ paddingLeft: '4.1rem' }}>- Phòng HCNS - Kế Toán</span><br />
                  <span style={{ paddingLeft: '4.1rem' }}>- Trưởng bộ phận {deptName}</span>
                </div>

                <div>Tên tôi là: <strong>{fullName}</strong></div>
                <div>Chức vụ: <strong>{positionTitle}</strong></div>
                <div>Bộ phận: <strong>{deptName}</strong></div>

                <div style={{ marginTop: '0.5rem', textAlign: 'justify' }}>
                  Nay tôi làm đơn này kính mong Giám đốc Công ty, Phòng HCNS - Kế Toán, trưởng bộ phận (nơi bạn trực tiếp làm việc) {deptName} xác nhận chấm công làm việc của tôi theo đúng thời gian tôi đã làm việc tại công ty trong tháng vừa qua. Trong đó:
                </div>
                <div style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
                  Xin chấm công ngày {dayStr} tháng {monthStr} năm {yearStr} {requestForm.reason}
                </div>
                <div>
                  Tôi cam đoan những thông tin tôi trình bày ở trên là đúng sự thật và xin chịu mọi trách nhiệm trước pháp luật.
                </div>
                <div style={{ marginBottom: '1.25rem' }}>Tôi xin chân thành cảm ơn!</div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', marginTop: '1rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                        <strong>TP. HCNS-KT</strong><br />
                        <em>(Xác nhận, ký, ghi rõ họ tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>{requestForm.status === 'APPROVED' ? 'Đã phê duyệt' : ''}</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                        <strong>Trưởng bộ phận</strong><br />
                        <em>(Xác nhận, ký, ghi rõ họ tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>Ngô Xuân Cương</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                        <strong>Người làm đơn</strong><br />
                        <em>(Ký, ghi rõ họ tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>{fullName}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ============================================================================
  // CHẾ ĐỘ 2: MÀN HÌNH TRA CỨU BẢNG CÔNG THÁNG & DANH SÁCH ĐƠN
  // ============================================================================
  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      
      {/* 1. Header Chấm công & Bộ chọn Tháng / Năm (Xem được tháng trước) */}
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
            <Clock size={19} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Bảng Chấm Công Cá Nhân &amp; Đơn Giải Trình (Công ty LLA)
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
              Kỳ công đang xem: <strong>Tháng {selectedMonth}/{selectedYear}</strong> (Tính đến ngày {selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() ? `${now.getDate()}/${selectedMonth}/${selectedYear}` : `cuối tháng ${selectedMonth}/${selectedYear}`})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Bộ chọn Tháng Trước / Tháng Sau */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#F8FAFC', padding: '0.2rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}>
            <button
              onClick={handlePrevMonth}
              className="btn btn-outline"
              style={{ height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: 'transparent' }}
              title="Xem tháng trước"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="form-input"
              style={{ width: 'auto', height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m} disabled={selectedYear === now.getFullYear() && m > now.getMonth() + 1}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="form-input"
              style={{ width: 'auto', height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem' }}
            >
              {[2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={handleNextMonth}
              className="btn btn-outline"
              style={{ height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: 'transparent' }}
              title="Xem tháng tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => openFullPageForm('CONFIRM_ATTENDANCE')}
            className="btn btn-primary"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <FileText size={15} /> Làm Đơn xác nhận công
          </button>
          <button
            onClick={() => openFullPageForm('LATE_PERMISSION')}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderColor: '#F59E0B', color: '#B45309', backgroundColor: '#FFFBEB' }}
          >
            <Clock size={15} /> Làm Đơn xin đi muộn
          </button>
        </div>
      </div>

      {/* 2. Khối Trạng thái Máy chấm công hôm nay & Quy định Đi muộn Công ty LLA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.9rem' }}>
        
        {/* Cột trái: Máy chấm công hôm nay */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1rem 1.2rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#2563EB" />
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Log Máy chấm công hôm nay ({now.toLocaleDateString('vi-VN')})
              </strong>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '999px' }}>
              ● Đã đồng bộ vân tay
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 600 }}>GIỜ HỆ THỐNG</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{currentTime}</div>
            </div>
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#166534', fontWeight: 600 }}>GIỜ VÀO (IN)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803D', fontFamily: 'monospace' }}>
                {fmtTime(todayRecord?.checkIn) || '07:52'}
              </div>
            </div>
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#1E40AF', fontWeight: 600 }}>GIỜ RA (OUT)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1D4ED8', fontFamily: 'monospace' }}>
                {fmtTime(todayRecord?.checkOut) || '17:38'}
              </div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#475569', fontWeight: 600 }}>CÔNG T{selectedMonth}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {totalMonthDays.toFixed(1).replace('.0', '')} công
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.5rem 0.7rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
            📌 <strong>Xác nhận công:</strong> Khi quên Check-in/Check-out, bấm <strong>"Làm Đơn xác nhận công"</strong> để mở trang soạn đơn &amp; in biên bản trình <strong>Trưởng bộ phận (PM)</strong> ký xác nhận.
          </div>
        </div>

        {/* Cột phải: Quy chế Đi muộn Công ty LLA & Hạn mức 3 lần/tháng */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1rem 1.2rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              Quy định Đi muộn &amp; Hạn mức Tháng {selectedMonth}/{selectedYear}
            </strong>
            <span style={{
              fontSize: '0.73rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: usedLateQuota >= 3 ? '#FEE2E2' : '#FEF3C7',
              color: usedLateQuota >= 3 ? '#B91C1C' : '#B45309',
              border: usedLateQuota >= 3 ? '1px solid #FECACA' : '1px solid #FDE68A'
            }}>
              Đã dùng: {usedLateQuota} / 3 lần miễn phạt
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.76rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: '#F0FDF4', borderRadius: '0.4rem', color: '#166534' }}>
              <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
              <span><strong>Đi muộn ≤ 5 phút (08:00 – 08:05):</strong> Trong hạn châm chước, tính đủ <strong>1.0 công</strong>, không phạt.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: '#FFFBEB', borderRadius: '0.4rem', color: '#92400E' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Đi muộn 5 phút – 1 tiếng (08:06 – 09:00):</strong> Phải làm <strong>Đơn xin đi muộn</strong> (tối đa <strong>3 lần/tháng</strong> vẫn được tính đủ công; không làm đơn hoặc từ lần thứ 4 sẽ bị phạt).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: '#FEF2F2', borderRadius: '0.4rem', color: '#991B1B' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Đi muộn &gt; 1 tiếng (Sau 09:00):</strong> Tự động <strong>mất công buổi sáng (0.5 công)</strong> hoặc mất công ngày hôm đó.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bảng chấm công cá nhân chi tiết theo tháng đang chọn */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '0.8rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Chi tiết Bảng chấm công Tháng {selectedMonth}/{selectedYear} ({attendanceRecords.length} ngày làm việc)
            </strong>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Chỉ hiển thị dữ liệu thực tế từ đầu tháng đến ngày hiện tại ({selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() ? `29/${selectedMonth}/${selectedYear}` : `cuối tháng ${selectedMonth}/${selectedYear}`})
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.7rem 1.1rem', textAlign: 'left', fontWeight: 700 }}>Ngày làm việc</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Giờ Vào (In)</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Giờ Ra (Out)</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Đối soát quy chế LLA</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Công ghi nhận</th>
                <th style={{ padding: '0.7rem 1.1rem', textAlign: 'right', fontWeight: 700 }}>Lập đơn</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Đang tải dữ liệu chấm công tháng {selectedMonth}/{selectedYear}...
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Không có dữ liệu chấm công trong tháng {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((rec, i) => {
                  const inStr = fmtTime(rec.checkIn);
                  const outStr = fmtTime(rec.checkOut);
                  const lateMins = getLateMinutes(rec.checkIn);
                  const isMissingOut = inStr && !outStr && rec.status !== 'ON_LEAVE';
                  const isLate5to60 = lateMins > 5 && lateMins <= 60 && rec.status !== 'NORMAL';
                  const isLateOver60 = lateMins > 60;
                  const dateIso = rec.date ? new Date(rec.date).toISOString().split('T')[0] : '';

                  return (
                    <tr
                      key={rec.id || i}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isLateOver60 ? '#FEF2F2' : (isMissingOut || isLate5to60) ? '#FFFBEB' : '#FFFFFF'
                      }}
                    >
                      <td style={{ padding: '0.7rem 1.1rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {rec.date ? new Date(rec.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', fontFamily: 'monospace', fontWeight: 700, color: lateMins > 5 ? '#B45309' : '#15803D', whiteSpace: 'nowrap' }}>
                        {inStr || '—'} {lateMins > 5 ? `(Muộn ${lateMins}p)` : lateMins > 0 ? `(Ân hạn +${lateMins}p)` : ''}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', fontFamily: 'monospace', fontWeight: 700, color: isMissingOut ? '#B45309' : '#1E293B', whiteSpace: 'nowrap' }}>
                        {outStr || '⚠ — (Quên Check-out)'}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        {isMissingOut ? (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⚠ Quên Check-out (Cần làm Đơn xác nhận chấm công)
                          </span>
                        ) : isLateOver60 ? (
                          <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⛔ Đi muộn &gt; 1 tiếng ({lateMins}p) ➔ Mất công buổi sáng
                          </span>
                        ) : isLate5to60 ? (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⏰ Đi muộn {lateMins}p (5p–60p) ➔ Cần làm Đơn xin đi muộn (≤3 lần/tháng)
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ✓ Đúng quy định (≤ 08:05)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {isLateOver60 || isMissingOut ? '0.5 công' : `${Number(rec.workingDay ?? 1.0)} công`}
                      </td>
                      <td style={{ padding: '0.7rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isMissingOut ? (
                          <button
                            onClick={() => openFullPageForm('CONFIRM_ATTENDANCE', {
                              date: dateIso,
                              subType: 'Đơn xác nhận chấm công (Quên Check-out)',
                              oldTime: `${inStr} / — (Thiếu giờ ra)`,
                              reason: 'do quên quét dấu vân tay lúc ra về (đã làm việc đủ thời gian tại công ty)'
                            })}
                            className="btn btn-outline"
                            style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, borderColor: '#2563EB', color: '#1D4ED8' }}
                          >
                            📄 Lập Đơn xác nhận công
                          </button>
                        ) : isLate5to60 ? (
                          <button
                            onClick={() => openFullPageForm('LATE_PERMISSION', {
                              date: dateIso,
                              lateDuration: `${lateMins} phút`,
                              oldTime: `${inStr} (Muộn ${lateMins} phút)`,
                              reason: `Em xin phép đến muộn ${lateMins} phút ngày ${new Date(rec.date).toLocaleDateString('vi-VN')} do có lịch học trên trường / việc đột xuất đầu giờ sáng ạ`
                            })}
                            className="btn btn-outline"
                            style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, borderColor: '#F59E0B', color: '#B45309' }}
                          >
                            ⏰ Lập Đơn xin đi muộn
                          </button>
                        ) : isLateOver60 ? (
                          <span style={{ fontSize: '0.73rem', color: '#DC2626', fontWeight: 700 }}>Quá 1h (Trừ 0.5 công)</span>
                        ) : (
                          <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>Đạt chuẩn</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Danh sách Đơn đã lập trong tháng & Nút Mở Trang Xem / In Biên Bản */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '0.8rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Đơn xác nhận chấm công &amp; Đơn xin đi muộn đã lập ({filteredMonthAdjustments.length})
            </strong>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Bấm <strong>"Mở trang Xem &amp; In đơn"</strong> để xem toàn trang văn bản chuẩn Công ty LLA và in trình PM ký
            </div>
          </div>
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
              {filteredMonthAdjustments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B' }}>
                    Chưa có đơn xác nhận chấm công hoặc đơn xin đi muộn nào trong tháng {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredMonthAdjustments.map(adj => (
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
                        backgroundColor: String(adj.type).toLowerCase().includes('đi muộn') ? '#FEF3C7' : '#EFF6FF',
                        color: String(adj.type).toLowerCase().includes('đi muộn') ? '#B45309' : '#1D4ED8'
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
                        onClick={() => openExistingDocFullPage(adj)}
                        className="btn btn-outline"
                        style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
                        title="Mở trang Xem và In biên bản A4"
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
