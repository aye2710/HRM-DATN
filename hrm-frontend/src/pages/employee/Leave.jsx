import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Plus, CheckCircle2, Clock, XCircle, AlertCircle, 
  FileText, Calendar, Filter, Sparkles, X, ChevronRight, Info
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const EmployeeLeave = () => {
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState({ totalDays: 12, usedDays: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const employeeId = localStorage.getItem('employeeId');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'PAID',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchData = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/leaves/employee/${employeeId}`);
      setRequests(res.data.requests || []);
      if (res.data.balance) {
        setBalance(res.data.balance);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu nghỉ phép:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

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
      await axios.post('http://localhost:5000/api/leaves', {
        employeeId,
        ...formData
      });
      toast.success('Đã gửi đơn xin nghỉ phép thành công!');
      setShowModal(false);
      setFormData({ leaveType: 'PAID', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi nộp đơn xin nghỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = Number(balance.totalDays) || 12;
  const usedDays = Number(balance.usedDays) || 0;
  const availableDays = Math.max(0, totalDays - usedDays);
  const usedPercent = Math.min(100, Math.round((usedDays / totalDays) * 100));

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'ALL') return true;
    return req.status === statusFilter;
  });

  const getLeaveTypeBadge = (type) => {
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
        return { text: type, bg: '#F1F5F9', color: '#475569' };
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
      
      {/* 1. Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#FFFFFF',
        padding: '1.5rem 1.75rem',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #E2E8F0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CalendarRange size={20} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Quản lý Nghỉ phép (My Leave)
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Theo dõi quỹ phép năm, trạng thái phê duyệt đơn nghỉ và nộp đơn trực tuyến.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setShowModal(true)}
          style={{
            height: '42px',
            padding: '0 1.25rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Plus size={18} /> Tạo đơn xin nghỉ mới
        </button>
      </div>

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
          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Info size={14} color="#2563EB" /> Quy định 12 ngày phép tiêu chuẩn theo HĐLĐ 2026
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
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#059669', lineHeight: 1.1, marginTop: '0.25rem' }}>
                {availableDays} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8' }}>ngày</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            ✓ Đủ điều kiện đăng ký nghỉ có hưởng lương
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

          {/* Filter Status Buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#F8FAFC', padding: '3px', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                border: 'none',
                background: statusFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'ALL' ? '#2563EB' : '#64748B',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '4px',
                boxShadow: statusFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              Tất cả ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              style={{
                border: 'none',
                background: statusFilter === 'PENDING' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'PENDING' ? '#D97706' : '#64748B',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '4px',
                boxShadow: statusFilter === 'PENDING' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              style={{
                border: 'none',
                background: statusFilter === 'APPROVED' ? '#FFFFFF' : 'transparent',
                color: statusFilter === 'APPROVED' ? '#059669' : '#64748B',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '4px',
                boxShadow: statusFilter === 'APPROVED' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              Đã duyệt
            </button>
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
                {filteredRequests.map((req, idx) => {
                  const typeBadge = getLeaveTypeBadge(req.leaveType);
                  const statusBadge = getStatusBadge(req.status);
                  const countDays = calculateDays(req.startDate, req.endDate);

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
      </div>

      {/* 4. MODAL: TẠO ĐƠN XIN NGHỈ PHÉP SANG TRỌNG */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
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
                  value={formData.leaveType}
                  onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                  style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC' }}
                >
                  <option value="PAID">Nghỉ phép năm (Có hưởng lương) - Còn {availableDays} ngày</option>
                  <option value="SICK">Nghỉ ốm đau / Đi khám bệnh (Theo chế độ BHXH)</option>
                  <option value="PERSONAL">Nghỉ việc riêng (Hiếu, hỷ - Có lương)</option>
                  <option value="UNPAID">Nghỉ việc riêng không hưởng lương</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Từ ngày <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
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
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', height: '42px', backgroundColor: '#F8FAFC' }}
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
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
                    {calculateDays(formData.startDate, formData.endDate)} ngày
                  </strong>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Lý do xin nghỉ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="form-input"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ghi rõ lý do xin nghỉ và người bàn giao công việc tạm thời (nếu có)..."
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
        </div>
      )}

    </div>
  );
};
