import React, { useState, useEffect } from 'react';
import { Download, Printer, Banknote } from 'lucide-react';
import axios from 'axios';

export const EmployeePayslip = () => {
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const employeeId = localStorage.getItem('employeeId');

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/payroll/employee/${employeeId}`);
        setPayslips(res.data);
        if (res.data.length > 0) {
          setSelectedPayslip(res.data[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  if (loading) return <div className="p-8 text-center text-muted">Đang tải phiếu lương...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>Phiếu Lương (Payslip)</h2>
          <p className="text-muted mt-1">Lịch sử nhận lương của bạn</p>
        </div>
        <div className="flex gap-2">
          {payslips.length > 0 && (
            <select 
              className="form-input bg-white/50" 
              value={selectedPayslip?.id || ''} 
              onChange={e => setSelectedPayslip(payslips.find(p => p.id === e.target.value))}
            >
              {payslips.map(p => (
                <option key={p.id} value={p.id}>Tháng {p.periodMonth}/{p.periodYear}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedPayslip ? (
        <div className="card glass text-center p-12">
          <Banknote size={48} className="mx-auto mb-4 text-muted" opacity={0.5} />
          <h3 className="text-muted">Chưa có dữ liệu phiếu lương nào</h3>
          <p className="text-sm mt-2">Hệ thống sẽ cập nhật khi có kỳ lương mới được chốt.</p>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex items-center justify-end mb-4 gap-2">
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => window.print()}><Printer size={18} /> In phiếu</button>
          </div>

          <div className="card glass print-area" style={{ padding: '2.5rem', borderTop: '5px solid var(--primary)' }}>
            <div className="text-center mb-8" style={{ borderBottom: '2px dashed var(--border)', paddingBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                HRM ENTERPRISE
              </h1>
              <h3 className="text-muted" style={{ letterSpacing: '2px' }}>PHIẾU LƯƠNG NHÂN VIÊN</h3>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8" style={{ fontSize: '0.95rem' }}>
              <div>
                <p className="mb-3"><strong className="text-muted w-32 inline-block">Họ và tên:</strong> <span style={{ fontWeight: 600 }}>{selectedPayslip.employee?.fullName}</span></p>
                <p className="mb-3"><strong className="text-muted w-32 inline-block">Mã nhân viên:</strong> {selectedPayslip.employee?.code}</p>
                <p className="mb-3"><strong className="text-muted w-32 inline-block">Chức vụ:</strong> {selectedPayslip.employee?.position?.title || 'Nhân viên'}</p>
              </div>
              <div>
                <p className="mb-3"><strong className="text-muted w-32 inline-block">Phòng ban:</strong> {selectedPayslip.employee?.department?.name || 'Chưa xếp'}</p>
                <p className="mb-3"><strong className="text-muted w-32 inline-block">Kỳ lương:</strong> <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Tháng {selectedPayslip.periodMonth}/{selectedPayslip.periodYear}</span></p>
                <p className="mb-3"><strong className="text-muted w-32 inline-block">Số ngày công:</strong> <span className="badge badge-warning">{Number(selectedPayslip.workingDays)} ngày</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Cột thu nhập */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.05)' }}>
                <h3 className="mb-4 text-sm uppercase tracking-wider font-bold" style={{ color: 'var(--primary)' }}>THU NHẬP (A)</h3>
                <div className="flex justify-between mb-3">
                  <span className="text-muted">Lương cơ bản:</span>
                  <strong className="money-text">{formatCurrency(selectedPayslip.baseSalary)}</strong>
                </div>
                <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(105, 108, 255, 0.2)' }}>
                  <strong style={{ color: 'var(--primary)' }}>Tổng Gross:</strong>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.125rem' }} className="money-text">
                    {formatCurrency((Number(selectedPayslip.baseSalary) / 22) * Number(selectedPayslip.workingDays))}
                  </strong>
                </div>
              </div>

              {/* Cột khấu trừ */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(255, 62, 29, 0.05)' }}>
                <h3 className="mb-4 text-sm uppercase tracking-wider font-bold" style={{ color: 'var(--error)' }}>KHẤU TRỪ (B)</h3>
                <div className="flex justify-between mb-3">
                  <span className="text-muted">Khoản phạt/Trừ:</span>
                  <strong className="money-text text-error">{formatCurrency(selectedPayslip.totalDeduction || 0)}</strong>
                </div>
                <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 62, 29, 0.2)' }}>
                  <strong style={{ color: 'var(--error)' }}>Tổng khấu trừ:</strong>
                  <strong style={{ color: 'var(--error)', fontSize: '1.125rem' }} className="money-text">{formatCurrency(selectedPayslip.totalDeduction || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Tổng nhận */}
            <div className="mt-8 pt-8 text-center relative overflow-hidden" style={{ borderTop: '2px dashed var(--border)', backgroundColor: 'var(--success-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(113, 221, 55, 0.2)' }}>
              <h3 className="mb-2 text-muted uppercase tracking-widest text-sm font-semibold">THỰC LÃNH (NET)</h3>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '1px' }} className="money-text">
                {formatCurrency(selectedPayslip.netSalary)}
              </div>
              <p className="mt-3 text-sm" style={{ color: 'var(--success)' }}>Trạng thái: <span className="font-bold">{selectedPayslip.status === 'LOCKED' ? 'Đã Chốt & Chuyển khoản' : 'Đang duyệt (Draft)'}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
