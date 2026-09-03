import React, { useState, useEffect } from 'react';
import { CheckSquare, UserPlus, Laptop, Mail, FileSignature, ChevronRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';

const checklistItems = [
  { category: 'EQUIPMENT', icon: <Laptop size={18}/>, title: 'Thiết bị & Chỗ ngồi', items: ['Cấp phát Laptop/PC', 'Cấp màn hình rời', 'Chuẩn bị chỗ ngồi, VPP'] },
  { category: 'ACCOUNT', icon: <Mail size={18}/>, title: 'Tài khoản hệ thống', items: ['Tạo Email công ty', 'Tài khoản Slack / Teams', 'Tài khoản phần mềm HRM'] },
  { category: 'CONTRACT', icon: <FileSignature size={18}/>, title: 'Thủ tục Pháp lý', items: ['Thu hồ sơ bản cứng (CCCD, Bằng cấp)', 'In hợp đồng thử việc', 'Ký hợp đồng & Đóng dấu'] }
];

export const OnboardingMgmt = () => {
  const [newbies, setNewbies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNewbies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/onboarding/newbies');
      setNewbies(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewbies();
  }, []);

  const handleOpenPanel = (emp) => {
    setSelectedEmp(emp);
    setTasks(emp.onboardingTasks || []);
  };

  const handleClosePanel = () => {
    setSelectedEmp(null);
  };

  const toggleTask = async (taskName, category, currentStatus) => {
    try {
      const res = await axios.post('http://localhost:5000/api/onboarding/task/toggle', {
        employeeId: selectedEmp.id,
        taskName,
        category,
        isCompleted: !currentStatus
      });
      
      // Update local state
      const updatedTasks = [...tasks];
      const existingIdx = updatedTasks.findIndex(t => t.taskName === taskName && t.category === category);
      if (existingIdx >= 0) {
        updatedTasks[existingIdx] = res.data;
      } else {
        updatedTasks.push(res.data);
      }
      setTasks(updatedTasks);
      
      // Update newbies state for progress bar accuracy
      setNewbies(prev => prev.map(n => 
        n.id === selectedEmp.id ? { ...n, onboardingTasks: updatedTasks } : n
      ));

    } catch (error) {
      alert("Lỗi cập nhật tiến độ");
    }
  };

  const checkTaskStatus = (taskName, category) => {
    const t = tasks.find(x => x.taskName === taskName && x.category === category);
    return t ? t.isCompleted : false;
  };

  const totalTasks = checklistItems.reduce((acc, curr) => acc + curr.items.length, 0);
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100) || 0;

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const handleCompleteOnboarding = () => {
    if (progressPercent < 100) {
      return alert("Vui lòng hoàn thành tất cả các thủ tục trước khi chốt Hội nhập.");
    }
    setShowConfirmPopup(true);
  };

  const executeCompleteOnboarding = async () => {
    setShowConfirmPopup(false);
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/onboarding/complete', {
        employeeId: selectedEmp.id
      });
      const nextStatusStr = selectedEmp.position?.level?.toLowerCase() === 'intern' ? 'THỰC TẬP' : 'THỬ VIỆC';
      setSuccessMessage(`Đã chuyển nhân viên ${selectedEmp.fullName} sang trạng thái ${nextStatusStr} thành công!`);
      setShowSuccessPopup(true);
      handleClosePanel();
      fetchNewbies();
    } catch (error) {
      alert("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Trung tâm Hội nhập
          </h2>
          <p className="text-muted mt-2">Theo dõi và hoàn thiện các thủ tục Onboarding cho nhân sự mới.</p>
        </div>
      </div>

      <div className="card glass flex-1 p-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center text-muted py-8">Đang tải danh sách...</div>
        ) : newbies.length === 0 ? (
          <div className="flex-col items-center justify-center text-center py-12">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={32} color="var(--text-muted)" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Trống</h3>
            <p className="text-muted">Không có nhân viên nào đang trong quá trình Hội nhập.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newbies.map(emp => {
              const empTasks = emp.onboardingTasks || [];
              const empCompleted = empTasks.filter(t => t.isCompleted).length;
              const empProgress = Math.round((empCompleted / totalTasks) * 100) || 0;

              return (
                <div key={emp.id} onClick={() => handleOpenPanel(emp)} 
                     className="card bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg text-white mb-1">{emp.fullName}</div>
                      <div className="text-xs text-muted flex items-center gap-2">
                        <span>{emp.code}</span>
                        <span>•</span>
                        <span>{emp.position?.title || 'Chưa rõ'}</span>
                      </div>
                    </div>
                    <div className="avatar" style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {emp.fullName.charAt(0)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted">
                    <UserPlus size={14} /> Ngày nhận việc: <span className="text-[var(--text-main)]">{new Date(emp.joinDate).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted">Tiến độ Onboarding</span>
                      <span className={empProgress === 100 ? "text-[var(--success)] font-bold" : "text-white"}>{empProgress}%</span>
                    </div>
                    <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-2">
                      <div className="bg-[var(--primary)] h-2 rounded-full transition-all duration-500" style={{ width: `${empProgress}%`, backgroundColor: empProgress === 100 ? 'var(--success)' : 'var(--primary)' }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Centered Modal for Onboarding Details */}
      {selectedEmp && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} onClick={handleClosePanel}>
          <div className="animate-fade-in" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', backgroundColor: '#0f172a', borderRadius: '1rem', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>Checklist Hội nhập</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nhân viên: <strong style={{ color: 'var(--primary)' }}>{selectedEmp.fullName}</strong></p>
              </div>
              <button onClick={handleClosePanel} style={{ padding: '0.5rem', borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}><X size={20}/></button>
            </div>

            {/* Progress Bar Header */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Tổng tiến độ hoàn thành</span>
                <span style={{ fontWeight: 'bold', color: progressPercent === 100 ? 'var(--success)' : 'white' }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '0.625rem' }}>
                <div style={{ height: '0.625rem', borderRadius: '9999px', transition: 'all 0.5s', backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--primary)', width: `${progressPercent}%`, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
              </div>
            </div>

            {/* Checklist Content */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {checklistItems.map((group, gIdx) => (
                <div key={gIdx} style={{ flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--primary)' }}>
                      {group.icon}
                    </div>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                      {group.title}
                    </h4>
                  </div>
                  <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {group.items.map((task, tIdx) => {
                      const isDone = checkTaskStatus(task, group.category);
                      return (
                        <div key={tIdx} 
                             onClick={() => toggleTask(task, group.category, isDone)}
                             style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: isDone ? 'rgba(255,255,255,0.05)' : 'transparent', width: '100%' }}
                             onMouseOver={e => !isDone && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                             onMouseOut={e => !isDone && (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', border: isDone ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? 'var(--success)' : 'transparent' }}>
                            {isDone && <CheckSquare size={14} color="white" />}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: isDone ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {task}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Action */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.9)', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
              <button 
                onClick={handleCompleteOnboarding}
                disabled={progressPercent < 100 || isSubmitting}
                className="btn"
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  backgroundColor: progressPercent === 100 ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                  color: progressPercent === 100 ? 'white' : 'var(--text-muted)',
                  cursor: progressPercent === 100 ? 'pointer' : 'not-allowed',
                  boxShadow: progressPercent === 100 ? '0 0 15px rgba(16,185,129,0.4)' : 'none',
                  border: 'none',
                  transition: 'all 0.3s'
                }}>
                {isSubmitting ? 'Đang xử lý...' : (
                  <>
                    <CheckCircle2 size={20} />
                    CHỐT HOÀN TẤT HỘI NHẬP
                  </>
                )}
              </button>
              {progressPercent < 100 && (
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  * Vui lòng hoàn thành tất cả ({totalTasks}) hạng mục để kích hoạt nút này.
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Popup */}
      {showConfirmPopup && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="animate-fade-in" style={{ width: '90%', maxWidth: '400px', backgroundColor: '#0f172a', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <AlertCircle size={32} color="var(--warning, #f59e0b)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>Xác nhận Hoàn tất</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn chốt hội nhập cho nhân viên <strong style={{ color: 'white' }}>{selectedEmp.fullName}</strong> và chuyển sang trạng thái <strong>{selectedEmp.position?.level?.toLowerCase() === 'intern' ? 'THỰC TẬP' : 'THỬ VIỆC'}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button 
                onClick={() => setShowConfirmPopup(false)}
                className="btn"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                Hủy
              </button>
              <button 
                onClick={executeCompleteOnboarding}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Popup */}
      {showSuccessPopup && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="animate-fade-in" style={{ width: '90%', maxWidth: '400px', backgroundColor: '#0f172a', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={32} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Hoàn tất Hội nhập!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{successMessage}</p>
            <button 
              onClick={() => setShowSuccessPopup(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
              ĐÓNG
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
