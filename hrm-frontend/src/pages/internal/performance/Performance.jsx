import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, TrendingUp, Award, Search, Filter, Download, 
  Calendar, CheckCircle2, AlertTriangle, Plus, X, Star, FileText,
  UserCheck, ChevronRight
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

  const handleOpenReview = (review) => {
    setSelectedReview(review);
    setScore(review.managerScore || review.selfScore || 80);
    setComments(review.note || '');
    setIsReviewModalOpen(true);
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

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Top Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        padding: '1.25rem 1.75rem',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              backgroundColor: '#EEF2FF', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target size={20} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Đánh giá Hiệu suất & Xếp loại KPI (Performance Review)
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Phân bổ nhân sự theo chuẩn đường cong hiệu suất Force Ranking (Top 20% Xuất sắc - Mid 60% Đạt - Bot 20% Cần cải thiện).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="btn btn-outline" style={{ height: 38, fontSize: '0.85rem' }}>
            <Download size={16} /> Xuất Báo cáo CSV
          </button>
          <button onClick={() => setIsCycleModalOpen(true)} className="btn btn-primary" style={{ height: 38, fontSize: '0.85rem' }}>
            <Plus size={16} /> Mở Kỳ Đánh giá Mới
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #10b981',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Nhóm A (Top 20%)
            </span>
            <Award size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>
            {stats.gradeA}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Xuất sắc • Đủ tiêu chuẩn xét thưởng
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #6366f1',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Nhóm B (Mid 60%)
            </span>
            <TrendingUp size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#6366f1' }}>
            {stats.gradeB}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Đạt yêu cầu chuẩn theo vị trí
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Nhóm C/D (Bot 20%)
            </span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b' }}>
            {stats.gradeC}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cần kế hoạch kèm cặp cải thiện (PIP)
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #0284c7',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Điểm Đánh Giá TB
            </span>
            <Star size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7' }}>
            {stats.avgScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tổng số: {stats.total} hồ sơ đánh giá
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0.75rem 1.25rem',
        border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo tên nhân sự hoặc mã nhân viên..." 
              className="form-input"
              style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC' }}
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>

          <select 
            className="form-input" 
            style={{ minWidth: '180px', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC' }}
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select 
            className="form-input" 
            style={{ minWidth: '180px', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC' }}
            value={filterGrade} 
            onChange={e => setFilterGrade(e.target.value)}
          >
            <option value="ALL">Tất cả phân loại</option>
            <option value="A">Hạng A (Top 20% Xuất sắc)</option>
            <option value="B">Hạng B (Mid 60% Đạt)</option>
            <option value="C">Hạng C (Bot 20% Cần cải thiện)</option>
          </select>
        </div>

        {(searchQuery || filterDept !== 'ALL' || filterGrade !== 'ALL') && (
          <button
            onClick={() => { setSearchQuery(''); setFilterDept('ALL'); setFilterGrade('ALL'); }}
            className="btn btn-outline"
            style={{ height: 38, fontSize: '0.8rem', padding: '0 0.85rem' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 4. Table Workspace */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân sự</th>
                <th>Phòng ban</th>
                <th style={{ textAlign: 'center' }}>Tự đánh giá</th>
                <th style={{ textAlign: 'center' }}>Quản lý chấm</th>
                <th>Xếp loại (Curve)</th>
                <th>Nhận xét của Quản lý</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    Đang tải danh sách đánh giá...
                  </td>
                </tr>
              ) : filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    Chưa có dữ liệu đánh giá phù hợp. Hãy bấm "Mở Kỳ Đánh giá Mới".
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map(kpi => (
                  <tr key={kpi.id}>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {kpi.empId}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: '#EEF2FF', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.82rem'
                        }}>
                          {kpi.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                          {kpi.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: '#F1F5F9', color: 'var(--text-heading)'
                      }}>
                        {kpi.department}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                        {kpi.selfScore}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / 100</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                        {kpi.managerScore || '--'}
                      </strong>
                      {kpi.managerScore && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / 100</span>}
                    </td>
                    <td>
                      {kpi.finalGrade === 'A' ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                        }}>
                          Hạng A (Top 20%)
                        </span>
                      ) : kpi.finalGrade === 'C' || kpi.finalGrade === 'D' ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A'
                        }}>
                          Hạng C (Bot 20%)
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE'
                        }}>
                          Hạng B (Mid 60%)
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={kpi.note}>
                        {kpi.note || 'Chưa có ghi chú phản hồi'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-outline"
                        style={{ height: 32, padding: '0 12px', fontSize: '0.78rem', fontWeight: 600 }}
                        onClick={() => handleOpenReview(kpi)}
                      >
                        Chấm điểm
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Evaluation Cycle (Replaced window.prompt) */}
      {isCycleModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '480px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                Mở Kỳ Đánh giá KPI Mới
              </h3>
              <button onClick={() => setIsCycleModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                  Tên kỳ đánh giá <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={cycleForm.name} 
                  onChange={e => setCycleForm({...cycleForm, name: e.target.value})} 
                  placeholder="VD: Đánh giá Quý 3 - 2026" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
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
              padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setIsCycleModalOpen(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleCreateCycle} className="btn btn-primary">Xác nhận Mở Kỳ</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Score Evaluation Modal */}
      {isReviewModalOpen && selectedReview && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '500px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  Chấm điểm & Đánh giá Hiệu suất
                </h3>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                backgroundColor: '#F8FAFC', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '0.75rem 1rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Nhân sự đang đánh giá:</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  {selectedReview.name} <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>({selectedReview.empId})</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Phòng ban: {selectedReview.department} • Điểm nhân viên tự chấm: <strong>{selectedReview.selfScore}/100</strong>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Dự kiến xếp loại: {score >= 85 ? (
                      <strong style={{ color: '#059669' }}>Hạng A (Xuất sắc)</strong>
                    ) : score >= 70 ? (
                      <strong style={{ color: '#2563eb' }}>Hạng B (Đạt yêu cầu)</strong>
                    ) : (
                      <strong style={{ color: '#d97706' }}>Hạng C (Cần cải thiện)</strong>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
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
              padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setIsReviewModalOpen(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleSubmitReview} className="btn btn-primary">Lưu kết quả chấm</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
