import React from 'react';
import { Target, TrendingUp, Award, Search, Filter } from 'lucide-react';
import { kpiEvaluations } from '../../mockData';

export const Performance = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Đánh giá KPI (Performance Review)
          </h2>
          <p className="text-muted mt-2">Phân loại nhân sự theo đường cong chuẩn (Force Ranking 20-60-20).</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            Xuất Báo cáo
          </button>
          <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            <Target size={18} /> Mở Kỳ Đánh giá Mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card glass card-hover" style={{ padding: '1.5rem', borderTop: '4px solid var(--success)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted">Nhóm A (Excellent - 20%)</span>
            <Award size={20} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>1</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Đủ tiêu chuẩn thưởng quý</p>
        </div>
        
        <div className="card glass card-hover" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted">Nhóm B (Good - 60%)</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>2</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Đạt KPI tiêu chuẩn</p>
        </div>

        <div className="card glass card-hover" style={{ padding: '1.5rem', borderTop: '4px solid var(--warning)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted">Nhóm C/D (Needs Improvement - 20%)</span>
            <Target size={20} color="var(--warning)" />
          </div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>1</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Cần cải thiện hiệu suất</p>
        </div>
      </div>

      <div className="card glass mb-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-col" style={{ width: '200px' }}>
            <label className="form-label text-muted">Kỳ đánh giá</label>
            <select className="form-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <option value="Q2-2026">Quý 2 / 2026</option>
              <option value="Q1-2026">Quý 1 / 2026</option>
            </select>
          </div>
          <div className="flex-col" style={{ flex: 1 }}>
            <label className="form-label text-muted">Tìm kiếm nhân viên</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" placeholder="Nhập tên..." style={{ paddingLeft: '3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Tự đánh giá</th>
                <th>Quản lý đánh giá</th>
                <th>Xếp loại (Curve)</th>
                <th>Nhận xét của Quản lý</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {kpiEvaluations.map(kpi => (
                <tr key={kpi.empId} style={{ transition: 'background-color 0.2s' }} className="hover:bg-white/5">
                  <td>
                    <div className="flex-col">
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{kpi.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{kpi.empId}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple" style={{ background: 'transparent', border: '1px solid var(--primary)' }}>{kpi.department}</span></td>
                  <td><strong style={{ fontSize: '1.1rem' }}>{kpi.selfScore}</strong>/100</td>
                  <td><strong style={{ fontSize: '1.1rem' }}>{kpi.managerScore}</strong>/100</td>
                  <td>
                    {kpi.finalGrade === 'A' && <span className="badge badge-success">Hạng A (Top 20%)</span>}
                    {kpi.finalGrade === 'B' && <span className="badge badge-info" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>Hạng B (Mid 60%)</span>}
                    {kpi.finalGrade === 'C' && <span className="badge badge-warning">Hạng C (Bot 20%)</span>}
                  </td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.note}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Review</button>
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
