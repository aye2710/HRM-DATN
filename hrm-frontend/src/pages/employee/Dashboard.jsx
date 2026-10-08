import React, { useState, useEffect } from 'react';
import { 
  Clock, CalendarRange, CheckCircle2, AlertCircle, User, Briefcase, 
  Building, Shield, Award, Calendar, DollarSign, ArrowRight, Check,
  AlertTriangle, FileText, ChevronRight, Sparkles, Send
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick stats
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ totalDays: 12, usedDays: 0 });

  const fullName = localStorage.getItem('fullName') || 'Phạm Hoàng Long';
  const role = localStorage.getItem('role') || 'EMPLOYEE';
  const employeeCode = localStorage.getItem('employeeCode') || 'EMP-2026-001';
  const employeeId = localStorage.getItem('employeeId');

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial employee stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }
      try {
        // Lấy lịch sử công
        const attRes = await axios.get(`http://localhost:5000/api/attendance/employee/${employeeId}`);
        if (attRes.data && Array.isArray(attRes.data)) {
          setAttendanceRecords(attRes.data);
          // Check if checked in today
          const todayStr = new Date().toISOString().split('T')[0];
          const todayRecord = attRes.data.find(r => r.date && r.date.startsWith(todayStr));
          if (todayRecord) {
            if (todayRecord.checkIn) {
              setIsCheckedIn(true);
              setCheckInTime(new Date(todayRecord.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            }
            if (todayRecord.checkOut) {
              setIsCheckedOut(true);
              setCheckOutTime(new Date(todayRecord.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
            }
          }
        }
      } catch (e) {
        console.error(e);
      }

      try {
        // Lấy phép
        const leaveRes = await axios.get(`http://localhost:5000/api/leaves/employee/${employeeId}`);
        if (leaveRes.data?.balance) {
          setLeaveBalance(leaveRes.data.balance);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [employeeId]);

  const handleCheckIn = async () => {
    if (!employeeId) return toast.error('Lỗi: Không tìm thấy ID nhân viên');
    try {
      await axios.post('http://localhost:5000/api/attendance/checkin', { employeeId });
      setIsCheckedIn(true);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setCheckInTime(timeStr);
      toast.success(`Check-in thành công lúc ${timeStr}! Chúc bạn ngày làm việc hiệu quả.`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi Check-in');
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) return toast.error('Lỗi: Không tìm thấy ID nhân viên');
    try {
      await axios.put('http://localhost:5000/api/attendance/checkout', { employeeId });
      setIsCheckedOut(true);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setCheckOutTime(timeStr);
      toast.success(`Check-out thành công lúc ${timeStr}! Hẹn gặp lại vào ngày mai.`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi Check-out');
    }
  };

  // Mock sample recent attendance if empty
  const displayRecords = attendanceRecords.length > 0 ? attendanceRecords.slice(0, 5) : [
    { date: '2026-10-07', checkIn: '2026-10-07T08:02:00', checkOut: '2026-10-07T17:35:00', status: 'ON_TIME', workHours: 8 },
    { date: '2026-10-06', checkIn: '2026-10-06T08:14:00', checkOut: '2026-10-06T17:30:00', status: 'LATE', workHours: 7.8 },
    { date: '2026-10-05', checkIn: '2026-10-05T07:55:00', checkOut: '2026-10-05T17:40:00', status: 'ON_TIME', workHours: 8 },
    { date: '2026-10-04', checkIn: '2026-10-04T08:00:00', checkOut: '2026-10-04T17:30:00', status: 'ON_TIME', workHours: 8 },
    { date: '2026-10-03', checkIn: '2026-10-03T07:58:00', checkOut: '2026-10-03T17:32:00', status: 'ON_TIME', workHours: 8 },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header Banner Chào Mừng Sang Trọng */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        borderRadius: '1rem',
        padding: '1.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
      }}>
        {/* Glow decoration */}
        <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
          }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Xin chào, {fullName}!
              </h1>
              <span style={{
                backgroundColor: 'rgba(37,99,235,0.3)',
                border: '1px solid rgba(96,165,250,0.4)',
                color: '#93C5FD',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {employeeCode}
              </span>
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Phòng ban: <strong>Công nghệ Thông tin & Phần mềm</strong></span>
              <span>•</span>
              <span style={{ textTransform: 'capitalize' }}>{currentDate}</span>
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate('/employee/leave')}
            className="btn btn-outline"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              height: '38px',
              padding: '0 1rem'
            }}
          >
            <CalendarRange size={16} /> Xin nghỉ phép
          </button>
          <button
            onClick={() => navigate('/employee/payslip')}
            className="btn btn-primary"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              height: '38px',
              padding: '0 1rem'
            }}
          >
            <DollarSign size={16} /> Xem phiếu lương
          </button>
        </div>
      </div>

      {/* 2. Grid Chấm Công & Chỉ Số Cá Nhân */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* KHỐI 1: Máy Chấm Công Trực Tuyến Hiện Đại */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Điểm danh & Chấm công hôm nay
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' }}>
                Ca HC (08:00 - 17:30)
              </span>
            </div>

            {/* Đồng hồ số lớn phong cách Tech */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '0.75rem',
              border: '1px solid #E2E8F0',
              padding: '1.25rem',
              textAlign: 'center',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>
                Thời gian hệ thống
              </div>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: '#0F172A',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                lineHeight: 1
              }}>
                {currentTime}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.35rem' }}>
                Trạng thái: {' '}
                <strong style={{
                  color: isCheckedIn ? (isCheckedOut ? '#7C3AED' : '#059669') : '#D97706'
                }}>
                  {isCheckedIn ? (isCheckedOut ? 'Đã hoàn thành ngày công' : 'Đang trong giờ làm việc') : 'Chưa điểm danh vào'}
                </strong>
              </div>
            </div>

            {/* Thời gian vào/ra trong ngày */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Giờ Check-in</span>
                <strong style={{ fontSize: '1.1rem', color: isCheckedIn ? '#059669' : '#94A3B8' }}>
                  {checkInTime || '--:--'}
                </strong>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Giờ Check-out</span>
                <strong style={{ fontSize: '1.1rem', color: isCheckedOut ? '#7C3AED' : '#94A3B8' }}>
                  {checkOutTime || '--:--'}
                </strong>
              </div>
            </div>
          </div>

          {/* Nút bấm Check-in / Check-out lớn */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <button
              onClick={handleCheckIn}
              disabled={isCheckedIn}
              style={{
                height: '46px',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: isCheckedIn ? '#E2E8F0' : '#2563EB',
                color: isCheckedIn ? '#64748B' : '#FFFFFF',
                fontSize: '0.925rem',
                fontWeight: 700,
                cursor: isCheckedIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: isCheckedIn ? 'none' : '0 4px 10px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {isCheckedIn ? <Check size={18} /> : null}
              {isCheckedIn ? 'Đã Check-in' : 'Check-in (Vào)'}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn || isCheckedOut}
              style={{
                height: '46px',
                borderRadius: '0.5rem',
                border: isCheckedIn && !isCheckedOut ? 'none' : '1px solid #CBD5E1',
                backgroundColor: isCheckedIn && !isCheckedOut ? '#DC2626' : (isCheckedOut ? '#E2E8F0' : '#F8FAFC'),
                color: isCheckedIn && !isCheckedOut ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.925rem',
                fontWeight: 700,
                cursor: (!isCheckedIn || isCheckedOut) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: isCheckedIn && !isCheckedOut ? '0 4px 10px rgba(220, 38, 38, 0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isCheckedOut ? <Check size={18} /> : null}
              {isCheckedOut ? 'Đã Check-out' : 'Check-out (Về)'}
            </button>
          </div>
        </div>

        {/* KHỐI 2: Chỉ Số Cá Nhân & Quỹ Phép Tháng */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
            
            {/* Thẻ 1: Quỹ Phép */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Quỹ phép còn</span>
                <div style={{ width: 34, height: 34, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarRange size={18} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {Number(leaveBalance.totalDays) - Number(leaveBalance.usedDays)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>ngày</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                  Đã dùng: {Number(leaveBalance.usedDays)} / {Number(leaveBalance.totalDays)} ngày
                </span>
              </div>
            </div>

            {/* Thẻ 2: Công Thực Tế */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Công chuẩn tháng</span>
                <div style={{ width: 34, height: 34, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                  22 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>công</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Chấm công chuẩn: 100%
                </span>
              </div>
            </div>

          </div>

          {/* Banner Thông Tin Ca & Quy Chế */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>Quy chế ân hạn đi muộn</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Được ân hạn tối đa 15 phút mỗi tháng không bị tính đi trễ.</span>
              </div>
            </div>
            <button 
              onClick={() => toast('Nếu quên chấm công, vui lòng tạo đơn xin nghỉ hoặc liên hệ HR để điều chỉnh.')}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', height: '32px' }}
            >
              Giải trình công
            </button>
          </div>

        </div>

      </div>

      {/* 3. Bảng Lịch Sử Chấm Công Gần Đây */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
              Lịch sử chấm công 5 ngày gần nhất
            </h3>
            <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Dữ liệu được cập nhật tự động từ máy chấm công vân tay / web kiosk
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Ngày làm việc</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Giờ vào</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Giờ ra</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Tổng giờ làm</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((rec, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    {rec.date ? new Date(rec.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : `Ngày ${i+1}`}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#1E293B' }}>
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:00'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#1E293B' }}>
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '17:30'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    {rec.workHours || 8} giờ
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{
                      backgroundColor: rec.status === 'LATE' ? '#FEF3C7' : '#ECFDF5',
                      color: rec.status === 'LATE' ? '#D97706' : '#059669',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {rec.status === 'LATE' ? 'Đi muộn 14p' : 'Đúng giờ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
