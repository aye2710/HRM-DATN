import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarRange, Plus, CheckCircle2, Clock, XCircle,
  FileText, Calendar, X, Info
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../components/common/TablePagination';
import { DateInput } from '../../components/common/DateInput';
import { formatDate } from '../../utils/dateUtils';
import { PageHeader } from '../../components/common/PageHeader';

export const EmployeeLeave = () => {
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState({ totalDays: 12, usedDays: 0, carryForwardDays: 0, carryForwardUsed: 0 });
  const [quotaInfo, setQuotaInfo] = useState({ baseDays: 12, seniorityBonusDays: 0, yearsOfService: 0, approvalThreshold: 2 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const employeeId = localStorage.getItem('employeeId');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    leaveType: 'PAID',
    session: 'ALL_DAY',
    startSession: 'MORNING',
    endSession: 'AFTERNOON',
    startDate: '',
    endDate: '',
    handoverPerson: '',
    reason: ''
  });

  const fetchData = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    try {
      const [res, typesRes] = await Promise.all([
        axios.get(`/api/leaves/employee/${employeeId}`),
        axios.get('/api/leave-config/types').catch(() => ({ data: [] }))
      ]);
      setRequests(res.data.requests || []);
      if (res.data.balance) {
        setBalance(res.data.balance);
      }
      if (res.data.quotaInfo) {
        setQuotaInfo(res.data.quotaInfo);
      }
      const types = typesRes.data || [];
      setLeaveTypes(types);
      if (types.length > 0) {
        setFormData(prev => (prev.leaveTypeId ? prev : {
          ...prev,
          leaveTypeId: types[0].id,
          leaveType: types[0].paid ? 'PAID' : 'UNPAID'
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu nghỉ phép:', error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      return toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return toast.error('Ngày kết thúc không thể trước ngày bắt đầu');
    }

    setSubmitting(true);
    try {
      await axios.post('/api/leaves', {
        employeeId,
        ...formData
      });
      toast.success('Đã gửi đơn xin nghỉ phép thành công!');
      setShowModal(false);
      setFormData({ leaveType: 'PAID', session: 'ALL_DAY', startDate: '', endDate: '', handoverPerson: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi nộp đơn xin nghỉ');
    } finally {
      setSubmitting(false);
    }
  };


  const calculateDays = (start, end, session = 'ALL_DAY') => {
    if (!start || !end) return 0;
    if (start === end && (session === 'MORNING' || session === 'AFTERNOON')) {
      return 0.5;
    }
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = Number(balance.totalDays ?? 12);
  const carryRemain = Math.max(0, Number(balance.carryForwardDays || 0) - Number(balance.carryForwardUsed || 0));
  const usedDays = Number(balance.usedDays || 0);
  const rawRemain = totalDays - usedDays + carryRemain;
  const availableDays = Math.max(0, rawRemain);
  const usedPercent = totalDays > 0 ? Math.min(100, Math.round((usedDays / totalDays) * 100)) : 0;

  const leaveDaysCount = formData.startDate && formData.endDate 
    ? calculateDays(formData.startDate, formData.endDate, formData.session) 
    : 0;

  // Kiểm tra thời hạn báo trước theo Company-wide Policies (cập nhật 14/10/2026: >= 48 giờ làm việc)
  const isUrgentNotice = useMemo(() => {
    if (!formData.startDate) return false;
    const start = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffHours = (start.getTime() - today.getTime()) / (1000 * 60 * 60);
    return diffHours < 48;
  }, [formData.startDate]);

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (typeFilter === 'PAID' && req.leaveType === 'UNPAID') return false;
    if (typeFilter === 'UNPAID' && req.leaveType !== 'UNPAID') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const reason = String(req.reason || '').toLowerCase();
      const typeName = String(req.leaveTypeConfig?.name || '').toLowerCase();
      if (!reason.includes(q) && !typeName.includes(q)) return false;
    }
    return true;
  });

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
  }, [statusFilter, typeFilter, searchQuery, resetPage]);

  const getLeaveTypeBadge = (req) => {
    if (req?.leaveTypeConfig?.name) {
      const isPaid = req.leaveTypeConfig.paid;
      const isBHXH = req.leaveTypeConfig.paidBy === 'SOCIAL_INSURANCE';
      return {
        text: req.leaveTypeConfig.name,
        deductAnnual: req.leaveTypeConfig.deductAnnualLeave,
        isBHXH,
        bg: isPaid ? '#EFF6FF' : (isBHXH ? '#F3E8FF' : '#F1F5F9'),
        color: isPaid ? '#2563EB' : (isBHXH ? '#7C3AED' : '#475569')
      };
    }
    const type = typeof req === 'string' ? req : req?.leaveType;
    switch (type) {
      case 'PAID':
        return { text: 'Nghỉ phép năm (Có lương)', bg: '#EFF6FF', color: '#2563EB' };
      case 'SICK':
        return { text: 'Nghỉ ốm / Khám bệnh', bg: '#FDF2F8', color: '#DB2777' };
      case 'UNPAID':
        return { text: 'Nghỉ không lương', bg: '#F1F5F9', color: '#475569' };
      case 'PERSONAL':
        return { text: 'Việc cá nhân', bg: '#FEF3C7', color: '#D97706' };
      default:
        return { text: type || 'Phép năm', bg: '#EFF6FF', color: '#2563EB' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return { text: 'Đã duyệt', bg: '#ECFDF5', color: '#059669', icon: <CheckCircle2 size={14} /> };
      case 'REJECTED':
        return { text: 'Từ chối', bg: '#FEF2F2', color: '#DC2626', icon: <XCircle size={14} /> };
      case 'PENDING':
      default:
        return { text: 'Chờ phê duyệt', bg: '#FFFBEB', color: '#D97706', icon: <Clock size={14} /> };
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header chuẩn đồng bộ */}
      <PageHeader
        icon={<CalendarRange size={20} />}
        title="Quản lý Nghỉ phép (My Leave)"
        subtitle="Theo dõi quỹ phép năm, trạng thái phê duyệt đơn nghỉ và nộp đơn trực tuyến."
        actions={
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
            style={{
              height: '40px',
              padding: '0 1.2rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Plus size={18} /> Tạo đơn xin nghỉ mới
          </button>
        }
      />

      {/* 2. Thẻ Thống Kê Quỹ Phép Hiện Đại & Trực Quan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Tổng Phép */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tổng phép năm
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginTop: '0.25rem' }}>
                {totalDays} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8' }}>ngày</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <Info size={14} color="#2563EB" /> 
            <span>{quotaInfo.baseDays || 12} ngày tiêu chuẩn</span>
            {quotaInfo.seniorityBonusDays > 0 ? (
              <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                +{quotaInfo.seniorityBonusDays} ngày thâm niên ({quotaInfo.yearsOfService} năm - Điều 114 BLLĐ)
              </span>
            ) : (
              <span>• Thâm niên {quotaInfo.yearsOfService || 0} năm (+1 ngày / 5 năm)</span>
            )}
            <span style={{ color: '#94A3B8' }}>• Mốc cắt ngày {quotaInfo.cutoffDay || 15} (SOP LLA)</span>
          </div>
        </div>

        {/* Card 2: Đã Nghỉ */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Đã sử dụng
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1, marginTop: '0.25rem' }}>
                {usedDays} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8' }}>ngày</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          
          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '0.35rem' }}>
              <span>Tỷ lệ đã dùng</span>
              <strong style={{ color: '#D97706' }}>{usedPercent}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPercent}%`, backgroundColor: '#D97706', borderRadius: '9999px' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Còn Lại */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Phép khả dụng còn lại
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: availableDays > 0 ? '#059669' : '#DC2626', lineHeight: 1.1, marginTop: '0.25rem' }}>
                {availableDays} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8' }}>ngày</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: availableDays > 0 ? '#ECFDF5' : '#FEF2F2', color: availableDays > 0 ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: availableDays > 0 ? '#059669' : '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {availableDays > 0
              ? `✓ Đủ điều kiện đăng ký nghỉ có hưởng lương${carryRemain > 0 ? ` (gồm ${carryRemain} ngày tồn)` : ''}`
              : rawRemain < 0
                ? `⚠ Đã vượt quỹ phép ${Math.abs(rawRemain)} ngày (đơn mới tính không lương)`
                : '⚠ Đã hết quỹ phép năm (đơn mới sẽ tính nghỉ không lương)'}
          </div>
        </div>

      </div>

      {/* 3. Lịch Sử Đơn Xin Nghỉ Phép (Bảng chuẩn Enterprise) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        {/* Table Toolbar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
              Lịch sử nộp đơn xin nghỉ phép
            </h3>
            <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Hiển thị danh sách các đơn đã nộp và tiến độ xét duyệt từ Quản lý & HR
            </span>
          </div>

          {/* Filter Status & Type & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo lý do, loại nghỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 190, height: 34, fontSize: '0.8rem' }}
            />
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: 'auto', height: 34, fontSize: '0.8rem' }}
            >
              <option value="ALL">Tất cả loại nghỉ</option>
              <option value="PAID">Nghỉ có lương</option>
              <option value="UNPAID">Nghỉ không lương</option>
            </select>
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#F8FAFC', padding: '3px', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              {[
                { key: 'ALL', label: `Tất cả (${requests.length})`, activeColor: '#2563EB' },
                { key: 'PENDING', label: 'Chờ duyệt', activeColor: '#D97706' },
                { key: 'APPROVED', label: 'Đã duyệt', activeColor: '#059669' },
                { key: 'REJECTED', label: 'Từ chối', activeColor: '#DC2626' }
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  style={{
                    border: 'none',
                    background: statusFilter === st.key ? '#FFFFFF' : 'transparent',
                    color: statusFilter === st.key ? st.activeColor : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    boxShadow: statusFilter === st.key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            Đang tải dữ liệu lịch sử nghỉ phép...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <FileText size={26} />
            </div>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              Chưa có đơn xin nghỉ phép nào
            </h4>
            <p style={{ margin: '0 0 1.25rem 0', color: '#64748B', fontSize: '0.875rem' }}>
              Khi bạn cần nghỉ phép, hãy bấm nút tạo đơn để gửi phê duyệt đến quản lý.
            </p>
            <button 
              className="btn btn-outline" 
              onClick={() => setShowModal(true)}
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
            >
              <Plus size={15} /> Tạo đơn ngay
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Mã Đơn</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Loại Nghỉ</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Thời Gian Nghỉ</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Số Ngày</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Lý Do</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req, idx) => {
                  const typeBadge = getLeaveTypeBadge(req);
                  const statusBadge = getStatusBadge(req.status);
                  const countDays = calculateDays(req.startDate, req.endDate, req.session);

                  return (
                    <tr 
                      key={req.id || idx}
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#2563EB' }}>
                        #{req.id ? req.id.substring(0, 8).toUpperCase() : `LR-${idx+1}`}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          backgroundColor: typeBadge.bg,
                          color: typeBadge.color,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {typeBadge.text}
                          {req.session === 'MORNING' ? ' • Nửa ngày sáng' : req.session === 'AFTERNOON' ? ' • Nửa ngày chiều' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#1E293B', fontWeight: 500 }}>
                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0F172A' }}>
                        {countDays} ngày
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.reason || '---'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.color,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          {statusBadge.icon} {statusBadge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

      {/* 4. MODAL: TẠO ĐƠN XIN NGHỈ PHÉP SANG TRỌNG */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(to right, rgba(37,99,235,0.05), transparent)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Tạo đơn xin nghỉ phép
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Đơn sẽ được tự động gửi đến Quản lý trực tiếp phê duyệt
                </span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Loại nghỉ phép <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={formData.leaveTypeId}
                  onChange={e => {
                    const selected = leaveTypes.find(t => t.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      leaveTypeId: e.target.value,
                      leaveType: selected?.paid ? 'PAID' : 'UNPAID' 
                    });
                  }}
                  style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC' }}
                >
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.deductAnnualLeave ? `(Trừ quỹ phép - Còn ${availableDays} ngày)` : '(Hưởng chế độ riêng - Không trừ phép năm)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Banner hướng dẫn quyền lợi lao động theo loại phép đã chọn */}
              {(() => {
                const currentType = leaveTypes.find(t => t.id === formData.leaveTypeId);
                if (!currentType) return null;
                return (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    lineHeight: '1.4',
                    backgroundColor: currentType.deductAnnualLeave ? '#EFF6FF' : (currentType.paidBy === 'SOCIAL_INSURANCE' ? '#FAF5FF' : '#F0FDF4'),
                    color: currentType.deductAnnualLeave ? '#1D4ED8' : (currentType.paidBy === 'SOCIAL_INSURANCE' ? '#6B21A8' : '#15803D'),
                    border: `1px solid ${currentType.deductAnnualLeave ? '#BFDBFE' : (currentType.paidBy === 'SOCIAL_INSURANCE' ? '#E9D5FF' : '#BBF7D0')}`
                  }}>
                    {currentType.deductAnnualLeave && (
                      <div><strong>Phép năm:</strong> Trừ trực tiếp vào Quỹ phép năm của bạn (Khả dụng: <strong>{availableDays} ngày</strong>). Hưởng nguyên lương.</div>
                    )}
                    {!currentType.deductAnnualLeave && currentType.paidBy === 'COMPANY' && (
                      <div><strong>Nghỉ việc riêng hưởng nguyên lương (Điều 115 BLLĐ 2019):</strong> Công ty chi trả 100% lương và <strong>KHÔNG trừ vào 12 ngày phép năm</strong>.{currentType.maxDaysPerOccasion ? ` Tối đa ${currentType.maxDaysPerOccasion} ngày/lần.` : ''}</div>
                    )}
                    {currentType.paidBy === 'SOCIAL_INSURANCE' && (
                      <div><strong>Chế độ Bảo hiểm Xã hội (BHXH) chi trả:</strong> Cơ quan BHXH chi trả tiền trợ cấp, công ty không trả lương và <strong>KHÔNG trừ vào quỹ phép năm</strong>. Vui lòng nộp minh chứng giấy tờ kèm theo.</div>
                    )}
                    {currentType.paidBy === 'NONE' && (
                      <div><strong>Nghỉ không hưởng lương (Khoản 3 Điều 115 BLLĐ):</strong> Nghỉ việc riêng không hưởng lương và không trừ vào quỹ phép năm.</div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Từ ngày <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <DateInput
                    required
                    className="form-input"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Đến ngày <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <DateInput
                    required
                    className="form-input"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC' }}
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && formData.startDate === formData.endDate && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Thời gian nghỉ trong ngày
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { value: 'ALL_DAY', label: 'Cả ngày (1.0)' },
                      { value: 'MORNING', label: 'Sáng (0.5)' },
                      { value: 'AFTERNOON', label: 'Chiều (0.5)' }
                    ].map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, session: opt.value })}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: formData.session === opt.value ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          backgroundColor: formData.session === opt.value ? '#EFF6FF' : '#FFFFFF',
                          color: formData.session === opt.value ? '#1D4ED8' : '#475569',
                          fontWeight: formData.session === opt.value ? 700 : 500,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.startDate && formData.endDate && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#EFF6FF',
                    fontSize: '0.8125rem',
                    color: '#1E40AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>Tổng số ngày đăng ký nghỉ:</span>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {leaveDaysCount} ngày
                    </strong>
                  </div>

                  {(() => {
                    const currentType = leaveTypes.find(t => t.id === formData.leaveTypeId);
                    const deductsAnnual = currentType ? currentType.deductAnnualLeave : formData.leaveType === 'PAID';
                    if (!deductsAnnual || leaveDaysCount <= 0) return null;
                    const projected = availableDays - leaveDaysCount;
                    const overQuota = projected < 0;
                    return (
                      <div style={{
                        padding: '0.55rem 0.85rem',
                        borderRadius: '0.5rem',
                        backgroundColor: overQuota ? '#FEF2F2' : '#F0FDF4',
                        border: `1px solid ${overQuota ? '#FECACA' : '#BBF7D0'}`,
                        fontSize: '0.78rem',
                        color: overQuota ? '#991B1B' : '#166534',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Dự kiến quỹ phép sau đơn này:</span>
                        <strong>
                          {overQuota
                            ? `Vượt ${Math.abs(projected)} ngày (Còn ${availableDays} ngày)`
                            : `Còn ${projected} / ${availableDays} ngày`}
                        </strong>
                      </div>
                    );
                  })()}

                  {/* Cảnh báo hạn báo trước theo Company-wide Policies (14/10/2026) */}
                  {isUrgentNotice && (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      fontSize: '0.78rem',
                      color: '#92400E',
                      lineHeight: 1.45
                    }}>
                      <strong>⚠️ Nộp sát ngày (&lt; 48 giờ làm việc):</strong> Theo Company-wide Policies, đơn cần gửi trước &ge; 48 giờ. Trường hợp nghỉ đột xuất / bất khả kháng, bạn vui lòng báo ngay Trưởng bộ phận và bổ sung đơn trong vòng 3 ngày.
                    </div>
                  )}

                  {/* Quy định bàn giao & duyệt cấp BGĐ nếu nghỉ vượt ngưỡng LEAVE_APPROVAL_THRESHOLD */}
                  {leaveDaysCount > (quotaInfo.approvalThreshold || 2) && (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      fontSize: '0.78rem',
                      color: '#166534',
                      lineHeight: 1.45
                    }}>
                      <strong>📋 Nghỉ trên {quotaInfo.approvalThreshold || 2} ngày ({leaveDaysCount} ngày):</strong> Đơn nghỉ dài ngày sẽ được chuyển lên <strong>Ban Giám Đốc phê duyệt</strong> và bắt buộc chỉ định <strong>Người nhận bàn giao công việc</strong> bên dưới.
                    </div>
                  )}
                </div>
              )}

              {leaveDaysCount > (quotaInfo.approvalThreshold || 2) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Người nhận bàn giao công việc trong thời gian nghỉ <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.handoverPerson}
                    onChange={e => setFormData({ ...formData, handoverPerson: e.target.value })}
                    placeholder="VD: Nguyễn Văn B (Chuyên viên cùng bộ phận) - Đã bàn giao hồ sơ..."
                    style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC', borderColor: '#3B82F6' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Lý do xin nghỉ & Kế hoạch công việc <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="form-input"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={leaveDaysCount >= 3 
                    ? "Ghi rõ lý do nghỉ, người nhận bàn giao công việc & Link Jira/Confluence task..." 
                    : "Ghi rõ lý do xin nghỉ và kế hoạch sắp xếp công việc..."}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F8FAFC', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  style={{ height: '40px', padding: '0 1rem', fontWeight: 600 }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ height: '40px', padding: '0 1.25rem', fontWeight: 600 }}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đơn phê duyệt'}
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
