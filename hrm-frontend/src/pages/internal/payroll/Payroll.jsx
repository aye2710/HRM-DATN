import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Download, Calculator, Lock, Unlock, Banknote, ShieldAlert, 
  FileSignature, Search, Filter, Eye, EyeOff, X, ArrowLeft, Printer, 
  CheckCircle, User, Briefcase, Calendar, RefreshCw, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, Users, Edit3, Settings
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const PayrollMgmt = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mặc định mở Tháng 09/2026 (khớp bảng lương mẫu thực tế LLA) hoặc đọc từ URL params
  const initialMonth = searchParams.get('month') ? Number(searchParams.get('month')) : 9;
  const initialYear = searchParams.get('year') ? Number(searchParams.get('year')) : 2026;

  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [periodInfo, setPeriodInfo] = useState({
    status: 'DRAFT',
    standardWorkingDays: 26,
    weekdayCount: 22,
    workingSaturdays: [],
    offSaturdays: [],
    satMode: 'ALTERNATING',
    satMultiplier: 2,
    satAnchor: '2026-11-07'
  });
  
  // Bộ lọc tìm kiếm & Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal chi tiết phiếu lương nhân viên & Modal chỉnh sửa dòng lương LLA
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [editingPayslip, setEditingPayslip] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [maskSalary, setMaskSalary] = useState(false); // Chế độ che số liệu lương bảo mật NĐ 13/2023/NĐ-CP

  const getLla = (pr) => {
    const stdDays = Number(periodInfo.standardWorkingDays || 26);
    if (pr.lla) {
      return {
        ...pr.lla,
        standardWorkingDays: pr.lla.standardWorkingDays || stdDays
      };
    }
    const baseSalary = Number(pr.baseSalary || 0);
    const actualWorkingDays = Number(pr.actualWorkingDays || 0);
    const appliedMonthSalary = baseSalary;
    const salaryByDays = stdDays > 0 ? Math.round((appliedMonthSalary / stdDays) * actualWorkingDays) : 0;
    const fixedAllowance = 500000;
    const insDed = Number(pr.insuranceDeduction || 0);
    const companyPayout = salaryByDays + fixedAllowance - insDed;
    return {
      contractType: 'OFFICIAL_1Y',
      probationPercent: 100,
      baseSalary,
      appliedMonthSalary,
      standardWorkingDays: stdDays,
      actualWorkingDays,
      salaryByDays,
      ctpAndCommission: 0,
      fixedAllowance,
      otAndBonus: 0,
      insuranceBaseSalary: insDed > 0 ? baseSalary : 0,
      insuranceDeduction: insDed,
      companyPayout,
      advanceAmount: 0,
      latePenaltyAmount: 0,
      unionFee: 0,
      netSalary: Number(pr.netSalary || companyPayout)
    };
  };

  const fetchData = async (autoGenerateIfEmpty = true) => {
    setLoading(true);
    try {
      const [payrollRes, periodRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/payroll?month=${month}&year=${year}`),
        axios.get(`http://localhost:5000/api/payroll/period/info?month=${month}&year=${year}`)
      ]);
      const pInfo = periodRes.data || { status: 'DRAFT', standardWorkingDays: 26 };
      setPeriodInfo(pInfo);

      const list = payrollRes.data || [];
      if (list.length === 0 && autoGenerateIfEmpty && pInfo.status !== 'LOCKED') {
        await axios.post('http://localhost:5000/api/payroll/generate', { month, year });
        const refreshed = await axios.get(`http://localhost:5000/api/payroll?month=${month}&year=${year}`);
        setPayrolls(refreshed.data || []);
      } else {
        setPayrolls(list);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải bảng lương');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchParams({ month: String(month), year: String(year) });
    setCurrentPage(1);
    fetchData(true);
  }, [month, year]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept]);

  const handleGenerate = async () => {
    if (periodInfo.status === 'LOCKED') {
      return toast.error(`Kỳ lương ${month}/${year} đã bị KHÓA SỔ. Cần mở khóa trước khi chạy lại!`);
    }
    setCalculating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/payroll/generate', { month, year });
      toast.success(res.data.message || `Đã tính toán xong bảng lương tháng ${month}/${year}`);
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tính lương');
    } finally {
      setCalculating(false);
    }
  };

  const handleTogglePeriodLock = async () => {
    const isLocked = periodInfo.status === 'LOCKED';
    const actionText = isLocked ? 'MỞ KHÓA' : 'KHÓA SỔ';
    const confirmText = isLocked
      ? `Bạn có chắc muốn MỞ KHÓA kỳ lương tháng ${month}/${year}? (Cho phép điều chỉnh công và tính lại lương)`
      : `Bạn có chắc muốn KHÓA SỔ kỳ lương tháng ${month}/${year}? (Sau khi khóa, dữ liệu sẽ chuyển sang Read-Only để chi trả ngân hàng)`;

    const result = await Swal.fire({
      title: `${actionText} Kỳ Lương Tháng ${month}/${year}?`,
      text: confirmText,
      icon: isLocked ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonText: `${actionText} ngay`,
      cancelButtonText: 'Đóng',
      confirmButtonColor: isLocked ? '#0284c7' : '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const nextStatus = isLocked ? 'DRAFT' : 'LOCKED';
        await axios.post('http://localhost:5000/api/payroll/period/toggle-lock', {
          month,
          year,
          status: nextStatus
        });
        toast.success(`Đã ${actionText} kỳ lương thành công!`);
        fetchData(false);
      } catch (err) {
        toast.error('Lỗi khi đổi trạng thái khóa kỳ lương');
      }
    }
  };

  const handleTogglePaymentLock = async (payslip, lock) => {
    const actionText = lock ? 'TẠM KHÓA CHI TRẢ' : 'MỞ KHÓA CHI TRẢ';
    const confirmText = lock 
      ? `Bạn có chắc muốn TẠM KHÓA chi trả lương của nhân sự ${payslip.employee?.fullName}? (Chế tài chậm hồ sơ: Kế toán sẽ không thể xuất lệnh chuyển tiền cho nhân sự này)`
      : `Bạn có xác nhận nhân sự ${payslip.employee?.fullName} đã nộp đầy đủ hồ sơ gốc bản cứng (CCCD sao y, Sơ yếu lý lịch, Giấy KSK) để MỞ KHÓA CHI TRẢ?`;

    const result = await Swal.fire({
      title: `${actionText}?`,
      text: confirmText,
      icon: lock ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: `${actionText} ngay`,
      cancelButtonText: 'Đóng',
      confirmButtonColor: lock ? '#EF4444' : '#10B981'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`http://localhost:5000/api/payroll/payslip/${payslip.id}/toggle-payment-hold`, {
          lock,
          reason: lock ? 'Tạm khóa chi trả do chậm nộp hồ sơ gốc cứng quá 7 ngày' : 'HR xác nhận đã thu đủ hồ sơ cứng. Mở khóa chi trả.'
        });
        toast.success(`Đã ${actionText.toLowerCase()} thành công!`);
        fetchData(false);
      } catch (err) {
        toast.error('Lỗi khi cập nhật trạng thái chi trả');
      }
    }
  };

  const openEditModal = (pr) => {
    if (periodInfo.status === 'LOCKED') {
      return toast.error('Kỳ lương đã khóa sổ, vui lòng mở khóa trước khi chỉnh sửa!');
    }
    const lla = getLla(pr);
    setEditingPayslip(pr);
    setEditForm({
      baseSalary: lla.baseSalary,
      appliedMonthSalary: lla.appliedMonthSalary,
      actualWorkingDays: lla.actualWorkingDays,
      ctpAndCommission: lla.ctpAndCommission,
      fixedAllowance: lla.fixedAllowance,
      otAndBonus: lla.otAndBonus,
      insuranceBaseSalary: lla.insuranceBaseSalary,
      insuranceDeduction: lla.insuranceDeduction,
      advanceAmount: lla.advanceAmount,
      latePenaltyAmount: lla.latePenaltyAmount,
      unionFee: lla.unionFee
    });
  };

  const handleSaveLlaEdit = async (e) => {
    e.preventDefault();
    if (!editingPayslip) return;
    setSavingEdit(true);
    try {
      await axios.put(`http://localhost:5000/api/payroll/payslip/${editingPayslip.id}/lla-adjust`, {
        ...editForm,
        standardWorkingDays: periodInfo.standardWorkingDays || 26
      });
      toast.success(`Đã cập nhật bảng lương của ${editingPayslip.employee?.fullName}!`);
      setEditingPayslip(null);
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu điều chỉnh lương');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportExcel = () => {
    if (payrolls.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    const stdDays = periodInfo.standardWorkingDays || 26;
    const titleRow1 = [`"CÔNG TY TNHH LLA - BẢNG LƯƠNG THÁNG ${String(month).padStart(2, '0')}/${year}"`];
    const titleRow2 = [`"Ngày công : ${stdDays} ngày"`, "", "", "", `${stdDays}`];

    const headers = [
      "STT",
      "Họ Và Tên",
      "Lương cơ bản",
      `Lương T${month}`,
      "Ngày công thực tế",
      "Tổng lương",
      "CTP + Hoa hồng + trách nhiệm + thưởng",
      "Điện thoại + Xăng xe + Phụ cấp ăn trưa",
      "Lương làm thêm giờ + thưởng",
      "Lương đóng BHXH",
      "Trừ tiền BH",
      "Công ty thanh toán",
      "Ứng Lương",
      "Phạt đi muộn + phạt khác",
      "Quỹ Công đoàn",
      "Thực nhận"
    ];

    const rows = payrolls.map((pr, index) => {
      const lla = getLla(pr);
      return [
        index + 1,
        `"${pr.employee?.fullName || ''}"`,
        lla.baseSalary || 0,
        lla.appliedMonthSalary || 0,
        lla.actualWorkingDays || 0,
        lla.salaryByDays || 0,
        lla.ctpAndCommission || '',
        lla.fixedAllowance || 0,
        lla.otAndBonus || '',
        lla.insuranceBaseSalary || '',
        lla.insuranceDeduction || '',
        lla.companyPayout || 0,
        lla.advanceAmount || '',
        lla.latePenaltyAmount || '',
        lla.unionFee || '',
        lla.netSalary || 0
      ];
    });

    const csvContent = "\uFEFF" + [
      titleRow1.join(","),
      titleRow2.join(","),
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BANG_LUONG_LLA_THANG_${String(month).padStart(2, '0')}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format số chuẩn Excel LLA (VD: 7,000,000 hoặc để trống nếu = 0 cho các cột phụ)
  const formatLlaNumber = (amount, blankIfZero = false) => {
    if (maskSalary) return '•••••••';
    const num = Number(amount) || 0;
    if (blankIfZero && num === 0) return '';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(num));
  };

  const formatCurrency = (amount) => {
    if (maskSalary) return '••••••••• ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // Tính tổng chỉ số tài chính theo chuẩn LLA
  const totalBase = useMemo(() => payrolls.reduce((sum, p) => sum + Number(getLla(p).baseSalary || 0), 0), [payrolls, periodInfo]);
  const totalCompanyPayout = useMemo(() => payrolls.reduce((sum, p) => sum + Number(getLla(p).companyPayout || 0), 0), [payrolls, periodInfo]);
  const totalNet = useMemo(() => payrolls.reduce((sum, p) => sum + Number(getLla(p).netSalary || 0), 0), [payrolls, periodInfo]);
  const totalDeduction = useMemo(() => payrolls.reduce((sum, p) => {
    const lla = getLla(p);
    return sum + Number(lla.insuranceDeduction || 0) + Number(lla.advanceAmount || 0) + Number(lla.latePenaltyAmount || 0) + Number(lla.unionFee || 0);
  }, 0), [payrolls, periodInfo]);
  const lockedCount = useMemo(() => payrolls.filter(p => p.isPaymentLocked).length, [payrolls]);

  // Danh sách phòng ban duy nhất
  const departments = useMemo(() => {
    return Array.from(new Set(payrolls.map(p => p.employee?.department?.name).filter(Boolean)));
  }, [payrolls]);

  // Danh sách đã lọc theo tìm kiếm và phòng ban
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(pr => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        (pr.employee?.fullName || '').toLowerCase().includes(q) ||
        (pr.employee?.code || '').toLowerCase().includes(q) ||
        (pr.employee?.department?.name || '').toLowerCase().includes(q);
      const matchDept = selectedDept === 'ALL' || pr.employee?.department?.name === selectedDept;
      return matchSearch && matchDept;
    });
  }, [payrolls, searchTerm, selectedDept]);

  // Phân trang dữ liệu
  const totalRecords = filteredPayrolls.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentPayrolls = filteredPayrolls.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Preview tính toán trực tiếp trong Modal Sửa dòng lương LLA
  const livePreviewEdit = useMemo(() => {
    const stdDays = Number(periodInfo.standardWorkingDays || 26);
    const applied = Number(editForm.appliedMonthSalary || 0);
    const days = Number(editForm.actualWorkingDays || 0);
    const salaryByDays = stdDays > 0 ? Math.round((applied / stdDays) * days) : 0;
    const ctp = Number(editForm.ctpAndCommission || 0);
    const allowance = Number(editForm.fixedAllowance || 0);
    const ot = Number(editForm.otAndBonus || 0);
    const insDed = Number(editForm.insuranceDeduction || 0);
    const companyPayout = salaryByDays + ctp + allowance + ot - insDed;
    const adv = Number(editForm.advanceAmount || 0);
    const pen = Number(editForm.latePenaltyAmount || 0);
    const union = Number(editForm.unionFee || 0);
    const netSalary = companyPayout - adv - pen - union;
    return { salaryByDays, companyPayout, netSalary };
  }, [editForm, periodInfo]);

  return (
    <div className="animate-fade-in flex-col gap-5" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/internal/payroll/periods')}
              className="btn btn-outline" 
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', backgroundColor: '#F8FAFC' }}
              title="Quay lại danh sách kỳ lương"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="page-title">
                  BẢNG LƯƠNG THÁNG {String(month).padStart(2, '0')}/{year} — CÔNG TY TNHH LLA
                </h1>
                {periodInfo.status === 'LOCKED' ? (
                  <span className="badge badge-danger flex items-center gap-1 font-bold" style={{ padding: '0.25rem 0.65rem' }}>
                    <Lock size={12} /> ĐÃ KHÓA SỔ
                  </span>
                ) : (
                  <span className="badge badge-warning flex items-center gap-1 font-bold" style={{ padding: '0.25rem 0.65rem' }}>
                    <Unlock size={12} /> BẢN NHÁP (MỞ)
                  </span>
                )}
              </div>
              <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
                Công chuẩn động Tháng {String(month).padStart(2, '0')}/{year}: <strong style={{ color: 'var(--primary)' }}>{periodInfo.standardWorkingDays || 26} ngày công</strong> ({periodInfo.weekdayCount || 22} ngày T2–T6 × 1.0 + {periodInfo.workingSaturdays?.length || 2} ngày Thứ 7 đi làm cách tuần × {periodInfo.satMultiplier || 2} công)
              </p>
            </div>
          </div>

          {/* Cụm Thao Tác & Chọn Kỳ Lương Bên Phải */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center p-1 rounded-xl" style={{ border: '1px solid var(--border)', backgroundColor: '#F8FAFC' }}>
              <select 
                className="form-input" 
                style={{ height: 32, padding: '0 0.5rem', fontSize: '0.85rem', width: 'auto', border: 'none', background: 'transparent', fontWeight: 700 }}
                value={month} 
                onChange={e => setMonth(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-muted text-xs">/</span>
              <select 
                className="form-input" 
                style={{ height: 32, padding: '0 0.5rem', fontSize: '0.85rem', width: 'auto', border: 'none', background: 'transparent', fontWeight: 700 }}
                value={year} 
                onChange={e => setYear(Number(e.target.value))}
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <button
              onClick={() => navigate('/internal/settings/parameters')}
              className="btn btn-outline flex items-center gap-1.5"
              style={{ height: 36 }}
              title="Cấu hình tham số Thứ 7 cách tuần x2 công, Phụ cấp mặc định, Tỷ lệ thử việc..."
            >
              <Settings size={15} />
              <span>Tham Số Lương & Công</span>
            </button>

            <button
              onClick={handleTogglePeriodLock}
              className="btn btn-outline flex items-center gap-1.5"
              style={periodInfo.status === 'LOCKED' 
                ? { borderColor: 'var(--primary)', color: 'var(--primary)', height: 36 } 
                : { borderColor: 'var(--error)', color: 'var(--error)', height: 36 }}
            >
              {periodInfo.status === 'LOCKED' ? <Unlock size={15} /> : <Lock size={15} />}
              <span>{periodInfo.status === 'LOCKED' ? 'Mở Khóa Sổ' : 'Khóa Sổ'}</span>
            </button>

            <button 
              onClick={handleGenerate} 
              className="btn btn-primary flex items-center gap-1.5" 
              disabled={periodInfo.status === 'LOCKED' || calculating}
              style={{ height: 36 }}
            >
              <Calculator size={15} className={calculating ? 'animate-spin' : ''} />
              <span>{calculating ? 'Đang Tính...' : 'Tính Lại Bảng Lương'}</span>
            </button>

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
              onClick={handleExportExcel} 
              className="btn btn-outline flex items-center gap-1.5" 
              style={{ borderColor: 'var(--success)', color: 'var(--success)', height: 36 }}
            >
              <FileSpreadsheet size={15} />
              <span>Xuất Excel LLA</span>
            </button>
          </div>
        </div>

        {/* Banner giải thích lịch công chuẩn động của tháng & các ngày Thứ 7 đi làm cách tuần x2 công */}
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div className="flex items-center gap-2.5 flex-wrap" style={{ fontSize: '0.82rem', color: '#1E3A8A' }}>
            <Calendar size={17} color="#2563EB" />
            <span>
              <strong>Lịch công chuẩn Tháng {String(month).padStart(2, '0')}/{year}: {periodInfo.standardWorkingDays || 26} ngày công</strong>
              {' '}— Gồm <strong>{periodInfo.weekdayCount || 22}</strong> ngày thường (T2–T6 = 1.0 công) và{' '}
              <strong>{periodInfo.workingSaturdays?.length || 0}</strong> ngày Thứ 7 đi làm cách tuần (nhân hệ số <strong>x{periodInfo.satMultiplier || 2} công</strong> = {((periodInfo.workingSaturdays?.length || 0) * (periodInfo.satMultiplier || 2))} công):
            </span>
            {periodInfo.workingSaturdays?.map(sat => (
              <span key={sat} className="badge badge-info font-bold" style={{ fontSize: '0.74rem', backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                T7 đi làm: {sat.split('-').reverse().join('/')} (x{periodInfo.satMultiplier || 2} công)
              </span>
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>
            Mốc chu kỳ: Thứ 7 ngày <strong>{periodInfo.satAnchor ? periodInfo.satAnchor.split('-').reverse().join('/') : '07/11/2026'}</strong>
          </span>
        </div>
      </div>

      {/* Cảnh Báo Khóa chi trả do trễ nộp hồ sơ gốc cứng > 7 ngày */}
      {lockedCount > 0 && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: '#991B1B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <ShieldAlert size={20} color="#DC2626" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>CHẾ TÀI HỒ SƠ: Phát hiện {lockedCount} nhân sự bị TẠM KHÓA CHI TRẢ LƯƠNG</strong> do quá 7 ngày làm việc chưa nộp đủ hồ sơ gốc bản cứng.
            </div>
          </div>
          <span className="badge badge-danger font-bold">{lockedCount} nhân sự bị giữ lương</span>
        </div>
      )}

      {/* 2. Bốn Thẻ Tổng Quan Chỉ Số Tài Chính */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card glass p-4 flex-col gap-1" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Lương Cơ Bản (HĐ)</span>
            <Banknote size={16} color="var(--text-muted)" />
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.35rem', color: 'var(--text-main)' }}>
            {formatCurrency(totalBase)}
          </div>
          <span className="text-xs text-muted">{payrolls.length} nhân sự trong bảng lương</span>
        </div>

        <div className="card glass p-4 flex-col gap-1" style={{ borderRadius: '14px', borderColor: 'rgba(105, 108, 255, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Công Ty Thanh Toán</span>
            <Banknote size={16} color="var(--primary)" />
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>
            {formatCurrency(totalCompanyPayout)}
          </div>
          <span className="text-xs text-muted">Chia theo công chuẩn tháng: {periodInfo.standardWorkingDays || 26} ngày</span>
        </div>

        <div className="card glass p-4 flex-col gap-1" style={{ borderRadius: '14px', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Trừ (BH + Ứng + Phạt + CĐ)</span>
            <ShieldAlert size={16} color="var(--error)" />
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.35rem', color: 'var(--error)' }}>
            {formatCurrency(totalDeduction)}
          </div>
          <span className="text-xs text-muted">Khấu trừ BHXH, Ứng lương, Phạt muộn, Công đoàn</span>
        </div>

        <div className="card glass p-4 flex-col gap-1" style={{ borderRadius: '14px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Thực Nhận (Cột Q)</span>
            <FileSignature size={16} color="var(--success)" />
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.35rem', color: 'var(--success)' }}>
            {formatCurrency(totalNet)}
          </div>
          <span className="text-xs text-muted">Số tiền thực chuyển khoản cho nhân viên</span>
        </div>
      </div>

      {/* 3. BẢNG LƯƠNG 16 CỘT CHUẨN EXCEL CÔNG TY TNHH LLA */}
      <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        {/* Header Giống Hệt Bảng Excel Công Ty TNHH LLA */}
        <div style={{
          background: '#FFFFFF',
          borderBottom: '2px solid #1E293B',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.05rem',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
            }}>
              LLA
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0284C7', letterSpacing: '0.5px' }}>
                LLA <span style={{ fontWeight: 500, fontSize: '0.75rem', color: '#64748B' }}>Empowering Innovation</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                Biểu mẫu Bảng lương 16 cột chuẩn Kế toán Công ty TNHH LLA (Bấm vào nút <strong>Sửa</strong> ở từng dòng để nhập CTP/Hoa hồng, Ứng lương, Phạt muộn)
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, minWidth: '260px' }}>
            <div style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', textTransform: 'uppercase' }}>
              BẢNG LƯƠNG THÁNG {String(month).padStart(2, '0')}/{year}
            </div>
            <div style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 700, fontSize: '1.05rem', color: '#1E293B' }}>
              Ngày công : {periodInfo.standardWorkingDays || 26} ngày
            </div>
          </div>

          {/* Thanh Tìm Kiếm & Lọc Phòng Ban */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div style={{ position: 'relative', width: '230px' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm họ tên, mã NV..." 
                className="form-input"
                style={{ paddingLeft: '2.2rem', height: 34, fontSize: '0.82rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-input" 
              style={{ width: 'auto', height: 34, padding: '0 0.65rem', fontSize: '0.82rem' }}
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="ALL">Tất cả phòng ban ({payrolls.length})</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bảng Excel 16 cột cuộn ngang mượt mà */}
        <div className="table-container" style={{ margin: 0, borderRadius: 0, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1680px', fontFamily: '"Times New Roman", Times, sans-serif', fontSize: '0.88rem' }}>
            <thead>
              {/* Dòng hiển thị số công chuẩn phía trên cột Tổng lương (Cột F) giống hệt file Excel LLA */}
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #94A3B8' }}>
                <th colSpan={5} style={{ padding: '4px 8px', borderRight: '1px solid #CBD5E1' }}></th>
                <th style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', padding: '4px 8px', borderRight: '1px solid #CBD5E1', backgroundColor: '#FEF9C3' }}>
                  {periodInfo.standardWorkingDays || 26}
                </th>
                <th colSpan={11} style={{ padding: '4px 8px' }}></th>
              </tr>
              <tr style={{ backgroundColor: '#F1F5F9', color: '#0F172A', borderBottom: '2px solid #334155' }}>
                <th style={{ width: '48px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>STT</th>
                <th style={{ minWidth: '175px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 8px', fontWeight: 700 }}>Họ Và Tên</th>
                <th style={{ width: '105px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 8px', fontWeight: 700 }}>Lương cơ bản</th>
                <th style={{ width: '105px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 8px', fontWeight: 700 }}>Lương T{month}</th>
                <th style={{ width: '88px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Ngày công thực tế</th>
                <th style={{ width: '110px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 8px', fontWeight: 700, backgroundColor: '#FEFCE8' }}>Tổng lương</th>
                <th style={{ width: '120px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>CTP + Hoa hồng + trách nhiệm + thưởng</th>
                <th style={{ width: '125px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Điện thoại + Xăng xe + Phụ cấp ăn trưa</th>
                <th style={{ width: '115px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Lương làm thêm giờ + thưởng</th>
                <th style={{ width: '105px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Lương đóng BHXH</th>
                <th style={{ width: '95px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Trừ tiền BH</th>
                <th style={{ width: '115px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 8px', fontWeight: 700, backgroundColor: '#F0F9FF' }}>Công ty thanh toán</th>
                <th style={{ width: '95px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Ứng Lương</th>
                <th style={{ width: '110px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Phạt đi muộn + phạt khác</th>
                <th style={{ width: '95px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 6px', fontWeight: 700 }}>Quỹ Công đoàn</th>
                <th style={{ width: '120px', textAlign: 'center', borderRight: '1px solid #94A3B8', padding: '10px 8px', fontWeight: 800, backgroundColor: '#ECFDF5' }}>Thực nhận</th>
                <th style={{ width: '130px', textAlign: 'center', padding: '10px 6px', fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="17" className="text-center p-12 text-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu Bảng lương Công ty TNHH LLA...
                  </td>
                </tr>
              ) : currentPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="17" className="text-center p-12 text-muted">
                    {payrolls.length === 0 
                      ? 'Chưa có dữ liệu lương tháng này. Hãy bấm "Tính Lại Bảng Lương" phía trên!' 
                      : 'Không tìm thấy nhân sự phù hợp với từ khóa.'}
                  </td>
                </tr>
              ) : (
                currentPayrolls.map((pr, idx) => {
                  const lla = getLla(pr);
                  const stt = startIndex + idx + 1;
                  const isProbation = lla.probationPercent < 100;
                  return (
                    <tr 
                      key={pr.id || idx} 
                      style={{ 
                        borderBottom: '1px solid #CBD5E1',
                        backgroundColor: idx === 0 && pr.employee?.fullName?.toLowerCase().includes('lê hữu trúc') ? '#FFFBEB' : '#FFFFFF'
                      }}
                    >
                      {/* Cột A: STT */}
                      <td style={{ textAlign: 'center', borderRight: '1px solid #CBD5E1', padding: '10px 6px', fontWeight: 600 }}>
                        {stt}
                      </td>

                      {/* Cột B: Họ Và Tên */}
                      <td style={{ borderRight: '1px solid #CBD5E1', padding: '10px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                          {pr.employee?.fullName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{pr.employee?.code}</span>
                          {isProbation && (
                            <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              Thử việc {lla.probationPercent}%
                            </span>
                          )}
                          {pr.isPaymentLocked && (
                            <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Giữ lương
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột C: Lương cơ bản */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', fontWeight: 600 }}>
                        {formatLlaNumber(lla.baseSalary)}
                      </td>

                      {/* Cột D: Lương T{month} */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', fontWeight: 600 }} title={isProbation ? `Hưởng ${lla.probationPercent}% lương cơ bản trong thời gian thử việc` : '100% lương cơ bản'}>
                        {formatLlaNumber(lla.appliedMonthSalary)}
                      </td>

                      {/* Cột E: Ngày công thực tế */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', fontWeight: 700, color: '#0F172A' }}>
                        {lla.actualWorkingDays}
                      </td>

                      {/* Cột F: Tổng lương = Lương T{month} / Công chuẩn * Ngày công thực tế */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', fontWeight: 700, backgroundColor: '#FEFCE8' }}>
                        {formatLlaNumber(lla.salaryByDays)}
                      </td>

                      {/* Cột G: CTP + Hoa hồng + trách nhiệm + thưởng */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px' }}>
                        {formatLlaNumber(lla.ctpAndCommission, true)}
                      </td>

                      {/* Cột H-I: Điện thoại + Xăng xe + Phụ cấp ăn trưa */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px' }}>
                        {formatLlaNumber(lla.fixedAllowance, true)}
                      </td>

                      {/* Cột J: Lương làm thêm giờ + thưởng */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px' }}>
                        {formatLlaNumber(lla.otAndBonus, true)}
                      </td>

                      {/* Cột K: Lương đóng BHXH */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', color: '#475569' }}>
                        {formatLlaNumber(lla.insuranceBaseSalary, true)}
                      </td>

                      {/* Cột L: Trừ tiền BH */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', color: '#DC2626' }}>
                        {formatLlaNumber(lla.insuranceDeduction, true)}
                      </td>

                      {/* Cột M: Công ty thanh toán */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', fontWeight: 700, backgroundColor: '#F0F9FF', color: '#0369A1' }}>
                        {formatLlaNumber(lla.companyPayout)}
                      </td>

                      {/* Cột N: Ứng Lương */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', color: '#DC2626' }}>
                        {formatLlaNumber(lla.advanceAmount, true)}
                      </td>

                      {/* Cột O: Phạt đi muộn + phạt khác */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', color: '#DC2626' }}>
                        {formatLlaNumber(lla.latePenaltyAmount, true)}
                      </td>

                      {/* Cột P: Quỹ Công đoàn */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', color: '#DC2626' }}>
                        {formatLlaNumber(lla.unionFee, true)}
                      </td>

                      {/* Cột Q: Thực nhận */}
                      <td style={{ textAlign: 'right', borderRight: '1px solid #CBD5E1', padding: '10px 8px', fontWeight: 800, fontSize: '0.95rem', backgroundColor: '#ECFDF5', color: '#047857' }}>
                        {formatLlaNumber(lla.netSalary)}
                      </td>

                      {/* Cột Thao tác */}
                      <td style={{ textAlign: 'center', padding: '6px', fontFamily: 'Inter, sans-serif' }}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(pr)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#0284C7', borderColor: '#BAE6FD' }}
                            title="Điều chỉnh Công, CTP/Hoa hồng, Phụ cấp, Ứng lương, Phạt đi muộn"
                          >
                            <Edit3 size={12} /> Sửa
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSelectedPayslip(pr)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--primary)', borderColor: 'rgba(105, 108, 255, 0.3)' }}
                            title="Xem Phiếu lương chi tiết & In"
                          >
                            <Eye size={12} /> Phiếu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Dòng Tổng Cộng Cuối Bảng */}
            {currentPayrolls.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#FEF9C3', borderTop: '2px solid #334155', fontWeight: 800, color: '#0F172A' }}>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    TỔNG CỘNG ({filteredPayrolls.length} NHÂN SỰ)
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).baseSalary || 0), 0))}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).appliedMonthSalary || 0), 0))}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {filteredPayrolls.reduce((s, p) => s + Number(getLla(p).actualWorkingDays || 0), 0).toFixed(1)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).salaryByDays || 0), 0))}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).ctpAndCommission || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).fixedAllowance || 0), 0))}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).otAndBonus || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).insuranceBaseSalary || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8', color: '#DC2626' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).insuranceDeduction || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8', color: '#0369A1' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).companyPayout || 0), 0))}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8', color: '#DC2626' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).advanceAmount || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8', color: '#DC2626' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).latePenaltyAmount || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8', color: '#DC2626' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).unionFee || 0), 0), true)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', borderRight: '1px solid #94A3B8', backgroundColor: '#FDE047', color: '#047857', fontSize: '1rem' }}>
                    {formatLlaNumber(filteredPayrolls.reduce((s, p) => s + Number(getLla(p).netSalary || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 4. Thanh Điều Khiển Phân Trang */}
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderTop: '1px solid var(--border)', background: '#F8FAFC' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Đang hiển thị <strong>{totalRecords === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> / <strong>{totalRecords}</strong> nhân sự
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted">| Hiển thị:</span>
              <select 
                className="form-input" 
                style={{ width: 'auto', height: 30, padding: '0 0.5rem', fontSize: '0.8rem' }}
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 / trang</option>
                <option value={15}>15 / trang</option>
                <option value={30}>30 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((num, i) => (
              num === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-muted text-xs">...</span>
              ) : (
                <button
                  key={`page-${num}`}
                  onClick={() => setCurrentPage(num)}
                  className={`btn ${currentPage === num ? 'btn-primary' : 'btn-outline'}`}
                  style={{ minWidth: 32, height: 32, padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  {num}
                </button>
              )
            ))}

            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL CHỈNH SỬA TRỰC TIẾP DÒNG BẢNG LƯƠNG LLA */}
      {editingPayslip && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <form onSubmit={handleSaveLlaEdit} className="card animate-fade-in" style={{
            width: '100%',
            maxWidth: '720px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.5rem',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          }}>
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <span className="badge badge-info mb-1">ĐIỀU CHỈNH BẢNG LƯƠNG LLA — THÁNG {String(month).padStart(2, '0')}/{year}</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  {editingPayslip.employee?.fullName} ({editingPayslip.employee?.code})
                </h3>
              </div>
              <button type="button" onClick={() => setEditingPayslip(null)} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
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
                <label className="form-label text-xs font-bold">Lương T{month} áp dụng (Cột D)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.appliedMonthSalary}
                  onChange={e => setEditForm({ ...editForm, appliedMonthSalary: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="form-label text-xs font-bold">Ngày công thực tế / {periodInfo.standardWorkingDays || 26} (Cột E)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={editForm.actualWorkingDays}
                  onChange={e => setEditForm({ ...editForm, actualWorkingDays: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="form-label text-xs font-bold">CTP + Hoa hồng + Thưởng (Cột G)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.ctpAndCommission}
                  onChange={e => setEditForm({ ...editForm, ctpAndCommission: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="form-label text-xs font-bold">Điện thoại + Xăng + Ăn trưa (Cột H-I)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.fixedAllowance}
                  onChange={e => setEditForm({ ...editForm, fixedAllowance: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="form-label text-xs font-bold">Làm thêm giờ + Thưởng (Cột J)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.otAndBonus}
                  onChange={e => setEditForm({ ...editForm, otAndBonus: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="form-label text-xs font-bold">Lương đóng BHXH (Cột K)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.insuranceBaseSalary}
                  onChange={e => {
                    const insBase = Number(e.target.value);
                    setEditForm({
                      ...editForm,
                      insuranceBaseSalary: insBase,
                      insuranceDeduction: Math.round(insBase * 0.105)
                    });
                  }}
                />
              </div>
              <div>
                <label className="form-label text-xs font-bold">Trừ tiền BHXH 10.5% (Cột L)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.insuranceDeduction}
                  onChange={e => setEditForm({ ...editForm, insuranceDeduction: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="form-label text-xs font-bold">Ứng Lương (Cột N)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.advanceAmount}
                  onChange={e => setEditForm({ ...editForm, advanceAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="form-label text-xs font-bold">Phạt đi muộn + phạt khác (Cột O)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.latePenaltyAmount}
                  onChange={e => setEditForm({ ...editForm, latePenaltyAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="form-label text-xs font-bold">Quỹ Công đoàn (Cột P)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.unionFee}
                  onChange={e => setEditForm({ ...editForm, unionFee: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Khung Tổng Hợp Tự Động */}
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <div className="text-xs text-muted">Tổng lương theo ngày công (Cột F):</div>
                <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{formatCurrency(livePreviewEdit.salaryByDays)}</strong>
              </div>
              <div>
                <div className="text-xs text-muted">Công ty thanh toán (Cột M):</div>
                <strong style={{ fontSize: '1rem', color: '#0369A1' }}>{formatCurrency(livePreviewEdit.companyPayout)}</strong>
              </div>
              <div>
                <div className="text-xs text-muted">Thực nhận (Cột Q):</div>
                <strong style={{ fontSize: '1.25rem', color: '#047857' }}>{formatCurrency(livePreviewEdit.netSalary)}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingPayslip(null)} className="btn btn-outline">
                Hủy
              </button>
              <button type="submit" disabled={savingEdit} className="btn btn-primary">
                {savingEdit ? 'Đang lưu...' : 'Lưu Dòng Bảng Lương'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* 6. MODAL CHI TIẾT PHIẾU LƯƠNG NHÂN VIÊN */}
      {selectedPayslip && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          {(() => {
            const lla = getLla(selectedPayslip);
            return (
              <div className="card glass animate-fade-in" style={{
                width: '100%',
                maxWidth: '680px',
                backgroundColor: '#1e1e2d',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                borderRadius: '16px',
                padding: '2rem',
                maxHeight: '90vh',
                overflowY: 'auto',
                color: '#fff'
              }}>
                <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div>
                    <span className="badge badge-info mb-1" style={{ fontSize: '0.75rem' }}>CÔNG TY TNHH LLA — PHIẾU LƯƠNG ĐIỆN TỬ</span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                      Kỳ Lương Tháng {String(month).padStart(2, '0')}/{year} (Công chuẩn: {periodInfo.standardWorkingDays || 26} ngày)
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="btn btn-outline flex items-center gap-1.5"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#fff' }}
                    >
                      <Printer size={16} /> In Phiếu
                    </button>
                    <button 
                      onClick={() => setSelectedPayslip(null)}
                      className="btn btn-outline" 
                      style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
                    >
                      <X size={20} color="#94A3B8" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl mb-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted block text-xs">Họ và tên nhân sự:</span>
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{selectedPayslip.employee?.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Mã nhân viên:</span>
                      <strong style={{ color: '#38BDF8' }}>{selectedPayslip.employee?.code}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Lương cơ bản (Cột C) / Lương T{month} (Cột D):</span>
                      <strong>{formatCurrency(lla.baseSalary)} / {formatCurrency(lla.appliedMonthSalary)}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Ngày công thực tế / Công chuẩn tháng:</span>
                      <span className="badge badge-warning font-bold">
                        {lla.actualWorkingDays} / {periodInfo.standardWorkingDays || 26} công
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-col gap-4">
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: '#38BDF8' }}>
                      I. CHI TIẾT THU NHẬP & CÔNG TY THANH TOÁN (CỘT F → M)
                    </h4>
                    <div className="flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Tổng lương theo ngày công (Cột F):</span>
                        <strong className="money-text">{formatCurrency(lla.salaryByDays)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>CTP + Hoa hồng + trách nhiệm + thưởng (Cột G):</span>
                        <strong className="money-text">{formatCurrency(lla.ctpAndCommission)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Điện thoại + Xăng xe + Phụ cấp ăn trưa (Cột H-I):</span>
                        <strong className="money-text">{formatCurrency(lla.fixedAllowance)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Lương làm thêm giờ + thưởng (Cột J):</span>
                        <strong className="money-text">{formatCurrency(lla.otAndBonus)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Trừ tiền BHXH bắt buộc (Cột L):</span>
                        <strong className="money-text" style={{ color: '#F87171' }}>-{formatCurrency(lla.insuranceDeduction)}</strong>
                      </div>
                      <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px dashed rgba(56, 189, 248, 0.3)' }}>
                        <strong>Công ty thanh toán (Cột M):</strong>
                        <strong className="money-text" style={{ color: '#38BDF8', fontSize: '1.05rem' }}>
                          {formatCurrency(lla.companyPayout)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: '#F87171' }}>
                      II. CÁC KHOẢN TRỪ SAU THANH TOÁN (CỘT N, O, P)
                    </h4>
                    <div className="flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Ứng Lương (Cột N):</span>
                        <strong className="money-text" style={{ color: '#F87171' }}>-{formatCurrency(lla.advanceAmount)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Phạt đi muộn + phạt khác (Cột O):</span>
                        <strong className="money-text" style={{ color: '#F87171' }}>-{formatCurrency(lla.latePenaltyAmount)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#CBD5E1' }}>Quỹ Công đoàn (Cột P):</span>
                        <strong className="money-text" style={{ color: '#F87171' }}>-{formatCurrency(lla.unionFee)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider block" style={{ color: '#34D399' }}>
                        III. THỰC NHẬN CUỐI CÙNG (CỘT Q)
                      </span>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>Công ty thanh toán (M) - Ứng lương (N) - Phạt (O) - Công đoàn (P)</span>
                    </div>
                    <div className="money-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34D399' }}>
                      {formatCurrency(lla.netSalary)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
};
