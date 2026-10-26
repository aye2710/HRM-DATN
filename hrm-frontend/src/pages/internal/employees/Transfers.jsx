import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, ArrowRight, X, History, Users, 
  Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  FileText, CheckCircle2, AlertCircle, DollarSign, Building, Briefcase, 
  ExternalLink, RotateCcw, Calendar, FileSignature, Info
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const Transfers = () => {
  const navigate = useNavigate();

  // Active tab: 'ACTIVE_EMPLOYEES' | 'HISTORY'
  const [activeTab, setActiveTab] = useState('ACTIVE_EMPLOYEES');

  // Main data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filters for Active Employees
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');

  // Pagination for Active Employees
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters and Pagination for History
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi khi tải dữ liệu nhân sự');
    } finally {
      setLoading(false);
    }
  };

  // Fetch history data when tab is switched
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/employees/history');
      setHistoryList(res.data);
    } catch (error) {
      console.error('Error fetching employment history:', error);
      toast.error('Lỗi khi tải lịch sử biến động');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

  // Filtered employees
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status !== 'RESIGNED');
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(emp => {
      const matchSearch = 
        !searchTerm ||
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = !deptFilter || emp.departmentId === deptFilter;
      const matchPos = !posFilter || emp.positionId === posFilter;

      return matchSearch && matchDept && matchPos;
    });
  }, [activeEmployees, searchTerm, deptFilter, posFilter]);

  // Pagination for Active Employees
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, posFilter, itemsPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // History filtering & pagination
  const filteredHistory = useMemo(() => {
    return historyList.filter(h => {
      if (!historySearch) return true;
      const term = historySearch.toLowerCase();
      return (
        h.employee?.fullName?.toLowerCase().includes(term) ||
        h.employee?.code?.toLowerCase().includes(term) ||
        h.changeReason?.toLowerCase().includes(term) ||
        h.department?.name?.toLowerCase().includes(term) ||
        h.position?.title?.toLowerCase().includes(term)
      );
    });
  }, [historyList, historySearch]);

  const totalHistoryPages = Math.ceil(filteredHistory.length / historyItemsPerPage) || 1;
  const startHistoryIndex = (historyPage - 1) * historyItemsPerPage;
  const paginatedHistory = filteredHistory.slice(startHistoryIndex, startHistoryIndex + historyItemsPerPage);

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Quản lý Điều chuyển & Biến động Công tác</h1>
            <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
              Quy chuẩn Doanh nghiệp
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Theo dõi chi tiết lịch sử điều chuyển từng nhân sự (vị trí, đơn vị, mức lương ban đầu) và lập Quyết định trình Ban Giám Đốc
          </p>
        </div>

        {/* Nút chính: Lập Quyết định điều chuyển */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/internal/employees/decisions/create?type=TRANSFER')}
            title="Lập Quyết định điều chuyển mới trình Ban Giám Đốc phê duyệt"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.6rem 1.25rem' }}
          >
            <FileSignature size={18} /> Lập Quyết định Điều chuyển
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveTab('ACTIVE_EMPLOYEES')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            backgroundColor: activeTab === 'ACTIVE_EMPLOYEES' ? '#eff6ff' : 'transparent',
            color: activeTab === 'ACTIVE_EMPLOYEES' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'ACTIVE_EMPLOYEES' ? 700 : 500,
            cursor: 'pointer',
            borderBottom: activeTab === 'ACTIVE_EMPLOYEES' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          <span>Danh sách Nhân sự & Mức lương</span>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '1px 7px', 
            borderRadius: '99px', 
            backgroundColor: activeTab === 'ACTIVE_EMPLOYEES' ? '#bfdbfe' : '#f1f5f9',
            color: activeTab === 'ACTIVE_EMPLOYEES' ? '#1e40af' : '#64748b',
            fontWeight: 600
          }}>
            {filteredEmployees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            backgroundColor: activeTab === 'HISTORY' ? '#eff6ff' : 'transparent',
            color: activeTab === 'HISTORY' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'HISTORY' ? 700 : 500,
            cursor: 'pointer',
            borderBottom: activeTab === 'HISTORY' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={16} />
          <span>Sổ Lịch sử Điều chuyển Toàn công ty</span>
          {historyList.length > 0 && (
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '1px 7px', 
              borderRadius: '99px', 
              backgroundColor: activeTab === 'HISTORY' ? '#bfdbfe' : '#f1f5f9',
              color: activeTab === 'HISTORY' ? '#1e40af' : '#64748b',
              fontWeight: 600
            }}>
              {historyList.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB 1: DANH SÁCH NHÂN SỰ & MỨC LƯƠNG */}
      {activeTab === 'ACTIVE_EMPLOYEES' && (
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0 }}>
          
          {/* Thông báo nghiệp vụ chuẩn */}
          <div style={{ 
            padding: '0.75rem 1.25rem', 
            backgroundColor: '#f0f9ff', 
            borderBottom: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.8rem',
            color: '#0369a1'
          }}>
            <Info size={16} style={{ flexShrink: 0, color: '#0284c7' }} />
            <span>
              <strong>Quy chuẩn Quản trị Nhân sự:</strong> Nhấn nút <strong>Lịch sử</strong> để theo dõi chi tiết toàn bộ các mốc điều chuyển của từng nhân viên (giống phân hệ Hợp đồng). Nhấn <strong>Lập QĐ</strong> để soạn thảo Quyết định điều chuyển trình Ban Giám Đốc phê duyệt.
            </span>
          </div>

          {/* Filter Bar */}
          <div style={{ 
            padding: '1rem 1.25rem', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.75rem', 
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
              
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px', maxWidth: '360px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Tìm theo mã NV, tên, email..." 
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Department Filter */}
              <div style={{ minWidth: '180px', flex: '1 1 180px', maxWidth: '240px' }}>
                <select 
                  className="form-input w-full"
                  style={{ fontSize: '0.85rem' }}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="">-- Tất cả phòng ban --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Position Filter */}
              <div style={{ minWidth: '180px', flex: '1 1 180px', maxWidth: '240px' }}>
                <select 
                  className="form-input w-full"
                  style={{ fontSize: '0.85rem' }}
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                >
                  <option value="">-- Tất cả chức danh --</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Reset filter */}
              {(searchTerm || deptFilter || posFilter) && (
                <button 
                  onClick={() => { setSearchTerm(''); setDeptFilter(''); setPosFilter(''); }}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#64748b' }}
                  title="Xóa bộ lọc"
                >
                  <RotateCcw size={14} /> Xóa lọc
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Đang xem <strong style={{ color: 'var(--text-main)' }}>{filteredEmployees.length}</strong> nhân sự hợp lệ
            </div>
          </div>

          {/* Table Container */}
          <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0, overflowX: 'auto' }}>
            <table style={{ minWidth: '980px' }}>
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Nhân viên</th>
                  <th style={{ width: '180px' }}>Đơn vị / Phòng ban</th>
                  <th style={{ width: '180px' }}>Vị trí / Chức vụ</th>
                  <th style={{ width: '160px' }}>Mức lương ban đầu (HĐLĐ)</th>
                  <th style={{ width: '110px' }}>Trạng thái</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Đang tải danh sách nhân sự...
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8', display: 'block' }} />
                      Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map(emp => {
                    const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
                    const currentSalary = activeContract?.baseSalary || emp.salary;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        {/* Nhân viên */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div 
                              className="avatar" 
                              style={{ 
                                backgroundColor: '#eff6ff', 
                                color: '#2563eb', 
                                fontWeight: '700',
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem'
                              }}
                            >
                              {emp.fullName?.charAt(0) || 'U'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                                {emp.fullName}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                                {emp.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Đơn vị */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            <Building size={14} style={{ color: '#64748b' }} />
                            <span>{emp.department?.name || <span style={{ color: '#94a3b8' }}>Chưa phân bổ</span>}</span>
                          </div>
                        </td>

                        {/* Vị trí */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            <Briefcase size={14} style={{ color: '#64748b' }} />
                            <span style={{ fontWeight: 500 }}>{emp.position?.title || <span style={{ color: '#94a3b8' }}>Chưa có chức vụ</span>}</span>
                          </div>
                        </td>

                        {/* Mức lương ban đầu (hiện tại) */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#047857' }}>
                              {formatCurrency(currentSalary)}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {activeContract ? 'Theo HĐ hiệu lực' : 'Chưa có HĐ'}
                            </span>
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td>
                          <span className={`badge ${
                            emp.status === 'ACTIVE' ? 'badge-success' : 
                            emp.status === 'PROBATION' ? 'badge-warning' : 'badge-info'
                          }`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                            {emp.status === 'ACTIVE' ? 'Chính thức' : emp.status === 'PROBATION' ? 'Thử việc' : emp.status}
                          </span>
                        </td>

                        {/* Thao tác: Lịch sử & Lập QĐ */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            
                            {/* Nút Xem Lịch sử điều chuyển (giống bên Hợp đồng) */}
                            <button
                              onClick={() => navigate(`/internal/employees/transfers/${emp.id}`)}
                              className="btn btn-outline"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.75rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px',
                                borderRadius: '6px',
                                color: '#475569',
                                border: '1px solid #cbd5e1'
                              }}
                              title="Xem toàn bộ lịch sử biến động công tác của nhân sự này"
                            >
                              Lịch sử <ChevronRight size={13} />
                            </button>

                            {/* Nút Lập Quyết định điều chuyển */}
                            <button
                              onClick={() => navigate(`/internal/employees/decisions/create?type=TRANSFER&employeeId=${emp.id}`)}
                              className="btn btn-primary"
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '0.75rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                borderRadius: '6px',
                                fontWeight: 600
                              }}
                              title="Lập Quyết định Điều chuyển chính thức để Ban Giám Đốc phê duyệt"
                            >
                              <FileSignature size={13} /> Lập QĐ
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

          {/* Phân trang (Pagination) */}
          {filteredEmployees.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.75rem 1.25rem', 
              borderTop: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              {/* Hiển thị số lượng */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Hiển thị</span>
                <select
                  className="form-input"
                  style={{ width: '68px', padding: '2px 6px', fontSize: '0.8rem', borderRadius: '6px' }}
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
                <span>dòng / trang ({startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} trong tổng số {filteredEmployees.length} nhân viên)</span>
              </div>

              {/* Nút phân trang */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="Trang đầu"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Trang trước"
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
                        key={`page-${page}`}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: currentPage === page ? 700 : 500,
                          backgroundColor: currentPage === page ? 'var(--primary)' : 'transparent',
                          color: currentPage === page ? '#ffffff' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {page}
                      </button>
                    )
                  );
                })()}

                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Trang sau"
                >
                  <ChevronRight size={14} />
                </button>
                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Trang cuối"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: LỊCH SỬ BIẾN ĐỘNG CÔNG TÁC TOÀN CÔNG TY */}
      {activeTab === 'HISTORY' && (
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0 }}>
          
          {/* History Search & Stats */}
          <div style={{ 
            padding: '1rem 1.25rem', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.75rem', 
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ position: 'relative', minWidth: '280px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Tìm trong lịch sử (tên, mã, lý do, phòng ban)..." 
                className="form-input"
                style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tổng cộng <strong style={{ color: 'var(--text-main)' }}>{filteredHistory.length}</strong> lượt biến động công tác được ghi nhận
            </div>
          </div>

          {/* History Table */}
          <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0, overflowX: 'auto' }}>
            <table style={{ minWidth: '980px' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Ngày hiệu lực</th>
                  <th style={{ width: '220px' }}>Nhân sự</th>
                  <th style={{ width: '180px' }}>Đơn vị tiếp nhận</th>
                  <th style={{ width: '180px' }}>Chức danh mới</th>
                  <th style={{ width: '150px' }}>Mức lương áp dụng</th>
                  <th>Lý do & Căn cứ</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Đang tải lịch sử công tác...
                    </td>
                  </tr>
                ) : paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8', display: 'block' }} />
                      Chưa có dữ liệu lịch sử điều chuyển nào
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map(hist => (
                    <tr key={hist.id} className="hover:bg-slate-50 transition-colors">
                      {/* Ngày */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.83rem', fontWeight: 500 }}>
                          <Calendar size={13} style={{ color: '#94a3b8' }} />
                          {new Date(hist.effectiveDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Nhân sự */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div 
                            className="avatar" 
                            style={{ 
                              backgroundColor: '#f1f5f9', 
                              color: '#334155', 
                              fontWeight: '600',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {hist.employee?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {hist.employee?.fullName || '—'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                              {hist.employee?.code || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Đơn vị */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {hist.department?.name || '—'}
                        </span>
                      </td>

                      {/* Chức vụ */}
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          {hist.position?.title || '—'}
                        </span>
                      </td>

                      {/* Lương */}
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>
                          {hist.salary ? formatCurrency(hist.salary) : '—'}
                        </span>
                      </td>

                      {/* Lý do */}
                      <td>
                        <span style={{ fontSize: '0.83rem', color: '#475569', fontStyle: 'italic' }}>
                          {hist.changeReason || 'Điều chuyển công tác nội bộ'}
                        </span>
                      </td>

                      {/* Thao tác xem lịch sử nhân sự */}
                      <td style={{ textAlign: 'right' }}>
                        {hist.employeeId && (
                          <button
                            onClick={() => navigate(`/internal/employees/transfers/${hist.employeeId}`)}
                            className="btn btn-outline"
                            style={{ padding: '3px 7px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                            title="Xem toàn bộ lịch sử nhân sự này"
                          >
                            Chi tiết <ChevronRight size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang History */}
          {filteredHistory.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.75rem 1.25rem', 
              borderTop: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Hiển thị</span>
                <select
                  className="form-input"
                  style={{ width: '68px', padding: '2px 6px', fontSize: '0.8rem', borderRadius: '6px' }}
                  value={historyItemsPerPage}
                  onChange={(e) => {
                    setHistoryItemsPerPage(Number(e.target.value));
                    setHistoryPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>bản ghi / trang ({startHistoryIndex + 1} - {Math.min(startHistoryIndex + historyItemsPerPage, filteredHistory.length)} trong {filteredHistory.length})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: historyPage === 1 ? 0.4 : 1 }}
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(1)}
                  title="Trang đầu"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: historyPage === 1 ? 0.4 : 1 }}
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  title="Trang trước"
                >
                  <ChevronLeft size={14} />
                </button>

                <span style={{ fontSize: '0.8rem', color: '#475569', padding: '0 8px' }}>
                  Trang {historyPage} / {totalHistoryPages}
                </span>

                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: historyPage === totalHistoryPages ? 0.4 : 1 }}
                  disabled={historyPage === totalHistoryPages}
                  onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                  title="Trang sau"
                >
                  <ChevronRight size={14} />
                </button>
                <button 
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', opacity: historyPage === totalHistoryPages ? 0.4 : 1 }}
                  disabled={historyPage === totalHistoryPages}
                  onClick={() => setHistoryPage(totalHistoryPages)}
                  title="Trang cuối"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
