import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Settings, Shield, UserCheck, AlertTriangle, Plus, Edit2, 
  Trash2, X, Check, Lock, CheckSquare, Square, Layers, ShieldCheck,
  LayoutGrid, Table, CheckCircle2, XCircle, Info, RefreshCw,
  Users, Key, FileText, DollarSign, Clock, Target, Server
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Danh mục toàn bộ các quyền hạn hệ thống phân theo nhóm nghiệp vụ
const permissionModules = [
  {
    moduleName: 'Quản Lý Hồ Sơ Nhân Sự',
    moduleIcon: <Users size={16} color="var(--primary)" />,
    permissions: [
      { code: 'EMP_VIEW', label: 'Xem danh sách & hồ sơ nhân viên', desc: 'Cho phép tra cứu hồ sơ lý lịch, thông tin cá nhân của nhân sự' },
      { code: 'EMP_EDIT', label: 'Thêm mới & Chỉnh sửa hồ sơ', desc: 'Cho phép cập nhật CCCD, thông tin liên hệ, bằng cấp, người phụ thuộc' },
      { code: 'EMP_DECISION', label: 'Ban hành Quyết định nhân sự', desc: 'Ký quyết định bổ nhiệm, khen thưởng, kỷ luật, thôi việc' },
      { code: 'EMP_CONTRACT', label: 'Quản lý Hợp đồng lao động', desc: 'Khởi tạo, gia hạn và chấm dứt hợp đồng lao động' },
    ]
  },
  {
    moduleName: 'Quản Lý Tiền Lương & Đãi Ngộ',
    moduleIcon: <DollarSign size={16} color="var(--success)" />,
    permissions: [
      { code: 'PAY_VIEW', label: 'Xem bảng lương toàn công ty', desc: 'Truy cập bảng lương tổng hợp và các kỳ lương' },
      { code: 'PAY_CALC', label: 'Chạy động cơ tính lương tự động', desc: 'Tính toán lương Gross, Net, BHXH và Thuế TNCN lũy tiến' },
      { code: 'PAY_LOCK', label: 'Khóa sổ / Mở khóa sổ kỳ lương', desc: 'Chốt bảng lương sang trạng thái Read-only phục vụ chi trả ngân hàng' },
      { code: 'PAY_EXPORT', label: 'Xuất dữ liệu bảng lương (Excel/CSV)', desc: 'Tải xuống bảng lương bảo mật ra file bảng tính' },
    ]
  },
  {
    moduleName: 'Chấm Công & Nghỉ Phép',
    moduleIcon: <Clock size={16} color="var(--warning)" />,
    permissions: [
      { code: 'ATT_VIEW', label: 'Xem bảng công & lịch sử chấm công', desc: 'Tra cứu dữ liệu điểm danh, ca làm việc hàng ngày' },
      { code: 'ATT_ADJUST', label: 'Điều chỉnh công & Giải trình', desc: 'Duyệt điều chỉnh giờ vào/ra và số công thực tế' },
      { code: 'LEAVE_APPROVE', label: 'Phê duyệt đơn xin nghỉ phép', desc: 'Chấp thuận hoặc từ chối các đề xuất xin nghỉ của cấp dưới' },
    ]
  },
  {
    moduleName: 'Tuyển Dụng ATS & Đánh Giá KPI',
    moduleIcon: <Target size={16} color="#ec4899" />,
    permissions: [
      { code: 'REC_MANAGE', label: 'Quản lý Tin tuyển dụng & Ứng viên', desc: 'Đăng tin tuyển dụng, sàng lọc hồ sơ CV và chấm phỏng vấn' },
      { code: 'REC_OFFER', label: 'Gửi Thư mời nhận việc (Offer)', desc: 'Tạo và gửi thư mời offer lương tới ứng viên trúng tuyển' },
      { code: 'KPI_REVIEW', label: 'Đánh giá & Chấm điểm KPI', desc: 'Giao chỉ tiêu và chấm điểm hiệu suất nhân viên định kỳ' },
    ]
  },
  {
    moduleName: 'Quản Trị Hệ Thống & Bảo Mật',
    moduleIcon: <Server size={16} color="#06b6d4" />,
    permissions: [
      { code: 'SYS_AUDIT', label: 'Xem Nhật ký kiểm toán (Audit Trail)', desc: 'Tra cứu lịch sử thao tác dữ liệu nhạy cảm của người dùng' },
      { code: 'SYS_RBAC', label: 'Cấu hình Phân quyền & Vai trò (RBAC)', desc: 'Chỉnh sửa ma trận quyền hạn các vai trò trong doanh nghiệp' },
      { code: 'SYS_NOTIF', label: 'Cấu hình Thông báo tự động', desc: 'Thiết lập kịch bản cảnh báo qua Email và Thông báo nội bộ' },
    ]
  }
];

// Danh sách các vai trò mặc định
const initialRoles = [
  {
    id: 'ROLE_ADMIN',
    name: 'Super Administrator',
    badgeColor: 'var(--error)',
    description: 'Toàn quyền tối cao quản trị hệ thống, dữ liệu tài chính và cấu hình bảo mật.',
    usersCount: 2,
    isSystem: true,
    permissions: [
      'EMP_VIEW', 'EMP_EDIT', 'EMP_DECISION', 'EMP_CONTRACT',
      'PAY_VIEW', 'PAY_CALC', 'PAY_LOCK', 'PAY_EXPORT',
      'ATT_VIEW', 'ATT_ADJUST', 'LEAVE_APPROVE',
      'REC_MANAGE', 'REC_OFFER', 'KPI_REVIEW',
      'SYS_AUDIT', 'SYS_RBAC', 'SYS_NOTIF'
    ]
  },
  {
    id: 'ROLE_HR',
    name: 'Quản Lý Nhân Sự (HR Manager)',
    badgeColor: 'var(--primary)',
    description: 'Quản trị hồ sơ nhân sự, tính lương, giải quyết chế độ BHXH và quy trình tuyển dụng.',
    usersCount: 5,
    isSystem: false,
    permissions: [
      'EMP_VIEW', 'EMP_EDIT', 'EMP_DECISION', 'EMP_CONTRACT',
      'PAY_VIEW', 'PAY_CALC', 'PAY_EXPORT',
      'ATT_VIEW', 'ATT_ADJUST', 'LEAVE_APPROVE',
      'REC_MANAGE', 'REC_OFFER', 'KPI_REVIEW',
      'SYS_AUDIT'
    ]
  },
  {
    id: 'ROLE_MANAGER',
    name: 'Trưởng Phòng Ban (Line Manager)',
    badgeColor: 'var(--warning)',
    description: 'Quản lý nhân sự khối phòng ban trực thuộc, duyệt nghỉ phép và đánh giá chỉ số KPI.',
    usersCount: 12,
    isSystem: false,
    permissions: [
      'EMP_VIEW', 'ATT_VIEW', 'LEAVE_APPROVE', 'REC_MANAGE', 'KPI_REVIEW'
    ]
  },
  {
    id: 'ROLE_EMPLOYEE',
    name: 'Nhân Viên (Employee Self-Service)',
    badgeColor: '#10b981',
    description: 'Truy cập cổng cá nhân: xem chấm công của mình, nộp đơn nghỉ và xem phiếu lương.',
    usersCount: 132,
    isSystem: true,
    permissions: [
      'EMP_VIEW', 'ATT_VIEW'
    ]
  }
];

export const SettingsRBAC = () => {
  const [roles, setRoles] = useState(initialRoles);
  const [viewMode, setViewMode] = useState('MATRIX'); // 'MATRIX' (Ma trận tổng thể) | 'DETAIL' (Chi tiết theo vai trò)
  const [selectedRoleId, setSelectedRoleId] = useState('ROLE_HR');

  // Modal thêm role mới
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleCloneFrom, setNewRoleCloneFrom] = useState('ROLE_MANAGER');

  // Lấy role đang chọn
  const activeRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  // Toggle 1 quyền cho 1 Role
  const handleTogglePermission = (roleId, permCode) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === roleId) {
        // Super Admin không cho tắt quyền hệ thống cốt lõi
        if (role.id === 'ROLE_ADMIN' && (permCode === 'SYS_RBAC' || permCode === 'SYS_AUDIT')) {
          toast.error('Không thể tước quyền Quản trị hệ thống của Super Admin!');
          return role;
        }

        const hasPerm = role.permissions.includes(permCode);
        const updatedPerms = hasPerm
          ? role.permissions.filter(p => p !== permCode)
          : [...role.permissions, permCode];

        return { ...role, permissions: updatedPerms };
      }
      return role;
    }));
  };

  // Bật/Tắt toàn bộ quyền trong 1 module cho Active Role
  const handleToggleModulePermissions = (module, selectAll) => {
    const permCodes = module.permissions.map(p => p.code);
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === selectedRoleId) {
        let updatedPerms = [...role.permissions];
        if (selectAll) {
          permCodes.forEach(code => {
            if (!updatedPerms.includes(code)) updatedPerms.push(code);
          });
        } else {
          updatedPerms = updatedPerms.filter(code => !permCodes.includes(code));
        }
        return { ...role, permissions: updatedPerms };
      }
      return role;
    }));
    toast.success(`${selectAll ? 'Đã cấp tất cả' : 'Đã hủy'} quyền trong nhóm: ${module.moduleName}`);
  };

  // Tạo vai trò mới
  const handleCreateRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return toast.error('Vui lòng nhập tên vai trò');

    const sourceRole = roles.find(r => r.id === newRoleCloneFrom);
    const roleId = `ROLE_${newRoleName.toUpperCase().replace(/\s+/g, '_')}`;

    const newRole = {
      id: roleId,
      name: newRoleName,
      badgeColor: 'var(--primary)',
      description: newRoleDesc || 'Vai trò tùy chỉnh trong doanh nghiệp.',
      usersCount: 0,
      isSystem: false,
      permissions: sourceRole ? [...sourceRole.permissions] : ['EMP_VIEW']
    };

    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setShowAddRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
    toast.success(`Đã khởi tạo vai trò mới: ${newRoleName}!`);
  };

  // Xóa vai trò
  const handleDeleteRole = async (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      return toast.error('Không thể xóa vai trò mặc định của hệ thống!');
    }

    const result = await Swal.fire({
      title: `Xóa vai trò ${role.name}?`,
      text: 'Mọi tài khoản đang gán vai trò này sẽ mất quyền truy cập tương ứng.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      setSelectedRoleId('ROLE_ADMIN');
      toast.success(`Đã xóa vai trò ${role.name}`);
    }
  };

  // Tính tổng số quyền hệ thống
  const totalSystemPermissions = permissionModules.reduce((sum, m) => sum + m.permissions.length, 0);

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
                Trung Tâm Phân Quyền Bảo Mật (Enterprise RBAC)
              </h1>
              <span className="badge badge-info font-bold">Role-Based Access Control</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Kiểm soát ma trận phân quyền chi tiết cho từng nhóm tài khoản, bảo vệ thông tin mật và dữ liệu tiền lương
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Chuyển đổi góc nhìn */}
            <div className="flex items-center p-1 rounded-xl bg-black/20" style={{ border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setViewMode('MATRIX')}
                className={`btn ${viewMode === 'MATRIX' ? 'btn-primary' : 'btn-outline'}`}
                style={{ height: 32, padding: '0 0.75rem', fontSize: '0.8rem', border: 'none', borderRadius: '8px' }}
              >
                <Table size={14} /> Ma Trận Đối Chiếu
              </button>
              <button 
                onClick={() => setViewMode('DETAIL')}
                className={`btn ${viewMode === 'DETAIL' ? 'btn-primary' : 'btn-outline'}`}
                style={{ height: 32, padding: '0 0.75rem', fontSize: '0.8rem', border: 'none', borderRadius: '8px' }}
              >
                <LayoutGrid size={14} /> Quản Lý Từng Vai Trò
              </button>
            </div>

            <button onClick={() => setShowAddRoleModal(true)} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <Plus size={16} />
              <span>Thêm Vai Trò Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bốn Thẻ Thống Kê Tổng Quan */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng số vai trò</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
              <Shield size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{roles.length}</div>
          <span className="text-xs text-muted">2 vai trò hệ thống, {roles.length - 2} vai trò mở rộng</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tài khoản đã gán quyền</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
              <UserCheck size={16} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {roles.reduce((sum, r) => sum + r.usersCount, 0)}
          </div>
          <span className="text-xs text-muted">Toàn bộ 151 tài khoản nhân viên & quản lý</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(234, 179, 8, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Quyền hạn hệ thống</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.12)' }}>
              <Key size={16} color="var(--warning)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>
            {totalSystemPermissions}
          </div>
          <span className="text-xs text-muted">Phân chia theo 5 khối phân hệ cốt lõi</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Bảo vệ quyền Admin</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
              <Lock size={16} color="var(--error)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)' }}>
            2 User
          </div>
          <span className="text-xs text-muted">Chỉ có 2 Super Admin nắm quyền tối cao</span>
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH THEO GÓC NHÌN */}

      {/* CHẾ ĐỘ 1: MA TRẬN ĐỐI CHIẾU PHÂN QUYỀN (PERMISSION MATRIX VIEW) */}
      {viewMode === 'MATRIX' && (
        <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
          <div className="p-4 flex items-center justify-between flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="flex items-center gap-2">
              <Table size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Bảng Ma Trận So Sánh Quyền Hạn (Permission Comparison Matrix)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} color="var(--success)" /> Có quyền
              </span>
              <span className="flex items-center gap-1">
                <XCircle size={14} color="rgba(255, 255, 255, 0.2)" /> Không có quyền
              </span>
              <span>(Click vào từng ô để Bật / Tắt quyền tức thì)</span>
            </div>
          </div>

          <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                  <th style={{ minWidth: '320px' }}>PHÂN HỆ & QUYỀN HẠN HỆ THỐNG</th>
                  {roles.map(role => (
                    <th key={role.id} className="text-center" style={{ minWidth: '150px' }}>
                      <div className="flex-col items-center gap-1">
                        <span style={{ fontWeight: 800, color: role.badgeColor, fontSize: '0.85rem' }}>
                          {role.name}
                        </span>
                        <span className="badge badge-outline text-xs" style={{ fontSize: '0.7rem' }}>
                          {role.usersCount} users
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionModules.map(module => (
                  <React.Fragment key={module.moduleName}>
                    {/* Header của từng Module */}
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                      <td colSpan={roles.length + 1} style={{ padding: '0.65rem 1rem', borderTop: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text-main)' }}>
                          {module.moduleIcon}
                          <span>{module.moduleName.toUpperCase()}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Danh sách quyền trong Module */}
                    {module.permissions.map(perm => (
                      <tr key={perm.code}>
                        <td style={{ paddingLeft: '2rem' }}>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                              {perm.label}
                            </span>
                            <span className="text-xs text-muted" style={{ fontSize: '0.75rem' }}>
                              {perm.desc}
                            </span>
                          </div>
                        </td>

                        {roles.map(role => {
                          const hasPermission = role.permissions.includes(perm.code);
                          return (
                            <td key={`${role.id}-${perm.code}`} className="text-center" style={{ verticalAlign: 'middle' }}>
                              <button
                                onClick={() => {
                                  handleTogglePermission(role.id, perm.code);
                                  toast.success(`Đã cập nhật quyền [${perm.label}] cho ${role.name}`);
                                }}
                                className="cursor-pointer"
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  padding: '0.35rem', 
                                  borderRadius: '6px',
                                  transition: 'transform 0.15s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title={`${hasPermission ? 'Bấm để Tước quyền' : 'Bấm để Cấp quyền'} cho ${role.name}`}
                              >
                                {hasPermission ? (
                                  <div className="p-1 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                                    <CheckCircle2 size={20} color="var(--success)" />
                                  </div>
                                ) : (
                                  <div className="p-1 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                                    <XCircle size={20} color="rgba(255, 255, 255, 0.25)" />
                                  </div>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: QUẢN LÝ THEO TỪNG VAI TRÒ (MASTER-DETAIL VIEW) */}
      {viewMode === 'DETAIL' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Cột Trái: Danh Sách Vai Trò */}
          <div className="col-span-4 flex-col gap-3">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Danh Sách Nhóm Quyền ({roles.length})
            </h3>
            {roles.map(role => {
              const isSelected = role.id === selectedRoleId;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`card glass p-4 cursor-pointer card-hover flex-col gap-2`}
                  style={{
                    borderRadius: '14px',
                    borderColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={18} color={role.badgeColor} />
                      <strong style={{ fontSize: '0.95rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                        {role.name}
                      </strong>
                    </div>
                    {role.isSystem && (
                      <span className="badge badge-outline text-xs">Mặc định</span>
                    )}
                  </div>

                  <p className="text-xs text-muted" style={{ margin: 0, lineHeight: 1.4 }}>
                    {role.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-xs text-muted">
                      Đã cấp: <strong style={{ color: 'var(--primary)' }}>{role.permissions.length}</strong> / {totalSystemPermissions} quyền
                    </span>
                    <span className="badge badge-info text-xs">{role.usersCount} users</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cột Phải: Bộ Quyền Chi Tiết Của Role Đang Chọn */}
          <div className="col-span-8 card glass p-5 flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="flex items-center gap-2.5">
                  <Shield size={24} color={activeRole.badgeColor} />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
                    {activeRole.name}
                  </h2>
                  <span className="badge badge-outline font-mono text-xs">{activeRole.id}</span>
                </div>
                <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
                  {activeRole.description}
                </p>
              </div>

              {!activeRole.isSystem && (
                <button 
                  onClick={() => handleDeleteRole(activeRole.id)}
                  className="btn btn-outline flex items-center gap-1.5"
                  style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)', height: 34 }}
                >
                  <Trash2 size={14} /> Xóa Vai Trò
                </button>
              )}
            </div>

            {/* Danh sách từng phân hệ quyền */}
            <div className="flex-col gap-5">
              {permissionModules.map(module => {
                const totalInModule = module.permissions.length;
                const activeInModule = module.permissions.filter(p => activeRole.permissions.includes(p.code)).length;
                const isAllActive = activeInModule === totalInModule;

                return (
                  <div key={module.moduleName} className="p-4 rounded-xl flex-col gap-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div className="flex items-center gap-2 font-bold text-sm text-main">
                        {module.moduleIcon}
                        <span>{module.moduleName}</span>
                        <span className="text-xs text-muted font-normal">({activeInModule}/{totalInModule})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleModulePermissions(module, true)}
                          className="btn btn-outline" 
                          style={{ height: 26, padding: '0 0.5rem', fontSize: '0.75rem' }}
                        >
                          Chọn tất cả
                        </button>
                        <button 
                          onClick={() => handleToggleModulePermissions(module, false)}
                          className="btn btn-outline" 
                          style={{ height: 26, padding: '0 0.5rem', fontSize: '0.75rem' }}
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {module.permissions.map(perm => {
                        const isGranted = activeRole.permissions.includes(perm.code);
                        return (
                          <div 
                            key={perm.code}
                            onClick={() => {
                              handleTogglePermission(activeRole.id, perm.code);
                              toast.success(`Đã cập nhật quyền [${perm.label}]`);
                            }}
                            className="p-3 rounded-xl cursor-pointer card-hover flex items-start gap-3"
                            style={{ 
                              backgroundColor: isGranted ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isGranted ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`
                            }}
                          >
                            <div style={{ color: isGranted ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                              {isGranted ? <CheckSquare size={17} /> : <Square size={17} />}
                            </div>
                            <div className="flex-col">
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isGranted ? '#fff' : 'var(--text-muted)' }}>
                                {perm.label}
                              </span>
                              <span className="text-xs text-muted" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                                {perm.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM ROLE MỚI (React Portal) */}
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
                    Khởi Tạo Vai Trò Người Dùng Mới
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Mở rộng nhóm phân quyền cho vị trí đặc thù</p>
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
                  Tên Vai trò mới <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Kế toán tiền lương, Chuyên viên Tuyển dụng..."
                  className="form-input"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Sao chép bộ quyền từ vai trò mẫu</label>
                <select 
                  className="form-input"
                  value={newRoleCloneFrom}
                  onChange={e => setNewRoleCloneFrom(e.target.value)}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.permissions.length} quyền)</option>
                  ))}
                </select>
                <span className="text-xs text-muted mt-1 block">
                  Vai trò mới sẽ kế thừa sẵn các quyền của vai trò này để bạn dễ dàng tinh chỉnh.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Mô tả trách nhiệm vai trò</label>
                <textarea 
                  className="form-textarea"
                  rows={3}
                  placeholder="Mô tả phạm vi công việc và lý do cấp quyền..."
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
                  <Check size={16} /> Tạo Vai Trò Ngay
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
