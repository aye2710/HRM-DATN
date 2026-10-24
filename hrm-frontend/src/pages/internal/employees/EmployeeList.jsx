import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Trash2, Edit, X, Eye, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, 
  FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    fullName: '',
    cccd: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    joinDate: '',
    status: 'ACTIVE',
    departmentId: '',
    positionId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setPositions(posRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchTerm.toLowerCase();
      const matchSearch = searchTerm === '' ||
        (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
        (emp.code && emp.code.toLowerCase().includes(q)) ||
        (emp.position?.title && emp.position.title.toLowerCase().includes(q)) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q)) ||
        (emp.cccd && emp.cccd.includes(q));

      const matchDept = deptFilter ? emp.departmentId === deptFilter : true;
      const matchStatus = statusFilter ? emp.status === statusFilter : true;
      const matchLevel = levelFilter ? emp.position?.level?.toLowerCase() === levelFilter.toLowerCase() : true;
      
      let matchContract = true;
      if (contractFilter) {
        const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE');
        matchContract = activeContract ? activeContract.contractType === contractFilter : (contractFilter === 'NONE');
      }

      return matchSearch && matchDept && matchStatus && matchLevel && matchContract;
    });
  }, [employees, searchTerm, deptFilter, statusFilter, levelFilter, contractFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, levelFilter, contractFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Chính thức</span>;
      case 'PROBATION': return <span className="badge badge-warning" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Thử việc</span>;
      case 'INTERNSHIP': return <span className="badge badge-info" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Thực tập</span>;
      case 'ONBOARDING': return <span className="badge badge-info" style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4338ca' }}>Đang hội nhập</span>;
      case 'RESIGNED': return <span className="badge badge-error" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Đã thôi việc</span>;
      default: return <span className="badge badge-purple" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  const getContractBadge = (emp) => {
    const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE');
    if (!activeContract) {
      return <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Chưa ký HĐ</span>;
    }
    switch (activeContract.contractType) {
      case 'PROBATION':
        return <span style={{ color: '#B45309', fontWeight: 600, fontSize: '0.8rem' }}>HĐ Thử việc</span>;
      case 'OFFICIAL_1Y':
        return <span style={{ color: '#2563EB', fontWeight: 600, fontSize: '0.8rem' }}>HĐ 1 Năm</span>;
      case 'INDEFINITE':
        return <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem' }}>HĐ Vô thời hạn</span>;
      case 'INTERNSHIP':
        return <span style={{ color: '#6D28D9', fontWeight: 600, fontSize: '0.8rem' }}>HĐ Thực tập</span>;
      default:
        return <span style={{ color: '#475569', fontSize: '0.8rem' }}>{activeContract.contractType}</span>;
    }
  };

  const calculateTenure = (joinDateStr) => {
    if (!joinDateStr) return '—';
    const start = new Date(joinDateStr);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return 'Mới gia nhập';
    if (diffMonths < 12) return `${diffMonths} tháng`;
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    return months > 0 ? `${years} năm ${months} th` : `${years} năm`;
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      code: `NV${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      cccd: '',
      gender: 'MALE',
      dateOfBirth: '',
      phone: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      departmentId: '',
      positionId: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setFormData({
      id: emp.id,
      code: emp.code,
      fullName: emp.fullName,
      cccd: emp.cccd || '',
      gender: emp.gender || '',
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
      phone: emp.phone || '',
      email: emp.email || '',
      joinDate: emp.joinDate ? emp.joinDate.split('T')[0] : '',
      status: emp.status,
      departmentId: emp.departmentId || '',
      positionId: emp.positionId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa nhân sự?',
      text: 'Thao tác này sẽ xóa hồ sơ và các liên kết liên quan. Nếu nhân viên nghỉ việc, khuyến nghị chuyển trạng thái sang "Đã thôi việc" (RESIGNED).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa hồ sơ',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#EF4444'
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      toast.success('Xóa nhân sự thành công!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa nhân viên');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.fullName || !formData.joinDate) {
      return toast.error('Vui lòng điền đủ các trường bắt buộc (*)');
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/employees/${formData.id}`, formData);
        toast.success('Cập nhật nhân sự thành công!');
      } else {
        await axios.post(`http://localhost:5000/api/employees`, formData);
        toast.success('Thêm mới nhân sự thành công!');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi lưu nhân sự.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return toast.error('Không có dữ liệu để xuất');
    const headers = ['Mã NV', 'Họ và Tên', 'CCCD', 'Email', 'SĐT', 'Phòng ban', 'Chức danh', 'Cấp bậc', 'Ngày vào làm', 'Trạng thái'];
    const rows = filteredEmployees.map(emp => [
      `"${emp.code}"`,
      `"${emp.fullName}"`,
      `"${emp.cccd || ''}"`,
      `"${emp.email || ''}"`,
      `"${emp.phone || ''}"`,
      `"${emp.department?.name || ''}"`,
      `"${emp.position?.title || ''}"`,
      `"${emp.position?.level || ''}"`,
      `"${new Date(emp.joinDate).toLocaleDateString('vi-VN')}"`,
      `"${emp.status}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_nhan_su_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '6px',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Hồ sơ & Danh bạ Nhân sự Doanh nghiệp
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Quản trị vòng đời nhân sự, hợp đồng lao động, vị trí chức danh và phòng ban tập trung.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportCSV} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', fontSize: '0.875rem', borderColor: '#CBD5E1', color: '#059669' }}
          >
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>

          <button 
            onClick={handleOpenAdd} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.875rem' }}
          >
            <Plus size={16} /> Thêm nhân sự
          </button>

          <button 
            onClick={fetchData} 
            className="btn btn-outline"
            style={{ padding: '0.55rem', borderColor: '#CBD5E1', color: '#64748B' }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.85rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            className="form-input w-full"
            placeholder="Tìm theo Tên, Mã NV, Phòng ban, Chức danh..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
          />
        </div>

        {/* Dept Filter */}
        <div style={{ width: 190 }}>
          <select 
            className="form-input w-full"
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ width: 170 }}>
          <select 
            className="form-input w-full"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Chính thức (Active)</option>
            <option value="PROBATION">Thử việc (Probation)</option>
            <option value="ONBOARDING">Đang hội nhập</option>
            <option value="INTERNSHIP">Thực tập (Intern)</option>
            <option value="RESIGNED">Đã thôi việc</option>
          </select>
        </div>

        {/* Level Filter */}
        <div style={{ width: 150 }}>
          <select 
            className="form-input w-full"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">Tất cả cấp bậc</option>
            <option value="Intern">Intern</option>
            <option value="Fresher">Fresher</option>
            <option value="Junior">Junior</option>
            <option value="Middle">Middle</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        {/* Contract Filter */}
        <div style={{ width: 160 }}>
          <select 
            className="form-input w-full"
            value={contractFilter}
            onChange={e => setContractFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">Tất cả hợp đồng</option>
            <option value="PROBATION">HĐ Thử việc</option>
            <option value="OFFICIAL_1Y">HĐ 1 Năm</option>
            <option value="INDEFINITE">HĐ Vô thời hạn</option>
            <option value="INTERNSHIP">HĐ Thực tập</option>
            <option value="NONE">Chưa có HĐ</option>
          </select>
        </div>
      </div>

      {/* 4. Table or Grid View */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
            Đang tải dữ liệu nhân sự...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
            <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            Không tìm thấy hồ sơ nhân sự nào phù hợp với bộ lọc.
          </div>
        ) : (
          /* LIST TABLE VIEW */
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem', width: 110 }}>Mã NV</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: 200 }}>Họ và Tên</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: 170 }}>Chức danh</th>
                  <th style={{ padding: '0.85rem 1rem', minWidth: 160 }}>Phòng ban</th>
                  <th style={{ padding: '0.85rem 1rem', width: 140 }}>Ngày vào làm</th>
                  <th style={{ padding: '0.85rem 1rem', width: 130 }}>Trạng thái</th>
                  <th style={{ padding: '0.85rem 1rem', width: 100, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="hover:bg-slate-50">
                    {/* 1. Mã NV */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span 
                        onClick={() => navigate(`/internal/employees/profiles/${emp.id}`)}
                        style={{ fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}
                        className="hover:underline"
                      >
                        {emp.code}
                      </span>
                    </td>

                    {/* 2. Họ và Tên (Không có thông tin định danh linh tinh) */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          backgroundColor: '#EFF6FF', color: '#1D4ED8',
                          fontWeight: 700, fontSize: '0.825rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #DBEAFE', flexShrink: 0
                        }}>
                          {emp.fullName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'NV'}
                        </div>
                        <span 
                          onClick={() => navigate(`/internal/employees/profiles/${emp.id}`)}
                          style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                          className="hover:text-blue-600"
                        >
                          {emp.fullName}
                        </span>
                      </div>
                    </td>

                    {/* 3. Chức danh */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>
                          {emp.position?.title || 'Chưa xếp chức danh'}
                        </span>
                        {emp.position?.level && (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                            {emp.position.level}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Phòng ban */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ color: '#334155', fontWeight: 500 }}>
                        {emp.department?.name || 'Chưa xếp phòng ban'}
                      </span>
                    </td>

                    {/* 5. Ngày vào làm */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: '#0F172A' }}>
                        {new Date(emp.joinDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {calculateTenure(emp.joinDate)}
                      </div>
                    </td>

                    {/* 6. Trạng thái */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getStatusBadge(emp.status)}
                    </td>

                    {/* 7. Thao tác (Chỉ Xem và Xóa) */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button 
                          onClick={() => navigate(`/internal/employees/profiles/${emp.id}`)} 
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.55rem', color: '#2563EB', borderColor: '#E2E8F0', borderRadius: '6px' }}
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)} 
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.55rem', color: '#EF4444', borderColor: '#FEE2E2', borderRadius: '6px' }}
                          title="Xóa hồ sơ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer */}
        {filteredEmployees.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748B' }}>
              <span>Hiển thị</span>
              <select
                className="form-input"
                style={{ width: 70, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>
                nhân sự/trang (Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} / {filteredEmployees.length} nhân sự)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.55rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Trang đầu"
              >
                <ChevronsLeft size={15} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.55rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Trang trước"
              >
                <ChevronLeft size={15} />
              </button>

              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', padding: '0 0.5rem' }}>
                Trang {currentPage} / {totalPages}
              </span>

              <button 
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.55rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Trang sau"
              >
                <ChevronRight size={15} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.55rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Trang cuối"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal Thêm / Sửa nhân sự */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '1rem',
            width: '100%', maxWidth: '780px',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0', overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
                  {isEditing ? 'Cập nhật Thông tin Nhân sự' : 'Tiếp nhận Nhân sự mới'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {isEditing ? `Mã nhân viên: ${formData.code}` : 'Khai báo thông tin cá nhân và vị trí công tác ban đầu'}
                </span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#2563EB', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.35rem' }}>
                  1. Thông tin Cá nhân & Định danh
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Mã Nhân viên <span style={{ color: '#EF4444' }}>*</span></label>
                    <input 
                      type="text" 
                      className="form-input w-full"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      disabled={isEditing}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Họ và Tên <span style={{ color: '#EF4444' }}>*</span></label>
                    <input 
                      type="text" 
                      className="form-input w-full"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Số CCCD (9 hoặc 12 số)</label>
                    <input 
                      type="text" 
                      className="form-input w-full"
                      value={formData.cccd}
                      onChange={e => setFormData({ ...formData, cccd: e.target.value })}
                      placeholder="VD: 079201012345"
                    />
                  </div>
                  <div>
                    <label className="form-label">Giới tính</label>
                    <select 
                      className="form-input w-full"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="">-- Chọn giới tính --</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Ngày sinh</label>
                    <input 
                      type="date" 
                      className="form-input w-full"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Số điện thoại</label>
                    <input 
                      type="text" 
                      className="form-input w-full"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="VD: 0912345678"
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Email công việc</label>
                    <input 
                      type="email" 
                      className="form-input w-full"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="VD: nguyen.van.a@company.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#2563EB', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.35rem' }}>
                  2. Thông tin Công tác & Vị trí
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Ngày vào làm <span style={{ color: '#EF4444' }}>*</span></label>
                    <input 
                      type="date" 
                      className="form-input w-full"
                      value={formData.joinDate}
                      onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phòng ban trực thuộc</label>
                    <select 
                      className="form-input w-full"
                      value={formData.departmentId}
                      onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                    >
                      <option value="">-- Chọn phòng ban --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Chức danh công việc</label>
                    <select 
                      className="form-input w-full"
                      value={formData.positionId}
                      onChange={e => setFormData({ ...formData, positionId: e.target.value })}
                    >
                      <option value="">-- Chọn chức vụ & cấp bậc --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} {p.level ? `(${p.level})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Trạng thái nhân sự <span style={{ color: '#EF4444' }}>*</span></label>
                    <select 
                      className="form-input w-full"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="ACTIVE">Chính thức (Active)</option>
                      <option value="PROBATION">Thử việc (Probation)</option>
                      <option value="ONBOARDING">Đang hội nhập (Onboarding)</option>
                      <option value="INTERNSHIP">Thực tập (Internship)</option>
                      <option value="RESIGNED">Đã thôi việc (Resigned)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
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
