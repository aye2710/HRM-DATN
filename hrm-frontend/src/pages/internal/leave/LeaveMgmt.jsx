import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  CalendarRange, Search, CheckCircle, XCircle, Plus, 
  RotateCw, RotateCcw, UserCheck, ShieldAlert, ArrowRight, Clock, 
  Check, X, Building2, Calendar
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';

export const LeaveMgmt = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // States bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL');

  // State Modal Tạo đơn nhanh cho HR
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    leaveType: 'PAID',
    session: 'ALL_DAY',
    startDate: '2026-11-24',
    endDate: '2026-11-24',
    handoverPerson: '',
    reason: ''
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const [leavesRes, empsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/leaves'),
        axios.get('http://localhost:5000/api/employees').catch(() => ({ data: [] }))
      ]);
      setLeaves(leavesRes.data || []);
      setEmployees(empsRes.data || []);
      if (empsRes.data?.length > 0 && !createForm.employeeId) {
        setCreateForm(prev => ({ ...prev, employeeId: empsRes.data[0].id }));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu nghỉ phép:', err);
      toast.error('Lỗi tải danh sách đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Xử lý Duyệt / Từ chối đơn
  const handleUpdateStatus = async (id, newStatus, empName) => {
    const isApprove = newStatus === 'APPROVED';
    const actionText = isApprove ? 'Duyệt' : 'Từ chối';
    
    const result = await Swal.fire({
      title: `Xác nhận ${actionText} đơn?`,
      html: `Bạn có chắc muốn <b>${actionText.toLowerCase()}</b> đơn xin nghỉ của <b>${empName || 'nhân viên này'}</b>?<br/><span style="font-size:0.85rem;color:#64748B;">${isApprove ? 'Nếu duyệt, hệ thống sẽ tự động trừ quỹ phép năm và ghi nhận ngày công sang Bảng chấm công.' : 'Nếu từ chối, số ngày phép tạm khóa sẽ được hoàn trả về quỹ phép của nhân viên.'}</span>`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Xác nhận duyệt' : 'Từ chối đơn',
      cancelButtonText: 'Đóng',
      confirmButtonColor: isApprove ? '#16A34A' : '#DC2626'
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}/status`, { status: newStatus });
      toast.success(`Đã ${actionText.toLowerCase()} đơn nghỉ phép thành công!`);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái đơn');
    }
  };

  // Thu hồi đơn nghỉ phép đã duyệt
  const handleRevokeStatus = async (id, empName) => {
    const result = await Swal.fire({
      title: 'Thu hồi đơn nghỉ phép đã duyệt?',
      html: `Bạn có chắc muốn <b>thu hồi</b> đơn nghỉ phép đã duyệt của <b>${empName || 'nhân viên này'}</b>?<br/><span style="font-size:0.85rem;color:#DC2626;">Hệ thống sẽ tự động hoàn trả số ngày phép về quỹ phép và rollback trạng thái ON_LEAVE trên Bảng chấm công.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận thu hồi',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#DC2626'
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}/status`, { status: 'REJECTED' });
      toast.success('Đã thu hồi đơn và hoàn lại ngày phép, bảng công thành công!');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi thu hồi đơn nghỉ phép');
    }
  };

  // Tạo đơn nghỉ phép mới từ HR
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.employeeId || !createForm.startDate || !createForm.endDate) {
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/leaves', createForm);
      toast.success('Lập đơn xin nghỉ phép thành công!');
      setShowCreateModal(false);
      setCreateForm({
        employeeId: employees[0]?.id || '',
        leaveType: 'PAID',
        session: 'ALL_DAY',
        startDate: '2026-11-24',
        endDate: '2026-11-24',
        handoverPerson: '',
        reason: ''
      });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi nộp đơn nghỉ phép');
    } finally {
      setSubmitting(false);
    }
  };

  // Danh sách phòng ban duy nhất để lọc
  const departments = useMemo(() => {
    const set = new Set();
    leaves.forEach(l => {
      if (l.employee?.department?.name) set.add(l.employee.department.name);
    });
    return Array.from(set);
  }, [leaves]);

  // Bộ lọc dữ liệu
  const filteredLeaves = useMemo(() => {
    return leaves.filter(lr => {
      // 1. Lọc theo trạng thái
      if (statusFilter !== 'ALL' && lr.status !== statusFilter) return false;

      // 2. Lọc theo loại phép
      if (leaveTypeFilter !== 'ALL' && lr.leaveType !== leaveTypeFilter) return false;

      // 3. Lọc theo tháng / năm (dựa trên ngày bắt đầu nghỉ)
      if (selectedMonth !== 'ALL' || selectedYear !== 'ALL') {
        const start = new Date(lr.startDate);
        if (selectedYear !== 'ALL' && start.getFullYear().toString() !== selectedYear) return false;
        if (selectedMonth !== 'ALL' && (start.getMonth() + 1).toString() !== selectedMonth) return false;
      }

      // 4. Lọc theo phòng ban
      if (selectedDept !== 'ALL' && lr.employee?.department?.name !== selectedDept) return false;

      // 5. Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const empName = lr.employee?.fullName?.toLowerCase() || '';
        const empCode = lr.employee?.code?.toLowerCase() || '';
        const reason = lr.reason?.toLowerCase() || '';
        if (!empName.includes(term) && !empCode.includes(term) && !reason.includes(term)) return false;
      }

      return true;
    });
  }, [leaves, statusFilter, leaveTypeFilter, selectedMonth, selectedYear, selectedDept, searchTerm]);

  // Đếm thống kê theo tháng / năm đang chọn
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    leaves.forEach(lr => {
      const start = new Date(lr.startDate);
      const matchYear = selectedYear === 'ALL' || start.getFullYear().toString() === selectedYear;
      const matchMonth = selectedMonth === 'ALL' || (start.getMonth() + 1).toString() === selectedMonth;
      if (matchYear && matchMonth) {
        if (lr.status === 'PENDING') pending++;
        else if (lr.status === 'APPROVED') approved++;
        else if (lr.status === 'REJECTED') rejected++;
      }
    });

    return {
      all: pending + approved + rejected,
      pending,
      approved,
      rejected
    };
  }, [leaves, selectedMonth, selectedYear]);

  // Phân trang
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: currentLeaves,
  } = usePagination(filteredLeaves, 10);

  // Helper tính số ngày làm việc sơ bộ hiển thị
  const formatLeaveDays = (startDate, endDate, session) => {
    if (session === 'MORNING') return '0.5 công (Sáng)';
    if (session === 'AFTERNOON') return '0.5 công (Chiều)';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    return `${days} ngày làm việc`;
  };

  // Helper tách tag bàn giao và BGĐ khỏi lý do
  const parseReason = (rawReason) => {
    if (!rawReason) return { handover: null, bgd: false, cleanText: '---' };
    let text = rawReason;
    let handover = null;
    let bgd = false;

    const handoverMatch = text.match(/\[Bàn giao:\s*([^\]]+)\]/i);
    if (handoverMatch) {
      handover = handoverMatch[1].trim();
      text = text.replace(handoverMatch[0], '').trim();
    }

    if (text.includes('[Cấp duyệt: BGĐ') || text.includes('BGĐ')) {
      bgd = true;
      text = text.replace(/\[Cấp duyệt:\s*BGĐ[^\]]*\]/gi, '').trim();
    }

    return { handover, bgd, cleanText: text || '---' };
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
              Xét Duyệt &amp; Quản Lý Nghỉ Phép
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              Điều 112, 113, 114 BLLĐ 2019
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Phê duyệt ngày nghỉ, tự động trừ số dư Quỹ phép năm và liên thông ngày công hưởng lương sang Bảng chấm công.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={fetchLeaves} 
            title="Làm mới dữ liệu"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '2.5rem', fontSize: '0.85rem' }}
          >
            <RotateCw size={15} /> Làm mới
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '2.5rem', fontWeight: 600, fontSize: '0.85rem' }}
          >
            <Plus size={18} /> Lập đơn xin nghỉ
          </button>
        </div>
      </div>

      {/* 2. Status Pill Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none',
            backgroundColor: statusFilter === 'ALL' ? '#2563EB' : '#F1F5F9',
            color: statusFilter === 'ALL' ? '#FFFFFF' : '#475569'
          }}
        >
          Tất cả <span style={{ opacity: 0.85, marginLeft: 4 }}>({counts.all})</span>
        </button>

        <button
          onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none',
            backgroundColor: statusFilter === 'PENDING' ? '#F59E0B' : '#FEF3C7',
            color: statusFilter === 'PENDING' ? '#FFFFFF' : '#92400E'
          }}
        >
          Chờ duyệt <span style={{ marginLeft: 4 }}>({counts.pending})</span>
        </button>

        <button
          onClick={() => { setStatusFilter('APPROVED'); setCurrentPage(1); }}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none',
            backgroundColor: statusFilter === 'APPROVED' ? '#16A34A' : '#DCFCE7',
            color: statusFilter === 'APPROVED' ? '#FFFFFF' : '#166534'
          }}
        >
          Đã duyệt <span style={{ marginLeft: 4 }}>({counts.approved})</span>
        </button>

        <button
          onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none',
            backgroundColor: statusFilter === 'REJECTED' ? '#DC2626' : '#FEE2E2',
            color: statusFilter === 'REJECTED' ? '#FFFFFF' : '#991B1B'
          }}
        >
          Từ chối <span style={{ marginLeft: 4 }}>({counts.rejected})</span>
        </button>
      </div>

      {/* 3. Toolbar Filters */}
      <div 
        style={{ 
          padding: '0.85rem 1rem', 
          backgroundColor: '#FFFFFF',
          borderRadius: '0.625rem',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'center', 
          flexWrap: 'wrap' 
        }}
      >
        <div style={{ position: 'relative', flex: '2 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm tên nhân sự, mã NV, lý do nghỉ..." 
            style={{ width: '100%', paddingLeft: '2.4rem', height: '2.4rem', fontSize: '0.8125rem' }}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Lọc Tháng & Năm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#F8FAFC', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
          <Calendar size={15} color="#64748B" />
          <select 
            value={selectedMonth} 
            onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
            style={{ background: 'transparent', border: 'none', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
          >
            <option value="ALL">Cả năm</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>Tháng {i + 1}</option>
            ))}
          </select>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <select 
            value={selectedYear} 
            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            style={{ background: 'transparent', border: 'none', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        {/* Lọc theo Phòng ban */}
        <div style={{ minWidth: '160px' }}>
          <select
            className="form-input"
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', height: '2.4rem', fontSize: '0.8125rem' }}
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Lọc theo Loại nghỉ */}
        <div style={{ minWidth: '150px' }}>
          <select
            className="form-input"
            value={leaveTypeFilter}
            onChange={(e) => { setLeaveTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', height: '2.4rem', fontSize: '0.8125rem' }}
          >
            <option value="ALL">Tất cả loại nghỉ</option>
            <option value="PAID">Phép năm (Có lương)</option>
            <option value="UNPAID">Nghỉ không lương</option>
          </select>
        </div>

        {(searchTerm || statusFilter !== 'ALL' || selectedMonth !== 'ALL' || selectedDept !== 'ALL' || leaveTypeFilter !== 'ALL') && (
          <button 
            className="btn btn-outline" 
            style={{ height: '2.4rem', padding: '0 0.75rem', fontSize: '0.75rem', color: '#64748B' }} 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setSelectedMonth('ALL');
              setSelectedYear(String(new Date().getFullYear()));
              setSelectedDept('ALL');
              setLeaveTypeFilter('ALL');
              setCurrentPage(1);
            }}
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* 4. Table */}
      <div 
        style={{ 
          backgroundColor: '#FFFFFF',
          borderRadius: '0.625rem',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden'
        }}
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Nhân sự</th>
                <th style={{ width: '15%' }}>Loại nghỉ &amp; Buổi</th>
                <th style={{ width: '18%' }}>Thời gian &amp; Định mức</th>
                <th style={{ width: '25%' }}>Lý do &amp; Bàn giao</th>
                <th style={{ width: '10%' }}>Trạng thái</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Đang tải danh sách đơn nghỉ phép...
                  </td>
                </tr>
              ) : currentLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Không có đơn xin nghỉ phép nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                currentLeaves.map(lr => {
                  const emp = lr.employee;
                  const { handover, bgd, cleanText } = parseReason(lr.reason);
                  const isPaid = lr.leaveType === 'PAID';
                  const startDateStr = new Date(lr.startDate).toLocaleDateString('vi-VN');
                  const endDateStr = new Date(lr.endDate).toLocaleDateString('vi-VN');
                  const isSameDate = startDateStr === endDateStr;

                  return (
                    <tr key={lr.id}>
                      {/* Cột 1: Nhân sự */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            flexShrink: 0,
                            border: '1px solid #DBEAFE'
                          }}>
                            {emp?.fullName?.charAt(0) || 'N'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                              {emp?.fullName || 'N/A'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {emp?.code} &bull; {emp?.department?.name || 'Chưa xếp phòng'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Loại nghỉ & Buổi */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isPaid ? '#ECFDF5' : '#FEF3C7',
                            color: isPaid ? '#059669' : '#D97706',
                            border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}`
                          }}>
                            {isPaid ? 'Phép năm (Có lương)' : 'Không lương'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                            {lr.session === 'ALL_DAY' && 'Cả ngày (1.0 công)'}
                            {lr.session === 'MORNING' && 'Buổi Sáng (0.5 công)'}
                            {lr.session === 'AFTERNOON' && 'Buổi Chiều (0.5 công)'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Thời gian & Định mức */}
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '2px' }}>
                          {isSameDate ? startDateStr : `${startDateStr} ➔ ${endDateStr}`}
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#F1F5F9',
                          color: '#475569'
                        }}>
                          {formatLeaveDays(lr.startDate, lr.endDate, lr.session)}
                        </span>
                      </td>

                      {/* Cột 4: Lý do & Bàn giao */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '320px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {handover && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '3px',
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE'
                              }}>
                                Bàn giao: {handover}
                              </span>
                            )}
                            {bgd && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '3px',
                                backgroundColor: '#FDF2F8',
                                color: '#BE185D',
                                border: '1px solid #FBCFE8'
                              }}>
                                Cấp duyệt: BGĐ
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }} title={lr.reason}>
                            {cleanText}
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td>
                        {lr.status === 'APPROVED' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#DCFCE7', color: '#166534' }}>
                            <Check size={12} strokeWidth={3} /> Đã duyệt
                          </span>
                        )}
                        {lr.status === 'PENDING' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            <Clock size={12} strokeWidth={2.5} /> Chờ duyệt
                          </span>
                        )}
                        {lr.status === 'REJECTED' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                            <X size={12} strokeWidth={3} /> Từ chối
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Xử lý */}
                      <td style={{ textAlign: 'center' }}>
                        {lr.status === 'PENDING' ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleUpdateStatus(lr.id, 'APPROVED', emp?.fullName)}
                              title="Phê duyệt đơn xin nghỉ"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '6px',
                                backgroundColor: '#ECFDF5',
                                color: '#16A34A',
                                border: '1px solid #A7F3D0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#16A34A'; e.currentTarget.style.color = '#FFFFFF'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ECFDF5'; e.currentTarget.style.color = '#16A34A'; }}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(lr.id, 'REJECTED', emp?.fullName)}
                              title="Từ chối đơn"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '6px',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.color = '#FFFFFF'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : lr.status === 'APPROVED' ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleRevokeStatus(lr.id, emp?.fullName)}
                              title="Thu hồi phê duyệt (Hoàn lại ngày phép & rollback bảng công)"
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                borderRadius: '5px',
                                backgroundColor: '#FFF1F2',
                                color: '#E11D48',
                                border: '1px solid #FECDD3',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E11D48'; e.currentTarget.style.color = '#FFFFFF'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFF1F2'; e.currentTarget.style.color = '#E11D48'; }}
                            >
                              <RotateCcw size={12} /> Thu hồi
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                            Đã từ chối
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
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

      {/* 5. Modal Lập đơn xin nghỉ mới cho HR (sử dụng createPortal tràn màn hình) */}
      {showCreateModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            width: '520px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarRange size={20} color="#2563EB" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Lập Đơn Xin Nghỉ Phép Mới
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Nhân sự xin nghỉ *
                </label>
                <select 
                  className="form-input"
                  style={{ width: '100%' }}
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Loại nghỉ phép *
                  </label>
                  <select 
                    className="form-input"
                    style={{ width: '100%' }}
                    value={createForm.leaveType}
                    onChange={(e) => setCreateForm({ ...createForm, leaveType: e.target.value })}
                  >
                    <option value="PAID">Phép năm (Có lương)</option>
                    <option value="UNPAID">Nghỉ việc riêng không lương</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Buổi nghỉ *
                  </label>
                  <select 
                    className="form-input"
                    style={{ width: '100%' }}
                    value={createForm.session}
                    onChange={(e) => setCreateForm({ ...createForm, session: e.target.value })}
                  >
                    <option value="ALL_DAY">Cả ngày (1.0 công)</option>
                    <option value="MORNING">Nửa ngày (Sáng - 0.5 công)</option>
                    <option value="AFTERNOON">Nửa ngày (Chiều - 0.5 công)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Từ ngày *
                  </label>
                  <input 
                    type="date"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Đến ngày *
                  </label>
                  <input 
                    type="date"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Người nhận bàn giao công việc (Bắt buộc nếu nghỉ &gt; 2 ngày)
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Hoàng Minh Tuấn (Dev Lead)"
                  style={{ width: '100%' }}
                  value={createForm.handoverPerson}
                  onChange={(e) => setCreateForm({ ...createForm, handoverPerson: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Lý do xin nghỉ phép *
                </label>
                <textarea 
                  className="form-input"
                  rows={3}
                  placeholder="Nhập lý do chi tiết..."
                  style={{ width: '100%', resize: 'none' }}
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '120px' }}
                >
                  {submitting ? 'Đang gửi...' : 'Xác nhận tạo đơn'}
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
