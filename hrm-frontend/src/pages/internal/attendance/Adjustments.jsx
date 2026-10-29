import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, Search, CheckCircle, XCircle, Plus, ArrowRight, FileCheck2, Printer, ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export const Adjustments = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [adjustments, setAdjustments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const counts = useMemo(() => {
    return {
      ALL: adjustments.length,
      PENDING: adjustments.filter(a => a.status === 'PENDING').length,
      APPROVED: adjustments.filter(a => a.status === 'APPROVED').length,
      REJECTED: adjustments.filter(a => a.status === 'REJECTED').length
    };
  }, [adjustments]);

  const filteredList = useMemo(() => {
    return adjustments.filter(adj => {
      const matchSearch =
        searchTerm === '' ||
        adj.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.employee?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || adj.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [adjustments, searchTerm, statusFilter]);

  // ============================================================================
  // CHẾ ĐỘ 1: TRANG LẬP & XEM TRƯỚC BIÊN BẢN A4 TOÀN MÀN HÌNH (KHÔNG POPUP)
  // ============================================================================
  if (viewMode === 'FORM_PAGE') {
    const parsedDate = formData.date ? new Date(formData.date) : now;
    const dayStr = String(parsedDate.getDate()).padStart(2, '0');
    const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const yearStr = parsedDate.getFullYear();
    const isLateDoc = String(formData.type || '').toLowerCase().includes('đi muộn');

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
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            padding: '2rem 2.25rem',
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000000',
            lineHeight: 1.6,
            fontSize: '15px'
          }}>
            {isLateDoc ? (
              <div>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ textDecoration: 'underline', marginBottom: '1.25rem' }}>Độc lập – Tự do – Hạnh phúc</div>
                  <div style={{ fontSize: '19px', margin: '1rem 0' }}>ĐƠN XIN PHÉP</div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Kính gửi:</strong> Trưởng bộ phận {formData.empDept}
                </div>
                <div>
                  Tên tôi là: <strong>{formData.empFullName}</strong>, hiện đang làm việc tại phòng {formData.empDept} của Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA.
                </div>
                <div>
                  Tôi xin phép được đi muộn ngày <strong>{dayStr}/{monthStr}/{yearStr}</strong> ({formData.type})
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>Lý do xin đi muộn:</strong> {formData.reason}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  Rất mong được trưởng bộ phận {formData.empDept} phê duyệt.
                </div>
                <div style={{ marginBottom: '1.25rem' }}>Trân trọng cảm ơn!</div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', marginTop: '1rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '0.75rem', width: '50%', verticalAlign: 'top' }}>
                        <strong>Trưởng bộ phận</strong><br />
                        <em>(Phê duyệt và ký tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>Ngô Xuân Cương</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.75rem', width: '50%', verticalAlign: 'top' }}>
                        <em>Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}</em><br />
                        <strong>Người làm đơn</strong><br />
                        <em>(Ký tên)</em>
                        <div style={{ height: '55px' }} />
                        <strong>{formData.empFullName}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div>Độc lập – Tự do – Hạnh phúc</div>
                  <div>—–</div>
                </div>
                <div style={{ textAlign: 'right', fontStyle: 'italic', margin: '0.5rem 0 1rem' }}>
                  Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}
                </div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '19px', marginBottom: '1rem' }}>
                  ĐƠN XIN XÁC NHẬN CHẤM CÔNG
                </div>

                <div style={{ marginBottom: '0.75rem', paddingLeft: '1.25rem' }}>
                  <strong>Kính gửi:</strong> - Giám đốc Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA<br />
                  <span style={{ paddingLeft: '4.1rem' }}>- Phòng HCNS - Kế Toán</span><br />
                  <span style={{ paddingLeft: '4.1rem' }}>- Trưởng bộ phận {formData.empDept}</span>
                </div>

                <div>Tên tôi là: <strong>{formData.empFullName}</strong></div>
                <div>Chức vụ: <strong>{formData.empPos}</strong></div>
                <div>Bộ phận: <strong>{formData.empDept}</strong></div>

                <div style={{ marginTop: '0.5rem', textAlign: 'justify' }}>
                  Nay tôi làm đơn này kính mong Giám đốc Công ty, Phòng HCNS - Kế Toán, trưởng bộ phận (nơi bạn trực tiếp làm việc) {formData.empDept} xác nhận chấm công làm việc của tôi theo đúng thời gian tôi đã làm việc tại công ty trong tháng vừa qua. Trong đó:
                </div>
                <div style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
                  Xin chấm công ngày {dayStr} tháng {monthStr} năm {yearStr}: {formData.reason}
                </div>
                <div>
                  Tôi cam đoan những thông tin tôi trình bày ở trên là đúng sự thật và xin chịu mọi trách nhiệm trước pháp luật.
                </div>
                <div style={{ marginBottom: '1.25rem' }}>Tôi xin chân thành cảm ơn!</div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', marginTop: '1rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                        <strong>TP. HCNS-KT</strong><br />
                        <em>(Xác nhận, ký, ghi rõ họ tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>{formData.status === 'APPROVED' ? 'Đã phê duyệt' : ''}</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                        <strong>Trưởng bộ phận</strong><br />
                        <em>(Xác nhận, ký, ghi rõ họ tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>Ngô Xuân Cương</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                        <strong>Người làm đơn</strong><br />
                        <em>(Ký, ghi rõ họ tên)</em>
                        <div style={{ height: '75px' }} />
                        <strong>{formData.empFullName}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CHẾ ĐỘ 2: DANH SÁCH ĐƠN XÁC NHẬN CHẤM CÔNG & ĐƠN XIN ĐI MUỘN
  // ============================================================================
  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* 1. Compact Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.9rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            backgroundColor: '#FEF3C7', color: '#D97706',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <FileCheck2 size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Phê duyệt Đơn Xác Nhận Chấm Công &amp; Đơn Xin Đi Muộn (Công ty LLA)
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
              Tiếp nhận biên bản đã có chữ ký Trưởng bộ phận (PM). Đi muộn 5p–1h có đơn được tính đủ công tối đa <strong>3 lần/tháng</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/internal/attendance/records')}
            style={{ height: 34, padding: '0 0.8rem', fontSize: '0.8rem' }}
          >
            Xem Bảng công Ma trận
          </button>
          <button
            className="btn btn-primary"
            onClick={openNewFormPage}
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem' }}
          >
            <Plus size={15} /> Mở trang lập đơn mới
          </button>
        </div>
      </div>

      {/* 2. Bộ lọc Tab Trạng thái & Tìm kiếm */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả đơn', count: counts.ALL },
              { id: 'PENDING', label: 'Chờ HCNS-KT duyệt', count: counts.PENDING, badgeColor: '#FEF3C7', textColor: '#B45309' },
              { id: 'APPROVED', label: 'Đã xác nhận công', count: counts.APPROVED, badgeColor: '#DCFCE7', textColor: '#15803D' },
              { id: 'REJECTED', label: 'Đã từ chối', count: counts.REJECTED, badgeColor: '#FEE2E2', textColor: '#B91C1C' }
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: active ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                    color: active ? '#1D4ED8' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {tab.label}
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    backgroundColor: tab.badgeColor || '#F1F5F9',
                    color: tab.textColor || '#334155'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Tìm tên, mã NV, lý do..." 
                className="form-input"
                style={{ paddingLeft: '2.1rem', width: '100%', height: 34, fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchAdjustments}
              className="btn btn-outline"
              style={{ height: 34, padding: '0 0.6rem' }}
              title="Làm mới"
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        {/* 3. Bảng Danh sách Đơn */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.73rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1.1rem', textAlign: 'left', fontWeight: 700 }}>Nhân sự</th>
                <th style={{ padding: '0.75rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Ngày &amp; Loại Biên bản</th>
                <th style={{ padding: '0.75rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Log Máy ➔ Kết quả xác nhận</th>
                <th style={{ padding: '0.75rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Lý do trình bày</th>
                <th style={{ padding: '0.75rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1.1rem', textAlign: 'right', fontWeight: 700 }}>Biên bản &amp; Duyệt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Đang tải danh sách đơn...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    Không có đơn nào trong mục này.
                  </td>
                </tr>
              ) : (
                filteredList.map(adj => (
                  <tr key={adj.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: adj.status === 'PENDING' ? '#FFFDF5' : '#FFFFFF' }}>
                    <td style={{ padding: '0.75rem 1.1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          backgroundColor: '#EFF6FF', color: '#1D4ED8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                        }}>
                          {adj.employee?.fullName?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{adj.employee?.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {adj.employee?.code} {adj.employee?.department?.name ? `• ${adj.employee.department.name}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 0.9rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                        {new Date(adj.date).toLocaleDateString('vi-VN')}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: String(adj.type).toLowerCase().includes('đi muộn') ? '#FEF3C7' : '#EFF6FF',
                        color: String(adj.type).toLowerCase().includes('đi muộn') ? '#B45309' : '#1D4ED8',
                        border: String(adj.type).toLowerCase().includes('đi muộn') ? '1px solid #FDE68A' : '1px solid #BFDBFE',
                        whiteSpace: 'nowrap'
                      }}>
                        {adj.type}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 0.9rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'monospace', fontSize: '0.76rem', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#B45309', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          ⚠ {adj.oldTime || 'Thiếu vân tay'}
                        </span>
                        <ArrowRight size={13} color="#64748B" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {adj.newTime}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 0.9rem', color: '#334155', maxWidth: '260px', lineHeight: 1.4 }}>
                      {adj.reason}
                    </td>

                    <td style={{ padding: '0.75rem 0.9rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {adj.status === 'PENDING' && (
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', whiteSpace: 'nowrap' }}>
                          Chờ duyệt
                        </span>
                      )}
                      {adj.status === 'APPROVED' && (
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap' }}>
                          Đã xác nhận công
                        </span>
                      )}
                      {adj.status === 'REJECTED' && (
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#B91C1C', whiteSpace: 'nowrap' }}>
                          Từ chối
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 28px)', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => openViewDocPage(adj)}
                          className="btn btn-outline"
                          style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', borderColor: '#bfdbfe' }}
                          title="Mở trang Xem & In biên bản chuẩn Công ty LLA"
                        >
                          <Printer size={14} />
                        </button>
                        {adj.status === 'PENDING' ? (
                          <>
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
                                justifyContent: 'center'
                              }}
                              title="Phê duyệt đơn và cập nhật bảng công"
                            >
                              <CheckCircle size={14} />
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
                              title="Từ chối đơn giải trình"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ width: 28, height: 28 }} />
                            <div style={{ width: 28, height: 28 }} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
