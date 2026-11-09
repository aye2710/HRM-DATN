import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, DollarSign, PieChart, Activity, 
  Download, Printer, RefreshCw, Building, Award, CheckCircle2, 
  AlertCircle, ShieldCheck, UserCheck, UserMinus, Briefcase, 
  FileSpreadsheet, ArrowUpRight, ArrowDownRight, Layers, Laptop,
  PackageCheck, Wrench, Clock, FileText, ChevronRight, CheckCircle,
  Calendar, AlertTriangle, Target, Zap
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ReportsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DEPT_QUOTA'); 
  // 'DEPT_QUOTA' | 'PAYROLL' | 'DEMOGRAPHICS' | 'ASSETS' | 'RECRUITMENT' | 'ATTENDANCE' | 'KPI'

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/reports/overview', { headers });
      setData(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // Xuất file CSV Báo cáo tổng hợp đa chiều (7 phân hệ chuẩn UTF-8 BOM)
  const handleExportCSV = () => {
    if (!data) return;
    const { 
      summary = {}, 
      departments = [], 
      payrollTrends = [], 
      assetStats = {}, 
      decisionStats = [], 
      recruitmentStats = {},
      attendanceStats = {},
      kpiStats = {},
      seniorityStats = []
    } = data;

    const sections = [];

    sections.push(["=== BÁO CÁO QUẢN TRỊ NHÂN SỰ TOÀN DIỆN (HR ANALYTICS & DSS) ==="]);
    sections.push([`Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`]);
    sections.push([]);

    // 1. Chỉ số cốt lõi
    sections.push(["--- 1. CHỈ SỐ ĐIỀU HÀNH DOANH NGHIỆP ---"]);
    sections.push(["Chỉ số", "Giá trị"]);
    sections.push(["Tổng quy mô nhân sự", summary.totalEmployees]);
    sections.push(["Nhân sự đang hoạt động", summary.activeEmployees]);
    sections.push(["Nhân sự chính thức", summary.officialEmployees]);
    sections.push(["Tỷ lệ biến động thôi việc", `${summary.turnoverRate}%`]);
    sections.push(["Quỹ lương thực chi (Net)", summary.latestNetPayroll]);
    sections.push(["Quỹ lương Gross", summary.latestGrossPayroll]);
    sections.push(["Tổng giá trị tài sản phần cứng", summary.totalAssetValue]);
    sections.push(["Tỷ lệ đúng giờ chuyên cần", `${attendanceStats.punctualityRate || 98}%`]);
    sections.push([]);

    // 2. Định biên phòng ban
    sections.push(["--- 2. ĐỊNH BIÊN PHÒNG BAN (QUOTA VS ACTUAL) ---"]);
    sections.push(["Phòng ban", "Mã PB", "Định biên chỉ tiêu", "Thực tế", "Tỷ lệ lấp đầy (%)", "Vị trí còn thiếu"]);
    departments.forEach(d => {
      sections.push([`"${d.name}"`, `"${d.code || ''}"`, d.quota, d.actual, `"${d.fillRate}%"`, d.shortage]);
    });
    sections.push([]);

    // 3. Quỹ lương các kỳ
    sections.push(["--- 3. XU HƯỚNG QUỸ LƯƠNG 6 THÁNG GẦN NHẤT ---"]);
    sections.push(["Kỳ lương", "Số nhân sự", "Lương cơ bản", "Tổng Gross", "Thực chi Net", "Trạng thái"]);
    payrollTrends.forEach(p => {
      sections.push([`"${p.name}"`, p.employees, p.totalBase, p.totalGross, p.totalNet, p.status === 'LOCKED' ? '"Đã khóa sổ"' : '"Bản nháp"']);
    });
    sections.push([]);

    // 4. Tài sản thiết bị & Phân bổ
    sections.push(["--- 4. TÀI SẢN PHẦN CỨNG & PHÂN BỔ PHÒNG BAN ---"]);
    sections.push(["Phòng ban / Bộ phận", "Số lượng thiết bị", "Tổng giá trị (VND)"]);
    (assetStats.deptAllocation || []).forEach(d => {
      sections.push([`"${d.name}"`, d.count, d.totalValue]);
    });
    sections.push([]);

    // 5. Tuyển dụng
    sections.push(["--- 5. HIỆU QUẢ PHỄU TUYỂN DỤNG ---"]);
    sections.push(["Giai đoạn", "Số lượng hồ sơ"]);
    sections.push(["Hồ sơ tiếp nhận", recruitmentStats.funnel?.applied || 0]);
    sections.push(["Đạt sơ loại", recruitmentStats.funnel?.screening || 0]);
    sections.push(["Tham gia phỏng vấn", recruitmentStats.funnel?.interview || 0]);
    sections.push(["Gửi lời mời nhận việc (Offer)", recruitmentStats.funnel?.offered || 0]);
    sections.push(["Tiếp nhận chính thức (Hired)", recruitmentStats.funnel?.hired || 0]);
    sections.push([]);

    // 6. Chuyên cần & Nghỉ phép
    sections.push(["--- 6. CHUYÊN CẦN & NGHỈ PHÉP ---"]);
    sections.push(["Chỉ số", "Số lượng"]);
    sections.push(["Tổng giờ tăng ca OT", attendanceStats.totalOtHours || 0]);
    sections.push(["Đơn nghỉ phép đã duyệt", attendanceStats.approvedLeaves || 0]);
    sections.push(["Nghỉ phép hưởng lương", attendanceStats.paidLeaves || 0]);
    sections.push(["Nghỉ không lương", attendanceStats.unpaidLeaves || 0]);
    sections.push([]);

    // 7. Hiệu suất & KPI
    sections.push(["--- 7. HIỆU SUẤT & ĐÁNH GIÁ KPI ---"]);
    sections.push(["Xếp loại", "Số lượng nhân sự"]);
    sections.push(["Loại A (Xuất sắc)", kpiStats.gradeA || 0]);
    sections.push(["Loại B (Tốt)", kpiStats.gradeB || 0]);
    sections.push(["Loại C (Đạt)", kpiStats.gradeC || 0]);
    sections.push(["Loại D (Cần cải thiện)", kpiStats.gradeD || 0]);

    const csvContent = "\uFEFF" + sections.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_HR_Analytics_DSS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất Báo Cáo Toàn Diện (.CSV) thành công!');
  };

  if (loading) {
    return (
      <div className="flex-col items-center justify-center p-16 text-muted">
        <RefreshCw size={36} className="animate-spin mb-3 text-primary" />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Đang tổng hợp dữ liệu báo cáo đa chiều...</h3>
        <p className="text-xs text-muted mt-1">Đang hợp nhất số liệu thời gian thực từ 7 phân hệ quản trị nhân sự</p>
      </div>
    );
  }

  const { 
    summary = {}, 
    departments = [], 
    criticalShortages = [],
    genderStats = { MALE: 0, FEMALE: 0, OTHER: 0 }, 
    contractStats = [], 
    seniorityStats = [],
    hierarchyStats = [],
    payrollTrends = [],
    salaryBreakdown = { baseSalary: 0, allowancesBonus: 0, deductions: 0, netPayout: 0 },
    assetStats = { totalAssets: 0, availableAssets: 0, assignedAssets: 0, maintenanceAssets: 0, totalAssetValue: 0, utilizationRate: 0, categories: [], deptAllocation: [] },
    decisionStats = [],
    recruitmentStats = { totalJobPostings: 0, openJobPostings: 0, totalCandidates: 0, hiredCandidates: 0, conversionRate: 0, funnel: {} },
    attendanceStats = { totalRecords: 0, punctualityRate: 98, normalCount: 0, lateCount: 0, earlyCount: 0, totalOtHours: 0, approvedLeaves: 0, pendingLeaves: 0, paidLeaves: 0, unpaidLeaves: 0 },
    kpiStats = { totalReviews: 0, gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, totalKpis: 0, completedKpis: 0, kpiCompletionRate: 85 }
  } = data || {};

  // Tính toán chỉ số hỗ trợ
  const totalGender = (genderStats.MALE || 0) + (genderStats.FEMALE || 0) + (genderStats.OTHER || 0) || 1;
  const malePercent = Math.round(((genderStats.MALE || 0) / totalGender) * 100);
  const femalePercent = Math.round(((genderStats.FEMALE || 0) / totalGender) * 100);

  const totalQuota = departments.reduce((sum, d) => sum + (d.quota || 0), 0) || 1;
  const totalActual = departments.reduce((sum, d) => sum + (d.actual || 0), 0);
  const overallFillRate = Math.round((totalActual / totalQuota) * 100);
  const totalShortage = Math.max(0, totalQuota - totalActual);

  const avgCostPerEmp = summary.activeEmployees > 0 ? Math.round(summary.latestGrossPayroll / summary.activeEmployees) : 0;
  const netRatio = summary.latestGrossPayroll > 0 ? Math.round((summary.latestNetPayroll / summary.latestGrossPayroll) * 100) : 0;

  const maxDeptActual = Math.max(...departments.map(d => d.actual), 1);

  // Helper dịch loại quyết định
  const getDecisionLabel = (type) => {
    switch (type) {
      case 'PROMOTION': return { label: 'Bổ nhiệm / Thăng chức', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'REWARD': return { label: 'Khen thưởng', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'DISCIPLINE': return { label: 'Kỷ luật', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'TRANSFER': return { label: 'Điều chuyển công tác', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'TERMINATION': return { label: 'Chấm dứt hợp đồng', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
      default: return { label: type, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    }
  };

  // Helper dịch danh mục tài sản
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'DESKTOP': return 'Bộ máy tính để bàn (PC)';
      case 'LAPTOP': return 'Máy tính xách tay (Laptop)';
      case 'MONITOR': return 'Màn hình máy tính';
      case 'OFFICE_EQUIPMENT': return 'Thiết bị văn phòng & Arm';
      case 'NETWORK': return 'Thiết bị mạng & Server';
      default: return cat || 'Khác';
    }
  };

  // RENDER BỘ THẺ KPI THÔNG MINH LINH HOẠT THEO TỪNG TAB
  const renderDynamicKpiCards = () => {
    const cardContainerStyle = {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '0.85rem'
    };

    const cardBaseStyle = {
      backgroundColor: '#FFFFFF',
      borderRadius: '0.75rem',
      border: '1px solid #E2E8F0',
      padding: '1rem 1.1rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.35rem',
      minHeight: '115px'
    };

    switch (activeTab) {
      case 'DEPT_QUOTA':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quân Số Thực Tế</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{summary.activeEmployees || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>{summary.officialEmployees || 0} chính thức • {summary.probationEmployees || 0} thử việc</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Chỉ Tiêu Định Biên (Quota)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F8FAFC', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{totalQuota}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Quy hoạch trên {departments.length} phòng ban</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Lệ Lấp Đầy Kế Hoạch</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>{overallFillRate}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Đã đạt {totalActual}/{totalQuota} vị trí</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vị Trí Cần Bổ Sung</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', lineHeight: 1.1 }}>{totalShortage}</div>
              <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>Cần tập trung tuyển dụng</div>
            </div>
          </div>
        );

      case 'PAYROLL':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quỹ Lương Thực Chi (Net)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{formatCurrency(summary.latestNetPayroll)}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Khoản thực chuyển khoản nhân viên</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tổng Quỹ Lương Gross</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.1 }}>{formatCurrency(summary.latestGrossPayroll)}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Gồm lương cứng, phụ cấp & thưởng</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Chi Phí Bình Quân / Người</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>{formatCurrency(avgCostPerEmp)}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Chi phí trung bình trên mỗi nhân sự</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Trọng Thực Chi (Net/Gross)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>{netRatio}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Khấu trừ BHXH & Thuế: {100 - netRatio}%</div>
            </div>
          </div>
        );

      case 'DEMOGRAPHICS':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Lệ Giới Tính</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.1 }}>{malePercent}% Nam • {femalePercent}% Nữ</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{genderStats.MALE} Nam / {genderStats.FEMALE} Nữ</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Hợp Đồng Chính Thức</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{summary.officialEmployees || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Tỷ lệ lao động dài hạn ổn định</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Lệ Thôi Việc (Turnover)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserMinus size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: summary.turnoverRate > 15 ? '#EF4444' : '#059669', lineHeight: 1.1 }}>{summary.turnoverRate || 0}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{summary.resignedEmployees || 0} nhân sự thôi việc</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Lực Lượng Nòng Cốt (1-3 Năm)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9333EA', lineHeight: 1.1 }}>{seniorityStats[1]?.count || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Chiếm {seniorityStats[1]?.percent || 0}% tổng quân số</div>
            </div>
          </div>
        );

      case 'ASSETS':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tổng Giá Trị Phần Cứng</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Laptop size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.1 }}>{formatCurrency(assetStats.totalAssetValue)}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Định giá tổng {assetStats.totalAssets} thiết bị</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Công Suất Cấp Phát</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{assetStats.utilizationRate || 0}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{assetStats.assignedAssets} món đang sử dụng</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sẵn Sàng Trong Kho</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3B82F6', lineHeight: 1.1 }}>{assetStats.availableAssets}</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Sẵn sàng bàn giao đón người mới</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Đang Bảo Dưỡng / Hỏng</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', lineHeight: 1.1 }}>{assetStats.maintenanceAssets}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Chờ sửa chữa & kiểm định</div>
            </div>
          </div>
        );

      case 'RECRUITMENT':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vị Trí Đang Mở Tuyển</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.1 }}>{recruitmentStats.openJobPostings}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Trên tổng số {recruitmentStats.totalJobPostings} chiến dịch</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tổng Hồ Sơ Ứng Tuyển</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>{recruitmentStats.totalCandidates}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Thu hút qua các kênh tuyển dụng</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Trúng Tuyển Chính Thức</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{recruitmentStats.hiredCandidates}</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Đã tiếp nhận làm việc</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Lệ Chuyển Đổi Phễu</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>{recruitmentStats.conversionRate}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Hired / Tổng hồ sơ tiếp nhận</div>
            </div>
          </div>
        );

      case 'ATTENDANCE':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Lệ Đi Làm Đúng Giờ</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{attendanceStats.punctualityRate || 98}%</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Tuân thủ kỷ luật chuyên cần</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tổng Giờ Tăng Ca (OT)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9333EA', lineHeight: 1.1 }}>{attendanceStats.totalOtHours || 0}h</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Làm thêm giờ có phê duyệt</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Đơn Nghỉ Phép Đã Duyệt</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.1 }}>{attendanceStats.approvedLeaves || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{attendanceStats.paidLeaves || 0} có lương • {attendanceStats.unpaidLeaves || 0} không lương</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Đơn Chờ Phê Duyệt</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>{attendanceStats.pendingLeaves || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Cần quản lý xem xét phê duyệt</div>
            </div>
          </div>
        );

      case 'KPI':
        return (
          <div style={cardContainerStyle}>
            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Xếp Loại Xuất Sắc (A)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{kpiStats.gradeA}</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Hoàn thành vượt mục tiêu công việc</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Xếp Loại Khá & Tốt (B/C)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.1 }}>{kpiStats.gradeB + kpiStats.gradeC}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Hoàn thành đúng tiến độ & KPI giao</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tỷ Lệ Đạt Mục Tiêu KPI</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>{kpiStats.kpiCompletionRate}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Tiến độ hoàn thành KPI toàn cty</div>
            </div>

            <div style={cardBaseStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Cần Cải Thiện (D)</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', lineHeight: 1.1 }}>{kpiStats.gradeD}</div>
              <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>Cần hỗ trợ & đào tạo thêm</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in pb-12" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Báo Cáo & Thanh Thao Tác */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title">
                Báo Cáo Tổng Hợp & Phân Tích (HR Analytics & DSS)
              </h1>
              <span className="badge badge-info" style={{ fontWeight: 600 }}>Live Data</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Hệ thống hỗ trợ ra quyết định (DSS) — Hợp nhất số liệu đa chiều từ Định biên, Quỹ lương, Lao động, Trang thiết bị, Tuyển dụng, Chuyên cần và KPI
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={fetchReportData} className="btn btn-outline flex items-center gap-1.5" style={{ height: 36 }}>
              <RefreshCw size={15} />
              <span>Làm mới</span>
            </button>
            <button onClick={() => window.print()} className="btn btn-outline flex items-center gap-1.5" style={{ height: 36 }}>
              <Printer size={15} />
              <span>In Báo Cáo</span>
            </button>
            <button onClick={handleExportCSV} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <FileSpreadsheet size={15} />
              <span>Xuất Báo Cáo Excel (.CSV)</span>
            </button>
          </div>
        </div>

        {/* 7 Tab Chuyển Đổi Góc Nhìn Quản Trị Toàn Diện */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            onClick={() => setActiveTab('DEPT_QUOTA')}
            className={`btn ${activeTab === 'DEPT_QUOTA' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <Building size={15} /> 1. Định Biên & Phòng Ban
          </button>
          <button 
            onClick={() => setActiveTab('PAYROLL')}
            className={`btn ${activeTab === 'PAYROLL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <DollarSign size={15} /> 2. Quỹ Lương & Chi Phí
          </button>
          <button 
            onClick={() => setActiveTab('DEMOGRAPHICS')}
            className={`btn ${activeTab === 'DEMOGRAPHICS' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <Users size={15} /> 3. Nhân Khẩu & Cơ Cấu
          </button>
          <button 
            onClick={() => setActiveTab('ASSETS')}
            className={`btn ${activeTab === 'ASSETS' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <Laptop size={15} /> 4. Tài Sản & Thiết Bị
          </button>
          <button 
            onClick={() => setActiveTab('RECRUITMENT')}
            className={`btn ${activeTab === 'RECRUITMENT' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <Briefcase size={15} /> 5. Tuyển Dụng & Quyết Định
          </button>
          <button 
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`btn ${activeTab === 'ATTENDANCE' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <Clock size={15} /> 6. Chuyên Cần & Nghỉ Phép
          </button>
          <button 
            onClick={() => setActiveTab('KPI')}
            className={`btn ${activeTab === 'KPI' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            <Award size={15} /> 7. Hiệu Suất & Đánh Giá KPI
          </button>
        </div>
      </div>

      {/* 2. BỘ 4 THẺ KPI ĐIỀU HÀNH THÔNG MINH (TỰ ĐỔI LINH HOẠT THEO TỪNG TAB) */}
      {renderDynamicKpiCards()}

      {/* 3. NỘI DUNG CHI TIẾT TỪNG PHÂN HỆ PHÂN TÍCH */}

      {/* TAB 1: ĐỊNH BIÊN & CƠ CẤU PHÒNG BAN */}
      {activeTab === 'DEPT_QUOTA' && (
        <div className="flex-col gap-6">
          {/* Cảnh Báo Thiếu Hụt Nhân Sự Khẩn Cấp */}
          {criticalShortages.length > 0 && (
            <div className="card glass p-4" style={{ borderRadius: '14px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} color="#EF4444" />
                <span className="font-bold text-sm" style={{ color: '#EF4444' }}>CẢNH BÁO QUẢN TRỊ: CÁC PHÒNG BAN THIẾU HỤT ĐỊNH BIÊN CẦN ƯU TIÊN TUYỂN DỤNG</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {criticalShortages.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: '#FFFFFF', border: '1px solid #FECACA' }}>
                    <span className="font-semibold text-gray-800">{d.name}:</span>
                    <span className="badge badge-danger" style={{ fontWeight: 700 }}>Thiếu {d.shortage} vị trí</span>
                    <span className="text-muted">(Đạt {d.fillRate}% quota)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biểu Đồ Cột Trực Quan: Định Biên vs Thực Tế */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Biểu Đồ So Sánh Nhân Sự Thực Tế vs Định Biên Chỉ Tiêu
                </h3>
                <p className="text-xs text-muted mt-0.5">So sánh quân số thực tế (cột xanh) và khung định biên quy hoạch (khung nét đứt) giữa các phòng ban</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', display: 'inline-block' }} />
                  Thực tế đang làm
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255, 255, 255, 0.1)', border: '1px dashed #94a3b8', display: 'inline-block' }} />
                  Định biên chỉ tiêu
                </span>
              </div>
            </div>

            <div className="flex items-end gap-3 pt-6 pb-2" style={{ height: '240px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
              {departments.map((dept, i) => {
                const heightPercent = Math.max(15, Math.round((dept.actual / maxDeptActual) * 100));
                const isOver = dept.actual > dept.quota;
                const isFull = dept.actual === dept.quota;

                return (
                  <div key={dept.id || i} className="flex-col items-center gap-2" style={{ flex: '1 0 75px', minWidth: '75px' }}>
                    <div className="flex-col items-center gap-0.5">
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isOver ? 'var(--error)' : isFull ? 'var(--success)' : 'var(--primary)' }}>
                        {dept.actual}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>/{dept.quota}</span>
                    </div>

                    <div style={{ position: 'relative', width: '38px', height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div 
                        style={{ 
                          position: 'absolute',
                          bottom: 0,
                          width: '100%',
                          height: `${Math.min(100, Math.round((dept.quota / maxDeptActual) * 100))}%`,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px dashed rgba(148, 163, 184, 0.4)',
                          borderRadius: '6px'
                        }}
                      />
                      <div 
                        style={{ 
                          width: '28px', 
                          height: `${heightPercent}%`, 
                          background: isOver 
                            ? 'linear-gradient(180deg, #ef4444 0%, rgba(239, 68, 68, 0.5) 100%)' 
                            : isFull 
                              ? 'linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.5) 100%)'
                              : 'linear-gradient(180deg, var(--primary) 0%, rgba(99, 102, 241, 0.4) 100%)',
                          borderRadius: '6px 6px 2px 2px',
                          zIndex: 1,
                          transition: 'height 0.4s ease'
                        }} 
                      />
                    </div>

                    <span 
                      className="text-xs text-muted text-center" 
                      style={{ maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
                      title={dept.name}
                    >
                      {dept.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bảng Chi Tiết Định Biên */}
          <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
            <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Bảng Theo Dõi Định Biên Nhân Sự (Headcount Quota vs Actual)
                </h3>
                <p className="text-xs text-muted mt-0.5">Kiểm soát lấp đầy định biên để phục vụ kế hoạch điều chuyển và tuyển dụng kịp thời</p>
              </div>
            </div>

            <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
              <table>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th>PHÒNG BAN</th>
                    <th className="text-center">MÃ PB</th>
                    <th className="text-center">ĐỊNH BIÊN (QUOTA)</th>
                    <th className="text-center">THỰC TẾ (ACTUAL)</th>
                    <th style={{ width: '220px' }}>TỶ LỆ LẤP ĐẦY</th>
                    <th className="text-center">TÌNH TRẠNG</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(dept => {
                    const isOver = dept.actual > dept.quota;
                    const isFull = dept.actual === dept.quota;
                    return (
                      <tr key={dept.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Building size={16} color="var(--primary)" />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dept.name}</span>
                          </div>
                        </td>
                        <td className="text-center"><span className="badge badge-outline">{dept.code || 'PB'}</span></td>
                        <td className="text-center font-bold text-muted">{dept.quota} nhân sự</td>
                        <td className="text-center font-bold" style={{ color: 'var(--text-main)' }}>{dept.actual} nhân sự</td>
                        <td>
                          <div className="flex-col gap-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{dept.fillRate}%</span>
                              <span className="text-muted">{dept.actual}/{dept.quota}</span>
                            </div>
                            <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${Math.min(100, dept.fillRate)}%`, 
                                  height: '100%', 
                                  backgroundColor: isOver ? 'var(--error)' : isFull ? 'var(--success)' : 'var(--primary)',
                                  borderRadius: 3
                                }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          {isOver ? (
                            <span className="badge badge-danger font-bold">Vượt định biên (+{dept.actual - dept.quota})</span>
                          ) : isFull ? (
                            <span className="badge badge-success font-bold">Đủ định biên</span>
                          ) : (
                            <span className="badge badge-info font-bold">Còn trống {dept.quota - dept.actual} vị trí</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUỸ LƯƠNG & BIẾN ĐỘNG THU NHẬP */}
      {activeTab === 'PAYROLL' && (
        <div className="flex-col gap-6">
          {/* Bóc Tách Thành Phần Quỹ Lương Doanh Nghiệp */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="card glass p-4 flex-col gap-1" style={{ borderLeft: '4px solid #2563EB' }}>
              <span className="text-xs text-muted uppercase font-semibold">Lương Cơ Bản Cố Định</span>
              <div className="money-text font-bold text-xl" style={{ color: '#2563EB' }}>
                {formatCurrency(salaryBreakdown.baseSalary)}
              </div>
              <span className="text-xs text-muted">Lương hợp đồng cam kết đóng bảo hiểm</span>
            </div>

            <div className="card glass p-4 flex-col gap-1" style={{ borderLeft: '4px solid #10B981' }}>
              <span className="text-xs text-muted uppercase font-semibold">Phụ Cấp, Hoa Hồng & Thưởng</span>
              <div className="money-text font-bold text-xl" style={{ color: '#10B981' }}>
                {formatCurrency(salaryBreakdown.allowancesBonus)}
              </div>
              <span className="text-xs text-muted">Phụ cấp ăn trưa, điện thoại & thưởng hiệu suất</span>
            </div>

            <div className="card glass p-4 flex-col gap-1" style={{ borderLeft: '4px solid #EF4444' }}>
              <span className="text-xs text-muted uppercase font-semibold">Khấu Trừ BHXH & Thuế TNCN</span>
              <div className="money-text font-bold text-xl" style={{ color: '#EF4444' }}>
                {formatCurrency(salaryBreakdown.deductions)}
              </div>
              <span className="text-xs text-muted">Trích nộp 10.5% bảo hiểm và thuế nhà nước</span>
            </div>
          </div>

          {/* Biểu Đồ Sóng Xu Hướng Quỹ Lương 6 Tháng */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Xu Hướng Biến Động Quỹ Lương Qua Các Kỳ (6 Tháng Gần Nhất)
                </h3>
                <p className="text-xs text-muted mt-0.5">Biểu đồ so sánh dòng tiền: Tổng Gross cam kết vs Thực chi Net sau thuế & bảo hiểm</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span style={{ width: 12, height: 12, borderRadius: 2, background: '#2563EB' }} /> Tổng Gross</span>
                <span className="flex items-center gap-1.5"><span style={{ width: 12, height: 12, borderRadius: 2, background: '#10B981' }} /> Thực chi Net</span>
              </div>
            </div>

            {/* SVG Trend Wave Chart */}
            {payrollTrends.length > 0 && (
              <div style={{ height: '220px', width: '100%', position: 'relative', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '1rem 0' }}>
                {payrollTrends.map((p, idx) => {
                  const maxGross = Math.max(...payrollTrends.map(x => x.totalGross), 1);
                  const grossHeight = Math.max(20, Math.round((p.totalGross / maxGross) * 160));
                  const netHeight = Math.max(15, Math.round((p.totalNet / maxGross) * 160));

                  return (
                    <div key={idx} className="flex-col items-center gap-2" style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <div className="flex items-end gap-2" style={{ height: '160px' }}>
                        <div style={{ width: 28, height: `${grossHeight}px`, background: 'linear-gradient(180deg, #3B82F6 0%, rgba(59,130,246,0.3) 100%)', borderRadius: '4px 4px 0 0' }} title={`Gross: ${formatCurrency(p.totalGross)}`} />
                        <div style={{ width: 28, height: `${netHeight}px`, background: 'linear-gradient(180deg, #10B981 0%, rgba(16,185,129,0.3) 100%)', borderRadius: '4px 4px 0 0' }} title={`Net: ${formatCurrency(p.totalNet)}`} />
                      </div>
                      <span className="text-xs text-muted font-semibold">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>KỲ LƯƠNG</th>
                    <th className="text-center">SỐ NHÂN SỰ</th>
                    <th className="text-right">LƯƠNG CƠ BẢN</th>
                    <th className="text-right">TỔNG GROSS</th>
                    <th className="text-right" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>THỰC CHI (NET)</th>
                    <th className="text-center">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollTrends.map(p => (
                    <tr key={p.id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</span></td>
                      <td className="text-center font-semibold">{p.employees} nhân sự</td>
                      <td className="text-right money-text">{formatCurrency(p.totalBase)}</td>
                      <td className="text-right money-text font-semibold">{formatCurrency(p.totalGross)}</td>
                      <td className="text-right money-text font-bold" style={{ color: 'var(--success)', fontSize: '1.05rem', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                        {formatCurrency(p.totalNet)}
                      </td>
                      <td className="text-center">
                        {p.status === 'LOCKED' ? (
                          <span className="badge badge-danger font-bold">Đã khóa sổ</span>
                        ) : (
                          <span className="badge badge-warning font-bold">Bản nháp</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CƠ CẤU LAO ĐỘNG & NHÂN KHẨU HỌC */}
      {activeTab === 'DEMOGRAPHICS' && (
        <div className="flex-col gap-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Card: Giới Tính (SVG Donut Chart) */}
            <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Cơ Cấu Giới Tính Nhân Sự
              </h3>
              <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
                Tỷ lệ phân bố Nam / Nữ trong toàn bộ nhân sự công ty
              </p>

              <div className="flex items-center justify-around py-3">
                {/* SVG Donut Ring */}
                <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="140" height="140" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#F1F5F9" strokeWidth="6" />
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#2563EB" strokeWidth="6"
                      strokeDasharray={`${malePercent} ${100 - malePercent}`} strokeDashoffset="25" />
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#EC4899" strokeWidth="6"
                      strokeDasharray={`${femalePercent} ${100 - femalePercent}`} strokeDashoffset={`${25 - malePercent}`} />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{summary.activeEmployees}</span>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B' }}>Nhân sự</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#2563EB' }} />
                    <span className="text-sm font-semibold">Nam: <strong>{genderStats.MALE || 0}</strong> ({malePercent}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#EC4899' }} />
                    <span className="text-sm font-semibold">Nữ: <strong>{genderStats.FEMALE || 0}</strong> ({femalePercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Thâm Niên Công Tác */}
            <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Phân Bố Thâm Niên Công Tác
              </h3>
              <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
                Độ gắn bó của nhân viên và cơ cấu thâm niên cống hiến
              </p>

              <div className="flex-col gap-3 pt-2">
                {seniorityStats.map((s, i) => (
                  <div key={i} className="flex-col gap-1.5 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span>{s.label}</span>
                      <span className="badge badge-primary">{s.count} người ({s.percent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${s.percent}%`, height: '100%', backgroundColor: i === 0 ? '#3B82F6' : i === 1 ? '#10B981' : '#8B5CF6' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cơ cấu Hợp đồng & Cấp bậc */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card glass p-5 flex-col gap-3" style={{ borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Cơ Cấu Hợp Đồng Lao Động
              </h3>
              <div className="flex-col gap-2 pt-1">
                {contractStats.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-sm font-semibold">{c.type === 'OFFICIAL' ? 'Hợp đồng Chính thức' : c.type === 'PROBATION' ? 'Hợp đồng Thử việc' : c.type}</span>
                    <span className="badge badge-primary font-bold">{c.count} Hợp đồng</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass p-5 flex-col gap-3" style={{ borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Cơ Cấu Cấp Bậc Nhân Sự (Hierarchy)
              </h3>
              <div className="flex-col gap-2 pt-1">
                {hierarchyStats.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-sm font-semibold">{h.level}</span>
                    <span className="badge badge-info font-bold">{h.count} nhân sự</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TÀI SẢN & ĐẦU TƯ TRANG THIẾT BỊ PHẦN CỨNG */}
      {activeTab === 'ASSETS' && (
        <div className="flex-col gap-6">
          {/* Phân bổ thiết bị theo phòng ban */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Phân Bổ Giá Trị Tài Sản Theo Phòng Ban
            </h3>
            <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
              Kiểm soát quy mô vốn phần cứng công ty đang giao cho từng phòng ban chịu trách nhiệm quản lý
            </p>

            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>PHÒNG BAN / BỘ PHẬN</th>
                    <th className="text-center">SỐ LƯỢNG THIẾT BỊ</th>
                    <th className="text-right">TỔNG GIÁ TRỊ ĐẦU TƯ</th>
                    <th className="text-right">TỶ TRỌNG TÀI SẢN</th>
                  </tr>
                </thead>
                <tbody>
                  {(assetStats.deptAllocation || []).length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-6 text-muted">Chưa có thiết bị nào được bàn giao cho phòng ban</td></tr>
                  ) : (
                    (assetStats.deptAllocation || []).map((d, i) => {
                      const share = assetStats.totalAssetValue > 0 ? Math.round((d.totalValue / assetStats.totalAssetValue) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td><strong>{d.name}</strong></td>
                          <td className="text-center font-semibold">{d.count} thiết bị</td>
                          <td className="text-right money-text font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(d.totalValue)}</td>
                          <td className="text-right"><span className="badge badge-info">{share}%</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cơ cấu theo chủng loại */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Cơ Cấu Danh Mục Tài Sản Công Ty
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {(assetStats.categories || []).map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                      <Laptop size={16} color="var(--primary)" />
                    </div>
                    <span className="text-sm font-semibold">{getCategoryLabel(cat.category)}</span>
                  </div>
                  <span className="badge badge-primary font-bold">{cat.count} cái</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TUYỂN DỤNG & QUYẾT ĐỊNH NHÂN SỰ */}
      {activeTab === 'RECRUITMENT' && (
        <div className="flex-col gap-6">
          {/* Phễu Tuyển Dụng Trực Quan (Visual Recruitment Funnel) */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Mô Hình Phễu Chuyển Đổi Tuyển Dụng (5 Giai Đoạn)
            </h3>
            <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
              Theo dõi tỷ lệ chuyển đổi từ khâu thu hút hồ sơ đến trúng tuyển chính thức
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <div className="p-3.5 rounded-xl flex-col gap-1 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <span className="text-xs uppercase font-bold text-blue-700">1. Tiếp Nhận Hồ Sơ</span>
                <div className="text-2xl font-extrabold text-blue-900">{recruitmentStats.funnel?.applied || 0}</div>
                <span className="text-xs text-blue-600">100% ứng viên</span>
              </div>

              <div className="p-3.5 rounded-xl flex-col gap-1 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <span className="text-xs uppercase font-bold text-emerald-700">2. Đạt Sơ Loại CV</span>
                <div className="text-2xl font-extrabold text-emerald-900">{recruitmentStats.funnel?.screening || 0}</div>
                <span className="text-xs text-emerald-600">75% qua vòng hồ sơ</span>
              </div>

              <div className="p-3.5 rounded-xl flex-col gap-1 text-center" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                <span className="text-xs uppercase font-bold text-purple-700">3. Phỏng Vấn Chuyên Môn</span>
                <div className="text-2xl font-extrabold text-purple-900">{recruitmentStats.funnel?.interview || 0}</div>
                <span className="text-xs text-purple-600">45% tham dự phỏng vấn</span>
              </div>

              <div className="p-3.5 rounded-xl flex-col gap-1 text-center" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <span className="text-xs uppercase font-bold text-amber-700">4. Đề Nghị Offer</span>
                <div className="text-2xl font-extrabold text-amber-900">{recruitmentStats.funnel?.offered || 0}</div>
                <span className="text-xs text-amber-600">25% đạt tiêu chuẩn lương</span>
              </div>

              <div className="p-3.5 rounded-xl flex-col gap-1 text-center" style={{ background: '#ECFDF5', border: '2px solid #10B981' }}>
                <span className="text-xs uppercase font-bold text-green-700">5. Tiếp Nhận Hired</span>
                <div className="text-2xl font-extrabold text-green-900">{recruitmentStats.funnel?.hired || 0}</div>
                <span className="text-xs text-green-600 font-bold">{recruitmentStats.conversionRate}% chuyển đổi</span>
              </div>
            </div>
          </div>

          {/* Phân Loại Quyết Định Nhân Sự */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Quyết Định Nhân Sự Đã Ban Hành ({summary.totalDecisions || 0} quyết định)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', paddingTop: '0.5rem' }}>
              {decisionStats.length === 0 ? (
                <div className="p-4 text-muted text-center col-span-3">Chưa có quyết định nhân sự nào được ban hành</div>
              ) : (
                decisionStats.map((d, i) => {
                  const meta = getDecisionLabel(d.type);
                  return (
                    <div key={i} className="p-3.5 rounded-xl flex items-center justify-between" style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}>
                      <div className="flex items-center gap-2">
                        <Award size={18} color={meta.color} />
                        <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                      <span className="badge font-bold" style={{ background: meta.color, color: '#fff' }}>{d.count} QĐ</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CHUYÊN CẦN & NGHỈ PHÉP */}
      {activeTab === 'ATTENDANCE' && (
        <div className="flex-col gap-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Phân Tích Kỷ Luật Đi Làm */}
            <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Tỷ Lệ Tuân Thủ Giờ Giấc Làm Việc
              </h3>
              <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
                Đo lường kỷ luật vào ca đúng giờ và hạn chế tình trạng đi muộn về sớm
              </p>

              <div className="flex-col gap-3 pt-2">
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <span className="text-sm font-semibold text-emerald-800">Đi làm đúng giờ chuẩn (Normal)</span>
                  <span className="badge badge-success font-bold">{attendanceStats.normalCount || 0} lượt ({attendanceStats.punctualityRate || 98}%)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <span className="text-sm font-semibold text-amber-800">Đi muộn (Late)</span>
                  <span className="badge badge-warning font-bold">{attendanceStats.lateCount || 0} lượt</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <span className="text-sm font-semibold text-blue-800">Về sớm (Early Leave)</span>
                  <span className="badge badge-info font-bold">{attendanceStats.earlyCount || 0} lượt</span>
                </div>
              </div>
            </div>

            {/* Phân Loại Đơn Nghỉ Phép */}
            <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Cơ Cấu Đơn Xin Nghỉ Phép
              </h3>
              <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
                Phân loại phép năm hưởng nguyên lương và nghỉ việc riêng không hưởng lương
              </p>

              <div className="flex-col gap-3 pt-2">
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm font-semibold">Nghỉ phép năm hưởng lương (Paid Leave)</span>
                  <span className="badge badge-primary font-bold">{attendanceStats.paidLeaves || 0} đơn</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm font-semibold">Nghỉ việc riêng không hưởng lương (Unpaid)</span>
                  <span className="badge badge-outline font-bold">{attendanceStats.unpaidLeaves || 0} đơn</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm font-semibold">Tổng giờ làm thêm giờ thực tế (OT)</span>
                  <span className="badge badge-info font-bold">{attendanceStats.totalOtHours || 0} giờ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: HIỆU SUẤT & ĐÁNH GIÁ KPI */}
      {activeTab === 'KPI' && (
        <div className="flex-col gap-6">
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Phân Bổ Thang Điểm & Xếp Hạng Đánh Giá KPI
            </h3>
            <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
              Đo lường năng suất lao động và cơ sở xét duyệt thưởng hiệu suất định kỳ
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.5rem' }}>
              <div className="p-4 rounded-xl flex-col gap-1 text-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <span className="text-xs uppercase font-bold text-emerald-800">Hạng A • Xuất Sắc</span>
                <div className="text-3xl font-extrabold text-emerald-900">{kpiStats.gradeA}</div>
                <span className="text-xs text-emerald-700">Đạt $\ge$ 100% mục tiêu</span>
              </div>

              <div className="p-4 rounded-xl flex-col gap-1 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <span className="text-xs uppercase font-bold text-blue-800">Hạng B • Tốt & Khá</span>
                <div className="text-3xl font-extrabold text-blue-900">{kpiStats.gradeB}</div>
                <span className="text-xs text-blue-700">Đạt 85% - 99% mục tiêu</span>
              </div>

              <div className="p-4 rounded-xl flex-col gap-1 text-center" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <span className="text-xs uppercase font-bold text-amber-800">Hạng C • Đạt Yêu Cầu</span>
                <div className="text-3xl font-extrabold text-amber-900">{kpiStats.gradeC}</div>
                <span className="text-xs text-amber-700">Đạt 70% - 84% mục tiêu</span>
              </div>

              <div className="p-4 rounded-xl flex-col gap-1 text-center" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
                <span className="text-xs uppercase font-bold text-rose-800">Hạng D • Chưa Đạt</span>
                <div className="text-3xl font-extrabold text-rose-900">{kpiStats.gradeD}</div>
                <span className="text-xs text-rose-700">Dưới 70% mục tiêu giao</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportsDashboard;
