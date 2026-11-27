import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Banknote, ShieldCheck, ArrowDownRight, ArrowUpRight, Eye, EyeOff,
  Calendar, AlertTriangle, HelpCircle, X, Send
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/common/PageHeader';

const PERIOD_STATUS_META = {
  LOCKED: { label: 'Đã chốt sổ', bg: 'rgba(255,255,255,0.22)', badgeBg: '#ECFDF5', badgeColor: '#059669' },
  PAID: { label: 'Đã chi trả', bg: 'rgba(255,255,255,0.22)', badgeBg: '#ECFDF5', badgeColor: '#059669' },
  CLOSED: { label: 'Đã chốt sổ', bg: 'rgba(255,255,255,0.22)', badgeBg: '#ECFDF5', badgeColor: '#059669' },
  DRAFT: { label: 'Bản nháp (Chưa chốt)', bg: 'rgba(255,255,255,0.2)', badgeBg: '#FEF3C7', badgeColor: '#B45309' }
};

export const EmployeePayslip = () => {
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryNote, setInquiryNote] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');

  const employeeId = localStorage.getItem('employeeId');
  const fullName = localStorage.getItem('fullName') || 'Nhân viên';
  const employeeCode = localStorage.getItem('employeeCode') || '';

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`/api/payroll/employee/${employeeId}`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.payslips || []);
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

  const formatCurrency = (val) => {
    if (!showAmounts) return '•••••••• đ';
    return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(val || 0)))} đ`;
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '0.95rem' }}>
        Đang tải dữ liệu phiếu lương...
      </div>
    );
  }

  if (!selectedPayslip) {
    return (
      <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          icon={<Banknote size={20} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          title="Phiếu Lương Điện Tử (My Payslip)"
          subtitle="Minh bạch thu nhập, thuế TNCN, bảo hiểm và tiền lương thực lĩnh hàng tháng theo chuẩn Công ty LLA."
        />
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <Banknote size={40} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.35rem 0', color: '#0F172A', fontSize: '1.05rem', fontWeight: 700 }}>
            Chưa có phiếu lương nào được phát hành
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            Khi Bộ phận C&amp;B / Kế toán chạy bảng lương hàng tháng, phiếu lương chi tiết của bạn sẽ hiển thị tại đây.
          </p>
        </div>
      </div>
    );
  }

  const lla = selectedPayslip.lla || {};
  const monthYearParts = selectedPayslip.payrollPeriod?.monthYear
    ? selectedPayslip.payrollPeriod.monthYear.split('-')
    : ['--', '----'];
  const monthNum = monthYearParts[0];
  const yearNum = monthYearParts[1];

  const baseSalary = Number(lla.baseSalary ?? selectedPayslip.baseSalary ?? 0);
  const appliedMonthSalary = Number(lla.appliedMonthSalary ?? baseSalary);
  const standardDays = Number(lla.standardWorkingDays ?? selectedPayslip.payrollPeriod?.standardWorkingDays ?? 26);
  const actualDays = Number(lla.actualWorkingDays ?? selectedPayslip.actualWorkingDays ?? 0);
  const salaryByDays = Number(
    lla.salaryByDays ?? (standardDays > 0 ? Math.round((appliedMonthSalary / standardDays) * actualDays) : 0)
  );
  const fixedAllowance = Number(lla.fixedAllowance ?? 0);
  const ctpAndCommission = Number(lla.ctpAndCommission ?? 0);
  const otAndBonus = Number(lla.otAndBonus ?? 0);
  const grossSalary = salaryByDays + fixedAllowance + ctpAndCommission + otAndBonus;

  const insuranceDeduction = Number(lla.insuranceDeduction ?? selectedPayslip.insuranceDeduction ?? 0);
  const taxDeduction = Number(selectedPayslip.taxDeduction ?? 0);
  const latePenaltyAmount = Number(lla.latePenaltyAmount ?? 0);
  const advanceAmount = Number(lla.advanceAmount ?? 0);
  const unionFee = Number(lla.unionFee ?? 0);
  const totalDeductions = insuranceDeduction + taxDeduction + latePenaltyAmount + advanceAmount + unionFee;
  const netSalary = Number(lla.netSalary ?? selectedPayslip.netSalary ?? (grossSalary - totalDeductions));

  const periodStatus = selectedPayslip.payrollPeriod?.status || 'DRAFT';
  const statusMeta = PERIOD_STATUS_META[periodStatus] || PERIOD_STATUS_META.DRAFT;
  const isNegativeNet = netSalary < 0;

  const deptName = selectedPayslip.employee?.department?.name || 'Tổ chức';
  const posTitle = selectedPayslip.employee?.position?.title || 'Nhân viên';
  const contractType = lla.contractType || 'OFFICIAL';
  const probationPct = lla.probationPercent ?? (contractType === 'PROBATION' ? 85 : 100);
  const stageLabel =
    lla.stageLabel ||
    (contractType === 'INTERNSHIP'
      ? 'Thực tập'
      : probationPct < 100
        ? `Thử việc ${probationPct}%`
        : `Chính thức ${probationPct}%`);

  const handleSendInquiry = (e) => {
    e.preventDefault();
    if (!inquiryNote.trim()) {
      return toast.error('Vui lòng nhập nội dung thắc mắc về phiếu lương');
    }
    toast.success(`Đã ghi nhận thắc mắc kỳ lương Tháng ${monthNum}/${yearNum}. Bộ phận C&B (cb@lla.vn) sẽ phản hồi sớm nhất!`);
    setInquiryNote('');
    setShowInquiryModal(false);
  };

  const availableYears = Array.from(
    new Set(
      payslips
        .map((p) => p.payrollPeriod?.monthYear?.split('-')?.[1])
        .filter(Boolean)
    )
  ).sort((a, b) => Number(b) - Number(a));

  const filteredPayslips = payslips.filter((p) => {
    if (selectedYearFilter === 'ALL') return true;
    const yr = p.payrollPeriod?.monthYear?.split('-')?.[1];
    return yr === selectedYearFilter;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header chuẩn đồng bộ */}
      <div>
        <PageHeader
          icon={<Banknote size={20} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          title="Phiếu Lương Điện Tử (My Payslip)"
          subtitle="Minh bạch thu nhập, thuế TNCN, bảo hiểm và tiền lương thực lĩnh hàng tháng theo chuẩn Công ty LLA."
          actions={
            <button
              type="button"
              onClick={() => setShowAmounts((prev) => !prev)}
              className="btn btn-outline"
              style={{ height: '38px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title={showAmounts ? 'Ẩn số tiền' : 'Hiển thị số tiền'}
            >
              {showAmounts ? <EyeOff size={15} /> : <Eye size={15} />}
              {showAmounts ? 'Ẩn số' : 'Hiện số'}
            </button>
          }
        />
      </div>

      {/* 2. Thẻ Tóm Tắt Thu Nhập Nhanh */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Tổng thu nhập Gross</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
            {formatCurrency(grossSalary)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Lương theo công ({actualDays}/{standardDays}) + Phụ cấp</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.2rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Tổng các khoản khấu trừ</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>
            - {formatCurrency(totalDeductions)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>BHXH (10.5%), Phạt muộn, Thuế TNCN</span>
        </div>

        <div style={{
          background: isNegativeNet
            ? 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)'
            : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          color: '#FFFFFF',
          padding: '1.2rem',
          borderRadius: '1rem',
          boxShadow: isNegativeNet
            ? '0 6px 16px rgba(220, 38, 38, 0.25)'
            : '0 6px 16px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thực lĩnh (Net Salary)
            </span>
            <span style={{ backgroundColor: statusMeta.bg, padding: '2px 9px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
              {statusMeta.label}
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {formatCurrency(netSalary)}
          </div>
          <span style={{ fontSize: '0.75rem', color: isNegativeNet ? '#FEE2E2' : '#D1FAE5' }}>
            {isNegativeNet
              ? `Kỳ Tháng ${monthNum}/${yearNum} • Chưa phát sinh đủ công`
              : `Kỳ lương Tháng ${monthNum}/${yearNum}`}
          </span>
        </div>
      </div>

      {/* 3. Bố cục 2 cột: Lịch sử kỳ lương bên trái + Chi tiết phiếu lương bên phải */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {/* Cột trái: Danh sách các kỳ lương */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          position: 'sticky',
          top: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem', paddingBottom: '0.55rem', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
              <Calendar size={16} color="#2563EB" />
              Kỳ lương ({filteredPayslips.length})
            </div>
            {availableYears.length > 0 && (
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '0.4rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#F8FAFC'
                }}
              >
                <option value="ALL">Tất cả năm</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: '2px'
          }}>
            {filteredPayslips.map((p) => {
              const parts = p.payrollPeriod?.monthYear ? p.payrollPeriod.monthYear.split('-') : ['--', '----'];
              const isSelected = p.id === selectedPayslip.id;
              const pStatus = p.payrollPeriod?.status || 'DRAFT';
              const pMeta = PERIOD_STATUS_META[pStatus] || PERIOD_STATUS_META.DRAFT;
              const pNet = Number(p.lla?.netSalary ?? p.netSalary ?? 0);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayslip(p)}
                  style={{
                    textAlign: 'left',
                    padding: '0.7rem 0.8rem',
                    borderRadius: '0.65rem',
                    border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                      Tháng {parts[0]}/{parts[1]}
                    </strong>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      backgroundColor: pMeta.badgeBg,
                      color: pMeta.badgeColor
                    }}>
                      {pStatus === 'LOCKED' || pStatus === 'PAID' || pStatus === 'CLOSED' ? 'Chốt sổ' : 'Nháp'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pNet < 0 ? '#DC2626' : '#059669' }}>
                    {formatCurrency(pNet)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Chi Tiết Phiếu Lương Chuẩn Doanh Nghiệp */}
        <div
          className="payslip-print-area"
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}
        >
          {/* Header phiếu */}
          <div style={{
            padding: '1.75rem 2.25rem',
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
                <strong style={{ fontSize: '1.12rem', color: '#0F172A' }}>CÔNG TY TNHH LLA ENTERPRISE</strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Trụ sở chính: Hà Nội • MST: 0108889999</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#2563EB', letterSpacing: '0.02em' }}>
                PHIẾU LƯƠNG CHI TIẾT
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
                  KỲ LƯƠNG: THÁNG {monthNum} / {yearNum}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: statusMeta.badgeBg,
                  color: statusMeta.badgeColor
                }}>
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>

          {/* Cảnh báo nếu Net âm hoặc chưa đủ công */}
          {isNegativeNet && (
            <div style={{
              margin: '1.25rem 2.25rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '0.65rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem'
            }}>
              <AlertTriangle size={17} color="#DC2626" style={{ flexShrink: 0 }} />
              <span>
                Phiếu lương đang tạm tính âm do số công thực tế trong kỳ ({actualDays}/{standardDays} công) chưa bù đắp khoản trích đóng BHXH.
              </span>
            </div>
          )}

          {/* Thông tin nhân viên */}
          <div style={{ padding: '1.35rem 2.25rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAFAFA' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Họ và tên nhân viên:</span>
                <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{selectedPayslip.employee?.fullName || fullName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Mã nhân sự:</span>
                <strong style={{ color: '#2563EB' }}>{selectedPayslip.employee?.code || employeeCode || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Phòng ban / Chức danh:</span>
                <strong style={{ color: '#0F172A' }}>{deptName} - {posTitle}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Số công chuẩn / Thực tế:</span>
                <strong style={{ color: actualDays > 0 ? '#059669' : '#DC2626' }}>{actualDays} / {standardDays} công</strong>
              </div>
            </div>
          </div>

          {/* Bảng kê chi tiết thu nhập & khấu trừ */}
          <div style={{ padding: '1.5rem 2.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Cột 1: Các khoản thu nhập */}
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
                    <span>2. Lương / Trợ cấp áp dụng tháng ({stageLabel}):</span>
                    <strong>{formatCurrency(appliedMonthSalary)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>3. Lương theo ngày công làm việc:</span>
                    <strong style={{ color: '#047857' }}>{formatCurrency(salaryByDays)}</strong>
                  </div>
                  {lla.isSplitPeriod && Array.isArray(lla.splitSegments) && lla.splitSegments.length > 1 && (
                    <div style={{ paddingLeft: '0.75rem', borderLeft: '2px solid #C4B5FD', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#6D28D9' }}>
                      {lla.splitSegments.map((seg, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            • {seg.fromDate.slice(8, 10)}/{seg.fromDate.slice(5, 7)}→{seg.toDate.slice(8, 10)}/{seg.toDate.slice(5, 7)} ({seg.stageLabel}, {seg.workingDays} công):
                          </span>
                          <strong>{formatCurrency(seg.salaryByDays)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>4. Phụ cấp cố định (Ăn trưa, xăng, ĐT):</span>
                    <strong>{formatCurrency(fixedAllowance)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>5. Phụ cấp CTP / Hoa hồng:</span>
                    <strong>{formatCurrency(ctpAndCommission)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>6. Thưởng &amp; Làm thêm giờ (OT):</span>
                    <strong>{formatCurrency(otAndBonus)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', color: '#0F172A', fontWeight: 700 }}>
                    <span>TỔNG THU NHẬP (GROSS):</span>
                    <span style={{ color: '#059669', fontSize: '1rem' }}>{formatCurrency(grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Cột 2: Các khoản khấu trừ */}
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
              marginTop: '1.75rem',
              padding: '1.2rem 1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: isNegativeNet ? '#FEF2F2' : '#F0FDF4',
              border: isNegativeNet ? '2px solid #FECACA' : '2px solid #BBF7D0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: isNegativeNet ? '#991B1B' : '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SỐ TIỀN THỰC CHUYỂN KHOẢN (NET SALARY):
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: isNegativeNet ? '#B91C1C' : '#15803D' }}>
                  Hình thức chi trả: Chuyển khoản ngân hàng (ATM)
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: isNegativeNet ? '#DC2626' : '#166534' }}>
                {formatCurrency(netSalary)}
              </div>
            </div>
          </div>

          {/* Footer Phiếu Lương */}
          <div style={{
            padding: '1.1rem 2.25rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: '#64748B'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="#059669" /> Phiếu lương điện tử được chứng thực số bởi LLA Enterprise HRM
            </span>
            <button
              type="button"
              className="no-print"
              onClick={() => setShowInquiryModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563EB',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: 0
              }}
            >
              <HelpCircle size={14} /> Khiếu nại / Thắc mắc lương?
            </button>
          </div>
        </div>
      </div>

      {/* Modal Thắc mắc / Khiếu nại lương */}
      {showInquiryModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.55)', padding: '1rem' }}>
          <div style={{ width: '480px', maxWidth: '100%', backgroundColor: '#FFFFFF', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <strong style={{ fontSize: '1rem', color: '#0F172A' }}>
                Thắc mắc phiếu lương Tháng {monthNum}/{yearNum}
              </strong>
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendInquiry} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#475569', backgroundColor: '#EFF6FF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #BFDBFE' }}>
                Gửi câu hỏi về ngày công, phụ cấp, bảo hiểm hoặc khấu trừ trực tiếp tới Bộ phận C&amp;B (<strong>cb@lla.vn</strong>).
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Nội dung thắc mắc
                </label>
                <textarea
                  rows={4}
                  value={inquiryNote}
                  onChange={(e) => setInquiryNote(e.target.value)}
                  placeholder="Ví dụ: Em thấy số công thực tế tháng này chưa khớp với bảng chấm công..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowInquiryModal(false)}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Send size={14} /> Gửi thắc mắc
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
