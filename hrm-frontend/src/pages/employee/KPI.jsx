import React, { useState } from 'react';
import { 
  Target, Award, TrendingUp, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Sparkles, Star, Edit3, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const EmployeeKPI = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q3-2026');
  
  const [kpis, setKpis] = useState([
    {
      id: 1,
      title: 'Tối ưu hóa hiệu năng hệ thống core HRM',
      target: 'Giảm thời gian phản hồi API xuống dưới 200ms',
      weight: 30, // 30%
      progress: 95,
      selfScore: 9.5,
      status: 'EXCELLENT',
      comment: 'Đã hoàn thành tối ưu caching và index PostgreSQL, vượt kỳ vọng.'
    },
    {
      id: 2,
      title: 'Xây dựng phân hệ Onboarding tự động',
      target: 'Hoàn thiện 100% flow từ Offer đến cấp phát tài khoản',
      weight: 30, // 30%
      progress: 90,
      selfScore: 9.0,
      status: 'ON_TRACK',
      comment: 'Đã tích hợp xong form khảo sát và checklist thiết bị.'
    },
    {
      id: 3,
      title: 'Đảm bảo tỷ lệ kiểm thử tự động (Unit Test)',
      target: 'Đạt độ bao phủ code coverage trên 80%',
      weight: 20, // 20%
      progress: 85,
      selfScore: 8.5,
      status: 'ON_TRACK',
      comment: 'Coverage hiện tại đạt 84% toàn bộ backend controllers.'
    },
    {
      id: 4,
      title: 'Tuân thủ quy chế làm việc & Tham gia đào tạo',
      target: 'Chấm công đúng giờ >= 98%, hoàn thành 2 khóa nội bộ',
      weight: 20, // 20%
      progress: 100,
      selfScore: 10,
      status: 'COMPLETED',
      comment: 'Hoàn thành khóa học Bảo mật thông tin & Nghị định 13.'
    }
  ]);

  // Tính điểm trung bình theo trọng số
  const totalScore = kpis.reduce((acc, curr) => acc + (curr.selfScore * curr.weight / 100), 0).toFixed(1);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        padding: '1.5rem 1.75rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target size={20} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Mục Tiêu & Hiệu Suất (My KPI & Performance)
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Theo dõi tiến độ các chỉ tiêu KPI được giao và thực hiện tự đánh giá định kỳ.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Chu kỳ đánh giá:</span>
          <select
            className="form-input"
            value={selectedQuarter}
            onChange={e => setSelectedQuarter(e.target.value)}
            style={{ height: '38px', backgroundColor: '#F8FAFC', fontWeight: 600, color: '#0F172A' }}
          >
            <option value="Q3-2026">Quý 3 / 2026 (Đang diễn ra)</option>
            <option value="Q2-2026">Quý 2 / 2026 (Đã chốt: Xuất sắc - 9.4)</option>
            <option value="Q1-2026">Quý 1 / 2026 (Đã chốt: Đạt - 8.8)</option>
          </select>
        </div>
      </div>

      {/* 2. Thẻ Tóm Tắt Điểm & Tiến Độ Tổng Thể */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(15,23,42,0.15)'
        }}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Điểm tự đánh giá (Tạm tính)
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#60A5FA', lineHeight: 1.1, marginTop: '0.25rem' }}>
              {totalScore} <span style={{ fontSize: '1rem', color: '#94A3B8' }}>/ 10.0</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 600 }}>
              Xếp loại: Xuất sắc (A - Exceeds Expectations)
            </span>
          </div>
          <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
            <Award size={26} />
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Tiến độ hoàn thành trung bình
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginTop: '0.25rem' }}>
              92.5%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              4 / 4 mục tiêu đang tiến triển đúng hạn
            </span>
          </div>
          <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <TrendingUp size={26} />
          </div>
        </div>

      </div>

      {/* 3. Danh Sách Các Mục Tiêu KPI Chi Tiết */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
          Chi tiết 4 chỉ tiêu công việc Quý 3/2026
        </h3>

        {kpis.map((kpi, idx) => (
          <div 
            key={kpi.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              border: '1px solid #E2E8F0',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    KPI #{idx + 1}
                  </span>
                  <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    Trọng số: {kpi.weight}%
                  </span>
                </div>
                <strong style={{ fontSize: '1.05rem', color: '#0F172A', display: 'block' }}>
                  {kpi.title}
                </strong>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Chỉ tiêu: {kpi.target}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Điểm tự đánh giá</span>
                <strong style={{ fontSize: '1.25rem', color: '#2563EB' }}>{kpi.selfScore} / 10</strong>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '0.35rem' }}>
                <span>Tiến độ thực hiện</span>
                <strong style={{ color: '#0F172A' }}>{kpi.progress}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${kpi.progress}%`,
                  backgroundColor: kpi.progress >= 90 ? '#059669' : '#2563EB',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#334155' }}>
              💬 <strong>Ghi chú kết quả:</strong> {kpi.comment}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
