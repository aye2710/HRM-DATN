import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  FileSignature, Search, Plus, Filter, CheckCircle2, XCircle, ArrowRight, 
  AlertCircle, Eye, Calendar, DollarSign, Award, TrendingUp, X, Trash2, Building, Briefcase,
  Printer, RotateCcw, UploadCloud, ExternalLink, ShieldAlert, FileText, Check, Paperclip
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Decisions = () => {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal xem nhanh bản scan đính kèm phóng to
  const [previewScanModal, setPreviewScanModal] = useState(null); // { title: '', url: '' }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [decRes, deptRes, posRes] = await Promise.all([
        axios.get('http://localhost:5000/api/decisions'),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setDecisions(decRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải dữ liệu quyết định');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    navigate('/internal/employees/decisions/create');
  };

  const handleApprove = async (dec) => {
    const result = await Swal.fire({
      title: 'Phê duyệt & Ban hành?',
      html: `Bạn có chắc muốn ban hành quyết định <b>${dec.decisionNumber}</b>?<br/><br/>
             <span style="font-size: 0.85rem; color: #64748b;">
             Hệ thống sẽ <b>tự động đồng bộ</b> mức lương / chức vụ vào Hồ sơ nhân sự và lưu vào lịch sử công tác.
             </span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ban hành ngay',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#2563eb'
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.put(`http://localhost:5000/api/decisions/${dec.id}/approve`, {});
        Swal.fire({
          title: 'Thành công!',
          text: res.data.message,
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Lỗi khi phê duyệt quyết định');
      }
    }
  };

  const handleReject = async (dec) => {
    const { value: reason } = await Swal.fire({
      title: 'Từ chối quyết định',
      input: 'textarea',
      inputLabel: 'Lý do từ chối ban hành:',
      inputPlaceholder: 'Nhập lý do chi tiết...',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (reason !== undefined) {
      try {
        await axios.put(`http://localhost:5000/api/decisions/${dec.id}/reject`, { reason });
        toast.success('Đã từ chối quyết định');
        fetchData();
      } catch (error) {
        toast.error('Lỗi khi từ chối quyết định');
      }
    }
  };

  const handleRevoke = async (dec) => {
    const { value: reason } = await Swal.fire({
      title: 'Thu hồi / Hủy ban hành?',
      html: `Bạn đang thực hiện thu hồi quyết định <b>${dec.decisionNumber}</b>.<br/><br/>
             <span style="font-size: 0.85rem; color: #dc2626; font-weight: 600;">
             Hệ thống sẽ TỰ ĐỘNG HOÀN TÁC (Rollback) mức lương, chức vụ, đơn vị công tác hoặc trạng thái làm việc của nhân sự về như cũ.
             </span>`,
      input: 'textarea',
      inputLabel: 'Lý do thu hồi / hủy bỏ quyết định (bắt buộc):',
      inputPlaceholder: 'Ví dụ: Ban hành nhầm mức lương, có quyết định đính chính thay thế số...',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Vui lòng cung cấp lý do thu hồi văn bản!';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Xác nhận thu hồi',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#ef4444'
    });

    if (reason) {
      try {
        const res = await axios.put(`http://localhost:5000/api/decisions/${dec.id}/revoke`, { revokeReason: reason });
        Swal.fire({
          title: 'Đã thu hồi thành công!',
          text: res.data.message,
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Lỗi khi thu hồi quyết định');
      }
    }
  };

  const handleDelete = async (dec) => {
    const result = await Swal.fire({
      title: 'Xóa quyết định?',
      text: `Bạn có chắc muốn xóa văn bản ${dec.decisionNumber}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/decisions/${dec.id}`);
        toast.success('Đã xóa quyết định');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Lỗi xóa quyết định');
      }
    }
  };

  // Filter
  const filteredDecisions = decisions.filter(d => {
    const matchSearch = d.decisionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.employee?.fullName && d.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter ? d.type === typeFilter : true;
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchType && matchStatus;
  });

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'SALARY_ADJUSTMENT':
        return <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.25)' }}><DollarSign size={12} style={{ display: 'inline', marginRight: '4px' }} />Điều chỉnh lương</span>;
      case 'PROMOTION':
        return <span className="badge" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.25)' }}><TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />Bổ nhiệm chức vụ</span>;
      case 'TRANSFER':
        return <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}><ArrowRight size={12} style={{ display: 'inline', marginRight: '4px' }} />Điều chuyển</span>;
      case 'TERMINATION':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}><XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />Thôi việc</span>;
      case 'REWARD':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}><Award size={12} style={{ display: 'inline', marginRight: '4px' }} />Khen thưởng</span>;
      case 'DISCIPLINE':
        return <span className="badge" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.25)' }}><ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }} />Kỷ luật</span>;
      default:
        return <span className="badge badge-info">{type}</span>;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />Đã ban hành</span>;
      case 'PENDING':
        return <span className="badge badge-warning"><AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />Chờ phê duyệt</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />Từ chối</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8' }}><RotateCcw size={12} style={{ display: 'inline', marginRight: '4px' }} />Đã thu hồi</span>;
      case 'DRAFT':
      default:
        return <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}><FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />Bản nháp</span>;
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Quyết Định Nhân Sự
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              QUY TRÌNH QUẢN TRỊ BIẾN ĐỘNG
            </span>
          </div>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Quản trị văn bản pháp lý nhân sự: Tự động đồng bộ Hợp đồng, Bảng lương, Hồ sơ và hỗ trợ Hoàn tác (Rollback)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', height: '40px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> Tạo Quyết Định Mới
        </button>
      </div>


      {/* Main Table Card */}
      <div className="card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm số QĐ, trích yếu, tên nhân sự..."
              className="form-input"
              style={{ paddingLeft: '2.5rem', height: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: '190px', height: '38px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tất cả loại quyết định</option>
              <option value="SALARY_ADJUSTMENT">Điều chỉnh lương</option>
              <option value="PROMOTION">Bổ nhiệm chức vụ</option>
              <option value="TRANSFER">Điều chuyển công tác</option>
              <option value="TERMINATION">Thôi việc / Nghỉ việc</option>
              <option value="REWARD">Khen thưởng</option>
              <option value="DISCIPLINE">Kỷ luật</option>
            </select>

            <select
              className="form-select"
              style={{ width: '170px', height: '38px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ phê duyệt</option>
              <option value="APPROVED">Đã ban hành</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CANCELLED">Đã thu hồi</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Số Quyết Định</th>
                <th>Trích Yếu & Loại QĐ</th>
                <th>Nhân Sự Áp Dụng</th>
                <th>Nội Dung Biến Động</th>
                <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
                <th style={{ width: '130px' }}>Trạng Thái</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">Đang tải dữ liệu quyết định...</td>
                </tr>
              ) : filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">Chưa có quyết định nhân sự nào phù hợp.</td>
                </tr>
              ) : (
                filteredDecisions.map(dec => (
                  <tr key={dec.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div 
                          onClick={() => navigate(`/internal/employees/decisions/${dec.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                          <FileSignature size={15} color="var(--primary)" />
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dec.decisionNumber}</span>
                        </div>
                        {dec.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewScanModal({ title: `Bản scan: ${dec.decisionNumber}`, url: dec.fileUrl })}
                            style={{
                              border: 'none',
                              background: '#eff6ff',
                              color: '#2563eb',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              width: 'fit-content'
                            }}
                          >
                            <Paperclip size={11} /> Có bản scan
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div 
                        onClick={() => navigate(`/internal/employees/decisions/${dec.id}`)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dec.title}</span>
                        <div>{renderTypeBadge(dec.type)}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dec.employee?.fullName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {dec.employee?.code} • {dec.employee?.department?.name || 'Chưa gán PB'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {dec.type === 'SALARY_ADJUSTMENT' && (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{Number(dec.oldSalary || 0).toLocaleString()}</span>
                          <span style={{ margin: '0 6px', color: 'var(--primary)', fontWeight: 700 }}>➔</span>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>{Number(dec.newSalary || 0).toLocaleString()} VNĐ</span>
                        </div>
                      )}
                      {dec.type === 'PROMOTION' && (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Chức vụ mới:</span>{' '}
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dec.newPosition?.title || 'Đang cập nhật'}</span>
                        </div>
                      )}
                      {dec.type === 'TRANSFER' && (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Phòng ban mới:</span>{' '}
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dec.newDepartment?.name || 'Đang cập nhật'}</span>
                        </div>
                      )}
                      {dec.type === 'TERMINATION' && (
                        <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Chấm dứt HĐLĐ (Thôi việc)</span>
                      )}
                      {dec.type === 'REWARD' && (
                        <div style={{ fontSize: '0.85rem' }}>
                          {dec.rewardAmount ? (
                            <span style={{ fontWeight: 700, color: '#f59e0b' }}>+{Number(dec.rewardAmount).toLocaleString('vi-VN')} VNĐ</span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Khen thưởng thành tích</span>
                          )}
                        </div>
                      )}
                      {dec.type === 'DISCIPLINE' && (
                        <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>
                          <span style={{ fontWeight: 700 }}>{dec.disciplineForm || 'Khiển trách'}</span>
                          {dec.disciplineDuration && <span style={{ fontSize: '0.75rem', color: '#64748b' }}> ({dec.disciplineDuration})</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Calendar size={13} />
                        {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      {renderStatusBadge(dec.status)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {dec.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(dec)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem', height: '30px', width: '30px', borderColor: '#10b981', color: '#10b981' }}
                              title="Ban hành Quyết định"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              onClick={() => handleReject(dec)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem', height: '30px', width: '30px', borderColor: '#ef4444', color: '#ef4444' }}
                              title="Từ chối ban hành"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {/* Nút Thu hồi / Hủy ban hành nếu đã APPROVED */}
                        {dec.status === 'APPROVED' && (
                          <button
                            onClick={() => handleRevoke(dec)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem', height: '30px', width: '30px', borderColor: '#f59e0b', color: '#f59e0b' }}
                            title="Thu hồi / Hoàn tác quyết định (Rollback)"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/internal/employees/decisions/${dec.id}`)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem', height: '30px', width: '30px' }}
                          title="Xem chi tiết & In văn bản"
                        >
                          <Eye size={15} />
                        </button>

                        {(dec.status === 'DRAFT' || dec.status === 'REJECTED') && (
                          <button
                            onClick={() => handleDelete(dec)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem', height: '30px', width: '30px', color: '#ef4444' }}
                            title="Xóa quyết định"
                          >
                            <Trash2 size={15} />
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
      </div>

      {/* MODAL XEM BẢN SCAN GỐC ĐÍNH KÈM PHÓNG TO */}
      {previewScanModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)', padding: '24px' }}>
          <div style={{ width: '840px', maxWidth: '100%', maxHeight: '92vh', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{previewScanModal.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a href={previewScanModal.url} target="_blank" rel="noreferrer" download style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={14} /> Mở tab mới / Tải về
                </a>
                <button onClick={() => setPreviewScanModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
              {previewScanModal.url.startsWith('data:application/pdf') ? (
                <iframe src={previewScanModal.url} title={previewScanModal.title} style={{ width: '100%', height: '70vh', border: 'none' }} />
              ) : (
                <img src={previewScanModal.url} alt={previewScanModal.title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }} />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
