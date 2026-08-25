import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, Star, Clock, X, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';

export const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    candidateId: '',
    interviewerId: '',
    roundName: 'Phỏng vấn Kỹ thuật',
    scheduledAt: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    score: 5,
    comments: ''
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://localhost:5000/api/interviews'),
      axios.get('http://localhost:5000/api/candidates')
    ]).then(([intRes, candRes]) => {
      setInterviews(intRes.data);
      setCandidates(candRes.data);
    }).catch(err => console.error(err)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleForm.candidateId || !scheduleForm.interviewerId || !scheduleForm.scheduledAt) {
      return alert("Vui lòng điền đầy đủ thông tin");
    }

    axios.post('http://localhost:5000/api/interviews', scheduleForm)
      .then(() => {
        fetchData();
        setShowScheduleModal(false);
        setScheduleForm({ candidateId: '', interviewerId: '', roundName: 'Phỏng vấn Kỹ thuật', scheduledAt: '' });
      })
      .catch(err => alert("Lỗi khi xếp lịch"));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/interviews/${selectedInterviewId}/feedback`, feedbackForm)
      .then(() => {
        fetchData();
        setShowFeedbackModal(false);
        setFeedbackForm({ score: 5, comments: '' });
      })
      .catch(err => alert("Lỗi khi lưu đánh giá"));
  };

  const interviewingCandidates = candidates.filter(c => c.status === 'INTERVIEWING');

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lịch Phỏng Vấn
          </h2>
          <p className="text-muted mt-2">Quản lý lịch hẹn và đánh giá ứng viên sau phỏng vấn.</p>
        </div>
        <div>
          <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            <Calendar size={18} /> Lên lịch mới
          </button>
        </div>
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
             <div className="p-8 text-center text-muted">Đang tải...</div>
          ) : interviews.length === 0 ? (
             <div className="p-8 text-center text-muted border-b border-[rgba(255,255,255,0.05)]">Chưa có lịch phỏng vấn nào.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[rgba(15,23,42,0.95)] backdrop-blur-md z-10">
                <tr className="border-b border-[rgba(255,255,255,0.1)]">
                  <th className="p-4 text-sm font-semibold text-muted">Ngày & Giờ</th>
                  <th className="p-4 text-sm font-semibold text-muted">Ứng viên</th>
                  <th className="p-4 text-sm font-semibold text-muted">Vòng / Vị trí</th>
                  <th className="p-4 text-sm font-semibold text-muted">Người phỏng vấn</th>
                  <th className="p-4 text-sm font-semibold text-muted text-right">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(inv => {
                  const hasFeedback = inv.feedbacks && inv.feedbacks.length > 0;
                  const date = new Date(inv.scheduledAt);
                  const formattedDate = date.toLocaleDateString('vi-VN');
                  const formattedTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const isPast = date < new Date();

                  return (
                    <tr key={inv.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-[var(--primary)] flex items-center gap-2">
                          <Clock size={16} /> {formattedTime}
                        </div>
                        <div className="text-sm text-muted mt-1">{formattedDate}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white">{inv.candidate?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted">{inv.candidate?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[var(--text-main)]">{inv.roundName}</div>
                        <div className="text-xs text-muted">{inv.candidate?.jobPosting?.title}</div>
                      </td>
                      <td className="p-4 text-sm">{inv.interviewerId}</td>
                      <td className="p-4 text-right">
                        {hasFeedback ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[var(--success)] flex items-center gap-1 font-semibold text-sm">
                              <CheckCircle size={14} /> Đã đánh giá ({inv.feedbacks[0].score}/10)
                            </span>
                            <span className="text-xs text-muted max-w-[200px] truncate" title={inv.feedbacks[0].comments}>{inv.feedbacks[0].comments}</span>
                          </div>
                        ) : isPast ? (
                           <button onClick={() => { setSelectedInterviewId(inv.id); setShowFeedbackModal(true); }} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                             <Star size={14} /> Chấm điểm
                           </button>
                        ) : (
                          <span className="text-muted text-sm italic opacity-50">Chưa diễn ra</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Lên lịch Phỏng vấn</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="flex-col gap-4" style={{ padding: '1.5rem' }}>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Ứng viên (Đang chờ phỏng vấn)</label>
                  <select required className="form-input w-full bg-[rgba(255,255,255,0.05)]" value={scheduleForm.candidateId} onChange={e => setScheduleForm({...scheduleForm, candidateId: e.target.value})}>
                    <option value="" className="text-black">-- Chọn ứng viên --</option>
                    {interviewingCandidates.map(c => (
                      <option key={c.id} value={c.id} className="text-black">{c.name} - {c.jobPosting?.title}</option>
                    ))}
                  </select>
                  {interviewingCandidates.length === 0 && <p className="text-xs text-[var(--warning)] mt-1">Không có ứng viên nào đang ở trạng thái PHỎNG VẤN.</p>}
                </div>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Tên vòng phỏng vấn</label>
                  <input required type="text" className="form-input w-full" value={scheduleForm.roundName} onChange={e => setScheduleForm({...scheduleForm, roundName: e.target.value})} placeholder="VD: Phỏng vấn chuyên môn" />
                </div>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Ngày & Giờ (Dự kiến)</label>
                  <input required type="datetime-local" className="form-input w-full" style={{ colorScheme: 'dark' }} value={scheduleForm.scheduledAt} onChange={e => setScheduleForm({...scheduleForm, scheduledAt: e.target.value})} />
                </div>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Người phỏng vấn (Tên)</label>
                  <input required type="text" className="form-input w-full" value={scheduleForm.interviewerId} onChange={e => setScheduleForm({...scheduleForm, interviewerId: e.target.value})} placeholder="VD: Anh Tuấn (Tech Lead)" />
                </div>
              </div>
              <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={interviewingCandidates.length === 0}>Xác nhận Lên lịch</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '450px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Đánh giá Ứng viên</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="flex-col gap-4" style={{ padding: '1.5rem' }}>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)] flex justify-between">
                    <span>Điểm số (Thang điểm 10)</span>
                    <span className="font-bold text-[var(--warning)]">{feedbackForm.score}/10</span>
                  </label>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    className="w-full accent-[var(--warning)]" 
                    value={feedbackForm.score} 
                    onChange={e => setFeedbackForm({...feedbackForm, score: e.target.value})} 
                  />
                </div>
                <div className="flex-col gap-2 mt-4">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Nhận xét chi tiết</label>
                  <textarea 
                    required className="form-input w-full" 
                    style={{ minHeight: '100px' }} 
                    placeholder="Điểm mạnh, điểm yếu, mức độ phù hợp..."
                    value={feedbackForm.comments}
                    onChange={e => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)', color: 'black' }}>Lưu Đánh giá</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
