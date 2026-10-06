import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Download, Calculator, Lock, Unlock, Banknote, ShieldAlert, 
  FileSignature, Search, Filter, Eye, X, ArrowLeft, Printer, 
  CheckCircle, User, Briefcase, Calendar, RefreshCw, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, Users
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const PayrollMgmt = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Đọc month, year từ URL params nếu có
  const initialMonth = searchParams.get('month') ? Number(searchParams.get('month')) : (new Date().getMonth() + 1);
  const initialYear = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear();

  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [periodInfo, setPeriodInfo] = useState({ status: 'DRAFT', standardWorkingDays: 22 });
  
  // Bộ lọc tìm kiếm & Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal chi tiết phiếu lương nhân viên
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollRes, periodRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/payroll?month=${month}&year=${year}`),
        axios.get(`http://localhost:5000/api/payroll/period/info?month=${month}&year=${year}`)
      ]);
      setPayrolls(payrollRes.data || []);
      setPeriodInfo(periodRes.data || { status: 'DRAFT', standardWorkingDays: 22 });
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
    fetchData();
  }, [month, year]);

  // Reset trang về 1 khi người dùng đổi từ khóa hoặc phòng ban
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
      fetchData();
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
        fetchData();
      } catch (err) {
        toast.error('Lỗi khi đổi trạng thái khóa kỳ lương');
      }
    }
  };

  const handleExportExcel = () => {
    if (payrolls.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    const headers = [
      "Mã NV", "Họ và tên", "Phòng ban", "Chức vụ", 
      "Lương cơ bản (VND)", "Số ngày công thực tế", "Lương Gross (VND)", 
      "BHXH/YT/TN (10.5%)", "Thuế TNCN (VND)", "Thực lãnh (VND)", "Trạng thái"
    ];

    const rows = payrolls.map(pr => {
      const ins = Number(pr.insuranceDeduction) || 0;
      const tax = Number(pr.taxDeduction) || 0;
      return [
        `"${pr.employee?.code || ''}"`,
        `"${pr.employee?.fullName || ''}"`,
        `"${pr.employee?.department?.name || ''}"`,
        `"${pr.employee?.position?.title || ''}"`,
        pr.baseSalary || 0,
        pr.actualWorkingDays || 0,
        pr.grossSalary || 0,
        ins,
        tax,
        pr.netSalary || 0,
        periodInfo.status === 'LOCKED' ? '"Đã khóa sổ"' : '"Bản nháp"'
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Luong_Thang_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // Tính tổng chỉ số tài chính
  const totalBase = useMemo(() => payrolls.reduce((sum, p) => sum + Number(p.baseSalary || 0), 0), [payrolls]);
  const totalGross = useMemo(() => payrolls.reduce((sum, p) => sum + Number(p.grossSalary || 0), 0), [payrolls]);
  const totalNet = useMemo(() => payrolls.reduce((sum, p) => sum + Number(p.netSalary || 0), 0), [payrolls]);
  const totalInsurance = useMemo(() => payrolls.reduce((sum, p) => sum + Number(p.insuranceDeduction || 0), 0), [payrolls]);
  const totalTax = useMemo(() => payrolls.reduce((sum, p) => sum + Number(p.taxDeduction || 0), 0), [payrolls]);
  const totalDeduction = totalInsurance + totalTax;

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

  // Tạo mảng số trang hiển thị
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

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout Độc Lập, Rộng Rãi, Không Bị Chèn Ép */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Cụm Tiêu Đề Bên Trái */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/internal/payroll/periods')}
              className="btn btn-outline" 
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)' }}
              title="Quay lại danh sách kỳ lương"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
                  Bảng Lương Tháng {month}/{year}
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
                Hệ thống tự động: Tính Gross theo ngày công thực tế, trừ 10.5% BHXH và Thuế TNCN lũy tiến từng phần
              </p>
            </div>
          </div>

          {/* Cụm Thao Tác & Chọn Kỳ Lương Bên Phải */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Bộ Chọn Tháng & Năm Liền Kề Gọn Gàng */}
            <div className="flex items-center bg-black/20 p-1 rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <select 
                className="form-input" 
                style={{ height: 32, padding: '0 0.5rem', fontSize: '0.85rem', width: 'auto', border: 'none', background: 'transparent' }}
                value={month} 
                onChange={e => setMonth(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <span className="text-muted text-xs">/</span>
              <select 
                className="form-input" 
                style={{ height: 32, padding: '0 0.5rem', fontSize: '0.85rem', width: 'auto', border: 'none', background: 'transparent' }}
                value={year} 
                onChange={e => setYear(Number(e.target.value))}
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Nút Khóa Sổ / Mở Khóa */}
            <button
              onClick={handleTogglePeriodLock}
              className="btn btn-outline flex items-center gap-1.5"
              style={periodInfo.status === 'LOCKED' 
                ? { borderColor: 'var(--primary)', color: 'var(--primary)', height: 36 } 
                : { borderColor: 'var(--error)', color: 'var(--error)', height: 36 }}
              title={periodInfo.status === 'LOCKED' ? "Mở khóa sổ" : "Khóa sổ kỳ lương"}
            >
              {periodInfo.status === 'LOCKED' ? <Unlock size={15} /> : <Lock size={15} />}
              <span>{periodInfo.status === 'LOCKED' ? 'Mở Khóa Sổ' : 'Khóa Sổ'}</span>
            </button>

            {/* Nút Chạy Bảng Lương */}
            <button 
              onClick={handleGenerate} 
              className="btn btn-primary flex items-center gap-1.5" 
              disabled={periodInfo.status === 'LOCKED' || calculating}
              style={{ height: 36 }}
              title={periodInfo.status === 'LOCKED' ? 'Kỳ lương đã khóa' : 'Tính toán lại bảng lương toàn công ty'}
            >
              <Calculator size={15} className={calculating ? 'animate-spin' : ''} />
              <span>{calculating ? 'Đang Tính...' : 'Chạy Bảng Lương'}</span>
            </button>

            {/* Nút Xuất Excel */}
            <button 
              onClick={handleExportExcel} 
              className="btn btn-outline flex items-center gap-1.5" 
              style={{ borderColor: 'var(--success)', color: 'var(--success)', height: 36 }}
            >
              <FileSpreadsheet size={15} />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bốn Thẻ Tổng Quan Chỉ Số Tài Chính (Metrics Grid) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: Base Salary */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Lương Hợp Đồng</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <Banknote size={16} color="var(--text-muted)" />
            </div>
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.45rem', color: 'var(--text-main)' }}>
            {formatCurrency(totalBase)}
          </div>
          <span className="text-xs text-muted">{payrolls.length} nhân sự tham gia tính lương</span>
        </div>

        {/* Card 2: Gross */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(105, 108, 255, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Lương Gross</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(105, 108, 255, 0.12)' }}>
              <Banknote size={16} color="var(--primary)" />
            </div>
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.45rem', color: 'var(--primary)' }}>
            {formatCurrency(totalGross)}
          </div>
          <span className="text-xs text-muted">Tính theo ngày công thực tế / chuẩn 22 ngày</span>
        </div>

        {/* Card 3: Deductions */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Khấu Trừ (BH & Thuế)</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
              <ShieldAlert size={16} color="var(--error)" />
            </div>
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.45rem', color: 'var(--error)' }}>
            {formatCurrency(totalDeduction)}
          </div>
          <span className="text-xs text-muted">10.5% BHXH + Thuế TNCN lũy tiến</span>
        </div>

        {/* Card 4: Net Salary */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Thực Lãnh (NET)</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
              <FileSignature size={16} color="var(--success)" />
            </div>
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.45rem', color: 'var(--success)' }}>
            {formatCurrency(totalNet)}
          </div>
          <span className="text-xs text-muted">Tổng quỹ chi trả qua tài khoản ngân hàng</span>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Chi Tiết Kèm Bộ Lọc & Phân Trang Đầy Đủ */}
      <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        {/* Thanh Công Cụ Tìm Kiếm & Lọc */}
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3" style={{ flex: 1, minWidth: '280px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm mã NV, họ tên nhân viên..." 
                className="form-input"
                style={{ paddingLeft: '2.4rem', height: 38 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Phòng ban:</span>
              <select 
                className="form-input" 
                style={{ width: 'auto', height: 38, padding: '0 0.75rem', fontSize: '0.85rem' }}
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                <option value="ALL">Tất cả phòng ban ({payrolls.length})</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="badge badge-info" style={{ fontWeight: 600, padding: '0.4rem 0.8rem' }}>
              Tìm thấy {totalRecords} nhân sự
            </div>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ width: '90px' }}>MÃ NV</th>
                <th>NHÂN VIÊN</th>
                <th className="text-right">LƯƠNG HỢP ĐỒNG</th>
                <th className="text-right">CÔNG THỰC TẾ</th>
                <th className="text-right">GROSS</th>
                <th className="text-right" style={{ color: 'var(--error)' }}>BHXH (10.5%)</th>
                <th className="text-right" style={{ color: 'var(--error)' }}>THUẾ TNCN</th>
                <th className="text-right" style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)' }}>THỰC LÃNH (NET)</th>
                <th className="text-center" style={{ width: '100px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center p-12 text-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu bảng lương...
                  </td>
                </tr>
              ) : currentPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-12 text-muted">
                    {payrolls.length === 0 
                      ? 'Chưa tính bảng lương cho tháng này. Hãy bấm "Chạy Bảng Lương" phía trên!' 
                      : 'Không tìm thấy nhân viên phù hợp với bộ lọc tìm kiếm.'}
                  </td>
                </tr>
              ) : (
                currentPayrolls.map((pr, idx) => {
                  const ins = Number(pr.insuranceDeduction) || 0;
                  const tax = Number(pr.taxDeduction) || 0;
                  return (
                    <tr key={pr.id || idx}>
                      <td>
                        <span className="badge badge-outline font-bold" style={{ color: 'var(--primary)', borderColor: 'rgba(105, 108, 255, 0.3)' }}>
                          {pr.employee?.code || `NV${String(idx+1).padStart(3, '0')}`}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.85rem', background: 'var(--primary)', color: 'white', fontWeight: 700 }}>
                            {pr.employee?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {pr.employee?.fullName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {pr.employee?.department?.name || 'Chưa gán PB'} • {pr.employee?.position?.title || 'Nhân viên'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="text-right money-text font-medium">{formatCurrency(pr.baseSalary)}</td>

                      <td className="text-right">
                        <span className="badge badge-warning font-bold" style={{ fontSize: '0.75rem' }}>
                          {Number(pr.actualWorkingDays || 22)} / {periodInfo.standardWorkingDays || 22} công
                        </span>
                      </td>

                      <td className="text-right money-text font-semibold">{formatCurrency(pr.grossSalary)}</td>

                      <td className="text-right money-text" style={{ color: 'var(--error)' }}>
                        -{formatCurrency(ins)}
                      </td>

                      <td className="text-right money-text" style={{ color: 'var(--error)' }}>
                        -{formatCurrency(tax)}
                      </td>

                      <td className="text-right money-text" style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                        {formatCurrency(pr.netSalary)}
                      </td>

                      <td className="text-center">
                        <button 
                          onClick={() => setSelectedPayslip(pr)}
                          className="btn btn-outline flex items-center gap-1 mx-auto"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--primary)', borderColor: 'rgba(105, 108, 255, 0.3)' }}
                          title="Xem chi tiết phiếu lương và in"
                        >
                          <Eye size={13} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Thanh Điều Khiển Phân Trang Toàn Diện (Full Pagination Controls) */}
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.1)' }}>
          {/* Thông tin số lượng hiển thị & Chọn kích thước trang */}
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
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>
          </div>

          {/* Các nút bấm chuyển trang */}
          <div className="flex items-center gap-1">
            {/* Trang đầu */}
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Trang trước */}
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Các số trang */}
            {getPageNumbers().map((num, i) => (
              num === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-muted text-xs">...</span>
              ) : (
                <button
                  key={`page-${num}`}
                  onClick={() => setCurrentPage(num)}
                  className={`btn ${currentPage === num ? 'btn-primary' : 'btn-outline'}`}
                  style={{ 
                    minWidth: 32, 
                    height: 32, 
                    padding: '0 0.5rem', 
                    fontSize: '0.8rem', 
                    fontWeight: currentPage === num ? 700 : 500,
                    borderRadius: '6px'
                  }}
                >
                  {num}
                </button>
              )
            ))}

            {/* Trang sau */}
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
              title="Trang tiếp theo"
            >
              <ChevronRight size={16} />
            </button>

            {/* Trang cuối */}
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL CHI TIẾT PHIẾU LƯƠNG NHÂN VIÊN (React Portal) */}
      {selectedPayslip && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass animate-fade-in" style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span className="badge badge-info mb-1" style={{ fontSize: '0.75rem' }}>PHIẾU LƯƠNG ĐIỆN TỬ</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                  Kỳ Lương Tháng {month}/{year}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="btn btn-outline flex items-center gap-1.5"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <Printer size={16} /> In Phiếu
                </button>
                <button 
                  onClick={() => setSelectedPayslip(null)}
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
                >
                  <X size={20} color="var(--text-muted)" />
                </button>
              </div>
            </div>

            {/* Thông tin nhân viên */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted block text-xs">Họ và tên nhân sự:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{selectedPayslip.employee?.fullName}</strong>
                </div>
                <div>
                  <span className="text-muted block text-xs">Mã nhân viên:</span>
                  <strong style={{ color: 'var(--primary)' }}>{selectedPayslip.employee?.code}</strong>
                </div>
                <div>
                  <span className="text-muted block text-xs">Phòng ban:</span>
                  <span>{selectedPayslip.employee?.department?.name || 'Chưa gán phòng ban'}</span>
                </div>
                <div>
                  <span className="text-muted block text-xs">Chức danh / Vị trí:</span>
                  <span>{selectedPayslip.employee?.position?.title || 'Nhân viên'}</span>
                </div>
              </div>
            </div>

            {/* Bảng thành phần thu nhập & Khấu trừ */}
            <div className="flex-col gap-4">
              {/* Phần 1: Thu nhập */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.05)', border: '1px solid rgba(105, 108, 255, 0.15)' }}>
                <h4 className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: 'var(--primary)' }}>
                  I. THU NHẬP THEO CÔNG (EARNINGS)
                </h4>
                <div className="flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Lương cơ bản theo hợp đồng:</span>
                    <strong className="money-text">{formatCurrency(selectedPayslip.baseSalary)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Số ngày công thực tế / Chuẩn:</span>
                    <span className="badge badge-warning font-bold">
                      {Number(selectedPayslip.actualWorkingDays || 22)} / {periodInfo.standardWorkingDays || 22} ngày
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px dashed rgba(105, 108, 255, 0.2)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>Tổng Thu Nhập Gross:</strong>
                    <strong className="money-text" style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                      {formatCurrency(selectedPayslip.grossSalary)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Phần 2: Các khoản khấu trừ */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <h4 className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: 'var(--error)' }}>
                  II. CÁC KHOẢN KHẤU TRỪ THEO LUẬT (DEDUCTIONS)
                </h4>
                <div className="flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Bảo hiểm Xã hội, BHYT, BHTN (10.5% Gross):</span>
                    <strong className="money-text" style={{ color: 'var(--error)' }}>
                      -{formatCurrency(selectedPayslip.insuranceDeduction)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Thuế thu nhập cá nhân (Biểu lũy tiến TNCN):</span>
                    <strong className="money-text" style={{ color: 'var(--error)' }}>
                      -{formatCurrency(selectedPayslip.taxDeduction)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>Tổng Các Khoản Khấu Trừ:</strong>
                    <strong className="money-text" style={{ color: 'var(--error)', fontSize: '1rem' }}>
                      -{formatCurrency((Number(selectedPayslip.insuranceDeduction) || 0) + (Number(selectedPayslip.taxDeduction) || 0))}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Phần 3: Thực lãnh (NET) */}
              <div className="p-5 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block" style={{ color: 'var(--success)' }}>
                    III. LƯƠNG THỰC LÃNH (NET SALARY)
                  </span>
                  <span className="text-xs text-muted">Số tiền doanh nghiệp chi trả vào tài khoản ngân hàng</span>
                </div>
                <div className="money-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatCurrency(selectedPayslip.netSalary)}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button 
                onClick={() => setSelectedPayslip(null)} 
                className="btn btn-outline"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
