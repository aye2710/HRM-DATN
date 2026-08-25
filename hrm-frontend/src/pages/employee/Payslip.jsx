import React from 'react';
import { Download, Printer } from 'lucide-react';
import { payrollData } from '../../mockData';

export const EmployeePayslip = () => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-6">
        <h2>Phiếu lương tháng {payrollData.month}</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline"><Printer size={18} /> In</button>
          <button className="btn btn-primary"><Download size={18} /> Tải PDF</button>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div className="text-center mb-8" style={{ borderBottom: '2px dashed var(--border-color)', paddingBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>TechNova Solutions</h1>
          <h3 className="text-muted">PHIẾU LƯƠNG NHÂN VIÊN</h3>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="mb-2"><strong className="text-muted">Họ và tên:</strong> Nguyễn Văn A</p>
            <p className="mb-2"><strong className="text-muted">Mã nhân viên:</strong> EMP-001</p>
            <p className="mb-2"><strong className="text-muted">Chức vụ:</strong> Software Engineer</p>
          </div>
          <div>
            <p className="mb-2"><strong className="text-muted">Phòng ban:</strong> IT</p>
            <p className="mb-2"><strong className="text-muted">Kỳ lương:</strong> {payrollData.month}</p>
            <p className="mb-2"><strong className="text-muted">Ngày công chuẩn:</strong> 22 ngày</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Cột thu nhập */}
          <div>
            <h3 className="mb-4" style={{ color: 'var(--success)' }}>THU NHẬP (A)</h3>
            <div className="flex justify-between mb-2">
              <span>Lương cơ bản:</span>
              <strong>{formatCurrency(payrollData.baseSalary)}</strong>
            </div>
            <div className="flex justify-between mb-2">
              <span>Phụ cấp:</span>
              <strong>{formatCurrency(payrollData.allowance)}</strong>
            </div>
            <div className="flex justify-between mb-2">
              <span>Thưởng KPI:</span>
              <strong>{formatCurrency(payrollData.kpiBonus)}</strong>
            </div>
            <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <strong>Tổng thu nhập (Gross):</strong>
              <strong style={{ color: 'var(--success)', fontSize: '1.125rem' }}>{formatCurrency(payrollData.gross)}</strong>
            </div>
          </div>

          {/* Cột khấu trừ */}
          <div>
            <h3 className="mb-4" style={{ color: 'var(--error)' }}>KHẤU TRỪ (B)</h3>
            <div className="flex justify-between mb-2">
              <span>BHXH, BHYT, BHTN (10.5%):</span>
              <strong>{formatCurrency(payrollData.insurance)}</strong>
            </div>
            <div className="flex justify-between mb-2">
              <span>Thuế TNCN tạm tính:</span>
              <strong>{formatCurrency(payrollData.tax)}</strong>
            </div>
            <div className="flex justify-between mb-2">
              <span>Nghỉ không lương:</span>
              <strong>{formatCurrency(0)}</strong>
            </div>
            <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <strong>Tổng khấu trừ:</strong>
              <strong style={{ color: 'var(--error)', fontSize: '1.125rem' }}>{formatCurrency(payrollData.insurance + payrollData.tax)}</strong>
            </div>
          </div>
        </div>

        {/* Tổng nhận */}
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '2px dashed var(--border-color)', backgroundColor: 'var(--primary-light)', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          <h3 className="mb-2 text-muted">THỰC LÃNH (A - B)</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {formatCurrency(payrollData.net)}
          </div>
        </div>
      </div>
    </div>
  );
};
