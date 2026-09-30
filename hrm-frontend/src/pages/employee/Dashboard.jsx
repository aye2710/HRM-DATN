import React, { useState, useEffect } from 'react';
import { Clock, CalendarRange, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';


export const EmployeeDashboard = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  const fullName = localStorage.getItem('fullName') || 'Nhân viên';
  const employeeId = localStorage.getItem('employeeId');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    if (!employeeId) return toast.error('Lỗi: Không tìm thấy ID nhân viên');
    try {
      await axios.post('http://localhost:5000/api/attendance/checkin', { employeeId });
      setIsCheckedIn(true);
      toast.success('Check-in thành công lúc ' + currentTime);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi Check-in');
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) return toast.error('Lỗi: Không tìm thấy ID nhân viên');
    try {
      await axios.put('http://localhost:5000/api/attendance/checkout', { employeeId });
      setIsCheckedOut(true);
      toast.success('Check-out thành công lúc ' + currentTime);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi Check-out');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <h2 className="mb-6" style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>Xin chào, {fullName}!</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card text-center flex-col items-center justify-center glass shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <h3 className="mb-2 text-muted uppercase tracking-wider text-sm font-semibold">Thời gian hiện tại</h3>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
            {currentTime}
          </div>
          
          <div className="flex gap-4">
            <button 
              className={`btn ${isCheckedIn ? 'btn-outline' : 'btn-primary'}`} 
              style={{ width: '150px', padding: '0.85rem', fontSize: '1.05rem', fontWeight: 600 }}
              onClick={handleCheckIn}
              disabled={isCheckedIn}
            >
              {isCheckedIn ? 'Đã Check-in' : 'Check-in'}
            </button>
            <button 
              className="btn btn-outline" 
              style={{ width: '150px', padding: '0.85rem', borderColor: isCheckedIn && !isCheckedOut ? 'var(--error)' : 'var(--border)', color: isCheckedIn && !isCheckedOut ? 'var(--error)' : 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 600 }}
              disabled={!isCheckedIn || isCheckedOut}
              onClick={handleCheckOut}
            >
              {isCheckedOut ? 'Đã Check-out' : 'Check-out'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card flex-col justify-center shadow-md relative overflow-hidden" style={{ backgroundColor: isCheckedIn ? 'var(--success-bg)' : 'var(--warning-bg)', borderColor: isCheckedIn ? 'var(--success)' : 'var(--warning)' }}>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <Clock size={24} color={isCheckedIn ? 'var(--success)' : 'var(--warning)'} />
              <strong style={{ color: isCheckedIn ? 'var(--success)' : 'var(--warning)' }}>Trạng thái hôm nay</strong>
            </div>
            <p className="relative z-10" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {isCheckedIn ? (isCheckedOut ? 'Đã hoàn thành' : 'Đang làm việc') : 'Chưa Check-in'}
            </p>
          </div>

          <div className="card flex-col justify-center shadow-md" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
            <div className="flex items-center gap-3 mb-2">
              <CalendarRange size={24} color="var(--primary)" />
              <strong style={{ color: 'var(--primary)' }}>Quỹ phép năm</strong>
            </div>
            <div className="flex items-end gap-2">
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>12</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', paddingBottom: '2px' }}>/ 12 ngày</span>
            </div>
          </div>

          <div className="card flex-col justify-center glass shadow-md" style={{ gridColumn: 'span 2' }}>
            <h3 className="mb-2 font-semibold">Ca làm việc hôm nay</h3>
            <p style={{ fontSize: '1.125rem', color: 'var(--primary)', fontWeight: 600 }}>Ca Hành chính (08:00 - 17:30)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
