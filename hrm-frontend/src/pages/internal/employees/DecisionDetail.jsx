import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Printer, CheckCircle2, XCircle, RotateCcw, Trash2, 
  Paperclip, ExternalLink, Download, AlertCircle, Calendar, User, 
  Building2, Briefcase, DollarSign, Award, ShieldAlert, ArrowRight, 
  FileSignature, ChevronRight, FileText, Check, ShieldCheck, Eye, UploadCloud
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const DecisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewScan, setPreviewScan] = useState(false);
  const [uploadingScan, setUploadingScan] = useState(false);

  const fetchDecisionData = async () => {
    setLoading(true);
    try {
      const [decRes, deptRes, posRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/decisions/${id}`),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setDecision(decRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy thông tin quyết định nhân sự hoặc đã bị xóa');
      navigate('/internal/employees/decisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  // Phê duyệt & Ban hành
  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'Phê duyệt & Ban hành?',
      html: `Bạn đang phê duyệt quyết định <b>${decision.decisionNumber}</b>.<br/><br/>
             <span style="font-size: 0.85rem; color: #64748b;">
             Hệ thống sẽ <b>tự động đồng bộ</b> biến động lương, chức vụ, đơn vị công tác vào Hồ sơ nhân sự và Hợp đồng lao động.
             </span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ban hành ngay',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#2563eb'
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.put(`http://localhost:5000/api/decisions/${decision.id}/approve`, {});
        Swal.fire({
          title: 'Đã ban hành thành công!',
          text: res.data.message,
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        fetchDecisionData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Lỗi khi phê duyệt quyết định');
      }
    }
  };

  // Từ chối phê duyệt
  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Từ chối quyết định',
      input: 'textarea',
      inputLabel: 'Lý do từ chối ban hành:',
      inputPlaceholder: 'Nhập lý do chi tiết để thông báo cho người lập...',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (reason !== undefined) {
      try {
        await axios.put(`http://localhost:5000/api/decisions/${decision.id}/reject`, { reason });
        toast.success('Đã từ chối quyết định');
        fetchDecisionData();
      } catch (error) {
        toast.error('Lỗi khi từ chối quyết định');
      }
    }
  };

  // Thu hồi / Rollback
  const handleRevoke = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Thu hồi / Hủy ban hành?',
      html: `Bạn đang thực hiện thu hồi quyết định <b>${decision.decisionNumber}</b>.<br/><br/>
             <span style="font-size: 0.85rem; color: #dc2626; font-weight: 600;">
             Hệ thống sẽ TỰ ĐỘNG HOÀN TÁC (Rollback) mức lương, chức vụ, đơn vị công tác hoặc trạng thái làm việc của nhân sự về trạng thái trước khi ban hành.
             </span>`,
      input: 'textarea',
      inputLabel: 'Lý do thu hồi / hủy bỏ quyết định (bắt buộc):',
      inputPlaceholder: 'Ví dụ: Đính chính mức lương, ban hành nhầm văn bản thay thế...',
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
        const res = await axios.put(`http://localhost:5000/api/decisions/${decision.id}/revoke`, { revokeReason: reason });
        Swal.fire({
          title: 'Đã thu hồi thành công!',
          text: res.data.message,
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        fetchDecisionData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Lỗi khi thu hồi quyết định');
      }
    }
  };

  // Xóa bản nháp / từ chối
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Xóa quyết định?',
      text: `Bạn có chắc muốn xóa văn bản ${decision.decisionNumber}? Thao tác này không thể hoàn tác.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/decisions/${decision.id}`);
        toast.success('Đã xóa quyết định');
        navigate('/internal/employees/decisions');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Lỗi xóa quyết định');
      }
    }
  };

  // Tải lên bản scan bổ sung
  const handleUploadScanFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Dung lượng tệp đính kèm không được vượt quá 10MB');
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileData = event.target.result;
      setUploadingScan(true);
      try {
        await axios.put(`http://localhost:5000/api/decisions/${decision.id}`, { fileUrl: fileData });
        toast.success('Đã cập nhật tệp đính kèm thành công!');
        fetchDecisionData();
      } catch (err) {
        toast.error('Lỗi khi lưu tệp đính kèm');
      } finally {
        setUploadingScan(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: 500 }}>Đang tải văn bản quyết định nhân sự...</p>
      </div>
    );
  }

  if (!decision) return null;

  const oldDeptObj = departments.find(d => d.id === decision.oldDepartmentId);
  const oldPosObj = positions.find(p => p.id === decision.oldPositionId);
  const newDeptObj = decision.newDepartment || departments.find(d => d.id === decision.newDepartmentId);
  const newPosObj = decision.newPosition || positions.find(p => p.id === decision.newPositionId);

  const effectiveDateObj = new Date(decision.effectiveDate);
  const createdDateObj = new Date(decision.createdAt);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            <CheckCircle2 size={14} /> ĐÃ BAN HÀNH & ĐỒNG BỘ
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: 700, backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
            <AlertCircle size={14} /> CHỜ PHÊ DUYỆT
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            <XCircle size={14} /> TỪ CHỐI BAN HÀNH
          </span>
        );
      case 'CANCELLED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: 700, backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8' }}>
            <RotateCcw size={14} /> ĐÃ THU HỒI / HỦY HIỆU LỰC
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
            <FileText size={14} /> BẢN NHÁP
          </span>
        );
    }
  };

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'SALARY_ADJUSTMENT':
        return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.25)' }}><DollarSign size={12} style={{ display: 'inline', marginRight: '3px' }} />Điều chỉnh mức lương</span>;
      case 'PROMOTION':
        return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.25)' }}><Award size={12} style={{ display: 'inline', marginRight: '3px' }} />Bổ nhiệm chức vụ</span>;
      case 'TRANSFER':
        return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}><ArrowRight size={12} style={{ display: 'inline', marginRight: '3px' }} />Điều chuyển phòng ban</span>;
      case 'TERMINATION':
        return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}><XCircle size={12} style={{ display: 'inline', marginRight: '3px' }} />Thôi việc / Chấm dứt HĐLĐ</span>;
      case 'REWARD':
        return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}><Award size={12} style={{ display: 'inline', marginRight: '3px' }} />Khen thưởng thành tích</span>;
      case 'DISCIPLINE':
        return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.25)' }}><ShieldAlert size={12} style={{ display: 'inline', marginRight: '3px' }} />Kỷ luật lao động</span>;
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Print isolation styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-decision-a4, #official-decision-a4 * {
            visibility: visible !important;
          }
          #official-decision-a4 {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 20mm 20mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Breadcrumb & Navigation Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/internal/employees/decisions')}
            className="btn btn-outline"
            style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px', height: '38px', borderRadius: '8px' }}
          >
            <ArrowLeft size={16} /> Danh sách
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Nhân sự</span>
              <ChevronRight size={13} />
              <Link to="/internal/employees/decisions" style={{ color: '#64748b', textDecoration: 'none' }}>Quyết định</Link>
              <ChevronRight size={13} />
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{decision.decisionNumber}</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {decision.title}
              {renderStatusBadge(decision.status)}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrint}
            className="btn btn-outline"
            style={{ padding: '0.55rem 1rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}
            title="In văn bản A4 ra máy in hoặc lưu PDF"
          >
            <Printer size={16} /> In / Xuất PDF
          </button>

          {decision.fileUrl && (
            <button 
              onClick={() => setPreviewScan(true)}
              className="btn btn-outline"
              style={{ padding: '0.55rem 1rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
            >
              <Paperclip size={16} /> Xem bản scan gốc
            </button>
          )}

          {decision.status === 'PENDING' && (
            <>
              <button 
                onClick={handleReject}
                className="btn btn-outline"
                style={{ padding: '0.55rem 1rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#dc2626', borderColor: '#fca5a5' }}
              >
                <XCircle size={16} /> Từ chối
              </button>

              <button 
                onClick={handleApprove}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, backgroundColor: '#2563eb' }}
              >
                <CheckCircle2 size={16} /> Phê duyệt & Ban hành
              </button>
            </>
          )}

          {decision.status === 'APPROVED' && (
            <button 
              onClick={handleRevoke}
              className="btn btn-outline"
              style={{ padding: '0.55rem 1rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fff1f2' }}
              title="Thu hồi quyết định và hoàn tác dữ liệu nhân sự"
            >
              <RotateCcw size={16} /> Thu hồi quyết định (Rollback)
            </button>
          )}

          {(decision.status === 'DRAFT' || decision.status === 'REJECTED') && (
            <button 
              onClick={handleDelete}
              className="btn btn-outline"
              style={{ padding: '0.55rem 0.85rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fca5a5' }}
              title="Xóa quyết định"
            >
              <Trash2 size={16} /> Xóa
            </button>
          )}
        </div>
      </div>

      {/* Banner cảnh báo đặc biệt khi Thu hồi hoặc Từ chối */}
      {decision.status === 'CANCELLED' && (
        <div className="no-print" style={{ padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
            <RotateCcw size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem' }}>
              VĂN BẢN ĐÃ BỊ THU HỒI / HỦY BỎ HIỆU LỰC
            </div>
            <div style={{ fontSize: '0.85rem', color: '#881337', marginTop: '4px' }}>
              {decision.revokedAt && <span>Thời điểm thu hồi: <strong>{new Date(decision.revokedAt).toLocaleString('vi-VN')}</strong>. </span>}
              Lý do thu hồi: <em>"{decision.revokeReason || 'Không có lý do cụ thể'}"</em>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#be123c', marginTop: '4px', fontWeight: 600 }}>
              ✓ Hệ thống đã hoàn tác tự động (Rollback) toàn bộ chế độ, mức lương, chức vụ hoặc trạng thái của nhân sự về trước khi ban hành.
            </div>
          </div>
        </div>
      )}

      {decision.status === 'REJECTED' && (
        <div className="no-print" style={{ padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
            <XCircle size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
              QUYẾT ĐỊNH ĐÃ BỊ TỪ CHỐI BAN HÀNH
            </div>
            <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '4px' }}>
              Lý do từ chối: <em>"{decision.rejectionReason || 'Văn bản chưa đủ điều kiện ban hành'}"</em>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.75fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* CỘT TRÁI: VĂN BẢN PHÁP LÝ A4 CHUẨN THỂ THỨC QUỐC GIA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div 
            id="official-decision-a4"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '45px 50px',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000000',
              lineHeight: 1.6,
              position: 'relative',
              minHeight: '850px'
            }}
          >
            {/* Watermark nếu đã ban hành hoặc bị thu hồi */}
            {decision.status === 'APPROVED' && (
              <div style={{
                position: 'absolute',
                top: '42%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '3.5rem',
                fontWeight: 900,
                color: 'rgba(16, 185, 129, 0.07)',
                border: '6px dashed rgba(16, 185, 129, 0.15)',
                padding: '10px 40px',
                borderRadius: '16px',
                pointerEvents: 'none',
                letterSpacing: '4px',
                userSelect: 'none',
                textTransform: 'uppercase'
              }}>
                ĐÃ BAN HÀNH
              </div>
            )}

            {decision.status === 'CANCELLED' && (
              <div style={{
                position: 'absolute',
                top: '42%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '3.5rem',
                fontWeight: 900,
                color: 'rgba(225, 29, 72, 0.08)',
                border: '6px dashed rgba(225, 29, 72, 0.18)',
                padding: '10px 40px',
                borderRadius: '16px',
                pointerEvents: 'none',
                letterSpacing: '4px',
                userSelect: 'none',
                textTransform: 'uppercase'
              }}>
                ĐÃ THU HỒI
              </div>
            )}

            {/* Header: Quốc hiệu - Tiêu ngữ & Đơn vị ban hành */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
              <div style={{ textAlign: 'center', width: '48%' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>CÔNG TY CỔ PHẦN CÔNG NGHỆ LLA</div>
                <div style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>KHỐI QUẢN TRỊ NGUỒN NHÂN LỰC</div>
                <div style={{ margin: '4px auto', width: '70px', borderBottom: '1px solid #000' }} />
                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                  Số: <strong>{decision.decisionNumber}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', width: '48%' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ margin: '4px auto', width: '100px', borderBottom: '1px solid #000' }} />
                <div style={{ fontStyle: 'italic', fontSize: '0.85rem', marginTop: '6px' }}>
                  Hà Nội, ngày {effectiveDateObj.getDate()} tháng {effectiveDateObj.getMonth() + 1} năm {effectiveDateObj.getFullYear()}
                </div>
              </div>
            </div>

            {/* Tiêu đề Quyết định */}
            <div style={{ textAlign: 'center', margin: '2rem 0 1.5rem 0' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 'bold', letterSpacing: '1px' }}>QUYẾT ĐỊNH</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.95rem', margin: '4px 0 8px 0', fontWeight: 'bold' }}>
                (V/v: {decision.title})
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {decision.signBy || 'TỔNG GIÁM ĐỐC CÔNG TY CỔ PHẦN CÔNG NGHỆ LLA'}
              </div>
            </div>

            {/* Căn cứ pháp lý */}
            <div style={{ fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div>- Căn cứ Bộ luật Lao động số 45/2019/QH14 được Quốc hội nước CHXHCN Việt Nam thông qua ngày 20/11/2019;</div>
              <div>- Căn cứ Điều lệ tổ chức và Quy chế quản trị nhân sự của Công ty Cổ phần Công nghệ LLA;</div>
              <div>- Căn cứ Hợp đồng lao động hiện hành và thỏa thuận làm việc của nhân sự;</div>
              <div>- {decision.reason ? `Căn cứ ${decision.reason.toLowerCase()}` : 'Căn cứ vào yêu cầu công việc thực tế và đề xuất của Trưởng bộ phận nhân sự.'}</div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', margin: '1rem 0' }}>
              QUYẾT ĐỊNH:
            </div>

            {/* Các Điều Khoản Thực Thi */}
            <div style={{ fontSize: '0.925rem', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <strong>Điều 1. </strong>
                {decision.type === 'SALARY_ADJUSTMENT' && (
                  <span>
                    Điều chỉnh mức lương cơ bản đối với Ông/Bà <strong>{decision.employee?.fullName}</strong> (Mã nhân viên: <strong>{decision.employee?.code}</strong>), 
                    hiện đang công tác tại phòng ban <strong>{decision.employee?.department?.name || '---'}</strong>, 
                    giữ chức vụ <strong>{decision.employee?.position?.title || '---'}</strong>.
                    <br />
                    - Mức lương cũ: <strong>{Number(decision.oldSalary || 0).toLocaleString('vi-VN')} VNĐ</strong>.
                    <br />
                    - Mức lương mới áp dụng: <strong style={{ color: '#16a34a' }}>{Number(decision.newSalary || 0).toLocaleString('vi-VN')} VNĐ</strong>.
                  </span>
                )}

                {decision.type === 'PROMOTION' && (
                  <span>
                    Bổ nhiệm Ông/Bà <strong>{decision.employee?.fullName}</strong> (Mã nhân viên: <strong>{decision.employee?.code}</strong>) 
                    từ vị trí <strong>{oldPosObj?.title || decision.employee?.position?.title || '---'}</strong> lên giữ chức vụ mới: <strong style={{ color: '#2563eb' }}>{newPosObj?.title || 'Chức vụ mới'}</strong> 
                    thuộc phòng ban <strong>{newDeptObj?.name || decision.employee?.department?.name || '---'}</strong>.
                  </span>
                )}

                {decision.type === 'TRANSFER' && (
                  <span>
                    Điều chuyển công tác / vị trí đối với Ông/Bà <strong>{decision.employee?.fullName}</strong> (Mã nhân viên: <strong>{decision.employee?.code}</strong>) 
                    {newDeptObj && oldDeptObj?.id !== newDeptObj?.id ? (
                      <> từ <strong>{oldDeptObj?.name || '---'}</strong> sang đơn vị tiếp nhận mới: <strong style={{ color: '#10b981' }}>{newDeptObj?.name}</strong>,</>
                    ) : (
                      <> công tác tại phòng ban <strong>{decision.employee?.department?.name || '---'}</strong>,</>
                    )} 
                    {newPosObj && oldPosObj?.id !== newPosObj?.id ? (
                      <> đảm nhiệm chức danh công việc mới: <strong style={{ color: '#2563eb' }}>{newPosObj?.title}</strong> (vị trí cũ: <em>{oldPosObj?.title || '---'}</em>).</>
                    ) : (
                      <> giữ nguyên vị trí: <strong>{decision.employee?.position?.title || '---'}</strong>.</>
                    )}
                    {decision.newSalary && (
                      <span style={{ display: 'block', marginTop: '6px', color: '#047857' }}>
                        Áp dụng mức lương cơ bản mới: <strong>{Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ/tháng</strong> (mức lương cũ: {Number(decision.oldSalary || 0).toLocaleString('vi-VN')} VNĐ).
                      </span>
                    )}
                  </span>
                )}

                {decision.type === 'TERMINATION' && (
                  <span>
                    Chấm dứt Hợp đồng lao động và giải quyết thủ tục thôi việc đối với Ông/Bà <strong>{decision.employee?.fullName}</strong> (Mã nhân viên: <strong>{decision.employee?.code}</strong>), 
                    thuộc phòng ban <strong>{decision.employee?.department?.name || '---'}</strong> kể từ ngày quyết định có hiệu lực.
                    Ông/Bà có trách nhiệm bàn giao toàn bộ tài sản, tài liệu nghiệp vụ và công việc đang phụ trách theo quy định.
                  </span>
                )}

                {decision.type === 'REWARD' && (
                  <span>
                    Khen thưởng thành tích xuất sắc đối với Ông/Bà <strong>{decision.employee?.fullName}</strong> (Mã nhân viên: <strong>{decision.employee?.code}</strong>).
                    {decision.rewardAmount && <span> Kèm theo số tiền khen thưởng bằng tiền mặt/chuyển khoản là: <strong style={{ color: '#d97706' }}>{Number(decision.rewardAmount).toLocaleString('vi-VN')} VNĐ</strong>.</span>}
                  </span>
                )}

                {decision.type === 'DISCIPLINE' && (
                  <span>
                    Thi hành kỷ luật lao động bằng hình thức <strong style={{ color: '#dc2626' }}>{decision.disciplineForm || 'Khiển trách'}</strong> đối với Ông/Bà <strong>{decision.employee?.fullName}</strong> (Mã nhân viên: <strong>{decision.employee?.code}</strong>).
                    {decision.disciplineDuration && <span> Thời hạn chấp hành quyết định là: <strong>{decision.disciplineDuration}</strong> kể từ ngày quyết định có hiệu lực.</span>}
                  </span>
                )}
              </div>

              <div>
                <strong>Điều 2. </strong>
                Quyết định này có hiệu lực thi hành kể từ ngày <strong>{effectiveDateObj.toLocaleDateString('vi-VN')}</strong>. Mọi quy định hoặc văn bản trước đây trái với Quyết định này đều bãi bỏ.
              </div>

              <div>
                <strong>Điều 3. </strong>
                Các thành viên Ban Giám Đốc, Trưởng phòng Quản trị Nguồn nhân lực, Trưởng phòng Tài chính - Kế toán, Trưởng bộ phận liên quan và Ông/Bà <strong>{decision.employee?.fullName}</strong> chịu trách nhiệm thi hành Quyết định này.
              </div>
            </div>

            {/* Footer Nơi nhận & Chữ ký */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '3rem' }}>
              <div style={{ fontSize: '0.8rem', width: '42%' }}>
                <strong><em>Nơi nhận:</em></strong>
                <div>- Như Điều 3;</div>
                <div>- Ban Tổng Giám Đốc;</div>
                <div>- Hồ sơ lưu: VT, HSNV.</div>
              </div>

              <div style={{ textAlign: 'center', width: '48%', position: 'relative' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>TM. BAN TỔNG GIÁM ĐỐC</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4.5rem' }}>
                  {decision.signBy?.toUpperCase() || 'TỔNG GIÁM ĐỐC'}
                </div>
                
                {/* Dấu mộc điện tử nếu đã ban hành */}
                {decision.status === 'APPROVED' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    border: '3px solid #dc2626',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                    textAlign: 'center',
                    padding: '8px',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(254, 226, 226, 0.25)',
                    transformOrigin: 'center',
                    rotate: '-10deg',
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 800 }}>CÔNG TY CP CÔNG NGHỆ LLA</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, margin: '2px 0' }}>★ ĐÃ DUYỆT ★</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 700 }}>{effectiveDateObj.toLocaleDateString('vi-VN')}</div>
                  </div>
                )}

                <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.8rem' }}>
                  (Ký tên và đóng dấu số)
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN CHI TIẾT & TÁC ĐỘNG HỆ THỐNG */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card 1: Hồ sơ nhân sự thụ hưởng */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" /> Nhân Sự Thụ Hưởng
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, border: '2px solid #DBEAFE' }}>
                {decision.employee?.fullName?.charAt(0) || 'E'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{decision.employee?.fullName}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Mã NV: <strong>{decision.employee?.code}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Phòng ban hiện tại:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{decision.employee?.department?.name || 'Chưa gán'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chức danh hiện tại:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{decision.employee?.position?.title || 'Chưa gán'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>HĐLĐ hiện tại:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {decision.employee?.contracts?.[0]?.contractNumber || 'Không có HĐ còn hiệu lực'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <Link 
                to={`/internal/employees/profiles/${decision.employeeId}`}
                className="btn btn-outline"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.825rem', height: '34px' }}
              >
                <ExternalLink size={14} /> Mở Hồ Sơ Nhân Viên
              </Link>
            </div>
          </div>

          {/* Card 2: Phân tích Tác động Đồng bộ Hệ thống (System Impact) */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981" /> Biến Động Đồng Bộ Hệ Thống
            </h3>

            {decision.type === 'SALARY_ADJUSTMENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Lương cũ</div>
                    <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                      {Number(decision.oldSalary || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <ArrowRight size={16} color="#94a3b8" />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Lương mới</div>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                      {Number(decision.newSalary || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                {decision.newSalary && decision.oldSalary && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', padding: '0 4px' }}>
                    Chênh lệch: <strong style={{ color: Number(decision.newSalary) >= Number(decision.oldSalary) ? '#16a34a' : '#dc2626' }}>
                      {Number(decision.newSalary) >= Number(decision.oldSalary) ? '+' : ''}
                      {(Number(decision.newSalary) - Number(decision.oldSalary)).toLocaleString('vi-VN')} VNĐ
                    </strong>
                    {Number(decision.oldSalary) > 0 && (
                      <span style={{ color: '#64748b' }}> ({((Number(decision.newSalary) - Number(decision.oldSalary)) / Number(decision.oldSalary) * 100).toFixed(1)}%)</span>
                    )}
                  </div>
                )}
                
                <div style={{ fontSize: '0.78rem', color: '#64748b', backgroundColor: '#EFF6FF', padding: '8px 10px', borderRadius: '6px' }}>
                  💡 Khi ban hành: Bảng lương kỳ kế tiếp và Hợp đồng đang mở của nhân sự sẽ tự động nhận mức lương này.
                </div>
              </div>
            )}

            {decision.type === 'PROMOTION' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Chức danh mới bổ nhiệm:</div>
                  <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.05rem', marginTop: '2px' }}>
                    {newPosObj?.title || '---'}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', backgroundColor: '#EFF6FF', padding: '8px 10px', borderRadius: '6px' }}>
                  💡 Khi ban hành: Chức vụ trong Hồ sơ cá nhân và Sơ đồ tổ chức sẽ được đồng bộ ngay lập tức.
                </div>
              </div>
            )}

            {decision.type === 'TRANSFER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Đơn vị / Phòng ban tiếp nhận:</div>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem', marginTop: '2px' }}>
                    {newDeptObj?.name || 'Giữ nguyên phòng ban hiện tại'}
                  </div>
                  {newPosObj && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Chức danh mới đảm nhiệm:</div>
                      <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1rem', marginTop: '2px' }}>
                        {newPosObj.title}
                      </div>
                    </div>
                  )}
                  {decision.newSalary && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mức lương sau điều chuyển:</div>
                      <div style={{ fontWeight: 800, color: '#047857', fontSize: '1.05rem', marginTop: '2px' }}>
                        {Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ/tháng
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                        (Mức lương ban đầu: {decision.oldSalary ? Number(decision.oldSalary).toLocaleString('vi-VN') + ' VNĐ' : '---'})
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', backgroundColor: '#ECFDF5', padding: '8px 10px', borderRadius: '6px' }}>
                  💡 Khi ban hành: Đơn vị quản lý, chức danh và mức lương trong Hồ sơ nhân sự sẽ được đồng bộ tự động kèm Phụ lục HĐLĐ.
                </div>
              </div>
            )}

            {decision.type === 'TERMINATION' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>Tác động hồ sơ:</div>
                  <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem', marginTop: '2px' }}>
                    Đổi trạng thái nhân sự sang ĐÃ THÔI VIỆC (RESIGNED)
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#7f1d1d', backgroundColor: '#fee2e2', padding: '8px 10px', borderRadius: '6px' }}>
                  ⚠️ Khi ban hành: Khóa tài khoản đăng nhập Employee Portal, kết thúc HĐLĐ và chốt công.
                </div>
              </div>
            )}

            {decision.type === 'REWARD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Số tiền thưởng ghi nhận:</div>
                  <div style={{ fontWeight: 800, color: '#b45309', fontSize: '1.1rem', marginTop: '2px' }}>
                    {decision.rewardAmount ? `${Number(decision.rewardAmount).toLocaleString('vi-VN')} VNĐ` : 'Khen thưởng không kèm hiện kim'}
                  </div>
                </div>
              </div>
            )}

            {decision.type === 'DISCIPLINE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Hình thức kỷ luật:</div>
                  <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem', marginTop: '2px' }}>
                    {decision.disciplineForm || 'Khiển trách'}
                  </div>
                  {decision.disciplineDuration && (
                    <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '4px' }}>
                      Thời hạn: {decision.disciplineDuration}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Tệp đính kèm văn bản gốc (Bản Scan) */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={18} color="var(--primary)" /> Bản Scan Ký Sống
              </h3>
              {decision.fileUrl && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Có tệp đính kèm
                </span>
              )}
            </div>

            {decision.fileUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div 
                  onClick={() => setPreviewScan(true)}
                  style={{
                    height: '140px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {decision.fileUrl.startsWith('data:image/') || decision.fileUrl.startsWith('http') ? (
                    <img 
                      src={decision.fileUrl} 
                      alt="Bản scan quyết định" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                      <FileText size={36} color="#2563eb" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tệp văn bản đính kèm</span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: 'white',
                    fontWeight: 600,
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <Eye size={18} /> Nhấn để phóng to
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setPreviewScan(true)}
                    className="btn btn-outline" 
                    style={{ flex: 1, height: '34px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Eye size={14} /> Xem to
                  </button>
                  <a 
                    href={decision.fileUrl} 
                    download={`QuyetDinh_${decision.decisionNumber.replace(/\//g, '_')}.png`}
                    className="btn btn-outline" 
                    style={{ flex: 1, height: '34px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <Download size={14} /> Tải về
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <UploadCloud size={30} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>Chưa có bản scan lưu trữ</div>
                <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', height: '32px', cursor: 'pointer' }}>
                  <span>{uploadingScan ? 'Đang tải...' : 'Tải lên bản scan'}</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handleUploadScanFile} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>

          {/* Card 4: Nhật ký văn bản & Thẩm quyền */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSignature size={18} color="var(--primary)" /> Nhật Ký Pháp Lý
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Thẩm quyền ký:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{decision.signBy || 'Tổng Giám Đốc'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ngày khởi tạo:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{createdDateObj.toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ngày hiệu lực:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{effectiveDateObj.toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Trạng thái:</span>
                <span style={{ fontWeight: 700 }}>{decision.status}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal Xem Bản Scan Phóng To */}
      {previewScan && decision.fileUrl && (
        <div 
          className="no-print"
          onClick={() => setPreviewScan(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '900px',
              maxHeight: '90vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                Bản scan văn bản gốc: {decision.decisionNumber}
              </div>
              <button 
                onClick={() => setPreviewScan(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1rem', overflowY: 'auto', textAlign: 'center', backgroundColor: '#f8fafc', flex: 1 }}>
              <img 
                src={decision.fileUrl} 
                alt="Bản scan đầy đủ" 
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
              />
            </div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <a 
                href={decision.fileUrl} 
                download={`QuyetDinh_${decision.decisionNumber.replace(/\//g, '_')}.png`}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Download size={15} /> Tải bản scan gốc
              </a>
              <button onClick={() => setPreviewScan(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
