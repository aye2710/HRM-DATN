import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, DollarSign, PieChart, Activity, 
  Download, Printer, RefreshCw, Building, Award, CheckCircle2, 
  AlertCircle, ShieldCheck, UserCheck, UserMinus, Briefcase, 
  FileSpreadsheet, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ReportsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DEPT_QUOTA'); // 'DEPT_QUOTA' | 'PAYROLL' | 'DEMOGRAPHICS'

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/reports/overview');
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

  // Xuất file CSV Báo cáo tổng hợp
  const handleExportCSV = () => {
    if (!data) return;
    const { summary, departments } = data;

    const headers = ["Phòng ban", "Mã PB", "Định biên kế hoạch", "Nhân sự thực tế", "Tỷ lệ lấp đầy (%)", "Trạng thái"];
    const rows = departments.map(d => [
      `"${d.name}"`,
      `"${d.code || ''}"`,
      d.quota,
      d.actual,
      `"${d.fillRate}%"`,
      d.actual > d.quota ? '"Vượt định biên"' : d.actual === d.quota ? '"Đủ định biên"' : '"Còn trống"'
    ]);

    const summaryRows = [
      ["--- TỔNG KẾT DOANH NGHIỆP ---", "", "", "", "", ""],
      ["Tổng nhân sự", summary.totalEmployees, "", "", "", ""],
      ["Nhân sự chính thức", summary.officialEmployees, "", "", "", ""],
      ["Nhân sự thử việc", summary.probationEmployees, "", "", "", ""],
      ["Quỹ lương Net gần nhất", summary.latestNetPayroll, "", "", "", ""],
      ["Quỹ lương Gross gần nhất", summary.latestGrossPayroll, "", "", "", ""],
    ];

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.join(",")),
      "",
      ...summaryRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Tong_Hop_HRM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống file Báo Cáo Nhân Sự!');
  };

  if (loading) {
    return (
      <div className="flex-col items-center justify-center p-16 text-muted">
        <RefreshCw size={36} className="animate-spin mb-3 text-primary" />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Đang tổng hợp dữ liệu báo cáo...</h3>
        <p className="text-xs text-muted mt-1">Đang truy vấn số liệu nhân sự, định biên và quỹ lương từ cơ sở dữ liệu</p>
      </div>
    );
  }

  const { summary, departments = [], genderStats = { MALE: 0, FEMALE: 0 }, contractStats = [], payrollTrends = [] } = data || {};
  const totalGender = (genderStats.MALE || 0) + (genderStats.FEMALE || 0) + (genderStats.OTHER || 0) || 1;
  const malePercent = Math.round(((genderStats.MALE || 0) / totalGender) * 100);
  const femalePercent = Math.round(((genderStats.FEMALE || 0) / totalGender) * 100);

  // Tính tổng định biên toàn công ty
  const totalQuota = departments.reduce((sum, d) => sum + (d.quota || 0), 0) || 1;
  const totalActual = departments.reduce((sum, d) => sum + (d.actual || 0), 0);
  const overallFillRate = Math.round((totalActual / totalQuota) * 100);

  // Tìm phòng ban có số nhân sự cao nhất để căn biểu đồ cột
  const maxDeptActual = Math.max(...departments.map(d => d.actual), 1);

  return (
    <div className="flex-col gap-6 animate-fade-in pb-10" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Báo Cáo & Thanh Thao Tác */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title">
                Báo Cáo Tổng Hợp & Phân Tích (HR Analytics)
              </h1>
              <span className="badge badge-info" style={{ fontWeight: 600 }}>Live Data</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Dữ liệu thời gian thực về quy mô nhân sự, định biên phòng ban, cơ cấu lao động và quỹ lương doanh nghiệp
            </p>
          </div>

          <div className="flex items-center gap-2.5">
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
              <span>Xuất Báo Cáo Excel</span>
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi góc nhìn báo cáo */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            onClick={() => setActiveTab('DEPT_QUOTA')}
            className={`btn ${activeTab === 'DEPT_QUOTA' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px' }}
          >
            <Building size={15} /> Định Biên & Cơ Cấu Phòng Ban
          </button>
          <button 
            onClick={() => setActiveTab('PAYROLL')}
            className={`btn ${activeTab === 'PAYROLL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px' }}
          >
            <DollarSign size={15} /> Quỹ Lương & Thu Nhập
          </button>
          <button 
            onClick={() => setActiveTab('DEMOGRAPHICS')}
            className={`btn ${activeTab === 'DEMOGRAPHICS' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', height: 34, borderRadius: '8px' }}
          >
            <Users size={15} /> Hợp Đồng & Giới Tính
          </button>
        </div>
      </div>

      {/* 2. Bốn Thẻ KPI Chỉ Số Cốt Lõi (Live Cards) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: Tổng Nhân Sự */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng Quy Mô Nhân Sự</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
              <Users size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {summary.activeEmployees}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted mt-1">
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{summary.officialEmployees} chính thức</span>
            <span>•</span>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{summary.probationEmployees} thử việc</span>
          </div>
        </div>

        {/* Card 2: Quỹ Lương Gần Nhất */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Quỹ Lương Thực Chi (Net)</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
              <DollarSign size={16} color="var(--success)" />
            </div>
          </div>
          <div className="money-text font-bold" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
            {formatCurrency(summary.latestNetPayroll)}
          </div>
          <span className="text-xs text-muted mt-1">Tổng Gross: {formatCurrency(summary.latestGrossPayroll)}</span>
        </div>

        {/* Card 3: Khối Phòng Ban */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(105, 108, 255, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Phòng Ban & Khối</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(105, 108, 255, 0.12)' }}>
              <Building size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
            {summary.totalDepartments}
          </div>
          <span className="text-xs text-muted mt-1">Tất cả phòng ban đều có nhân sự hoạt động</span>
        </div>

        {/* Card 4: Tỷ Lệ Lấp Đầy Định Biên */}
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(234, 179, 8, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tỷ Lệ Lấp Đầy Định Biên</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.12)' }}>
              <ShieldCheck size={16} color="var(--warning)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>
            {overallFillRate}%
          </div>
          <span className="text-xs text-muted mt-1">Thực tế {totalActual} / Chỉ tiêu {totalQuota} nhân sự</span>
        </div>
      </div>

      {/* 3. NỘI DUNG TỪNG TAB BÁO CÁO */}

      {/* TAB 1: ĐỊNH BIÊN & CƠ CẤU PHÒNG BAN */}
      {activeTab === 'DEPT_QUOTA' && (
        <div className="flex-col gap-6">
          {/* Biểu Đồ Cột Trực Quan: Số Lượng Nhân Sự Từng Phòng Ban */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Biểu Đồ Phân Bổ Nhân Sự Theo Phòng Ban
                </h3>
                <p className="text-xs text-muted mt-0.5">So sánh quy mô nhân sự thực tế giữa các khối phòng ban</p>
              </div>
              <span className="badge badge-outline text-xs">Đơn vị: Nhân sự</span>
            </div>

            <div className="flex items-end gap-3 pt-6 pb-2" style={{ height: '220px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
              {departments.map((dept, i) => {
                const heightPercent = Math.max(15, Math.round((dept.actual / maxDeptActual) * 100));
                return (
                  <div key={dept.id || i} className="flex-col items-center gap-2" style={{ flex: '1 0 70px', minWidth: '70px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {dept.actual}
                    </span>
                    <div 
                      style={{ 
                        width: '36px', 
                        height: `${heightPercent}%`, 
                        background: 'linear-gradient(180deg, var(--primary) 0%, rgba(99, 102, 241, 0.4) 100%)',
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.4s ease'
                      }} 
                    />
                    <span 
                      className="text-xs text-muted text-center" 
                      style={{ 
                        maxWidth: '70px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '0.72rem'
                      }}
                      title={dept.name}
                    >
                      {dept.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bảng Chi Tiết Định Biên Từng Phòng Ban */}
          <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
            <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Bảng Theo Dõi Định Biên Nhân Sự (Headcount Quota vs Actual)
                </h3>
                <p className="text-xs text-muted mt-0.5">Kiểm soát lấp đầy định biên để phục vụ kế hoạch tuyển dụng</p>
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

                        <td className="text-center">
                          <span className="badge badge-outline">{dept.code || 'PB'}</span>
                        </td>

                        <td className="text-center font-bold text-muted">
                          {dept.quota} nhân sự
                        </td>

                        <td className="text-center font-bold" style={{ color: 'var(--text-main)' }}>
                          {dept.actual} nhân sự
                        </td>

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
                            <span className="badge badge-danger font-bold">Vượt định biên</span>
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

      {/* TAB 2: QUỸ LƯƠNG & THU NHẬP */}
      {activeTab === 'PAYROLL' && (
        <div className="flex-col gap-6">
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Xu Hướng Quỹ Lương Doanh Nghiệp Qua Các Kỳ
            </h3>
            <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
              Theo dõi biến động tổng thu nhập Gross và thực chi Net sau bảo hiểm & thuế
            </p>

            {payrollTrends.length === 0 ? (
              <div className="p-8 text-center text-muted">
                Chưa có dữ liệu kỳ lương nào. Vui lòng chạy tính lương tại module Lương thưởng.
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>KỲ LƯƠNG</th>
                      <th className="text-center">SỐ NHÂN SỰ</th>
                      <th className="text-right">QUỸ LƯƠNG CƠ BẢN</th>
                      <th className="text-right">TỔNG GROSS</th>
                      <th className="text-right" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>THỰC CHI (NET)</th>
                      <th className="text-center">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollTrends.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</span>
                        </td>
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
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CƠ CẤU LAO ĐỘNG & NHÂN KHẨU HỌC */}
      {activeTab === 'DEMOGRAPHICS' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Card: Giới Tính */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Cơ Cấu Giới Tính Nhân Sự
            </h3>
            <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
              Tỷ lệ phân bố Nam / Nữ trong toàn bộ nhân sự công ty
            </p>

            <div className="flex-col gap-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                  Nam ({genderStats.MALE || 0} người)
                </span>
                <strong style={{ color: 'var(--primary)' }}>{malePercent}%</strong>
              </div>
              <div style={{ width: '100%', height: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${malePercent}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ec4899', display: 'inline-block' }} />
                  Nữ ({genderStats.FEMALE || 0} người)
                </span>
                <strong style={{ color: '#ec4899' }}>{femalePercent}%</strong>
              </div>
              <div style={{ width: '100%', height: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${femalePercent}%`, height: '100%', backgroundColor: '#ec4899' }} />
              </div>
            </div>
          </div>

          {/* Card: Loại Hợp Đồng */}
          <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Cơ Cấu Hợp Đồng Lao Động
            </h3>
            <p className="text-xs text-muted" style={{ marginTop: '-0.5rem' }}>
              Phân loại hợp đồng thử việc, xác định và không xác định thời hạn
            </p>

            <div className="flex-col gap-3 pt-2">
              {contractStats.length === 0 ? (
                <div className="p-4 text-muted text-center">Chưa có dữ liệu phân loại hợp đồng</div>
              ) : (
                contractStats.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-sm font-semibold text-main">
                      {c.type === 'OFFICIAL' ? 'Hợp đồng Chính thức' : c.type === 'PROBATION' ? 'Hợp đồng Thử việc' : c.type === 'INDEFINITE' ? 'Không xác định thời hạn' : c.type}
                    </span>
                    <span className="badge badge-primary font-bold">{c.count} HĐ</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
