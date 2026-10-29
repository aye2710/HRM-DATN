import React, { useState, useEffect } from 'react';
import {
  Clock, CalendarRange, Award, DollarSign, FileText, Target, User, ArrowRight, CheckCircle2, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [currentDate] = useState(
    new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [myAdjustments, setMyAdjustments] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ totalDays: 12, usedDays: 0 });

  const fullName = localStorage.getItem('fullName') || 'Lê Văn Đôn';
  const employeeCode = localStorage.getItem('employeeCode') || 'NV0144';
  const employeeId = localStorage.getItem('employeeId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOverview = async () => {
      if (!employeeId) return;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [attRes, adjRes, leaveRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/attendance/employee/${employeeId}`, { headers }).catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/attendance/adjustments', { headers }).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/leaves/employee/${employeeId}`, { headers }).catch(() => ({ data: null }))
        ]);

        const recordsList = Array.isArray(attRes.data) ? attRes.data : (attRes.data?.records || []);
        setAttendanceRecords(recordsList);
        if (Array.isArray(adjRes.data)) setMyAdjustments(adjRes.data);
        if (leaveRes.data?.balance) setLeaveBalance(leaveRes.data.balance);
      } catch (e) {
        console.error(e);
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
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8rem' }}>
              Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA • <span style={{ textTransform: 'capitalize' }}>{currentDate}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/employee/attendance')}
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
            <Clock size={15} /> Bảng công & Giải trình
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
          onClick={() => navigate('/employee/attendance')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.1rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Công tích lũy tháng</span>
            <Award size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669' }}>
            {actualWorkingDays > 0 ? actualWorkingDays.toFixed(1).replace('.0', '') : 21} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>/ 22 công</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, marginTop: '0.25rem' }}>
            Xem chi tiết bảng công →
          </div>
        </div>

        <div
          onClick={() => navigate('/employee/attendance')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.1rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Hạn mức Xin đi muộn</span>
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
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {Number(leaveBalance.totalDays) - Number(leaveBalance.usedDays)} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>ngày</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
            Đã dùng: {Number(leaveBalance.usedDays)} / {Number(leaveBalance.totalDays)} ngày
          </div>
        </div>

        <div
          onClick={() => navigate('/employee/attendance')}
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
              Nhân viên vào mục <strong>Chấm công & Giải trình</strong> lập <em>"Đơn xin xác nhận chấm công"</em> (ghi rõ ngày và lý do), in biên bản trình <strong>Trưởng bộ phận (PM)</strong> ký xác nhận rồi nộp về Phòng <strong>HCNS - Kế Toán</strong> duyệt.
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
              { to: '/employee/attendance', title: 'Bảng công & Giải trình', desc: 'Tra cứu vân tay, in Đơn xác nhận công & Đơn xin đi muộn', icon: <Clock size={18} color="#2563EB" />, bg: '#EFF6FF' },
              { to: '/employee/leave', title: 'Quản lý Nghỉ phép', desc: 'Đăng ký nghỉ phép năm, nghỉ ốm, làm thêm giờ', icon: <CalendarRange size={18} color="#059669" />, bg: '#ECFDF5' },
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
    </div>
  );
};
