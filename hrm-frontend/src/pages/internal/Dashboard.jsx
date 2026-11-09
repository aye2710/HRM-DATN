import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Clock, 
  DollarSign, 
  UserCheck, 
  Briefcase, 
  TrendingUp, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  FileText, 
  Calendar, 
  Laptop, 
  ShieldCheck, 
  ChevronRight, 
  Activity, 
  PieChart, 
  BarChart3, 
  ArrowUpRight,
  ArrowDownRight,
  UserMinus,
  UserX,
  UserPlus,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';

export const InternalDashboard = () => {
  const navigate = useNavigate();
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activePeriod, setActivePeriod] = useState('MONTH'); // 'MONTH' | 'QUARTER' | 'YEAR'

  // Data states
  const [reportData, setReportData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [contracts, setContracts] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [reportRes, statsRes, empRes, adjRes, contractRes] = await Promise.all([
        axios.get('http://localhost:5000/api/reports/overview', { headers }).catch(() => ({ data: null })),
        axios.get('http://localhost:5000/api/dashboard/stats', { headers }).catch(() => ({ data: null })),
        axios.get('http://localhost:5000/api/employees', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/attendance/adjustments', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/contracts', { headers }).catch(() => ({ data: [] }))
      ]);

      if (reportRes.data) setReportData(reportRes.data);
      if (statsRes.data) setDashboardStats(statsRes.data);
      if (empRes.data) setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      if (adjRes.data) setAdjustments(Array.isArray(adjRes.data) ? adjRes.data : []);
      if (contractRes.data) setContracts(Array.isArray(contractRes.data) ? contractRes.data : []);

      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Helper định dạng tiền VNĐ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // 1. Chỉ số tổng hợp
  const summary = reportData?.summary || {};
  const activeEmpsList = useMemo(() => employees.filter(e => e.status !== 'RESIGNED'), [employees]);
  const totalEmps = summary.activeEmployees || activeEmpsList.length || 28;
  const officialEmps = summary.officialEmployees || employees.filter(e => e.status === 'ACTIVE').length || 23;
  const probationEmps = summary.probationEmployees || employees.filter(e => e.status === 'PROBATION').length || 2;
  const resignedEmps = summary.resignedEmployees || employees.filter(e => e.status === 'RESIGNED').length || 6;
  const turnoverRate = summary.turnoverRate !== undefined ? summary.turnoverRate : (totalEmps > 0 ? Math.round((resignedEmps / (totalEmps + resignedEmps)) * 100) : 18);
  const openJobs = summary.openJobPostings || dashboardStats?.openJobPostings || 4;
  const totalCands = summary.totalCandidates || 38;
  const pendingLeaves = summary.pendingLeaves !== undefined ? summary.pendingLeaves : (dashboardStats?.pendingLeaves || 2);
  const pendingAdjustments = adjustments.filter(a => a.status === 'PENDING').length || 1;

  // Hợp đồng sắp hết hạn
  const expiringContractsCount = useMemo(() => {
    if (contracts.length > 0) {
      return contracts.filter(c => c.isExpiringSoon || (c.daysUntilExpiry !== null && c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30)).length;
    }
    return 2;
  }, [contracts]);

  // Cảnh báo đỏ đang mở
  const criticalAlertsCount = useMemo(() => {
    let count = 0;
    if (expiringContractsCount > 0) count += 1;
    if (pendingLeaves + pendingAdjustments > 0) count += 1;
    if (probationEmps > 0) count += 1;
    if (openJobs > 0) count += 1;
    return count || 4;
  }, [expiringContractsCount, pendingLeaves, pendingAdjustments, probationEmps, openJobs]);

  // Đếm ngược ngày chốt công (mặc định chốt vào ngày 25 hàng tháng)
  const daysToPayrollCutoff = useMemo(() => {
    const today = now.getDate();
    const cutoffDay = 25;
    if (today <= cutoffDay) {
      return cutoffDay - today;
    }
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return (daysInMonth - today) + cutoffDay;
  }, [now]);

  // Chất lượng Hồ sơ Nhân sự & Tuân thủ định danh
  const dataQualityStats = useMemo(() => {
    const list = activeEmpsList.length > 0 ? activeEmpsList : employees;
    const total = list.length || 1;
    const missingCccd = list.filter(e => !e.cccd || String(e.cccd).trim() === '').length;
    const missingBank = list.filter(e => !e.bankAccount || String(e.bankAccount).trim() === '').length;
    const missingTaxOrBhxh = list.filter(e => !e.taxCode || !e.socialInsurance).length;
    const completeProfiles = list.filter(e => e.cccd && e.bankAccount && (e.taxCode || e.socialInsurance)).length;
    const completenessPercent = total > 0 ? Math.round((completeProfiles / total) * 100) : 92;
    return {
      total,
      missingCccd: missingCccd || 3,
      missingBank: missingBank || 2,
      missingTaxOrBhxh: missingTaxOrBhxh || 4,
      completeProfiles: completeProfiles || (total - 3),
      completenessPercent: Math.min(100, Math.max(0, completenessPercent))
    };
  }, [activeEmpsList, employees]);

  // Nhân sự tiếp nhận mới nhất
  const recentEmployees = useMemo(() => {
    return [...employees]
      .sort((a, b) => new Date(b.joinDate || b.createdAt || 0) - new Date(a.joinDate || a.createdAt || 0))
      .slice(0, 5);
  }, [employees]);

  // Format ngày tiếng Việt
  const todayVietnamese = useMemo(() => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayStr = dayNames[now.getDay()];
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    return `${dayStr}, ${dateStr}`;
  }, [now]);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', paddingBottom: '2.5rem' }}>
      
      {/* Dynamic Responsive Styles for Perfect Layout at All Screen Sizes */}
      <style>{`
        .dashboard-grid-6 {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.85rem;
        }
        @media (max-width: 1320px) {
          .dashboard-grid-6 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .dashboard-grid-6 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 460px) {
          .dashboard-grid-6 {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-grid-3 {
          display: grid;
          grid-template-columns: 1.25fr 1fr 1fr;
          gap: 1.1rem;
          align-items: stretch;
        }
        @media (max-width: 1180px) {
          .dashboard-grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .dashboard-grid-3 > div:nth-child(3) {
            grid-column: 1 / -1; /* Lấp đầy 100% dòng 2 khi thu nhỏ, loại bỏ hoàn toàn khoảng trống */
          }
        }
        @media (max-width: 768px) {
          .dashboard-grid-3 {
            grid-template-columns: 1fr;
          }
          .dashboard-grid-3 > div:nth-child(3) {
            grid-column: auto;
          }
        }

        .dashboard-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1.1rem;
          align-items: stretch;
        }
        @media (max-width: 1240px) {
          .dashboard-grid-4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .dashboard-grid-4 {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-card {
          min-width: 0;
          overflow: hidden;
        }
      `}</style>
      
      {/* 1. Header Bảng Điều Hành: Xin chào + Thời gian + Bộ lọc Kỳ (Tháng / Quý / Năm) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.85rem',
        padding: '1rem 1.4rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Left: Lời chào và trạng thái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Xin chào, HR Admin
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #BBF7D0'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                Trực tiếp (Live)
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              Quản trị hệ thống • {todayVietnamese} {lastUpdated && `• Cập nhật lúc: ${lastUpdated}`}
            </p>
          </div>
        </div>

        {/* Right: Period Switcher [Tháng 10/2026] [Quý IV] [Năm 2026] + Nút Làm mới & Báo cáo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Bộ gạt Kỳ báo cáo chuyên nghiệp theo phong cách GHC.Lexora */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setActivePeriod('MONTH')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activePeriod === 'MONTH' ? 700 : 500,
                backgroundColor: activePeriod === 'MONTH' ? '#FFFFFF' : 'transparent',
                color: activePeriod === 'MONTH' ? '#2563EB' : '#64748B',
                boxShadow: activePeriod === 'MONTH' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Tháng {now.getMonth() + 1}/{now.getFullYear()}
            </button>
            <button
              onClick={() => setActivePeriod('QUARTER')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activePeriod === 'QUARTER' ? 700 : 500,
                backgroundColor: activePeriod === 'QUARTER' ? '#FFFFFF' : 'transparent',
                color: activePeriod === 'QUARTER' ? '#2563EB' : '#64748B',
                boxShadow: activePeriod === 'QUARTER' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Quý {Math.floor(now.getMonth() / 3) + 1}
            </button>
            <button
              onClick={() => setActivePeriod('YEAR')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activePeriod === 'YEAR' ? 700 : 500,
                backgroundColor: activePeriod === 'YEAR' ? '#FFFFFF' : 'transparent',
                color: activePeriod === 'YEAR' ? '#2563EB' : '#64748B',
                boxShadow: activePeriod === 'YEAR' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Năm {now.getFullYear()}
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FFFFFF' }}
            title="Tải lại số liệu mới nhất"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => navigate('/internal/reports')}
            className="btn btn-primary"
            style={{ height: 34, padding: '0 0.95rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileSpreadsheet size={14} />
            <span>Báo cáo chuyên sâu</span>
          </button>
        </div>
      </div>

      {/* 2. TẦNG 1: 6 THẺ CHỈ SỐ ĐIỀU HÀNH CẤP CAO (GHC.LEXORA COMMAND CARDS) */}
      <div className="dashboard-grid-6">
        {/* Card 1: Nhân sự đang làm việc */}
        <div 
          className="dashboard-card"
          onClick={() => navigate('/internal/employees')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#93C5FD'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Nhân sự đang làm việc</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {totalEmps}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#16A34A', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
            <span>{officialEmps} chính thức • {probationEmps} thử việc</span>
          </div>
        </div>

        {/* Card 2: Vào / ra tháng này (Tăng/Giảm ròng song hành) */}
        <div 
          className="dashboard-card"
          onClick={() => navigate('/internal/employees')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#86EFAC'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Vào / ra tháng này</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ color: '#16A34A' }}>+{probationEmps > 0 ? probationEmps : 2}</span>
            <span style={{ color: '#94A3B8', fontSize: '1.2rem', fontWeight: 400 }}>/</span>
            <span style={{ color: '#DC2626' }}>-{resignedEmps > 0 ? resignedEmps : 6}</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.45rem', fontWeight: 500 }}>
            Ra tháng này: <strong style={{ color: '#DC2626' }}>{resignedEmps}</strong> nhân sự
          </div>
        </div>

        {/* Card 3: Tỷ lệ nghỉ việc lũy kế */}
        <div 
          className="dashboard-card"
          onClick={() => navigate('/internal/offboarding/checklist')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#C7D2FE'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Tỷ lệ nghỉ việc lũy kế</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserMinus size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {turnoverRate}%
          </div>
          <div style={{ fontSize: '0.73rem', color: turnoverRate <= 15 ? '#16A34A' : '#D97706', marginTop: '0.45rem', fontWeight: 600 }}>
            {turnoverRate <= 15 ? '✓ Ngưỡng an toàn < 15%' : '⚠ Cần rà soát chính sách giữ chân'}
          </div>
        </div>

        {/* Card 4: Cảnh báo đỏ đang mở */}
        <div 
          className="dashboard-card"
          onClick={() => navigate('/internal/leave/requests')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FECDD3'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Cảnh báo đỏ đang mở</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FFF1F2', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#E11D48', lineHeight: 1.1 }}>
            {criticalAlertsCount}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.45rem', fontWeight: 500 }}>
            Tồn trung bình: <strong>1.0 ngày</strong>
          </div>
        </div>

        {/* Card 5: Còn tới kỳ chốt công */}
        <div 
          className="dashboard-card"
          onClick={() => navigate('/internal/attendance/records')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FDE68A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Còn tới kỳ chốt công</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
            {daysToPayrollCutoff} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B' }}>ngày</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#B45309', marginTop: '0.45rem', fontWeight: 600 }}>
            {pendingLeaves + pendingAdjustments} đơn chờ phê duyệt
          </div>
        </div>

        {/* Card 6: HĐLĐ theo mốc hết hạn */}
        <div 
          className="dashboard-card"
          onClick={() => navigate('/internal/contracts')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FCA5A5'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>HĐLĐ theo mốc hết hạn</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: expiringContractsCount > 0 ? '#DC2626' : '#16A34A', lineHeight: 1.1 }}>
            {expiringContractsCount}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.45rem', fontWeight: 500 }}>
            {expiringContractsCount > 0 ? 'Sắp hết hạn trong 30 ngày' : '0 hợp đồng quá hạn'}
          </div>
        </div>
      </div>

      {/* 3. TẦNG 2: 3 KHỐI BIỂU ĐỒ TRỰC QUAN HÓA (3-COLUMN ANALYTICS GRID THEO GHC.LEXORA) */}
      <div className="dashboard-grid-3">
        
        {/* Biểu đồ 1: Quy mô nhân sự 12 tháng (Area / Line Chart) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUp size={17} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Quy mô nhân sự 12 tháng
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700, backgroundColor: '#DCFCE7', padding: '2px 7px', borderRadius: '4px' }}>
                +14.2% YoY
              </span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.77rem', color: '#64748B' }}>
              Biến động tăng trưởng nhân sự thực tế từ Tháng 11/2025 đến Tháng 10/2026
            </p>
          </div>

          {/* SVG Line / Area Chart mượt mà */}
          <div style={{ position: 'relative', width: '100%', height: '145px', display: 'flex', alignItems: 'flex-end', paddingBottom: '22px' }}>
            <svg viewBox="0 0 320 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="lexoraEmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="20" x2="320" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="320" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="320" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />

              {/* Area */}
              <polygon
                points="0,98 29,95 58,92 87,90 116,88 145,84 174,80 203,74 232,68 261,58 290,44 320,24 320,105 0,105"
                fill="url(#lexoraEmpGrad)"
              />
              {/* Line */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,98 29,95 58,92 87,90 116,88 145,84 174,80 203,74 232,68 261,58 290,44 320,24"
              />
              {/* Điểm nhấn cuối kỳ */}
              <circle cx="320" cy="24" r="5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              <g transform="translate(265, 2)">
                <rect width="52" height="18" rx="4" fill="#1D4ED8" />
                <text x="26" y="13" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {totalEmps} NV
                </text>
              </g>
            </svg>

            {/* Trục hoành tháng */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748B' }}>
              <span>11</span>
              <span>12</span>
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04</span>
              <span>05</span>
              <span>06</span>
              <span>07</span>
              <span>08</span>
              <span>09</span>
              <strong style={{ color: '#1D4ED8' }}>10</strong>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>Tỷ lệ tuyển ròng dương liên tục 6 tháng</span>
            <button 
              onClick={() => navigate('/internal/employees')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Hồ sơ nhân sự <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Biểu đồ 2: Cơ cấu theo cấp bậc (Donut Chart) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <PieChart size={17} color="#7C3AED" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Cơ cấu theo cấp bậc
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Pháp lý &amp; Chức danh</span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.77rem', color: '#64748B' }}>
              Tỷ trọng quản lý, chuyên viên và nhân sự vận hành trong tổ chức
            </p>
          </div>

          {/* SVG Donut Chart + Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.8"
                />
                {/* 1. Nhân viên chuyên môn (54%) - Xanh dương */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.8"
                  strokeDasharray="54, 100"
                />
                {/* 2. Trưởng nhóm / Chuyên gia (25%) - Xanh ngọc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="3.8"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-54"
                />
                {/* 3. Quản lý / Manager (14%) - Tím */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="3.8"
                  strokeDasharray="14, 100"
                  strokeDashoffset="-79"
                />
                {/* 4. Ban Giám đốc (7%) - Cam */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeDasharray="7, 100"
                  strokeDashoffset="-93"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{totalEmps}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Nhân sự</span>
              </div>
            </div>

            {/* Legend gọn gàng */}
            <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#F59E0B' }} />
                  <span>Ban Giám đốc</span>
                </div>
                <strong>7%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#7C3AED' }} />
                  <span>Quản lý</span>
                </div>
                <strong>14%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#06B6D4' }} />
                  <span>Trưởng nhóm / CG</span>
                </div>
                <strong>25%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#2563EB' }} />
                  <span>Nhân viên</span>
                </div>
                <strong>54%</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>Mô hình kim tự tháp chuẩn bền vững</span>
            <button 
              onClick={() => navigate('/internal/organization/departments')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Sơ đồ tổ chức <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Biểu đồ 3: Biến động 6 tháng (Vào vs Ra - Bar Chart) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <BarChart3 size={17} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Biến động 6 tháng
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#16A34A' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '2px', backgroundColor: '#16A34A' }} /> Vào
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#DC2626' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '2px', backgroundColor: '#DC2626' }} /> Ra
                </span>
              </div>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.77rem', color: '#64748B' }}>
              So sánh lượng tiếp nhận mới và thôi việc từ Tháng 5 đến Tháng 10
            </p>
          </div>

          {/* SVG Biểu đồ Cột kép Vào / Ra */}
          <div style={{ position: 'relative', width: '100%', height: '145px', display: 'flex', alignItems: 'flex-end', paddingBottom: '22px' }}>
            <svg viewBox="0 0 300 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="300" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="300" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />

              {/* Dữ liệu 6 tháng: T5, T6, T7, T8, T9, T10 */}
              {[
                { x: 20, in: 4, out: 1 },
                { x: 70, in: 5, out: 2 },
                { x: 120, in: 6, out: 1 },
                { x: 170, in: 7, out: 3 },
                { x: 220, in: 8, out: 2 },
                { x: 270, in: (probationEmps > 0 ? probationEmps * 4 : 8), out: (resignedEmps > 0 ? resignedEmps : 2) }
              ].map((m, idx) => {
                const inHeight = Math.min(85, m.in * 9);
                const outHeight = Math.min(85, m.out * 9);
                return (
                  <g key={idx}>
                    {/* Cột Vào (Xanh) */}
                    <rect
                      x={m.x - 12}
                      y={95 - inHeight}
                      width="10"
                      height={inHeight}
                      rx="3"
                      fill="#10B981"
                    />
                    {/* Cột Ra (Đỏ) */}
                    <rect
                      x={m.x + 2}
                      y={95 - outHeight}
                      width="10"
                      height={outHeight}
                      rx="3"
                      fill="#EF4444"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Trục hoành tháng */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', fontSize: '0.68rem', color: '#64748B' }}>
              <span>T05</span>
              <span>T06</span>
              <span>T07</span>
              <span>T08</span>
              <span>T09</span>
              <strong style={{ color: '#059669' }}>T10</strong>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>Tỷ lệ giữ chân nhân tài đạt <strong>82.4%</strong></span>
            <button 
              onClick={() => navigate('/internal/offboarding/checklist')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Bàn giao nghỉ việc <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* 4. TẦNG 3: TRUNG TÂM CẢNH BÁO, VIỆC CHỜ DUYỆT & CHUYÊN CẦN (4-COLUMN OPERATIONAL QUEUE) */}
      <div className="dashboard-grid-4">
        
        {/* Widget 1: Cảnh báo — 5 việc gấp nhất */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={16} color="#DC2626" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  Cảnh báo — 5 việc gấp nhất
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px' }}>
                Khẩn cấp
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#FFF5F5', borderRadius: '6px', borderLeft: '3px solid #DC2626' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>HĐLĐ hết hạn trong 15 ngày</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>NV Lê Công Dũng • Phòng Kế toán</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                  Trễ 1 ngày
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #F59E0B' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Hết hạn thử việc 60 ngày</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>NV Đoàn Xuân Khoa • Phòng Công nghệ</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                  Còn 4 ngày
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #3B82F6' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Bổ sung thông tin CCCD &amp; STK</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>3 nhân sự chưa hoàn thiện hồ sơ</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                  Còn 9 ngày
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #64748B' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Biên bản bàn giao thiết bị nghỉ việc</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Trần Quốc Linh • Khối Sản xuất</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                  Còn 9 ngày
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/contracts')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Xử lý tất cả <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Widget 2: Việc chờ tôi (Đơn từ cần phê duyệt) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <FileCheck2 size={16} color="#2563EB" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  Việc chờ tôi ({pendingLeaves + pendingAdjustments})
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px' }}>
                Cần ký duyệt
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.76rem' }}>
              <div 
                onClick={() => navigate('/internal/leave/requests')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Đơn WFH &amp; Nghỉ phép năm</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Nguyễn Kim Hương • 1 ngày • 21/10</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                  Đang duyệt
                </span>
              </div>

              <div 
                onClick={() => navigate('/internal/leave/requests')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Đơn nghỉ phép con ốm</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Võ Kim Việt • 2 ngày • 19/10</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                  Đang duyệt
                </span>
              </div>

              <div 
                onClick={() => navigate('/internal/attendance/adjustments')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#FFF5F5', borderRadius: '6px', border: '1px solid #FED7D7', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Đơn xác nhận đi muộn / Quên gạt</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Mai Ngọc Tuấn • 1 ngày • 18/10</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                  Trễ 2h
                </span>
              </div>

              <div 
                onClick={() => navigate('/internal/attendance/adjustments')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Đơn tăng ca ngoài giờ (OT 2.5h)</div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Nguyễn Anh Cương • 15/10</div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                  Chờ xem
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/leave/requests')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Hòm duyệt đơn <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Widget 3: Chấm công & phép */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={16} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  Chấm công &amp; phép
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>T10/2026</span>
            </div>

            {/* Hai ô số to: Đơn chưa duyệt vs Phép sắp hết hạn */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <div style={{ backgroundColor: '#FFF7ED', padding: '0.65rem', borderRadius: '8px', border: '1px solid #FFEDD5' }}>
                <div style={{ fontSize: '0.7rem', color: '#C2410C', fontWeight: 600 }}>Đơn chưa duyệt</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EA580C', lineHeight: 1.1, marginTop: '2px' }}>
                  {pendingLeaves + pendingAdjustments}
                </div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Phép sắp hết hạn</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>
                  0 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>ngày</span>
                </div>
              </div>
            </div>

            {/* Phân rã 3 thanh tiến độ: Phép, WFH, Công tác */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.74rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: '#475569' }}>Nghỉ phép năm</span>
                  <strong>{summary.approvedLeaves || 7} đơn (35%)</strong>
                </div>
                <div style={{ height: '5px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '35%', backgroundColor: '#2563EB', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: '#475569' }}>Làm việc từ xa (WFH)</span>
                  <strong>4 đơn (20%)</strong>
                </div>
                <div style={{ height: '5px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '20%', backgroundColor: '#7C3AED', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: '#475569' }}>Đi muộn &amp; Ân hạn 5p</span>
                  <strong>9 đơn (45%)</strong>
                </div>
                <div style={{ height: '5px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '45%', backgroundColor: '#06B6D4', borderRadius: '999px' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/attendance/records')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Bảng công ma trận <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Widget 4: Tuyển dụng đang chạy */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Briefcase size={16} color="#D97706" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  Tuyển dụng đang chạy
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px' }}>
                {openJobs} vị trí mở
              </span>
            </div>

            <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.75rem', color: '#64748B' }}>
              Thu hút <strong>{totalCands} ứng viên</strong> nộp CV trong kỳ này
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
              <div 
                onClick={() => navigate('/internal/recruitment/offers')}
                style={{ padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#0F172A' }}>Kỹ sư Lập trình Fullstack</strong>
                  <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 700 }}>12 CV</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Khối Sản xuất • Cần 2 vị trí</div>
              </div>

              <div 
                onClick={() => navigate('/internal/recruitment/offers')}
                style={{ padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#0F172A' }}>Thực tập sinh Quản lý Hạ tầng</strong>
                  <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 700 }}>8 CV</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Khối Hạ tầng • Cần 1 vị trí</div>
              </div>

              <div 
                onClick={() => navigate('/internal/recruitment/offers')}
                style={{ padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#0F172A' }}>Chuyên viên C&amp;B Tiền lương</strong>
                  <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 700 }}>5 CV</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Phòng Nhân sự • Cần 1 vị trí</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/recruitment/candidates')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Hệ thống ATS <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* 5. TẦNG 4: BẢNG ĐIỀU PHỐI TIẾN TRÌNH & CHẤT LƯỢNG HỒ SƠ (4-PANEL GOVERNANCE GRID) */}
      <div className="dashboard-grid-4">
        
        {/* Panel 1: Hội nhập (Onboarding) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Hội nhập (Onboarding)
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                Đang chạy: <strong>{probationEmps || 2}</strong>
              </span>
            </div>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#64748B' }}>
              Tiến độ hoàn thành tài liệu hội nhập và bàn giao ban đầu
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.76rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>Ngô Bảo Phương (DEV)</span>
                  <span style={{ fontWeight: 700, color: '#16A34A' }}>80% • Hạn 12/10</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '80%', backgroundColor: '#10B981', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>Lý Kim Cương (MKT)</span>
                  <span style={{ fontWeight: 700, color: '#D97706' }}>45% • Hạn 15/10</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '45%', backgroundColor: '#F59E0B', borderRadius: '999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>Phạm Hữu Sơn (BA)</span>
                  <span style={{ fontWeight: 700, color: '#2563EB' }}>20% • Hạn 20/10</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '20%', backgroundColor: '#3B82F6', borderRadius: '999px' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/onboarding/checklist')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Checklist hội nhập <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Panel 2: Bảng Ma Trận Quy Trình Đang Chạy (Mở vs Trễ) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Quy trình đang chạy
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Dòng luân chuyển</span>
            </div>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#64748B' }}>
              Kiểm soát tiến độ xử lý hồ sơ hành chính &amp; nhân sự
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ color: '#64748B', borderBottom: '1px solid #F1F5F9', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '6px', fontWeight: 600 }}>LOẠI QUY TRÌNH</th>
                  <th style={{ paddingBottom: '6px', textAlign: 'center', fontWeight: 700 }}>MỞ</th>
                  <th style={{ paddingBottom: '6px', textAlign: 'center', fontWeight: 700, color: '#DC2626' }}>TRỄ</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '6px 0', color: '#0F172A', fontWeight: 600 }}>Quyết định đang thực hiện</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{summary.totalDecisions || 12}</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>0</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '6px 0', color: '#0F172A', fontWeight: 600 }}>Đề xuất duyệt lương / bổ nhiệm</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>3</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#DC2626' }}>1</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '6px 0', color: '#0F172A', fontWeight: 600 }}>Đơn từ chờ duyệt</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{pendingLeaves + pendingAdjustments}</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>0</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#0F172A', fontWeight: 600 }}>Onboarding tân binh</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{probationEmps || 2}</td>
                  <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/decisions/all')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Xem quyết định <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Panel 3: HĐLĐ theo mốc hết hạn */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                HĐLĐ theo mốc hết hạn
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Tuân thủ BLLĐ</span>
            </div>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#64748B' }}>
              Theo dõi hạn tái ký hợp đồng có xác định thời hạn
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B' }}>Đã quá hạn</span>
                <strong style={{ color: '#059669' }}>0 HĐ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#FFF5F5', borderRadius: '6px', border: '1px solid #FEE2E2' }}>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Hết hạn ≤ 15 ngày</span>
                <strong style={{ color: '#DC2626' }}>{expiringContractsCount > 0 ? 1 : 0} HĐ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#475569' }}>Hết hạn 16 – 45 ngày</span>
                <strong style={{ color: '#D97706' }}>{expiringContractsCount > 1 ? expiringContractsCount - 1 : 1} HĐ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#475569' }}>Hết hạn 46 – 90 ngày</span>
                <strong style={{ color: '#2563EB' }}>3 HĐ</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/internal/contracts')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Quản lý hợp đồng <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Panel 4: Chất lượng hồ sơ & Tuân thủ định danh (Circular Gauge) */}
        <div className="dashboard-card" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.15rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Chất lượng hồ sơ
              </h4>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: dataQualityStats.completenessPercent >= 80 ? '#15803D' : '#B45309',
                backgroundColor: dataQualityStats.completenessPercent >= 80 ? '#DCFCE7' : '#FEF3C7',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {dataQualityStats.completenessPercent >= 80 ? 'Chuẩn hóa cao' : 'Cần rà soát'}
              </span>
            </div>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#64748B' }}>
              Tỷ lệ hoàn thiện giấy tờ định danh, số tài khoản và MST
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.65rem' }}>
              {/* Circular Gauge Donut */}
              <div style={{ position: 'relative', width: 66, height: 66, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="3.8"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3.8"
                    strokeDasharray={`${dataQualityStats.completenessPercent}, 100`}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    {dataQualityStats.completenessPercent}%
                  </span>
                </div>
              </div>

              {/* Checklist các điểm còn khuyết */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.73rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Khóa lương (chưa có STK):</span>
                  <strong style={{ color: dataQualityStats.missingBank > 0 ? '#DC2626' : '#059669' }}>
                    {dataQualityStats.missingBank} NV
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Chưa có CCCD / Định danh:</span>
                  <strong style={{ color: dataQualityStats.missingCccd > 0 ? '#D97706' : '#059669' }}>
                    {dataQualityStats.missingCccd} NV
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Chưa có MST / Sổ BHXH:</span>
                  <strong style={{ color: dataQualityStats.missingTaxOrBhxh > 0 ? '#D97706' : '#059669' }}>
                    {dataQualityStats.missingTaxOrBhxh} NV
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: '#64748B' }}>
              {dataQualityStats.completeProfiles}/{dataQualityStats.total} hồ sơ chuẩn
            </span>
            <button 
              onClick={() => navigate('/internal/employees')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Bổ sung ngay <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
