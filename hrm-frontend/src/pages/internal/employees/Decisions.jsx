import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileSignature, Search, Plus, Filter, CheckCircle2, XCircle, ArrowRight, 
  AlertCircle, Eye, Calendar, DollarSign, Award, TrendingUp, X, Trash2, Building, Briefcase 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Decisions = () => {
  const [decisions, setDecisions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);

  const [formData, setFormData] = useState({
    decisionNumber: '',
    title: '',
    type: 'SALARY_ADJUSTMENT',
    employeeId: '',
    oldSalary: 0,
    newSalary: '',
    oldDepartmentId: '',
    newDepartmentId: '',
    oldPositionId: '',
    newPositionId: '',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    signBy: 'Ban Giám Đốc'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [decRes, empRes, deptRes, posRes] = await Promise.all([
        axios.get('http://localhost:5000/api/decisions'),
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setDecisions(decRes.data);
      setEmployees(empRes.data.filter(e => e.status !== 'RESIGNED'));
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
    const year = new Date().getFullYear();
    const count = decisions.length + 1;
    const autoNumber = `QĐ-${year}/${String(count).padStart(3, '0')}`;

    setFormData({
      decisionNumber: autoNumber,
      title: 'Quyết định điều chỉnh lương định kỳ',
      type: 'SALARY_ADJUSTMENT',
      employeeId: '',
      oldSalary: 0,
      newSalary: '',
      oldDepartmentId: '',
      newDepartmentId: '',
      oldPositionId: '',
      newPositionId: '',
      reason: 'Căn cứ vào kết quả đánh giá hiệu suất hoàn thành xuất sắc nhiệm vụ.',
      effectiveDate: new Date().toISOString().split('T')[0],
      signBy: 'Ban Giám Đốc'
    });
    setShowModal(true);
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(item => item.id === empId);
    if (emp) {
      const currentSalary = emp.contracts?.[0]?.baseSalary || 0;
      setFormData(prev => ({
        ...prev,
        employeeId: empId,
        oldSalary: currentSalary,
        oldDepartmentId: emp.departmentId || '',
        oldPositionId: emp.positionId || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, employeeId: empId, oldSalary: 0 }));
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    let defaultTitle = '';
    if (newType === 'SALARY_ADJUSTMENT') defaultTitle = 'Quyết định điều chỉnh mức lương';
    else if (newType === 'PROMOTION') defaultTitle = 'Quyết định bổ nhiệm chức vụ mới';
    else if (newType === 'TRANSFER') defaultTitle = 'Quyết định điều chuyển đơn vị công tác';
    else if (newType === 'TERMINATION') defaultTitle = 'Quyết định chấm dứt hợp đồng lao động';
    else if (newType === 'REWARD') defaultTitle = 'Quyết định khen thưởng thành tích xuất sắc';
    else if (newType === 'DISCIPLINE') defaultTitle = 'Quyết định thi hành kỷ luật';

    setFormData(prev => ({
      ...prev,
      type: newType,
      title: defaultTitle
    }));
  };

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error('Vui lòng chọn nhân sự áp dụng');
    if (!formData.title) return toast.error('Vui lòng nhập trích yếu quyết định');

    if (formData.type === 'SALARY_ADJUSTMENT' && (!formData.newSalary || Number(formData.newSalary) <= 0)) {
      return toast.error('Vui lòng nhập mức lương mới hợp lệ');
    }
    if (formData.type === 'PROMOTION' && !formData.newPositionId) {
      return toast.error('Vui lòng chọn chức vụ bổ nhiệm mới');
    }
    if (formData.type === 'TRANSFER' && !formData.newDepartmentId) {
      return toast.error('Vui lòng chọn phòng ban điều chuyển đến');
    }

    try {
      await axios.post('http://localhost:5000/api/decisions', formData);
      toast.success('Đã tạo Quyết định nhân sự mới!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo quyết định');
    }
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
      default:
        return <span className="badge badge-info">Bản nháp</span>;
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Quyết Định Nhân Sự
          </h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Quản trị các văn bản pháp lý biến động nhân sự (Bổ nhiệm, Điều chuyển, Tăng lương, Thôi việc)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', height: '40px' }}>
          <Plus size={18} /> Tạo Quyết Định Mới
        </button>
      </div>

      {/* 4 Stats Cards — Displayed in 1 clean horizontal row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileSignature size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tổng Quyết định</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{decisions.length}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Chờ duyệt ban hành</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.2 }}>
              {decisions.filter(d => d.status === 'PENDING').length}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Đã ban hành</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', lineHeight: 1.2 }}>
              {decisions.filter(d => d.status === 'APPROVED').length}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Lương & Bổ nhiệm</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', lineHeight: 1.2 }}>
              {decisions.filter(d => d.type === 'SALARY_ADJUSTMENT' || d.type === 'PROMOTION').length}
            </span>
          </div>
        </div>
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: '190px', height: '38px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tất cả loại quyết định</option>
              <option value="SALARY_ADJUSTMENT">Điều chỉnh lương</option>
              <option value="PROMOTION">Bổ nhiệm chức vụ</option>
              <option value="TRANSFER">Điều chuyển phòng ban</option>
              <option value="TERMINATION">Thôi việc / Chấm dứt HĐ</option>
              <option value="REWARD">Khen thưởng</option>
              <option value="DISCIPLINE">Kỷ luật</option>
            </select>

            <select
              className="form-select"
              style={{ width: '160px', height: '38px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ phê duyệt</option>
              <option value="APPROVED">Đã ban hành</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Số Quyết Định</th>
                <th>Trích yếu & Loại</th>
                <th>Nhân sự áp dụng</th>
                <th>Nội dung biến động</th>
                <th style={{ width: '130px' }}>Ngày hiệu lực</th>
                <th style={{ width: '130px' }}>Trạng thái</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileSignature size={15} color="var(--primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dec.decisionNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                        <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Chấm dứt HĐLĐ</span>
                      )}
                      {(dec.type === 'REWARD' || dec.type === 'DISCIPLINE') && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{dec.reason || 'Khen thưởng định kỳ'}</span>
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
                        <button
                          onClick={() => {
                            setSelectedDecision(dec);
                            setShowDetailModal(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem', height: '30px', width: '30px' }}
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        {dec.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleDelete(dec)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem', height: '30px', width: '30px', color: '#ef4444' }}
                            title="Xóa bản nháp"
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

      {/* POPUP: Tạo Quyết Định Mới (Rendered via React Portal) */}
      {showModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card flex-col animate-fade-in"
            style={{
              width: '680px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSignature size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>Soạn Thảo Quyết Định Nhân Sự</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Văn bản pháp lý điều chỉnh lương, chức vụ hoặc trạng thái nhân sự</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="btn btn-outline" 
                style={{ padding: '0.25rem', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDecision} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Số hiệu văn bản *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.decisionNumber}
                    onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Loại quyết định *</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={handleTypeChange}
                  >
                    <option value="SALARY_ADJUSTMENT">Điều chỉnh lương</option>
                    <option value="PROMOTION">Bổ nhiệm chức vụ</option>
                    <option value="TRANSFER">Điều chuyển phòng ban</option>
                    <option value="TERMINATION">Thôi việc / Chấm dứt HĐ</option>
                    <option value="REWARD">Khen thưởng</option>
                    <option value="DISCIPLINE">Kỷ luật</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trích yếu quyết định (Tiêu đề) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Quyết định điều chỉnh mức lương định kỳ 2026"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhân sự áp dụng *</label>
                <select
                  className="form-select"
                  value={formData.employeeId}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="">-- Chọn nhân viên áp dụng --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'Chưa gán PB'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Content Based on Type */}
              {formData.type === 'SALARY_ADJUSTMENT' && (
                <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px dashed var(--primary)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} /> Biến động Thu nhập & Mức lương
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Lương cơ bản hiện tại</label>
                      <input
                        type="text"
                        className="form-input"
                        value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                        disabled
                        style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Mức lương mới (VNĐ) *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="VD: 15000000"
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                        style={{ fontWeight: 700, borderColor: 'var(--primary)' }}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'PROMOTION' && (
                <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px dashed var(--primary)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} /> Bổ nhiệm Chức vụ mới
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Vị trí / Chức danh mới *</label>
                    <select
                      className="form-select"
                      value={formData.newPositionId}
                      onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn vị trí mới --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Tất cả PB'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.type === 'TRANSFER' && (
                <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px dashed var(--primary)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={16} /> Điều chuyển Đơn vị công tác
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Phòng ban mới *</label>
                      <select
                        className="form-select"
                        value={formData.newDepartmentId}
                        onChange={(e) => setFormData({ ...formData, newDepartmentId: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn phòng ban mới --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Vị trí mới (Tùy chọn)</label>
                      <select
                        className="form-select"
                        value={formData.newPositionId}
                        onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                      >
                        <option value="">-- Giữ nguyên hoặc chọn mới --</option>
                        {positions.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ngày hiệu lực *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Người ký duyệt</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.signBy}
                    onChange={(e) => setFormData({ ...formData, signBy: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Căn cứ & Lý do ban hành</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="Ghi rõ căn cứ tờ trình, biên bản họp hoặc lý do điều chỉnh..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ minWidth: '90px' }}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
                  Lưu & Gửi Phê Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* POPUP: Chi tiết Quyết định (Rendered via React Portal) */}
      {showDetailModal && selectedDecision && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="card flex-col animate-fade-in"
            style={{
              width: '600px',
              maxWidth: '95vw',
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSignature size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>Văn Bản Quyết Định Chi Tiết</h3>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="btn btn-outline" 
                style={{ padding: '0.25rem', width: '32px', height: '32px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Số hiệu văn bản</span>
                  <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>{selectedDecision.decisionNumber}</span>
                </div>
                <div>{renderStatusBadge(selectedDecision.status)}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Trích yếu:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{selectedDecision.title}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhân sự áp dụng:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedDecision.employee?.fullName} ({selectedDecision.employee?.code})</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Loại quyết định:</span>
                  <div style={{ marginTop: '2px' }}>{renderTypeBadge(selectedDecision.type)}</div>
                </div>
              </div>

              {selectedDecision.type === 'SALARY_ADJUSTMENT' && (
                <div style={{ padding: '0.875rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Chi tiết điều chỉnh mức lương:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{Number(selectedDecision.oldSalary || 0).toLocaleString()} VNĐ</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>➔</span>
                    <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>{Number(selectedDecision.newSalary || 0).toLocaleString()} VNĐ</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ngày có hiệu lực:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(selectedDecision.effectiveDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Thẩm quyền ký:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedDecision.signBy || 'Ban Giám Đốc'}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Căn cứ & Ghi chú:</span>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {selectedDecision.reason || 'Không có ghi chú.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setShowDetailModal(false)} className="btn btn-primary" style={{ minWidth: '100px' }}>
                  Đóng
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
