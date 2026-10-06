import React, { useState, useEffect } from 'react';
import { FileSignature, Search, Plus, Filter, CheckCircle2, XCircle, ArrowRight, ShieldCheck, AlertCircle, Eye, Calendar, DollarSign, Award, UserCheck, TrendingUp, X } from 'lucide-react';
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

  // Modal
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
    else if (newType === 'PROMOTION') defaultTitle = 'Quyết định bổ nhiệm chức danh mới';
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
      html: `Bạn có chắc muốn ban hành <b>${dec.decisionNumber}</b>?<br/><br/>
             <span style="font-size: 0.9rem; color: #64748b;">
             Hệ thống sẽ <b>tự động đồng bộ</b> dữ liệu (mức lương / chức vụ / phòng ban) vào Hồ sơ nhân sự và lưu vào lịch sử biến động.
             </span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ban hành ngay',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#7c3aed'
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.put(`http://localhost:5000/api/decisions/${dec.id}/approve`, {});
        Swal.fire({
          title: 'Thành công!',
          text: res.data.message,
          icon: 'success'
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

  // Lọc danh sách
  const filteredDecisions = decisions.filter(d => {
    const matchSearch = d.decisionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter ? d.type === typeFilter : true;
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchType && matchStatus;
  });

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'SALARY_ADJUSTMENT':
        return <span className="badge" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.3)' }}><DollarSign size={12} className="inline mr-1" />Điều chỉnh lương</span>;
      case 'PROMOTION':
        return <span className="badge" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.3)' }}><TrendingUp size={12} className="inline mr-1" />Bổ nhiệm chức vụ</span>;
      case 'TRANSFER':
        return <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}><ArrowRight size={12} className="inline mr-1" />Điều chuyển</span>;
      case 'TERMINATION':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}><XCircle size={12} className="inline mr-1" />Thôi việc</span>;
      case 'REWARD':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}><Award size={12} className="inline mr-1" />Khen thưởng</span>;
      default:
        return <span className="badge badge-info">{type}</span>;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle2 size={12} className="inline mr-1" />Đã ban hành</span>;
      case 'PENDING':
        return <span className="badge badge-warning"><AlertCircle size={12} className="inline mr-1" />Chờ phê duyệt</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={12} className="inline mr-1" />Từ chối</span>;
      default:
        return <span className="badge badge-info">Nháp</span>;
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
            Quyết Định Nhân Sự
          </h1>
          <p className="text-muted text-sm">
            Quản trị các văn bản pháp lý biến động nhân sự (Bổ nhiệm, Điều chuyển, Tăng lương, Thôi việc)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Tạo Quyết Định Mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card glass p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
            <FileSignature size={24} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Tổng Quyết định</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{decisions.length}</div>
          </div>
        </div>

        <div className="card glass p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Chờ duyệt ban hành</div>
            <div className="text-2xl font-bold text-warning">
              {decisions.filter(d => d.status === 'PENDING').length}
            </div>
          </div>
        </div>

        <div className="card glass p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Đã ban hành có hiệu lực</div>
            <div className="text-2xl font-bold text-success">
              {decisions.filter(d => d.status === 'APPROVED').length}
            </div>
          </div>
        </div>

        <div className="card glass p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Điều chỉnh lương / Vị trí</div>
            <div className="text-2xl font-bold text-primary">
              {decisions.filter(d => d.type === 'SALARY_ADJUSTMENT' || d.type === 'PROMOTION').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card glass flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-3 items-center flex-1 max-w-md">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm số QĐ, tên quyết định, nhân sự..."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <select
              className="form-select text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tất cả loại quyết định</option>
              <option value="SALARY_ADJUSTMENT">Điều chỉnh lương</option>
              <option value="PROMOTION">Bổ nhiệm chức vụ</option>
              <option value="TRANSFER">Điều chuyển công tác</option>
              <option value="TERMINATION">Thôi việc</option>
              <option value="REWARD">Khen thưởng</option>
            </select>

            <select
              className="form-select text-sm"
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
                <th>Số Quyết Định</th>
                <th>Trích yếu & Loại</th>
                <th>Nhân sự áp dụng</th>
                <th>Biến động nghiệp vụ</th>
                <th>Ngày hiệu lực</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
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
                      <div className="flex items-center gap-2">
                        <FileSignature size={16} color="var(--primary)" />
                        <span className="font-bold text-primary">{dec.decisionNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex-col gap-1">
                        <span className="font-semibold text-main text-sm">{dec.title}</span>
                        <div>{renderTypeBadge(dec.type)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="flex-col">
                        <span className="font-medium text-main">{dec.employee?.fullName}</span>
                        <span className="text-xs text-muted">
                          {dec.employee?.code} • {dec.employee?.department?.name || 'Chưa gán PB'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {dec.type === 'SALARY_ADJUSTMENT' && (
                        <div className="text-sm">
                          <span className="text-muted line-through">{Number(dec.oldSalary || 0).toLocaleString()}</span>
                          <span className="mx-1 text-primary font-bold">➔</span>
                          <span className="font-bold text-success">{Number(dec.newSalary || 0).toLocaleString()} VNĐ</span>
                        </div>
                      )}
                      {dec.type === 'PROMOTION' && (
                        <div className="text-sm">
                          <span className="text-muted">Chức vụ mới:</span>{' '}
                          <span className="font-bold text-primary">{dec.newPosition?.title || 'Đang cập nhật'}</span>
                        </div>
                      )}
                      {dec.type === 'TRANSFER' && (
                        <div className="text-sm">
                          <span className="text-muted">Đơn vị mới:</span>{' '}
                          <span className="font-bold text-primary">{dec.newDepartment?.name || 'Đang cập nhật'}</span>
                        </div>
                      )}
                      {dec.type === 'TERMINATION' && (
                        <div className="text-sm text-danger font-semibold">Chấm dứt HĐLĐ</div>
                      )}
                      {(dec.type === 'REWARD' || dec.type === 'DISCIPLINE') && (
                        <div className="text-xs text-muted italic max-w-xs truncate">{dec.reason || 'Khen thưởng định kỳ'}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-muted">
                        <Calendar size={14} />
                        {new Date(dec.effectiveDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      {renderStatusBadge(dec.status)}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {dec.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(dec)}
                              className="btn btn-outline"
                              style={{ padding: '0.4rem', border: '1px solid var(--success)', color: 'var(--success)' }}
                              title="Ban hành Quyết định"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(dec)}
                              className="btn btn-outline"
                              style={{ padding: '0.4rem', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                              title="Từ chối ban hành"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDecision(dec);
                            setShowDetailModal(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem' }}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        {dec.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleDelete(dec)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem', color: 'var(--danger)' }}
                            title="Xóa bản nháp"
                          >
                            <X size={16} />
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

      {/* Modal Tạo Quyết Định Mới */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass max-w-2xl animate-scale-up" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <FileSignature className="text-primary" /> Soạn Thảo Quyết Định Nhân Sự
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDecision} className="flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Số hiệu văn bản</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.decisionNumber}
                    onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Loại quyết định</label>
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
                <label className="text-xs font-semibold text-muted mb-1 block">Trích yếu quyết định (Tiêu đề)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Nhân sự áp dụng</label>
                <select
                  className="form-select"
                  value={formData.employeeId}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'Chưa gán PB'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Các trường biến động theo Loại Quyết Định */}
              {formData.type === 'SALARY_ADJUSTMENT' && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)', border: '1px dashed var(--primary)' }}>
                  <div className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <DollarSign size={16} /> Biến động Thu nhập & Mức lương
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted mb-1 block">Lương cơ bản hiện tại</label>
                      <input
                        type="text"
                        className="form-input"
                        value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                        disabled
                        style={{ opacity: 0.7 }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1 block font-bold text-main">Mức lương mới (VNĐ) *</label>
                      <input
                        type="number"
                        className="form-input font-bold"
                        placeholder="VD: 15000000"
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'PROMOTION' && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)', border: '1px dashed var(--primary)' }}>
                  <div className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <TrendingUp size={16} /> Bổ nhiệm Chức vụ mới
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">Vị trí / Chức danh mới *</label>
                    <select
                      className="form-select"
                      value={formData.newPositionId}
                      onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn vị trí mới --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Tất cả'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.type === 'TRANSFER' && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)', border: '1px dashed var(--primary)' }}>
                  <div className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <ArrowRight size={16} /> Điều chuyển Đơn vị công tác
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted mb-1 block">Phòng ban mới *</label>
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
                      <label className="text-xs text-muted mb-1 block">Vị trí tương ứng (Tùy chọn)</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày hiệu lực *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Người ký phê duyệt</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.signBy}
                    onChange={(e) => setFormData({ ...formData, signBy: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Căn cứ & Lý do ban hành</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Ghi rõ căn cứ tờ trình, biên bản họp hoặc lý do điều chỉnh..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu & Gửi Phê Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Quyết định */}
      {showDetailModal && selectedDecision && (
        <div className="modal-backdrop">
          <div className="modal-content glass max-w-xl animate-scale-up">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <FileSignature className="text-primary" /> Chi Tiết Quyết Định
              </h2>
              <button onClick={() => setShowDetailModal(false)} className="btn btn-ghost p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-col gap-4 text-sm">
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div>
                  <span className="text-xs text-muted block">Số Quyết Định</span>
                  <span className="font-bold text-lg text-primary">{selectedDecision.decisionNumber}</span>
                </div>
                <div>
                  {renderStatusBadge(selectedDecision.status)}
                </div>
              </div>

              <div>
                <span className="text-xs text-muted block mb-1">Trích yếu:</span>
                <span className="font-bold text-main text-base">{selectedDecision.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted block">Nhân sự áp dụng:</span>
                  <span className="font-semibold text-main">{selectedDecision.employee?.fullName} ({selectedDecision.employee?.code})</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Loại văn bản:</span>
                  <div>{renderTypeBadge(selectedDecision.type)}</div>
                </div>
              </div>

              {selectedDecision.type === 'SALARY_ADJUSTMENT' && (
                <div className="p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted block mb-1">Chi tiết điều chỉnh mức lương:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted line-through">{Number(selectedDecision.oldSalary || 0).toLocaleString()} VNĐ</span>
                    <span className="text-primary font-bold">➔</span>
                    <span className="font-bold text-success text-base">{Number(selectedDecision.newSalary || 0).toLocaleString()} VNĐ</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted block">Ngày có hiệu lực:</span>
                  <span className="font-medium text-main">{new Date(selectedDecision.effectiveDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Thẩm quyền ký:</span>
                  <span className="font-medium text-main">{selectedDecision.signBy || 'Ban Giám Đốc'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted block mb-1">Căn cứ & Ghi chú:</span>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  {selectedDecision.reason || 'Không có ghi chú.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-outline">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
