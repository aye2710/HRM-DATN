import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, Search, CheckCircle, XCircle, Plus, ArrowRight, FileCheck2, Printer, ArrowLeft, Send, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { ExplanationA4Preview, formatExplanationTypeBadge } from '../../../components/attendance/AttendanceShared';

export const Adjustments = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [adjustments, setAdjustments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Chế độ hiển thị Toàn Trang (KHÔNG dùng Popup): 'LIST' | 'FORM_PAGE'
  const [viewMode, setViewMode] = useState('LIST');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    employeeId: '',
    date: now.toISOString().split('T')[0],
    type: 'Đơn xác nhận chấm công (Quên Check-out)',
    oldTime: '07:54 / — (Thiếu giờ ra)',
    reason: 'do chưa làm dấu vân tay / quên quét vân tay lúc ra về',
    status: 'PENDING',
    readOnly: false,
    empFullName: '',
    empDept: 'IT',
    empPos: 'BA'
  });

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const [adjRes, empRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance/adjustments'),
        axios.get('http://localhost:5000/api/employees')
      ]);
      setAdjustments(adjRes.data || []);
      const activeEmps = (empRes.data || []).filter(e => e.status !== 'RESIGNED');
      setEmployees(activeEmps);
      if (activeEmps.length > 0 && !formData.employeeId) {
        const first = activeEmps[0];
        setFormData(prev => ({
          ...prev,
          employeeId: first.id,
          empFullName: first.fullName,
          empDept: first.department?.name || 'IT',
          empPos: first.position?.title || 'BA'
        }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách giải trình chấm công');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleUpdateStatus = async (adj, status) => {
    const isApprove = status === 'APPROVED';

    Swal.fire({
      title: isApprove ? 'Xác nhận phê duyệt đơn?' : 'Từ chối đơn này?',
      html: isApprove
        ? `Nhân sự: <strong>${adj.employee?.fullName}</strong> (${new Date(adj.date).toLocaleDateString('vi-VN')})<br/>Loại đơn: <strong>${adj.type}</strong><br/>Khi HCNS-KT duyệt, hệ thống tự động cập nhật sang <strong>Bảng công Ma trận (${adj.newTime})</strong>.`
        : `Từ chối đơn của <strong>${adj.employee?.fullName}</strong>? Ngày công sẽ giữ nguyên theo log máy chấm công.`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#16A34A' : '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: isApprove ? '✓ Đồng ý duyệt & Cập nhật công' : 'Đồng ý từ chối',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`http://localhost:5000/api/attendance/adjustments/${adj.id}/status`, { status });
          toast.success(
            isApprove
              ? `Đã duyệt đơn của ${adj.employee?.fullName}! Bảng công ngày ${new Date(adj.date).toLocaleDateString('vi-VN')} đã cập nhật.`
              : 'Đã từ chối đơn.'
          );
          fetchAdjustments();
        } catch (err) {
          toast.error(err.response?.data?.error || 'Lỗi xử lý yêu cầu');
        }
      }
    });
  };

  const openNewFormPage = () => {
    const first = employees[0];
    setFormData({
      id: null,
      employeeId: first?.id || '',
      date: now.toISOString().split('T')[0],
      type: 'Đơn xác nhận chấm công (Quên Check-out)',
      oldTime: '07:54 / — (Thiếu giờ ra)',
      reason: 'do chưa làm dấu vân tay / quên quét vân tay lúc ra về',
      status: 'PENDING',
      readOnly: false,
      empFullName: first?.fullName || 'Lê Hữu Trúc',
      empDept: first?.department?.name || 'IT',
      empPos: first?.position?.title || 'BA'
    });
    setViewMode('FORM_PAGE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openViewDocPage = (adj) => {
    setFormData({
      id: adj.id,
      employeeId: adj.employeeId,
      date: adj.date ? new Date(adj.date).toISOString().split('T')[0] : now.toISOString().split('T')[0],
      type: adj.type,
      oldTime: adj.oldTime || '',
      reason: adj.reason || '',
      status: adj.status || 'PENDING',
      readOnly: true,
      empFullName: adj.employee?.fullName || 'Lê Hữu Trúc',
      empDept: adj.employee?.department?.name || 'IT',
      empPos: adj.employee?.position?.title || 'BA'
    });
    setViewMode('FORM_PAGE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.reason.trim()) {
      return toast.error('Vui lòng chọn nhân viên, ngày và nhập lý do!');
    }
    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/attendance/adjustments', {
        employeeId: formData.employeeId,
        date: formData.date,
        type: formData.type,
        oldTime: formData.oldTime,
        reason: formData.reason.trim()
      });
      toast.success('Đã lập đơn thành công!');
      await fetchAdjustments();
      setFormData(prev => ({ ...prev, readOnly: true }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const monthFilteredAdjustments = useMemo(() => {
    return adjustments.filter(adj => {
      if (!adj.date) return true;
      const d = new Date(adj.date);
      if (selectedYear !== 'ALL' && d.getFullYear() !== Number(selectedYear)) return false;
      if (selectedMonth !== 'ALL' && (d.getMonth() + 1) !== Number(selectedMonth)) return false;
      return true;
    });
  }, [adjustments, selectedMonth, selectedYear]);

  const counts = useMemo(() => {
    return {
      ALL: monthFilteredAdjustments.length,
      PENDING: monthFilteredAdjustments.filter(a => a.status === 'PENDING').length,
      APPROVED: monthFilteredAdjustments.filter(a => a.status === 'APPROVED').length,
      REJECTED: monthFilteredAdjustments.filter(a => a.status === 'REJECTED').length
    };
  }, [monthFilteredAdjustments]);

  const filteredList = useMemo(() => {
    return monthFilteredAdjustments.filter(adj => {
      const matchSearch =
        searchTerm === '' ||
        adj.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.employee?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || adj.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [monthFilteredAdjustments, searchTerm, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedList,
    resetPage,
  } = usePagination(filteredList, 10);

  useEffect(() => {
    resetPage();
  }, [searchTerm, statusFilter, selectedMonth, selectedYear, resetPage]);

  // ============================================================================
  // CHẾ ĐỘ 1: TRANG LẬP & XEM TRƯỚC BIÊN BẢN A4 TOÀN MÀN HÌNH (KHÔNG POPUP)
  // ============================================================================
  if (viewMode === 'FORM_PAGE') {

    return (
      <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '0.85rem 1.25rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setViewMode('LIST')}
              className="btn btn-outline"
              style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              <ArrowLeft size={15} /> Quay lại danh sách đơn
            </button>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Biên Bản Xác Nhận Chấm Công &amp; Đơn Xin Đi Muộn (Công ty LLA)
              </h1>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Xem trước trực tiếp trên trang A4 &amp; In biên bản trình Trưởng bộ phận ký
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{ height: 35, padding: '0 0.95rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <Printer size={15} /> In biên bản A4
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem', alignItems: 'start' }}>
          {/* CỘT TRÁI: THÔNG TIN ĐƠN */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem'
          }}>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.6rem' }}>
              Thông tin Biên bản / Đơn giải trình
            </strong>

            <form onSubmit={handleCreateAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Nhân sự làm đơn *</label>
                <select
                  className="form-input"
                  style={{ width: '100%' }}
                  value={formData.employeeId}
                  disabled={formData.readOnly}
                  onChange={e => {
                    const emp = employees.find(x => x.id === e.target.value);
                    setFormData({
                      ...formData,
                      employeeId: e.target.value,
                      empFullName: emp?.fullName || 'Lê Hữu Trúc',
                      empDept: emp?.department?.name || 'IT',
                      empPos: emp?.position?.title || 'BA'
                    });
                  }}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Ngày áp dụng *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    max={now.toISOString().split('T')[0]}
                    disabled={formData.readOnly}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Loại Biên bản / Đơn *</label>
                  <select
                    className="form-input"
                    style={{ width: '100%' }}
                    value={formData.type}
                    disabled={formData.readOnly}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Đơn xác nhận chấm công (Quên Check-out)">Đơn xác nhận công (Quên Check-out)</option>
                    <option value="Đơn xác nhận chấm công (Quên Check-in)">Đơn xác nhận công (Quên Check-in)</option>
                    <option value="Đơn xác nhận chấm công (Chưa làm dấu vân tay)">Đơn xác nhận công (Chưa làm vân tay)</option>
                    <option value="Đơn xin phép đi muộn (5p - 60p)">Đơn xin phép đi muộn (5p – 1 tiếng)</option>
                    <option value="Đơn xin phép về sớm (Trước giờ tan ca)">Đơn xin phép về sớm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Lý do trình bày *</label>
                <textarea
                  rows={4}
                  className="form-input"
                  value={formData.reason}
                  disabled={formData.readOnly}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setViewMode('LIST')}>
                  Quay lại
                </button>
                <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                  <Printer size={14} /> In biên bản A4
                </button>
                {!formData.readOnly && (
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Send size={14} /> {submitting ? 'Đang lưu...' : 'Lưu đơn'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: TỜ GIẤY A4 XEM TRƯỚC TRỰC TIẾP */}
          <ExplanationA4Preview
            fullName={formData.empFullName}
            positionTitle={formData.empPos}
            deptName={formData.empDept}
            date={formData.date}
            subType={formData.type}
            reason={formData.reason}
            status={formData.status}
          />
        </div>
      </div>
    );
  }

  const formatTypeBadge = formatExplanationTypeBadge;

  const formatProposedAction = (adj) => {
    const isLate = String(adj.type || '').toLowerCase().includes('đi muộn');
    if (isLate) {
      if (String(adj.newTime || '').includes('Vượt hạn mức')) {
        return 'Vượt hạn mức (Vẫn phạt)';
      }
      return 'Xin miễn phạt tiền (Lần 1/3)';
    }
    if (String(adj.newTime || '').includes('08:00 - 17:30')) {
      return 'Bổ sung giờ ra & Đủ công';
    }
    return adj.newTime || 'Xác nhận đủ 1.0 công';
  };

  // ============================================================================
  // CHẾ ĐỘ 2: DANH SÁCH ĐƠN XÁC NHẬN CHẤM CÔNG & ĐƠN XIN ĐI MUỘN
  // ============================================================================
  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* 1. Header tinh gọn, hiện đại */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.85rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            backgroundColor: '#EFF6FF', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <FileCheck2 size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Xét Duyệt Đơn Giải Trình &amp; Đi Muộn
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.76rem' }}>
              Duyệt đơn xác nhận chấm công và xin đi muộn để tự động đồng bộ ngày công sang Bảng công.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/internal/attendance/records')}
            style={{ height: 34, padding: '0 0.8rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}
          >
            ← Bảng công Ma trận
          </button>
          <button
            className="btn btn-primary"
            onClick={openNewFormPage}
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={14} /> Lập đơn mới
          </button>
        </div>
      </div>

      {/* 2. Bộ lọc Tab Trạng thái & Ô Tìm kiếm */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
          backgroundColor: '#FAFAFA'
        }}>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả', count: counts.ALL },
              { id: 'PENDING', label: 'Chờ duyệt', count: counts.PENDING, badgeColor: '#FEF3C7', textColor: '#B45309' },
              { id: 'APPROVED', label: 'Đã duyệt', count: counts.APPROVED, badgeColor: '#DCFCE7', textColor: '#15803D' },
              { id: 'REJECTED', label: 'Từ chối', count: counts.REJECTED, badgeColor: '#FEE2E2', textColor: '#B91C1C' }
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '0.45rem',
                    border: active ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                    color: active ? '#1D4ED8' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                  <span style={{
                    padding: '1px 5px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: tab.badgeColor || '#F1F5F9',
                    color: tab.textColor || '#334155'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Bộ lọc Tháng & Năm */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              height: 32
            }}>
              <Calendar size={13} color="#2563EB" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{ border: 'none', background: 'transparent', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">Tất cả tháng</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{ border: 'none', background: 'transparent', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value="ALL">Tất cả năm</option>
              </select>
            </div>

            <div style={{ position: 'relative', width: '210px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Tìm tên, mã NV, lý do..." 
                className="form-input"
                style={{ paddingLeft: '1.9rem', width: '100%', height: 32, fontSize: '0.78rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchAdjustments}
              className="btn btn-outline"
              style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#CBD5E1', color: '#64748B' }}
              title="Làm mới danh sách"
            >
              <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 3. Bảng Danh sách Đơn tinh gọn, thoáng mắt */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, width: '22%' }}>Nhân sự</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700, width: '16%' }}>Ngày &amp; Loại đơn</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700, width: '23%' }}>Đối soát giờ công</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700, width: '21%' }}>Lý do giải trình</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, width: '9%' }}>Trạng thái</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 700, width: '9%' }}>Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>Đang tải danh sách đơn...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                    Không có đơn nào trong mục này.
                  </td>
                </tr>
              ) : (
                paginatedList.map(adj => {
                  const typeBadge = formatTypeBadge(adj.type);
                  return (
                    <tr key={adj.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: adj.status === 'PENDING' ? '#FCFDFE' : '#FFFFFF' }}>
                      
                      {/* Cột 1: Nhân sự */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            backgroundColor: '#EFF6FF', color: '#1D4ED8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                          }}>
                            {adj.employee?.fullName?.charAt(0) || 'N'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.2 }}>
                              {adj.employee?.fullName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 1 }}>
                              {adj.employee?.code} {adj.employee?.department?.name ? `• ${adj.employee.department.name}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Ngày & Loại đơn */}
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', marginBottom: 3 }}>
                          {new Date(adj.date).toLocaleDateString('vi-VN')}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: typeBadge.bg,
                          color: typeBadge.color,
                          border: `1px solid ${typeBadge.border}`
                        }}>
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Cột 3: Đối soát giờ công (Gọn gàng, thanh thoát) */}
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', width: 44 }}>Thực tế:</span>
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              padding: '1px 5px',
                              borderRadius: '3px'
                            }}>
                              {adj.oldTime || 'Thiếu giờ'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', width: 44 }}>Đề xuất:</span>
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#15803D',
                              backgroundColor: '#DCFCE7',
                              padding: '1px 5px',
                              borderRadius: '3px'
                            }}>
                              {formatProposedAction(adj)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Lý do giải trình */}
                      <td style={{ padding: '0.65rem 0.85rem', color: '#334155', fontSize: '0.76rem', lineHeight: 1.35 }}>
                        <div style={{
                          backgroundColor: '#F8FAFC',
                          padding: '0.35rem 0.55rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #F1F5F9',
                          maxHeight: '44px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={adj.reason}>
                          {adj.reason}
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                        {adj.status === 'PENDING' && (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309' }}>
                            Chờ duyệt
                          </span>
                        )}
                        {adj.status === 'APPROVED' && (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#DCFCE7', color: '#15803D' }}>
                            Đã duyệt
                          </span>
                        )}
                        {adj.status === 'REJECTED' && (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                            Từ chối
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Thao tác xử lý (Chỉ dùng icon Duyệt / Từ chối) */}
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                        {adj.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleUpdateStatus(adj, 'APPROVED')}
                              style={{
                                height: 28,
                                width: 28,
                                padding: 0,
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#16A34A',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)'
                              }}
                              title="Duyệt đơn"
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(adj, 'REJECTED')}
                              style={{
                                height: 28,
                                width: 28,
                                padding: 0,
                                borderRadius: '6px',
                                border: '1px solid #FECACA',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Từ chối đơn"
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="đơn"
          />
        )}
      </div>

    </div>
  );
};
