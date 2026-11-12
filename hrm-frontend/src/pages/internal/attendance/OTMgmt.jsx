import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock, Plus, Search, Filter, CheckCircle2, XCircle, AlertTriangle,
  FileSpreadsheet, RefreshCw, Calendar, User, Building, Trash2, Check, X,
  ShieldCheck, HelpCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';

export const OTMgmt = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [otRequests, setOtRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Phê duyệt / Nghiệm thu số giờ thực tế
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actualHoursInput, setActualHoursInput] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Modal Tạo đơn OT mới cho nhân viên
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    date: now.toISOString().split('T')[0],
    requestHours: 2,
    reason: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const token = localStorage.getItem('token');
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const monthQueryParam = selectedMonth === 'ALL' ? '' : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes, otRes] = await Promise.all([
        axios.get('http://localhost:5000/api/departments', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/employees', { headers }).catch(() => ({ data: [] })),
        axios.get(`http://localhost:5000/api/ot?month=${monthQueryParam}&year=${selectedYear}&departmentId=${selectedDept}&status=${statusFilter}`, { headers })
      ]);

      if (Array.isArray(deptRes.data)) setDepartments(deptRes.data);
      if (Array.isArray(empRes.data)) setEmployees(empRes.data);
      if (Array.isArray(otRes.data)) setOtRequests(otRes.data);
    } catch (err) {
      console.error('Error fetching OT data:', err);
      toast.error('Không thể tải danh sách đơn làm thêm giờ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedDept, statusFilter]);

  // Bộ lọc tìm kiếm trên giao diện
  const filteredRequests = useMemo(() => {
    return otRequests.filter(r => {
      const empName = r.employee?.fullName?.toLowerCase() || '';
      const empCode = r.employee?.code?.toLowerCase() || '';
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || empName.includes(term) || empCode.includes(term);
      const matchDept = selectedDept === 'ALL' || r.employee?.department?.id === selectedDept || r.employee?.departmentId === selectedDept;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [otRequests, searchTerm, selectedDept, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedRequests,
    resetPage,
  } = usePagination(filteredRequests, 10);

  useEffect(() => {
    resetPage();
  }, [searchTerm, selectedDept, statusFilter, selectedMonth, selectedYear, resetPage]);

  // Thống kê KPI
  const stats = useMemo(() => {
    let totalRequests = otRequests.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalRequestedHours = 0;
    let totalApprovedHours = 0;

    for (const r of otRequests) {
      totalRequestedHours += Number(r.requestHours || 0);
      if (r.status === 'PENDING') {
        pendingCount++;
      } else if (r.status === 'APPROVED') {
        approvedCount++;
        totalApprovedHours += Number(r.actualHours || r.requestHours || 0);
      } else if (r.status === 'REJECTED') {
        rejectedCount++;
      }
    }

    return {
      totalRequests,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalRequestedHours,
      totalApprovedHours
    };
  }, [otRequests]);

  // Mở modal duyệt (mặc định lấy số giờ đăng ký ban đầu để sếp không phải gõ lại từ 0)
  const handleOpenReview = (request) => {
    setSelectedRequest(request);
    const defaultHours = Number(request.actualHours) > 0
      ? Number(request.actualHours)
      : Number(request.requestHours || 2);
    setActualHoursInput(defaultHours);
    setReviewModalOpen(true);
  };

  // Xác nhận Duyệt hoặc Từ chối
  const handleReviewAction = async (status) => {
    if (!selectedRequest) return;
    if (status === 'APPROVED' && (!Number(actualHoursInput) || Number(actualHoursInput) <= 0)) {
      return toast.error('Số giờ nghiệm thu thực tế phải lớn hơn 0!');
    }
    setSubmittingReview(true);
    try {
      await axios.put(
        `http://localhost:5000/api/ot/${selectedRequest.id}/status`,
        {
          status,
          actualHours: status === 'APPROVED' ? Number(actualHoursInput) : 0
        },
        { headers }
      );

      toast.success(status === 'APPROVED' ? 'Đã phê duyệt đơn OT thành công!' : 'Đã từ chối đơn làm thêm!');
      setReviewModalOpen(false);
      setSelectedRequest(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xử lý đơn OT');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Tạo mới đơn OT
  const handleCreateOT = async (e) => {
    e.preventDefault();
    if (!createForm.employeeId || !createForm.date || !createForm.requestHours) {
      return toast.error('Vui lòng điền đủ nhân viên, ngày làm và số giờ OT!');
    }
    if (Number(createForm.requestHours) <= 0 || Number(createForm.requestHours) > 4) {
      return toast.error('Số giờ làm thêm phải từ 0.5h đến 4.0h/ngày (Điều 107 BLLĐ 2019)!');
    }

    setSubmittingCreate(true);
    try {
      await axios.post(
        'http://localhost:5000/api/ot',
        {
          employeeId: createForm.employeeId,
          date: createForm.date,
          requestHours: Number(createForm.requestHours),
          reason: createForm.reason.trim() || 'Làm thêm theo phân công dự án'
        },
        { headers }
      );
      toast.success('Đã tạo đơn đăng ký làm thêm giờ thành công!');
      setCreateModalOpen(false);
      setCreateForm({
        employeeId: '',
        date: now.toISOString().split('T')[0],
        requestHours: 2,
        reason: ''
      });
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo đơn OT');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Xóa đơn OT (nếu PENDING)
  const handleDeleteOT = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn làm thêm giờ này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/ot/${id}`, { headers });
      toast.success('Đã xóa đơn làm thêm giờ');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa đơn OT');
    }
  };

  // Xuất file CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return toast.error('Không có dữ liệu OT để xuất');
    const csvHeaders = ['Mã NV', 'Họ tên', 'Phòng ban', 'Ngày làm thêm', 'Hệ số', 'Giờ đăng ký', 'Giờ duyệt thực tế', 'Lý do', 'Trạng thái'];
    const rows = filteredRequests.map(r => {
      const otD = new Date(r.date);
      const isWeekend = otD.getDay() === 0 || otD.getDay() === 6;
      return [
        `"${r.employee?.code || ''}"`,
        `"${r.employee?.fullName || ''}"`,
        `"${r.employee?.department?.name || ''}"`,
        `"${otD.toLocaleDateString('vi-VN')}"`,
        `"${isWeekend ? '200% (Cuối tuần)' : '150% (Ngày thường)'}"`,
        Number(r.requestHours).toFixed(1),
        Number(r.actualHours || 0).toFixed(1),
        `"${r.reason || ''}"`,
        `"${r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}"`
      ];
    });

    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', selectedMonth === 'ALL'
      ? `Bao_Cao_OT_Nam_${selectedYear}.csv`
      : `Bao_Cao_OT_Thang_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* 1. Header Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '8px',
            backgroundColor: '#EFF6FF', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Quản lý Làm thêm giờ (Overtime - OT)
              </h2>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                Điều 107 BLLĐ 2019
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              Phê duyệt số giờ làm thêm (Ngày thường 150%, Cuối tuần 200%, Lễ 300%) • Tự động liên kết Cột J Bảng lương
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: 34 }}
          >
            <Plus size={15} /> Tạo đơn OT mới
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: 34, borderColor: '#CBD5E1', color: '#059669' }}
          >
            <FileSpreadsheet size={15} /> Xuất Excel
          </button>

          <button
            onClick={fetchData}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.55rem', height: 34, borderColor: '#CBD5E1', color: '#64748B' }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Bảng Danh sách Đơn Làm thêm giờ */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        {/* Thanh tìm kiếm & bộ lọc nằm trên 1 hàng duy nhất */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF'
        }}>
          {/* Nhóm trái: Ô tìm kiếm + Tháng/Năm + Phòng ban + Trạng thái */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Ô tìm kiếm theo tên / mã NV */}
            <div style={{ position: 'relative', width: 250 }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Tìm tên nhân viên, mã NV..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: 34,
                  paddingLeft: '2.1rem',
                  paddingRight: '0.75rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Bộ chọn Tháng / Năm */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#F8FAFC',
              padding: '0 0.65rem',
              height: 34,
              borderRadius: '0.5rem',
              border: '1px solid #CBD5E1',
              boxSizing: 'border-box'
            }}>
              <Calendar size={14} color="#64748B" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">Cả năm</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <span style={{ color: '#94A3B8' }}>/</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Phòng ban */}
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{
                height: 34,
                padding: '0 0.75rem',
                fontSize: '0.8rem',
                border: '1px solid #CBD5E1',
                borderRadius: '0.5rem',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
                minWidth: 155,
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Trạng thái */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: 34,
                padding: '0 0.75rem',
                fontSize: '0.8rem',
                border: '1px solid #CBD5E1',
                borderRadius: '0.5rem',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
                minWidth: 145,
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ phê duyệt</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>

          {/* Nhóm phải: Tổng số đơn & Thống kê nhanh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Tổng số: <strong style={{ color: '#0F172A' }}>{filteredRequests.length}</strong> đơn
            </span>
            {stats.approvedCount > 0 && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#ECFDF5', color: '#15803D', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                ● {stats.totalApprovedHours.toFixed(1)}h đã duyệt
              </span>
            )}
            {stats.pendingCount > 0 && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                ⚠ {stats.pendingCount} đơn chờ duyệt
              </span>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700 }}>Nhân viên</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Phòng ban</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Ngày làm OT</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Hệ số lương OT</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Đăng ký</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Nghiệm thu</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Lý do làm thêm</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                    Đang tải dữ liệu làm thêm giờ...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                    Không có đơn làm thêm giờ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map(r => {
                  const otD = new Date(r.date);
                  const isWeekend = otD.getDay() === 0 || otD.getDay() === 6;

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.employee?.fullName || '—'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{r.employee?.code || ''}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#334155', whiteSpace: 'nowrap' }}>
                        {r.employee?.department?.name || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {otD.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          backgroundColor: isWeekend ? '#FFFBEB' : '#EFF6FF',
                          color: isWeekend ? '#B45309' : '#1D4ED8'
                        }}>
                          {isWeekend ? 'Cuối tuần (200%)' : 'Ngày thường (150%)'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                        {Number(r.requestHours).toFixed(1)}h
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: r.status === 'APPROVED' ? '#15803D' : '#64748B' }}>
                        {r.status === 'APPROVED' ? `${Number(r.actualHours || r.requestHours).toFixed(1)}h` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#334155', maxWidth: 220 }}>
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={r.reason}>
                          {r.reason || 'Làm thêm tiến độ dự án'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: r.status === 'APPROVED' ? '#DCFCE7' : r.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                          color: r.status === 'APPROVED' ? '#15803D' : r.status === 'REJECTED' ? '#B91C1C' : '#B45309'
                        }}>
                          {r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {r.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleOpenReview(r)}
                                className="btn btn-primary"
                                style={{ height: 28, padding: '0 0.6rem', fontSize: '0.73rem', backgroundColor: '#15803D', borderColor: '#15803D' }}
                                title="Phê duyệt số giờ nghiệm thu thực tế"
                              >
                                <Check size={13} /> Duyệt
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(r);
                                  handleReviewAction('REJECTED');
                                }}
                                className="btn btn-outline"
                                style={{ height: 28, padding: '0 0.6rem', fontSize: '0.73rem', color: '#DC2626', borderColor: '#FECACA' }}
                                title="Từ chối đơn"
                              >
                                <X size={13} /> Từ chối
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenReview(r)}
                              className="btn btn-outline"
                              style={{ height: 28, padding: '0 0.5rem', fontSize: '0.72rem', color: '#64748B', borderColor: '#E2E8F0' }}
                              title="Xem chi tiết đơn"
                            >
                              Xem lại
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteOT(r.id)}
                            className="btn btn-outline"
                            style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', borderColor: '#E2E8F0' }}
                            title="Xóa đơn"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
            itemLabel="đơn OT"
          />
        )}
      </div>

      {/* MODAL PHÊ DUYỆT / NGHIỆM THU GIỜ OT */}
      {reviewModalOpen && selectedRequest && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '0.75rem',
            width: '100%', maxWidth: 460, overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#EFF6FF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#2563EB" />
                <strong style={{ fontSize: '0.95rem', color: '#1E40AF' }}>Phê duyệt &amp; Nghiệm thu giờ OT</strong>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Nhân viên:</div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                  {selectedRequest.employee?.fullName} ({selectedRequest.employee?.code})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                  Ngày làm thêm: <strong>{new Date(selectedRequest.date).toLocaleDateString('vi-VN')}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                  Lý do: <em>{selectedRequest.reason || 'Làm thêm dự án'}</em>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                  Số giờ nghiệm thu thực tế (tính lương) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="4"
                  className="form-input w-full"
                  value={actualHoursInput}
                  onChange={e => setActualHoursInput(e.target.value)}
                  style={{ fontWeight: 700, color: '#15803D' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4 }}>
                  Số giờ đăng ký ban đầu: <strong>{Number(selectedRequest.requestHours).toFixed(1)}h</strong> (Tối đa 4.0h/ngày theo luật).
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => handleReviewAction('REJECTED')}
                  className="btn btn-outline"
                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                >
                  Từ chối đơn
                </button>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => handleReviewAction('APPROVED')}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#15803D', borderColor: '#15803D' }}
                >
                  {submittingReview ? 'Đang duyệt...' : 'Xác nhận Phê duyệt'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL TẠO ĐƠN OT MỚI CHO NHÂN VIÊN */}
      {createModalOpen && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '0.75rem',
            width: '100%', maxWidth: 480, overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#EFF6FF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#2563EB" />
                <strong style={{ fontSize: '0.95rem', color: '#1E40AF' }}>Tạo Đơn làm thêm giờ (OT)</strong>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOT} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{
                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem',
                padding: '0.65rem 0.85rem', fontSize: '0.74rem', color: '#334155', lineHeight: 1.45
              }}>
                <strong>Chính sách OT Công ty LLA:</strong> Tối đa <strong>4h/ngày</strong>, <strong>40h/tháng</strong> (Cảnh báo tại 80% = 32h), <strong>200h/năm</strong> (Mốc 300h cần phê duyệt riêng từ HR/Legal).
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                  Chọn nhân viên <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  className="form-input w-full"
                  value={createForm.employeeId}
                  onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhân viên làm thêm --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'Chưa phân PB'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                  Ngày làm thêm <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={createForm.date}
                  onChange={e => setCreateForm({ ...createForm, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                  Số giờ làm thêm (tối đa 4h/ngày) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="4"
                  className="form-input w-full"
                  value={createForm.requestHours}
                  onChange={e => setCreateForm({ ...createForm, requestHours: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                  Lý do làm thêm giờ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="form-input w-full"
                  rows={3}
                  placeholder="Nhập mục đích làm thêm giờ theo phân công..."
                  value={createForm.reason}
                  onChange={e => setCreateForm({ ...createForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="btn btn-primary"
                >
                  {submittingCreate ? 'Đang tạo...' : 'Tạo đơn OT'}
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

