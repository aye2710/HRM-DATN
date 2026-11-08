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
  const fullName = localStorage.getItem('fullName') || 'Lê Hữu Trúc';
  const employeeCode = localStorage.getItem('employeeCode') || 'LLA-001';

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

  // Trích xuất dữ liệu phiếu lương chuẩn LLA từ selectedPayslip
  const lla = selectedPayslip?.lla || {};
  const monthYearParts = selectedPayslip?.payrollPeriod?.monthYear 
    ? selectedPayslip.payrollPeriod.monthYear.split('-') 
    : ['9', '2026'];
  const monthNum = monthYearParts[0];
  const yearNum = monthYearParts[1];

  const baseSalary = Number(lla.baseSalary ?? selectedPayslip?.baseSalary ?? 7000000);
  const appliedMonthSalary = Number(lla.appliedMonthSalary ?? baseSalary);
  const standardDays = Number(lla.standardWorkingDays ?? selectedPayslip?.payrollPeriod?.standardWorkingDays ?? 26);
  const actualDays = Number(lla.actualWorkingDays ?? selectedPayslip?.actualWorkingDays ?? 18.5);
  const salaryByDays = Number(lla.salaryByDays ?? (standardDays > 0 ? Math.round((appliedMonthSalary / standardDays) * actualDays) : 0));
  const fixedAllowance = Number(lla.fixedAllowance ?? 500000);
  const ctpAndCommission = Number(lla.ctpAndCommission ?? 0);
  const otAndBonus = Number(lla.otAndBonus ?? 0);
  const grossSalary = salaryByDays + fixedAllowance + ctpAndCommission + otAndBonus;

  const insuranceDeduction = Number(lla.insuranceDeduction ?? selectedPayslip?.insuranceDeduction ?? 0);
  const taxDeduction = Number(selectedPayslip?.taxDeduction ?? 0);
  const latePenaltyAmount = Number(lla.latePenaltyAmount ?? 0);
  const advanceAmount = Number(lla.advanceAmount ?? 0);
  const unionFee = Number(lla.unionFee ?? 0);
  const totalDeductions = insuranceDeduction + taxDeduction + latePenaltyAmount + advanceAmount + unionFee;
  const netSalary = Number(lla.netSalary ?? selectedPayslip?.netSalary ?? (grossSalary - totalDeductions));
  
  const deptName = selectedPayslip?.employee?.department?.name || 'Tổ chức';
  const posTitle = selectedPayslip?.employee?.position?.title || 'Chuyên viên';
  const contractType = lla.contractType || 'PROBATION';
  const probationPct = lla.probationPercent || (contractType === 'PROBATION' ? 85 : 100);

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
            Minh bạch thu nhập, thuế TNCN, bảo hiểm và tiền lương thực lĩnh hàng tháng theo chuẩn Công ty LLA.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Select Period */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>Kỳ lương:</span>
            <select
              className="form-select"
              value={selectedPayslip?.id || ''}
              onChange={e => setSelectedPayslip(payslips.find(p => p.id === e.target.value) || null)}
              style={{ width: 'auto', height: '38px', backgroundColor: '#F8FAFC', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}
            >
              {payslips.length > 0 ? (
                payslips.map(p => {
                  const parts = p.payrollPeriod?.monthYear ? p.payrollPeriod.monthYear.split('-') : [9, 2026];
                  return (
                    <option key={p.id} value={p.id}>Tháng {parts[0]}/{parts[1]}</option>
                  );
                })
              ) : (
                <option value="default">Tháng 09/2026</option>
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
            {formatCurrency(grossSalary)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Lương theo công + Phụ cấp & Thưởng</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Tổng các khoản khấu trừ</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>
            - {formatCurrency(totalDeductions)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>BHXH (10.5%), Phạt muộn, Thuế TNCN</span>
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
              Đã chốt sổ
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {formatCurrency(netSalary)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#D1FAE5' }}>
            Kỳ lương Tháng {monthNum}/{yearNum}
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
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Trụ sở chính: Hà Nội • MST: 0108889999</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', letterSpacing: '0.02em' }}>
              PHIẾU LƯƠNG CHI TIẾT
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
              KỲ LƯƠNG: THÁNG {monthNum} / {yearNum}
            </span>
          </div>
        </div>

        {/* Thông tin nhân viên */}
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAFAFA' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Họ và tên nhân viên:</span>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedPayslip?.employee?.fullName || fullName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Mã nhân sự:</span>
              <strong style={{ color: '#2563EB' }}>{selectedPayslip?.employee?.code || employeeCode}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Phòng ban / Chức danh:</span>
              <strong style={{ color: '#0F172A' }}>{deptName} - {posTitle}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Số công chuẩn / Thực tế:</span>
              <strong style={{ color: '#059669' }}>{actualDays} / {standardDays} công</strong>
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
                  <strong>{formatCurrency(baseSalary)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>2. Lương áp dụng tháng ({probationPct}%):</span>
                  <strong>{formatCurrency(appliedMonthSalary)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>3. Lương theo ngày công làm việc:</span>
                  <strong style={{ color: '#047857' }}>{formatCurrency(salaryByDays)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>4. Phụ cấp cố định (Ăn trưa, xăng, ĐT):</span>
                  <strong>{formatCurrency(fixedAllowance)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>5. Phụ cấp CTP / Hoa hồng:</span>
                  <strong>{formatCurrency(ctpAndCommission)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>6. Thưởng & Làm thêm giờ (OT):</span>
                  <strong>{formatCurrency(otAndBonus)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', color: '#0F172A', fontWeight: 700 }}>
                  <span>TỔNG THU NHẬP (GROSS):</span>
                  <span style={{ color: '#059669', fontSize: '1rem' }}>{formatCurrency(grossSalary)}</span>
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
                  <span>1. Trừ tiền BHXH (10.5% NLĐ):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(insuranceDeduction)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>2. Thuế Thu nhập Cá nhân (TNCN):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(taxDeduction)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>3. Phạt đi muộn (quá 3 lần/tháng):</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(latePenaltyAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>4. Tạm ứng lương:</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(advanceAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>5. Quỹ Đoàn thể / Công đoàn:</span>
                  <strong style={{ color: '#DC2626' }}>- {formatCurrency(unionFee)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', color: '#0F172A', fontWeight: 700 }}>
                  <span>TỔNG KHẤU TRỪ:</span>
                  <span style={{ color: '#DC2626', fontSize: '1rem' }}>- {formatCurrency(totalDeductions)}</span>
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
                Hình thức chi trả: Chuyển khoản ngân hàng (ATM)
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534' }}>
              {formatCurrency(netSalary)}
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
