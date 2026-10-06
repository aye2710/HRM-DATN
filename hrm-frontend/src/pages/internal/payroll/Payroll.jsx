import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Download, Calculator, Lock, Unlock, Banknote, ShieldAlert, 
  FileSignature, Search, Filter, Eye, X, ArrowLeft, Printer, 
  CheckCircle, User, Briefcase, Calendar, RefreshCw
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
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [periodInfo, setPeriodInfo] = useState({ status: 'DRAFT', standardWorkingDays: 22 });
  
  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal chi tiết phiếu lương nhân viên
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollRes, periodRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/payroll?month=${month}&year=${year}`),
        axios.get(`http://localhost:5000/api/payroll/period/info?month=${month}&year=${year}`)
      ]);
      setPayrolls(payrollRes.data);
      setPeriodInfo(periodRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải bảng lương');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cập nhật URL params khi thay đổi month hoặc year
    setSearchParams({ month: String(month), year: String(year) });
    fetchData();
  }, [month, year]);

  const handleGenerate = async () => {
    if (periodInfo.status === 'LOCKED') {
      return toast.error(`Kỳ lương ${month}/${year} đã bị KHÓA SỔ. Cần mở khóa trước khi chạy lại!`);
    }
    try {
      const res = await axios.post('http://localhost:5000/api/payroll/generate', { month, year });
      toast.success(res.data.message || `Đã tính toán xong bảng lương tháng ${month}/${year}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tính lương');
    }
  };

  const handleTogglePeriodLock = async () => {
    const isLocked = periodInfo.status === 'LOCKED';
    const actionText = isLocked ? 'MỞ KHÓA' : 'KHÓA SỔ';
    const confirmText = isLocked
      ? `Bạn có chắc muốn MỞ KHÓA kỳ lương tháng ${month}/${year}? (Cho phép nhân sự điều chỉnh công và tính lại lương)`
      : `Bạn có chắc muốn KHÓA SỔ kỳ lương tháng ${month}/${year}? (Sau khi khóa, dữ liệu công và lương sẽ chuyển sang Read-Only để phục vụ chi trả)`;

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

  // Tính tổng
  const totalBase = payrolls.reduce((sum, p) => sum + Number(p.baseSalary || 0), 0);
  const totalGross = payrolls.reduce((sum, p) => sum + Number(p.grossSalary || 0), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
  const totalInsurance = payrolls.reduce((sum, p) => sum + Number(p.insuranceDeduction || 0), 0);
  const totalTax = payrolls.reduce((sum, p) => sum + Number(p.taxDeduction || 0), 0);
  const totalDeduction = totalInsurance + totalTax;

  // Lấy danh sách phòng ban duy nhất để lọc
  const departments = Array.from(new Set(payrolls.map(p => p.employee?.department?.name).filter(Boolean)));

  // Lọc theo search và phòng ban
  const filteredPayrolls = payrolls.filter(pr => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (pr.employee?.fullName || '').toLowerCase().includes(q) ||
                        (pr.employee?.code || '').toLowerCase().includes(q) ||
                        (pr.employee?.department?.name || '').toLowerCase().includes(q);
    const matchDept = selectedDept === 'ALL' || pr.employee?.department?.name === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* Tiêu đề & Công cụ điều khiển */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/internal/payroll/periods')}
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'rgba(255, 255, 255, 0.05)' }}
              title="Quay lại danh sách kỳ lương"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ fontSize: '1.85rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Bảng Lương Tháng {month}/{year}
            </h2>
            {periodInfo.status === 'LOCKED' ? (
              <span className="badge badge-danger flex items-center gap-1 font-bold">
                <Lock size={13} /> ĐÃ KHÓA SỔ
              </span>
            ) : (
              <span className="badge badge-warning flex items-center gap-1 font-bold">
                <Unlock size={13} /> BẢN NHÁP (MỞ)
              </span>
            )}
          </div>
          <p className="text-muted text-xs mt-1">
            Động cơ tự động: Lương Gross theo ngày công thực tế, trừ 10.5% BHXH và Thuế TNCN lũy tiến từng phần
          </p>
        </div>

        <div className="flex gap-2.5 items-center flex-wrap">
          {/* Bộ chọn tháng và năm */}
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <select 
              className="form-input" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              value={month} 
              onChange={e => setMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select 
              className="form-input" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              value={year} 
              onChange={e => setYear(Number(e.target.value))}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            onClick={handleTogglePeriodLock}
            className="btn btn-outline flex items-center gap-1.5"
            style={periodInfo.status === 'LOCKED' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'var(--error)', color: 'var(--error)' }}
            title={periodInfo.status === 'LOCKED' ? "Mở khóa sổ" : "Khóa sổ kỳ lương"}
          >
            {periodInfo.status === 'LOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
            {periodInfo.status === 'LOCKED' ? 'Mở Khóa Sổ' : 'Khóa Sổ'}
          </button>

          <button 
            onClick={handleGenerate} 
            className="btn btn-primary flex items-center gap-1.5" 
            disabled={periodInfo.status === 'LOCKED'}
            title={periodInfo.status === 'LOCKED' ? 'Kỳ lương đã khóa, không thể chạy lại' : 'Tính toán lại bảng lương cho toàn bộ nhân sự'}
          >
            <Calculator size={16} /> Chạy Bảng Lương
          </button>

          <button 
            onClick={handleExportExcel} 
            className="btn btn-outline flex items-center gap-1.5" 
            style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* 4 Thẻ Tổng Quan Chỉ Số */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center flex-col items-center glass card-hover">
          <Banknote size={22} className="mb-2" style={{ color: 'var(--text-muted)' }}/>
          <span className="text-muted mb-1 text-xs uppercase tracking-wider font-bold">Tổng Quỹ Lương Cơ Bản</span>
          <span className="money-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {formatCurrency(totalBase)}
          </span>
          <span className="text-xs text-muted mt-1">{payrolls.length} nhân sự</span>
        </div>

        <div className="card text-center flex-col items-center glass card-hover" style={{ borderColor: 'rgba(105, 108, 255, 0.3)' }}>
          <Banknote size={22} className="mb-2" style={{ color: 'var(--primary)' }}/>
          <span className="text-muted mb-1 text-xs uppercase tracking-wider font-bold">Tổng Lương Gross</span>
          <span className="money-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {formatCurrency(totalGross)}
          </span>
          <span className="text-xs text-muted mt-1">Lương theo ngày công thực tế</span>
        </div>

        <div className="card text-center flex-col items-center glass card-hover" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <ShieldAlert size={22} className="mb-2" style={{ color: 'var(--error)' }}/>
          <span className="text-muted mb-1 text-xs uppercase tracking-wider font-bold">Tổng Khấu Trừ (BH & Thuế)</span>
          <span className="money-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--error)' }}>
            {formatCurrency(totalDeduction)}
          </span>
          <span className="text-xs text-muted mt-1">BHXH 10.5% & Thuế TNCN</span>
        </div>

        <div className="card text-center flex-col items-center glass card-hover" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <FileSignature size={22} className="mb-2" style={{ color: 'var(--success)' }}/>
          <span className="text-muted mb-1 text-xs uppercase tracking-wider font-bold">Tổng Thực Lãnh (Net)</span>
          <span className="money-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
            {formatCurrency(totalNet)}
          </span>
          <span className="text-xs text-muted mt-1">Kinh phí chi trả qua ngân hàng</span>
        </div>
      </div>

      {/* Bảng Chi Tiết Phiếu Lương */}
      <div className="card glass flex-col gap-4">
        {/* Bộ lọc bảng */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex gap-3 items-center" style={{ flex: 1, maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm mã NV, tên nhân sự..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted">Phòng ban:</span>
            <select 
              className="form-input" 
              style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th><div className="text-right">Lương Hợp Đồng</div></th>
                <th><div className="text-right">Công thực tế</div></th>
                <th><div className="text-right">Gross</div></th>
                <th><div className="text-right" style={{ color: 'var(--error)' }}>BHXH (10.5%)</div></th>
                <th><div className="text-right" style={{ color: 'var(--error)' }}>Thuế TNCN</div></th>
                <th style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}><div className="text-right">Thực lãnh (Net)</div></th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center p-8 text-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu bảng lương...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-8 text-muted">
                    {payrolls.length === 0 
                      ? 'Chưa tính bảng lương cho tháng này. Hãy bấm "Chạy Bảng Lương" phía trên!' 
                      : 'Không tìm thấy nhân viên phù hợp với bộ lọc tìm kiếm.'}
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map(pr => {
                  const ins = Number(pr.insuranceDeduction) || 0;
                  const tax = Number(pr.taxDeduction) || 0;
                  return (
                    <tr key={pr.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {pr.employee?.code}
                      </td>

                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: 'var(--primary)', color: 'white' }}>
                            {pr.employee?.fullName?.charAt(0) || 'NV'}
                          </div>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {pr.employee?.fullName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {pr.employee?.department?.name || 'Chưa gán PB'} - {pr.employee?.position?.title || 'Nhân viên'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="text-right money-text font-medium">{formatCurrency(pr.baseSalary)}</td>

                      <td className="text-right">
                        <span className="badge badge-warning font-bold">
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

                      <td className="text-right money-text" style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.05rem', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                        {formatCurrency(pr.netSalary)}
                      </td>

                      <td className="text-center">
                        <button 
                          onClick={() => setSelectedPayslip(pr)}
                          className="btn btn-outline flex items-center gap-1 mx-auto"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--primary)', borderColor: 'rgba(105, 108, 255, 0.3)' }}
                          title="Xem chi tiết phiếu lương và in"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT PHIẾU LƯƠNG NHÂN VIÊN (React Portal) */}
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
