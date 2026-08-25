import React, { useState } from 'react';
import { Clock, CalendarRange, CheckCircle2, AlertCircle } from 'lucide-react';
import { attendanceToday } from '../../mockData';

export const EmployeeDashboard = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(!!attendanceToday.checkIn);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    alert('Check-in thành công lúc ' + currentTime);
  };

  return (
    <div>
      <h2 className="mb-6">Xin chào, Nguyễn Văn A!</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card text-center flex-col items-center justify-center glass">
          <h3 className="mb-2">Thời gian hiện tại</h3>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
            {currentTime}
          </div>
          
          <div className="flex gap-4">
            <button 
              className={`btn ${isCheckedIn ? 'btn-outline' : 'btn-primary'}`} 
              style={{ width: '150px', padding: '0.75rem' }}
              onClick={handleCheckIn}
              disabled={isCheckedIn}
            >
              {isCheckedIn ? 'Đã Check-in' : 'Check-in'}
            </button>
            <button 
              className="btn btn-outline" 
              style={{ width: '150px', padding: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}
              disabled={!isCheckedIn}
            >
              Check-out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card flex-col justify-center" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Clock size={24} color="var(--primary)" />
              <strong style={{ color: 'var(--primary)' }}>Trạng thái hôm nay</strong>
            </div>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {isCheckedIn ? 'Đang làm việc' : 'Chưa Check-in'}
            </p>
            {isCheckedIn && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Vào lúc: 08:15</p>}
          </div>

          <div className="card flex-col justify-center" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success)' }}>
            <div className="flex items-center gap-3 mb-2">
              <CalendarRange size={24} color="var(--success)" />
              <strong style={{ color: 'var(--success)' }}>Quỹ phép năm</strong>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>10 / 12</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>ngày còn lại</p>
          </div>

          <div className="card flex-col justify-center" style={{ gridColumn: 'span 2' }}>
            <h3 className="mb-2">Ca làm việc hôm nay</h3>
            <p style={{ fontSize: '1.125rem' }}>Hành chính (08:00 - 17:30)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
