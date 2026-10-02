import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, X, Search, FileText, UserCheck, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const Offers = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  const [onboardForm, setOnboardForm] = useState({
    employeeCode: '',
    cccd: '',
    baseSalary: '',
    contractType: 'PROBATION',
    joinDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOffers = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/offers')
      .then(res => setCandidates(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenOnboard = (candidate) => {
    setSelectedCandidate(candidate);
    setOnboardForm({
      employeeCode: `NV${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Auto-generate suggestion
      cccd: '',
      baseSalary: '15000000',
      contractType: 'PROBATION',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setShowOnboardModal(true);
  };

  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    if (!onboardForm.employeeCode || !onboardForm.cccd || !onboardForm.baseSalary || !onboardForm.joinDate || !onboardForm.contractType) {
      return toast.error("Vui lòng nhập đầy đủ thông tin.");
    }
    
    setIsSubmitting(true);
    axios.post('http://localhost:5000/api/offers/accept', {
      candidateId: selectedCandidate.id,
      ...onboardForm
    })
    .then(() => {
      toast.success("Tiếp nhận nhân viên thành công!");
      setShowOnboardModal(false);
      fetchOffers(); // Reload list
    })
    .catch(err => {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra khi tạo hồ sơ.");
    })
    .finally(() => setIsSubmitting(false));
  };

  const handleReject = async (candidateId) => {
    const result = await Swal.fire({ title: 'Xác nhận', text: 'Bạn có chắc chắn muốn Từ chối Offer của ứng viên này? Họ sẽ bị chuyển về trạng thái REJECTED.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' });
    if (!result.isConfirmed) return;
    
    axios.post(`http://localhost:5000/api/offers/${candidateId}/reject`)
      .then(() => {
        fetchOffers();
      })
      .catch(err => toast.error("Lỗi khi từ chối Offer"));
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Quản lý Offer & Tiếp nhận
          </h2>
          <p className="text-muted mt-2">Chốt Offer và khởi tạo hồ sơ nhân viên chính thức từ ứng viên đạt yêu cầu.</p>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm ứng viên theo tên, email..." 
            className="form-input w-full bg-white" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
             <div className="p-8 text-center text-muted">Đang tải...</div>
          ) : filteredCandidates.length === 0 ? (
             <div className="p-12 flex-col items-center justify-center text-center border-b border-[var(--border)]">
               <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                 <CheckCircle size={32} color="var(--text-muted)" />
               </div>
               <h3 className="text-xl font-semibold mb-2">Trống</h3>
               <p className="text-muted">Không có ứng viên nào đang ở trạng thái chờ Offer.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white backdrop-blur-md z-10">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-4 text-sm font-semibold text-muted">Ứng viên</th>
                  <th className="p-4 text-sm font-semibold text-muted">Vị trí tuyển dụng</th>
                  <th className="p-4 text-sm font-semibold text-muted">Thông tin liên hệ</th>
                  <th className="p-4 text-sm font-semibold text-muted text-right">Thao tác xử lý</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border)] hover:bg-white transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-[var(--text-heading)] text-[1.1rem]">{c.name}</div>
                      <div className="text-xs text-[var(--success)] flex items-center gap-1 mt-1">
                        <CheckCircle size={12} /> Đã qua phỏng vấn
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-[var(--text-main)]">{c.jobPosting?.title}</div>
                      <div className="text-xs text-muted flex items-center gap-1 mt-1">
                        <Briefcase size={12} /> {c.jobPosting?.department?.name || 'Chưa rõ phòng ban'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{c.email}</div>
                      <div className="text-sm text-muted">{c.phone || '--'}</div>
                      {c.cvUrl && (
                        <a href={c.cvUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] hover:underline mt-1 flex items-center gap-1">
                          <FileText size={12} /> Xem lại CV
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleReject(c.id)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--error)' }}>
                          Từ chối
                        </button>
                        <button onClick={() => handleOpenOnboard(c)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                          <UserCheck size={16} /> Tiếp nhận (Onboard)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboardModal && selectedCandidate && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '600px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)' }}>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">Khởi tạo Hồ sơ Nhân viên</h3>
                <p className="text-sm text-muted">Ứng viên: <strong className="text-[var(--text-heading)]">{selectedCandidate.name}</strong></p>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleOnboardSubmit}>
              <div style={{ padding: '1.5rem' }}>
                <div className="p-4 rounded-lg bg-white border border-[var(--border)] mb-6 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted">
                    Hệ thống sẽ lấy tự động Họ tên, Email, Phòng ban và Vị trí từ thông tin ứng tuyển. Vui lòng cung cấp thêm các thông tin pháp lý bên dưới để hoàn tất việc tạo Hồ sơ nhân viên.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Loại Hợp Đồng *</label>
                    <select 
                      required className="form-input w-full" 
                      value={onboardForm.contractType} 
                      onChange={e => setOnboardForm({...onboardForm, contractType: e.target.value})}
                    >
                      <option value="PROBATION">Thử việc</option>
                      <option value="INTERNSHIP">Thực tập sinh</option>
                      <option value="OFFICIAL_1Y">Chính thức (1 năm)</option>
                      <option value="INDEFINITE">Không xác định thời hạn</option>
                    </select>
                  </div>
                  
                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Mức lương cơ bản (VNĐ) *</label>
                    <input 
                      type="number" required min="0" step="100000"
                      className="form-input w-full" 
                      value={onboardForm.baseSalary} 
                      onChange={e => setOnboardForm({...onboardForm, baseSalary: e.target.value})} 
                    />
                    <div className="text-xs text-[var(--primary)] mt-1 font-medium">Lương Offer: {Number(onboardForm.baseSalary).toLocaleString('vi-VN')} đ</div>
                  </div>

                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Mã Nhân Viên *</label>
                    <input 
                      type="text" required 
                      className="form-input w-full" 
                      value={onboardForm.employeeCode} 
                      onChange={e => setOnboardForm({...onboardForm, employeeCode: e.target.value})} 
                    />
                  </div>
                  
                  <div className="flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Số CCCD / CMND *</label>
                    <input 
                      type="text" required 
                      className="form-input w-full" 
                      value={onboardForm.cccd} 
                      onChange={e => setOnboardForm({...onboardForm, cccd: e.target.value})} 
                      placeholder="Ghi trên thẻ căn cước"
                    />
                  </div>
                  
                  <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                    <label className="text-sm font-medium text-[var(--text-muted)]">Ngày bắt đầu làm việc *</label>
                    <input 
                      type="date" required 
                      className="form-input w-full" style={{ colorScheme: 'dark' }}
                      value={onboardForm.joinDate} 
                      onChange={e => setOnboardForm({...onboardForm, joinDate: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-hover)' }}>
                <button type="button" onClick={() => setShowOnboardModal(false)} className="btn btn-outline" disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Đang tạo hồ sơ...' : 'Lưu & Khởi tạo Nhân viên'}
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
