import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, TrendingUp, Award, Search, Filter, Download, 
  Calendar, CheckCircle2, AlertTriangle, Plus, X, Star, FileText,
  UserCheck, ChevronRight, Edit3, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

export const Performance = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterGrade, setFilterGrade] = useState('ALL');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal Cycle State
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    name: `Đánh giá Quý ${Math.floor(new Date().getMonth() / 3) + 1} - ${new Date().getFullYear()}`,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10)
  });

  // Modal Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [score, setScore] = useState(80);
  const [comments, setComments] = useState('');
  const [empKpis, setEmpKpis] = useState([]);
  const [loadingEmpKpis, setLoadingEmpKpis] = useState(false);
  const [empWeightedScore, setEmpWeightedScore] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/kpi/reviews');
      setEvaluations(res.data || []);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCycle = async () => {
    if (!cycleForm.name.trim()) return toast.error("Vui lòng nhập tên kỳ đánh giá");
    try {
      await axios.post('http://localhost:5000/api/kpi/cycles', {
        name: cycleForm.name,
        startDate: new Date(cycleForm.startDate).toISOString(),
        endDate: new Date(cycleForm.endDate).toISOString()
      });
      toast.success(`Đã mở kỳ đánh giá "${cycleForm.name}" thành công!`);
      setIsCycleModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Lỗi mở kỳ đánh giá');
    }
  };

  const handleOpenReview = async (review) => {
    setSelectedReview(review);
    setScore(review.managerScore || review.selfScore || 80);
    setComments(review.note || '');
    setEmpKpis([]);
    setEmpWeightedScore(null);
    setIsReviewModalOpen(true);

    if (review.employeeId) {
      setLoadingEmpKpis(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/kpi/employee/${review.employeeId}`);
        if (res.data?.kpis) {
          setEmpKpis(res.data.kpis);
        }
        if (res.data?.weightedScore) {
          const w100 = Math.round(Number(res.data.weightedScore) * 10);
          setEmpWeightedScore(w100);
        }
      } catch (e) {
        console.error('Lỗi nạp chỉ tiêu của nhân viên:', e);
      } finally {
        setLoadingEmpKpis(false);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (score < 0 || score > 100) return toast.error("Điểm đánh giá phải từ 0 đến 100");
    try {
      await axios.put(`http://localhost:5000/api/kpi/reviews/${selectedReview.id}`, {
        score: Number(score),
        comments
      });
      toast.success('Chấm điểm và lưu đánh giá thành công!');
      setIsReviewModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Lỗi khi lưu kết quả chấm điểm');
      }
    }
  };

  // Distinct Departments
  const departments = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.department).filter(Boolean)));
  }, [evaluations]);

  // Filtered List
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(kpi => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (kpi.name && kpi.name.toLowerCase().includes(q)) ||
        (kpi.empId && kpi.empId.toLowerCase().includes(q));

      const matchDept = filterDept === 'ALL' || kpi.department === filterDept;
      const matchGrade = filterGrade === 'ALL' || kpi.finalGrade === filterGrade;

      return matchSearch && matchDept && matchGrade;
    });
  }, [evaluations, searchQuery, filterDept, filterGrade]);

  // Phân trang
  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage) || 1;
  const paginatedEvaluations = useMemo(() => {
    return filteredEvaluations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredEvaluations, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = evaluations.length;
    const gradeA = evaluations.filter(e => e.finalGrade === 'A').length;
    const gradeB = evaluations.filter(e => e.finalGrade === 'B').length;
    const gradeC = evaluations.filter(e => e.finalGrade === 'C' || e.finalGrade === 'D').length;
    
    const sumScore = evaluations.reduce((acc, curr) => acc + (Number(curr.managerScore) || Number(curr.selfScore) || 0), 0);
    const avgScore = total > 0 ? (sumScore / total).toFixed(1) : '0';

    return { total, gradeA, gradeB, gradeC, avgScore };
  }, [evaluations]);

  // CSV Export
  const handleExportCSV = () => {
    if (evaluations.length === 0) return toast.error("Không có dữ liệu để xuất");

    const headers = ["Mã NV", "Họ và tên", "Phòng ban", "Tự đánh giá", "Quản lý đánh giá", "Xếp loại (Curve)", "Nhận xét của Quản lý"];
    const rows = filteredEvaluations.map(e => [
      `"${e.empId || ''}"`,
      `"${e.name || ''}"`,
      `"${e.department || ''}"`,
      e.selfScore || 0,
      e.managerScore || 0,
      `"${e.finalGrade || 'B'}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Danh_Gia_KPI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã tải xuống file báo cáo đánh giá KPI!");
  };

  const hasFilter = searchQuery || filterDept !== 'ALL' || filterGrade !== 'ALL';

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Top Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Đánh giá Hiệu suất & Xếp loại KPI
              </h1>
              <span className="badge" style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                CHU TRÌNH ĐÁNH GIÁ KPI
              </span>
            </div>
          </div>
          <p className="text-muted text-xs mt-1" style={{ margin: '4px 0 0 0', color: '#64748B' }}>
            Đánh giá hiệu suất định kỳ theo chuẩn phân bổ đường cong Bell Curve (Top 20% Xuất sắc - Mid 60% Đạt - Bot 20% Cần cải thiện).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={handleExportCSV} 
            className="btn btn-outline" 
            style={{ height: '36px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Xuất Báo cáo CSV
          </button>
          <button 
            onClick={() => setIsCycleModalOpen(true)} 
            className="btn btn-primary" 
            style={{ height: '36px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Mở Kỳ Đánh giá Mới
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards (Sleek Modern Design) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Card 1: Hạng A */}
        <div style={{
          backgroundColor: '#FFFFFF', padding: '1.1rem 1.25rem', borderRadius: '12px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Nhóm A (Top 20%)
            </span>
            <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534' }}>
            {stats.gradeA}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Xuất sắc (≥ 90đ) • Xét thưởng hiệu suất
          </div>
        </div>

        {/* Card 2: Hạng B */}
        <div style={{
          backgroundColor: '#FFFFFF', padding: '1.1rem 1.25rem', borderRadius: '12px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>
              Nhóm B (Mid 60%)
            </span>
            <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E40AF' }}>
            {stats.gradeB}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Đạt yêu cầu (75 - 89đ) • 100% lương
          </div>
        </div>

        {/* Card 3: Hạng C/D */}
        <div style={{
          backgroundColor: '#FFFFFF', padding: '1.1rem 1.25rem', borderRadius: '12px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#C2410C', fontWeight: 700, textTransform: 'uppercase' }}>
              Nhóm C/D (Bot 20%)
            </span>
            <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: '#FFEDD5', color: '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#C2410C' }}>
            {stats.gradeC}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Cần cải thiện (&lt; 75đ) • Kèm cặp (PIP)
          </div>
        </div>

        {/* Card 4: Điểm TB */}
        <div style={{
          backgroundColor: '#FFFFFF', padding: '1.1rem 1.25rem', borderRadius: '12px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#6D28D9', fontWeight: 700, textTransform: 'uppercase' }}>
              Điểm Đánh Giá TB
            </span>
            <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: '#F3E8FF', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6D28D9' }}>
            {stats.avgScore} <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Tổng số: <strong>{stats.total}</strong> nhân sự trong kỳ
          </div>
        </div>

      </div>

      {/* 3. Bảng Dữ Liệu & Bộ Lọc Nằm Gọn Gàng Trong 1 Khối */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0',
        padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        
        {/* Thanh Lọc Ngang Chuẩn Hóa: Toàn bộ nằm trên 1 hàng */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            
            {/* Ô tìm kiếm có icon */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm tên nhân sự, mã nhân viên..." 
                className="form-input"
                style={{ paddingLeft: '34px', height: '36px', fontSize: '0.85rem' }}
                value={searchQuery} 
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              />
            </div>

            {/* Dropdown Phòng ban */}
            <select 
              className="form-select" 
              style={{ width: '190px', height: '36px', fontSize: '0.825rem' }}
              value={filterDept} 
              onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">-- Tất cả phòng ban --</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Dropdown Xếp loại */}
            <select 
              className="form-select" 
              style={{ width: '180px', height: '36px', fontSize: '0.825rem' }}
              value={filterGrade} 
              onChange={e => { setFilterGrade(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">-- Tất cả xếp loại --</option>
              <option value="A">Hạng A (Top 20% Xuất sắc)</option>
              <option value="B">Hạng B (Mid 60% Đạt)</option>
              <option value="C">Hạng C (Bot 20% Cần cải thiện)</option>
              <option value="D">Hạng D (Không đạt)</option>
            </select>

            {/* Nút xóa lọc nếu đang áp dụng */}
            {hasFilter && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setFilterDept('ALL'); setFilterGrade('ALL'); setCurrentPage(1); }}
                className="btn btn-outline"
                style={{ height: '36px', fontSize: '0.8rem', padding: '0 10px', color: '#EF4444', borderColor: '#FECACA', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Xóa bộ lọc"
              >
                <X size={14} /> Xóa lọc
              </button>
            )}
          </div>

          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            Hiển thị: <strong>{filteredEvaluations.length}</strong> / {evaluations.length} nhân sự
          </span>
        </div>

        {/* 4. Table Danh Sách */}
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'left', fontWeight: 700 }}>MÃ NV</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'left', fontWeight: 700 }}>NHÂN SỰ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'left', fontWeight: 700 }}>PHÒNG BAN</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>TỰ ĐÁNH GIÁ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>QUẢN LÝ CHẤM</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>XẾP LOẠI (CURVE)</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'left', fontWeight: 700 }}>NHẬN XÉT CỦA QUẢN LÝ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
                    Đang tải danh sách đánh giá hiệu suất...
                  </td>
                </tr>
              ) : filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
                    Chưa có dữ liệu đánh giá phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedEvaluations.map(kpi => (
                  <tr key={kpi.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    
                    {/* Mã NV */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB' }}>
                        {kpi.empId}
                      </span>
                    </td>

                    {/* Nhân sự */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: '#EFF6FF', color: '#2563EB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.82rem'
                        }}>
                          {kpi.name?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                            {kpi.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {kpi.position || 'Chuyên viên'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phòng ban */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: '#F1F5F9', color: '#334155'
                      }}>
                        {kpi.department}
                      </span>
                    </td>

                    {/* Tự đánh giá */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                        {kpi.selfScore}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}> / 100</span>
                    </td>

                    {/* Quản lý chấm */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '1rem', color: '#2563EB', fontWeight: 800 }}>
                        {kpi.managerScore !== null && kpi.managerScore !== undefined ? kpi.managerScore : '--'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}> / 100</span>
                    </td>

                    {/* Xếp loại Curve */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {kpi.finalGrade === 'A' ? (
                        <span className="badge" style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0'
                        }}>
                          Hạng A (Top 20%)
                        </span>
                      ) : kpi.finalGrade === 'C' || kpi.finalGrade === 'D' ? (
                        <span className="badge" style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A'
                        }}>
                          {kpi.finalGrade === 'D' ? 'Hạng D (Không đạt)' : 'Hạng C (Bot 20%)'}
                        </span>
                      ) : (
                        <span className="badge" style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE'
                        }}>
                          Hạng B (Mid 60%)
                        </span>
                      )}
                    </td>

                    {/* Nhận xét */}
                    <td style={{ padding: '12px 14px', maxWidth: '260px' }}>
                      <div style={{
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        fontSize: '0.825rem', color: kpi.note ? '#475569' : '#94A3B8', fontStyle: kpi.note ? 'normal' : 'italic'
                      }} title={kpi.note}>
                        {kpi.note || 'Chưa có ghi chú phản hồi'}
                      </div>
                    </td>

                    {/* Thao tác: Chỉ icon 32x32px */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-outline"
                          style={{
                            width: '32px', height: '32px', padding: 0,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            color: '#2563EB', borderColor: '#BFDBFE'
                          }}
                          onClick={() => handleOpenReview(kpi)}
                          title="Chấm điểm & Đánh giá hiệu suất"
                        >
                          <Award size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân Trang */}
        {filteredEvaluations.length > 0 && (
          <div style={{
            padding: '0.75rem 0.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEvaluations.length)} trong tổng số {filteredEvaluations.length} nhân sự
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button 
                className="btn btn-outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    height: '32px', minWidth: '32px', padding: 0,
                    fontSize: '0.8rem', fontWeight: currentPage === page ? 700 : 500
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button 
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
              >
                Sau
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Mở Kỳ Đánh Giá Mới */}
      {isCycleModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '480px', maxWidth: '95vw',
            border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Mở Kỳ Đánh giá KPI Mới
              </h3>
              <button onClick={() => setIsCycleModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                  Tên kỳ đánh giá <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={cycleForm.name} 
                  onChange={e => setCycleForm({...cycleForm, name: e.target.value})} 
                  placeholder="VD: Đánh giá Quý 4 - 2026" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Ngày bắt đầu
                  </label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={cycleForm.startDate} 
                    onChange={e => setCycleForm({...cycleForm, startDate: e.target.value})} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Ngày kết thúc
                  </label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={cycleForm.endDate} 
                    onChange={e => setCycleForm({...cycleForm, endDate: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setIsCycleModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Hủy bỏ</button>
              <button onClick={handleCreateCycle} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700 }}>Xác nhận Mở Kỳ</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Chấm Điểm & Đánh Giá */}
      {isReviewModalOpen && selectedReview && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '580px', maxWidth: '95vw', maxHeight: '90vh',
            border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#2563EB" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Chấm điểm & Đánh giá Hiệu suất
                </h3>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '8px', padding: '0.75rem 1rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '2px' }}>Nhân sự đang đánh giá:</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedReview.name} <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>({selectedReview.empId})</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  Phòng ban: {selectedReview.department} • Điểm nhân viên tự chấm: <strong>{selectedReview.selfScore}/100</strong>
                </div>
              </div>

              {/* Bảng chi tiết các chỉ số KPI mà nhân viên đã thực hiện */}
              {loadingEmpKpis ? (
                <div style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center', padding: '0.5rem' }}>
                  Đang nạp các chỉ tiêu KPI của nhân viên...
                </div>
              ) : empKpis.length > 0 ? (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                      Chi tiết các chỉ tiêu đã giao ({empKpis.length} chỉ tiêu):
                    </span>
                    {empWeightedScore !== null && (
                      <button
                        type="button"
                        onClick={() => setScore(empWeightedScore)}
                        className="btn btn-outline"
                        style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#059669', borderColor: '#A7F3D0', fontWeight: 700 }}
                        title="Tự động áp dụng điểm tính toán theo trọng số các chỉ tiêu"
                      >
                        Áp dụng điểm tự tính: {empWeightedScore}đ
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {empKpis.map((k, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                          <span style={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {k.title}
                          </span>
                          <span style={{ color: '#64748B', fontSize: '0.7rem' }}>
                            Trọng số: {k.weight}% • Mục tiêu: {k.target}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: k.progress >= 90 ? '#166534' : (k.progress >= 70 ? '#1D4ED8' : '#C2410C') }}>
                            {k.progress}%
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Đạt: {k.rawAchieved} {k.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                  Điểm Quản lý đánh giá (Thang điểm 0 - 100) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={score} 
                    onChange={e => setScore(e.target.value)} 
                    min="0" max="100" 
                    style={{ width: '120px', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Dự kiến xếp loại: {score >= 90 ? (
                      <strong style={{ color: '#059669' }}>Hạng A (Xuất sắc ≥ 90đ)</strong>
                    ) : score >= 75 ? (
                      <strong style={{ color: '#2563eb' }}>Hạng B (Đạt yêu cầu ≥ 75đ)</strong>
                    ) : score >= 60 ? (
                      <strong style={{ color: '#d97706' }}>Hạng C (Cần cải thiện ≥ 60đ)</strong>
                    ) : (
                      <strong style={{ color: '#dc2626' }}>Hạng D (Không đạt &lt; 60đ)</strong>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                  Nhận xét chi tiết của Quản lý trực tiếp
                </label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical' }} 
                  value={comments} 
                  onChange={e => setComments(e.target.value)} 
                  placeholder="Ghi nhận điểm mạnh, các chỉ tiêu hoàn thành và định hướng phát triển sắp tới..." 
                />
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setIsReviewModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Hủy bỏ</button>
              <button onClick={handleSubmitReview} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700 }}>Lưu kết quả chấm</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
