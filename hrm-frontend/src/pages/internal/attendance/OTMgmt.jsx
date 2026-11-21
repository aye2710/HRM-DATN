import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock, Plus, Search, Filter, CheckCircle2, XCircle, AlertTriangle,
  FileSpreadsheet, RefreshCw, Calendar, User, Building, Trash2, Check, X,
  ShieldCheck, HelpCircle, Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { DateInput } from '../../../components/common/DateInput';
import { PageHeader } from '../../../components/common/PageHeader';

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
  const [reviewNoteInput, setReviewNoteInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Modal Xác nhận Xóa đơn làm thêm giờ (thay thế window.confirm popup mặc định)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteRequest, setSelectedDeleteRequest] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

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

  // Thống kê KPI theo danh sách đang hiển thị
  const stats = useMemo(() => {
    let totalRequests = filteredRequests.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalRequestedHours = 0;
    let totalApprovedHours = 0;

    for (const r of filteredRequests) {
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
  }, [filteredRequests]);

  // Mở modal duyệt: Tự động đối soát và đề xuất số giờ nghiệm thu theo log quẹt thẻ thực tế
  const handleOpenReview = (request) => {
    setSelectedRequest(request);
    let initialHours = 0;
    if (Number(request.actualHours) > 0) {
      initialHours = Number(request.actualHours);
    } else if (request.crossCheck?.suggestedHours !== undefined) {
      initialHours = Number(request.crossCheck.suggestedHours);
    } else {
      initialHours = Number(request.requestHours || 2);
    }
    setActualHoursInput(initialHours);
    setReviewNoteInput('');
    setReviewModalOpen(true);
  };

  // Xác nhận Duyệt hoặc Từ chối
  const handleReviewAction = async (status) => {
    if (!selectedRequest) return;
    if (status === 'APPROVED' && (!Number(actualHoursInput) || Number(actualHoursInput) < 0)) {
      return toast.error('Số giờ nghiệm thu thực tế không hợp lệ!');
    }
    setSubmittingReview(true);
    try {
      await axios.put(
        `http://localhost:5000/api/ot/${selectedRequest.id}/status`,
        {
          status,
          actualHours: status === 'APPROVED' ? Number(actualHoursInput) : 0,
          reviewNote: reviewNoteInput
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

  // Mở popup xác nhận xóa đơn OT
  const handleOpenDeleteConfirm = (request) => {
    setSelectedDeleteRequest(request);
    setDeleteModalOpen(true);
  };

  // Thực hiện xóa đơn OT khi xác nhận trên Modal
  const confirmDeleteOT = async () => {
    if (!selectedDeleteRequest) return;
    setSubmittingDelete(true);
    try {
      await axios.delete(`http://localhost:5000/api/ot/${selectedDeleteRequest.id}`, { headers });
      toast.success('Đã xóa đơn làm thêm giờ thành công!');
      setDeleteModalOpen(false);
      setSelectedDeleteRequest(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa đơn OT');
    } finally {
      setSubmittingDelete(false);
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
      
      {/* 1. Header chuẩn đồng bộ */}
      <PageHeader
        icon={<Clock size={20} />}
        title="Quản lý Làm thêm giờ (Overtime - OT)"
        badge="Điều 107 BLLĐ 2019"
        subtitle="Phê duyệt số giờ làm thêm (Ngày thường 150%, Cuối tuần 200%, Lễ 300%) • Tự động liên kết Cột J Bảng lương"
        actions={
          <>
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
          </>
        }
      />

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
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Quẹt ra thực tế (Đối soát)</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Nghiệm thu</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Lý do làm thêm</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                    Đang tải dữ liệu làm thêm giờ...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
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
                      <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                        {r.crossCheck ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.8rem', color: '#1E293B' }}>
                              <Clock size={12} color="#64748B" />
                              {r.crossCheck.checkOutFormatted ? `${r.crossCheck.checkOutFormatted}` : 'Chưa có'}
                              {r.crossCheck.stayHours > 0 && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>
                                  ({r.crossCheck.stayHours}h sau ca)
                                </span>
                              )}
                            </div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              width: 'fit-content',
                              backgroundColor:
                                r.crossCheck.complianceStatus === 'QUALIFIED' ? '#DCFCE7' :
                                r.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#FEF3C7' :
                                r.crossCheck.complianceStatus === 'ZERO_OT' ? '#FEE2E2' :
                                r.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#FEE2E2' : '#F1F5F9',
                              color:
                                r.crossCheck.complianceStatus === 'QUALIFIED' ? '#15803D' :
                                r.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#B45309' :
                                r.crossCheck.complianceStatus === 'ZERO_OT' ? '#B91C1C' :
                                r.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#B91C1C' : '#64748B'
                            }}>
                              {r.crossCheck.complianceStatus === 'QUALIFIED' && '✓ Đạt đủ giờ'}
                              {r.crossCheck.complianceStatus === 'UNDER_HOURS' && `⚠ Thiếu giờ (${r.crossCheck.stayHours}h)`}
                              {r.crossCheck.complianceStatus === 'ZERO_OT' && '✕ Về đúng ca (0h OT)'}
                              {r.crossCheck.complianceStatus === 'NO_CHECKOUT' && '⚠ Thiếu log quẹt ra'}
                              {r.crossCheck.complianceStatus === 'PENDING_TIME' && 'Chưa hết ca'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>—</span>
                        )}
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            onClick={() => handleOpenReview(r)}
                            style={{
                              width: 32, height: 32, borderRadius: 6,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: r.status === 'PENDING' ? '#EFF6FF' : '#F8FAFC',
                              color: r.status === 'PENDING' ? '#2563EB' : '#475569',
                              border: `1px solid ${r.status === 'PENDING' ? '#BFDBFE' : '#E2E8F0'}`,
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            title={r.status === 'PENDING' ? 'Xem chi tiết & Phê duyệt đơn OT' : 'Xem chi tiết đơn OT'}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteConfirm(r)}
                            style={{
                              width: 32, height: 32, borderRadius: 6,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0',
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            title="Xóa đơn làm thêm này"
                          >
                            <Trash2 size={15} />
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
                <strong style={{ fontSize: '0.95rem', color: '#1E40AF' }}>
                  {selectedRequest.status === 'PENDING' ? 'Phê duyệt & Nghiệm thu giờ OT' : 'Chi tiết Đơn làm thêm giờ (Đã xử lý)'}
                </strong>
                {selectedRequest.status !== 'PENDING' && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: selectedRequest.status === 'APPROVED' ? '#DCFCE7' : '#FEE2E2',
                    color: selectedRequest.status === 'APPROVED' ? '#15803D' : '#B91C1C'
                  }}>
                    {selectedRequest.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                )}
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

              {/* KHỐI ĐỐI SOÁT CHÉO VỚI DỮ LIỆU MÁY CHẤM CÔNG */}
              {selectedRequest.crossCheck && (
                <div style={{
                  backgroundColor:
                    selectedRequest.crossCheck.complianceStatus === 'QUALIFIED' ? '#F0FDF4' :
                    selectedRequest.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#FFFBEB' :
                    selectedRequest.crossCheck.complianceStatus === 'ZERO_OT' ? '#FEF2F2' :
                    selectedRequest.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#FEF2F2' : '#F8FAFC',
                  border: `1px solid ${
                    selectedRequest.crossCheck.complianceStatus === 'QUALIFIED' ? '#BBF7D0' :
                    selectedRequest.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#FDE68A' :
                    selectedRequest.crossCheck.complianceStatus === 'ZERO_OT' ? '#FECACA' :
                    selectedRequest.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#FECACA' : '#E2E8F0'
                  }`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} color="#2563EB" />
                      Đối soát dữ liệu chấm công:
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor:
                        selectedRequest.crossCheck.complianceStatus === 'QUALIFIED' ? '#DCFCE7' :
                        selectedRequest.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#FEF3C7' :
                        selectedRequest.crossCheck.complianceStatus === 'ZERO_OT' ? '#FEE2E2' :
                        selectedRequest.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#FEE2E2' : '#E2E8F0',
                      color:
                        selectedRequest.crossCheck.complianceStatus === 'QUALIFIED' ? '#15803D' :
                        selectedRequest.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#B45309' :
                        selectedRequest.crossCheck.complianceStatus === 'ZERO_OT' ? '#B91C1C' :
                        selectedRequest.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#B91C1C' : '#475569'
                    }}>
                      {selectedRequest.crossCheck.complianceTitle}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: '0.74rem', color: '#1E293B', backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Ca chuẩn</div>
                      <strong>08:00 - {selectedRequest.crossCheck.shiftEndTime || '17:30'}</strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Quẹt ra thực tế</div>
                      <strong style={{ color: selectedRequest.crossCheck.checkOutFormatted ? '#0F172A' : '#EF4444' }}>
                        {selectedRequest.crossCheck.checkOutFormatted || 'Chưa có log'}
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Ở lại sau ca</div>
                      <strong style={{ color: selectedRequest.crossCheck.stayHours > 0 ? '#15803D' : '#EF4444' }}>
                        {selectedRequest.crossCheck.stayHours} giờ
                      </strong>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    color:
                      selectedRequest.crossCheck.complianceStatus === 'QUALIFIED' ? '#166534' :
                      selectedRequest.crossCheck.complianceStatus === 'UNDER_HOURS' ? '#92400E' :
                      selectedRequest.crossCheck.complianceStatus === 'ZERO_OT' ? '#991B1B' :
                      selectedRequest.crossCheck.complianceStatus === 'NO_CHECKOUT' ? '#991B1B' : '#475569',
                    lineHeight: 1.4
                  }}>
                    {selectedRequest.crossCheck.complianceMessage}
                  </div>
                </div>
              )}

              {selectedRequest.status !== 'PENDING' ? (
                /* CHẾ ĐỘ XEM LẠI (ĐÃ XỬ LÝ) */
                <>
                  <div style={{
                    backgroundColor: selectedRequest.status === 'APPROVED' ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${selectedRequest.status === 'APPROVED' ? '#BBF7D0' : '#FECACA'}`,
                    borderRadius: '0.5rem',
                    padding: '0.85rem'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: selectedRequest.status === 'APPROVED' ? '#166534' : '#991B1B', fontWeight: 600 }}>
                      Kết quả xử lý đơn:
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: selectedRequest.status === 'APPROVED' ? '#15803D' : '#B91C1C', marginTop: 2 }}>
                      {selectedRequest.status === 'APPROVED'
                        ? `${Number(selectedRequest.actualHours || selectedRequest.requestHours).toFixed(1)} giờ (Tính tiền lương)`
                        : 'Đã từ chối đơn làm thêm (0 giờ OT)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                      Số giờ đăng ký ban đầu: <strong>{Number(selectedRequest.requestHours).toFixed(1)}h</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(false)}
                      className="btn btn-outline"
                      style={{ minWidth: 90, borderColor: '#CBD5E1', color: '#334155' }}
                    >
                      Đóng
                    </button>
                  </div>
                </>
              ) : (
                /* CHẾ ĐỘ PHÊ DUYỆT (PENDING) */
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', margin: 0 }}>
                        Số giờ nghiệm thu thực tế (tính lương) <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      {selectedRequest.crossCheck?.suggestedHours !== undefined && (
                        <button
                          type="button"
                          onClick={() => setActualHoursInput(selectedRequest.crossCheck.suggestedHours)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            textDecoration: 'underline'
                          }}
                        >
                          Điền theo máy ({selectedRequest.crossCheck.suggestedHours}h)
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="4"
                      className="form-input w-full"
                      value={actualHoursInput}
                      onChange={e => setActualHoursInput(e.target.value)}
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: Number(actualHoursInput) > 0 ? '#15803D' : '#EF4444'
                      }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Số giờ xin trên đơn: <strong>{Number(selectedRequest.requestHours).toFixed(1)}h</strong></span>
                      <span>Đề xuất từ máy chấm công: <strong>{selectedRequest.crossCheck?.suggestedHours ?? 0}h</strong></span>
                    </div>

                    {selectedRequest.crossCheck && Number(actualHoursInput) > (selectedRequest.crossCheck.stayHours || 0) && (
                      <div style={{
                        marginTop: 6,
                        padding: '6px 8px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        color: '#B45309'
                      }}>
                        ⚠️ <strong>Lưu ý:</strong> Bạn đang nhập {actualHoursInput}h, lớn hơn số giờ quẹt thẻ ở lại sau ca ({selectedRequest.crossCheck.stayHours || 0}h). Vui lòng ghi rõ lý do đặc cách bên dưới.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                      Ghi chú phê duyệt / Lý do đặc cách (nếu có)
                    </label>
                    <input
                      type="text"
                      className="form-input w-full"
                      placeholder="VD: Xác nhận nhân viên ở lại làm việc đủ giờ / Đã kiểm tra camera..."
                      value={reviewNoteInput}
                      onChange={e => setReviewNoteInput(e.target.value)}
                      style={{ fontSize: '0.78rem' }}
                    />
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
                      style={{
                        backgroundColor: Number(actualHoursInput) > 0 ? '#15803D' : '#64748B',
                        borderColor: Number(actualHoursInput) > 0 ? '#15803D' : '#64748B'
                      }}
                    >
                      {submittingReview ? 'Đang duyệt...' : 'Xác nhận Phê duyệt'}
                    </button>
                  </div>
                </>
              )}
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
                <DateInput
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

      {/* MODAL XÁC NHẬN XÓA ĐƠN OT (THAY THẾ CONFIRM POPUP CỦA BROWSER) */}
      {deleteModalOpen && selectedDeleteRequest && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '0.75rem',
            width: '100%', maxWidth: 430, overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#DC2626', flexShrink: 0
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                    Xác nhận xóa đơn làm thêm giờ
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                    Bạn có chắc chắn muốn xóa đơn làm thêm này không? Dữ liệu sau khi xóa sẽ không thể khôi phục.
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem',
                padding: '0.75rem 0.9rem', fontSize: '0.78rem', color: '#334155', lineHeight: 1.55
              }}>
                <div>Nhân viên: <strong>{selectedDeleteRequest.employee?.fullName} ({selectedDeleteRequest.employee?.code})</strong></div>
                <div>Ngày làm thêm: <strong>{new Date(selectedDeleteRequest.date).toLocaleDateString('vi-VN')}</strong> ({Number(selectedDeleteRequest.requestHours).toFixed(1)} giờ)</div>
                <div>Lý do: <em>{selectedDeleteRequest.reason || 'Làm thêm dự án'}</em></div>
                <div style={{ marginTop: 2 }}>
                  Trạng thái hiện tại: <span style={{
                    fontWeight: 700,
                    color: selectedDeleteRequest.status === 'APPROVED' ? '#15803D' : selectedDeleteRequest.status === 'REJECTED' ? '#B91C1C' : '#B45309'
                  }}>
                    {selectedDeleteRequest.status === 'APPROVED' ? 'Đã duyệt' : selectedDeleteRequest.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  disabled={submittingDelete}
                  onClick={() => { setDeleteModalOpen(false); setSelectedDeleteRequest(null); }}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={submittingDelete}
                  onClick={confirmDeleteOT}
                  className="btn btn-danger"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', backgroundColor: '#DC2626', borderColor: '#DC2626', color: '#FFFFFF' }}
                >
                  {submittingDelete ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

