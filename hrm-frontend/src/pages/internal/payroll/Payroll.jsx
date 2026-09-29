import React from 'react';
import { Download, Calculator, Lock, Banknote, ShieldAlert, FileSignature } from 'lucide-react';
import { payrollList } from '../../../mockData';

export const PayrollMgmt = () => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2>Bảng Lương Tháng 07/2026</h2>
          <p className="text-muted mt-1">Động cơ tính lương tự động (Auto Payroll Engine) - Chốt sổ mùng 5 hàng tháng</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline">
            <Download size={18} /> Xuất Báo Cáo
          </button>
          <button className="btn btn-primary">
            <Calculator size={18} /> Chạy Lại Bảng Lương
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card text-center flex-col items-center glass card-hover">
          <Banknote size={24} className="mb-3" style={{ color: 'var(--accent)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Tổng Quỹ Lương (Gross)</span>
          <span className="money-text text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {formatCurrency(payrollList.reduce((acc, curr) => acc + curr.gross, 0))}
          </span>
        </div>
        <div className="card text-center flex-col items-center glass card-hover" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <Banknote size={24} className="mb-3" style={{ color: 'var(--success)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Tổng Thực Chi (Net)</span>
          <span className="money-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {formatCurrency(payrollList.reduce((acc, curr) => acc + curr.net, 0))}
          </span>
        </div>
        <div className="card text-center flex-col items-center glass card-hover">
          <ShieldAlert size={24} className="mb-3" style={{ color: 'var(--error)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Tổng Khấu Trừ (BHXH & Thuế)</span>
          <span className="money-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)' }}>
            {formatCurrency(payrollList.reduce((acc, curr) => acc + curr.insurance + curr.tax + curr.penalty, 0))}
          </span>
        </div>
        <div className="card text-center flex-col items-center glass card-hover">
          <FileSignature size={24} className="mb-3" style={{ color: 'var(--warning)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Trạng thái Kỳ Lương</span>
          <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.6rem 1.2rem', marginTop: '0.25rem' }}>Đang tính (Draft)</span>
        </div>
      </div>

      <div className="card glass">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '1.1rem' }}>Chi tiết lương nhân viên</h3>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Công thức chuẩn: <strong>Net = Gross - BHXH (10.5%) - Thuế TNCN - Phạt</strong></span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th><div className="text-right">Lương cơ bản</div></th>
                <th><div className="text-right">Phụ cấp + Thưởng</div></th>
                <th style={{ backgroundColor: 'var(--bg-hover)' }}><div className="text-right">Tổng Gross</div></th>
                <th><div className="text-right" style={{ color: 'var(--error)' }}>- Trừ BHXH</div></th>
                <th><div className="text-right" style={{ color: 'var(--error)' }}>- Trừ Thuế & Phạt</div></th>
                <th style={{ backgroundColor: 'var(--bg-hover)' }}><div className="text-right">Thực lãnh (Net)</div></th>
                <th className="text-center">TT</th>
              </tr>
            </thead>
            <tbody>
              {payrollList.map((pr, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    {pr.empId}
                    {pr.isProbation && <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>(Thử việc)</div>}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {pr.name}
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{pr.department}</div>
                  </td>
                  <td className="text-right money-text">{formatCurrency(pr.baseSalary)}</td>
                  <td className="text-right money-text">{formatCurrency(pr.allowance + pr.bonus)}</td>
                  <td className="text-right money-text" style={{ color: 'var(--primary)', fontWeight: 700, backgroundColor: 'var(--bg-hover)' }}>
                    {formatCurrency(pr.gross)}
                  </td>
                  <td className="text-right money-text" style={{ color: 'var(--error)' }}>
                    {pr.insurance > 0 ? formatCurrency(pr.insurance) : '0 ₫'}
                  </td>
                  <td className="text-right money-text" style={{ color: 'var(--error)' }}>
                    {formatCurrency(pr.tax + pr.penalty)}
                  </td>
                  <td className="text-right money-text" style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.05rem', backgroundColor: 'var(--bg-hover)' }}>
                    {formatCurrency(pr.net)}
                  </td>
                  <td className="text-center">
                    {pr.status === 'Locked' ? (
                      <Lock size={16} color="var(--text-muted)" title="Đã chốt" />
                    ) : (
                      <span className="badge badge-warning" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>Nháp</span>
                    )}
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
