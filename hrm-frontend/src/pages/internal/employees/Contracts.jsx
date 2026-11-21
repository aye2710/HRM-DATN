import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, CheckCircle2, FileText, Calendar, Clock, AlertTriangle, AlertCircle, 
  RefreshCw, FileSpreadsheet,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { formatDate } from '../../../utils/dateUtils';
import { compareVietnameseNames } from '../../../utils/sortUtils';
import { PageHeader } from '../../../components/common/PageHeader';

export const Contracts = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, ACTIVE, EXPIRING_30, EXPIRED, TERMINATED, NO_CONTRACT
  const [contractTypeFilter, setContractTypeFilter] = useState('ALL'); // ALL, INTERNSHIP, PROBATION, OFFICIAL_1Y, INDEFINITE, NO_CONTRACT
  const [hideResigned, setHideResigned] = useState(true);
  
  // Sort (Phương án 2: Mặc định Tên A-Z, click tiêu đề cột để đảo chiều)
  const [sortField, setSortField] = useState('NAME'); // NAME, CODE, DEPARTMENT, END_DATE, STATUS, PRIORITY
  const [sortOrder, setSortOrder] = useState('asc');

  // Toggle sắp xếp khi click cột
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

        if (contractTypeFilter !== 'ALL') {
          const activeC = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
          if (contractTypeFilter === 'NO_CONTRACT') {
            if (emp.contracts && emp.contracts.length > 0) return false;
          } else {
            if (!activeC || activeC.contractType !== contractTypeFilter) return false;
          }
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
        if (sortField === 'NAME') {
          return compareVietnameseNames(a.fullName, b.fullName, sortOrder);
        }

        if (sortField === 'CODE') {
          const comp = (a.code || '').localeCompare(b.code || '', 'vi', { numeric: true });
          return sortOrder === 'asc' ? comp : -comp;
        }

        if (sortField === 'DEPARTMENT') {
          const comp = (a.department?.name || '').localeCompare(b.department?.name || '', 'vi');
          return sortOrder === 'asc' ? comp : -comp;
        }

        if (sortField === 'STATUS') {
          const comp = (a.status || '').localeCompare(b.status || '');
          return sortOrder === 'asc' ? comp : -comp;
        }

        if (sortField === 'END_DATE') {
          const getEndDateVal = (emp) => {
            const c = emp.contracts?.find(x => x.status === 'ACTIVE') || emp.contracts?.[0];
            if (!c) return 9999999999999;
            if (c.contractType === 'INDEFINITE') return 9999999999990;
            return c.endDate ? new Date(c.endDate).getTime() : 9999999999999;
          };
          const dateA = getEndDateVal(a);
          const dateB = getEndDateVal(b);
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (sortField === 'PRIORITY') {
          const scoreA = getPriorityScore(a);
          const scoreB = getPriorityScore(b);
          return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        }

        return 0;
      });
  }, [employees, searchTerm, deptFilter, filterType, contractTypeFilter, hideResigned, sortField, sortOrder]);

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
  }, [searchTerm, deptFilter, filterType, contractTypeFilter, hideResigned, sortField, sortOrder, resetPage]);

  const getDefiniteContractCount = (emp) => {
    if (!emp?.contracts) return 0;
    return emp.contracts.filter(c => c.contractType === 'OFFICIAL_1Y').length;
  };

  const getContractTypeName = (type) => {
    switch (type) {
      case 'INTERNSHIP': return 'Hợp đồng Thực tập';
      case 'PROBATION': return 'Hợp đồng Thử việc';
      case 'OFFICIAL_1Y': return 'HĐ Chính thức (Có thời hạn 1 năm)';
      case 'INDEFINITE': return 'HĐ Chính thức (Không thời hạn)';
      default: return type || 'Chưa xác định';
    }
  };

  const formatContractPeriod = (contract) => {
    if (!contract) return '—';
    const start = formatDate(contract.startDate);
    if (contract.contractType === 'INDEFINITE') {
      return `${start} — Vô thời hạn`;
    }
    if (contract.endDate) {
      return `${start} — ${formatDate(contract.endDate)}`;
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

  const renderSortableTh = (field, label, style = {}) => {
    const isCurrent = sortField === field;
    return (
      <th 
        key={field}
        onClick={() => handleSort(field)}
        style={{ 
          cursor: 'pointer', 
          userSelect: 'none', 
          transition: 'background-color 0.15s',
          ...style 
        }}
        className="hover:bg-slate-100"
        title={`Sắp xếp theo ${label} (${isCurrent && sortOrder === 'asc' ? 'đang tăng dần, nhấp để giảm dần' : 'nhấp để tăng dần'})`}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontWeight: isCurrent ? 700 : 600, color: isCurrent ? '#1E293B' : '#475569' }}>{label}</span>
          {isCurrent ? (
            sortOrder === 'asc' ? (
              <ArrowUp size={13} style={{ color: '#2563EB', strokeWidth: 2.5, flexShrink: 0 }} />
            ) : (
              <ArrowDown size={13} style={{ color: '#2563EB', strokeWidth: 2.5, flexShrink: 0 }} />
            )
          ) : (
            <ArrowUpDown size={12} style={{ color: '#94A3B8', opacity: 0.5, flexShrink: 0 }} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="flex-col gap-5 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      
      {/* 1. Header chuẩn đồng bộ */}
      <PageHeader
        icon={<FileText size={20} />}
        title="Quản lý Hợp đồng Lao động"
        subtitle="Theo dõi thời hạn hiệu lực, cảnh báo tái ký theo Luật Lao động và hồ sơ lưu trữ nhân sự"
        actions={
          <>
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
          </>
        }
      />

      {/* 2. Main Table Card */}
      <div className="card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Filter Toolbar (Các bộ lọc đặt sát tìm kiếm, bỏ khoảng trống lớn) */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.625rem' }}>
          
          {/* Ô tìm kiếm bên trái */}
          <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
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

          {/* Lọc phòng ban */}
          <select
            className="form-input"
            style={{ width: '175px', height: '38px', backgroundColor: '#ffffff' }}
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Lọc trạng thái hợp đồng */}
          <select
            className="form-input"
            style={{ width: '165px', height: '38px', backgroundColor: '#ffffff' }}
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiệu lực</option>
            <option value="EXPIRING_30">Sắp hết hạn (30 ngày)</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="TERMINATED">Đã chấm dứt</option>
          </select>

          {/* Lọc Loại hợp đồng (Thay thế dropdown Sắp xếp theo yêu cầu) */}
          <select
            className="form-input"
            style={{ width: '200px', height: '38px', backgroundColor: '#ffffff' }}
            value={contractTypeFilter}
            onChange={(e) => {
              setContractTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">Tất cả loại hợp đồng</option>
            <option value="INTERNSHIP">Hợp đồng Thực tập</option>
            <option value="PROBATION">Hợp đồng Thử việc</option>
            <option value="OFFICIAL_1Y">HĐ Chính thức (Có thời hạn)</option>
            <option value="INDEFINITE">HĐ Chính thức (Không thời hạn)</option>
            <option value="NO_CONTRACT">Chưa có hợp đồng</option>
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

        {/* Bảng danh sách: Tách riêng Hợp đồng và Thời hạn hiện tại thành 2 cột */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {renderSortableTh('CODE', 'Mã NV', { width: '90px' })}
                {renderSortableTh('NAME', 'Họ và tên', { minWidth: '175px' })}
                {renderSortableTh('DEPARTMENT', 'Phòng ban & Vị trí', { minWidth: '165px' })}
                <th style={{ minWidth: '220px' }}>Hợp đồng</th>
                {renderSortableTh('END_DATE', 'Thời hạn hiện tại', { minWidth: '185px' })}
                {renderSortableTh('STATUS', 'Trạng thái', { minWidth: '145px' })}
                <th style={{ width: '85px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-8">
                    Đang tải dữ liệu hồ sơ hợp đồng từ hệ thống...
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-8">
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
                          className="cursor-pointer group"
                          onClick={() => navigate(`/internal/contracts/${emp.id}`)}
                          title="Nhấp để xem toàn bộ lịch sử hợp đồng của nhân sự này"
                        >
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
                      </td>

                      {/* Phòng ban & Vị trí */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{emp.position?.title || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department?.name || '—'}</div>
                      </td>

                      {/* Tách riêng cột 1: Hợp đồng (Tên đầy đủ) */}
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
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Chưa có hợp đồng</span>
                        )}
                      </td>

                      {/* Tách riêng cột 2: Thời hạn hiện tại */}
                      <td>
                        {activeContract ? (
                          <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <span>{formatContractPeriod(activeContract)}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
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
