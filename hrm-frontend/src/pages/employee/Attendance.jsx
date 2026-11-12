import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Cpu, FileText, AlertTriangle, CheckCircle2, Plus
} from 'lucide-react';
import axios from 'axios';
import { TablePagination, usePagination } from '../../components/common/TablePagination';
import {
  MonthNavigator,
  fmtTime,
  getAuthHeaders,
  getLateMinutes,
  getMonthQueryStr,
} from '../../components/attendance/AttendanceShared';

export const EmployeeAttendance = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [currentTime, setCurrentTime] = useState(now.toLocaleTimeString('vi-VN'));

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [myAdjustments, setMyAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  const employeeId = localStorage.getItem('employeeId');
  const monthQueryStr = getMonthQueryStr(selectedYear, selectedMonth);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    if (employeeId) {
      try {
        const [attRes, adjRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/attendance/employee/${employeeId}?month=${monthQueryStr}`, { headers }),
          axios.get('http://localhost:5000/api/attendance/adjustments', { headers }),
        ]);

        const recordsList = Array.isArray(attRes.data) ? attRes.data : (attRes.data?.records || []);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const validRecords = recordsList.filter(r => r.date && new Date(r.date) <= todayEnd);

        setAttendanceRecords(validRecords);
        if (Array.isArray(adjRes.data)) setMyAdjustments(adjRes.data);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [employeeId, selectedMonth, selectedYear]);

  const {
    currentPage: attPage,
    setCurrentPage: setAttPage,
    pageSize: attPageSize,
    setPageSize: setAttPageSize,
    totalItems: attTotalItems,
    totalPages: attTotalPages,
    paginatedItems: paginatedAttendance,
    resetPage: resetAttPage,
  } = usePagination(attendanceRecords, 10);

  useEffect(() => {
    resetAttPage();
  }, [selectedMonth, selectedYear, resetAttPage]);

  const usedLateQuota = useMemo(() => {
    return myAdjustments.filter(a => {
      if (!a.date || a.status === 'REJECTED') return false;
      const d = new Date(a.date);
      const isSameMonth = (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      return isSameMonth && String(a.type || '').toLowerCase().includes('đi muộn');
    }).length;
  }, [myAdjustments, selectedMonth, selectedYear]);

  const todayRecord = useMemo(() => {
    const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return attendanceRecords.find(r => {
      if (!r.date) return false;
      const dStr = typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0];
      return dStr === localTodayStr;
    }) || null;
  }, [attendanceRecords, now]);

  const totalMonthDays = useMemo(() => {
    return attendanceRecords.reduce((sum, r) => sum + Number(r.workingDay || 0), 0);
  }, [attendanceRecords]);

  const goToExplanation = (prefill) => {
    navigate('/employee/attendance/explanations', { state: { prefill } });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {/* 1. Header & Bộ chọn Tháng / Năm */}
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
              Theo Dõi Bảng Chấm Công Cá Nhân (Công ty LLA)
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
              Kỳ công đang xem: <strong>Tháng {selectedMonth}/{selectedYear}</strong> (Tính đến ngày {selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() ? `${now.getDate()}/${selectedMonth}/${selectedYear}` : `cuối tháng ${selectedMonth}/${selectedYear}`})
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
            onClick={() => navigate('/employee/attendance/explanations')}
            className="btn btn-primary"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <FileText size={15} /> Giải trình công
          </button>
          <button
            onClick={() => navigate('/employee/attendance/ot')}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderColor: '#8B5CF6', color: '#6D28D9', backgroundColor: '#F5F3FF' }}
          >
            <Plus size={15} /> Đăng ký OT
          </button>
        </div>
      </div>

      {/* 2. Khối Trạng thái Máy chấm công hôm nay & Quy định Chấm công */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.9rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1rem 1.2rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '0.9rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#2563EB" />
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Log Máy chấm công hôm nay ({now.toLocaleDateString('vi-VN')})
              </strong>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '999px' }}>
              ● Đồng bộ Vân tay / Khuôn mặt
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '0.6rem', alignItems: 'center', flex: 1 }}>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.85rem 0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 600 }}>GIỜ HỆ THỐNG</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{currentTime}</div>
            </div>
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.5rem', padding: '0.85rem 0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#166534', fontWeight: 600 }}>GIỜ VÀO (IN)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: todayRecord?.checkIn ? '#15803D' : '#94A3B8', fontFamily: 'monospace' }}>
                {fmtTime(todayRecord?.checkIn) || '--:--'}
              </div>
            </div>
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.5rem', padding: '0.85rem 0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#1E40AF', fontWeight: 600 }}>GIỜ RA (OUT)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: todayRecord?.checkOut ? '#1D4ED8' : '#94A3B8', fontFamily: 'monospace' }}>
                {fmtTime(todayRecord?.checkOut) || '--:--'}
              </div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.85rem 0.55rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.66rem', color: '#475569', fontWeight: 600 }}>CÔNG T{selectedMonth}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {totalMonthDays.toFixed(1).replace('.0', '')} công
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Quy định chấm công */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1rem 1.2rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.55rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              Quy định Chấm công Công ty LLA (Ca HC 08:00 - 17:30)
            </strong>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
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
              <span><strong>Đi muộn ≤ 5 phút (08:00 – 08:05):</strong> Trong hạn ân hạn, tính đủ <strong>1.0 công</strong>, không phạt.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: '#FFFBEB', borderRadius: '0.4rem', color: '#92400E' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Đi muộn / Về sớm / Quên quét công:</strong> Vào mục <strong>Giải trình công</strong> để lập đơn (Đi muộn miễn phạt tối đa <strong>3 lần/tháng</strong>).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: '#FEF2F2', borderRadius: '0.4rem', color: '#991B1B' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Đi muộn &gt; 30 phút không phép hoặc vắng:</strong> Bị mất công buổi hoặc mất công ngày làm việc hôm đó.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bảng chấm công chi tiết theo tháng */}
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
              Các ngày quên Check-out, đi muộn hoặc về sớm có nút lập đơn nhanh chuyển thẳng sang trang Giải trình công
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
                paginatedAttendance.map((rec, i) => {
                  const inStr = fmtTime(rec.checkIn);
                  const outStr = fmtTime(rec.checkOut);
                  const lateMins = getLateMinutes(rec.checkIn);
                  const workVal = rec.workingDay !== undefined ? Number(rec.workingDay) : 1.0;
                  const isLeave = rec.status === 'ON_LEAVE';
                  const isPaidLeaveFull = isLeave && workVal >= 1.0;
                  const isPaidLeaveHalf = isLeave && workVal === 0.5;
                  const isUnpaidLeave = isLeave && workVal === 0.0;
                  const isHoliday = rec.status === 'HOLIDAY';
                  const isAbsent = rec.status === 'ABSENT';
                  const isWfh = rec.status === 'WFH';
                  const isEarlyLeave = rec.status === 'EARLY_LEAVE';
                  const isMissingOut = Boolean(inStr && !outStr && !isLeave && !isHoliday && !isAbsent);
                  const isLate5to30 = Boolean(lateMins > 5 && lateMins <= 30 && rec.status !== 'NORMAL' && !isLeave && !isHoliday);
                  const isLateOver30 = Boolean(lateMins > 30 && !isLeave && !isHoliday);
                  const dateIso = rec.date ? new Date(rec.date).toISOString().split('T')[0] : '';

                  let rowBg = '#FFFFFF';
                  if (isPaidLeaveFull) rowBg = '#EEF2FF';
                  else if (isPaidLeaveHalf) rowBg = '#E0F2FE';
                  else if (isUnpaidLeave) rowBg = '#F8FAFC';
                  else if (isHoliday) rowBg = '#FAF5FF';
                  else if (isAbsent || isLateOver30) rowBg = '#FEF2F2';
                  else if (isMissingOut || isLate5to30 || isEarlyLeave) rowBg = '#FFFBEB';

                  return (
                    <tr key={rec.id || i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: rowBg }}>
                      <td style={{ padding: '0.7rem 1.1rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {rec.date ? new Date(rec.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', fontFamily: 'monospace', fontWeight: 700, color: lateMins > 5 ? '#B45309' : '#15803D', whiteSpace: 'nowrap' }}>
                        {isLeave || isHoliday ? '—' : (inStr || '—')} {lateMins > 5 && !isLeave && !isHoliday ? `(Muộn ${lateMins}p)` : lateMins > 0 && !isLeave && !isHoliday ? `(Ân hạn +${lateMins}p)` : ''}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', fontFamily: 'monospace', fontWeight: 700, color: isMissingOut ? '#B45309' : '#1E293B', whiteSpace: 'nowrap' }}>
                        {isLeave || isHoliday ? '—' : (outStr || '⚠ — (Quên Check-out)')}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        {isPaidLeaveFull ? (
                          <span style={{ backgroundColor: '#EEF2FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            🔵 Nghỉ phép năm (P) — Hưởng 100% lương
                          </span>
                        ) : isPaidLeaveHalf ? (
                          <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            🔷 Nửa ngày phép (P/2) — Hưởng 0.5 công
                          </span>
                        ) : isUnpaidLeave ? (
                          <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⚪ Nghỉ không hưởng lương (KL) — 0 công
                          </span>
                        ) : isHoliday ? (
                          <span style={{ backgroundColor: '#FAF5FF', color: '#7E22CE', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            🟣 Nghỉ lễ tết (Lễ) — Hưởng nguyên lương
                          </span>
                        ) : isAbsent ? (
                          <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⛔ Vắng không phép (KP) — Trừ công
                          </span>
                        ) : isWfh ? (
                          <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            🌐 Làm việc từ xa (WFH)
                          </span>
                        ) : isMissingOut ? (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⚠ Quên Check-out (Cần làm Đơn xác nhận chấm công)
                          </span>
                        ) : isEarlyLeave ? (
                          <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            🏃 Về sớm trước giờ tan ca (Có thể lập Đơn xin về sớm)
                          </span>
                        ) : isLateOver30 ? (
                          <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⛔ Đi muộn &gt; 30 phút ({lateMins}p) ➔ Không tính công cả ngày (0 công)
                          </span>
                        ) : isLate5to30 ? (
                          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⏰ Đi muộn {lateMins}p (5p–30p) ➔ Cần nộp Đơn (≤ 3 lần/tháng)
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ✓ Đúng quy định (≤ 08:05)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {isUnpaidLeave || isAbsent || isLateOver30 ? '0.0 công' : isPaidLeaveHalf ? '0.5 công' : isMissingOut ? '0.5 công' : `${workVal.toFixed(1)} công`}
                      </td>
                      <td style={{ padding: '0.7rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isPaidLeaveFull || isPaidLeaveHalf || isUnpaidLeave || isHoliday ? (
                          <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 600 }}>Đã ghi nhận nghỉ</span>
                        ) : isMissingOut ? (
                          <button
                            onClick={() => goToExplanation({
                              category: 'CONFIRM_ATTENDANCE',
                              date: dateIso,
                              subType: 'Đơn xác nhận chấm công (Quên Check-out)',
                              oldTime: `${inStr} / — (Thiếu giờ ra)`,
                              reason: 'do quên quét dấu vân tay lúc ra về (đã làm việc đủ thời gian tại công ty)',
                            })}
                            className="btn btn-outline"
                            style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, borderColor: '#2563EB', color: '#1D4ED8' }}
                          >
                            📄 Lập Đơn xác nhận công
                          </button>
                        ) : isEarlyLeave ? (
                          <button
                            onClick={() => goToExplanation({
                              category: 'EARLY_LEAVE_PERMISSION',
                              date: dateIso,
                              duration: '1 tiếng',
                              oldTime: `${inStr || '--'} / ${outStr || '--'} (Về sớm)`,
                              reason: `Em xin phép về sớm ngày ${new Date(rec.date).toLocaleDateString('vi-VN')} do có việc đột xuất ạ`,
                            })}
                            className="btn btn-outline"
                            style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, borderColor: '#EA580C', color: '#C2410C' }}
                          >
                            🏃 Lập Đơn xin về sớm
                          </button>
                        ) : isLate5to30 ? (
                          <button
                            onClick={() => goToExplanation({
                              category: 'LATE_PERMISSION',
                              date: dateIso,
                              duration: `${lateMins} phút`,
                              oldTime: `${inStr} (Muộn ${lateMins} phút)`,
                              reason: `Em xin phép đến muộn ${lateMins} phút ngày ${new Date(rec.date).toLocaleDateString('vi-VN')} do có việc đột xuất đầu giờ sáng ạ`,
                            })}
                            className="btn btn-outline"
                            style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, borderColor: '#F59E0B', color: '#B45309' }}
                          >
                            ⏰ Lập Đơn xin đi muộn
                          </button>
                        ) : isLateOver30 ? (
                          <span style={{ fontSize: '0.73rem', color: '#DC2626', fontWeight: 700 }}>Muộn &gt; 30p (Mất công ngày)</span>
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

        {!loading && (
          <TablePagination
            currentPage={attPage}
            totalPages={attTotalPages}
            pageSize={attPageSize}
            totalItems={attTotalItems}
            onPageChange={setAttPage}
            onPageSizeChange={setAttPageSize}
            itemLabel="ngày"
          />
        )}
      </div>
    </div>
  );
};
