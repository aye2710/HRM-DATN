import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Target, Award, TrendingUp, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Sparkles, Star, Edit3, BarChart2, Edit, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

export const EmployeeKPI = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q3-2026');
  const employeeId = localStorage.getItem('employeeId');
  const [loading, setLoading] = useState(false);
  const [updatingKpi, setUpdatingKpi] = useState(null);
  const [newAchieved, setNewAchieved] = useState(0);

  const [kpis, setKpis] = useState([
    {
      id: 1,
      title: 'Tối ưu hóa hiệu năng hệ thống core HRM',
      target: '200 ms',
      rawTarget: 200,
      rawAchieved: 185,
      unit: 'ms',
      weight: 25,
      progress: 95,
      selfScore: 9.5,
      status: 'EXCELLENT',
      comment: 'Đã hoàn thành tối ưu caching và index PostgreSQL, vượt kỳ vọng.'
    },
    {
      id: 2,
      title: 'Tỷ lệ hoàn thành Sprint (Sprint Velocity)',
      target: '90 %',
      rawTarget: 90,
      rawAchieved: 95,
      unit: '%',
      weight: 30,
      progress: 95,
      selfScore: 9.5,
      status: 'EXCELLENT',
      comment: 'Hoàn thành 100% các Story points được giao trong Sprint.'
    },
    {
      id: 3,
      title: 'Đảm bảo tỷ lệ kiểm thử tự động (Unit Test Coverage)',
      target: '80 %',
      rawTarget: 80,
      rawAchieved: 84,
      unit: '%',
      weight: 25,
      progress: 90,
      selfScore: 9.0,
      status: 'EXCELLENT',
      comment: 'Coverage hiện tại đạt 84% toàn bộ backend controllers.'
    },
    {
      id: 4,
      title: 'Tuân thủ quy chế làm việc & Kỷ luật bảo mật',
      target: '98 %',
      rawTarget: 98,
      rawAchieved: 100,
      unit: '%',
      weight: 20,
      progress: 100,
      selfScore: 10,
      status: 'COMPLETED',
      comment: 'Chấm công đúng giờ 100%, tuân thủ an toàn thông tin theo Nghị định 13.'
    }
  ]);

  const fetchKpis = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/kpi/employee/${employeeId}`);
      if (res.data?.kpis && Array.isArray(res.data.kpis) && res.data.kpis.length > 0) {
        setKpis(res.data.kpis);
      }
    } catch (err) {
      console.error('Error fetching employee KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, [employeeId]);

  // Tính điểm trung bình theo trọng số
  const totalScore = useMemo(() => {
    const totalWeight = kpis.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    if (kpis.length === 0 || totalWeight === 0) return '0.0';
    return kpis.reduce((acc, curr) => acc + (Number(curr.selfScore) * Number(curr.weight) / totalWeight), 0).toFixed(1);
  }, [kpis]);

  const avgProgress = useMemo(() => {
    if (kpis.length === 0) return '0.0';
    return (kpis.reduce((acc, curr) => acc + Number(curr.progress || 0), 0) / kpis.length).toFixed(1);
  }, [kpis]);

  const gradeInfo = useMemo(() => {
    const s = Number(totalScore);
    if (s >= 9.0) return { text: 'Xuất sắc (Hạng A)', color: '#4ADE80' };
    if (s >= 7.0) return { text: 'Đạt yêu cầu (Hạng B)', color: '#60A5FA' };
    return { text: 'Cần cải thiện (Hạng C)', color: '#F87171' };
  }, [totalScore]);

  const handleSaveAchieved = async (e) => {
    e.preventDefault();
    if (!updatingKpi) return;
    try {
      await axios.put(`http://localhost:5000/api/kpi/kpi/${updatingKpi.id}`, {
        achieved: Number(newAchieved)
      });
      toast.success('Đã cập nhật số liệu tiến độ của bạn thành công!');
      setUpdatingKpi(null);
      fetchKpis();
    } catch (err) {
      toast.error('Lỗi khi cập nhật tiến độ');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        padding: '1.25rem 1.75rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target size={20} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Mục Tiêu & Hiệu Suất Của Tôi (My KPI)
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Theo dõi tiến độ các chỉ tiêu KPI được giao và cập nhật số liệu thực tế định kỳ.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>Chu kỳ:</span>
          <select
            className="form-input"
            value={selectedQuarter}
            onChange={e => setSelectedQuarter(e.target.value)}
            style={{ width: 'auto', height: '38px', backgroundColor: '#F8FAFC', fontWeight: 600, color: '#0F172A' }}
          >
            <option value="Q3-2026">Quý 3 / 2026 (Đang diễn ra)</option>
            <option value="Q2-2026">Quý 2 / 2026 (Đã chốt)</option>
            <option value="Q1-2026">Quý 1 / 2026 (Đã chốt)</option>
          </select>
        </div>
      </div>

      {/* 2. Thẻ Tóm Tắt Điểm & Tiến Độ Tổng Thể */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(15,23,42,0.15)'
        }}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Điểm tự đánh giá (Tạm tính)
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#60A5FA', lineHeight: 1.1, marginTop: '0.25rem' }}>
              {totalScore} <span style={{ fontSize: '1rem', color: '#94A3B8' }}>/ 10.0</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: gradeInfo.color, fontWeight: 700 }}>
              Xếp loại dự kiến: {gradeInfo.text}
            </span>
          </div>
          <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
            <Award size={26} />
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Tiến độ hoàn thành trung bình
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginTop: '0.25rem' }}>
              {avgProgress}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              {kpis.filter(k => k.progress >= 70).length} / {kpis.length} mục tiêu đang đạt yêu cầu
            </span>
          </div>
          <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <TrendingUp size={26} />
          </div>
        </div>

      </div>

      {/* 3. Danh Sách Các Mục Tiêu KPI Chi Tiết */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
          Chi tiết {kpis.length} chỉ tiêu công việc ({selectedQuarter})
        </h3>

        {kpis.map((kpi, idx) => (
          <div 
            key={kpi.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              border: '1px solid #E2E8F0',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    KPI #{idx + 1}
                  </span>
                  <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    Trọng số: {kpi.weight}%
                  </span>
                  <span style={{ backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {kpi.category || 'OUTPUT'}
                  </span>
                </div>
                <strong style={{ fontSize: '1.05rem', color: '#0F172A', display: 'block' }}>
                  {kpi.title}
                </strong>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Mục tiêu (`Target`): <strong>{kpi.target}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Điểm tính theo tiến độ</span>
                  <strong style={{ fontSize: '1.25rem', color: '#2563EB' }}>{kpi.selfScore} / 10</strong>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUpdatingKpi(kpi);
                    setNewAchieved(Number(kpi.rawAchieved || 0));
                  }}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#2563EB' }}
                >
                  <Edit size={14} /> Cập nhật kết quả
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '0.35rem' }}>
                <span>Tiến độ thực hiện: <strong>{kpi.comment || `Đã đạt ${kpi.rawAchieved || 0}/${kpi.rawTarget || 100} ${kpi.unit || '%'}`}</strong></span>
                <strong style={{ color: kpi.progress >= 90 ? '#16A34A' : (kpi.progress >= 70 ? '#2563EB' : '#EA580C') }}>{kpi.progress}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${kpi.progress}%`,
                  backgroundColor: kpi.progress >= 90 ? '#16A34A' : (kpi.progress >= 70 ? '#2563EB' : '#EA580C'),
                  borderRadius: '9999px'
                }} />
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL CẬP NHẬT KẾT QUẢ ĐẠT ĐƯỢC (ACHIEVED) */}
      {updatingKpi && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '460px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Cập Nhật Kết Quả Hoàn Thành
              </h3>
              <button onClick={() => setUpdatingKpi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveAchieved} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Chỉ tiêu:</span>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', marginTop: '2px' }}>
                  {updatingKpi.title}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>Mục tiêu được giao:</span>
                <strong style={{ fontSize: '0.95rem', color: '#047857' }}>
                  {updatingKpi.target}
                </strong>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  Số liệu thực tế bạn đã đạt (`Achieved`) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    required
                    value={newAchieved}
                    onChange={e => setNewAchieved(e.target.value)}
                    style={{ fontSize: '1rem', fontWeight: 800, color: '#2563EB', height: '40px' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                    {updatingKpi.unit || '%'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setUpdatingKpi(null)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700 }}>
                  Xác nhận
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
