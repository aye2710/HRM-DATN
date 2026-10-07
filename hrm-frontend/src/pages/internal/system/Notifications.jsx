import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  BellRing, Search, Plus, Filter, Edit2, Trash2, Mail, 
  Smartphone, Send, X, Check, CheckCircle, AlertCircle,
  ToggleLeft, ToggleRight, Radio, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const initialNotifications = [
  { id: 1, name: 'Nhắc nhở Hợp đồng sắp hết hạn', trigger: 'Trước 30 ngày', channel: 'Hệ thống, Email', target: 'HR Manager', status: 'Active' },
  { id: 2, name: 'Thông báo Chúc mừng Sinh nhật', trigger: 'Vào ngày Sinh nhật nhân viên', channel: 'Hệ thống, Email', target: 'Toàn bộ nhân sự', status: 'Active' },
  { id: 3, name: 'Cảnh báo Chấm công vắng mặt', trigger: '10:00 AM hàng ngày', channel: 'Email', target: 'Trưởng phòng (Manager)', status: 'Disabled' },
  { id: 4, name: 'Thông báo Phiếu lương mới ban hành', trigger: 'Ngay khi Khóa sổ kỳ lương', channel: 'Hệ thống, Email', target: 'Toàn bộ nhân sự', status: 'Active' },
  { id: 5, name: 'Nhắc nhở Đánh giá KPI cuối quý', trigger: 'Ngày 25 tháng cuối quý', channel: 'Hệ thống', target: 'Trưởng phòng (Manager)', status: 'Active' },
];

export const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Thêm / Sửa kịch bản
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formTrigger, setFormTrigger] = useState('Trước 30 ngày');
  const [formChannel, setFormChannel] = useState('Hệ thống, Email');
  const [formTarget, setFormTarget] = useState('Toàn bộ nhân sự');

  // Bật / Tắt kịch bản thông báo
  const handleToggleStatus = (notif) => {
    const nextStatus = notif.status === 'Active' ? 'Disabled' : 'Active';
    setNotifications(prev => prev.map(n => {
      if (n.id === notif.id) {
        return { ...n, status: nextStatus };
      }
      return n;
    }));
    toast.success(`Đã ${nextStatus === 'Active' ? 'KÍCH HOẠT' : 'TẠM DỪNG'} kịch bản "${notif.name}"`);
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormTrigger('Trước 30 ngày');
    setFormChannel('Hệ thống, Email');
    setFormTarget('Toàn bộ nhân sự');
    setShowModal(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (notif) => {
    setEditingId(notif.id);
    setFormName(notif.name);
    setFormTrigger(notif.trigger);
    setFormChannel(notif.channel);
    setFormTarget(notif.target);
    setShowModal(true);
  };

  // Lưu cấu hình
  const handleSaveNotification = (e) => {
    e.preventDefault();
    if (!formName) return toast.error('Vui lòng nhập tên kịch bản');

    if (editingId) {
      setNotifications(prev => prev.map(n => {
        if (n.id === editingId) {
          return { ...n, name: formName, trigger: formTrigger, channel: formChannel, target: formTarget };
        }
        return n;
      }));
      toast.success('Đã cập nhật kịch bản thông báo!');
    } else {
      const newObj = {
        id: Date.now(),
        name: formName,
        trigger: formTrigger,
        channel: formChannel,
        target: formTarget,
        status: 'Active'
      };
      setNotifications([newObj, ...notifications]);
      toast.success('Đã tạo kịch bản thông báo mới!');
    }

    setShowModal(false);
  };

  // Xóa kịch bản
  const handleDelete = async (notif) => {
    const result = await Swal.fire({
      title: `Xóa kịch bản "${notif.name}"?`,
      text: 'Hệ thống sẽ không gửi thông báo tự động theo kịch bản này nữa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      toast.success('Đã xóa kịch bản thông báo');
    }
  };

  // Gửi thông báo thử nghiệm (Test Send)
  const handleTestSend = (notif) => {
    toast.success(`Đã gửi thông báo thử nghiệm: "${notif.name}" tới kênh [${notif.channel}]!`, {
      icon: '🔔',
      duration: 4000
    });
  };

  // Lọc dữ liệu
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || n.name.toLowerCase().includes(q) || n.target.toLowerCase().includes(q) || n.channel.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [notifications, searchTerm, statusFilter]);

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Quản Lý Thông Báo & Cảnh Báo (Notifications)
              </h1>
              <span className="badge badge-info font-bold">Automation Engine</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Thiết lập các kịch bản kích hoạt thông báo tự động qua App, Email và Tin nhắn doanh nghiệp
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={handleOpenCreate} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <Plus size={16} />
              <span>Tạo Kịch Bản Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bảng Danh Sách Kịch Bản */}
      <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div className="p-4 flex justify-between items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3" style={{ flex: 1, minWidth: '280px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kịch bản thông báo, đối tượng nhận..." 
                className="form-input"
                style={{ paddingLeft: '2.4rem', height: 38 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Trạng thái:</span>
            <select 
              className="form-input" 
              style={{ width: 'auto', height: 38, padding: '0 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả ({notifications.length})</option>
              <option value="Active">Đang hoạt động</option>
              <option value="Disabled">Tạm dừng</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th>TÊN KỊCH BẢN THÔNG BÁO</th>
                <th>SỰ KIỆN KÍCH HOẠT (TRIGGER)</th>
                <th>KÊNH TRUYỀN TẢI</th>
                <th>ĐỐI TƯỢNG NHẬN</th>
                <th>TRẠNG THÁI</th>
                <th className="text-center" style={{ width: '200px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-12 text-muted">
                    Không tìm thấy kịch bản thông báo nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map(notif => (
                  <tr key={notif.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: notif.status === 'Active' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.05)' }}>
                          <BellRing size={18} color={notif.status === 'Active' ? 'var(--primary)' : 'var(--text-muted)'} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {notif.name}
                        </span>
                      </div>
                    </td>

                    <td className="text-muted text-sm">{notif.trigger}</td>

                    <td>
                      <div className="flex items-center gap-2">
                        {notif.channel.includes('Hệ thống') && <Smartphone size={14} color="var(--primary)" />}
                        {notif.channel.includes('Email') && <Mail size={14} color="var(--warning)" />}
                        <span className="text-sm font-medium">{notif.channel}</span>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-outline font-semibold">{notif.target}</span>
                    </td>

                    <td>
                      <button 
                        onClick={() => handleToggleStatus(notif)}
                        className={`badge ${notif.status === 'Active' ? 'badge-success' : 'badge-error'} cursor-pointer flex items-center gap-1 font-bold`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Bấm để bật/tắt kích hoạt"
                      >
                        {notif.status === 'Active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        <span>{notif.status === 'Active' ? 'Đang chạy' : 'Tạm dừng'}</span>
                      </button>
                    </td>

                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Gửi thử nghiệm */}
                        <button 
                          onClick={() => handleTestSend(notif)}
                          className="btn btn-outline flex items-center gap-1"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', height: 32 }}
                          title="Gửi thông báo thử nghiệm ngay"
                        >
                          <Send size={13} /> Test
                        </button>

                        {/* Sửa */}
                        <button 
                          onClick={() => handleOpenEdit(notif)}
                          className="btn btn-outline"
                          style={{ width: 32, height: 32, padding: 0 }}
                          title="Chỉnh sửa kịch bản"
                        >
                          <Edit2 size={14} color="var(--text-muted)" />
                        </button>

                        {/* Xóa */}
                        <button 
                          onClick={() => handleDelete(notif)}
                          className="btn btn-outline"
                          style={{ width: 32, height: 32, padding: 0, color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Xóa kịch bản"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA KỊCH BẢN THÔNG BÁO (React Portal) */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.15)' }}>
                  <BellRing size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    {editingId ? 'Chỉnh Sửa Kịch Bản Thông Báo' : 'Tạo Kịch Bản Thông Báo Mới'}
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Thiết lập sự kiện kích hoạt và đích gửi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleSaveNotification} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Tên Kịch bản thông báo <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Nhắc nhở chấm công, Báo cáo tuyển dụng..." 
                  className="form-input"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Sự kiện kích hoạt (Trigger)</label>
                  <select 
                    className="form-input"
                    value={formTrigger}
                    onChange={e => setFormTrigger(e.target.value)}
                  >
                    <option value="Trước 30 ngày">Trước 30 ngày</option>
                    <option value="Trước 15 ngày">Trước 15 ngày</option>
                    <option value="Vào ngày Sinh nhật nhân viên">Vào ngày Sinh nhật nhân viên</option>
                    <option value="10:00 AM hàng ngày">10:00 AM hàng ngày</option>
                    <option value="Ngay khi Khóa sổ kỳ lương">Ngay khi Khóa sổ kỳ lương</option>
                    <option value="Tức thì khi nộp đơn">Tức thì khi nộp đơn</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Kênh truyền tải</label>
                  <select 
                    className="form-input"
                    value={formChannel}
                    onChange={e => setFormChannel(e.target.value)}
                  >
                    <option value="Hệ thống, Email">Hệ thống & Email</option>
                    <option value="Hệ thống">Chỉ qua Hệ thống</option>
                    <option value="Email">Chỉ qua Email</option>
                    <option value="Hệ thống, Email, Slack">Hệ thống, Email & Slack</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Đối tượng nhận thông báo</label>
                <select 
                  className="form-input"
                  value={formTarget}
                  onChange={e => setFormTarget(e.target.value)}
                >
                  <option value="Toàn bộ nhân sự">Toàn bộ nhân sự</option>
                  <option value="HR Manager">Quản lý Nhân sự (HR Manager)</option>
                  <option value="Trưởng phòng (Manager)">Trưởng phòng (Line Manager)</option>
                  <option value="Super Admin">Quản trị viên (Super Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-outline"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Check size={16} /> Lưu Kịch Bản
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
