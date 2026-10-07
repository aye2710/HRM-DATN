import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, Star, Clock, X, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [modalMode, setModalMode] = useState('add');

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

  const handleOpenAdd = () => {
    setModalMode('add');
    setScheduleForm({ candidateId: '', interviewerId: '', roundName: 'Phỏng vấn Kỹ thuật', scheduledAt: '' });
    setShowScheduleModal(true);
  };

  const handleOpenEdit = (inv) => {
    setModalMode('edit');
    setSelectedInterviewId(inv.id);
    setScheduleForm({
      candidateId: inv.candidateId,
      interviewerId: inv.interviewerId,
      roundName: inv.roundName,
      scheduledAt: new Date(inv.scheduledAt).toISOString().slice(0, 16)
    });
    setShowScheduleModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Xác nhận hủy', text: 'Bạn có chắc muốn hủy lịch phỏng vấn này?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hủy lịch', cancelButtonText: 'Không' });
    if (result.isConfirmed) {
      axios.delete(`http://localhost:5000/api/interviews/${id}`)
        .then(() => { toast.success("Đã hủy lịch phỏng vấn"); fetchData(); })
        .catch(err => toast.error("Lỗi khi hủy lịch"));
    }
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleForm.candidateId || !scheduleForm.interviewerId || !scheduleForm.scheduledAt) {
      return toast.error("Vui lòng điền đầy đủ thông tin");
    }

    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/interviews', scheduleForm)
        .then(() => {
          toast.success("Đã lên lịch thành công!");
          fetchData();
          setShowScheduleModal(false);
        })
        .catch(err => toast.error("Lỗi khi xếp lịch"));
    } else {
      axios.put(`http://localhost:5000/api/interviews/${selectedInterviewId}`, scheduleForm)
        .then(() => {
          toast.success("Đã cập nhật lịch!");
          fetchData();
          setShowScheduleModal(false);
        })
        .catch(err => toast.error("Lỗi khi cập nhật lịch"));
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/interviews/${selectedInterviewId}/feedback`, feedbackForm)
      .then(() => {
        setShowFeedbackModal(false);
        setFeedbackForm({ score: 5, comments: '' });
        
        // SweetAlert2 asking to change status
        Swal.fire({
          title: 'Đã lưu đánh giá!',
          text: 'Bạn có muốn quyết định ngay kết quả của ứng viên này không?',
          icon: 'success',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Chốt Offer',
          denyButtonText: 'Từ chối',
          cancelButtonText: 'Để sau',
          confirmButtonColor: 'var(--success)',
          denyButtonColor: 'var(--error)'
        }).then((result) => {
          if (result.isConfirmed) {
            updateCandidateStatus(selectedInterviewId, 'OFFERING');
          } else if (result.isDenied) {
            updateCandidateStatus(selectedInterviewId, 'REJECTED');
          } else {
            fetchData();
          }
        });
      })
      .catch(err => toast.error("Lỗi khi lưu đánh giá"));
  };

  const updateCandidateStatus = (interviewId, status) => {
    const inv = interviews.find(i => i.id === interviewId);
    if (inv) {
      axios.put(`http://localhost:5000/api/candidates/${inv.candidateId}`, { status })
        .then(() => {
          toast.success(`Đã chuyển ứng viên sang trạng thái ${status === 'OFFERING' ? 'Chốt Offer' : 'Từ chối'}!`);
          fetchData();
        })
        .catch(() => toast.error("Lỗi khi chuyển trạng thái"));
    }
  };

  const interviewingCandidates = candidates.filter(c => c.status === 'INTERVIEWING');

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">
            Lịch Phỏng Vấn
          </h1>
          <p className="text-muted mt-2">Quản lý lịch hẹn và đánh giá ứng viên sau phỏng vấn.</p>
        </div>
        <div>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            <Calendar size={18} /> Lên lịch mới
          </button>
        </div>
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
             <div className="p-8 text-center text-muted">Đang tải...</div>
          ) : interviews.length === 0 ? (
             <div className="p-8 text-center text-muted border-b border-[var(--border)]">Chưa có lịch phỏng vấn nào.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white backdrop-blur-md z-10">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-4 text-sm font-semibold text-muted">Ngày & Giờ</th>
                  <th className="p-4 text-sm font-semibold text-muted">Ứng viên</th>
                  <th className="p-4 text-sm font-semibold text-muted">Vòng / Vị trí</th>
                  <th className="p-4 text-sm font-semibold text-muted">Người phỏng vấn</th>
                  <th className="p-4 text-sm font-semibold text-muted text-right">Đánh giá</th>
                  <th className="p-4 text-sm font-semibold text-muted text-center w-24">Thao tác</th>
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
                    <tr key={inv.id} className="border-b border-[var(--border)] hover:bg-white transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-[var(--primary)] flex items-center gap-2">
                          <Clock size={16} /> {formattedTime}
                        </div>
                        <div className="text-sm text-muted mt-1">{formattedDate}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[var(--text-heading)]">{inv.candidate?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted">{inv.candidate?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[var(--text-main)]">{inv.roundName}</div>
                        <div className="text-xs text-muted">{inv.candidate?.jobPosting?.title}</div>
                      </td>
                      <td className="p-4 text-sm">{inv.interviewerId}</td>
                      <td className="p-4 text-right">
                        {hasFeedback ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[var(--success)] flex items-center gap-1 font-semibold text-sm" title={inv.feedbacks[0].comments}>
                              <CheckCircle size={14} /> Đã đánh giá ({inv.feedbacks[0].score}/10)
                            </span>
                            {inv.candidate?.status === 'INTERVIEWING' && (
                              <button 
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Phê duyệt kết quả',
                                    text: 'Chuyển ứng viên này sang giai đoạn tiếp theo:',
                                    icon: 'question',
                                    showCancelButton: true,
                                    showDenyButton: true,
                                    confirmButtonText: 'Chốt Offer',
                                    denyButtonText: 'Từ chối (Loại)',
                                    cancelButtonText: 'Để sau',
                                    confirmButtonColor: 'var(--success)',
                                    denyButtonColor: 'var(--error)'
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      updateCandidateStatus(inv.id, 'OFFERING');
                                    } else if (result.isDenied) {
                                      updateCandidateStatus(inv.id, 'REJECTED');
                                    }
                                  });
                                }}
                                className="text-xs font-semibold rounded-md transition-all hover:scale-105 active:scale-95"
                                style={{ 
                                  padding: '0.35rem 0.8rem', 
                                  backgroundColor: 'rgba(105,108,255,0.1)', 
                                  color: 'var(--primary)',
                                  border: '1px solid rgba(105,108,255,0.3)',
                                  boxShadow: '0 2px 4px rgba(105,108,255,0.05)'
                                }}
                              >
                                Phê duyệt kết quả
                              </button>
                            )}
                            {inv.candidate?.status === 'OFFERING' && (
                              <span className="badge badge-success text-[0.7rem] font-medium" style={{ padding: '0.2rem 0.6rem' }}>Đang chốt Offer</span>
                            )}
                            {inv.candidate?.status === 'REJECTED' && (
                              <span className="badge badge-error text-[0.7rem] font-medium" style={{ padding: '0.2rem 0.6rem' }}>Đã từ chối</span>
                            )}
                            {inv.candidate?.status === 'HIRED' && (
                              <span className="badge badge-primary text-[0.7rem] font-medium" style={{ padding: '0.2rem 0.6rem' }}>Đã nhận việc</span>
                            )}
                          </div>
                        ) : isPast ? (
                           <button onClick={() => { setSelectedInterviewId(inv.id); setShowFeedbackModal(true); }} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                             <Star size={14} /> Chấm điểm
                           </button>
                        ) : (
                          <span className="text-muted text-sm italic opacity-50">Chưa diễn ra</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!hasFeedback && (
                            <button onClick={() => handleOpenEdit(inv)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Sửa lịch">
                              <Edit2 size={16} color="var(--text-muted)" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(inv.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Hủy lịch">
                            <Trash2 size={16} color="var(--error)" />
                          </button>
                        </div>
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
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Lên lịch Phỏng vấn</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="flex-col gap-4" style={{ padding: '1.5rem' }}>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Ứng viên (Đang chờ phỏng vấn)</label>
                  <select required disabled={modalMode === 'edit'} className="form-input w-full bg-white disabled:opacity-50" value={scheduleForm.candidateId} onChange={e => setScheduleForm({...scheduleForm, candidateId: e.target.value})}>
                    <option value="" className="text-black">-- Chọn ứng viên --</option>
                    {modalMode === 'edit' ? (
                      <option value={scheduleForm.candidateId} className="text-black">Đang sửa lịch cho ứng viên hiện tại</option>
                    ) : (
                      interviewingCandidates.map(c => (
                        <option key={c.id} value={c.id} className="text-black">{c.name} - {c.jobPosting?.title}</option>
                      ))
                    )}
                  </select>
                  {interviewingCandidates.length === 0 && <p className="text-xs text-[var(--warning)] mt-1">Không có ứng viên nào đang ở trạng thái PHỎNG VẤN.</p>}
                </div>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Tên vòng phỏng vấn</label>
                  <input required type="text" className="form-input w-full" value={scheduleForm.roundName} onChange={e => setScheduleForm({...scheduleForm, roundName: e.target.value})} placeholder="VD: Phỏng vấn chuyên môn" />
                </div>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Ngày & Giờ (Dự kiến)</label>
                  <input required type="datetime-local" className="form-input w-full" value={scheduleForm.scheduledAt} onChange={e => setScheduleForm({...scheduleForm, scheduledAt: e.target.value})} />
                </div>
                <div className="flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Người phỏng vấn (Tên)</label>
                  <input required type="text" className="form-input w-full" value={scheduleForm.interviewerId} onChange={e => setScheduleForm({...scheduleForm, interviewerId: e.target.value})} placeholder="VD: Anh Tuấn (Tech Lead)" />
                </div>
              </div>
              <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-hover)' }}>
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
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '450px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Đánh giá Ứng viên</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><X size={20} /></button>
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
              <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-hover)' }}>
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
