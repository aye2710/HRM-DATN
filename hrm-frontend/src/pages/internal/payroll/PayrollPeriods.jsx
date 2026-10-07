import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  CalendarClock, Search, Plus, Filter, Lock, Unlock, PlayCircle, 
  Trash2, Eye, RefreshCw, Banknote, Users, X, Check, ArrowRight,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const PayrollPeriods = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [calculatingId, setCalculatingId] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal tạo kỳ lương
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [standardWorkingDays, setStandardWorkingDays] = useState(22);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/payroll/periods');
      setPeriods(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách kỳ lương');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val) || 0);
  };

  // Tạo Kỳ Lương Mới
  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/payroll/periods', {
        month: Number(newMonth),
        year: Number(newYear),
        standardWorkingDays: Number(standardWorkingDays)
      });

      toast.success(`Đã tạo kỳ lương Tháng ${newMonth}/${newYear} thành công!`);

      // Nếu chọn tự động tính toán luôn
      if (autoGenerate) {
        try {
          const genRes = await axios.post('http://localhost:5000/api/payroll/generate', {
            month: Number(newMonth),
            year: Number(newYear)
          });
          toast.success(genRes.data.message || 'Đã tự động tính toán bảng lương!');
        } catch (err) {
          toast.error('Kỳ lương đã tạo nhưng tính toán lương gặp sự cố');
        }
      }

      setShowCreateModal(false);
      fetchPeriods();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo kỳ lương mới');
    } finally {
      setSubmitting(false);
    }
  };

  // Tính lại lương (Run calculation)
  const handleCalculate = async (period) => {
    if (period.status === 'LOCKED') {
      return toast.error(`Kỳ lương ${period.name} đã bị KHÓA SỔ. Cần mở khóa trước khi chạy lại!`);
    }

    setCalculatingId(period.id);
    try {
      const res = await axios.post('http://localhost:5000/api/payroll/generate', {
        month: period.month,
        year: period.year
      });
      toast.success(res.data.message || `Đã tính toán bảng lương cho ${period.name}`);
      fetchPeriods();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tính lương');
    } finally {
      setCalculatingId(null);
    }
  };

  // Khóa / Mở Khóa Kỳ Lương
  const handleToggleLock = async (period) => {
    const isLocked = period.status === 'LOCKED';
    const actionText = isLocked ? 'MỞ KHÓA' : 'KHÓA SỔ';
    const confirmText = isLocked
      ? `Bạn có chắc muốn MỞ KHÓA ${period.name}? (Dữ liệu chấm công và lương có thể được sửa và tính lại)`
      : `Bạn có chắc muốn KHÓA SỔ ${period.name}? (Sau khi khóa, dữ liệu công và lương sẽ chuyển sang Read-Only để chi trả ngân hàng)`;

    const result = await Swal.fire({
      title: `${actionText} Kỳ Lương?`,
      text: confirmText,
      icon: isLocked ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonText: `${actionText} ngay`,
      cancelButtonText: 'Hủy',
      confirmButtonColor: isLocked ? '#0284c7' : '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const nextStatus = isLocked ? 'DRAFT' : 'LOCKED';
        await axios.post('http://localhost:5000/api/payroll/period/toggle-lock', {
          month: period.month,
          year: period.year,
          status: nextStatus
        });
        toast.success(`Đã ${actionText} ${period.name} thành công!`);
        fetchPeriods();
      } catch (err) {
        toast.error('Lỗi khi thay đổi trạng thái kỳ lương');
      }
    }
  };

  // Xóa Kỳ Lương
  const handleDeletePeriod = async (period) => {
    if (period.status === 'LOCKED') {
      return toast.error('Kỳ lương đã khóa sổ, không được phép xóa!');
    }

    const result = await Swal.fire({
      title: `Xóa ${period.name}?`,
      text: `Toàn bộ ${period.employees} phiếu lương trong kỳ này sẽ bị xóa vĩnh viễn!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/payroll/periods/${period.id}`);
        toast.success(`Đã xóa ${period.name}`);
        fetchPeriods();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Lỗi khi xóa kỳ lương');
      }
    }
  };

  // Điều hướng xem bảng lương chi tiết
  const handleViewPayslips = (period) => {
    navigate(`/internal/payroll/payslips?month=${period.month}&year=${period.year}`);
  };

  // Lọc danh sách
  const filteredPeriods = useMemo(() => {
    return periods.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.monthYear.includes(q);
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [periods, searchTerm, statusFilter]);

  // Phân trang
  const totalRecords = filteredPeriods.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentPeriods = filteredPeriods.slice(startIndex, endIndex);

  // Số liệu tổng hợp
  const totalCount = periods.length;
  const draftCount = periods.filter(p => p.status === 'DRAFT').length;
  const lockedCount = periods.filter(p => p.status === 'LOCKED').length;
  const latestNet = periods.length > 0 ? periods[0].totalNet : 0;

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout Độc Lập */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-col">
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Quản Lý Kỳ Lương
              </h1>
              <span className="badge badge-info" style={{ fontWeight: 600 }}>Enterprise Lifecycle</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Khởi tạo chu kỳ tính lương, chốt công, phân bổ quỹ lương và khóa sổ kế toán
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={fetchPeriods} className="btn btn-outline" style={{ height: 36 }} title="Làm mới">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <Plus size={16} />
              <span>Tạo Kỳ Lương Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Thẻ Thống Kê Tổng Quan */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng số kỳ lương</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <CalendarClock size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCount}</div>
          <span className="text-xs text-muted">Toàn bộ các chu kỳ đã lập</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(234, 179, 8, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Kỳ đang mở (Draft)</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.12)' }}>
              <PlayCircle size={16} color="var(--warning)" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--warning)' }}>{draftCount}</div>
          <span className="text-xs text-muted">Có thể chỉnh sửa & tính lại công</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Kỳ đã khóa sổ (Locked)</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
              <Lock size={16} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--success)' }}>{lockedCount}</div>
          <span className="text-xs text-muted">Dữ liệu Read-only để giải ngân</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(105, 108, 255, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Thực chi kỳ gần nhất</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(105, 108, 255, 0.12)' }}>
              <Banknote size={16} color="var(--primary)" />
            </div>
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.45rem', color: 'var(--primary)' }}>
            {formatCurrency(latestNet)}
          </div>
          <span className="text-xs text-muted">Tổng lương Net chi trả nhân sự</span>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu & Bộ Lọc Kèm Phân Trang */}
      <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div className="p-4 flex justify-between items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex gap-3 items-center" style={{ flex: 1, minWidth: '280px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm theo tên kỳ (VD: 10/2026)..." 
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

          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted font-medium">Trạng thái:</span>
            <select 
              className="form-input" 
              style={{ width: 'auto', height: 38, padding: '0 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái ({periods.length})</option>
              <option value="DRAFT">Bản nháp (Đang mở)</option>
              <option value="LOCKED">Đã khóa sổ</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th>KỲ TÍNH LƯƠNG</th>
                <th>CÔNG CHUẨN</th>
                <th>SỐ NHÂN SỰ</th>
                <th>TỔNG QUỸ GROSS</th>
                <th>THỰC LÃNH (NET)</th>
                <th>TRẠNG THÁI</th>
                <th className="text-center" style={{ width: '280px' }}>THAO TÁC XỬ LÝ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-12 text-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải danh sách kỳ lương...
                  </td>
                </tr>
              ) : currentPeriods.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-12 text-muted">
                    Không tìm thấy kỳ lương nào. Hãy bấm <strong>"+ Tạo Kỳ Lương Mới"</strong> để bắt đầu.
                  </td>
                </tr>
              ) : (
                currentPeriods.map(period => (
                  <tr key={period.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: period.status === 'LOCKED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)' }}>
                          <CalendarClock size={18} color={period.status === 'LOCKED' ? 'var(--success)' : 'var(--warning)'} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {period.name}
                          </span>
                          <span className="text-xs text-muted">Tháng {period.month} Năm {period.year}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-info font-bold">{period.standardWorkingDays || 22} ngày</span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5 font-bold text-main">
                        <Users size={14} color="var(--text-muted)" />
                        <span>{period.employees}</span>
                        <span className="text-xs text-muted font-normal">nhân sự</span>
                      </div>
                    </td>

                    <td>
                      <span className="money-text font-semibold text-main">{formatCurrency(period.totalGross)}</span>
                    </td>

                    <td>
                      <span className="money-text font-bold" style={{ color: 'var(--success)', fontSize: '0.95rem' }}>
                        {formatCurrency(period.totalNet)}
                      </span>
                    </td>

                    <td>
                      {period.status === 'LOCKED' ? (
                        <span className="badge badge-danger flex items-center gap-1 font-bold" style={{ width: 'fit-content' }}>
                          <Lock size={12} /> ĐÃ KHÓA SỔ
                        </span>
                      ) : (
                        <span className="badge badge-warning flex items-center gap-1 font-bold" style={{ width: 'fit-content' }}>
                          <PlayCircle size={12} /> BẢN NHÁP (MỞ)
                        </span>
                      )}
                    </td>

                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Xem bảng lương chi tiết */}
                        <button 
                          onClick={() => handleViewPayslips(period)}
                          className="btn btn-outline flex items-center gap-1"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'rgba(105, 108, 255, 0.3)', height: 32 }}
                          title="Xem chi tiết danh sách phiếu lương của kỳ này"
                        >
                          <Eye size={14} /> Bảng Lương
                        </button>

                        {/* Chạy / Tính toán lại lương */}
                        <button 
                          onClick={() => handleCalculate(period)}
                          disabled={period.status === 'LOCKED' || calculatingId === period.id}
                          className="btn btn-outline flex items-center gap-1"
                          style={{ 
                            padding: '0.35rem 0.65rem', 
                            fontSize: '0.8rem',
                            height: 32,
                            color: period.status === 'LOCKED' ? 'var(--text-muted)' : 'var(--warning)',
                            borderColor: period.status === 'LOCKED' ? 'transparent' : 'rgba(234, 179, 8, 0.4)'
                          }}
                          title={period.status === 'LOCKED' ? "Kỳ đã khóa sổ" : "Chạy tính toán lại lương toàn bộ nhân sự"}
                        >
                          <PlayCircle size={14} className={calculatingId === period.id ? 'animate-spin' : ''} />
                          <span>{calculatingId === period.id ? 'Đang tính...' : 'Tính Lương'}</span>
                        </button>

                        {/* Khóa / Mở Khóa */}
                        <button 
                          onClick={() => handleToggleLock(period)}
                          className="btn btn-outline flex items-center gap-1"
                          style={{ 
                            padding: '0.35rem 0.65rem', 
                            fontSize: '0.8rem',
                            height: 32,
                            color: period.status === 'LOCKED' ? 'var(--primary)' : 'var(--error)',
                            borderColor: period.status === 'LOCKED' ? 'rgba(105, 108, 255, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                          }}
                          title={period.status === 'LOCKED' ? "Mở khóa sổ" : "Khóa sổ kỳ lương"}
                        >
                          {period.status === 'LOCKED' ? <Unlock size={14} /> : <Lock size={14} />}
                          <span>{period.status === 'LOCKED' ? 'Mở Khóa' : 'Khóa'}</span>
                        </button>

                        {/* Xóa (chỉ xóa khi DRAFT) */}
                        {period.status === 'DRAFT' && (
                          <button 
                            onClick={() => handleDeletePeriod(period)}
                            className="btn btn-outline"
                            style={{ width: 32, height: 32, padding: 0, border: 'none', color: 'var(--error)' }}
                            title="Xóa kỳ lương này"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Thanh Phân Trang */}
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Đang hiển thị <strong>{totalRecords === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> / <strong>{totalRecords}</strong> kỳ lương
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
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-xs font-bold text-main">
              Trang {currentPage} / {totalPages}
            </span>

            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
              title="Trang tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
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

      {/* 5. MODAL TẠO KỲ LƯƠNG MỚI (React Portal Full Screen Backdrop) */}
      {showCreateModal && createPortal(
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
            maxWidth: '520px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.15)' }}>
                  <CalendarClock size={24} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                    Khởi Tạo Kỳ Lương Mới
                  </h2>
                  <p className="text-muted text-xs mt-0.5">Thiết lập chu kỳ tính công & trả lương doanh nghiệp</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    Tháng <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <select 
                    className="form-input"
                    value={newMonth}
                    onChange={e => setNewMonth(Number(e.target.value))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    Năm <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <select 
                    className="form-input"
                    value={newYear}
                    onChange={e => setNewYear(Number(e.target.value))}
                    required
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  Số ngày công chuẩn trong tháng (Standard Days)
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    className="form-input"
                    value={standardWorkingDays}
                    onChange={e => setStandardWorkingDays(e.target.value)}
                    required
                  />
                  <span className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>ngày làm việc</span>
                </div>
                <span className="text-xs text-muted mt-1 block">
                  Quy chuẩn tiêu chuẩn của doanh nghiệp là 22 ngày công / tháng (nghỉ T7, CN).
                </span>
              </div>

              <div className="p-3 rounded-xl mt-2" style={{ backgroundColor: 'rgba(105, 108, 255, 0.08)', border: '1px solid rgba(105, 108, 255, 0.2)' }}>
                <label className="flex items-center gap-3 cursor-pointer" style={{ margin: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={autoGenerate} 
                    onChange={e => setAutoGenerate(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Tự động tính lương cho toàn bộ nhân sự ngay
                    </span>
                    <p className="text-xs text-muted mb-0 mt-0.5">
                      Hệ thống sẽ quét hợp đồng lao động, dữ liệu chấm công và tính lương Gross/Net tự động.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn btn-outline"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                  {submitting ? 'Đang xử lý...' : 'Xác Nhận Tạo Kỳ Lương'}
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
