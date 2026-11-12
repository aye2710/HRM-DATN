import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, CheckCircle2, FileText, Calendar, Clock, AlertTriangle, AlertCircle, 
  RefreshCw, FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';

export const Contracts = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, ACTIVE, EXPIRING_30, EXPIRED, TERMINATED, NO_CONTRACT
  const [hideResigned, setHideResigned] = useState(true);
  
  // Sort
  const [sortField, setSortField] = useState('PRIORITY'); // PRIORITY, END_DATE, CODE, NAME
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải danh sách hồ sơ hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Danh sách phòng ban
  const departments = useMemo(() => {
    const map = new Map();
    employees.forEach(e => {
      if (e.department?.id && e.department?.name) {
        map.set(e.department.id, e.department.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [employees]);

  // Kiểm tra trạng thái HĐ của nhân sự phục vụ bộ lọc
  const checkEmpStatus = (emp, type) => {
    const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
    
    if (type === 'NO_CONTRACT') {
      return !emp.contracts || emp.contracts.length === 0;
    }

    if (!activeContract) return false;

    if (type === 'TERMINATED') {
      return activeContract.status === 'TERMINATED';
    }

    let diffDays = null;
    if (activeContract.endDate && activeContract.contractType !== 'INDEFINITE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(activeContract.endDate);
      end.setHours(0, 0, 0, 0);
      diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
    }

    if (type === 'EXPIRED') {
      return activeContract.status === 'EXPIRED' || (diffDays !== null && diffDays < 0);
    }

    if (type === 'EXPIRING_30') {
      return diffDays !== null && diffDays >= 0 && diffDays <= 30 && activeContract.status === 'ACTIVE';
    }

    if (type === 'ACTIVE') {
      return activeContract.status === 'ACTIVE' && (diffDays === null || diffDays >= 0);
    }

    return true;
  };

  // Điểm ưu tiên sắp xếp
  const getPriorityScore = (emp) => {
    if (emp.status === 'RESIGNED') return 999;
    const contract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
    if (!contract) return 800;
    if (contract.status === 'TERMINATED') return 700;

    if (contract.endDate && contract.contractType !== 'INDEFINITE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(contract.endDate);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));

      if (diffDays < 0) return 100 + diffDays;
      if (diffDays <= 30) return 200 + diffDays;
    }

    if (contract.contractType === 'PROBATION' || emp.status === 'PROBATION') return 300;
    if (contract.contractType === 'OFFICIAL_1Y') return 400;
    if (contract.contractType === 'INDEFINITE') return 500;
    return 600;
  };

  // Lọc và Sắp xếp
  const sortedAndFilteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        if (hideResigned && emp.status === 'RESIGNED') return false;

        if (deptFilter && emp.departmentId !== deptFilter && emp.department?.id !== deptFilter) {
          return false;
        }

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchCode = emp.code?.toLowerCase().includes(q);
          const matchName = emp.fullName?.toLowerCase().includes(q);
          const matchDept = emp.department?.name?.toLowerCase().includes(q);
          const matchPos = emp.position?.title?.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchDept && !matchPos) {
            return false;
          }
        }

        if (filterType === 'ALL') return true;
        return checkEmpStatus(emp, filterType);
      })
      .sort((a, b) => {
        if (sortField === 'PRIORITY') {
          const scoreA = getPriorityScore(a);
          const scoreB = getPriorityScore(b);
          return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        }

        if (sortField === 'CODE') {
          return sortOrder === 'asc' 
            ? a.code.localeCompare(b.code, 'vi', { numeric: true }) 
            : b.code.localeCompare(a.code, 'vi', { numeric: true });
        }

        if (sortField === 'NAME') {
          return sortOrder === 'asc'
            ? a.fullName.localeCompare(b.fullName, 'vi')
            : b.fullName.localeCompare(a.fullName, 'vi');
        }

        if (sortField === 'END_DATE') {
          const dateA = a.contracts?.[0]?.endDate ? new Date(a.contracts[0].endDate).getTime() : 9999999999999;
          const dateB = b.contracts?.[0]?.endDate ? new Date(b.contracts[0].endDate).getTime() : 9999999999999;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return 0;
      });
  }, [employees, searchTerm, deptFilter, filterType, hideResigned, sortField, sortOrder]);

  const {
    currentPage,
    setCurrentPage,
    pageSize: itemsPerPage,
    setPageSize: setItemsPerPage,
    totalItems,
    totalPages,
    paginatedItems: paginatedEmployees,
    resetPage,
  } = usePagination(sortedAndFilteredEmployees, 10);

  useEffect(() => {
    resetPage();
  }, [searchTerm, deptFilter, filterType, hideResigned, sortField, sortOrder, resetPage]);

  const getDefiniteContractCount = (emp) => {
    if (!emp?.contracts) return 0;
    return emp.contracts.filter(c => c.contractType === 'OFFICIAL_1Y').length;
  };

  const getContractTypeName = (type) => {
    switch (type) {
      case 'INTERNSHIP': return 'Thực tập sinh';
      case 'PROBATION': return 'Thử việc';
      case 'OFFICIAL_1Y': return 'Có thời hạn (1 năm)';
      case 'INDEFINITE': return 'Không xác định thời hạn';
      default: return type || 'Chưa xác định';
    }
  };

  const formatContractPeriod = (contract) => {
    if (!contract) return '—';
    const start = new Date(contract.startDate).toLocaleDateString('vi-VN');
    if (contract.contractType === 'INDEFINITE') {
      return `${start} — Vô thời hạn`;
    }
    if (contract.endDate) {
      return `${start} — ${new Date(contract.endDate).toLocaleDateString('vi-VN')}`;
    }
    return `${start} — Chưa có ngày hết`;
  };

  const getEmployeeStatusName = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Chính thức';
      case 'PROBATION': return 'Thử việc';
      case 'INTERNSHIP': return 'Thực tập';
      case 'ONBOARDING': return 'Đang hội nhập';
      case 'RESIGNED': return 'Đã thôi việc';
      default: return status || '—';
    }
  };

  // Xuất file CSV
  const handleExportCSV = () => {
    if (sortedAndFilteredEmployees.length === 0) {
      toast.error('Không có dữ liệu để xuất file');
      return;
    }
    const headers = [
      'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức vụ', 'Trạng thái nhân sự',
      'Loại hợp đồng hiện tại', 'Ngày bắt đầu', 'Ngày kết thúc', 'Tình trạng hợp đồng'
    ];
    const rows = sortedAndFilteredEmployees.map(emp => {
      const c = emp.contracts?.find(x => x.status === 'ACTIVE') || emp.contracts?.[0];
      return [
        `"${emp.code || ''}"`,
        `"${emp.fullName || ''}"`,
        `"${emp.department?.name || ''}"`,
        `"${emp.position?.title || ''}"`,
        `"${getEmployeeStatusName(emp.status)}"`,
        `"${c ? getContractTypeName(c.contractType) : 'Chưa có HĐ'}"`,
        `"${c?.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : ''}"`,
        `"${c?.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : (c?.contractType === 'INDEFINITE' ? 'Không thời hạn' : '')}"`,
        `"${c?.status || ''}"`
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_hop_dong_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file báo cáo Hợp đồng thành công!');
  };

  // 3 Trạng thái chính thức: Đang hiệu lực, Đã hết hạn, Đã chấm dứt (kèm cảnh báo bên dưới nếu có)
  const renderContractStatusBadge = (contract) => {
    if (!contract) {
      return (
        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
          Chưa có HĐ
        </span>
      );
    }

    if (contract.status === 'TERMINATED') {
      return (
        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
          Đã chấm dứt
        </span>
      );
    }

    let diffDays = null;
    if (contract.endDate && contract.contractType !== 'INDEFINITE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(contract.endDate);
      end.setHours(0, 0, 0, 0);
      diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
    }

    // 1. Đã hết hạn
    if (contract.status === 'EXPIRED' || (diffDays !== null && diffDays < 0)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="badge badge-danger">
            Đã hết hạn
          </span>
          {diffDays !== null && (
            <div style={{ 
              fontSize: '0.7rem', 
              color: diffDays < -30 ? '#7c3aed' : '#dc2626', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '3px', 
              marginTop: '3px',
              fontWeight: 500
            }}>
              <AlertTriangle size={11} />
              {diffDays < -30 
                ? `Quá ${Math.abs(diffDays)} ngày (Vô thời hạn)` 
                : `Quá hạn ${Math.abs(diffDays)} ngày`}
            </div>
          )}
        </div>
      );
    }

    // 2. Đang hiệu lực (kèm cảnh báo sắp hết hạn ngay bên dưới nếu còn <= 30 ngày)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span className="badge badge-success">
          Đang hiệu lực
        </span>
        {diffDays !== null && diffDays === 0 && (
          <div style={{ fontSize: '0.7rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontWeight: 600 }}>
            <Clock size={11} /> Hết hạn hôm nay
          </div>
        )}
        {diffDays !== null && diffDays > 0 && diffDays <= 30 && (
          <div style={{ fontSize: '0.7rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontWeight: 500 }}>
            <Clock size={11} /> Sắp hết hạn (còn {diffDays} ngày)
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-col gap-5 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      
      {/* 1. Header chuẩn đồng bộ với Quyết Định / Phòng Ban */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Quản lý Hợp đồng Lao động
          </h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Theo dõi thời hạn hiệu lực, cảnh báo tái ký theo Luật Lao động và hồ sơ lưu trữ nhân sự
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>
          <button 
            onClick={fetchEmployees} 
            className="btn btn-outline"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Main Table Card */}
      <div className="card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Filter Toolbar (1 dòng duy nhất, thẳng hàng, không rớt dòng) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Ô tìm kiếm bên trái */}
          <div style={{ position: 'relative', width: '320px', flexShrink: 0 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm tên nhân sự, mã NV, chức danh..."
              className="form-input"
              style={{ paddingLeft: '2.5rem', height: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Nhóm bộ lọc bên phải */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Lọc phòng ban */}
            <select
              className="form-input"
              style={{ width: '180px', height: '38px', backgroundColor: '#ffffff' }}
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Lọc trạng thái hợp đồng: Đúng 3 trạng thái chính thức */}
            <select
              className="form-input"
              style={{ width: '170px', height: '38px', backgroundColor: '#ffffff' }}
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="TERMINATED">Đã chấm dứt</option>
            </select>

            {/* Sắp xếp */}
            <select
              className="form-input"
              style={{ width: '160px', height: '38px', backgroundColor: '#ffffff' }}
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setSortOrder('asc');
              }}
            >
              <option value="PRIORITY">Ưu tiên xử lý</option>
              <option value="END_DATE">Hạn hợp đồng</option>
              <option value="CODE">Mã nhân sự</option>
              <option value="NAME">Tên nhân sự</option>
            </select>

            {/* Checkbox ẩn thôi việc */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#64748b', cursor: 'pointer', userSelect: 'none', marginLeft: '4px' }}>
              <input
                type="checkbox"
                checked={hideResigned}
                onChange={(e) => setHideResigned(e.target.checked)}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <span>Ẩn đã thôi việc</span>
            </label>
          </div>
        </div>

        {/* Bảng danh sách 6 cột rõ ràng, thoáng mắt */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Mã NV</th>
                <th style={{ minWidth: '180px' }}>Họ và tên</th>
                <th style={{ minWidth: '170px' }}>Phòng ban & Vị trí</th>
                <th style={{ minWidth: '240px' }}>Hợp đồng & Thời hạn hiện tại</th>
                <th style={{ minWidth: '160px' }}>Trạng thái</th>
                <th style={{ width: '95px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-8">
                    Đang tải dữ liệu hồ sơ hợp đồng từ hệ thống...
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-8">
                    Không tìm thấy hồ sơ hợp đồng phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map(emp => {
                  const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
                  const defCount = getDefiniteContractCount(emp);
                  const isResigned = emp.status === 'RESIGNED';
                  const isProb = emp.status === 'PROBATION' || emp.status === 'INTERNSHIP';

                  let isExpiring = false;
                  if (activeContract?.endDate && activeContract.contractType !== 'INDEFINITE') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const end = new Date(activeContract.endDate);
                    end.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
                    if (diffDays <= 30) isExpiring = true;
                  }

                  return (
                    <tr key={emp.id}>
                      {/* Mã NV */}
                      <td>
                        <span 
                          onClick={() => navigate(`/internal/contracts/${emp.id}`)}
                          className="cursor-pointer hover:underline"
                          style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}
                          title="Nhấp để xem toàn bộ hồ sơ hợp đồng"
                        >
                          {emp.code}
                        </span>
                      </td>

                      {/* Họ và tên */}
                      <td>
                        <div 
                          className="flex items-center gap-2.5 cursor-pointer group"
                          onClick={() => navigate(`/internal/contracts/${emp.id}`)}
                          title="Nhấp để xem toàn bộ lịch sử hợp đồng của nhân sự này"
                        >
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                            {emp.fullName?.trim().split(' ').slice(-1)[0]?.charAt(0) || 'N'}
                          </div>
                          <div>
                            <span 
                              className="group-hover:text-blue-600 transition-colors"
                              style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}
                            >
                              {emp.fullName}
                            </span>
                            {isResigned && (
                              <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>Đã thôi việc</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phòng ban & Vị trí */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{emp.position?.title || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department?.name || '—'}</div>
                      </td>

                      {/* Hợp đồng & Thời hạn hiện tại */}
                      <td>
                        {activeContract ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                {getContractTypeName(activeContract.contractType)}
                              </span>
                              {defCount >= 2 && (
                                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontWeight: 600 }} title="Đã ký đủ 2 lần HĐ có thời hạn theo Khoản 2 Điều 20 BLLĐ 2019">
                                  Lần 2/2 (Sau này vô thời hạn)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                              <span>{formatContractPeriod(activeContract)}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có hợp đồng</span>
                        )}
                      </td>

                      {/* Trạng thái (3 trạng thái chính thức: Đang hiệu lực, Đã hết hạn, Đã chấm dứt + Cảnh báo bên dưới) */}
                      <td>
                        {renderContractStatusBadge(activeContract)}
                      </td>

                      {/* Thao tác (Icon buttons gọn gàng, bỏ chữ, có tooltip giải thích) */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          {/* Nút hành động nhanh: Tạo HĐ / Đánh giá / Tái ký */}
                          {!activeContract && !isResigned ? (
                            <button
                              onClick={() => navigate(`/internal/contracts/${emp.id}?action=sign`)}
                              className="btn btn-primary"
                              style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Lập hợp đồng mới cho nhân sự này"
                            >
                              <Plus size={15} />
                            </button>
                          ) : isProb && !isResigned ? (
                            <button
                              onClick={() => navigate(`/internal/contracts/${emp.id}?action=sign`)}
                              className="btn btn-primary"
                              style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Đánh giá thử việc & Ký hợp đồng chính thức"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          ) : isExpiring && !isResigned ? (
                            <button
                              onClick={() => navigate(`/internal/contracts/${emp.id}?action=sign`)}
                              className="btn btn-primary"
                              style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', backgroundColor: '#ea580c', borderColor: '#ea580c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Tái ký hoặc gia hạn hợp đồng mới"
                            >
                              <Plus size={15} />
                            </button>
                          ) : null}

                          {/* Nút xem lịch sử hợp đồng */}
                          <button
                            onClick={() => navigate(`/internal/contracts/${emp.id}`)}
                            className="btn btn-outline"
                            style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title={`Xem toàn bộ lịch sử hợp đồng (${emp.contracts?.length || 0} hợp đồng)`}
                          >
                            <FileText size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setItemsPerPage}
          itemLabel="nhân sự"
          flush={false}
        />
      </div>
    </div>
  );
};
