import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, UserPlus, Laptop, FileSignature, X, CheckCircle2, 
  AlertCircle, Search, Award, Building, Users, Clock
} from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';

const checklistItems = [
  { 
    category: 'IT_SUPPORT', 
    department: 'Khối IT Support',
    deadline: 'Trước 17:00 ngày N-1',
    badgeBg: '#EEF2FF',
    badgeColor: '#4F46E5',
    panelBg: '#EEF2FF',
    panelBorder: '#C7D2FE',
    itemDoneBg: '#E0E7FF',
    icon: <Laptop size={16} color="#4F46E5"/>, 
    tabLabel: '1. IT & Kỹ thuật',
    title: 'Giai đoạn 1: Khối IT Support & Hạ tầng Kỹ thuật', 
    desc: 'IT Support khởi tạo tài khoản, phân quyền hệ thống và chuẩn bị thiết bị phần cứng trước ngày nhận việc.',
    items: [
      'Khởi tạo Email công ty & cấp tài khoản M365/Workspace',
      'Cấp tài khoản phần mềm HRM & phân quyền chức vụ',
      'Cấp phát Laptop/PC và cài đặt phần mềm làm việc'
    ] 
  },
  { 
    category: 'ADMIN', 
    department: 'Khối Hành chính - Quản trị',
    deadline: 'Hoàn tất ngày N-1',
    badgeBg: '#FFFBEB',
    badgeColor: '#D97706',
    panelBg: '#FFFBEB',
    panelBorder: '#FDE68A',
    itemDoneBg: '#FEF3C7',
    icon: <Building size={16} color="#D97706"/>, 
    tabLabel: '2. Hành chính VP (BM-01)',
    title: 'Giai đoạn 2: Khối Hành chính - Quản trị Văn phòng', 
    desc: 'Hành chính chuẩn bị chỗ ngồi, cấp thẻ ra vào tòa nhà và lập biên bản bàn giao thiết bị (BM-01).',
    items: [
      'Bố trí bàn làm việc, ghế ngồi & văn phòng phẩm',
      'In và cấp Thẻ từ nhân viên ra vào tòa nhà',
      'Lập biên bản bàn giao tài sản thiết bị (Mẫu BM-01)'
    ] 
  },
  { 
    category: 'HR', 
    department: 'Khối Nhân sự (HR)',
    deadline: 'Ngày N (Ngày đầu đi làm)',
    badgeBg: '#ECFDF5',
    badgeColor: '#059669',
    panelBg: '#F0FDF4',
    panelBorder: '#BBF7D0',
    itemDoneBg: '#DCFCE7',
    icon: <FileSignature size={16} color="#059669"/>, 
    tabLabel: '3. Nhân sự & Pháp lý',
    title: 'Giai đoạn 3: Khối Nhân sự (Hợp đồng & Hồ sơ pháp lý)', 
    desc: 'HR hướng dẫn ký hợp đồng lao động, cam kết bảo mật NDA và đối soát hồ sơ bản cứng.',
    items: [
      'Hướng dẫn ký Hợp đồng thử việc & Đóng dấu lưu trữ',
      'Ký Cam kết Bảo mật thông tin (NDA) & Nội quy lao động',
      'Thu nộp & đối soát hồ sơ bản cứng (CCCD, Bằng cấp)'
    ] 
  },
  { 
    category: 'MANAGER', 
    department: 'Khối Quản lý trực tiếp',
    deadline: 'Ngày N+1 (Ngày thứ hai)',
    badgeBg: '#F5F3FF',
    badgeColor: '#7C3AED',
    panelBg: '#FAF5FF',
    panelBorder: '#E9D5FF',
    itemDoneBg: '#F3E8FF',
    icon: <Users size={16} color="#7C3AED"/>, 
    tabLabel: '4. Quản lý & Đào tạo',
    title: 'Giai đoạn 4: Khối Quản lý trực tiếp & Định hướng KPI', 
    desc: 'Quản lý trực tiếp phân công người hướng dẫn (Mentor), giao mục tiêu thử việc và giới thiệu team.',
    items: [
      'Chỉ định Người hướng dẫn (Mentor / Buddy kèm cặp)',
      'Giao Bản mô tả công việc & Mục tiêu KPI thử việc',
      'Họp tiếp nhận thành viên mới cùng toàn đội ngũ (Team)'
    ] 
  }
];

export const OnboardingMgmt = () => {
  const navigate = useNavigate();
  const [newbies, setNewbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgress, setFilterProgress] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'COMPLETED'
  
  // Modal state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: IT_SUPPORT, 1: ADMIN, 2: HR, 3: MANAGER
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
    setActiveTab(0);
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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedNewbies,
    resetPage,
  } = usePagination(filteredNewbies, 10);

  useEffect(() => {
    resetPage();
  }, [searchQuery, filterProgress, resetPage]);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* 1. Header (Chuẩn kiểu OffboardingChecklist) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8' }}>
              <CheckSquare size={26} color="#2563eb" /> Tiến độ Hội nhập & Checklist Nhân sự mới
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              QUY TRÌNH HỘI NHẬP • BM-01
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Kiểm soát 4 giai đoạn phối hợp liên phòng ban: IT Support & Hạ tầng, Hành chính (BM-01), Nhân sự (HĐLĐ), và Quản lý trực tiếp
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/internal/onboarding/pre-onboarding')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <UserPlus size={16} /> Tiếp nhận Ứng viên
          </button>
        </div>
      </div>

      {/* 2. Bộ lọc tìm kiếm */}
      <div className="card glass" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, mã NV, vị trí..." 
            className="form-input"
            style={{ paddingLeft: '2.4rem', height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        <div style={{ width: '210px', maxWidth: '100%' }}>
          <select 
            className="form-input" 
            style={{ height: 38, fontSize: '0.85rem', backgroundColor: '#F8FAFC', width: '100%' }}
            value={filterProgress} 
            onChange={e => setFilterProgress(e.target.value)}
          >
            <option value="ALL">Tất cả tiến độ</option>
            <option value="IN_PROGRESS">Đang xử lý (Chưa xong)</option>
            <option value="COMPLETED">Đã hoàn thành 100%</option>
          </select>
        </div>
      </div>

      {/* 3. Danh sách Nhân viên Đang Hội nhập (Dạng bảng giống OffboardingChecklist) */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Danh sách Hồ sơ đang xử lý Hội nhập</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cần hoàn tất 100% đầu việc liên phòng ban trước khi chuyển sang trạng thái Thử việc / Thực tập chính thức</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>
            {filteredNewbies.length} hồ sơ đang mở
          </span>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Ngày nhận việc</th>
                <th>Tiến độ Checklist</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang nạp danh sách hội nhập...</td></tr>
              ) : filteredNewbies.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle2 size={36} color="#16a34a" />
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>Không có nhân sự nào đang chờ hội nhập!</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Tất cả nhân sự mới đã hoàn tất quy trình hội nhập hoặc chưa có đợt tiếp nhận mới.</div>
                      <button 
                        onClick={() => navigate('/internal/onboarding/pre-onboarding')}
                        className="btn btn-outline"
                        style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#2563eb', borderColor: '#93c5fd' }}
                      >
                        Mở trang Tiếp nhận Ứng viên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedNewbies.map(emp => {
                  const empTasks = emp.onboardingTasks || [];
                  const doneTasks = empTasks.filter(t => t.isCompleted).length;
                  const percent = Math.round((doneTasks / totalTasks) * 100) || 0;
                  const isAllDone = percent === 100;

                  return (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.code}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.position?.title || 'Chuyên viên'}</div>
                      </td>
                      <td>{emp.department?.name || '—'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                          {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('vi-VN') : 'Chưa chốt'}
                        </div>
                        {emp.checklistDeadlineDate && (
                          <div style={{ fontSize: '0.72rem', color: emp.isChecklistOverdue && !isAllDone ? '#dc2626' : '#64748b', marginTop: '2px' }}>
                            Hạn: {new Date(emp.checklistDeadlineDate).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>
                      <td style={{ width: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', backgroundColor: isAllDone ? '#16a34a' : '#2563eb', transition: 'width 0.3s ease' }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAllDone ? '#16a34a' : '#2563eb', minWidth: '35px' }}>
                            {percent}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          Đã xong {doneTasks}/{totalTasks} đầu việc
                        </div>
                      </td>
                      <td>
                        {isAllDone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                            <CheckCircle2 size={12} /> Đạt 100%
                          </span>
                        ) : emp.isChecklistOverdue ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
                            <AlertCircle size={12} /> Quá hạn checklist
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600 }}>
                            <Clock size={12} /> Đang hội nhập
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenPanel(emp)}
                            className="btn btn-outline"
                            style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', borderColor: '#93c5fd' }}
                            title="Mở Phiếu Checklist Hội nhập"
                          >
                            <CheckSquare size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="hồ sơ"
        />
      </div>

      {/* MODAL 1: Phiếu Theo dõi Checklist Hội nhập (Kiểu dáng đồng bộ với HandoverDrawerModal bên Thôi việc) */}
      {selectedEmp && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={handleClosePanel}>
          <div className="card glass animate-scale-up" style={{ width: '880px', maxWidth: '98%', maxHeight: '92vh', overflowY: 'auto', padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '14px' }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquare size={20} color="#2563eb" /> Phiếu Theo dõi Hội nhập Nhân sự mới (Checklist)
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: progressPercent === 100 ? '#dcfce7' : '#eff6ff', color: progressPercent === 100 ? '#15803d' : '#1d4ed8', border: `1px solid ${progressPercent === 100 ? '#bbf7d0' : '#bfdbfe'}` }}>
                    {progressPercent}% HOÀN THÀNH
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Nhân sự: <strong style={{ color: '#0f172a' }}>{selectedEmp.fullName}</strong> ({selectedEmp.code}) • Phòng ban: {selectedEmp.department?.name || '—'} • Vị trí: {selectedEmp.position?.title || 'Nhân sự mới'}
                </p>
              </div>
              <button onClick={handleClosePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {/* Thanh Tiến Độ Tổng Thể */}
            <div style={{ padding: '0.5rem 1.5rem', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '7px', backgroundColor: '#cbd5e1', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? '#16a34a' : '#2563eb', transition: 'width 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                {completedTasks}/{totalTasks} đầu việc đã chốt
              </span>
            </div>

            {/* 4 TABS CHUYÊN TRÁCH 4 GIAI ĐOẠN */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '0 1rem', overflowX: 'auto', gap: '0.25rem' }}>
              {checklistItems.map((group, idx) => {
                const isCurrent = activeTab === idx;
                const doneCount = group.items.filter(task => checkTaskStatus(task, group.category)).length;
                const isGroupDone = doneCount === group.items.length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderBottom: isCurrent ? `2.5px solid ${group.badgeColor}` : '2.5px solid transparent',
                      backgroundColor: 'transparent',
                      color: isCurrent ? group.badgeColor : '#64748b',
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {group.icon}
                    <span>{group.tabLabel}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '99px',
                      backgroundColor: isGroupDone ? '#dcfce7' : '#f1f5f9',
                      color: isGroupDone ? '#15803d' : '#64748b',
                      fontWeight: 700
                    }}>
                      {doneCount}/{group.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body: Nội dung từng Giai đoạn */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', minHeight: '300px' }}>
              {(() => {
                const group = checklistItems[activeTab];
                const nextGroup = checklistItems[activeTab + 1];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: group.badgeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {group.icon} {group.title}
                        </h4>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                          {group.desc}
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: group.badgeBg,
                        color: group.badgeColor,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: `1px solid ${group.badgeColor}33`
                      }}>
                        Hạn: {group.deadline}
                      </span>
                    </div>

                    <div style={{ border: `1px solid ${group.panelBorder}`, borderRadius: '10px', padding: '1.1rem', backgroundColor: group.panelBg, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {group.items.map((task, tIdx) => {
                        const isDone = checkTaskStatus(task, group.category);
                        return (
                          <label
                            key={tIdx}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                              fontSize: '0.86rem', color: '#334155', cursor: 'pointer',
                              padding: '10px 12px', borderRadius: '8px',
                              backgroundColor: isDone ? group.itemDoneBg : '#ffffff',
                              border: '1px solid', borderColor: isDone ? group.panelBorder : '#e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(isDone)}
                                onChange={() => toggleTask(task, group.category, Boolean(isDone))}
                                style={{ width: '18px', height: '18px', accentColor: group.badgeColor, cursor: 'pointer' }}
                              />
                              <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? group.badgeColor : '#1e293b', fontWeight: isDone ? 600 : 500 }}>
                                {task}
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
                              backgroundColor: isDone ? '#dcfce7' : '#f8fafc',
                              color: isDone ? '#15803d' : '#94a3b8',
                              border: `1px solid ${isDone ? '#bbf7d0' : '#e2e8f0'}`
                            }}>
                              {isDone ? 'Đã xong' : 'Chưa xong'}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {nextGroup && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setActiveTab(activeTab + 1)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.82rem', color: group.badgeColor, borderColor: group.panelBorder }}
                        >
                          Sang {nextGroup.tabLabel} ➔
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {progressPercent < 100
                  ? `* Vui lòng hoàn thành 100% tất cả (${totalTasks}) đầu việc để kích hoạt chốt hội nhập.`
                  : `✓ Đã hoàn tất 100% checklist! Sẵn sàng chuyển sang ${selectedEmp.position?.level?.toLowerCase() === 'intern' ? 'Thực tập' : 'Thử việc'}.`}
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button type="button" onClick={handleClosePanel} className="btn btn-outline" style={{ fontSize: '0.84rem' }}>
                  Đóng
                </button>
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={progressPercent < 100 || isSubmitting}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    backgroundColor: progressPercent === 100 ? '#16a34a' : '#94a3b8',
                    borderColor: progressPercent === 100 ? '#16a34a' : '#94a3b8',
                    cursor: progressPercent === 100 ? 'pointer' : 'not-allowed'
                  }}
                >
                  <CheckCircle2 size={16} />
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : `HOÀN TẤT HỘI NHẬP & BẮT ĐẦU ${selectedEmp.position?.level?.toLowerCase() === 'intern' ? 'THỰC TẬP' : 'THỬ VIỆC'}`}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Confirm Complete Onboarding */}
      {showConfirmPopup && selectedEmp && createPortal(
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
