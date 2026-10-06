import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Settings, Shield, UserCheck, AlertTriangle, Plus, Edit2, 
  Trash2, X, Check, Lock, CheckSquare, Square, Layers, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const defaultRoles = [
  {
    id: 'ROLE_ADMIN',
    name: 'Super Administrator',
    description: 'Toàn quyền cấu hình hệ thống, quản lý cơ sở dữ liệu và bảo mật.',
    status: 'Active',
    usersCount: 2,
    isSystem: true,
    permissions: [
      'EMPLOYEES_VIEW', 'EMPLOYEES_MANAGE', 'PAYROLL_VIEW', 'PAYROLL_MANAGE', 'PAYROLL_LOCK',
      'LEAVES_VIEW', 'LEAVES_APPROVE', 'ATS_VIEW', 'ATS_MANAGE', 'SYSTEM_AUDIT', 'SYSTEM_RBAC'
    ]
  },
  {
    id: 'ROLE_HR',
    name: 'Quản Lý Nhân Sự (HR Manager)',
    description: 'Quản lý hồ sơ nhân viên, hợp đồng lao động, chấm công và chạy bảng lương.',
    status: 'Active',
    usersCount: 5,
    isSystem: false,
    permissions: [
      'EMPLOYEES_VIEW', 'EMPLOYEES_MANAGE', 'PAYROLL_VIEW', 'PAYROLL_MANAGE',
      'LEAVES_VIEW', 'LEAVES_APPROVE', 'ATS_VIEW', 'ATS_MANAGE'
    ]
  },
  {
    id: 'ROLE_MANAGER',
    name: 'Trưởng Phòng Ban (Line Manager)',
    description: 'Quản lý nhân viên trong phòng ban, duyệt đơn nghỉ phép và đánh giá KPI.',
    status: 'Active',
    usersCount: 12,
    isSystem: false,
    permissions: [
      'EMPLOYEES_VIEW', 'LEAVES_VIEW', 'LEAVES_APPROVE', 'ATS_VIEW'
    ]
  },
  {
    id: 'ROLE_EMPLOYEE',
    name: 'Nhân Viên Tiêu Chuẩn (Employee)',
    description: 'Quyền truy cập cổng tự phục vụ: xem hồ sơ cá nhân, nộp đơn nghỉ và xem phiếu lương.',
    status: 'Active',
    usersCount: 132,
    isSystem: true,
    permissions: [
      'EMPLOYEES_VIEW_SELF', 'LEAVES_SUBMIT', 'PAYROLL_VIEW_SELF'
    ]
  }
];

const allPermissionDefinitions = [
  { category: 'Quản lý Nhân sự', code: 'EMPLOYEES_VIEW', label: 'Xem danh sách & hồ sơ nhân viên' },
  { category: 'Quản lý Nhân sự', code: 'EMPLOYEES_MANAGE', label: 'Thêm, sửa, điều chuyển & thôi việc' },
  { category: 'Quản lý Tiền lương', code: 'PAYROLL_VIEW', label: 'Xem bảng lương toàn công ty' },
  { category: 'Quản lý Tiền lương', code: 'PAYROLL_MANAGE', label: 'Chạy động cơ tính lương tự động' },
  { category: 'Quản lý Tiền lương', code: 'PAYROLL_LOCK', label: 'Khóa sổ / Mở khóa sổ kỳ lương' },
  { category: 'Chấm công & Nghỉ phép', code: 'LEAVES_VIEW', label: 'Xem lịch sử đơn xin nghỉ' },
  { category: 'Chấm công & Nghỉ phép', code: 'LEAVES_APPROVE', label: 'Phê duyệt / Từ chối đơn nghỉ phép' },
  { category: 'Tuyển dụng & Đãi ngộ', code: 'ATS_VIEW', label: 'Xem tin tuyển dụng & ứng viên' },
  { category: 'Tuyển dụng & Đãi ngộ', code: 'ATS_MANAGE', label: 'Phỏng vấn & Gửi thư mời nhận việc (Offer)' },
  { category: 'Quản trị Hệ thống', code: 'SYSTEM_AUDIT', label: 'Xem nhật ký kiểm toán (Audit Trail)' },
  { category: 'Quản trị Hệ thống', code: 'SYSTEM_RBAC', label: 'Cấu hình phân quyền & Vai trò' },
];

export const SettingsRBAC = () => {
  const [roles, setRoles] = useState(defaultRoles);

  // Modal phân quyền cho 1 Role
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Modal thêm Role mới
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState(['EMPLOYEES_VIEW', 'LEAVES_VIEW']);

  // Mở modal sửa quyền
  const handleOpenEditPermissions = (role) => {
    setEditingRole(role);
    setSelectedPermissions([...role.permissions]);
  };

  // Toggle 1 quyền trong modal
  const handleTogglePermission = (code) => {
    setSelectedPermissions(prev => {
      if (prev.includes(code)) {
        return prev.filter(p => p !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // Lưu phân quyền
  const handleSavePermissions = () => {
    if (!editingRole) return;
    setRoles(prev => prev.map(r => {
      if (r.id === editingRole.id) {
        return { ...r, permissions: selectedPermissions };
      }
      return r;
    }));
    toast.success(`Đã cập nhật phân quyền thành công cho vai trò: ${editingRole.name}!`);
    setEditingRole(null);
  };

  // Thêm Role mới
  const handleCreateRole = (e) => {
    e.preventDefault();
    if (!newRoleName) return toast.error('Vui lòng nhập tên vai trò');

    const roleId = `ROLE_${newRoleName.toUpperCase().replace(/\s+/g, '_')}`;
    const newRole = {
      id: roleId,
      name: newRoleName,
      description: newRoleDesc || 'Vai trò tùy chỉnh trong doanh nghiệp.',
      status: 'Active',
      usersCount: 0,
      isSystem: false,
      permissions: newRolePerms
    };

    setRoles([...roles, newRole]);
    toast.success(`Đã tạo vai trò mới: ${newRoleName}!`);
    setShowAddRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  // Xóa Role (chỉ custom)
  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      return toast.error('Không thể xóa vai trò mặc định của hệ thống!');
    }

    const result = await Swal.fire({
      title: `Xóa vai trò ${role.name}?`,
      text: 'Các tài khoản đang gán vai trò này sẽ mất quyền truy cập tương ứng.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      setRoles(prev => prev.filter(r => r.id !== role.id));
      toast.success(`Đã xóa vai trò ${role.name}`);
    }
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
                Cấu Hình & Phân Quyền (RBAC System)
              </h1>
              <span className="badge badge-info font-bold">Role-Based Access Control</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Ma trận phân quyền chi tiết theo từng vai trò (Roles & Permissions) bảo vệ thông tin mật
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowAddRoleModal(true)} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <Plus size={16} />
              <span>Thêm Vai Trò Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Cảnh báo chế độ Super Admin */}
      <div className="card glass p-4" style={{ borderRadius: '14px', borderLeft: '4px solid var(--warning)', backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Chế độ Quản trị Quyền lực cao</h4>
            <p className="text-muted text-xs mt-0.5" style={{ margin: 0 }}>
              Bất kỳ thay đổi nào trong ma trận phân quyền dưới đây sẽ có hiệu lực tức thì trên các tài khoản nhân sự đang hoạt động.
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách các Vai trò (Role Cards) */}
      <div className="flex-col gap-4">
        {roles.map(role => (
          <div key={role.id} className="card glass card-hover p-5 flex items-center justify-between flex-wrap gap-4" style={{ borderRadius: '14px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="p-2 rounded-xl" style={{ backgroundColor: role.id === 'ROLE_ADMIN' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)' }}>
                  <Shield size={20} color={role.id === 'ROLE_ADMIN' ? 'var(--error)' : 'var(--primary)'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {role.name}
                  </h3>
                  <span className="text-xs font-mono text-muted">{role.id}</span>
                </div>
                <span className="badge badge-success text-xs font-bold">{role.status}</span>
                {role.isSystem && <span className="badge badge-outline text-xs">Mặc định</span>}
              </div>

              <p className="text-muted text-xs mb-3" style={{ margin: 0 }}>
                {role.description}
              </p>

              {/* Tags các quyền hiện tại */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {role.id === 'ROLE_ADMIN' ? (
                  <span className="badge badge-danger font-bold text-xs">TOÀN QUYỀN HỆ THỐNG (SUPER ADMIN)</span>
                ) : (
                  role.permissions.slice(0, 6).map(p => (
                    <span key={p} className="badge badge-info text-xs" style={{ padding: '0.2rem 0.5rem' }}>
                      {allPermissionDefinitions.find(d => d.code === p)?.label || p}
                    </span>
                  ))
                )}
                {role.permissions.length > 6 && role.id !== 'ROLE_ADMIN' && (
                  <span className="text-xs text-muted font-bold">+{role.permissions.length - 6} quyền khác</span>
                )}
              </div>
            </div>

            {/* Thao tác góc phải */}
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <div className="flex-col text-right mr-2">
                <span className="text-xs text-muted">Số tài khoản gán</span>
                <strong className="text-sm text-main">{role.usersCount} người dùng</strong>
              </div>

              <button 
                onClick={() => handleOpenEditPermissions(role)}
                className="btn btn-outline flex items-center gap-1"
                style={{ height: 36, padding: '0 0.85rem' }}
                title="Tùy chỉnh ma trận quyền"
              >
                <Edit2 size={15} />
                <span>Sửa Phân Quyền</span>
              </button>

              {!role.isSystem && (
                <button 
                  onClick={() => handleDeleteRole(role)}
                  className="btn btn-outline"
                  style={{ width: 36, height: 36, padding: 0, color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  title="Xóa vai trò"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: CHỈNH SỬA MA TRẬN PHÂN QUYỀN (React Portal) */}
      {editingRole && createPortal(
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
            maxWidth: '640px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.15)' }}>
                  <ShieldCheck size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                    Phân Quyền: {editingRole.name}
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Tích chọn các quyền mà vai trò này được phép thực hiện</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingRole(null)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {/* Danh sách Checkbox ma trận quyền */}
            <div className="flex-col gap-3">
              {allPermissionDefinitions.map(perm => {
                const isChecked = selectedPermissions.includes(perm.code);
                return (
                  <label 
                    key={perm.code}
                    onClick={() => handleTogglePermission(perm.code)}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer card-hover"
                    style={{ 
                      backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isChecked ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                      margin: 0
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ color: isChecked ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <div className="flex-col">
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isChecked ? '#fff' : 'var(--text-muted)' }}>
                          {perm.label}
                        </span>
                        <span className="text-xs text-muted font-mono">{perm.code}</span>
                      </div>
                    </div>
                    <span className="badge badge-outline text-xs">{perm.category}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span className="text-xs text-muted">
                Đã cấp <strong>{selectedPermissions.length}</strong> / {allPermissionDefinitions.length} quyền
              </span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingRole(null)} 
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={handleSavePermissions}
                  className="btn btn-primary flex items-center gap-1.5"
                >
                  <Check size={16} /> Lưu Phân Quyền
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: THÊM ROLE MỚI (React Portal) */}
      {showAddRoleModal && createPortal(
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
                  <Shield size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                    Thêm Vai Trò Người Dùng Mới
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Khởi tạo nhóm quyền hạn mới cho doanh nghiệp</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddRoleModal(false)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Tên Vai trò (Role Name) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Kế toán tiền lương, Trợ lý tuyển dụng..."
                  className="form-input"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Mô tả nhiệm vụ & phạm vi quyền hạn</label>
                <textarea 
                  className="form-textarea"
                  rows={3}
                  placeholder="Mô tả tóm tắt quyền hạn của nhóm người dùng này..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddRoleModal(false)} 
                  className="btn btn-outline"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Check size={16} /> Tạo Vai Trò
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
