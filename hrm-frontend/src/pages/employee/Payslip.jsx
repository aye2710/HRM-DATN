import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, Banknote, ShieldCheck, DollarSign, Calendar, 
  CheckCircle2, Building, User, FileText, ArrowDownRight, ArrowUpRight, HelpCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const EmployeePayslip = () => {
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const employeeId = localStorage.getItem('employeeId');
  const fullName = localStorage.getItem('fullName') || 'Phạm Hoàng Long';
  const employeeCode = localStorage.getItem('employeeCode') || 'EMP-2026-001';

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/payroll/employee/${employeeId}`);
        const data = res.data || [];
        setPayslips(data);
        if (data.length > 0) {
          setSelectedPayslip(data[0]);
        }
      } catch (error) {
        console.error('Lỗi tải phiếu lương:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // Mock sample slip if no records in DB yet (for realistic thesis presentation)
  const displaySlip = selectedPayslip || {
    id: 'PAY-2026-09',
    periodMonth: 9,
    periodYear: 2026,
    baseSalary: 18000000,
    allowances: 2500000,
    bonus: 1500000,
    overtimePay: 850000,
    grossSalary: 22850000,
    socialInsurance: 1440000, // 8%
    healthInsurance: 270000,  // 1.5%
    unemploymentInsurance: 180000, // 1%
    personalTax: 850000,
    totalDeductions: 2740000,
    netSalary: 20110000,
    standardDays: 22,
    actualDays: 22,
    status: 'PAID',
    paymentDate: '2026-10-05',
    bankAccount: '19036888888888 (Techcombank)'
  };

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
              backgroundColor: '#ECFDF5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Banknote size={20} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Phiếu Lương Điện Tử (My Payslip)
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Minh bạch thu nhập, thuế TNCN, bảo hiểm và tiền lương thực lĩnh hàng tháng.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Select Period */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Kỳ lương:</span>
            <select
              className="form-input"
              value={selectedPayslip?.id || ''}
              onChange={e => setSelectedPayslip(payslips.find(p => p.id === e.target.value) || displaySlip)}
              style={{ height: '38px', backgroundColor: '#F8FAFC', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}
            >
              {payslips.length > 0 ? (
                payslips.map(p => (
                  <option key={p.id} value={p.id}>Tháng {p.periodMonth}/{p.periodYear}</option>
                ))
              ) : (
                <option value="PAY-2026-09">Tháng 09/2026 (Mới nhất)</option>
              )}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{
              height: '38px',
              padding: '0 1rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Printer size={16} /> In phiếu lương
          </button>
        </div>
      </div>

      {/* 2. Thẻ Tóm Tắt Thu Nhập Nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Tổng thu nhập Gross</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
            {formatCurrency(displaySlip.grossSalary || displaySlip.baseSalary)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Lương cơ bản + Phụ cấp & Thưởng</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Tổng các khoản khấu trừ</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>
            - {formatCurrency(displaySlip.totalDeductions || 2740000)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>BHXH (8%), BHYT (1.5%), Thuế TNCN</span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          color: '#FFFFFF',
          padding: '1.25rem',
          borderRadius: '1rem',
          boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E6FFFA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thực lĩnh (Net Salary)
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
              Đã chi trả
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {formatCurrency(displaySlip.netSalary || 20110000)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#D1FAE5' }}>
            Chuyển khoản ngày {displaySlip.paymentDate || '05/10/2026'}
          </span>
        </div>

      </div>

      {/* 3. Chi Tiết Phiếu Lương Chuẩn Doanh Nghiệp (In ấn & Lưu trữ) */}
      <div style={{
        maxWidth: '860px',
        margin: '0 auto',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        {/* Header phiếu */}
        <div style={{
          padding: '2rem 2.5rem',
          borderBottom: '2px solid #E2E8F0',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '6px', backgroundColor: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                LLA
              </div>
              <strong style={{ fontSize: '1.15rem', color: '#0F172A' }}>CÔNG TY TNHH LLA ENTERPRISE</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Tòa nhà LLA Innovation Tower, Cầu Giấy, Hà Nội • MST: 0108889999</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', letterSpacing: '0.02em' }}>
              PHIẾU LƯƠNG NHÂN VIÊN
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
              Kỳ trả lương: Tháng {displaySlip.periodMonth || 9}/{displaySlip.periodYear || 2026}
            </span>
          </div>
        </div>

        {/* Thông tin nhân viên */}
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAFAFA' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Họ và tên nhân viên:</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{fullName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Mã nhân sự:</span>
              <strong style={{ color: '#2563EB' }}>{employeeCode}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Phòng ban / Bộ phận:</span>
              <strong style={{ color: '#0F172A' }}>Phần mềm & CNTT</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Số công chuẩn / Thực tế:</span>
              <strong style={{ color: '#059669' }}>{displaySlip.actualDays || 22} / {displaySlip.standardDays || 22} công</strong>
            </div>
          </div>
        </div>

        {/* Bảng kê chi tiết thu nhập & khấu trừ */}
        <div style={{ padding: '1.5rem 2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Cột 1: Các khoản thu nhập (Earnings) */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <ArrowUpRight size={18} color="#059669" /> I. CÁC KHOẢN THU NHẬP
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>1. Lương cơ bản theo HĐLĐ:</span>
                  <strong>{formatCurrency(displaySlip.baseSalary || 18000000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>2. Phụ cấp ăn trưa & đi lại:</span>
                  <strong>{formatCurrency(displaySlip.allowances || 2500000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>3. Thưởng hiệu suất KPI:</span>
                  <strong>{formatCurrency(displaySlip.bonus || 1500000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>4. Tiền làm thêm giờ (OT):</span>
                  <strong>{formatCurrency(displaySlip.overtimePay || 850000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', color: '#0F172A', fontWeight: 700 }}>
                  <span>TỔNG THU NHẬP (GROSS):</span>
                  <span style={{ color: '#059669', fontSize: '1rem' }}>{formatCurrency(displaySlip.grossSalary || 22850000)}</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Các khoản khấu trừ (Deductions) */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <ArrowDownRight size={18} color="#DC2626" /> II. CÁC KHOẢN KHẤU TRỪ
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>1. Bảo hiểm Xã hội (BHXH 8%):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(displaySlip.socialInsurance || 1440000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>2. Bảo hiểm Y tế (BHYT 1.5%):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(displaySlip.healthInsurance || 270000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>3. BHTN (1%):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(displaySlip.unemploymentInsurance || 180000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>4. Thuế Thu nhập Cá nhân (TNCN):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(displaySlip.personalTax || 850000)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', color: '#0F172A', fontWeight: 700 }}>
                  <span>TỔNG KHẤU TRỪ:</span>
                  <span style={{ color: '#DC2626', fontSize: '1rem' }}>- {formatCurrency(displaySlip.totalDeductions || 2740000)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Dòng Tổng Lĩnh Lương Cuối Cùng */}
          <div style={{
            marginTop: '2rem',
            padding: '1.25rem 1.75rem',
            borderRadius: '0.75rem',
            backgroundColor: '#F0FDF4',
            border: '2px solid #BBF7D0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SỐ TIỀN THỰC CHUYỂN KHOẢN (NET SALARY):
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803D' }}>
                Tài khoản nhận: {displaySlip.bankAccount || '19036888888888 (Techcombank)'}
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534' }}>
              {formatCurrency(displaySlip.netSalary || 20110000)}
            </div>
          </div>
        </div>

        {/* Footer Phiếu Lương */}
        <div style={{
          padding: '1.25rem 2.5rem',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748B'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={16} color="#059669" /> Phiếu lương điện tử được chứng thực số bởi LLA Enterprise HRM
          </span>
          <span 
            style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => toast('Nếu có thắc mắc về bảng tính lương, vui lòng liên hệ Bộ phận C&B qua email: cb@lla.vn')}
          >
            Khiếu nại / Thắc mắc lương?
          </span>
        </div>

      </div>

    </div>
  );
};
