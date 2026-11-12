import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock, Plus, Trash2, X, CheckCircle2, AlertTriangle, Calendar
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../components/common/TablePagination';
import {
  MonthNavigator,
  getAuthHeaders,
  getMonthQueryStr,
} from '../../components/attendance/AttendanceShared';

export const EmployeeOT = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [myOtRequests, setMyOtRequests] = useState([]);
  const [otSummary, setOtSummary] = useState({
    totalRequestedHours: 0,
    totalApprovedHours: 0,
    totalYearApprovedHours: 0,
    monthCap: 40,
    yearCap: 200,
    monthWarningPercent: 0,
  });

  const [showOtModal, setShowOtModal] = useState(false);
  const [submittingOt, setSubmittingOt] = useState(false);
  const [otForm, setOtForm] = useState({
    date: now.toISOString().split('T')[0],
    requestHours: 2,
    reason: ''
  });

  const employeeId = localStorage.getItem('employeeId');
  const monthQueryStr = getMonthQueryStr(selectedYear, selectedMonth);

  const fetchOtData = async () => {
    setLoading(true);
    if (employeeId) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/ot/employee/${employeeId}?month=${monthQueryStr}`,
          { headers: getAuthHeaders() }
        );
        if (res.data?.requests) setMyOtRequests(res.data.requests);
        if (res.data?.summary) setOtSummary(res.data.summary);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOtData();
  }, [employeeId, selectedMonth, selectedYear]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedOtRequests,
    resetPage,
  } = usePagination(myOtRequests, 10);

  useEffect(() => {
    resetPage();
  }, [selectedMonth, selectedYear, resetPage]);

  const pendingCount = useMemo(
    () => myOtRequests.filter(r => r.status === 'PENDING').length,
    [myOtRequests]
  );

  const handleSubmitOt = async (e) => {
    e.preventDefault();
    if (!otForm.date || !otForm.requestHours) {
      return toast.error('Vui lòng chọn ngày và số giờ làm thêm!');
    }
    if (Number(otForm.requestHours) <= 0 || Number(otForm.requestHours) > 4) {
      return toast.error('Số giờ làm thêm phải từ 0.5h đến 4h (Điều 107 BLLĐ 2019)!');
    }
    setSubmittingOt(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/ot',
        {
          employeeId,
          date: otForm.date,
          requestHours: Number(otForm.requestHours),
          reason: otForm.reason.trim() || 'Làm thêm theo yêu cầu tiến độ dự án'
        },
        { headers: getAuthHeaders() }
      );
      toast.success(res.data.message || 'Đăng ký làm thêm giờ thành công, đang chờ Quản lý phê duyệt!');
      if (res.data.warning) {
        toast(res.data.warning, { icon: '⚠️', duration: 6000 });
      }
      setShowOtModal(false);
      setOtForm({ date: now.toISOString().split('T')[0], requestHours: 2, reason: '' });
      await fetchOtData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi gửi đăng ký OT');
    } finally {
      setSubmittingOt(false);
    }
  };

  const handleCancelOt = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký làm thêm này không?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/ot/${id}`, { headers: getAuthHeaders() });
      toast.success('Đã hủy đăng ký làm thêm!');
      await fetchOtData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi hủy đăng ký OT');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '8px',
            backgroundColor: '#F5F3FF', color: '#7C3AED',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Clock size={19} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Đăng Ký &amp; Theo Dõi Làm Thêm Giờ (OT)
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
              Chính sách Điều 107 BLLĐ 2019: Ngày thường 150%, Cuối tuần 200%, Lễ tết 300% lương.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <MonthNavigator
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelectMonth={setSelectedMonth}
            onSelectYear={setSelectedYear}
          />
          <button
            onClick={() => setShowOtModal(true)}
            className="btn btn-primary"
            style={{ height: 34, padding: '0 0.9rem', fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
          >
            <Plus size={15} /> Đăng ký OT mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tổng giờ đăng ký T{selectedMonth}/{selectedYear}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6D28D9' }}>{otSummary.totalRequestedHours || 0}h</div>
          </div>
          <Clock size={20} color="#7C3AED" />
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Đã duyệt tháng (trần {otSummary.monthCap || 40}h)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803D' }}>
              {otSummary.totalApprovedHours || 0}h / {otSummary.monthCap || 40}h
            </div>
          </div>
          <CheckCircle2 size={20} color="#15803D" />
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Lũy kế năm {selectedYear} (trần {otSummary.yearCap || 200}h)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
              {otSummary.totalYearApprovedHours || 0}h / {otSummary.yearCap || 200}h
            </div>
          </div>
          <Calendar size={20} color="#2563EB" />
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Đơn đang chờ duyệt</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#D97706' }}>{pendingCount} đơn</div>
          </div>
          <AlertTriangle size={20} color="#D97706" />
        </div>
      </div>

      {/* Bảng lịch sử OT */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '0.8rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          backgroundColor: '#FAF5FF'
        }}>
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#581C87' }}>
              Lịch sử Đăng ký Làm thêm giờ (OT) Tháng {selectedMonth}/{selectedYear} ({myOtRequests.length})
            </strong>
            <div style={{ fontSize: '0.73rem', color: '#6B21A8' }}>
              Giới hạn tối đa 4h/ngày • 40h/tháng • 200h/năm (mọi OT phải đăng ký trước khi làm)
            </div>
          </div>
          {otSummary.isMonthWarning && (
            <span style={{ fontSize: '0.76rem', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: '3px 10px', borderRadius: '6px', color: '#B45309', fontWeight: 700 }}>
              ⚠️ Cảnh báo: Đạt {otSummary.monthWarningPercent || 80}% hạn mức OT tháng
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.7rem 1.1rem', textAlign: 'left', fontWeight: 700 }}>Ngày làm OT</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Phân loại ngày / Hệ số</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Giờ đăng ký</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Giờ nghiệm thu</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700 }}>Lý do làm thêm</th>
                <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                <th style={{ padding: '0.7rem 1.1rem', textAlign: 'right', fontWeight: 700 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Đang tải lịch sử OT...
                  </td>
                </tr>
              ) : myOtRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Chưa có đăng ký làm thêm giờ (OT) nào trong tháng {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                paginatedOtRequests.map(ot => {
                  const otD = new Date(ot.date);
                  const isWeekend = otD.getDay() === 0 || otD.getDay() === 6;
                  return (
                    <tr key={ot.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.7rem 1.1rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {otD.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          backgroundColor: isWeekend ? '#FFFBEB' : '#EFF6FF',
                          color: isWeekend ? '#B45309' : '#1D4ED8'
                        }}>
                          {isWeekend ? 'Cuối tuần (Hệ số 200%)' : 'Ngày thường (Hệ số 150%)'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                        {Number(ot.requestHours).toFixed(1)}h
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700, color: ot.status === 'APPROVED' ? '#15803D' : '#64748B' }}>
                        {ot.status === 'APPROVED' ? `${Number(ot.actualHours || ot.requestHours).toFixed(1)}h` : '—'}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', color: '#334155' }}>
                        {ot.reason || 'Làm thêm tiến độ dự án'}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: ot.status === 'APPROVED' ? '#DCFCE7' : ot.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                          color: ot.status === 'APPROVED' ? '#15803D' : ot.status === 'REJECTED' ? '#B91C1C' : '#B45309'
                        }}>
                          {ot.status === 'APPROVED' ? 'Đã phê duyệt' : ot.status === 'REJECTED' ? 'Từ chối' : 'Chờ quản lý duyệt'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {ot.status === 'PENDING' ? (
                          <button
                            onClick={() => handleCancelOt(ot.id)}
                            className="btn btn-outline"
                            style={{ height: 26, padding: '0 0.5rem', fontSize: '0.72rem', color: '#EF4444', borderColor: '#FECACA' }}
                            title="Hủy đơn OT"
                          >
                            <Trash2 size={13} /> Hủy
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>—</span>
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
            itemLabel="đơn OT"
          />
        )}
      </div>

      {/* Modal Đăng ký OT */}
      {showOtModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '0.75rem',
            width: '100%', maxWidth: 480, overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#FAF5FF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#7C3AED" />
                <strong style={{ fontSize: '0.95rem', color: '#581C87' }}>Đăng ký Làm thêm giờ (OT)</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowOtModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOt} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{
                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem',
                padding: '0.75rem 0.9rem', fontSize: '0.74rem', color: '#334155', lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>
                  📌 Quy định Giới hạn OT Công ty LLA (Căn cứ Đ.107 BLLĐ 2019):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div>• <strong>Theo ngày:</strong> Tối đa <strong>4 giờ/ngày</strong> (≤ 50% thời giờ làm việc bình thường).</div>
                  <div>• <strong>Theo tháng:</strong> Tối đa <strong>40 giờ/tháng</strong> (cảnh báo khi đạt 80% = 32h và 100%).</div>
                  <div>• <strong>Theo năm:</strong> Tối đa <strong>200 giờ/năm</strong> (mốc 300h khi có phê duyệt riêng từ HR/Legal).</div>
                </div>
                <div style={{ marginTop: 6, color: '#B45309', fontWeight: 600, fontSize: '0.72rem', backgroundColor: '#FFFBEB', padding: '4px 8px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                  ⚠️ Lưu ý: Mọi OT phải đăng ký và được duyệt trước, tuyệt đối không &quot;OT chui&quot; rồi đòi tính lương hồi tố.
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                  Ngày làm thêm <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={otForm.date}
                  onChange={e => setOtForm({ ...otForm, date: e.target.value })}
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
                  value={otForm.requestHours}
                  onChange={e => setOtForm({ ...otForm, requestHours: e.target.value })}
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
                  placeholder="Ví dụ: Hỗ trợ triển khai Release hệ thống phiên bản mới / Xử lý sự cố tồn đọng..."
                  value={otForm.reason}
                  onChange={e => setOtForm({ ...otForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowOtModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingOt}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
                >
                  {submittingOt ? 'Đang gửi...' : 'Gửi đăng ký OT'}
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

