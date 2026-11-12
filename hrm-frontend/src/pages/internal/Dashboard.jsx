import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  UserCheck,
  Briefcase,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  DollarSign,
  ChevronRight,
  Activity,
  PieChart,
  BarChart3,
  UserMinus,
  FileCheck2
} from 'lucide-react';
import axios from 'axios';

const EMPTY_ARRAY = [];

function formatCompactVnd(amount) {
  const n = Number(amount || 0);
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')} tỷ`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} tr`;
  }
  return new Intl.NumberFormat('vi-VN').format(n);
}

function formatFullVnd(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
}

const ALERT_BADGE_STYLES = {
  CRITICAL: {
    rowBg: '#FFF5F5',
    borderLeft: '3px solid #DC2626',
    badgeBg: '#FEE2E2',
    badgeColor: '#DC2626'
  },
  WARNING: {
    rowBg: '#F8FAFC',
    borderLeft: '3px solid #F59E0B',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706'
  },
  INFO: {
    rowBg: '#F8FAFC',
    borderLeft: '3px solid #3B82F6',
    badgeBg: '#EFF6FF',
    badgeColor: '#2563EB'
  }
};

function buildGrowthChartGeometry(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return {
      coords: [],
      polyline: '',
      polygon: '',
      lastCoord: { x: 320, y: 90 }
    };
  }

  const values = points.map(p => Number(p.headcount || 0));
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const span = Math.max(1, maxVal - minVal);
  const width = 320;
  const topY = 24;
  const bottomY = 95;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((p, idx) => {
    const x = Number((idx * stepX).toFixed(1));
    const ratio = (Number(p.headcount || 0) - minVal) / span;
    const y = Number((bottomY - ratio * (bottomY - topY)).toFixed(1));
    return { x, y, point: p };
  });

  const polyline = coords.map(c => `${c.x},${c.y}`).join(' ');
  const firstX = coords[0].x;
  const lastCoord = coords[coords.length - 1];
  const polygon = `${polyline} ${lastCoord.x},105 ${firstX},105`;

  return { coords, polyline, polygon, lastCoord };
}

function buildDonutSegments(hierarchyStats) {
  let offset = 0;
  return (hierarchyStats || []).map(item => {
    const seg = {
      ...item,
      dashArray: `${item.percent}, 100`,
      dashOffset: -offset
    };
    offset += item.percent;
    return seg;
  });
}

export const InternalDashboard = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [activePeriod, setActivePeriod] = useState('MONTH'); // 'MONTH' | 'YEAR'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [overview, setOverview] = useState(null);

  const adminName = localStorage.getItem('fullName') || 'HR Admin';

  const yearOptions = useMemo(() => {
    const curY = now.getFullYear();
    return [curY - 2, curY - 1, curY];
  }, [now]);

  const fetchData = useCallback(async (periodToLoad, yearToLoad, monthToLoad) => {
    try {
      setErrorMsg('');
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(
        `http://localhost:5000/api/dashboard/overview?period=${periodToLoad}&year=${yearToLoad}&month=${monthToLoad}`,
        { headers }
      );
      setOverview(res.data || null);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Tổng quan:', error);
      setErrorMsg(error.response?.data?.error || 'Không thể tải dữ liệu tổng quan từ máy chủ');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activePeriod, selectedYear, selectedMonth);
  }, [activePeriod, selectedYear, selectedMonth, fetchData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData(activePeriod, selectedYear, selectedMonth);
  };

  const todayVietnamese = useMemo(() => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayStr = dayNames[now.getDay()];
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    return `${dayStr}, ${dateStr}`;
  }, [now]);

  const headcount = overview?.headcount || {
    activeTotal: 0,
    officialCount: 0,
    probationCount: 0,
    otherActiveCount: 0,
    resignedTotal: 0,
    totalEmployees: 0,
    joinedInPeriod: 0,
    resignedInPeriod: 0,
    turnoverCumulativeRate: 0,
    turnoverPeriodRate: 0,
    retentionRate: 100
  };

  const growth12Months = overview?.growth12Months || { points: [], growthPercent: 0 };
  const growthChart = useMemo(() => buildGrowthChartGeometry(growth12Months.points), [growth12Months.points]);
  const net6MonthsChange = useMemo(() => {
    const recent6 = growth12Months.points.slice(-6);
    return recent6.reduce((sum, p) => sum + Number(p.joined || 0) - Number(p.resigned || 0), 0);
  }, [growth12Months.points]);

  const hierarchySegments = useMemo(
    () => buildDonutSegments(overview?.hierarchyStats || []),
    [overview?.hierarchyStats]
  );

  const movement6Points = overview?.movement6Months?.points || EMPTY_ARRAY;
  const movementMaxVal = useMemo(() => {
    return Math.max(1, ...movement6Points.flatMap(p => [Number(p.joined || 0), Number(p.resigned || 0)]));
  }, [movement6Points]);

  const payrollCutoff = overview?.payrollCutoff || { cutoffDay: 25, daysRemaining: 0, pendingApprovals: 0 };
  const alerts = overview?.alerts || { criticalCount: 0, totalCount: 0, avgAgeDays: 0, items: [] };
  const pendingQueue = overview?.pendingQueue || {
    totalCount: 0,
    actionApprovalsCount: 0,
    pendingDecisions: 0,
    items: []
  };
  const payrollSummary = overview?.payrollSummary || {
    source: 'CONTRACTS',
    displayAmount: 0,
    subAmount: 0,
    payslipCount: 0,
    activeContractCount: 0
  };
  const attendanceAndLeave = overview?.attendanceAndLeave || {
    pendingApprovals: 0,
    expiringLeaveDays: 0,
    breakdown: [],
    lateAttendanceCount: 0
  };
  const recruitment = overview?.recruitment || {
    openJobsCount: 0,
    candidatesInPeriod: 0,
    totalCandidatesAll: 0,
    openJobs: []
  };
  const onboarding = overview?.onboarding || { activeCount: 0, items: [] };
  const processes = overview?.processes || [];
  const contractsSummary = overview?.contractsSummary || {
    overdueCount: 0,
    le15Count: 0,
    d16to45Count: 0,
    d46to90Count: 0,
    expiringWithinWarnCount: 0,
    warnDays: 30
  };
  const dataQuality = overview?.dataQuality || {
    total: 0,
    missingCccd: 0,
    missingBank: 0,
    missingTaxOrBhxh: 0,
    completeProfiles: 0,
    completenessPercent: 0
  };

  const formatMetric = val => (loading && !overview ? '…' : val);

  const periodRangeText = useMemo(() => {
    const pts = growth12Months.points;
    if (pts.length === 0) return 'Biến động quy mô nhân sự thực tế theo tháng';
    return `Biến động nhân sự thực tế từ ${pts[0].fullLabel} đến ${pts[pts.length - 1].fullLabel}`;
  }, [growth12Months.points]);

  const movementRangeText = useMemo(() => {
    if (movement6Points.length === 0) return 'So sánh tiếp nhận mới và thôi việc 6 tháng gần nhất';
    return `Tiếp nhận mới và thôi việc từ T${movement6Points[0].monthLabel} đến T${movement6Points[movement6Points.length - 1].monthLabel}`;
  }, [movement6Points]);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', paddingBottom: '2.5rem' }}>
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
            grid-column: 1 / -1;
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

      {/* 1. Header Bảng Điều Hành */}
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
                Xin chào, {adminName}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0'
          }}>
            {[
              { id: 'MONTH', label: 'Theo tháng' },
              { id: 'YEAR', label: 'Theo năm' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePeriod(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: activePeriod === tab.id ? 700 : 500,
                  backgroundColor: activePeriod === tab.id ? '#FFFFFF' : 'transparent',
                  color: activePeriod === tab.id ? '#2563EB' : '#64748B',
                  boxShadow: activePeriod === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activePeriod === 'MONTH' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              aria-label="Chọn tháng"
              style={{
                height: 34,
                padding: '0 0.65rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          )}

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            aria-label="Chọn năm"
            style={{
              height: 34,
              padding: '0 0.65rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>

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
        </div>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          borderRadius: '0.75rem',
          padding: '0.7rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* 2. TẦNG 1: 6 THẺ CHỈ SỐ ĐIỀU HÀNH */}
      <div className="dashboard-grid-6">
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
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#93C5FD'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Nhân sự đang làm việc</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {formatMetric(headcount.activeTotal)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#16A34A', marginTop: '0.45rem', fontWeight: 600 }}>
            {headcount.officialCount} chính thức • {headcount.probationCount} thử việc
            {headcount.otherActiveCount > 0 ? ` • ${headcount.otherActiveCount} khác` : ''}
          </div>
        </div>

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
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#86EFAC'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>
              Vào / ra ({overview?.periodShortLabel || 'Kỳ này'})
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ color: '#16A34A' }}>+{formatMetric(headcount.joinedInPeriod)}</span>
            <span style={{ color: '#94A3B8', fontSize: '1.2rem', fontWeight: 400 }}>/</span>
            <span style={{ color: '#DC2626' }}>-{formatMetric(headcount.resignedInPeriod)}</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.45rem', fontWeight: 500 }}>
            Lũy kế đã nghỉ: <strong style={{ color: '#DC2626' }}>{headcount.resignedTotal}</strong> nhân sự
          </div>
        </div>

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
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C7D2FE'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Tỷ lệ nghỉ việc lũy kế</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserMinus size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {formatMetric(`${headcount.turnoverCumulativeRate}%`)}
          </div>
          <div style={{ fontSize: '0.73rem', color: headcount.turnoverCumulativeRate <= 15 ? '#16A34A' : '#D97706', marginTop: '0.45rem', fontWeight: 600 }}>
            {headcount.turnoverCumulativeRate <= 15
              ? `✓ An toàn < 15% (Kỳ: ${headcount.turnoverPeriodRate}%)`
              : `⚠ ${headcount.resignedTotal}/${headcount.totalEmployees} hồ sơ (Kỳ: ${headcount.turnoverPeriodRate}%)`}
          </div>
        </div>

        <div
          className="dashboard-card"
          onClick={() => navigate(pendingQueue.items[0]?.route || '/internal/leave/requests')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Việc chờ phê duyệt</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: pendingQueue.totalCount > 0 ? '#7C3AED' : '#16A34A', lineHeight: 1.1 }}>
            {formatMetric(pendingQueue.totalCount)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.45rem', fontWeight: 500 }}>
            {pendingQueue.totalCount > 0
              ? `${pendingQueue.actionApprovalsCount} đơn công/phép • ${pendingQueue.pendingDecisions} quyết định`
              : 'Tất cả hồ sơ đã được duyệt'}
          </div>
        </div>

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
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FDE68A'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Còn tới kỳ chốt công</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
            {formatMetric(payrollCutoff.daysRemaining)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B' }}>ngày</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#B45309', marginTop: '0.45rem', fontWeight: 600 }}>
            {payrollCutoff.pendingApprovals} đơn chờ duyệt (Chốt ngày {payrollCutoff.cutoffDay})
          </div>
        </div>

        <div
          className="dashboard-card"
          onClick={() => navigate(payrollSummary.source === 'PAYROLL' ? '/internal/payroll/payslips' : '/internal/payroll/periods')}
          title={formatFullVnd(payrollSummary.displayAmount)}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6EE7B7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>
              {payrollSummary.source === 'PAYROLL'
                ? `Quỹ lương (${overview?.periodShortLabel || 'Kỳ này'})`
                : 'Quỹ lương HĐ hiệu lực'}
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
            {loading && !overview ? '…' : formatCompactVnd(payrollSummary.displayAmount)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.45rem', fontWeight: 500 }}>
            {payrollSummary.source === 'PAYROLL'
              ? `Thực lĩnh: ${formatCompactVnd(payrollSummary.subAmount)} (${payrollSummary.payslipCount} phiếu)`
              : `${payrollSummary.activeContractCount} HĐ ACTIVE • Dự chi/tháng`}
          </div>
        </div>
      </div>

      {/* 3. TẦNG 2: 3 KHỐI BIỂU ĐỒ TRỰC QUAN HÓA */}
      <div className="dashboard-grid-3">
        {/* Biểu đồ 1: Quy mô nhân sự 12 tháng */}
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
              <span style={{
                fontSize: '0.72rem',
                color: growth12Months.growthPercent >= 0 ? '#16A34A' : '#DC2626',
                fontWeight: 700,
                backgroundColor: growth12Months.growthPercent >= 0 ? '#DCFCE7' : '#FEE2E2',
                padding: '2px 7px',
                borderRadius: '4px'
              }}>
                {growth12Months.growthPercent >= 0 ? '+' : ''}{growth12Months.growthPercent}% 12T
              </span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.77rem', color: '#64748B' }}>
              {periodRangeText}
            </p>
          </div>

          <div style={{ position: 'relative', width: '100%', height: '145px', display: 'flex', alignItems: 'flex-end', paddingBottom: '22px' }}>
            <svg viewBox="0 0 320 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="lexoraEmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="320" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="320" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="320" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />

              {growthChart.polygon && (
                <polygon points={growthChart.polygon} fill="url(#lexoraEmpGrad)" />
              )}
              {growthChart.polyline && (
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={growthChart.polyline}
                />
              )}
              {growthChart.coords.map((c, idx) => (
                <circle
                  key={c.point.key}
                  cx={c.x}
                  cy={c.y}
                  r={idx === growthChart.coords.length - 1 ? 5 : 2.5}
                  fill={idx === growthChart.coords.length - 1 ? '#FFFFFF' : '#2563EB'}
                  stroke="#2563EB"
                  strokeWidth={idx === growthChart.coords.length - 1 ? 2.5 : 1}
                >
                  <title>Tháng {c.point.fullLabel}: {c.point.headcount} NV</title>
                </circle>
              ))}
              <g transform={`translate(${Math.min(265, Math.max(0, growthChart.lastCoord.x - 28))}, ${Math.max(0, growthChart.lastCoord.y - 24)})`}>
                <rect width="52" height="18" rx="4" fill="#1D4ED8" />
                <text x="26" y="13" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {growthChart.lastCoord?.point?.headcount ?? headcount.activeTotal} NV
                </text>
              </g>
            </svg>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748B' }}>
              {growth12Months.points.map((p, idx) => (
                <span
                  key={p.key}
                  style={{
                    fontWeight: idx === growth12Months.points.length - 1 ? 700 : 400,
                    color: idx === growth12Months.points.length - 1 ? '#1D4ED8' : '#64748B'
                  }}
                >
                  {p.monthLabel}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>
              Biến động ròng 6 tháng: <strong style={{ color: net6MonthsChange >= 0 ? '#16A34A' : '#DC2626' }}>
                {net6MonthsChange >= 0 ? `+${net6MonthsChange}` : net6MonthsChange} nhân sự
              </strong>
            </span>
            <button
              onClick={() => navigate('/internal/employees')}
              className="btn btn-outline"
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Hồ sơ nhân sự <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Biểu đồ 2: Cơ cấu theo cấp bậc */}
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
              Phân bổ thực tế theo chức danh của {headcount.activeTotal} nhân sự đang làm việc
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.8"
                />
                {hierarchySegments.map(seg => (
                  seg.percent > 0 && (
                    <path
                      key={seg.level}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="3.8"
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                    >
                      <title>{seg.label}: {seg.count} NV ({seg.percent}%)</title>
                    </path>
                  )
                ))}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {formatMetric(headcount.activeTotal)}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Nhân sự</span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.74rem' }}>
              {hierarchySegments.map(seg => (
                <div key={seg.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: seg.color }} />
                    <span>{seg.label}</span>
                  </div>
                  <strong>{seg.percent}% ({seg.count})</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>Tổng hợp trực tiếp từ Position.level</span>
            <button
              onClick={() => navigate('/internal/organization/departments')}
              className="btn btn-outline"
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Sơ đồ tổ chức <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Biểu đồ 3: Biến động 6 tháng */}
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
              {movementRangeText}
            </p>
          </div>

          <div style={{ position: 'relative', width: '100%', height: '145px', display: 'flex', alignItems: 'flex-end', paddingBottom: '22px' }}>
            <svg viewBox="0 0 300 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="300" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="300" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />

              {movement6Points.map((m, idx) => {
                const centerX = 25 + idx * 50;
                const inHeight = m.joined > 0 ? Math.max(4, (m.joined / movementMaxVal) * 76) : 2;
                const outHeight = m.resigned > 0 ? Math.max(4, (m.resigned / movementMaxVal) * 76) : 2;
                return (
                  <g key={m.key}>
                    <rect
                      x={centerX - 12}
                      y={95 - inHeight}
                      width="10"
                      height={inHeight}
                      rx="3"
                      fill={m.joined > 0 ? '#10B981' : '#E2E8F0'}
                    >
                      <title>T{m.fullLabel} - Vào: {m.joined}</title>
                    </rect>
                    <rect
                      x={centerX + 2}
                      y={95 - outHeight}
                      width="10"
                      height={outHeight}
                      rx="3"
                      fill={m.resigned > 0 ? '#EF4444' : '#E2E8F0'}
                    >
                      <title>T{m.fullLabel} - Ra: {m.resigned}</title>
                    </rect>
                  </g>
                );
              })}
            </svg>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', fontSize: '0.68rem', color: '#64748B' }}>
              {movement6Points.map((m, idx) => (
                <span
                  key={m.key}
                  style={{
                    fontWeight: idx === movement6Points.length - 1 ? 700 : 400,
                    color: idx === movement6Points.length - 1 ? '#059669' : '#64748B'
                  }}
                >
                  T{m.monthLabel}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>
              Tỷ lệ giữ chân nhân sự đạt <strong>{headcount.retentionRate}%</strong>
            </span>
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

      {/* 4. TẦNG 3: TRUNG TÂM CẢNH BÁO, VIỆC CHỜ DUYỆT & CHUYÊN CẦN */}
      <div className="dashboard-grid-4">
        {/* Widget 1: Cảnh báo */}
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
                  Cảnh báo ({alerts.totalCount})
                </h4>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: alerts.criticalCount > 0 ? '#FEE2E2' : '#DCFCE7',
                color: alerts.criticalCount > 0 ? '#DC2626' : '#15803D',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {alerts.criticalCount > 0 ? `${alerts.criticalCount} khẩn cấp` : 'Ổn định'}
              </span>
            </div>

            {alerts.items.length === 0 ? (
              <div style={{ padding: '1.25rem 0.75rem', textAlign: 'center', fontSize: '0.76rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                Không có cảnh báo gấp nào cần xử lý.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.76rem' }}>
                {alerts.items.map((item, idx) => {
                  const st = ALERT_BADGE_STYLES[item.severity] || ALERT_BADGE_STYLES.INFO;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(item.route)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.6rem',
                        backgroundColor: st.rowBg,
                        borderRadius: '6px',
                        borderLeft: st.borderLeft,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.subtitle}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: st.badgeColor, backgroundColor: st.badgeBg, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        {item.badgeText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button
              onClick={() => navigate('/internal/contracts')}
              className="btn btn-outline"
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.72rem' }}
            >
              Xử lý hợp đồng <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Widget 2: Việc chờ tôi */}
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
                  Việc chờ tôi ({pendingQueue.totalCount})
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px' }}>
                Cần ký duyệt
              </span>
            </div>

            {pendingQueue.items.length === 0 ? (
              <div style={{ padding: '1.25rem 0.75rem', textAlign: 'center', fontSize: '0.76rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                Không có hồ sơ hay đơn từ nào đang chờ duyệt.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.76rem' }}>
                {pendingQueue.items.map(item => {
                  const isCritical = item.badgeTone === 'CRITICAL';
                  const isInfo = item.badgeTone === 'INFO';
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(item.route)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.6rem',
                        backgroundColor: isCritical ? '#FFF5F5' : '#F8FAFC',
                        borderRadius: '6px',
                        border: `1px solid ${isCritical ? '#FED7D7' : '#E2E8F0'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.subtitle}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: isCritical ? '#DC2626' : isInfo ? '#2563EB' : '#D97706',
                        backgroundColor: isCritical ? '#FEE2E2' : isInfo ? '#EFF6FF' : '#FEF3C7',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.badgeText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                {overview?.periodShortLabel || `T${now.getMonth() + 1}/${now.getFullYear()}`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <div style={{ backgroundColor: '#FFF7ED', padding: '0.65rem', borderRadius: '8px', border: '1px solid #FFEDD5' }}>
                <div style={{ fontSize: '0.7rem', color: '#C2410C', fontWeight: 600 }}>Đơn chưa duyệt</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EA580C', lineHeight: 1.1, marginTop: '2px' }}>
                  {formatMetric(attendanceAndLeave.pendingApprovals)}
                </div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Phép sắp hết hạn</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>
                  {formatMetric(attendanceAndLeave.expiringLeaveDays)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>ngày</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.74rem' }}>
              {attendanceAndLeave.breakdown.map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: '#475569' }}>{item.label}</span>
                    <strong>{item.count} đơn ({item.percent}%)</strong>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.percent}%`, backgroundColor: item.color, borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                Lượt đi muộn ghi nhận trong kỳ: <strong>{attendanceAndLeave.lateAttendanceCount}</strong>
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
                {recruitment.openJobsCount} tin đang mở
              </span>
            </div>

            <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.75rem', color: '#64748B' }}>
              Thu hút <strong>{recruitment.candidatesInPeriod} ứng viên</strong> trong kỳ (Tổng {recruitment.totalCandidatesAll} CV)
            </p>

            {recruitment.openJobs.length === 0 ? (
              <div style={{ padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                Hiện chưa có chiến dịch tuyển dụng nào đang mở.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
                {recruitment.openJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => navigate('/internal/recruitment/candidates')}
                    style={{ padding: '0.45rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.title}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {job.candidateCount} CV
                      </span>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.68rem' }}>
                      {job.deptName} • Cần {job.amount} vị trí
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* 5. TẦNG 4: BẢNG ĐIỀU PHỐI TIẾN TRÌNH & CHẤT LƯỢNG HỒ SƠ */}
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
                Đang chạy: <strong>{onboarding.activeCount}</strong>
              </span>
            </div>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#64748B' }}>
              Tiến độ hoàn thành checklist hội nhập thực tế của nhân sự mới
            </p>

            {onboarding.items.length === 0 ? (
              <div style={{ padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                Chưa có hồ sơ hội nhập đang thực hiện.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.76rem' }}>
                {onboarding.items.map(item => {
                  const barColor = item.percent >= 75 ? '#10B981' : item.percent >= 40 ? '#F59E0B' : '#3B82F6';
                  const textColor = item.percent >= 75 ? '#16A34A' : item.percent >= 40 ? '#D97706' : '#2563EB';
                  return (
                    <div key={item.employeeId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.fullName} ({item.deptCode})
                        </span>
                        <span style={{ fontWeight: 700, color: textColor, whiteSpace: 'nowrap' }}>
                          {item.percent}% • Hạn {item.dueDateLabel}
                        </span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.percent}%`, backgroundColor: barColor, borderRadius: '999px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

        {/* Panel 2: Quy trình đang chạy */}
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
                {processes.map((proc, idx) => (
                  <tr
                    key={proc.label}
                    onClick={() => navigate(proc.route)}
                    style={{
                      borderBottom: idx === processes.length - 1 ? 'none' : '1px solid #F8FAFC',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '6px 0', color: '#0F172A', fontWeight: 600 }}>{proc.label}</td>
                    <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{proc.openCount}</td>
                    <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: proc.lateCount > 0 ? '#DC2626' : '#64748B' }}>
                      {proc.lateCount}
                    </td>
                  </tr>
                ))}
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
                <strong style={{ color: contractsSummary.overdueCount > 0 ? '#DC2626' : '#059669' }}>
                  {contractsSummary.overdueCount} HĐ
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: contractsSummary.le15Count > 0 ? '#FFF5F5' : '#F8FAFC', borderRadius: '6px', border: contractsSummary.le15Count > 0 ? '1px solid #FEE2E2' : 'none' }}>
                <span style={{ color: contractsSummary.le15Count > 0 ? '#DC2626' : '#475569', fontWeight: 600 }}>Hết hạn ≤ 15 ngày</span>
                <strong style={{ color: contractsSummary.le15Count > 0 ? '#DC2626' : '#059669' }}>
                  {contractsSummary.le15Count} HĐ
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#475569' }}>Hết hạn 16 – 45 ngày</span>
                <strong style={{ color: contractsSummary.d16to45Count > 0 ? '#D97706' : '#64748B' }}>
                  {contractsSummary.d16to45Count} HĐ
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#475569' }}>Hết hạn 46 – 90 ngày</span>
                <strong style={{ color: contractsSummary.d46to90Count > 0 ? '#2563EB' : '#64748B' }}>
                  {contractsSummary.d46to90Count} HĐ
                </strong>
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

        {/* Panel 4: Chất lượng hồ sơ */}
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
                color: dataQuality.completenessPercent >= 80 ? '#15803D' : '#B45309',
                backgroundColor: dataQuality.completenessPercent >= 80 ? '#DCFCE7' : '#FEF3C7',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {dataQuality.completenessPercent >= 80 ? 'Chuẩn hóa cao' : 'Cần rà soát'}
              </span>
            </div>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#64748B' }}>
              Tỷ lệ hoàn thiện giấy tờ định danh, số tài khoản và MST
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.65rem' }}>
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
                    stroke={dataQuality.completenessPercent >= 80 ? '#10B981' : '#F59E0B'}
                    strokeWidth="3.8"
                    strokeDasharray={`${dataQuality.completenessPercent}, 100`}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    {dataQuality.completenessPercent}%
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.73rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Chưa có STK ngân hàng:</span>
                  <strong style={{ color: dataQuality.missingBank > 0 ? '#DC2626' : '#059669' }}>
                    {dataQuality.missingBank} NV
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Chưa có CCCD / Định danh:</span>
                  <strong style={{ color: dataQuality.missingCccd > 0 ? '#D97706' : '#059669' }}>
                    {dataQuality.missingCccd} NV
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Chưa có MST / Sổ BHXH:</span>
                  <strong style={{ color: dataQuality.missingTaxOrBhxh > 0 ? '#D97706' : '#059669' }}>
                    {dataQuality.missingTaxOrBhxh} NV
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: '#64748B' }}>
              {dataQuality.completeProfiles}/{dataQuality.total} hồ sơ chuẩn
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
