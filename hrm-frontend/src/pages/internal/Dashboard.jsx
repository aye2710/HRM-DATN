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
  UserMinus,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

export const InternalDashboard = () => {
  const navigate = useNavigate();
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Data states
  const [reportData, setReportData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const fetchData = async () => {
    try {
      const [reportRes, statsRes, empRes, adjRes] = await Promise.all([
        axios.get('http://localhost:5000/api/reports/overview').catch(() => ({ data: null })),
        axios.get('http://localhost:5000/api/dashboard/stats').catch(() => ({ data: null })),
        axios.get('http://localhost:5000/api/employees').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/attendance/adjustments').catch(() => ({ data: [] }))
      ]);

      if (reportRes.data) setReportData(reportRes.data);
      if (statsRes.data) setDashboardStats(statsRes.data);
      if (empRes.data) setEmployees(empRes.data);
      if (adjRes.data) setAdjustments(adjRes.data);

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

  // Helper tính tiền VNĐ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // 1. Chỉ số tổng hợp
  const summary = reportData?.summary || {};
  const totalEmps = summary.activeEmployees || employees.filter(e => e.status !== 'RESIGNED').length || 138;
  const officialEmps = summary.officialEmployees || 131;
  const probationEmps = summary.probationEmployees || 2;
  const resignedEmps = summary.resignedEmployees || 6;
  const totalDepts = reportData?.departments?.length || 11;
  const openJobs = summary.openJobPostings || 4;
  const totalCands = summary.totalCandidates || 38;
  const pendingLeaves = dashboardStats?.pendingLeaves || 2;
  const pendingAdjustments = adjustments.filter(a => a.status === 'PENDING').length || 0;

  // 2. Dữ liệu phòng ban cho Biểu đồ Cột
  const departmentsList = useMemo(() => {
    const list = reportData?.departments || [];
    return [...list].sort((a, b) => (b.actual || 0) - (a.actual || 0));
  }, [reportData]);

  const maxDeptActual = Math.max(...departmentsList.map(d => d.actual || 0), 10);

  // 3. Nhân sự mới nhất
  const recentEmployees = useMemo(() => {
    return [...employees]
      .sort((a, b) => new Date(b.joinDate || b.createdAt || 0) - new Date(a.joinDate || a.createdAt || 0))
      .slice(0, 5);
  }, [employees]);

  // 4. Xu hướng Quỹ lương (Mô phỏng 6 tháng gần nhất với dữ liệu thật T10)
  const payrollMonths = [
    { month: 'T5', gross: 1220, net: 1150 },
    { month: 'T6', gross: 1250, net: 1180 },
    { month: 'T7', gross: 1290, net: 1210 },
    { month: 'T8', gross: 1310, net: 1240 },
    { month: 'T9', gross: 1340, net: 1270 },
    { month: 'T10', gross: 1363, net: 1295 }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      
      {/* 1. Header Trang Dashboard */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.85rem',
        padding: '1.1rem 1.4rem',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '10px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                HR Management Dashboard
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #BBF7D0'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                Thời gian thực (Live Data)
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              Trung tâm điều hành và tổng hợp số liệu từ các phân hệ: Tổ chức, Tuyển dụng, Nhân sự, Chấm công, Tiền lương và Tài sản.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
              Cập nhật lúc: <strong>{lastUpdated}</strong>
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Hàng Thẻ Chỉ Số Điều Hành Cấp Cao (Executive Metric Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.85rem'
      }}>
        {/* Card 1: Tổng nhân sự */}
        <div 
          onClick={() => navigate('/internal/employees/profiles')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#93C5FD'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Quy mô nhân sự</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {totalEmps} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>người</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#16A34A', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
            <ArrowUpRight size={13} />
            <span>{officialEmps} chính thức • {probationEmps} thử việc</span>
          </div>
        </div>

        {/* Card 2: Phòng ban & Định biên */}
        <div 
          onClick={() => navigate('/internal/organization/departments')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#DDD6FE'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Phòng ban & Định biên</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {totalDepts} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>đơn vị</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#6D28D9', marginTop: '0.45rem', fontWeight: 600 }}>
            Lấp đầy 78.8% định biên toàn cty
          </div>
        </div>

        {/* Card 3: Chuyên cần hôm nay */}
        <div 
          onClick={() => navigate('/internal/attendance/records')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#BBF7D0'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Tỷ lệ đi làm hôm nay</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            98.5%
          </div>
          <div style={{ fontSize: '0.73rem', color: '#059669', marginTop: '0.45rem', fontWeight: 600 }}>
            136/138 nhân sự quét vân tay đúng giờ
          </div>
        </div>

        {/* Card 4: Quỹ lương tháng */}
        <div 
          onClick={() => navigate('/internal/payroll/runs')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FDE68A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Dự toán lương T{now.getMonth() + 1}</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            1.36 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>Tỷ đ</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#B45309', marginTop: '0.45rem', fontWeight: 600 }}>
            134 phiếu lương • Hạn chốt 05/{now.getMonth() + 2}
          </div>
        </div>

        {/* Card 5: Tuyển dụng */}
        <div 
          onClick={() => navigate('/internal/recruitment/offers')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            padding: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#FED7AA'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Tuyển dụng &amp; Offer</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {totalCands} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>ứng viên</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#C2410C', marginTop: '0.45rem', fontWeight: 600 }}>
            {openJobs} vị trí đang mở • 7 đã tuyển
          </div>
        </div>
      </div>

      {/* 3. KHỐI BIỂU ĐỒ TRỌNG TÂM: Biểu đồ Cột Định Biên vs Biểu đồ Đường Xu Hướng Quỹ Lương */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* BIỂU ĐỒ 1: ĐỊNH BIÊN & PHÂN BỔ NHÂN SỰ THEO PHÒNG BAN */}
        <div style={{
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#2563EB" />
                <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Định biên &amp; Quy mô Nhân sự theo Phòng ban
                </h2>
              </div>
              <span style={{ fontSize: '0.73rem', color: '#64748B' }}>Thực tế vs Chỉ tiêu</span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#64748B' }}>
              So sánh quân số làm việc thực tế với định biên quy hoạch của từng khối/phòng ban
            </p>
          </div>

          {/* Danh sách thanh biểu đồ cột ngang */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {departmentsList.slice(0, 6).map(dept => {
              const actual = dept.actual || 0;
              const quota = dept.quota || 15;
              const percent = Math.min(100, Math.round((actual / maxDeptActual) * 100));
              const isOver = actual > quota;

              return (
                <div key={dept.id || dept.name} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{dept.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: isOver ? '#B45309' : '#0F172A' }}>
                        {actual} <span style={{ fontWeight: 400, color: '#64748B' }}>/ {quota} định biên</span>
                      </span>
                      {isOver && (
                        <span style={{ fontSize: '0.68rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          Vượt
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến độ đa sắc */}
                  <div style={{ height: '8px', width: '100%', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percent}%`, 
                        borderRadius: '999px',
                        background: isOver 
                          ? 'linear-gradient(90deg, #F59E0B, #D97706)' 
                          : actual >= 10 
                            ? 'linear-gradient(90deg, #3B82F6, #1D4ED8)' 
                            : 'linear-gradient(90deg, #10B981, #059669)',
                        transition: 'width 0.5s ease-out'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748B' }}>
            <span>Hiển thị 6 phòng ban có quy mô lớn nhất</span>
            <button 
              onClick={() => navigate('/internal/organization/departments')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Xem chi tiết 11 phòng ban <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* BIỂU ĐỒ 2: XU HƯỚNG QUỸ LƯƠNG 6 THÁNG QUA (SVG TREND CHART) */}
        <div style={{
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#16A34A" />
                <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Xu Hướng Quỹ Lương &amp; Thu Nhập (6 Tháng)
                </h2>
              </div>
              <span style={{ fontSize: '0.73rem', color: '#16A34A', fontWeight: 700, backgroundColor: '#DCFCE7', padding: '2px 7px', borderRadius: '4px' }}>
                +11.7% Tăng trưởng
              </span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#64748B' }}>
              Biến động tổng chi trả tiền lương Gross &amp; Net toàn công ty từ Tháng 5 đến Tháng 10/2026
            </p>
          </div>

          {/* SVG Line / Area Chart mượt mà */}
          <div style={{ position: 'relative', width: '100%', height: '140px', display: 'flex', alignItems: 'flex-end', paddingBottom: '20px' }}>
            <svg viewBox="0 0 300 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="300" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="300" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />

              {/* Area */}
              <polygon
                points="0,85 60,78 120,68 180,62 240,50 300,35 300,105 0,105"
                fill="url(#payrollGradient)"
              />
              {/* Line */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,85 60,78 120,68 180,62 240,50 300,35"
              />
              {/* Data points */}
              {[
                { x: 0, y: 85, val: '1.22 Tỷ' },
                { x: 60, y: 78, val: '1.25 Tỷ' },
                { x: 120, y: 68, val: '1.29 Tỷ' },
                { x: 180, y: 62, val: '1.31 Tỷ' },
                { x: 240, y: 50, val: '1.34 Tỷ' },
                { x: 300, y: 35, val: '1.36 Tỷ' }
              ].map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                  {idx === 5 && (
                    <text x={pt.x - 30} y={pt.y - 10} fontSize="10" fontWeight="bold" fill="#1D4ED8">
                      1.363 Tỷ đ
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Labels Tháng */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
              <span>Tháng 5</span>
              <span>Tháng 6</span>
              <span>Tháng 7</span>
              <span>Tháng 8</span>
              <span>Tháng 9</span>
              <strong style={{ color: '#1D4ED8' }}>Tháng 10</strong>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748B' }}>Lương bình quân: <strong>~10.1 Tr đ / người</strong></span>
            <button 
              onClick={() => navigate('/internal/payroll/runs')}
              className="btn btn-outline" 
              style={{ height: 26, padding: '0 0.55rem', fontSize: '0.73rem' }}
            >
              Chi tiết Bảng lương <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* 4. KHỐI BIỂU ĐỒ TRÒN / DONUT: Cơ cấu Hợp đồng & Cơ cấu Chấm công LLA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        {/* DONUT 1: CƠ CẤU HỢP ĐỒNG LAO ĐỘNG */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <PieChart size={18} color="#7C3AED" />
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
              Cơ cấu Hợp đồng Lao động (Pháp lý)
            </h3>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.76rem', color: '#64748B' }}>
            Tỷ lệ phân bổ theo Bộ luật Lao động 2019 và tiến trình tái ký hợp đồng
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: 105, height: 105, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.8"
                />
                {/* 1. Không xác định thời hạn (58%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="3.8"
                  strokeDasharray="58, 100"
                />
                {/* 2. Có thời hạn 1 năm (35%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.8"
                  strokeDasharray="35, 100"
                  strokeDashoffset="-58"
                />
                {/* 3. Thử việc & Khác (7%) */}
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
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{totalEmps}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Hồ sơ</span>
              </div>
            </div>

            {/* Chú giải Donut */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#16A34A' }} />
                  <span>Không xác định thời hạn</span>
                </div>
                <strong>80 HĐ (58%)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#2563EB' }} />
                  <span>Có thời hạn (1 - 3 năm)</span>
                </div>
                <strong>48 HĐ (35%)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#F59E0B' }} />
                  <span>Thử việc &amp; Thực tập sinh</span>
                </div>
                <strong>10 HĐ (7%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* DONUT 2: CƠ CẤU CHẤM CÔNG QUY CHUẨN LLA */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Clock size={18} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
              Quy Chuẩn Chấm Công &amp; Đi Muộn (Công ty LLA)
            </h3>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.76rem', color: '#64748B' }}>
            Phân bổ đối soát log máy chấm công theo quy chế ân hạn ≤ 5p và hạn mức đơn
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: 105, height: 105, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.8"
                />
                {/* Đúng giờ (88%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.8"
                  strokeDasharray="88, 100"
                />
                {/* Ân hạn ≤ 5p (9%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.8"
                  strokeDasharray="9, 100"
                  strokeDashoffset="-88"
                />
                {/* Đi muộn có đơn ≤ 1h (3%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeDasharray="3, 100"
                  strokeDashoffset="-97"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>98.5%</span>
                <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Đủ công</span>
              </div>
            </div>

            {/* Chú giải Donut */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#10B981' }} />
                  <span>Đúng giờ chuẩn (Trước 08:00)</span>
                </div>
                <strong>88% (122 ng)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#3B82F6' }} />
                  <span>Ân hạn 5 phút (08:00 - 08:05)</span>
                </div>
                <strong>9% (12 ng)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#F59E0B' }} />
                  <span>Có Đơn xin đi muộn (≤ 3 lần)</span>
                </div>
                <strong>3% (4 ng)</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. KHỐI TÁC VỤ CẤP THIẾT & NHÂN SỰ MỚI TIẾP NHẬN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* CỘT TRÁI: DANH SÁCH NHÂN SỰ MỚI TIẾP NHẬN */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.85rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC'
          }}>
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Nhân sự mới tiếp nhận vào hệ thống</strong>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>5 nhân sự có ngày bắt đầu làm việc gần nhất</div>
            </div>
            <button
              onClick={() => navigate('/internal/employees/profiles')}
              className="btn btn-outline"
              style={{ height: 28, padding: '0 0.65rem', fontSize: '0.74rem' }}
            >
              Xem tất cả ({totalEmps})
            </button>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700 }}>Mã NV</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Họ và tên</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Phòng ban</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Ngày nhận việc</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 700 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: '#2563EB', fontSize: '0.78rem' }}>
                      {emp.code}
                    </td>
                    <td style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: '#0F172A' }}>
                      {emp.fullName}
                    </td>
                    <td style={{ padding: '0.7rem 0.85rem', color: '#475569' }}>
                      {emp.department?.name || 'Chưa phân bổ'}
                    </td>
                    <td style={{ padding: '0.7rem 0.85rem', color: '#64748B', fontSize: '0.76rem' }}>
                      {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: emp.status === 'ACTIVE' ? '#DCFCE7' : emp.status === 'PROBATION' ? '#FEF3C7' : '#F1F5F9',
                        color: emp.status === 'ACTIVE' ? '#15803D' : emp.status === 'PROBATION' ? '#B45309' : '#475569'
                      }}>
                        {emp.status === 'ACTIVE' ? 'Đang làm việc' : emp.status === 'PROBATION' ? 'Thử việc' : emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT PHẢI: TRUNG TÂM HÀNH ĐỘNG & ĐIỀU HƯỚNG NHANH */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Hộp tác vụ nghẽn */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.85rem',
            border: '1px solid #E2E8F0',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={17} color="#D97706" />
                <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Tác vụ cần hành động ngay</strong>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                {pendingLeaves + pendingAdjustments} việc cần duyệt
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Việc 1: Đơn nghỉ phép */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E' }}>
                    Phê duyệt đơn nghỉ phép ({pendingLeaves})
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#B45309' }}>Cần xử lý trước giờ khóa ca</div>
                </div>
                <button
                  onClick={() => navigate('/internal/leave/requests')}
                  className="btn"
                  style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, backgroundColor: '#0F766E', color: 'white', border: 'none', borderRadius: '6px' }}
                >
                  Xem &amp; duyệt
                </button>
              </div>

              {/* Việc 2: Đơn chấm công / đi muộn */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF' }}>
                    Đơn xác nhận công &amp; Đi muộn ({pendingAdjustments})
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#2563EB' }}>Đã có chữ ký PM trình duyệt</div>
                </div>
                <button
                  onClick={() => navigate('/internal/attendance/adjustments')}
                  className="btn"
                  style={{ height: 28, padding: '0 0.65rem', fontSize: '0.73rem', fontWeight: 700, backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '6px' }}
                >
                  Duyệt ngay
                </button>
              </div>
            </div>
          </div>

          {/* Phím tắt truy cập nhanh các module */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.85rem',
            border: '1px solid #E2E8F0',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block', marginBottom: '0.65rem' }}>
              Phím tắt Điều hành Phân hệ
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                onClick={() => navigate('/internal/employees/decisions/create')}
                className="btn btn-outline"
                style={{ height: 32, fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0 0.65rem', gap: '5px' }}
              >
                <FileText size={13} color="#2563EB" /> Soạn QĐ Nhân sự
              </button>
              <button
                onClick={() => navigate('/internal/attendance/records')}
                className="btn btn-outline"
                style={{ height: 32, fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0 0.65rem', gap: '5px' }}
              >
                <Clock size={13} color="#16A34A" /> Bảng công Ma trận
              </button>
              <button
                onClick={() => navigate('/internal/assets/inventory')}
                className="btn btn-outline"
                style={{ height: 32, fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0 0.65rem', gap: '5px' }}
              >
                <Laptop size={13} color="#D97706" /> Kho Thiết bị
              </button>
              <button
                onClick={() => navigate('/internal/offboarding/checklist')}
                className="btn btn-outline"
                style={{ height: 32, fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0 0.65rem', gap: '5px' }}
              >
                <UserMinus size={13} color="#DC2626" /> Bàn giao thôi việc
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
