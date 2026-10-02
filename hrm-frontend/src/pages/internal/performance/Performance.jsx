import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Award, Search, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const Performance = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [score, setScore] = useState(0);
  const [comments, setComments] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/kpi/reviews');
      setEvaluations(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCycle = async () => {
    const cycleName = prompt("Nhập tên kỳ đánh giá mới (VD: Q3-2026):");
    if (!cycleName) return;
    try {
      await axios.post('http://localhost:5000/api/kpi/cycles', {
        name: cycleName,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString()
      });
      toast.success(`Đã mở kỳ đánh giá ${cycleName}`);
      fetchData();
    } catch (err) {
      toast.error('Lỗi mở kỳ đánh giá');
    }
  };

  const handleOpenReview = (review) => {
    setSelectedReview(review);
    setScore(review.managerScore || 0);
    setComments(review.note || '');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    try {
      await axios.put(`http://localhost:5000/api/kpi/reviews/${selectedReview.id}`, {
        score: Number(score),
        comments
      });
      toast.success('Chấm điểm thành công!');
      setIsReviewModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Lỗi khi chấm điểm');
      }
    }
  };

  return (
    <>
      <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Đánh giá KPI (Performance Review)
            </h2>
            <p className="text-muted mt-2">Phân loại nhân sự theo đường cong chuẩn (Force Ranking 20-60-20).</p>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
              Xuất Báo cáo
            </button>
            <button onClick={handleOpenCycle} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
              <Target size={18} /> Mở Kỳ Đánh giá Mới
            </button>
          </div>
        </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card glass card-hover" style={{ padding: '1.5rem', borderTop: '4px solid var(--success)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted">Nhóm A (Excellent - 20%)</span>
            <Award size={20} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>{evaluations.filter(e => e.finalGrade === 'A').length}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Đủ tiêu chuẩn thưởng quý</p>
        </div>
        
        <div className="card glass card-hover" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted">Nhóm B (Good - 60%)</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>{evaluations.filter(e => e.finalGrade === 'B').length}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Đạt KPI tiêu chuẩn</p>
        </div>

        <div className="card glass card-hover" style={{ padding: '1.5rem', borderTop: '4px solid var(--warning)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted">Nhóm C/D (Needs Improvement - 20%)</span>
            <Target size={20} color="var(--warning)" />
          </div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>{evaluations.filter(e => e.finalGrade === 'C').length}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Cần cải thiện hiệu suất</p>
        </div>
      </div>

      <div className="card glass mb-6">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Tự đánh giá</th>
                <th>Quản lý đánh giá</th>
                <th>Xếp loại (Curve)</th>
                <th>Nhận xét của Quản lý</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan="7" className="text-center p-8 text-muted">Đang tải dữ liệu...</td></tr>
              ) : evaluations.length === 0 ? (
                 <tr><td colSpan="7" className="text-center p-8 text-muted">Chưa có dữ liệu. Vui lòng Mở Kỳ Đánh giá Mới.</td></tr>
              ) : (
                evaluations.map(kpi => (
                  <tr key={kpi.id} style={{ transition: 'background-color 0.2s' }} className="hover:bg-white/5">
                    <td>
                      <div className="flex-col">
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{kpi.name}</span>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{kpi.empId}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-purple" style={{ background: 'transparent', border: '1px solid var(--primary)' }}>{kpi.department}</span></td>
                    <td><strong style={{ fontSize: '1.1rem' }}>{kpi.selfScore}</strong>/100</td>
                    <td><strong style={{ fontSize: '1.1rem' }}>{kpi.managerScore}</strong>/100</td>
                    <td>
                      {kpi.finalGrade === 'A' && <span className="badge badge-success">Hạng A (Top 20%)</span>}
                      {kpi.finalGrade === 'B' && <span className="badge badge-info" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>Hạng B (Mid 60%)</span>}
                      {kpi.finalGrade === 'C' && <span className="badge badge-warning">Hạng C (Bot 20%)</span>}
                    </td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.note}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline hover:bg-primary/20 hover:text-primary transition-colors" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
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
      </div>

      {/* Modal Chấm điểm */}
      {isReviewModalOpen && selectedReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award size={22} color="var(--primary)" /> Chấm điểm & Đánh giá
            </h3>
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <p className="text-sm text-muted mb-1">Nhân viên đang đánh giá:</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>{selectedReview.name} ({selectedReview.empId})</p>
              <p className="text-sm" style={{ color: 'var(--primary)' }}>{selectedReview.department}</p>
            </div>
            
            <div className="mb-4">
              <label className="form-label">Điểm đánh giá (0-100)</label>
              <input 
                type="number" 
                className="form-input" 
                value={score}
                onChange={(e) => setScore(e.target.value)}
                min="0" max="100"
              />
            </div>

            <div className="mb-6">
              <label className="form-label">Nhận xét của Quản lý (Feedback)</label>
              <textarea 
                className="form-input" 
                style={{ height: '90px', resize: 'none' }}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Nhập nhận xét chi tiết về ưu điểm, khuyết điểm..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-outline" 
                onClick={() => setIsReviewModalOpen(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmitReview}
              >
                <Target size={18} /> Lưu đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
