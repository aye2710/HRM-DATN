import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CheckSquare, Laptop, Building, FileSignature, 
  CheckCircle2, AlertCircle, Printer, RotateCcw, 
  ShieldAlert, DollarSign, Users, ExternalLink, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const formatCurrency = (val) => {
  if (!val && val !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

/* =========================================================================
   1. MODAL / DRAWER: PHIẾU THEO DÕI BÀN GIAO 4 GIAI ĐOẠN CHI TIẾT
   ========================================================================= */
export const HandoverDrawerModal = ({ 
  employee, 
  handoverDetail, 
  loadingDetail, 
  onClose, 
  onRefresh, 
  onOpenBm02 
}) => {
  if (!employee) return null;

  // Toggle checklist task
  const handleToggleTask = async (taskName, category, currentStatus) => {
    try {
      await axios.post('http://localhost:5000/api/offboarding/task/toggle', {
        employeeId: employee.id,
        taskName,
        category,
        isCompleted: !currentStatus
      });
      toast.success('Đã cập nhật tiến độ công việc bàn giao!');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Lỗi khi cập nhật checklist');
    }
  };

  // Quick return asset
  const handleQuickReturnAsset = async (assignmentId, assetName) => {
    const result = await Swal.fire({
      title: 'Xác nhận thu hồi thiết bị?',
      text: `Xác nhận bạn đã tiếp nhận bàn giao và kiểm tra thiết bị: "${assetName}" hoàn tất?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận thu hồi',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#0284c7'
    });

    if (result.isConfirmed) {
      try {
        await axios.post('http://localhost:5000/api/offboarding/asset/quick-return', {
          assignmentId,
          employeeId: employee.id
        });
        toast.success(`Đã thu hồi thiết bị ${assetName} vào kho công ty!`);
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error('Lỗi khi thu hồi tài sản');
      }
    }
  };

  // Finalize offboarding
  const handleFinalize = async () => {
    const activeAssets = handoverDetail?.activeAssets || [];
    if (activeAssets.length > 0) {
      Swal.fire({
        title: 'Chưa thể chốt thôi việc!',
        html: `Nhân viên còn <b>${activeAssets.length} thiết bị</b> chưa hoàn trả cho công ty.<br/>Vui lòng thực hiện thu hồi tài sản ở Giai đoạn 2 trước khi kết thúc hợp đồng.`,
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Chốt Thôi Việc & Khóa An Ninh?',
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <p>Hệ thống sẽ thực hiện theo <b>Quy trình SOP-26</b>:</p>
          <ul>
            <li>Chuyển trạng thái nhân sự thành <b>ĐÃ NGHỈ VIỆC (RESIGNED)</b></li>
            <li>Chấm dứt hợp đồng lao động hiện tại sang <b>TERMINATED</b></li>
            <li><b>Khóa an ninh tài khoản</b> đăng nhập hệ thống ngay lập tức</li>
            <li>Lưu trữ lịch sử công tác phục vụ bảo hiểm xã hội và quyết toán thuế</li>
          </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý chốt thôi việc',
      cancelButtonText: 'Xem lại',
      confirmButtonColor: '#dc2626'
    });

    if (confirm.isConfirmed) {
      try {
        await axios.post('http://localhost:5000/api/offboarding/finalize', {
          employeeId: employee.id
        });
        Swal.fire('Thành công!', 'Nhân sự đã hoàn tất toàn bộ quy trình thôi việc và được chuyển vào Sổ Lịch sử.', 'success');
        onClose();
        if (onRefresh) onRefresh();
      } catch (err) {
        Swal.fire('Lỗi', err.response?.data?.error || 'Lỗi khi chốt thôi việc', 'error');
      }
    }
  };

  const [activeStageTab, setActiveStageTab] = React.useState('work'); // 'work' | 'it' | 'admin' | 'hr'

  const workTasks = handoverDetail?.defaultTasks?.filter(t => t.category === 'OFFBOARDING_WORK') || [];
  const itTasks = handoverDetail?.defaultTasks?.filter(t => t.category === 'OFFBOARDING_IT') || [];
  const adminTasks = handoverDetail?.defaultTasks?.filter(t => t.category === 'OFFBOARDING_ADMIN') || [];
  const hrTasks = handoverDetail?.defaultTasks?.filter(t => t.category === 'OFFBOARDING_HR') || [];

  const isTaskDone = (taskName) => Boolean(handoverDetail?.employee?.onboardingTasks?.find(t => t.taskName === taskName)?.isCompleted);

  const doneWork = workTasks.filter(t => isTaskDone(t.taskName)).length;
  const doneIt = itTasks.filter(t => isTaskDone(t.taskName)).length;
  const doneAdmin = adminTasks.filter(t => isTaskDone(t.taskName)).length;
  const doneHr = hrTasks.filter(t => isTaskDone(t.taskName)).length;

  const totalTasks = (workTasks.length + itTasks.length + adminTasks.length + hrTasks.length) || 1;
  const totalDone = doneWork + doneIt + doneAdmin + doneHr;
  const progressPercent = Math.round((totalDone / totalTasks) * 100);
  const activeAssets = handoverDetail?.activeAssets || [];

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card glass animate-scale-up" style={{ width: '880px', maxWidth: '98%', maxHeight: '92vh', overflowY: 'auto', padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '14px' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} color="#b91c1c" /> Phiếu Theo dõi Bàn giao Thôi việc (Checklist SOP-26)
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {progressPercent}% HOÀN THÀNH
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Nhân sự: <strong style={{ color: '#0f172a' }}>{employee.fullName}</strong> ({employee.code}) • Phòng ban: {employee.department?.name || '—'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        {/* Thanh Tiến Độ Tổng Thể */}
        <div style={{ padding: '0.5rem 1.5rem', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '7px', backgroundColor: '#cbd5e1', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? '#16a34a' : '#ea580c', transition: 'width 0.3s ease' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
            {totalDone}/{totalTasks} đầu việc đã chốt
          </span>
        </div>

        {/* 4 TABS CHUYÊN TRÁCH 4 GIAI ĐOẠN */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '0 1rem', overflowX: 'auto', gap: '0.25rem' }}>
          
          {/* TAB 1: Chuyên môn */}
          <button
            type="button"
            onClick={() => setActiveStageTab('work')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: activeStageTab === 'work' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: activeStageTab === 'work' ? '#7c3aed' : '#64748b',
              fontWeight: activeStageTab === 'work' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={16} color={activeStageTab === 'work' ? '#7c3aed' : '#64748b'} />
            <span>1. Chuyên môn & Dự án</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '99px',
              backgroundColor: doneWork === workTasks.length && workTasks.length > 0 ? '#dcfce7' : '#f1f5f9',
              color: doneWork === workTasks.length && workTasks.length > 0 ? '#15803d' : '#64748b',
              fontWeight: 700
            }}>
              {doneWork}/{workTasks.length}
            </span>
          </button>

          {/* TAB 2: IT & Thiết bị */}
          <button
            type="button"
            onClick={() => setActiveStageTab('it')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: activeStageTab === 'it' ? '2.5px solid #16a34a' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: activeStageTab === 'it' ? '#16a34a' : '#64748b',
              fontWeight: activeStageTab === 'it' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Laptop size={16} color={activeStageTab === 'it' ? '#16a34a' : '#64748b'} />
            <span>2. Tài sản & IT (BM-02)</span>
            {activeAssets.length > 0 ? (
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                Còn {activeAssets.length} máy
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                {doneIt}/{itTasks.length}
              </span>
            )}
          </button>

          {/* TAB 3: Hành chính */}
          <button
            type="button"
            onClick={() => setActiveStageTab('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: activeStageTab === 'admin' ? '2.5px solid #ca8a04' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: activeStageTab === 'admin' ? '#a16207' : '#64748b',
              fontWeight: activeStageTab === 'admin' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Building size={16} color={activeStageTab === 'admin' ? '#ca8a04' : '#64748b'} />
            <span>3. Hành chính - Tòa nhà</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '99px',
              backgroundColor: doneAdmin === adminTasks.length && adminTasks.length > 0 ? '#dcfce7' : '#f1f5f9',
              color: doneAdmin === adminTasks.length && adminTasks.length > 0 ? '#15803d' : '#64748b',
              fontWeight: 700
            }}>
              {doneAdmin}/{adminTasks.length}
            </span>
          </button>

          {/* TAB 4: Nhân sự & Pháp lý */}
          <button
            type="button"
            onClick={() => setActiveStageTab('hr')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: activeStageTab === 'hr' ? '2.5px solid #dc2626' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: activeStageTab === 'hr' ? '#dc2626' : '#64748b',
              fontWeight: activeStageTab === 'hr' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <FileSignature size={16} color={activeStageTab === 'hr' ? '#dc2626' : '#64748b'} />
            <span>4. Nhân sự & Pháp lý</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '99px',
              backgroundColor: doneHr === hrTasks.length && hrTasks.length > 0 ? '#dcfce7' : '#f1f5f9',
              color: doneHr === hrTasks.length && hrTasks.length > 0 ? '#15803d' : '#64748b',
              fontWeight: 700
            }}>
              {doneHr}/{hrTasks.length}
            </span>
          </button>

        </div>

        {/* Modal Body: Hiển thị nội dung theo từng Tab */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '360px' }}>
          {loadingDetail ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu chi tiết bàn giao...</div>
          ) : handoverDetail && (
            <>
              {/* NỘI DUNG TAB 1: BÀN GIAO CHUYÊN MÔN & DỰ ÁN */}
              {activeStageTab === 'work' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6b21a8', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={18} /> Giai đoạn 1: Quản lý trực tiếp & Nghiệm thu Chuyên môn
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Trưởng bộ phận trực tiếp kiểm tra và xác nhận bàn giao các công việc dở dang, tài liệu nghiệp vụ và đầu mối khách hàng.
                      </p>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e9d5ff', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#faf5ff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {workTasks.map((task, idx) => {
                      const isDone = isTaskDone(task.taskName);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', padding: '8px 10px', borderRadius: '6px', backgroundColor: isDone ? '#f3e8ff' : '#ffffff', border: '1px solid', borderColor: isDone ? '#d8b4fe' : '#f1f5f9' }}>
                          <input 
                            type="checkbox" 
                            checked={Boolean(isDone)} 
                            onChange={() => handleToggleTask(task.taskName, task.category, Boolean(isDone))}
                            style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                          />
                          <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#7e22ce' : '#1e293b', fontWeight: isDone ? 600 : 400 }}>
                            {task.taskName}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setActiveStageTab('it')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.82rem', color: '#7c3aed', borderColor: '#c084fc' }}
                    >
                      Sang Giai đoạn 2: Tài sản IT (BM-02) ➔
                    </button>
                  </div>
                </div>
              )}

              {/* NỘI DUNG TAB 2: TÀI SẢN & IT (BM-02) */}
              {activeStageTab === 'it' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Laptop size={18} /> Giai đoạn 2: Quản trị Tài sản & Thiết bị CNTT (Mẫu BM-02)
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        IT Support kiểm kê thực tế thiết bị phần cứng được cấp phát và thu hồi tài khoản hệ thống.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (onOpenBm02) onOpenBm02(employee);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                    >
                      <Printer size={14} /> In Biên bản BM-02 (Chuẩn A4)
                    </button>
                  </div>

                  {/* Danh sách thiết bị phần cứng đang mượn */}
                  <div style={{ border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem 1.25rem', backgroundColor: '#f0fdf4' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                      Thiết bị phần cứng công ty đã cấp phát:
                    </div>

                    {activeAssets.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeAssets.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #86efac', fontSize: '0.82rem' }}>
                            <div>
                              <strong style={{ color: '#0f172a' }}>{item.asset?.name}</strong> 
                              <span style={{ color: '#64748b', marginLeft: '6px' }}>({item.asset?.assetCode} • Serial: {item.asset?.serialNumber || 'N/A'})</span>
                            </div>
                            <button
                              onClick={() => handleQuickReturnAsset(item.id, item.asset?.name)}
                              className="btn btn-outline"
                              style={{ padding: '3px 10px', fontSize: '0.75rem', color: '#0284c7', borderColor: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <RotateCcw size={12} /> Thu hồi ngay
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', backgroundColor: '#dcfce7', borderRadius: '8px', fontSize: '0.82rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} /> 
                        <span>Nhân sự không còn giữ thiết bị phần cứng nào. Đã hoàn tất đối soát thu hồi tài sản!</span>
                      </div>
                    )}
                  </div>

                  {/* Checklist IT */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Các đầu việc kiểm tra tài khoản & hạ tầng IT:</div>
                    {itTasks.map((task, idx) => {
                      const isDone = isTaskDone(task.taskName);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', backgroundColor: isDone ? '#f0fdf4' : '#ffffff' }}>
                          <input 
                            type="checkbox" 
                            checked={Boolean(isDone)} 
                            onChange={() => handleToggleTask(task.taskName, task.category, Boolean(isDone))}
                            style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                          />
                          <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#15803d' : '#1e293b', fontWeight: isDone ? 600 : 400 }}>
                            {task.taskName}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setActiveStageTab('admin')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.82rem', color: '#16a34a', borderColor: '#86efac' }}
                    >
                      Sang Giai đoạn 3: Hành chính - Tòa nhà ➔
                    </button>
                  </div>
                </div>
              )}

              {/* NỘI DUNG TAB 3: HÀNH CHÍNH & VĂN PHÒNG */}
              {activeStageTab === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#854d0e', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={18} /> Giai đoạn 3: Khối Hành chính - Quản trị Tòa nhà
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      Thu hồi các hiện vật hành chính: thẻ ra vào văn phòng, thẻ gửi xe, chìa khóa tủ cá nhân và đồng phục công ty.
                    </p>
                  </div>

                  <div style={{ border: '1px solid #fef08a', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#fefce8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {adminTasks.map((task, idx) => {
                      const isDone = isTaskDone(task.taskName);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', padding: '8px 10px', borderRadius: '6px', backgroundColor: isDone ? '#fef9c3' : '#ffffff', border: '1px solid', borderColor: isDone ? '#fde047' : '#f1f5f9' }}>
                          <input 
                            type="checkbox" 
                            checked={Boolean(isDone)} 
                            onChange={() => handleToggleTask(task.taskName, task.category, Boolean(isDone))}
                            style={{ width: '18px', height: '18px', accentColor: '#ca8a04' }}
                          />
                          <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#a16207' : '#1e293b', fontWeight: isDone ? 600 : 400 }}>
                            {task.taskName}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setActiveStageTab('hr')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.82rem', color: '#ca8a04', borderColor: '#fde047' }}
                    >
                      Sang Giai đoạn 4: Nhân sự & Pháp lý ➔
                    </button>
                  </div>
                </div>
              )}

              {/* NỘI DUNG TAB 4: NHÂN SỰ & PHÁP LÝ */}
              {activeStageTab === 'hr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileSignature size={18} /> Giai đoạn 4: Khối Nhân sự & Pháp lý Lao động
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Soạn thảo quyết định chấm dứt HĐLĐ, quyết toán tiền phép tồn theo BLLĐ và chốt khóa an ninh hệ thống.
                      </p>
                    </div>

                    <Link
                      to="/internal/employees/decisions/create"
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', borderColor: '#fca5a5', color: '#b91c1c', backgroundColor: '#ffffff' }}
                    >
                      + Lập Quyết định Thôi việc
                    </Link>
                  </div>

                  {/* Banner Quyết toán Phép tồn & Tiền lương (Điều 113 BLLĐ) */}
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
                    <div>
                      <div style={{ color: '#1e40af' }}>Số ngày phép năm còn tồn:</div>
                      <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1.15rem' }}>
                        {handoverDetail.settlement?.remainingLeaveDays || 0} ngày
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>(Khoản 3 Điều 113 BLLĐ 2019)</div>
                    </div>

                    <div>
                      <div style={{ color: '#1e40af' }}>Lương cơ sở HĐLĐ:</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                        {formatCurrency(handoverDetail.settlement?.baseSalary)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Chuẩn 26 ngày công/tháng</div>
                    </div>

                    <div>
                      <div style={{ color: '#1e40af' }}>Dự toán thanh toán phép tồn:</div>
                      <div style={{ fontWeight: 800, color: '#047857', fontSize: '1.15rem' }}>
                        {formatCurrency(handoverDetail.settlement?.estimatedLeavePay)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669' }}>Cần chi trả vào kỳ lương cuối</div>
                    </div>
                  </div>

                  {/* Checklist HR */}
                  <div style={{ border: '1px solid #fecaca', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#fef2f2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {hrTasks.map((task, idx) => {
                      const isDone = isTaskDone(task.taskName);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', padding: '8px 10px', borderRadius: '6px', backgroundColor: isDone ? '#fee2e2' : '#ffffff', border: '1px solid', borderColor: isDone ? '#fca5a5' : '#f1f5f9' }}>
                          <input 
                            type="checkbox" 
                            checked={Boolean(isDone)} 
                            onChange={() => handleToggleTask(task.taskName, task.category, Boolean(isDone))}
                            style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
                          />
                          <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#991b1b' : '#1e293b', fontWeight: isDone ? 600 : 400 }}>
                            {task.taskName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 14px 14px' }}>
          <button onClick={onClose} className="btn btn-outline">
            Đóng lại
          </button>

          <button
            onClick={handleFinalize}
            className="btn btn-primary"
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={16} /> Chốt Thôi việc & Khóa An ninh (SOP-26)
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

/* =========================================================================
   2. MODAL KHỞI TẠO TIẾN TRÌNH THÔI VIỆC CHO NHÂN VIÊN
   ========================================================================= */
export const InitiateOffboardingModal = ({ employee, onClose, onSuccess }) => {
  const [initiateForm, setInitiateForm] = React.useState({
    resignationDate: new Date().toISOString().split('T')[0],
    resignationReason: 'Thỏa thuận chấm dứt hợp đồng lao động (SOP-26)'
  });
  const [submitting, setSubmitting] = React.useState(false);

  if (!employee) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/offboarding/initiate', {
        employeeId: employee.id,
        resignationDate: initiateForm.resignationDate,
        resignationReason: initiateForm.resignationReason
      });
      toast.success('Đã khởi tạo tiến trình thôi việc và nạp bộ checklist 4 giai đoạn!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi khởi tạo thôi việc');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card glass animate-scale-up" style={{ width: '520px', maxWidth: '95%', padding: 0, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>Khởi tạo Hồ sơ Thôi việc (SOP-26)</h3>
            <span style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>Bắt đầu chu trình bàn giao 4 giai đoạn cho nhân sự</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nhân sự áp dụng thôi việc:</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{employee.fullName} ({employee.code})</div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>{employee.department?.name || 'Chưa gán PB'} • {employee.position?.title || 'Chưa có chức vụ'}</div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ngày làm việc cuối cùng *</label>
              <input 
                type="date"
                required
                className="form-input w-full"
                value={initiateForm.resignationDate}
                onChange={(e) => setInitiateForm({ ...initiateForm, resignationDate: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Hệ thống tự động khóa quyền truy cập lúc 18:00 ngày này.</span>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Căn cứ / Lý do thôi việc (Mẫu F03) *</label>
              <select
                className="form-select w-full"
                value={initiateForm.resignationReason}
                onChange={(e) => setInitiateForm({ ...initiateForm, resignationReason: e.target.value })}
              >
                <option value="Thỏa thuận chấm dứt hợp đồng lao động (SOP-26)">Thỏa thuận chấm dứt hợp đồng lao động</option>
                <option value="Hết hạn hợp đồng lao động không tái ký">Hết hạn hợp đồng lao động không tái ký</option>
                <option value="Người lao động đơn phương xin nghỉ theo quy định">Người lao động đơn phương xin nghỉ</option>
                <option value="Chuyển đổi định hướng cá nhân">Chuyển đổi định hướng cá nhân</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={submitting}>Hủy bỏ</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }} disabled={submitting}>
              {submitting ? 'Đang khởi tạo...' : 'Xác nhận Bắt đầu Bàn giao ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* =========================================================================
   3. MODAL IN BIÊN BẢN THU HỒI TÀI SẢN BM-02 CHUẨN A4
   ========================================================================= */
export const Bm02PrintModal = ({ employee, onClose }) => {
  if (!employee) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
      <div className="card animate-scale-up" style={{ width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', color: '#1e293b', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669' }}>
            Hệ thống Quản Trị Doanh Nghiệp • Biểu mẫu chuẩn BM-02 (SOP-26)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', backgroundColor: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Printer size={14} /> In Biên bản BM-02
            </button>
            <button onClick={onClose} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              <X size={14} /> Đóng
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '1rem', color: '#0f172a' }}>
            BIÊN BẢN THU HỒI & HOÀN TRẢ TRANG THIẾT BỊ
          </h2>
          <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b' }}>(Mẫu BM-02 ban hành theo Quy trình Thôi việc SOP-26 / Mẫu F03 - LLA)</div>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, marginBottom: '1rem' }}>
          Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại Trụ sở Công ty Cổ phần Công nghệ LLA, các bên tiến hành lập biên bản xác nhận thu hồi thiết bị làm việc:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', marginBottom: '1rem' }}>
          <div>
            <strong>BÊN TIẾP NHẬN THU HỒI (IT / HÀNH CHÍNH):</strong>
            <div>Bộ phận Quản trị Thiết bị CNTT & An ninh</div>
            <div>Khối Vận hành Doanh nghiệp LLA</div>
          </div>
          <div>
            <strong>BÊN BÀN GIAO THÔI VIỆC (NGƯỜI LAO ĐỘNG):</strong>
            <div>Họ và tên: <strong style={{ color: '#2563eb' }}>{employee.fullName}</strong></div>
            <div>Mã nhân viên: <strong>{employee.code}</strong></div>
            <div>Phòng ban: <strong>{employee.department?.name || 'Văn phòng'}</strong></div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>CHI TIẾT KIỂM KÊ THIẾT BỊ VÀ TÀI SẢN HOÀN TRẢ:</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', width: '40px' }}>STT</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Tên Trang thiết bị</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Mã tài sản</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Số Serial/Model</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Tình trạng thực tế</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>Xác nhận</th>
              </tr>
            </thead>
            <tbody>
              {employee.assetAssignments && employee.assetAssignments.length > 0 ? (
                employee.assetAssignments.map((as, i) => (
                  <tr key={as.id}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 600 }}>{as.asset?.name}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{as.asset?.assetCode}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{as.asset?.serialNumber || 'Theo máy'}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', color: as.status === 'RETURNED' ? '#16a34a' : '#d97706' }}>
                      {as.status === 'RETURNED' ? 'Đã thu hồi - Hoạt động tốt' : 'Đang bàn giao hoàn trả'}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>
                      ✓ Đạt
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    Không có tài sản phần cứng gắn theo hồ sơ (Đã đối soát hoàn tất).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, marginBottom: '2rem' }}>
          Biên bản này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để làm căn cứ thanh toán tiền lương kỳ cuối và thủ tục quyết toán BHXH.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
          <div>
            <strong>NGƯỜI LAO ĐỘNG</strong>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '60px' }}></div>
            <div style={{ fontWeight: 600 }}>{employee.fullName}</div>
          </div>
          <div>
            <strong>CÁN BỘ IT TIẾP NHẬN</strong>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>(Ký và xác nhận serial)</div>
            <div style={{ height: '60px' }}></div>
            <div style={{ fontWeight: 600 }}>Bộ phận IT Support</div>
          </div>
          <div>
            <strong>ĐẠI DIỆN PHÒNG NHÂN SỰ</strong>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>(Ký và đóng dấu xác nhận)</div>
            <div style={{ height: '60px' }}></div>
            <div style={{ fontWeight: 600 }}>Trưởng phòng Nhân sự</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
