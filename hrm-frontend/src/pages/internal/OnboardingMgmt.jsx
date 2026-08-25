import React, { useState } from 'react';
import { UserCheck, Monitor, Mail, FileSignature, CheckCircle, Clock } from 'lucide-react';

const mockOnboardings = [
  { id: 1, name: 'Lê Văn T', position: 'Frontend Developer', startDate: '2026-08-25', status: 'In Progress', tasks: { it: true, account: true, hr: false, admin: false } },
  { id: 2, name: 'Phạm Thị M', position: 'HR Executive', startDate: '2026-08-22', status: 'Completed', tasks: { it: true, account: true, hr: true, admin: true } },
  { id: 3, name: 'Hoàng Văn K', position: 'Backend Developer', startDate: '2026-09-01', status: 'Pending', tasks: { it: false, account: false, hr: false, admin: false } },
];

export const OnboardingMgmt = () => {
  return (
    <div className="flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Tiếp nhận & Hội nhập</h1>
          <p className="text-muted text-sm">Theo dõi tiến độ Onboarding và cấp phát thiết bị cho nhân sự mới (Theo BR-ONB-001)</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {mockOnboardings.map(ob => {
          const totalTasks = Object.keys(ob.tasks).length;
          const completedTasks = Object.values(ob.tasks).filter(Boolean).length;
          const progress = (completedTasks / totalTasks) * 100;
          
          let statusBadge = 'badge-warning';
          let statusLabel = 'Đang tiến hành';
          if (progress === 100) { statusBadge = 'badge-success'; statusLabel = 'Hoàn tất'; }
          if (progress === 0) { statusBadge = 'badge-info'; statusLabel = 'Chờ xử lý'; }

          return (
            <div key={ob.id} className="card glass card-hover flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="avatar">{ob.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-md text-main">{ob.name}</h3>
                    <p className="text-muted text-xs">{ob.position}</p>
                  </div>
                </div>
                <span className={`badge ${statusBadge}`}>{statusLabel}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted">
                <Clock size={14} />
                <span>Ngày nhận việc: {ob.startDate}</span>
              </div>

              {/* Progress Bar */}
              <div className="flex-col gap-1 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Tiến độ Checklist</span>
                  <span className="text-primary font-bold">{Math.round(progress)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progress === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              {/* Checklists */}
              <div className="flex-col gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor size={16} color={ob.tasks.it ? 'var(--success)' : 'var(--text-muted)'} />
                    <span style={{ color: ob.tasks.it ? 'var(--text-main)' : 'var(--text-muted)' }}>Cấp máy tính (IT)</span>
                  </div>
                  {ob.tasks.it ? <CheckCircle size={16} color="var(--success)" /> : <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Check</button>}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} color={ob.tasks.account ? 'var(--success)' : 'var(--text-muted)'} />
                    <span style={{ color: ob.tasks.account ? 'var(--text-main)' : 'var(--text-muted)' }}>Tạo tài khoản (Email/Github)</span>
                  </div>
                  {ob.tasks.account ? <CheckCircle size={16} color="var(--success)" /> : <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Check</button>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileSignature size={16} color={ob.tasks.hr ? 'var(--success)' : 'var(--text-muted)'} />
                    <span style={{ color: ob.tasks.hr ? 'var(--text-main)' : 'var(--text-muted)' }}>Ký hợp đồng thử việc (HR)</span>
                  </div>
                  {ob.tasks.hr ? <CheckCircle size={16} color="var(--success)" /> : <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Check</button>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck size={16} color={ob.tasks.admin ? 'var(--success)' : 'var(--text-muted)'} />
                    <span style={{ color: ob.tasks.admin ? 'var(--text-main)' : 'var(--text-muted)' }}>Lấy vân tay & Chỗ ngồi (HC)</span>
                  </div>
                  {ob.tasks.admin ? <CheckCircle size={16} color="var(--success)" /> : <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Check</button>}
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
};
