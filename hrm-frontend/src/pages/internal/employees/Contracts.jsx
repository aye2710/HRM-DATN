import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, 
  Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown, Plus, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const Contracts = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, NO_CONTRACT, EXPIRING_30, OVERDUE, PROBATION, INDEFINITE
  const [showSalary, setShowSalary] = useState(true); // Toggle che/hiện lương
  const [hideResigned, setHideResigned] = useState(true); // Mặc định ẩn nhân viên đã nghỉ việc để tập trung nhân sự hiện hành
  
  // Sắp xếp (Sort)
  const [sortField, setSortField] = useState('PRIORITY'); // PRIORITY, CODE, NAME, END_DATE, SALARY
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Kiểm tra trạng thái hợp đồng nhân sự phục vụ bộ lọc
  const checkEmpStatus = (emp, type) => {
    const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
    
    if (type === 'NO_CONTRACT') {
      return !emp.contracts || emp.contracts.length === 0;
    }

    if (!activeContract) return false;

    if (type === 'INDEFINITE') {
      return activeContract.contractType === 'INDEFINITE';
    }
    if (type === 'PROBATION') {
      return activeContract.contractType === 'PROBATION' || emp.status === 'PROBATION';
    }

    if (activeContract.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(activeContract.endDate);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));

      if (type === 'EXPIRING_30') {
        return diffDays >= 0 && diffDays <= 30;
      }
      if (type === 'OVERDUE') {
        return diffDays < 0;
      }
    }
    return false;
  };

  // Tính điểm ưu tiên sắp xếp (HĐ Quá hạn -> Sắp hết hạn -> Thử việc -> Hiệu lực -> Chưa có HĐ -> Đã nghỉ việc)
  const getPriorityScore = (emp) => {
    if (emp.status === 'RESIGNED') return 999;
    const contract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
    if (!contract) return 800;

    if (contract.endDate) {
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

  // Đếm số lượng động cho từng tab bộ lọc
  const counts = useMemo(() => {
    const baseList = hideResigned ? employees.filter(e => e.status !== 'RESIGNED') : employees;
    return {
      all: baseList.length,
      noContract: baseList.filter(e => checkEmpStatus(e, 'NO_CONTRACT')).length,
      expiring30: baseList.filter(e => checkEmpStatus(e, 'EXPIRING_30')).length,
      overdue: baseList.filter(e => checkEmpStatus(e, 'OVERDUE')).length,
      probation: baseList.filter(e => checkEmpStatus(e, 'PROBATION')).length,
      indefinite: baseList.filter(e => checkEmpStatus(e, 'INDEFINITE')).length,
    };
  }, [employees, hideResigned]);

  // Lọc và Sắp xếp danh sách
  const sortedAndFilteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        if (hideResigned && emp.status === 'RESIGNED') return false;

        const matchSearch = 
          emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchSearch) return false;
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

        if (sortField === 'SALARY') {
          const salaryA = a.contracts?.[0]?.baseSalary ? Number(a.contracts[0].baseSalary) : 0;
          const salaryB = b.contracts?.[0]?.baseSalary ? Number(b.contracts[0].baseSalary) : 0;
          return sortOrder === 'asc' ? salaryA - salaryB : salaryB - salaryA;
        }

        return 0;
      });
  }, [employees, searchTerm, filterType, hideResigned, sortField, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, hideResigned, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedAndFilteredEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = sortedAndFilteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleSortToggle = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getDefiniteContractCount = (emp) => {
    if (!emp?.contracts) return 0;
    return emp.contracts.filter(c => c.contractType === 'OFFICIAL_1Y').length;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '0 đ';
    if (!showSalary) return '•••••••• đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
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
      return `${start} ➔ Không thời hạn`;
    }
    if (contract.endDate) {
      return `${start} ➔ ${new Date(contract.endDate).toLocaleDateString('vi-VN')}`;
    }
    return `${start} ➔ Chưa có ngày kết thúc`;
  };

  const getContractStatusBadge = (status, endDate, contractType) => {
    if (contractType === 'INDEFINITE') {
      return (
        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
          Không thời hạn
        </span>
      );
    }

    if (endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
      
      if (diffDays < -30) {
        return (
          <span className="badge" title="Đã quá 30 ngày kể từ ngày hết hạn (Điểm b Khoản 2 Điều 20 BLLĐ 2019)" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
            Quá hạn {Math.abs(diffDays)} ngày (Vô thời hạn)
          </span>
        );
      }
      if (diffDays < 0) {
        return (
          <span className="badge" title="Đang trong thời hạn 30 ngày tái ký" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
            Quá hạn {Math.abs(diffDays)} ngày
          </span>
        );
      }
      if (diffDays === 0) {
        return (
          <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
            Hết hạn hôm nay
          </span>
        );
      }
      if (diffDays <= 15) {
        return (
          <span className="badge" title="Hạn chót gửi thông báo theo quy chế nội bộ" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
            Còn {diffDays} ngày
          </span>
        );
      }
      if (diffDays <= 30) {
        return (
          <span className="badge" title="Chuẩn bị đánh giá và tái ký" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
            Còn {diffDays} ngày
          </span>
        );
      }
    }

    switch (status) {
      case 'ACTIVE': return <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>Hiệu lực</span>;
      case 'EXPIRED': return <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>Hết hạn</span>;
      case 'TERMINATED': return <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>Đã chấm dứt</span>;
      default: return <span className="badge badge-purple">{status}</span>;
    }
  };

  const getEmployeeStatusName = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Chính thức';
      case 'PROBATION': return 'Thử việc';
      case 'INTERNSHIP': return 'Thực tập';
      case 'ONBOARDING': return 'Đang hội nhập';
      case 'RESIGNED': return 'Đã nghỉ việc';
      default: return status || '—';
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-600 font-bold" /> : <ArrowDown size={12} className="text-blue-600 font-bold" />;
  };

  return (
    <div className="flex-col gap-4 animate-fade-in" style={{ padding: '0.5rem 0.5rem 1.5rem 0.5rem' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#0f172a' }}>
            Quản lý Hợp đồng Lao động
          </h1>
          <p className="text-muted text-xs mt-1" style={{ margin: '3px 0 0 0', color: '#64748b' }}>
            Theo dõi tiến trình hợp đồng của từng nhân viên, thời hạn hiệu lực, phụ lục điều chỉnh lương và hồ sơ scan lưu trữ.
          </p>
        </div>

        {/* Tiện ích lọc & Sắp xếp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569', cursor: 'pointer', userSelect: 'none', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input 
              type="checkbox" 
              checked={hideResigned} 
              onChange={(e) => setHideResigned(e.target.checked)} 
              style={{ cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <span>Ẩn nhân viên đã nghỉ việc</span>
          </label>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Sắp xếp:</span>
            <select
              className="form-input"
              style={{ height: '34px', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #cbd5e1' }}
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setSortOrder('asc');
              }}
            >
              <option value="PRIORITY">⚡ Ưu tiên xử lý (Hết hạn ➔ Thử việc ➔ Hiệu lực)</option>
              <option value="END_DATE">📅 Hạn hợp đồng gần nhất</option>
              <option value="CODE">🏷️ Mã nhân sự (A-Z)</option>
              <option value="NAME">👤 Tên nhân sự (A-Z)</option>
              <option value="SALARY">💰 Mức lương cơ bản</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card glass flex-col p-0 overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Toolbar */}
        <div className="p-3.5 border-b border-[var(--border)] flex justify-between items-center gap-4" style={{ flexWrap: 'wrap' }}>
          
          {/* Ô tìm kiếm */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo tên, mã NV, phòng ban..." 
              className="form-input w-full"
              style={{ paddingLeft: '2.3rem', height: '34px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Segmented Control Pills */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '10px', gap: '3px', flexWrap: 'wrap' }}>
            
            <button
              onClick={() => setFilterType('ALL')}
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: filterType === 'ALL' ? 700 : 500,
                backgroundColor: filterType === 'ALL' ? '#ffffff' : 'transparent',
                color: filterType === 'ALL' ? '#0f172a' : '#64748b',
                boxShadow: filterType === 'ALL' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <span>Tất cả</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 600 }}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setFilterType('NO_CONTRACT')}
              title="Nhân viên chưa có hồ sơ hợp đồng"
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: filterType === 'NO_CONTRACT' ? 700 : 500,
                backgroundColor: filterType === 'NO_CONTRACT' ? '#ffffff' : 'transparent',
                color: filterType === 'NO_CONTRACT' ? '#475569' : '#64748b',
                boxShadow: filterType === 'NO_CONTRACT' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <span>Chưa có HĐ</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600 }}>
                {counts.noContract}
              </span>
            </button>

            <button
              onClick={() => setFilterType('EXPIRING_30')}
              title="Chuẩn bị tái ký hoặc gửi thông báo"
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: filterType === 'EXPIRING_30' ? 700 : 500,
                backgroundColor: filterType === 'EXPIRING_30' ? '#ffffff' : 'transparent',
                color: filterType === 'EXPIRING_30' ? '#c2410c' : '#64748b',
                boxShadow: filterType === 'EXPIRING_30' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <span>Sắp hết hạn ≤ 30 ngày</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: counts.expiring30 > 0 ? '#ffedd5' : '#e2e8f0', color: counts.expiring30 > 0 ? '#c2410c' : '#64748b', fontWeight: 700 }}>
                {counts.expiring30}
              </span>
            </button>

            <button
              onClick={() => setFilterType('OVERDUE')}
              title="Đã qua ngày kết thúc mà chưa ký hợp đồng mới"
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: filterType === 'OVERDUE' ? 700 : 500,
                backgroundColor: filterType === 'OVERDUE' ? '#ffffff' : 'transparent',
                color: filterType === 'OVERDUE' ? '#b91c1c' : '#64748b',
                boxShadow: filterType === 'OVERDUE' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <span>Đã quá hạn</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: counts.overdue > 0 ? '#fee2e2' : '#e2e8f0', color: counts.overdue > 0 ? '#b91c1c' : '#64748b', fontWeight: 700 }}>
                {counts.overdue}
              </span>
            </button>

            <button
              onClick={() => setFilterType('PROBATION')}
              title="Nhân viên đang trong thời gian thử việc"
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: filterType === 'PROBATION' ? 700 : 500,
                backgroundColor: filterType === 'PROBATION' ? '#ffffff' : 'transparent',
                color: filterType === 'PROBATION' ? '#4f46e5' : '#64748b',
                boxShadow: filterType === 'PROBATION' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <span>Thử việc</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                {counts.probation}
              </span>
            </button>

            <button
              onClick={() => setFilterType('INDEFINITE')}
              title="Hợp đồng chính thức không xác định thời hạn"
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: filterType === 'INDEFINITE' ? 700 : 500,
                backgroundColor: filterType === 'INDEFINITE' ? '#ffffff' : 'transparent',
                color: filterType === 'INDEFINITE' ? '#15803d' : '#64748b',
                boxShadow: filterType === 'INDEFINITE' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <span>Không thời hạn</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                {counts.indefinite}
              </span>
            </button>
          </div>
        </div>

        {/* Bảng danh sách Hợp đồng */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-muted" style={{ fontSize: '0.9rem' }}>Đang tải dữ liệu hồ sơ hợp đồng...</div>
          ) : (
            <table className="w-full text-left border-collapse" style={{ minWidth: '950px', tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  
                  {/* Cột 1: Mã NV (90px) */}
                  <th 
                    onClick={() => handleSortToggle('CODE')}
                    className="p-3.5 text-xs font-semibold text-[#64748b] cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ width: '90px', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>MÃ NV</span>
                      {renderSortIcon('CODE')}
                    </div>
                  </th>

                  {/* Cột 2: Họ và tên (22%) */}
                  <th 
                    onClick={() => handleSortToggle('NAME')}
                    className="p-3.5 text-xs font-semibold text-[#64748b] cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ width: '22%', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>HỌ VÀ TÊN</span>
                      {renderSortIcon('NAME')}
                    </div>
                  </th>

                  {/* Cột 3: Chức vụ / Phòng ban (20%) */}
                  <th className="p-3.5 text-xs font-semibold text-[#64748b]" style={{ width: '20%' }}>
                    CHỨC VỤ / PHÒNG BAN
                  </th>

                  {/* Cột 4: Hợp đồng & Thời hạn (28%) */}
                  <th 
                    onClick={() => handleSortToggle('END_DATE')}
                    className="p-3.5 text-xs font-semibold text-[#64748b] cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ width: '28%', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>HỢP ĐỒNG & THỜI HẠN</span>
                      {renderSortIcon('END_DATE')}
                    </div>
                  </th>

                  {/* Cột 5: Thu nhập (18%) */}
                  <th 
                    onClick={() => handleSortToggle('SALARY')}
                    className="p-3.5 text-xs font-semibold text-[#64748b] cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ width: '18%', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>THU NHẬP</span>
                        {renderSortIcon('SALARY')}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSalary(!showSalary);
                        }}
                        title={showSalary ? "Ẩn số tiền lương" : "Hiện số tiền lương"}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        {showSalary ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </th>

                  {/* Cột 6: Thao tác (150px) */}
                  <th className="p-3.5 text-xs font-semibold text-[#64748b] text-right" style={{ width: '150px' }}>
                    THAO TÁC
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted" style={{ fontSize: '0.85rem' }}>
                      Không tìm thấy nhân sự phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map(emp => {
                    const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
                    const defCount = getDefiniteContractCount(emp);
                    const isResigned = emp.status === 'RESIGNED';

                    return (
                      <tr 
                        key={emp.id} 
                        className={`border-b border-[#f1f5f9] transition-colors ${isResigned ? 'bg-slate-50/60 opacity-70 hover:opacity-100' : 'hover:bg-[#f8fafc]'}`}
                      >
                        {/* Cột 1: Mã NV */}
                        <td className="p-3.5 font-semibold text-blue-600 text-xs">
                          {emp.code}
                        </td>

                        {/* Cột 2: Họ và tên & Trạng thái */}
                        <td className="p-3.5">
                          <div className="flex-col">
                            <span className="font-semibold text-slate-800 text-sm truncate block" title={emp.fullName}>
                              {emp.fullName}
                            </span>
                            <span className="text-xs text-slate-400 mt-0.5 block">
                              Trạng thái: <strong className={isResigned ? 'text-rose-600 font-semibold' : 'text-slate-600 font-medium'}>{getEmployeeStatusName(emp.status)}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Cột 3: Chức vụ & Phòng ban */}
                        <td className="p-3.5">
                          <div className="font-medium text-slate-700 text-xs truncate" title={emp.position?.title || '—'}>
                            {emp.position?.title || '—'}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate" title={emp.department?.name || '—'}>
                            {emp.department?.name || '—'}
                          </div>
                        </td>
                        
                        {/* Cột 4: Hợp đồng & Thời hạn */}
                        <td className="p-3.5">
                          {activeContract ? (
                            <div className="flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-800 text-xs">
                                  {getContractTypeName(activeContract.contractType)}
                                </span>
                                {getContractStatusBadge(activeContract.status, activeContract.endDate, activeContract.contractType)}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {formatContractPeriod(activeContract)}
                              </div>
                              {defCount >= 2 ? (
                                <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                                  • Đã đủ 2 lần HĐ có thời hạn (Lần sau ký vô thời hạn)
                                </div>
                              ) : defCount === 1 ? (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  • Đã ký 1/2 lần HĐ có thời hạn
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa có hợp đồng</span>
                          )}
                        </td>

                        {/* Cột 5: Thu nhập */}
                        <td className="p-3.5">
                          {activeContract ? (
                            <div className="flex-col gap-0.5 text-xs">
                              <div className="text-slate-700">
                                Lương CB: <strong className="text-emerald-700 font-semibold">{formatCurrency(activeContract.baseSalary)}</strong>
                              </div>
                              {Number(activeContract.allowance) > 0 && (
                                <div className="text-slate-400 text-[11px]">
                                  Phụ cấp: {formatCurrency(activeContract.allowance)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Cột 6: Thao tác thông minh */}
                        <td className="p-3.5 text-right">
                          {(() => {
                            const isProb = emp.status === 'PROBATION' || emp.status === 'INTERNSHIP';
                            let isExpiring = false;
                            if (activeContract?.endDate && activeContract.contractType !== 'INDEFINITE') {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const end = new Date(activeContract.endDate);
                              end.setHours(0, 0, 0, 0);
                              const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
                              if (diffDays <= 30) {
                                isExpiring = true;
                              }
                            }

                            if (isProb && !isResigned) {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                  <button 
                                    onClick={() => navigate(`/internal/employees/contracts/${emp.id}?action=sign`)} 
                                    className="btn btn-primary" 
                                    style={{ padding: '4px 8px', fontSize: '0.74rem', backgroundColor: '#16a34a', borderColor: '#16a34a', color: 'white', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                                    title="Đánh giá thử việc & ký hợp đồng chính thức"
                                  >
                                    <CheckCircle2 size={12} /> Ký chính thức
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/internal/employees/contracts/${emp.id}`)} 
                                    className="btn btn-outline" 
                                    style={{ padding: '4px 8px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    title="Xem lịch sử hợp đồng"
                                  >
                                    Lịch sử <ChevronRight size={12} />
                                  </button>
                                </div>
                              );
                            }

                            if (isExpiring && !isResigned) {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                  <button 
                                    onClick={() => navigate(`/internal/employees/contracts/${emp.id}?action=sign`)} 
                                    className="btn btn-primary" 
                                    style={{ padding: '4px 8px', fontSize: '0.74rem', backgroundColor: '#ea580c', borderColor: '#ea580c', color: 'white', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                                    title="Tái ký hoặc gia hạn hợp đồng mới"
                                  >
                                    <Plus size={12} /> Tái ký HĐ
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/internal/employees/contracts/${emp.id}`)} 
                                    className="btn btn-outline" 
                                    style={{ padding: '4px 8px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    title="Xem lịch sử hợp đồng"
                                  >
                                    Lịch sử <ChevronRight size={12} />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button 
                                onClick={() => navigate(`/internal/employees/contracts/${emp.id}`)} 
                                className="btn btn-outline" 
                                style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                Lịch sử HĐ <ChevronRight size={13} />
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Phân trang */}
        {sortedAndFilteredEmployees.length > 0 && (
          <div className="flex justify-between items-center p-3 border-t border-[#e2e8f0] bg-white flex-shrink-0" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Hiển thị</span>
              <select
                className="form-input"
                style={{ width: '64px', padding: '3px 6px', fontSize: '0.8rem', borderRadius: '6px' }}
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
              <span>nhân sự / trang ({startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedAndFilteredEmployees.length)} trong {sortedAndFilteredEmployees.length})</span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.3 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronsLeft size={14} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.3 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>

              {(() => {
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 || 
                    i === totalPages || 
                    (i >= currentPage - 1 && i <= currentPage + 1)
                  ) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== '...') {
                    pages.push('...');
                  }
                }
                return pages.map((page, idx) => 
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.8rem' }}>...</span>
                  ) : (
                    <button
                      key={page}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: '30px', height: '30px', padding: '0 6px', fontSize: '0.8rem', fontWeight: currentPage === page ? 700 : 500 }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              <button 
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.3 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.3 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
