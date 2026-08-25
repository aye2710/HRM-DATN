import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, PieChart, Activity } from 'lucide-react';

export const ReportsDashboard = () => {
  return (
    <div className="flex-col gap-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Báo cáo Tổng hợp</h1>
          <p className="text-muted text-sm">Dashboard phân tích dữ liệu nhân sự, quỹ lương và hiệu suất toàn công ty</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card glass flex-col gap-2 relative overflow-hidden" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', opacity: 0.1 }}>
            <Users size={100} color="var(--primary)" />
          </div>
          <div className="text-muted text-sm font-medium">Tổng Nhân sự</div>
          <div className="text-3xl font-bold text-main">156</div>
          <div className="text-success text-xs font-medium flex items-center gap-1 mt-1">
            <TrendingUp size={12} /> +12% so với tháng trước
          </div>
        </div>

        <div className="card glass flex-col gap-2 relative overflow-hidden" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', opacity: 0.1 }}>
            <DollarSign size={100} color="var(--success)" />
          </div>
          <div className="text-muted text-sm font-medium">Quỹ lương Tháng 8</div>
          <div className="text-3xl font-bold text-main">1.25 Tỷ</div>
          <div className="text-success text-xs font-medium flex items-center gap-1 mt-1">
            <TrendingUp size={12} /> +5% so với tháng trước
          </div>
        </div>

        <div className="card glass flex-col gap-2 relative overflow-hidden" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', opacity: 0.1 }}>
            <Activity size={100} color="var(--warning)" />
          </div>
          <div className="text-muted text-sm font-medium">Tỷ lệ Turn-over (Nghỉ việc)</div>
          <div className="text-3xl font-bold text-main">4.2%</div>
          <div className="text-error text-xs font-medium flex items-center gap-1 mt-1">
            <TrendingUp size={12} /> +0.5% so với quý trước
          </div>
        </div>
      </div>

      {/* Charts Area (Mockup) */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card glass flex-col gap-4 min-h-[300px]">
          <h3 className="text-lg font-bold">Biến động Nhân sự theo Quý</h3>
          <div className="flex-1 flex items-center justify-center opacity-50">
            <BarChart3 size={64} color="var(--primary)" className="mb-2" />
            <p className="ml-4 text-muted">Khu vực hiển thị Biểu đồ Cột (Bar Chart)</p>
          </div>
        </div>
        <div className="card glass flex-col gap-4 min-h-[300px]">
          <h3 className="text-lg font-bold">Cơ cấu Phòng ban</h3>
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <PieChart size={64} color="var(--accent)" className="mb-2" />
            <p className="text-muted mt-2">Biểu đồ Tròn (Pie Chart)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
