import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Eye, EyeOff, Edit3, ShieldAlert, 
  CheckCircle, Banknote, Calendar, User, Briefcase, FileText, 
  Award, Building2, Phone, Mail, Clock, Download, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../../components/common/PageHeader';

// Helper: Chuyển đổi số tiền thành chữ bằng tiếng Việt chuẩn kế toán
function numberToVietnameseWords(num) {
  if (isNaN(num) || num === null || num === undefined) return '';
  const n = Math.round(Math.abs(Number(num)));
  if (n === 0) return 'Không đồng chẵn.';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readThreeDigits(threeDigits, isHighestGroup) {
    const h = Math.floor(threeDigits / 100);
    const t = Math.floor((threeDigits % 100) / 10);
    const o = threeDigits % 10;
    let res = '';

    if (h > 0 || !isHighestGroup) {
      res += digits[h] + ' trăm ';
    }

    if (t === 0) {
      if (o > 0 && (h > 0 || !isHighestGroup)) res += 'lẻ ';
    } else if (t === 1) {
      res += 'mười ';
    } else {
      res += digits[t] + ' mươi ';
    }

    if (t > 1 && o === 1) {
      res += 'mốt';
    } else if (t > 0 && o === 5) {
      res += 'lăm';
    } else if (o > 0) {
      res += digits[o];
    }

    return res.trim();
  }

  const str = String(n);
  const groups = [];
  for (let i = str.length; i > 0; i -= 3) {
    groups.unshift(Number(str.substring(Math.max(0, i - 3), i)));
  }

  let words = '';
  const groupCount = groups.length;
  for (let i = 0; i < groupCount; i++) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const isHighest = (i === 0);
      const groupWords = readThreeDigits(groupVal, isHighest);
      const unit = units[groupCount - 1 - i];
      words += `${groupWords} ${unit} `;
    }
  }

  words = words.trim();
  words = words.charAt(0).toUpperCase() + words.slice(1) + ' đồng chẵn.';
  return words;
}

export const PayslipDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryMonth = searchParams.get('month');
  const queryYear = searchParams.get('year');

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maskSalary, setMaskSalary] = useState(false);

  // Modal chỉnh sửa trực tiếp trên trang chi tiết
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPayslip = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/payroll/payslip/${id}`);
      setPayslip(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy thông tin phiếu lương này!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPayslip();
  }, [id]);

  const lla = payslip?.lla || {};
  const period = payslip?.payrollPeriod || {};
  const employee = payslip?.employee || {};

  const formatCurrency = (amount) => {
    if (maskSalary) return '••••••••• ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  const formatNumber = (amount) => {
    if (maskSalary) return '•••••••';
    return new Intl.NumberFormat('vi-VN').format(Math.round(Number(amount) || 0));
  };

  const handlePrint = () => {
    window.print();
  };

  const openEdit = () => {
    if (period.status === 'LOCKED') {
      return toast.error('Kỳ lương đã KHÓA SỔ, không thể chỉnh sửa!');
    }
    setEditForm({
      baseSalary: lla.baseSalary || 0,
      appliedMonthSalary: lla.appliedMonthSalary || 0,
      actualWorkingDays: lla.actualWorkingDays || 0,
      ctpAndCommission: lla.ctpAndCommission || 0,
      fixedAllowance: lla.fixedAllowance || 0,
      otAndBonus: lla.otAndBonus || 0,
      insuranceBaseSalary: lla.insuranceBaseSalary || 0,
      insuranceDeduction: lla.insuranceDeduction || 0,
      advanceAmount: lla.advanceAmount || 0,
      latePenaltyAmount: lla.latePenaltyAmount || 0,
      unionFee: lla.unionFee || 0,
      taxDeduction: lla.taxDeduction || payslip.taxDeduction || 0
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await axios.put(`/api/payroll/payslip/${id}/lla-adjust`, {
        ...editForm,
        standardWorkingDays: lla.standardWorkingDays || 26
      });
      toast.success('Đã cập nhật phiếu lương thành công!');
      setIsEditing(false);
      fetchPayslip();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi lưu phiếu lương');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted">
        <RefreshCw size={28} className="animate-spin mr-3 text-primary" />
        <span>Đang tải thông tin chi tiết phiếu lương...</span>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="card p-8 text-center max-w-xl mx-auto my-12">
        <ShieldAlert size={48} className="mx-auto text-danger mb-3" />
        <h3 className="font-bold text-lg mb-2">Không tìm thấy phiếu lương</h3>
        <p className="text-muted text-sm mb-6">Phiếu lương có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
        <button onClick={() => navigate('/internal/payroll/payslips')} className="btn btn-primary mx-auto">
          Quay lại Bảng lương
        </button>
      </div>
    );
  }

  const periodParts = (period.monthYear || '9-2026').split('-');
  const displayMonth = periodParts[0];
  const displayYear = periodParts[1];

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ padding: '0 0.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Header & Điều hướng chuẩn Enterprise */}
      <div className="no-print">
        <PageHeader
          leftActions={
            <button 
              onClick={() => navigate(`/internal/payroll/payslips?month=${queryMonth || displayMonth}&year=${queryYear || displayYear}`)}
              className="btn btn-outline" 
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', backgroundColor: '#F8FAFC' }}
              title="Quay lại danh sách Bảng lương"
            >
              <ArrowLeft size={18} />
            </button>
          }
          icon={<Banknote size={20} />}
          title={`CHI TIẾT PHIẾU LƯƠNG: ${employee.fullName || 'Nhân sự'}`}
          badge={
            <div className="flex items-center gap-2">
              <span className={`badge ${period.status === 'LOCKED' ? 'badge-danger' : 'badge-warning'} font-bold`}>
                {period.status === 'LOCKED' ? 'ĐÃ KHÓA SỔ' : 'BẢN NHÁP (MỞ)'}
              </span>
              {payslip.isPaymentLocked && (
                <span className="badge badge-danger font-bold">TẠM GIỮ CHI TRẢ</span>
              )}
            </div>
          }
          subtitle={`Phiếu lương điện tử Tháng ${String(displayMonth).padStart(2, '0')}/${displayYear} — Công ty TNHH LLA`}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMaskSalary(prev => !prev)}
                className="btn btn-outline flex items-center gap-1.5"
                style={{ height: 36, borderColor: maskSalary ? '#F59E0B' : 'var(--border)', color: maskSalary ? '#D97706' : 'var(--text-main)' }}
              >
                {maskSalary ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{maskSalary ? 'Hiện Số Liệu' : 'Che Bảo Mật'}</span>
              </button>

              <button
                type="button"
                onClick={openEdit}
                disabled={period.status === 'LOCKED'}
                className="btn btn-outline flex items-center gap-1.5"
                style={{ height: 36, color: '#0284C7', borderColor: '#BAE6FD' }}
              >
                <Edit3 size={15} />
                <span>Điều Chỉnh Lương</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary flex items-center gap-1.5"
                style={{ height: 36 }}
              >
                <Printer size={15} />
                <span>In Phiếu Lương (PDF)</span>
              </button>
            </div>
          }
        />
      </div>

      {/* 2. KHUNG PHIẾU LƯƠNG ĐIỆN TỬ CHUẨN A4 (In ấn & Hiển thị trên Web) */}
      <div 
        id="printable-payslip"
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #CBD5E1',
          padding: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#0F172A'
        }}
      >
        {/* Header Công Ty & Quốc Hiệu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: '1.25rem', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}>
                LLA
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CÔNG TY TNHH LLA
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                  LLA Enterprise HRM • Empowering Innovation
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginTop: '0.25rem' }}>
              Địa chỉ: Tầng 5, Tòa nhà LLA, Số 123 Phố Duy Tân, Cầu Giấy, Hà Nội
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>Mã phiếu lương:</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0284C7', fontFamily: 'Inter, sans-serif' }}>
              PL-{displayYear}{String(displayMonth).padStart(2, '0')}-{payslip.id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
              Ngày lập: {new Date(payslip.createdAt || Date.now()).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Tiêu đề Phiếu Lương */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', margin: 0 }}>
            PHIẾU LƯƠNG ĐIỆN TỬ THÁNG {String(displayMonth).padStart(2, '0')}/{displayYear}
          </h2>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginTop: '0.35rem' }}>
            (Ngày công chuẩn tháng: <strong style={{ color: '#0284C7' }}>{lla.standardWorkingDays || 26} ngày</strong>)
          </div>
        </div>

        {/* Thông Tin Nhân Viên (Thẻ 2 cột thông tin) */}
        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', fontSize: '0.92rem' }}>
            <div>
              <span style={{ color: '#64748B' }}>Họ và tên nhân sự: </span>
              <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{employee.fullName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Mã số nhân viên: </span>
              <strong style={{ color: '#0284C7', fontFamily: 'Inter, sans-serif' }}>{employee.code}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Phòng ban / Đơn vị: </span>
              <strong>{employee.department?.name || 'Tổ chức & Điều hành'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Vị trí chức danh: </span>
              <strong>{employee.position?.title || 'Chuyên viên'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Loại hợp đồng / Chặng: </span>
              <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Inter, sans-serif' }}>
                {lla.stageLabel || 'Chính thức 100%'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Ngày công thực tế: </span>
              <span style={{ backgroundColor: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif' }}>
                {lla.actualWorkingDays} / {lla.standardWorkingDays || 26} ngày công
              </span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Lương cơ bản (Cột C): </span>
              <strong>{formatCurrency(lla.baseSalary)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Lương áp dụng T{displayMonth} (Cột D): </span>
              <strong style={{ color: '#0F172A' }}>{formatCurrency(lla.appliedMonthSalary)}</strong>
            </div>
          </div>
        </div>

        {/* Highlight Banner Đánh Giá KPI (Nếu có) */}
        {lla.kpiGrade && (
          <div style={{
            backgroundColor: '#FAF5FF',
            border: '1.5px solid #D8B4FE',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#F3E8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                🎯
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#6B21A8' }}>
                  KẾT QUẢ ĐÁNH GIÁ HIỆU SUẤT KPI: HẠNG {lla.kpiGrade} ({lla.kpiScore || 0} ĐIỂM)
                </div>
                <div style={{ fontSize: '0.84rem', color: '#7E22CE', fontFamily: 'Inter, sans-serif' }}>
                  {Number(lla.kpiBonus) > 0 
                    ? `Áp dụng chính sách thưởng hiệu suất: Tự động cộng +${formatCurrency(lla.kpiBonus)} vào Cột G`
                    : 'Đã hoàn thành đánh giá kỳ, không phát sinh thưởng hiệu suất'}
                </div>
              </div>
            </div>
            <span style={{
              backgroundColor: lla.kpiGrade === 'A' ? '#15803D' : lla.kpiGrade === 'B' ? '#1D4ED8' : '#B45309',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif'
            }}>
              XẾP LOẠI {lla.kpiGrade}
            </span>
          </div>
        )}

        {/* BẢNG I: CHI TIẾT CÁC KHOẢN THU NHẬP & CÔNG TY THANH TOÁN (CỘT F → M) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            padding: '8px 14px',
            fontWeight: 800,
            fontSize: '0.95rem',
            borderRadius: '6px 6px 0 0',
            letterSpacing: '0.5px'
          }}>
            I. CHI TIẾT THU NHẬP & CÔNG TY THANH TOÁN (CỘT F → M)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '38%', borderRight: '1px solid #CBD5E1' }}>Khoản mục thu nhập</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #CBD5E1' }}>Diễn giải / Căn cứ tính toán</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '22%' }}>Số tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {/* Cột F: Lương theo ngày công */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  1. Tổng lương theo ngày công (Cột F)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  {lla.isSplitPeriod && Array.isArray(lla.splitSegments) && lla.splitSegments.length > 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: 600, color: '#6D28D9' }}>Tính tách chặng hợp đồng giữa tháng:</span>
                      {lla.splitSegments.map((s, idx) => (
                        <div key={idx} style={{ fontSize: '0.82rem' }}>
                          • {s.fromDate.slice(8, 10)}/{s.fromDate.slice(5, 7)} → {s.toDate.slice(8, 10)}/{s.toDate.slice(5, 7)} ({s.stageLabel}): {s.workingDays} công = {formatCurrency(s.salaryByDays)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    `Lương T${displayMonth} (${formatNumber(lla.appliedMonthSalary)} đ) ÷ ${lla.standardWorkingDays || 26} công chuẩn × ${lla.actualWorkingDays} ngày công thực tế`
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(lla.salaryByDays)}
                </td>
              </tr>

              {/* Cột G: CTP + Hoa hồng + Thưởng KPI */}
              <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: Number(lla.ctpAndCommission) > 0 ? '#FAF5FF' : 'transparent' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  2. CTP + Hoa hồng + Thưởng KPI (Cột G)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  {lla.kpiGrade && Number(lla.kpiBonus) > 0 ? (
                    <span style={{ color: '#7E22CE', fontWeight: 600 }}>
                      🎯 Thưởng hiệu suất KPI Hạng {lla.kpiGrade} ({lla.kpiScore || 0}đ): +{formatCurrency(lla.kpiBonus)}
                      {Number(lla.ctpAndCommission) > Number(lla.kpiBonus) && ` + CTP / Hoa hồng khác: +${formatCurrency(Number(lla.ctpAndCommission) - Number(lla.kpiBonus))}`}
                    </span>
                  ) : (
                    'Phụ cấp công tác phí, trách nhiệm, hoa hồng dự án'
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: Number(lla.ctpAndCommission) > 0 ? '#7E22CE' : 'inherit' }}>
                  {formatCurrency(lla.ctpAndCommission)}
                </td>
              </tr>

              {/* Cột H-I: Điện thoại + Xăng xe + Ăn trưa */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  3. Điện thoại + Xăng xe + Ăn trưa (Cột H-I)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  Phụ cấp cố định hỗ trợ đi lại, liên lạc và cơm trưa hàng tháng theo quy chế LLA
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(lla.fixedAllowance)}
                </td>
              </tr>

              {/* Cột J: Lương OT + Thưởng */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  4. Lương làm thêm giờ OT + Thưởng (Cột J)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  Lương làm thêm giờ theo Điều 98 BLLĐ 2019 (150% ngày thường, 200% cuối tuần, 300% lễ) và quyết định khen thưởng
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(lla.otAndBonus)}
                </td>
              </tr>

              {/* Cột L: Trừ BHXH */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700, color: '#DC2626' }}>
                  5. Trích nộp BHXH, BHYT, BHTN 10.5% (Cột L)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  {Number(lla.insuranceDeduction) > 0 ? (
                    `10.5% (8% BHXH + 1.5% BHYT + 1% BHTN) tính trên lương đóng BHXH: ${formatCurrency(lla.insuranceBaseSalary)}`
                  ) : (
                    'Hợp đồng Thử việc / Thực tập không trích đóng BHXH bắt buộc theo luật'
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                  {Number(lla.insuranceDeduction) > 0 ? `-${formatCurrency(lla.insuranceDeduction)}` : '0 ₫'}
                </td>
              </tr>

              {/* DÒNG TỔNG CỘT M: CÔNG TY THANH TOÁN */}
              <tr style={{ backgroundColor: '#F0F9FF', borderTop: '2px solid #0284C7' }}>
                <td colSpan={2} style={{ padding: '12px 14px', borderRight: '1px solid #CBD5E1', fontWeight: 800, fontSize: '1rem', color: '#0369A1' }}>
                  CÔNG TY THANH TOÁN (CỘT M = [1] + [2] + [3] + [4] - [5])
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, fontSize: '1.15rem', color: '#0284C7' }}>
                  {formatCurrency(lla.companyPayout)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BẢNG II: CÁC KHOẢN GIẢM TRỪ SAU THANH TOÁN (CỘT N, O, P) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            padding: '8px 14px',
            fontWeight: 800,
            fontSize: '0.95rem',
            borderRadius: '6px 6px 0 0',
            letterSpacing: '0.5px'
          }}>
            II. CÁC KHOẢN GIẢM TRỪ SAU THANH TOÁN (CỘT N, O, P)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '38%', borderRight: '1px solid #CBD5E1' }}>Khoản mục giảm trừ</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #CBD5E1' }}>Diễn giải / Căn cứ</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '22%' }}>Số tiền trừ (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {/* Cột N: Ứng lương */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  1. Tạm ứng lương trong kỳ (Cột N)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  Khoản tiền nhân viên đã làm phiếu tạm ứng trong tháng
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: Number(lla.advanceAmount) > 0 ? '#DC2626' : 'inherit' }}>
                  {Number(lla.advanceAmount) > 0 ? `-${formatCurrency(lla.advanceAmount)}` : '0 ₫'}
                </td>
              </tr>

              {/* Cột O: Phạt đi muộn */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  2. Phạt đi muộn + chế tài khác (Cột O)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  Phạt đi muộn vượt quota cho phép (quy định 50.000 đ / lần sau 3 lần miễn trừ)
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: Number(lla.latePenaltyAmount) > 0 ? '#DC2626' : 'inherit' }}>
                  {Number(lla.latePenaltyAmount) > 0 ? `-${formatCurrency(lla.latePenaltyAmount)}` : '0 ₫'}
                </td>
              </tr>

              {/* Cột P: Quỹ Công đoàn */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  3. Đóng Quỹ Công đoàn (Cột P)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  Đóng góp quỹ công đoàn chăm lo đời sống đoàn viên
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: Number(lla.unionFee) > 0 ? '#DC2626' : 'inherit' }}>
                  {Number(lla.unionFee) > 0 ? `-${formatCurrency(lla.unionFee)}` : '0 ₫'}
                </td>
              </tr>

              {/* Cột Thuế TNCN */}
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', fontWeight: 700 }}>
                  4. Thuế thu nhập cá nhân (TNCN)
                </td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #CBD5E1', color: '#475569', fontSize: '0.88rem' }}>
                  Thuế TNCN tính theo biểu lũy tiến từng phần (sau giảm trừ bản thân 11tr & NPT)
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: Number(lla.taxDeduction || payslip.taxDeduction) > 0 ? '#DC2626' : 'inherit' }}>
                  {Number(lla.taxDeduction || payslip.taxDeduction) > 0 ? `-${formatCurrency(lla.taxDeduction || payslip.taxDeduction)}` : '0 ₫'}
                </td>
              </tr>

              {/* DÒNG TỔNG CÁC KHOẢN GIẢM TRỪ */}
              <tr style={{ backgroundColor: '#FEF2F2', borderTop: '2px solid #DC2626' }}>
                <td colSpan={2} style={{ padding: '12px 14px', borderRight: '1px solid #CBD5E1', fontWeight: 800, fontSize: '1rem', color: '#991B1B' }}>
                  TỔNG CÁC KHOẢN GIẢM TRỪ ([1] + [2] + [3] + [4])
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, fontSize: '1.15rem', color: '#DC2626' }}>
                  -{formatCurrency(Number(lla.advanceAmount || 0) + Number(lla.latePenaltyAmount || 0) + Number(lla.unionFee || 0) + Number(lla.taxDeduction || payslip.taxDeduction || 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BẢNG III: THỰC LĨNH / THỰC NHẬN CUỐI CÙNG (CỘT Q) */}
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '2px solid #059669',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                III. TỔNG SỐ TIỀN THỰC LĨNH CHUYỂN KHOẢN (CỘT Q)
              </div>
              <div style={{ fontSize: '0.88rem', color: '#047857', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                (Thực nhận = Công ty thanh toán [Cột M] - Tổng giảm trừ [N, O, P])
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#064E3B', marginTop: '0.5rem', fontStyle: 'italic' }}>
                Bằng chữ: <span style={{ color: '#047857' }}>{maskSalary ? '••••••••••••••••••••••••••' : numberToVietnameseWords(lla.netSalary)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.5px' }}>
                {formatCurrency(lla.netSalary)}
              </div>
              <span style={{
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif'
              }}>
                {payslip.isPaymentLocked ? '⚠️ ĐANG TẠM GIỮ CHI TRẢ' : '✓ SẴN SÀNG CHI TRẢ NGÂN HÀNG'}
              </span>
            </div>
          </div>
        </div>

        {/* PHẦN CHỮ KÝ VÀ XÁC NHẬN (Chuẩn kế toán pháp lý khi in ấn) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', textAlign: 'center', paddingTop: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase' }}>Người Lập Biểu</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '70px' }}></div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Phòng Nhân sự & C&B</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase' }}>Kế Toán Trưởng</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '70px' }}></div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Phòng Kế toán - Tài chính</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase' }}>Người Nhận Lương</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>(Ký xác nhận đối soát)</div>
            <div style={{ height: '70px' }}></div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{employee.fullName}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '2rem', paddingTop: '0.75rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
          Mọi thắc mắc về số ngày công, các khoản phụ cấp hoặc tiền thưởng KPI, vui lòng liên hệ Bộ phận Nhân sự & C&B trong vòng 03 ngày làm việc kể từ ngày nhận phiếu.
        </div>
      </div>

      {/* 3. MODAL ĐIỀU CHỈNH LƯƠNG TRỰC TIẾP TRÊN TRANG */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '650px',
            color: '#fff',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 className="font-bold text-lg mb-2 text-primary flex items-center gap-2">
              <Edit3 size={18} />
              Điều chỉnh Phiếu lương: {employee.fullName}
            </h3>
            <p className="text-muted text-xs mb-4">
              Cập nhật ngày công, phụ cấp, tiền thưởng KPI, hoặc các khoản tạm ứng/phạt cho phiếu lương này.
            </p>

            <form onSubmit={handleSaveEdit}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="form-label text-xs font-bold">Lương cơ bản (Cột C)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.baseSalary}
                    onChange={e => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold">Lương áp dụng T{displayMonth} (Cột D)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.appliedMonthSalary}
                    onChange={e => setEditForm({ ...editForm, appliedMonthSalary: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="form-label text-xs font-bold">Ngày công thực tế (Cột E)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={editForm.actualWorkingDays}
                    onChange={e => setEditForm({ ...editForm, actualWorkingDays: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold flex items-center justify-between">
                    <span>CTP + Thưởng KPI (Cột G)</span>
                    {lla.kpiGrade && (
                      <span className="text-xs" style={{ color: '#8B5CF6' }}>
                        (KPI: {lla.kpiGrade} - {lla.kpiScore || 0}đ)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.ctpAndCommission}
                    onChange={e => setEditForm({ ...editForm, ctpAndCommission: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="form-label text-xs font-bold">Điện thoại + Xăng xe + Ăn trưa (Cột H-I)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.fixedAllowance}
                    onChange={e => setEditForm({ ...editForm, fixedAllowance: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold">Lương làm thêm giờ + Thưởng (Cột J)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.otAndBonus}
                    onChange={e => setEditForm({ ...editForm, otAndBonus: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-5">
                <div>
                  <label className="form-label text-xs font-bold">Tạm ứng (Cột N)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.advanceAmount}
                    onChange={e => setEditForm({ ...editForm, advanceAmount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold">Phạt muộn (Cột O)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.latePenaltyAmount}
                    onChange={e => setEditForm({ ...editForm, latePenaltyAmount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold">Công đoàn (Cột P)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.unionFee}
                    onChange={e => setEditForm({ ...editForm, unionFee: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold">Thuế TNCN</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.taxDeduction}
                    onChange={e => setEditForm({ ...editForm, taxDeduction: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CSS Dành Riêng Cho Bản In A4 (Khi bấm In Phiếu Lương) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
export default PayslipDetail;
