import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, UserPlus, Laptop, Mail, FileSignature, ChevronRight, 
  X, CheckCircle2, AlertCircle, Search, Filter, Sparkles, UserCheck, 
  Clock, Shield, ArrowRight, Download, Award
} from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const checklistItems = [
  { 
    category: 'EQUIPMENT', 
    icon: <Laptop size={18} color="var(--primary)"/>, 
    title: 'Thiết bị & Chỗ ngồi làm việc', 
    items: ['Cấp phát Laptop/PC theo định mức', 'Cấp màn hình phụ & phụ kiện', 'Bố trí chỗ ngồi và văn phòng phẩm'] 
  },
  { 
    category: 'ACCOUNT', 
    icon: <Mail size={18} color="#0284c7"/>, 
    title: 'Tài khoản & Phân quyền hệ thống', 
    items: ['Khởi tạo Email doanh nghiệp', 'Tạo tài khoản trao đổi nội bộ (Slack/Teams)', 'Cấp tài khoản phần mềm HRM & phân quyền'] 
  },
  { 
    category: 'CONTRACT', 
    icon: <FileSignature size={18} color="#10b981"/>, 
    title: 'Thủ tục Pháp lý & Hồ sơ nhân sự', 
    items: ['Thu nộp hồ sơ bản cứng (CCCD, Bằng cấp)', 'Soạn và in hợp đồng lao động', 'Ký kết hợp đồng & Đóng dấu lưu trữ'] 
  }
];

export const OnboardingMgmt = () => {
  const [newbies, setNewbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgress, setFilterProgress] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'COMPLETED'
  
  // Modal state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const fetchNewbies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/onboarding/newbies');
      setNewbies(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách hội nhập");
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
      toast.error("Lỗi cập nhật tiến độ công việc");
    }
  };

  const checkTaskStatus = (taskName, category) => {
    const t = tasks.find(x => x.taskName === taskName && x.category === category);
    return t ? t.isCompleted : false;
  };

  const totalTasks = checklistItems.reduce((acc, curr) => acc + curr.items.length, 0);
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100) || 0;

  const handleCompleteOnboarding = () => {
    if (progressPercent < 100) {
      return toast.error("Vui lòng hoàn tất 100% checklist trước khi chốt Hội nhập!");
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
      toast.success(`Đã chuyển nhân viên ${selectedEmp.fullName} sang trạng thái ${nextStatusStr}!`);
      handleClosePanel();
      fetchNewbies();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi hoàn tất hội nhập");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = newbies.length;
    let completedCount = 0;
    let totalProgressSum = 0;

    newbies.forEach(emp => {
      const empCompleted = (emp.onboardingTasks || []).filter(t => t.isCompleted).length;
      const p = Math.round((empCompleted / totalTasks) * 100) || 0;
      totalProgressSum += p;
      if (p === 100) completedCount++;
    });

    const inProgressCount = total - completedCount;
    const avgProgress = total > 0 ? Math.round(totalProgressSum / total) : 0;

    return { total, inProgressCount, completedCount, avgProgress };
  }, [newbies, totalTasks]);

  // Filtered List
  const filteredNewbies = useMemo(() => {
    return newbies.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
        (emp.code && emp.code.toLowerCase().includes(q)) ||
        (emp.position?.title && emp.position.title.toLowerCase().includes(q));

      const empTasks = emp.onboardingTasks || [];
      const empCompleted = empTasks.filter(t => t.isCompleted).length;
      const empProgress = Math.round((empCompleted / totalTasks) * 100) || 0;

      const matchFilter = filterProgress === 'ALL' || 
        (filterProgress === 'COMPLETED' ? empProgress === 100 : empProgress < 100);

      return matchSearch && matchFilter;
    });
  }, [newbies, searchQuery, filterProgress, totalTasks]);

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
              <CheckSquare size={20} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Trung tâm Quản trị Hội nhập (Onboarding Center)
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Theo dõi, cấp phát trang thiết bị và hoàn thiện toàn diện checklist tiếp nhận nhân viên mới.
          </p>
        </div>
      </div>

      {/* 2. Top KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #6366f1',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Tổng Nhân sự Tiếp nhận
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Nhân sự đang trong diện quản lý
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Đang Hoàn thiện Checklist
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b' }}>
            {stats.inProgressCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Đang tiến hành thủ tục bàn giao
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #10b981',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Hoàn tất 100% (Chờ chốt)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>
            {stats.completedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Đã xong thiết bị, email & hợp đồng
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px',
          border: '1px solid var(--border)', borderLeft: '4px solid #0284c7',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Tiến độ Hoàn thành TB
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7' }}>
            {stats.avgProgress}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hiệu quả hội nhập toàn tổ chức
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
              placeholder="Tìm theo tên nhân sự, mã nhân viên, vị trí..." 
              className="form-input"
              style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC' }}
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>

          <select 
            className="form-input" 
            style={{ minWidth: '180px', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC' }}
            value={filterProgress} 
            onChange={e => setFilterProgress(e.target.value)}
          >
            <option value="ALL">Tất cả tiến độ</option>
            <option value="IN_PROGRESS">Đang xử lý (Chưa xong)</option>
            <option value="COMPLETED">Đã hoàn thành 100%</option>
          </select>
        </div>

        {(searchQuery || filterProgress !== 'ALL') && (
          <button
            onClick={() => { setSearchQuery(''); setFilterProgress('ALL'); }}
            className="btn btn-outline"
            style={{ height: 38, fontSize: '0.8rem', padding: '0 0.85rem' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 4. Cards Grid */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)',
        padding: '1.25rem', boxShadow: 'var(--shadow-sm)', minHeight: '400px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Đang tải dữ liệu hội nhập...
          </div>
        ) : filteredNewbies.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4rem 0', textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
              color: 'var(--text-muted)'
            }}>
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 0.25rem 0' }}>
              Không có nhân sự nào trong danh sách
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Tất cả các nhân viên mới đã hoàn tất quy trình hoặc chưa có đợt tiếp nhận mới.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredNewbies.map(emp => {
              const empTasks = emp.onboardingTasks || [];
              const empCompleted = empTasks.filter(t => t.isCompleted).length;
              const empProgress = Math.round((empCompleted / totalTasks) * 100) || 0;
              const isAllDone = empProgress === 100;

              return (
                <div 
                  key={emp.id} 
                  onClick={() => handleOpenPanel(emp)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: isAllDone ? '1px solid #86efac' : '1px solid var(--border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = isAllDone ? '#86efac' : 'var(--border)';
                  }}
                >
                  {/* Card Head */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        backgroundColor: isAllDone ? '#ECFDF5' : '#EEF2FF',
                        color: isAllDone ? '#059669' : 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem'
                      }}>
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '2px' }}>
                          {emp.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600 }}>{emp.code}</span>
                          <span>•</span>
                          <span>{emp.position?.title || 'Chưa gán'}</span>
                        </div>
                      </div>
                    </div>

                    {isAllDone ? (
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                        backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                      }}>
                        Đạt 100%
                      </span>
                    ) : (
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                        backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE'
                      }}>
                        Đang làm
                      </span>
                    )}
                  </div>

                  {/* Join Date & Details */}
                  <div style={{
                    fontSize: '0.8rem', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '6px'
                  }}>
                    <UserPlus size={14} color="var(--primary)" />
                    <span>Ngày nhận việc:</span>
                    <strong style={{ color: 'var(--text-heading)' }}>
                      {new Date(emp.joinDate).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tiến độ ({empCompleted}/{totalTasks} việc)</span>
                      <strong style={{ color: isAllDone ? 'var(--success)' : 'var(--primary)' }}>{empProgress}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${empProgress}%`, height: '100%',
                        backgroundColor: isAllDone ? 'var(--success)' : 'var(--primary)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>

                  {/* Action Link */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '2px',
                    fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600
                  }}>
                    <span>Mở bảng Checklist</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Checklist Drawer / Detail Panel */}
      {selectedEmp && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={handleClosePanel}>
          <div 
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '16px', width: '640px', maxWidth: '95vw',
              border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px 0' }}>
                  Checklist Tiếp nhận & Hội nhập
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Nhân viên: <strong style={{ color: 'var(--primary)' }}>{selectedEmp.fullName}</strong> ({selectedEmp.code}) • {selectedEmp.position?.title || 'Nhân sự'}
                </div>
              </div>
              <button 
                onClick={handleClosePanel}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px', borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Progress Summary */}
            <div style={{
              padding: '1rem 1.75rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                  Tổng tiến độ hoàn thành các hạng mục ({completedTasks}/{totalTasks})
                </span>
                <strong style={{ color: progressPercent === 100 ? 'var(--success)' : 'var(--primary)' }}>
                  {progressPercent}%
                </strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPercent}%`, height: '100%',
                  backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--primary)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Checklist Groups */}
            <div style={{
              padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex',
              flexDirection: 'column', gap: '1.25rem', flex: 1
            }} className="custom-scrollbar">
              {checklistItems.map((group, gIdx) => (
                <div 
                  key={gIdx} 
                  style={{
                    border: '1px solid var(--border)', borderRadius: '10px',
                    overflow: 'hidden', backgroundColor: '#FFFFFF'
                  }}
                >
                  <div style={{
                    padding: '0.75rem 1rem', backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid var(--border)', display: 'flex',
                    alignItems: 'center', gap: '0.65rem'
                  }}>
                    {group.icon}
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                      {group.title}
                    </h4>
                  </div>

                  <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {group.items.map((task, tIdx) => {
                      const isDone = checkTaskStatus(task, group.category);

                      return (
                        <div
                          key={tIdx}
                          onClick={() => toggleTask(task, group.category, isDone)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.65rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                            backgroundColor: isDone ? '#F0FDF4' : 'transparent',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => {
                            if (!isDone) e.currentTarget.style.backgroundColor = '#F8FAFC';
                          }}
                          onMouseLeave={e => {
                            if (!isDone) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: '4px',
                            border: isDone ? '1px solid #10b981' : '1px solid #cbd5e1',
                            backgroundColor: isDone ? '#10b981' : '#FFFFFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isDone && <CheckSquare size={14} color="#FFFFFF" />}
                          </div>

                          <span style={{
                            fontSize: '0.85rem',
                            color: isDone ? '#64748B' : 'var(--text-heading)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            fontWeight: isDone ? 400 : 500
                          }}>
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Graduation Action */}
            <div style={{
              padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border)',
              backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.5rem'
            }}>
              <button
                onClick={handleCompleteOnboarding}
                disabled={progressPercent < 100 || isSubmitting}
                className="btn btn-primary"
                style={{
                  width: '100%', height: 44, fontSize: '0.9rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: progressPercent === 100 ? 'var(--success)' : '#94a3b8',
                  borderColor: progressPercent === 100 ? 'var(--success)' : '#94a3b8',
                  cursor: progressPercent === 100 ? 'pointer' : 'not-allowed'
                }}
              >
                {isSubmitting ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    CHỐT HOÀN TẤT HỘI NHẬP & CHUYỂN HỢP ĐỒNG
                  </>
                )}
              </button>

              {progressPercent < 100 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  * Vui lòng hoàn thành 100% tất cả ({totalTasks}) mục checklist để kích hoạt chốt hội nhập.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Confirm Complete Onboarding */}
      {showConfirmPopup && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', width: '420px', maxWidth: '95vw',
            border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#ECFDF5', color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Award size={30} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              Xác nhận Hoàn tất Hội nhập
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn chốt hoàn tất hội nhập cho nhân viên <strong style={{ color: 'var(--text-heading)' }}>{selectedEmp.fullName}</strong> và chuyển hồ sơ sang trạng thái{' '}
              <strong style={{ color: 'var(--primary)' }}>
                {selectedEmp.position?.level?.toLowerCase() === 'intern' ? 'THỰC TẬP' : 'THỬ VIỆC'}
              </strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button onClick={() => setShowConfirmPopup(false)} className="btn btn-outline" style={{ flex: 1 }}>
                Hủy bỏ
              </button>
              <button onClick={executeCompleteOnboarding} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                Đồng ý chốt
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
