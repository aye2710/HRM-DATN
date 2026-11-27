import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, CalendarRange, Award, DollarSign, FileText, Target, Laptop, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [currentDate] = useState(
    new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [standardWorkingDays, setStandardWorkingDays] = useState(null);
  const [myAdjustments, setMyAdjustments] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ totalDays: 0, usedDays: 0, carryForwardDays: 0, carryForwardUsed: 0 });
  const [otData, setOtData] = useState({ requests: [], summary: { monthHours: 0, yearHours: 0 } });
  const [payslipsList, setPayslipsList] = useState([]);
  const [latestPayslip, setLatestPayslip] = useState(null);
  const [showSalary, setShowSalary] = useState(false);
  const [kpis, setKpis] = useState([]);
  const [activeAssets, setActiveAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fullName = localStorage.getItem('fullName') || 'Nhân viên';
  const employeeCode = localStorage.getItem('employeeCode') || '';
  const employeeId = localStorage.getItem('employeeId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOverview = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const curNow = new Date();
      const monthQueryStr = `${curNow.getFullYear()}-${String(curNow.getMonth() + 1).padStart(2, '0')}`;

      try {
        const [attRes, adjRes, leaveRes, otRes, payRes, kpiRes, empRes] = await Promise.all([
          axios.get(`/api/attendance/employee/${employeeId}`, { headers }).catch(() => ({ data: [] })),
          axios.get('/api/attendance/adjustments', { headers }).catch(() => ({ data: [] })),
          axios.get(`/api/leaves/employee/${employeeId}`, { headers }).catch(() => ({ data: null })),
          axios.get(`/api/ot/employee/${employeeId}?month=${monthQueryStr}`, { headers }).catch(() => ({ data: null })),
          axios.get(`/api/payroll/employee/${employeeId}`, { headers }).catch(() => ({ data: [] })),
          axios.get(`/api/kpi/employee/${employeeId}`, { headers }).catch(() => ({ data: [] })),
          axios.get(`/api/employees/${employeeId}`, { headers }).catch(() => ({ data: null }))
        ]);

        const recordsList = Array.isArray(attRes.data) ? attRes.data : (attRes.data?.records || []);
        setAttendanceRecords(recordsList);
        if (attRes.data?.summary?.standardWorkingDays !== undefined) {
          setStandardWorkingDays(attRes.data.summary.standardWorkingDays);
        }
        if (Array.isArray(adjRes.data)) setMyAdjustments(adjRes.data);
        if (leaveRes.data?.balance) setLeaveBalance(leaveRes.data.balance);
        if (Array.isArray(leaveRes.data?.requests)) setMyLeaves(leaveRes.data.requests);
        if (otRes.data) {
          setOtData({
            requests: Array.isArray(otRes.data.requests) ? otRes.data.requests : [],
            summary: otRes.data.summary || { monthHours: 0, yearHours: 0 }
          });
        }
        const payslips = Array.isArray(payRes.data) ? payRes.data : (payRes.data?.payslips || []);
        setPayslipsList(payslips);
        if (payslips.length > 0) setLatestPayslip(payslips[0]);
        if (Array.isArray(kpiRes.data)) setKpis(kpiRes.data);
        const empAssets = Array.isArray(empRes.data?.assetAssignments)
          ? empRes.data.assetAssignments.filter(a => a.status === 'ACTIVE')
          : [];
        setActiveAssets(empAssets);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [employeeId, token]);

  const actualWorkingDays = attendanceRecords.reduce((acc, r) => acc + Number(r.workingDay || 0), 0);
  const now = new Date();
  const lateUsedCount = myAdjustments.filter(a => {
    if (!a.date || a.status === 'REJECTED') return false;
    const d = new Date(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && String(a.type || '').toLowerCase().includes('đi muộn');
  }).length;
  const pendingCount = myAdjustments.filter(a => a.status === 'PENDING').length;

  const recentRequests = useMemo(() => {
    const items = [];
    for (const l of myLeaves) {
      items.push({
        id: `leave-${l.id}`,
        kind: 'Nghỉ phép',
        title: l.leaveTypeConfig?.name || (l.leaveType === 'UNPAID' ? 'Nghỉ không lương' : 'Nghỉ phép'),
        date: l.startDate,
        status: l.status,
        to: '/employee/leave',
        color: '#059669',
        bg: '#ECFDF5'
      });
    }
    for (const o of otData.requests) {
      items.push({
        id: `ot-${o.id}`,
        kind: 'Làm thêm OT',
        title: `${Number(o.hours || 0)} giờ (${o.reason || 'Tăng ca'})`,
        date: o.date,
        status: o.status,
        to: '/employee/attendance/ot',
        color: '#7C3AED',
        bg: '#F3E8FF'
      });
    }
    for (const a of myAdjustments) {
      items.push({
        id: `adj-${a.id}`,
        kind: a.type || 'Giải trình công',
        title: a.reason || 'Xác nhận chấm công',
        date: a.date,
        status: a.status,
        to: '/employee/attendance/explanations',
        color: '#D97706',
        bg: '#FFFBEB'
      });
    }
    return items
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6);
  }, [myLeaves, otData.requests, myAdjustments]);

  const kpiAvgProgress = useMemo(() => {
    if (!kpis.length) return 0;
    const sum = kpis.reduce((acc, k) => {
      const target = Number(k.target || 0);
      const achieved = Number(k.achieved || 0);
      if (target <= 0) return acc;
      return acc + Math.min(100, Math.round((achieved / target) * 100));
    }, 0);
    return Math.round(sum / kpis.length);
  }, [kpis]);

  const attendanceChart = useMemo(() => {
    const counts = { ON_TIME: 0, LATE_EARLY: 0, ON_LEAVE: 0, OTHER: 0 };
    for (const r of attendanceRecords) {
      const st = String(r.status || '').toUpperCase();
      if (st === 'PRESENT' || st === 'ON_TIME') counts.ON_TIME += 1;
      else if (st === 'LATE' || st === 'EARLY_LEAVE') counts.LATE_EARLY += 1;
      else if (st === 'ON_LEAVE') counts.ON_LEAVE += 1;
      else counts.OTHER += 1;
    }
    const total = attendanceRecords.length;
    const items = [
      { key: 'ON_TIME', label: 'Đúng giờ', count: counts.ON_TIME, color: '#2563EB' },
      { key: 'LATE_EARLY', label: 'Đi muộn / Về sớm', count: counts.LATE_EARLY, color: '#F59E0B' },
      { key: 'ON_LEAVE', label: 'Nghỉ phép', count: counts.ON_LEAVE, color: '#10B981' },
      { key: 'OTHER', label: 'Nghỉ lễ / Khác', count: counts.OTHER, color: '#7C3AED' }
    ];
    let offset = 0;
    const segments = items.map(item => {
      const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
      const seg = { ...item, percent, dashArray: `${percent}, 100`, dashOffset: -offset };
      offset += percent;
      return seg;
    });
    return { total, segments };
  }, [attendanceRecords]);

  const salaryChart = useMemo(() => {
    const sorted = [...payslipsList]
      .sort((a, b) => {
        const [mA, yA] = String(a.payrollPeriod?.monthYear || '0-0').split('-').map(Number);
        const [mB, yB] = String(b.payrollPeriod?.monthYear || '0-0').split('-').map(Number);
        return (yA * 12 + mA) - (yB * 12 + mB);
      })
      .slice(-6);
    const maxNet = Math.max(1, ...sorted.map(p => Number(p.netSalary || 0)));
    return {
      items: sorted.map(p => ({
        id: p.id,
        label: p.payrollPeriod?.monthYear ? `T${p.payrollPeriod.monthYear.split('-')[0]}` : 'Kỳ',
        net: Number(p.netSalary || 0),
        heightPercent: Math.max(12, Math.round((Number(p.netSalary || 0) / maxNet) * 100))
      }))
    };
  }, [payslipsList]);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      
      {/* 1. Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        borderRadius: '0.85rem',
        padding: '1.35rem 1.6rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 20px -5px rgba(15, 23, 42, 0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            fontWeight: 800,
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>
                Xin chào, {fullName}!
              </h1>
              <span style={{
                backgroundColor: 'rgba(37,99,235,0.3)',
                border: '1px solid rgba(96,165,250,0.4)',
                color: '#93C5FD',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.74rem',
                fontWeight: 600
              }}>
                {employeeCode}
              </span>
              {loading && (
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#CBD5E1',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 500
                }}>
                  Đang tải...
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8rem' }}>
              Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA • <span style={{ textTransform: 'capitalize' }}>{currentDate}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/employee/attendance/records')}
            className="btn"
            style={{
              backgroundColor: '#F59E0B',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 700,
              height: '36px',
              padding: '0 0.95rem'
            }}
          >
            <Clock size={15} /> Theo dõi chấm công
          </button>
          <button
            onClick={() => navigate('/employee/leave')}
            className="btn btn-outline"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 600,
              height: '36px',
              padding: '0 0.95rem'
            }}
          >
            <CalendarRange size={15} /> Xin nghỉ phép
          </button>
          <button
            onClick={() => navigate('/employee/payslip')}
            className="btn btn-primary"
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              height: '36px',
              padding: '0 0.95rem'
            }}
          >
            <DollarSign size={15} /> Xem phiếu lương
          </button>
        </div>
      </div>

      {/* 2. 4 Thẻ Chỉ số Tổng quan Cá nhân */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
        <div
          onClick={() => navigate('/employee/attendance/records')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.1rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Công tích lũy tháng</span>
            <Award size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669' }}>
            {actualWorkingDays.toFixed(1).replace('.0', '')} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>/ {standardWorkingDays ?? '--'} công</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, marginTop: '0.25rem' }}>
            Xem chi tiết bảng công →
          </div>
        </div>

        <div
          onClick={() => navigate('/employee/attendance/explanations')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.1rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Hạn mức Xin đi muộn</span>
            <Clock size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: lateUsedCount >= 3 ? '#DC2626' : '#D97706' }}>
            {lateUsedCount} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>/ 3 lần miễn phạt</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
            Đi muộn 5p – 1h có đơn được tính công
          </div>
        </div>

        <div
          onClick={() => navigate('/employee/leave')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.1rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Quỹ phép năm còn</span>
            <CalendarRange size={18} color="#2563EB" />
          </div>
          {(() => {
            const carryRemain = Math.max(0, Number(leaveBalance.carryForwardDays || 0) - Number(leaveBalance.carryForwardUsed || 0));
            const rawRemain = Number(leaveBalance.totalDays || 0) - Number(leaveBalance.usedDays || 0) + carryRemain;
            const isOver = rawRemain < 0;
            return (
              <>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: isOver ? '#DC2626' : '#0F172A' }}>
                  {Math.max(0, rawRemain)} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>ngày</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: isOver ? '#DC2626' : '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                  {isOver
                    ? `Vượt ${Math.abs(rawRemain)} ngày (${Number(leaveBalance.usedDays)}/${Number(leaveBalance.totalDays)})`
                    : `Đã dùng: ${Number(leaveBalance.usedDays)} / ${Number(leaveBalance.totalDays)} ngày${carryRemain > 0 ? ` (+${carryRemain} tồn)` : ''}`}
                </div>
              </>
            );
          })()}
        </div>

        <div
          onClick={() => navigate('/employee/attendance/explanations')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.1rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Đơn xác nhận chờ duyệt</span>
            <FileText size={18} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7C3AED' }}>
            {pendingCount} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>đơn</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
            Tổng cộng {myAdjustments.length} đơn đã gửi
          </div>
        </div>
      </div>

      {/* 3. Nội quy Chấm công LLA & Lối tắt nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        
        {/* Cột trái: Tóm tắt Quy định Chấm công Công ty LLA */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.2rem 1.35rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Sổ tay Quy định Chấm công (Công ty LLA)
            </strong>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1D4ED8', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '999px' }}>
              Ca HC: 08:00 - 17:30
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <strong>1. Quên Check-in / Check-out hoặc chưa làm dấu vân tay:</strong><br />
              Nhân viên vào mục <strong>Chấm công ➔ Giải trình công</strong> lập <em>&quot;Đơn xin xác nhận chấm công&quot;</em> (ghi rõ ngày và lý do), in biên bản trình <strong>Trưởng bộ phận (PM)</strong> ký xác nhận rồi nộp về Phòng <strong>HCNS - Kế Toán</strong> duyệt.
            </div>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#FFFBEB', borderRadius: '0.5rem', border: '1px solid #FDE68A' }}>
              <strong>2. Quy định Đi muộn từ 5 phút đến 1 tiếng (08:06 – 09:00):</strong><br />
              - Phải làm <em>"Đơn xin phép đi muộn"</em> trình Trưởng bộ phận phê duyệt (nếu không làm đơn sẽ bị phạt).<br />
              - Có đơn được tính đủ công và miễn phạt <strong>tối đa 3 lần/tháng</strong>; từ lần thứ 4 trở đi trong tháng sẽ bị phạt.
            </div>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#FEF2F2', borderRadius: '0.5rem', border: '1px solid #FECACA', color: '#991B1B' }}>
              <strong>3. Đi muộn quá 1 tiếng (Sau 09:00):</strong><br />
              Sẽ bị <strong>mất công buổi sáng (0.5 công)</strong> hoặc mất công ngày làm việc hôm đó.
            </div>
          </div>
        </div>

        {/* Cột phải: Truy cập nhanh các phân hệ cá nhân */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.2rem 1.35rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
            Tiện ích Cổng Nhân viên (Self-Service)
          </strong>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {[
              { to: '/employee/attendance/records', title: 'Theo dõi Chấm công', desc: 'Xem log máy chấm công & bảng công chi tiết theo tháng', icon: <Clock size={18} color="#2563EB" />, bg: '#EFF6FF' },
              { to: '/employee/attendance/explanations', title: 'Giải trình Công', desc: 'Đơn xác nhận công, xin đi muộn & xin về sớm', icon: <FileText size={18} color="#D97706" />, bg: '#FFFBEB' },
              { to: '/employee/attendance/ot', title: 'Làm thêm giờ (OT)', desc: 'Đăng ký OT & theo dõi hạn mức tháng/năm', icon: <Clock size={18} color="#7C3AED" />, bg: '#F3E8FF' },
              { to: '/employee/leave', title: 'Quản lý Nghỉ phép', desc: 'Đăng ký nghỉ phép năm, nghỉ ốm, nghỉ nửa buổi', icon: <CalendarRange size={18} color="#059669" />, bg: '#ECFDF5' },
              { to: '/employee/payslip', title: 'Phiếu lương Điện tử', desc: 'Tra cứu bảng lương chi tiết, phụ cấp & khấu trừ', icon: <DollarSign size={18} color="#D97706" />, bg: '#FFFBEB' },
              { to: '/employee/kpi', title: 'Mục tiêu & KPI', desc: 'Tự đánh giá hiệu suất công việc định kỳ', icon: <Target size={18} color="#7C3AED" />, bg: '#F3E8FF' }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(item.to)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '0.65rem',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: '8px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{item.title}</strong>
                <span style={{ fontSize: '0.73rem', color: '#64748B', lineHeight: 1.35 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3.5. Biểu đồ Trực quan Cá nhân (Donut Ngày công & Cột Thu nhập) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        
        {/* Biểu đồ 1: Donut Cơ cấu Ngày công tháng này */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.2rem 1.35rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Biểu đồ Cơ cấu Ngày công tháng này
            </strong>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '999px' }}>
              {attendanceChart.total} ngày ghi nhận
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 126, height: 126, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F1F5F9" strokeWidth="4" />
                {attendanceChart.segments.map((seg) => (
                  seg.percent > 0 ? (
                    <circle
                      key={seg.key}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="4"
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                    />
                  ) : null
                ))}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {actualWorkingDays}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>công thực</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
              {attendanceChart.segments.map((seg) => (
                <div key={seg.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: seg.color, display: 'inline-block' }} />
                    <span>{seg.label}</span>
                  </div>
                  <strong style={{ color: '#0F172A' }}>{seg.count} ({seg.percent}%)</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biểu đồ 2: Cột Xu hướng Thu nhập Thực nhận (Net) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.2rem 1.35rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Biểu đồ Xu hướng Thu nhập (6 kỳ gần nhất)
            </strong>
            <button
              type="button"
              onClick={() => setShowSalary(s => !s)}
              style={{ border: '1px solid #CBD5E1', background: '#F8FAFC', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}
            >
              {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
              {showSalary ? 'Ẩn số' : 'Hiện số'}
            </button>
          </div>

          {salaryChart.items.length === 0 ? (
            <div style={{ flex: 1, minHeight: '126px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.82rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #E2E8F0' }}>
              Chưa có dữ liệu kỳ lương để vẽ biểu đồ xu hướng.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '0.75rem', height: '132px', paddingTop: '18px', borderBottom: '1px solid #E2E8F0' }}>
              {salaryChart.items.map((item) => (
                <div key={item.id} style={{ flex: 1, maxWidth: '58px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>
                    {showSalary ? `${(item.net / 1_000_000).toFixed(1)}tr` : '•••'}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${item.heightPercent}%`,
                      background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.25s ease'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', paddingBottom: '4px' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. Hoạt động gần đây & Tổng hợp Thu nhập / KPI / Tài sản */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        
        {/* Cột trái: Đơn từ gần đây */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.2rem 1.35rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Đơn từ & Đề xuất gần đây
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {recentRequests.length} mục mới nhất
            </span>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{ padding: '1.75rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #E2E8F0' }}>
              Chưa phát sinh đơn nghỉ phép, OT hoặc giải trình công nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentRequests.map((req) => {
                const statusMeta = req.status === 'APPROVED'
                  ? { label: 'Đã duyệt', color: '#15803D', bg: '#DCFCE7' }
                  : req.status === 'REJECTED'
                    ? { label: 'Từ chối', color: '#B91C1C', bg: '#FEE2E2' }
                    : { label: 'Chờ duyệt', color: '#B45309', bg: '#FEF3C7' };
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(req.to)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.55rem',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', backgroundColor: req.bg, color: req.color }}>
                          {req.kind}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {req.date ? new Date(req.date).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', backgroundColor: statusMeta.bg, color: statusMeta.color, flexShrink: 0 }}>
                      {statusMeta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột phải: Thu nhập, KPI, OT & Tài sản */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.2rem 1.35rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
            Tổng hợp Cá nhân (Lương, KPI, OT & Tài sản)
          </strong>

          {/* Phiếu lương gần nhất */}
          <div style={{ padding: '0.85rem 1rem', borderRadius: '0.6rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                Phiếu lương gần nhất {latestPayslip?.payrollPeriod?.monthYear ? `(Kỳ ${latestPayslip.payrollPeriod.monthYear})` : ''}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {latestPayslip
                  ? (showSalary ? `${Number(latestPayslip.netSalary || 0).toLocaleString('vi-VN')} VNĐ` : '•••••••• VNĐ')
                  : 'Chưa có kỳ lương'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {latestPayslip && (
                <button
                  type="button"
                  onClick={() => setShowSalary(s => !s)}
                  title={showSalary ? 'Ẩn số tiền' : 'Hiện số tiền'}
                  style={{ border: '1px solid #CBD5E1', background: '#FFFFFF', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showSalary ? <EyeOff size={15} color="#475569" /> : <Eye size={15} color="#475569" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/employee/payslip')}
                style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '0.78rem', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                Chi tiết <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Tiến độ KPI & OT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div
              onClick={() => navigate('/employee/kpi')}
              style={{ padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tiến độ KPI ({kpis.length} mục tiêu)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7C3AED', margin: '4px 0' }}>{kpiAvgProgress}%</div>
              <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${kpiAvgProgress}%`, height: '100%', backgroundColor: '#7C3AED', borderRadius: '999px' }} />
              </div>
            </div>

            <div
              onClick={() => navigate('/employee/attendance/ot')}
              style={{ padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Giờ OT đã ghi nhận</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', margin: '4px 0' }}>
                {Number(otData.summary?.monthHours || 0)}h <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>/ 40h tháng</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Tích lũy năm: {Number(otData.summary?.yearHours || 0)} / 200 giờ
              </div>
            </div>
          </div>

          {/* Tài sản công ty đang giữ */}
          <div style={{ padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Laptop size={18} color="#2563EB" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                  Tài sản công ty đang bàn giao ({activeAssets.length})
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeAssets.length > 0
                    ? activeAssets.map(a => a.asset?.name).filter(Boolean).join(', ')
                    : 'Chưa có thiết bị nào đang đứng tên sử dụng'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/employee/profile')}
              style={{ border: 'none', background: 'transparent', color: '#2563EB', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}
            >
              Xem hồ sơ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
