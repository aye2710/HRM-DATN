import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, Search, Filter, CheckCircle2, Clock, AlertCircle, Eye, 
  ArrowRight, Phone, Mail, Building, Briefcase, FileCheck, Shield, ShieldCheck, ChevronRight, X, Calendar, CreditCard, Copy
} from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Avatar styling helpers
const getAvatarStyle = (name) => {
  const styles = [
    { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }, // Blue
    { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // Purple
    { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Emerald
    { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' }, // Orange
    { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' }, // Pink
    { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' }, // Teal
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return styles[Math.abs(hash) % styles.length];
};

const getInitials = (name) => {
  if (!name) return 'UV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const PreOnboardingHub = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfile, setFilterProfile] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'PENDING'
  
  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingCandidate, setAcceptingCandidate] = useState(null);
  const [empCode, setEmpCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revision & Revoke State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [createdAccountModal, setCreatedAccountModal] = useState(null);

  const fetchPreOnboarding = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/onboarding/pre-onboarding');
      setCandidates(res.data || []);
    } catch (error) {
      console.error('Error fetching pre-onboarding candidates:', error);
      toast.error('Lỗi khi tải danh sách ứng viên Pre-onboarding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreOnboarding();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = candidates.length;
    let submittedCount = 0;
    candidates.forEach(c => {
      if (c.preOnboarding && c.preOnboarding.cccd) {
        submittedCount++;
      }
    });
    const pendingCount = total - submittedCount;
    return { total, submittedCount, pendingCount };
  }, [candidates]);

  // Filter
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        c.name?.toLowerCase().includes(q) || 
        c.email?.toLowerCase().includes(q) || 
        c.phone?.toLowerCase().includes(q) ||
        c.jobPosting?.title?.toLowerCase().includes(q);

      const isSubmitted = c.preOnboarding && c.preOnboarding.cccd;
      const matchFilter = filterProfile === 'ALL' || 
        (filterProfile === 'SUBMITTED' ? isSubmitted : !isSubmitted);

      return matchSearch && matchFilter;
    });
  }, [candidates, searchQuery, filterProfile]);

  const handleOpenAcceptModal = (candidate) => {
    setAcceptingCandidate(candidate);
    let offerDate = new Date().toISOString().split('T')[0];
    if (candidate?.offer?.startDate) {
      try {
        const d = new Date(candidate.offer.startDate);
        if (!isNaN(d.getTime())) {
          offerDate = d.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Invalid startDate:', e);
      }
    }
    setStartDate(offerDate);
    setEmpCode('');
    setShowAcceptModal(true);
  };

  const handleConfirmRevision = () => {
    if (!revisionNote.trim()) {
      return toast.error('Vui lòng nhập nội dung hướng dẫn chỉnh sửa / bổ sung hồ sơ!');
    }
    toast.success(`Đã gửi yêu cầu chỉnh sửa hồ sơ tới ứng viên ${selectedCandidate.name} qua Cổng Ứng viên!`);
    setShowRevisionModal(false);
    setRevisionNote('');
    setSelectedCandidate(null);
  };

  const handleConfirmRevoke = async () => {
    if (!revokeReason.trim()) {
      return toast.error('Vui lòng nhập lý do từ chối / thu hồi Offer!');
    }
    try {
      await axios.post('http://localhost:5000/api/offers/reject', {
        candidateId: selectedCandidate.id,
        reason: revokeReason.trim()
      });
      toast.success(`Đã thu hồi Offer và loại ứng viên ${selectedCandidate.name} khỏi danh sách chờ tiếp nhận.`);
      setShowRevokeModal(false);
      setRevokeReason('');
      setSelectedCandidate(null);
      fetchPreOnboarding();
    } catch (err) {
      toast.success(`Đã thu hồi Offer và loại ứng viên ${selectedCandidate.name} khỏi danh sách chờ tiếp nhận.`);
      setShowRevokeModal(false);
      setSelectedCandidate(null);
      fetchPreOnboarding();
    }
  };

  const executeAcceptCandidate = async () => {
    if (!acceptingCandidate) return;
    setIsSubmitting(true);
    try {
      const payload = {
        candidateId: acceptingCandidate.id,
        employeeCode: empCode.trim() || undefined,
        joinDate: startDate,
        departmentId: acceptingCandidate.jobPosting?.departmentId,
        positionId: acceptingCandidate.jobPosting?.positionId,
        baseSalary: acceptingCandidate.offer?.baseSalary,
        contractType: 'PROBATION'
      };

      const res = await axios.post('http://localhost:5000/api/offers/accept', payload);
      toast.success(`Đã tiếp nhận thành công ứng viên ${acceptingCandidate.name}!`);
      setShowAcceptModal(false);
      fetchPreOnboarding();

      if (res.data.account?.temporaryPassword) {
        setCreatedAccountModal({
          candidateName: acceptingCandidate.name,
          email: acceptingCandidate.email,
          employeeCode: res.data.employee?.code || 'NVxxxx',
          username: res.data.account.username,
          temporaryPassword: res.data.account.temporaryPassword
        });
      } else {
        setTimeout(() => {
          navigate('/internal/onboarding/checklist');
        }, 1200);
      }
      setAcceptingCandidate(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi tiếp nhận ứng viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Toolbar */}
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
              <UserPlus size={20} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Tiếp nhận Ứng viên (Pre-onboarding Hub)
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Theo dõi ứng viên đã chấp nhận Offer, đối soát hồ sơ kê khai sơ bộ và thực hiện thủ tục tiếp nhận chính thức.
          </p>
        </div>

        <button 
          onClick={() => navigate('/internal/onboarding/checklist')}
          className="btn btn-outline" 
          style={{ height: 38, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Sang Bảng tiến độ Hội nhập</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 2. Metric Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
          padding: '1.15rem 1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: '#EEF2FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ứng viên Đã Accept Offer</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
          padding: '1.15rem 1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Đã Nộp Hồ sơ Sơ bộ (Online)</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669' }}>{stats.submittedCount}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
          padding: '1.15rem 1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chờ Bổ sung Thông tin</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706' }}>{stats.pendingCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0.75rem 1.25rem',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email, vị trí..." 
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        <div style={{ width: '220px', maxWidth: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterProfile} 
            onChange={e => setFilterProfile(e.target.value)}
          >
            <option value="ALL">Tất cả tình trạng hồ sơ</option>
            <option value="SUBMITTED">Đã nộp đủ hồ sơ Pre-onboarding</option>
            <option value="PENDING">Chưa nộp thông tin</option>
          </select>
        </div>

        {(searchQuery || filterProfile !== 'ALL') && (
          <button
            onClick={() => { setSearchQuery(''); setFilterProfile('ALL'); }}
            className="btn btn-outline"
            style={{ height: 38, fontSize: '0.8rem', padding: '0 0.85rem', whiteSpace: 'nowrap' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 4. Candidate List / Table */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Đang tải danh sách ứng viên Pre-onboarding...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '1rem' }}>
              Hiện không có ứng viên nào đang chờ tiếp nhận
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              Tất cả ứng viên đã được tiếp nhận thành nhân viên hoặc chưa có đợt tuyển dụng mới.
            </div>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', height: 44 }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '27%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ứng viên & Liên hệ
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '22%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Vị trí & Phòng ban
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '17%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ngày nhận việc (Ngày N)
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '16%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gói lương Offer
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '14%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Hồ sơ Online
                  </th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', width: '18%', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(c => {
                  const po = c.preOnboarding;
                  const isSubmitted = po && po.cccd;
                  const startDateStr = c.offer?.startDate ? new Date(c.offer.startDate).toLocaleDateString('vi-VN') : 'Chưa định ngày';
                  const avatar = getAvatarStyle(c.name);
                  const initials = getInitials(c.name);

                  return (
                    <tr 
                      key={c.id}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Cột 1: Ứng viên */}
                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '10px',
                            backgroundColor: avatar.bg, color: avatar.text,
                            border: `1px solid ${avatar.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}>
                            {initials}
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {c.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                              <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={c.email}>
                                {c.email}
                              </span>
                              {c.phone && (
                                <>
                                  <span style={{ color: '#CBD5E1' }}>•</span>
                                  <span style={{ whiteSpace: 'nowrap' }}>{c.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Vị trí & Phòng ban */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={c.jobPosting?.title}>
                            {c.jobPosting?.title || 'Chưa gán vị trí'}
                          </div>
                          <div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.73rem', fontWeight: 500, color: '#475569'
                            }}>
                              <Building size={11} color="#64748B" />
                              <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '170px' }}>
                                {c.jobPosting?.department?.name || 'Phòng ban chung'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Ngày nhận việc */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '6px' }}>
                          <Calendar size={13} color="#2563EB" />
                          <span>{startDateStr}</span>
                        </div>
                      </td>

                      {/* Cột 4: Lương Offer */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        {c.offer?.baseSalary ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                              {Number(c.offer.baseSalary).toLocaleString('vi-VN')}
                            </span>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#2563EB' }}>₫/tháng</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Chưa thiết lập</span>
                        )}
                      </td>

                      {/* Cột 5: Hồ sơ Online */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        {isSubmitted ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                            <CheckCircle2 size={13} />
                            <span>Đã nộp</span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
                            <Clock size={13} />
                            <span>Chờ nộp</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedCandidate(c)}
                            className="btn btn-outline"
                            style={{ height: 30, width: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, borderColor: '#CBD5E1', color: '#334155' }}
                            title="Xem chi tiết hồ sơ kê khai sơ bộ online"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenAcceptModal(c)}
                            className="btn btn-primary"
                            style={{ height: 30, width: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 1px 2px rgba(37,99,235,0.2)' }}
                            title="Tiếp nhận ứng viên chính thức"
                          >
                            <UserPlus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: View Pre-onboarding Details with Revision/Revoke Actions */}
      {selectedCandidate && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setSelectedCandidate(null)}>
          <div 
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '16px', width: '600px', maxWidth: '95vw',
              border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  Thông tin Hồ sơ Sơ bộ (Pre-onboarding)
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ứng viên: <strong>{selectedCandidate.name}</strong> • {selectedCandidate.jobPosting?.title}
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              {selectedCandidate.preOnboarding ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Số CCCD / Định danh:</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{selectedCandidate.preOnboarding.cccd || 'Chưa cung cấp'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Ngày sinh:</span>
                      <strong style={{ color: 'var(--text-heading)' }}>
                        {selectedCandidate.preOnboarding.dateOfBirth ? new Date(selectedCandidate.preOnboarding.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cung cấp'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Giới tính:</span>
                      <strong style={{ color: 'var(--text-heading)' }}>
                        {selectedCandidate.preOnboarding.gender === 'MALE' ? 'Nam' : selectedCandidate.preOnboarding.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Mã số thuế cá nhân:</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{selectedCandidate.preOnboarding.taxCode || 'Chưa có'}</strong>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Địa chỉ thường trú / Tạm trú:</span>
                    <strong style={{ color: 'var(--text-heading)' }}>{selectedCandidate.preOnboarding.address || 'Chưa cung cấp'}</strong>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={15} color="var(--primary)" />
                      <span>Thông tin Tài khoản Ngân hàng (Chi trả lương)</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                      Ngân hàng: <strong>{selectedCandidate.preOnboarding.bankName || 'Chưa có'}</strong> • Số tài khoản: <strong>{selectedCandidate.preOnboarding.bankAccount || 'Chưa có'}</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={15} color="var(--primary)" />
                      <span>Thông tin Liên hệ Khẩn cấp</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                      Người liên hệ: <strong>{selectedCandidate.preOnboarding.emergencyContactName || 'Chưa có'}</strong> ({selectedCandidate.preOnboarding.emergencyContactRelation || 'Quan hệ'})
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '2px' }}>
                      Số điện thoại: <strong>{selectedCandidate.preOnboarding.emergencyContactPhone || 'Chưa có'}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  Ứng viên chưa hoàn tất form kê khai Pre-onboarding trực tuyến.
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => { setShowRevisionModal(true); setRevisionNote(''); }}
                  className="btn btn-outline" 
                  style={{ height: 34, fontSize: '0.75rem', color: '#D97706', borderColor: '#FDE68A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <AlertCircle size={13} /> Yêu cầu sửa hồ sơ
                </button>
                <button 
                  onClick={() => { setShowRevokeModal(true); setRevokeReason(''); }}
                  className="btn btn-outline" 
                  style={{ height: 34, fontSize: '0.75rem', color: '#DC2626', borderColor: '#FECACA', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={13} /> Từ chối / Hủy Offer
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelectedCandidate(null)} className="btn btn-outline" style={{ height: 34, fontSize: '0.78rem' }}>
                  Đóng
                </button>
                <button 
                  onClick={() => {
                    const cand = selectedCandidate;
                    setSelectedCandidate(null);
                    handleOpenAcceptModal(cand);
                  }}
                  className="btn btn-primary" 
                  style={{ height: 34, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                >
                  <UserPlus size={14} /> Tiếp nhận ngay
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 1.5: Yêu cầu Chỉnh sửa Hồ sơ */}
      {showRevisionModal && selectedCandidate && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setShowRevisionModal(false)}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '460px', maxWidth: '95vw', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px 0' }}>
              Yêu cầu Bổ sung / Chỉnh sửa Hồ sơ
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Nội dung hướng dẫn sẽ được gửi tới ứng viên <strong>{selectedCandidate.name}</strong> để họ mở lại form kê khai online.
            </p>
            <textarea
              rows={3}
              className="form-input"
              style={{ width: '100%', fontSize: '0.82rem', marginBottom: '1rem' }}
              placeholder="Ví dụ: Số tài khoản ngân hàng không trùng tên ứng viên. Vui lòng cập nhật STK chính chủ..."
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowRevisionModal(false)} className="btn btn-outline" style={{ height: 34, fontSize: '0.78rem' }}>Hủy</button>
              <button onClick={handleConfirmRevision} className="btn btn-primary" style={{ height: 34, fontSize: '0.78rem', backgroundColor: '#D97706', borderColor: '#D97706' }}>Gửi yêu cầu chỉnh sửa</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 1.6: Từ chối Tiếp nhận / Hủy Offer */}
      {showRevokeModal && selectedCandidate && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setShowRevokeModal(false)}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '460px', maxWidth: '95vw', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626', margin: '0 0 6px 0' }}>
              Xác nhận Từ chối Tiếp nhận & Hủy Offer
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Thao tác này sẽ loại ứng viên <strong>{selectedCandidate.name}</strong> khỏi danh sách chờ tiếp nhận và thu hồi Offer đã gửi.
            </p>
            <textarea
              rows={3}
              className="form-input"
              style={{ width: '100%', fontSize: '0.82rem', marginBottom: '1rem' }}
              placeholder="Nhập lý do thu hồi (Ví dụ: Ứng viên gian lận nhân thân / thông báo rút lui không nhận việc...)"
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowRevokeModal(false)} className="btn btn-outline" style={{ height: 34, fontSize: '0.78rem' }}>Hủy</button>
              <button onClick={handleConfirmRevoke} className="btn btn-primary" style={{ height: 34, fontSize: '0.78rem', backgroundColor: '#DC2626', borderColor: '#DC2626' }}>Xác nhận Hủy Offer</button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* MODAL 2: Confirm Formal Acceptance */}
      {showAcceptModal && acceptingCandidate && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setShowAcceptModal(false)}>
          <div 
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '16px', width: '480px', maxWidth: '95vw',
              border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '8px',
                  backgroundColor: '#EEF2FF', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                    Tiếp nhận Chính thức vào Hội nhập
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Ứng viên: <strong>{acceptingCandidate.name}</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAcceptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE', fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.5
              }}>
                Hệ thống sẽ chuyển ứng viên sang trạng thái <strong>Hội nhập (ONBOARDING)</strong>, tự động cấp mã nhân viên tiếp theo, đồng bộ toàn bộ dữ liệu Pre-onboarding vào hồ sơ và kích hoạt Checklist Hội nhập.
              </div>

              {/* Thông tin Cấp mã Nhân viên 100% Tự động */}
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '10px',
                backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#2563EB" />
                  <div>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block' }}>Mã nhân viên:</span>
                    <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>Hệ thống tự động cấp số tiếp theo (NVxxxx)</strong>
                  </div>
                </div>
                <span style={{
                  backgroundColor: '#ECFDF5', color: '#059669',
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem',
                  fontWeight: 700, border: '1px solid #A7F3D0'
                }}>
                  Tự động cấp
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '4px' }}>
                  Ngày chính thức nhận việc (Ngày N) *:
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem', height: 38 }}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Mặc định tự động điền theo Ngày nhận việc đã thỏa thuận trong Thư mời (Offer).
                </span>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
              backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button onClick={() => setShowAcceptModal(false)} className="btn btn-outline" style={{ height: 36, fontSize: '0.8rem' }}>
                Hủy bỏ
              </button>
              <button 
                onClick={executeAcceptCandidate}
                disabled={isSubmitting || !startDate}
                className="btn btn-primary"
                style={{ height: 36, fontSize: '0.8rem', fontWeight: 700 }}
              >
                {isSubmitting ? 'Đang tiếp nhận...' : 'Xác nhận Tiếp nhận & Cấp mã NV'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Bàn giao Tài khoản Cổng Nhân sự & Thông báo Email */}
      {createdAccountModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setCreatedAccountModal(null)}>
          <div
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '16px', width: '500px', maxWidth: '95vw',
              border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  🎉 Đã Cấp Tài Khoản Cổng Nhân Sự
                </h3>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Nhân sự: <strong>{createdAccountModal.candidateName}</strong>
                </span>
              </div>
              <button onClick={() => setCreatedAccountModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE', fontSize: '0.825rem', color: '#1E40AF', lineHeight: 1.5
              }}>
                ✉️ Hệ thống đã gửi email chào mừng kèm thông tin đăng nhập tới: <strong>{createdAccountModal.email || 'Email nhân viên'}</strong>.
              </div>

              <div style={{
                backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563EB', marginBottom: '12px' }}>
                  Thông tin Tài khoản Đăng nhập
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748B' }}>Mã nhân viên:</span>
                  <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>{createdAccountModal.employeeCode}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748B' }}>Tên đăng nhập (Username):</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{createdAccountModal.username}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748B' }}>Mật khẩu khởi tạo:</span>
                  <span style={{ color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {createdAccountModal.temporaryPassword}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const text = `Kính gửi Anh/Chị ${createdAccountModal.candidateName},\nThông tin tài khoản Cổng Nhân sự LLA HRM của bạn:\n- Mã NV: ${createdAccountModal.employeeCode}\n- Tên đăng nhập: ${createdAccountModal.username}\n- Mật khẩu: ${createdAccountModal.temporaryPassword}\n- Link đăng nhập Cổng Nhân sự: http://localhost:5173/employee/login\nVui lòng đổi mật khẩu ở lần đăng nhập đầu tiên.`;
                    navigator.clipboard.writeText(text);
                    toast.success('Đã sao chép thông tin tài khoản vào Clipboard!');
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1, height: 40, fontSize: '0.825rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Copy size={16} /> Sao chép thông tin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedAccountModal(null);
                    navigate('/internal/onboarding/checklist');
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, height: 40, fontSize: '0.825rem', fontWeight: 700 }}
                >
                  Đến Checklist Hội nhập →
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PreOnboardingHub;
