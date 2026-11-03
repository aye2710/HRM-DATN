import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  FileSignature, Search, Plus, CheckCircle2, XCircle, ArrowRight, 
  AlertCircle, Eye, Calendar, DollarSign, Award, TrendingUp, RotateCcw, 
  ShieldAlert, FileText, Paperclip, Trash2, X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const TYPE_META = {
  RECRUITMENT: {
    title: 'Quyết Định Tuyển Dụng',
    badge: 'TUYỂN DỤNG & TIẾP NHẬN',
    desc: 'Quản trị các văn bản tiếp nhận nhân sự chính thức sau thời gian thử việc hoặc tiếp nhận nhân tài mới'
  },
  PROMOTION: {
    title: 'Quyết Định Bổ Nhiệm',
    badge: 'BỔ NHIỆM & THĂNG CHỨC',
    desc: 'Quản lý các quyết định bổ nhiệm cán bộ quản lý, thăng chức thâm niên (Junior ➔ Middle ➔ Senior ➔ Lead)'
  },
  DEMOTION: {
    title: 'Quyết Định Miễn Nhiệm',
    badge: 'MIỄN NHIỆM CHỨC VỤ',
    desc: 'Quản lý các văn bản miễn nhiệm vị trí quản lý, thôi giữ chức vụ và điều chuyển về làm chuyên môn'
  },
  TRANSFER: {
    title: 'Quyết Định Điều Chuyển',
    badge: 'ĐIỀU CHUYỂN CÔNG TÁC',
    desc: 'Quản lý việc luân chuyển nhân sự giữa các phòng ban, thay đổi ngạch chuyên môn (Cross-functional: BA ➔ Dev)'
  },
  SALARY_ADJUSTMENT: {
    title: 'Quyết Định Tăng / Giảm Lương Chính',
    badge: 'ĐIỀU CHỈNH LƯƠNG & ĐÃI NGỘ',
    desc: 'Quản trị các đợt xét duyệt tăng lương định kỳ, tự động đồng bộ Phụ lục hợp đồng lao động và bảng lương'
  },
  REWARD: {
    title: 'Quyết Định Khen Thưởng',
    badge: 'KHEN THƯỞNG THÀNH TÍCH',
    desc: 'Quản lý vinh danh nhân viên xuất sắc, dự án hoàn thành vượt tiến độ và chi thưởng vào kỳ tính lương'
  },
  DISCIPLINE: {
    title: 'Quyết Định Kỷ Luật Nhân Sự',
    badge: 'KỶ LUẬT LAO ĐỘNG',
    desc: 'Xử lý các hành vi vi phạm nội quy lao động (Khiển trách, Kéo dài nâng lương, Cách chức, Sa thải) theo BLLĐ'
  },
  TERMINATION: {
    title: 'Quyết Định Nghỉ Việc',
    badge: 'NGHỈ VIỆC & BÀN GIAO',
    desc: 'Quản lý chấm dứt hợp đồng lao động, tự động kích hoạt bàn giao công việc/tài sản và khóa tài khoản hệ thống'
  },
  ALL: {
    title: 'Sổ Quản Trị Quyết Định Nhân Sự',
    badge: 'TỔNG HỢP VĂN BẢN',
    desc: 'Quản trị tập trung toàn bộ các văn bản quyết định biến động nhân sự: Bổ nhiệm, Lương, Thôi việc, Khen thưởng...'
  }
};

export const Decisions = ({ fixedType = 'ALL' }) => {
  const navigate = useNavigate();
  const activeFixed = fixedType === 'ALL' ? '' : fixedType;
  const meta = TYPE_META[fixedType] || TYPE_META.ALL;

  const [decisions, setDecisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal xem nhanh bản scan đính kèm phóng to
  const [previewScanModal, setPreviewScanModal] = useState(null);

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
  }, [fixedType]);

  const handleOpenAdd = () => {
    const query = activeFixed ? `?type=${activeFixed}` : '';
    navigate(`/internal/decisions/create${query}`);
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
        toast.error(error.response?.data?.error || 'Lỗi từ chối quyết định');
      }
    }
  };

  const handleRevoke = async (dec) => {
    const { value: revokeReason } = await Swal.fire({
      title: 'Thu hồi / Hủy ban hành?',
      html: `<div style="text-align: left; font-size: 0.875rem; color: #475569; line-height: 1.5;">
              Bạn đang yêu cầu thu hồi Quyết định <strong>${dec.decisionNumber}</strong>.<br/>
              Hệ thống sẽ <strong>Hoàn tác (Rollback)</strong> toàn bộ các biến động chức vụ, lương hoặc trạng thái làm việc của nhân sự <strong>${dec.employee?.fullName}</strong> về mốc trước khi ban hành.
             </div>`,
      input: 'text',
      inputLabel: 'Lý do thu hồi / hủy hiệu lực văn bản:',
      inputPlaceholder: 'VD: Quyết định có sự sai sót về thông tin mức lương / ban hành nhầm...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý thu hồi & Hoàn tác',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#f59e0b',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Vui lòng nhập lý do thu hồi!';
        }
      }
    });

    if (revokeReason) {
      try {
        const res = await axios.put(`http://localhost:5000/api/decisions/${dec.id}/revoke`, { reason: revokeReason });
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

  // Helper lookup
  const getOldDeptName = (dec) => {
    if (dec.oldDepartment?.name) return dec.oldDepartment.name;
    if (dec.oldDepartmentId) {
      const d = departments.find(item => item.id === dec.oldDepartmentId);
      if (d) return d.name;
    }
    return dec.employee?.department?.name || '---';
  };

  const getOldPosTitle = (dec) => {
    if (dec.oldPosition?.title) return dec.oldPosition.title;
    if (dec.oldPositionId) {
      const p = positions.find(item => item.id === dec.oldPositionId);
      if (p) return p.title;
    }
    return dec.employee?.position?.title || '---';
  };

  // Filter
  const filteredDecisions = decisions.filter(d => {
    const matchSearch = d.decisionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.employee?.fullName && d.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = activeFixed ? d.type === activeFixed : (typeFilter ? d.type === typeFilter : true);
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchType && matchStatus;
  });

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'RECRUITMENT':
        return <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)' }}><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />Tuyển dụng</span>;
      case 'PROMOTION':
        return <span className="badge" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.25)' }}><TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />Bổ nhiệm</span>;
      case 'DEMOTION':
        return <span className="badge" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.25)' }}><RotateCcw size={12} style={{ display: 'inline', marginRight: '4px' }} />Miễn nhiệm</span>;
      case 'TRANSFER':
        return <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}><ArrowRight size={12} style={{ display: 'inline', marginRight: '4px' }} />Thuyên chuyển</span>;
      case 'SALARY_ADJUSTMENT':
        return <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.25)' }}><DollarSign size={12} style={{ display: 'inline', marginRight: '4px' }} />Tăng/Giảm lương</span>;
      case 'TERMINATION':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}><XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />Nghỉ việc</span>;
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

  const getColSpan = () => {
    switch (fixedType) {
      case 'TRANSFER':
      case 'SALARY_ADJUSTMENT':
      case 'DISCIPLINE':
        return 9;
      case 'ALL':
        return 7;
      default:
        return 8;
    }
  };

  // Render Table Header chuyên biệt cho từng loại
  const renderTableHeaders = () => {
    switch (fixedType) {
      case 'RECRUITMENT':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Tiếp Nhận</th>
            <th>Vị Trí & Phòng Ban Chính Thức</th>
            <th>Mức Lương Chính Thức</th>
            <th style={{ width: '130px' }}>Ngày Tiếp Nhận</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'PROMOTION':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Bổ Nhiệm</th>
            <th>Chức Vụ Mới Bổ Nhiệm</th>
            <th>Lương Sau Bổ Nhiệm</th>
            <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'DEMOTION':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Miễn Nhiệm</th>
            <th>Vị Trí Mới Sau Miễn Nhiệm</th>
            <th>Lương Sau Miễn Nhiệm</th>
            <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'TRANSFER':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Điều Chuyển</th>
            <th>Đơn Vị & Chức Danh Cũ</th>
            <th>Đơn Vị & Chức Danh Tiếp Nhận</th>
            <th>Lương Sau Điều Chuyển</th>
            <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'TERMINATION':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Thôi Việc</th>
            <th>Phòng Ban & Vị Trí Công Tác</th>
            <th>Lý Do Chấm Dứt HĐLĐ</th>
            <th style={{ width: '140px' }}>Ngày Thôi Việc</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'SALARY_ADJUSTMENT':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Áp Dụng</th>
            <th>Lương HĐ Hiện Tại</th>
            <th>Lương Mới Áp Dụng</th>
            <th>Mức Biến Động (+/-)</th>
            <th style={{ width: '130px' }}>Ngày Áp Dụng</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'REWARD':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Khen Thưởng</th>
            <th>Tiền Thưởng (VNĐ)</th>
            <th>Thành Tích & Lý Do Khen Thưởng</th>
            <th style={{ width: '130px' }}>Ngày Quyết Định</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'DISCIPLINE':
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu Quyết Định</th>
            <th>Nhân Sự Kỷ Luật</th>
            <th>Hình Thức Kỷ Luật</th>
            <th>Thời Hạn Chấp Hành</th>
            <th>Hành Vi Vi Phạm / Lý Do</th>
            <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
      case 'ALL':
      default:
        return (
          <tr>
            <th style={{ width: '170px' }}>Số Quyết Định</th>
            <th>Trích Yếu & Loại QĐ</th>
            <th>Nhân Sự Áp Dụng</th>
            <th>Nội Dung Biến Động</th>
            <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
            <th style={{ width: '130px' }}>Trạng Thái</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        );
    }
  };

  // Render Table Row Cells chuyên biệt cho từng loại
  const renderSpecializedCells = (dec) => {
    switch (fixedType) {
      case 'RECRUITMENT':
        return (
          <>
            <td>
              <div style={{ fontWeight: 600, color: '#2563eb' }}>{dec.newPosition?.title || 'Chuyên viên chính thức'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dec.newDepartment?.name || dec.employee?.department?.name || '---'}</div>
            </td>
            <td>
              <span style={{ fontWeight: 700, color: '#047857' }}>
                {dec.newSalary ? `${Number(dec.newSalary).toLocaleString('vi-VN')} VNĐ` : 'Chưa nhập'}
              </span>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'PROMOTION':
        return (
          <>
            <td>
              <div style={{ fontWeight: 600, color: '#0284c7' }}>{dec.newPosition?.title || 'Chức vụ mới'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dec.newDepartment?.name || dec.employee?.department?.name || '---'}</div>
            </td>
            <td>
              {dec.newSalary ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: '#047857' }}>{Number(dec.newSalary).toLocaleString('vi-VN')} VNĐ</strong>
                  {dec.oldSalary && Number(dec.newSalary) > Number(dec.oldSalary) && (
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                      (+{(Number(dec.newSalary) - Number(dec.oldSalary)).toLocaleString('vi-VN')} VNĐ)
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ color: '#64748B', fontSize: '0.82rem' }}>Giữ nguyên lương</span>
              )}
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'DEMOTION':
        return (
          <>
            <td>
              <div style={{ fontWeight: 600, color: '#ea580c' }}>{dec.newPosition?.title || 'Vị trí mới'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dec.newDepartment?.name || dec.employee?.department?.name || '---'}</div>
            </td>
            <td>
              {dec.newSalary ? (
                <strong style={{ color: '#047857' }}>{Number(dec.newSalary).toLocaleString('vi-VN')} VNĐ</strong>
              ) : (
                <span style={{ color: '#64748B', fontSize: '0.82rem' }}>Giữ nguyên lương</span>
              )}
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'TRANSFER':
        return (
          <>
            <td>
              <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{getOldDeptName(dec)}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{getOldPosTitle(dec)}</div>
            </td>
            <td>
              <div style={{ fontWeight: 600, color: '#10b981' }}>{dec.newDepartment?.name || 'Giữ nguyên đơn vị'}</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>{dec.newPosition?.title || 'Giữ nguyên chức danh'}</div>
            </td>
            <td>
              {dec.newSalary ? (
                <strong style={{ color: '#047857' }}>{Number(dec.newSalary).toLocaleString('vi-VN')} VNĐ</strong>
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Giữ nguyên lương</span>
              )}
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'TERMINATION':
        return (
          <>
            <td>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{dec.employee?.department?.name || '---'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dec.employee?.position?.title || '---'}</div>
            </td>
            <td>
              <div style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dec.reason}>
                {dec.reason || 'Theo nguyện vọng cá nhân'}
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'SALARY_ADJUSTMENT':
        const diff = Number(dec.newSalary || 0) - Number(dec.oldSalary || 0);
        return (
          <>
            <td>
              <span style={{ color: '#475569', fontWeight: 600 }}>
                {Number(dec.oldSalary || 0).toLocaleString('vi-VN')} VNĐ
              </span>
            </td>
            <td>
              <strong style={{ color: '#7c3aed', fontSize: '0.9rem' }}>
                {Number(dec.newSalary || 0).toLocaleString('vi-VN')} VNĐ
              </strong>
            </td>
            <td>
              {diff > 0 ? (
                <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                  +{diff.toLocaleString('vi-VN')} VNĐ
                </span>
              ) : diff < 0 ? (
                <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>
                  {diff.toLocaleString('vi-VN')} VNĐ
                </span>
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>0 VNĐ</span>
              )}
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'REWARD':
        return (
          <>
            <td>
              {dec.rewardAmount ? (
                <strong style={{ color: '#d97706', fontSize: '0.9rem' }}>
                  +{Number(dec.rewardAmount).toLocaleString('vi-VN')} VNĐ
                </strong>
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Khen thưởng tinh thần</span>
              )}
            </td>
            <td>
              <div style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dec.reason}>
                {dec.reason || 'Hoàn thành xuất sắc nhiệm vụ'}
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'DISCIPLINE':
        return (
          <>
            <td>
              <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>
                {dec.disciplineForm || 'Khiển trách'}
              </span>
            </td>
            <td>
              <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{dec.disciplineDuration || '---'}</span>
            </td>
            <td>
              <div style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dec.reason}>
                {dec.reason || 'Vi phạm nội quy lao động'}
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </td>
          </>
        );

      case 'ALL':
      default:
        return (
          <>
            <td>
              {dec.type === 'SALARY_ADJUSTMENT' && (
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{Number(dec.oldSalary || 0).toLocaleString()} ➔ </span>
                  <strong style={{ color: '#10b981' }}>{Number(dec.newSalary || 0).toLocaleString()} VNĐ</strong>
                </div>
              )}
              {(dec.type === 'PROMOTION' || dec.type === 'DEMOTION' || dec.type === 'RECRUITMENT') && (
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>{dec.newPosition?.title || 'Chức danh mới'}</span>
                  {dec.newDepartment && <span style={{ color: '#64748b' }}> ({dec.newDepartment.name})</span>}
                </div>
              )}
              {dec.type === 'TRANSFER' && (
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{getOldDeptName(dec)} ➔ </span>
                  <strong style={{ color: '#0284c7' }}>{dec.newDepartment?.name || 'Mới'}</strong>
                </div>
              )}
              {dec.type === 'TERMINATION' && (
                <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                  Chấm dứt HĐLĐ & Thôi việc
                </div>
              )}
              {dec.type === 'REWARD' && (
                <div style={{ fontSize: '0.85rem' }}>
                  {dec.rewardAmount ? (
                    <strong style={{ color: '#f59e0b' }}>+{Number(dec.rewardAmount).toLocaleString('vi-VN')} VNĐ</strong>
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
          </>
        );
    }
  };

  return (
    <div className="flex-col gap-5 animate-fade-in" style={{ padding: '0 0.5rem' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {meta.title}
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              {meta.badge}
            </span>
          </div>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            {meta.desc}
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
            {!activeFixed && (
              <select
                className="form-select"
                style={{ width: '190px', height: '38px' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Tất cả loại quyết định</option>
                <option value="PROMOTION">Bổ nhiệm</option>
                <option value="DEMOTION">Miễn nhiệm</option>
                <option value="TRANSFER">Điều chuyển</option>
                <option value="TERMINATION">Nghỉ việc</option>
                <option value="RECRUITMENT">Tuyển dụng</option>
                <option value="SALARY_ADJUSTMENT">Tăng / Giảm lương chính</option>
                <option value="REWARD">Khen thưởng</option>
                <option value="DISCIPLINE">Kỷ luật nhân sự</option>
              </select>
            )}

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
              {renderTableHeaders()}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={getColSpan()} className="text-center py-8 text-muted">Đang tải dữ liệu quyết định...</td>
                </tr>
              ) : filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={getColSpan()} className="text-center py-8 text-muted">Chưa có quyết định nào phù hợp trong danh mục này.</td>
                </tr>
              ) : (
                filteredDecisions.map(dec => (
                  <tr key={dec.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div 
                          onClick={() => navigate(`/internal/decisions/${dec.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                          <FileSignature size={15} color="var(--primary)" />
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dec.decisionNumber}</span>
                        </div>
                        {dec.fileUrl && (
                          <button
                            onClick={() => setPreviewScanModal({ title: dec.decisionNumber, url: dec.fileUrl })}
                            style={{ 
                              background: 'none', border: 'none', padding: 0, 
                              display: 'inline-flex', alignItems: 'center', gap: '4px', 
                              fontSize: '0.72rem', color: '#059669', cursor: 'pointer', textAlign: 'left' 
                            }}
                          >
                            <Paperclip size={12} /> Bản scan gốc
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {dec.title}
                        </div>
                        {fixedType === 'ALL' && (
                          <div>
                            {renderTypeBadge(dec.type)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dec.employee?.fullName || '—'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã NV: {dec.employee?.code || '—'}</span>
                      </div>
                    </td>

                    {/* RENDER CÁC CỘT CHUYÊN BIỆT */}
                    {renderSpecializedCells(dec)}

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
                          onClick={() => navigate(`/internal/decisions/${dec.id}`)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem', height: '30px', width: '30px' }}
                          title="Xem chi tiết"
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

      {/* MODAL XEM BẢN SCAN GỐC ĐÍNH KÈM */}
      {previewScanModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px',
            width: '900px', maxWidth: '95vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={18} color="#2563eb" />
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                  Bản scan văn bản gốc: {previewScanModal.title}
                </strong>
              </div>
              <button
                onClick={() => setPreviewScanModal(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img 
                src={previewScanModal.url} 
                alt="Bản scan quyết định" 
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
