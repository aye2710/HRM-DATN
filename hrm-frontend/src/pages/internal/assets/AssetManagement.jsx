import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, Monitor, Smartphone, Key, Box, Plus, Search, Filter, 
  RotateCcw, CheckCircle, AlertTriangle, FileText, ArrowRight, 
  Check, X, Printer, User, DollarSign, Calendar, Eye, Trash2, Edit3, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AssetManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'assignments'
  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, maintenance: 0, totalValue: 0 });
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAssetTarget, setAssignAssetTarget] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAssignmentTarget, setReturnAssignmentTarget] = useState(null);
  const [viewBm01Doc, setViewBm01Doc] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'LAPTOP',
    code: '',
    serialNumber: '',
    price: '',
    purchaseDate: '',
    supplier: '',
    condition: 'Mới 100%',
    location: 'Kho CNTT - Tầng 5',
    notes: ''
  });

  const [assignForm, setAssignForm] = useState({
    assetId: '',
    employeeId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    conditionOnAssign: 'Hoạt động tốt, nguyên tem bảo hành, đầy đủ phụ kiện',
    handoverDocCode: '',
    notes: ''
  });

  const [returnForm, setReturnForm] = useState({
    returnedDate: new Date().toISOString().split('T')[0],
    conditionOnReturn: 'Hoạt động bình thường, không trầy xước nặng',
    nextAssetStatus: 'AVAILABLE',
    notes: ''
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, assetsRes, assignmentsRes, employeesRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets/stats'),
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/assets/assignments'),
        fetch('http://localhost:5000/api/employees')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
      if (employeesRes.ok) setEmployees(await employeesRes.json());
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu tài sản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Icon & Label Helper
  const getCategoryInfo = (cat) => {
    switch (cat) {
      case 'LAPTOP': return { label: 'Laptop', icon: <Laptop size={16} className="text-primary" /> };
      case 'DESKTOP': return { label: 'Máy để bàn', icon: <Box size={16} className="text-info" /> };
      case 'MONITOR': return { label: 'Màn hình', icon: <Monitor size={16} className="text-secondary" /> };
      case 'PHONE': return { label: 'Điện thoại/Tablet', icon: <Smartphone size={16} className="text-warning" /> };
      case 'ACCESS_CARD': return { label: 'Thẻ từ / Khóa', icon: <Key size={16} className="text-purple-500" /> };
      default: return { label: 'Khác', icon: <Box size={16} /> };
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Sẵn sàng trong kho</span>;
      case 'ASSIGNED':
        return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><User size={12} /> Đang cấp phát</span>;
      case 'MAINTENANCE':
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> Bảo hành / Sửa</span>;
      case 'DISPOSED':
        return <span className="badge badge-danger">Đã thanh lý</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Handle Create / Edit Asset
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      const url = editingAsset 
        ? `http://localhost:5000/api/assets/${editingAsset.id}` 
        : 'http://localhost:5000/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi lưu thông tin');
      }

      toast.success(editingAsset ? 'Cập nhật tài sản thành công' : 'Thêm mới tài sản thành công');
      setShowAddModal(false);
      setEditingAsset(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Delete Asset
  const handleDeleteAsset = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài sản "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể xóa');
      }
      toast.success('Đã xóa tài sản');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Assign (Bàn giao BM01)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/assets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể bàn giao');
      }

      const created = await res.json();
      toast.success('Bàn giao tài sản thành công!');
      setShowAssignModal(false);
      setAssignAssetTarget(null);
      fetchData();

      // Mở ngay biên bản BM01 cho người dùng xem & in ấn
      setViewBm01Doc(created);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Return (Thu hồi)
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnAssignmentTarget) return;

    try {
      const res = await fetch(`http://localhost:5000/api/assets/assignments/${returnAssignmentTarget.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể thu hồi');
      }

      toast.success('Thu hồi và nhập lại kho thành công');
      setShowReturnModal(false);
      setReturnAssignmentTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open Handover Modal for specific asset
  const openAssignModalForAsset = (asset) => {
    setAssignAssetTarget(asset);
    setAssignForm({
      assetId: asset.id,
      employeeId: employees[0]?.id || '',
      assignedDate: new Date().toISOString().split('T')[0],
      conditionOnAssign: asset.condition || 'Hoạt động tốt, nguyên tem bảo hành',
      handoverDocCode: `BB-BG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: ''
    });
    setShowAssignModal(true);
  };

  // Filtered Assets
  const filteredAssets = assets.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Assignments
  const filteredAssignments = assignments.filter(assign => {
    const matchesStatus = assignmentStatusFilter === 'ALL' || assign.status === assignmentStatusFilter;
    const matchesSearch = 
      assign.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assign.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assign.asset?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assign.handoverDocCode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Quản Lý Tài Sản & Thiết Bị Làm Việc
          </h1>
          <p className="text-muted text-sm">
            Theo dõi danh mục trang thiết bị, cấp phát cho nhân sự mới, thu hồi khi nghỉ việc và quản lý vòng đời tài sản (Biểu mẫu BM-01)
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-outline" 
            onClick={() => {
              const availableAsset = assets.find(a => a.status === 'AVAILABLE');
              if (!availableAsset) {
                toast.error('Hiện không có thiết bị nào đang sẵn sàng trong kho!');
                return;
              }
              openAssignModalForAsset(availableAsset);
            }}
          >
            <FileText size={16} /> Lập Biên bản Bàn giao (BM-01)
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingAsset(null);
              setFormData({
                name: '',
                category: 'LAPTOP',
                code: '',
                serialNumber: '',
                price: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                supplier: '',
                condition: 'Mới 100%',
                location: 'Kho CNTT - Tầng 5',
                notes: ''
              });
              setShowAddModal(true);
            }}
          >
            <Plus size={18} /> Thêm mới thiết bị
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="card glass flex-col gap-1" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">Tổng số tài sản</span>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.total}</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)' }}>
              <Box size={20} color="var(--primary)" />
            </div>
          </div>
          <span className="text-xs text-muted">Trong danh mục tài sản</span>
        </div>

        <div className="card glass flex-col gap-1" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">Sẵn sàng cấp phát</span>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.available}</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)' }}>
              <CheckCircle size={20} color="#10b981" />
            </div>
          </div>
          <span className="text-xs text-muted">Có sẵn trong kho lưu trữ</span>
        </div>

        <div className="card glass flex-col gap-1" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">Đang cấp phát</span>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{stats.assigned}</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)' }}>
              <User size={20} color="#3b82f6" />
            </div>
          </div>
          <span className="text-xs text-muted">Đang bàn giao cho nhân sự</span>
        </div>

        <div className="card glass flex-col gap-1" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">Bảo hành / Sửa chữa</span>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{stats.maintenance}</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)' }}>
              <AlertTriangle size={20} color="#f59e0b" />
            </div>
          </div>
          <span className="text-xs text-muted">Tạm ngưng sử dụng</span>
        </div>

        <div className="card glass flex-col gap-1" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <span className="text-muted text-xs font-semibold uppercase tracking-wider">Tổng giá trị định giá</span>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6' }}>
              {(stats.totalValue || 0).toLocaleString('vi-VN')} đ
            </span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)' }}>
              <DollarSign size={20} color="#8b5cf6" />
            </div>
          </div>
          <span className="text-xs text-muted">Nguyên giá mua thiết bị</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Box size={18} /> Kho Thiết Bị & Tài Sản ({filteredAssets.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FileText size={18} /> Lịch Sử Bàn Giao & Thu Hồi ({filteredAssignments.length})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card glass flex justify-between items-center" style={{ padding: '1rem' }}>
        <div className="flex gap-3 items-center" style={{ flex: 1, maxWidth: 500 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder={activeTab === 'inventory' ? "Tìm kiếm mã tài sản, tên máy, serial, vị trí..." : "Tìm nhân viên, mã biên bản, tên máy..."} 
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {activeTab === 'inventory' ? (
          <div className="flex gap-3 items-center">
            <select 
              className="form-input" 
              style={{ width: '160px' }}
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">Tất cả chủng loại</option>
              <option value="LAPTOP">Laptop</option>
              <option value="DESKTOP">Máy tính để bàn</option>
              <option value="MONITOR">Màn hình</option>
              <option value="PHONE">Điện thoại / Tablet</option>
              <option value="ACCESS_CARD">Thẻ từ ra vào</option>
              <option value="OTHER">Khác</option>
            </select>

            <select 
              className="form-input" 
              style={{ width: '160px' }}
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng (Kho)</option>
              <option value="ASSIGNED">Đang cấp phát</option>
              <option value="MAINTENANCE">Bảo dưỡng/Sửa</option>
              <option value="DISPOSED">Đã thanh lý</option>
            </select>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <select 
              className="form-input" 
              style={{ width: '180px' }}
              value={assignmentStatusFilter} 
              onChange={(e) => setAssignmentStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả tình trạng phiếu</option>
              <option value="ACTIVE">Đang sử dụng</option>
              <option value="RETURNED">Đã hoàn trả kho</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="card glass flex items-center justify-center" style={{ minHeight: 250 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'inventory' ? (
        /* Inventory Table */
        <div className="card glass flex-col gap-4">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã & Tên Thiết Bị</th>
                  <th>Chủng loại</th>
                  <th>Số Serial / SN</th>
                  <th>Nguyên giá</th>
                  <th>Vị trí lưu kho</th>
                  <th>Tình trạng</th>
                  <th>Trạng thái</th>
                  <th>Nhân sự đang dùng</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-muted">
                      Không tìm thấy thiết bị nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map(asset => {
                    const catInfo = getCategoryInfo(asset.category);
                    const activeAssign = asset.assignments && asset.assignments[0];

                    return (
                      <tr key={asset.id}>
                        <td>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{asset.name}</span>
                            <span className="font-mono text-xs text-muted">{asset.code}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            {catInfo.icon}
                            <span>{catInfo.label}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-muted">
                            {asset.serialNumber || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                            {Number(asset.price || 0) > 0 ? `${Number(asset.price).toLocaleString('vi-VN')} đ` : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-muted">{asset.location || 'Kho'}</span>
                        </td>
                        <td>
                          <span className="text-xs text-muted" title={asset.condition}>{asset.condition || 'Bình thường'}</span>
                        </td>
                        <td>{getStatusBadge(asset.status)}</td>
                        <td>
                          {activeAssign ? (
                            <div className="flex items-center gap-2">
                              <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                                {activeAssign.employee?.avatar ? (
                                  <img src={activeAssign.employee.avatar} alt="" style={{ borderRadius: '50%' }} />
                                ) : (
                                  activeAssign.employee?.fullName?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="flex-col">
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                                  {activeAssign.employee?.fullName}
                                </span>
                                <span className="text-xs text-muted">{activeAssign.employee?.code}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted text-xs italic">Trong kho</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex gap-1 justify-end">
                            {asset.status === 'AVAILABLE' && (
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: 4 }}
                                title="Bàn giao thiết bị cho nhân viên"
                                onClick={() => openAssignModalForAsset(asset)}
                              >
                                <ArrowRight size={14} /> Bàn giao
                              </button>
                            )}
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.5rem', color: 'var(--primary)' }}
                              title="Sửa thông tin"
                              onClick={() => {
                                setEditingAsset(asset);
                                setFormData({
                                  name: asset.name,
                                  category: asset.category,
                                  code: asset.code,
                                  serialNumber: asset.serialNumber || '',
                                  price: asset.price || '',
                                  purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
                                  supplier: asset.supplier || '',
                                  condition: asset.condition || 'Mới 100%',
                                  location: asset.location || '',
                                  notes: asset.notes || ''
                                });
                                setShowAddModal(true);
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            {asset.status !== 'ASSIGNED' && (
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)' }}
                                title="Xóa tài sản"
                                onClick={() => handleDeleteAsset(asset.id, asset.name)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Assignments History Table */
        <div className="card glass flex-col gap-4">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Số Biên Bản (BM-01)</th>
                  <th>Nhân sự tiếp nhận</th>
                  <th>Thiết bị bàn giao</th>
                  <th>Mã & Serial</th>
                  <th>Ngày bàn giao</th>
                  <th>Ngày hoàn trả</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-muted">
                      Không có bản ghi bàn giao nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map(assign => (
                    <tr key={assign.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                          {assign.handoverDocCode || 'BM-01'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                            {assign.employee?.avatar ? (
                              <img src={assign.employee.avatar} alt="" style={{ borderRadius: '50%' }} />
                            ) : (
                              assign.employee?.fullName?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {assign.employee?.fullName}
                            </span>
                            <span className="text-xs text-muted">
                              {assign.employee?.department?.name || 'Văn phòng'} • {assign.employee?.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Laptop size={15} color="var(--primary)" />
                          <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            {assign.asset?.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex-col font-mono text-xs text-muted">
                          <span>{assign.asset?.code}</span>
                          <span>SN: {assign.asset?.serialNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(assign.assignedDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="text-xs text-muted">
                        {assign.returnedDate ? new Date(assign.returnedDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td>
                        {assign.status === 'ACTIVE' ? (
                          <span className="badge badge-success">Đang sử dụng</span>
                        ) : (
                          <span className="badge badge-info">Đã hoàn trả</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: 4 }}
                            title="Xem và in Biên bản bàn giao BM-01"
                            onClick={() => setViewBm01Doc(assign)}
                          >
                            <FileText size={14} /> BM-01
                          </button>
                          {assign.status === 'ACTIVE' && (
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: 4, color: 'var(--warning)', borderColor: 'var(--warning)' }}
                              title="Lập thủ tục thu hồi lại kho"
                              onClick={() => {
                                setReturnAssignmentTarget(assign);
                                setReturnForm({
                                  returnedDate: new Date().toISOString().split('T')[0],
                                  conditionOnReturn: 'Hoạt động bình thường, không nứt vỡ',
                                  nextAssetStatus: 'AVAILABLE',
                                  notes: ''
                                });
                                setShowReturnModal(true);
                              }}
                            >
                              <RotateCcw size={14} /> Thu hồi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Thêm mới / Cập nhật tài sản */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                {editingAsset ? 'Cập Nhật Thông Tin Thiết Bị' : 'Thêm Mới Thiết Bị Vào Kho'}
              </h2>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="flex-col gap-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Tên thiết bị / Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: MacBook Pro 14 M3 Pro 18GB"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Phân loại chủng loại *</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="LAPTOP">Laptop / Máy tính xách tay</option>
                    <option value="DESKTOP">Máy tính để bàn (PC)</option>
                    <option value="MONITOR">Màn hình rời</option>
                    <option value="PHONE">Điện thoại / Tablet</option>
                    <option value="ACCESS_CARD">Thẻ từ ra vào / Thẻ gửi xe</option>
                    <option value="OFFICE_EQUIPMENT">Thiết bị văn phòng khác</option>
                    <option value="OTHER">Chủng loại khác</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Mã quản lý tài sản (Để trống tự sinh)</label>
                  <input
                    type="text"
                    placeholder="VD: TS-LAP-005"
                    className="form-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Số Serial / IMEI thiết bị</label>
                  <input
                    type="text"
                    placeholder="VD: C02G90XXMD6M"
                    className="form-input"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Nguyên giá mua (VNĐ)</label>
                  <input
                    type="number"
                    placeholder="VD: 35000000"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày mua / Nhập kho</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Nhà cung cấp / Đại lý</label>
                  <input
                    type="text"
                    placeholder="VD: FPT Synnex, Phong Vũ..."
                    className="form-input"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Vị trí lưu kho ban đầu</label>
                  <input
                    type="text"
                    placeholder="VD: Kho CNTT - Tủ A1"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Tình trạng vật lý ban đầu</label>
                <input
                  type="text"
                  placeholder="VD: Mới 100%, nguyên hộp kèm sạc cáp zin"
                  className="form-input"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Ghi chú thêm</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú cấu hình chi tiết, thời hạn bảo hành..."
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAsset ? 'Lưu thay đổi' : 'Thêm vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Bàn giao thiết bị cho Nhân sự (Lập Biên bản BM-01) */}
      {showAssignModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  Lập Biên Bản Bàn Giao Tài Sản (BM-01)
                </h2>
                <p className="text-muted text-xs">Cấp phát trang thiết bị làm việc chính thức cho nhân sự</p>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex-col gap-4">
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Laptop size={16} color="var(--primary)" />
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                    {assignAssetTarget?.name}
                  </span>
                </div>
                <div className="text-xs text-muted flex gap-4">
                  <span>Mã TS: <strong>{assignAssetTarget?.code}</strong></span>
                  <span>Serial: <strong>{assignAssetTarget?.serialNumber || 'Không có'}</strong></span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Nhân sự nhận bàn giao *</label>
                <select
                  required
                  className="form-input"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                >
                  <option value="">-- Chọn nhân viên tiếp nhận --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'Văn phòng'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Số biên bản bàn giao (BM-01)</label>
                  <input
                    type="text"
                    required
                    className="form-input font-mono"
                    value={assignForm.handoverDocCode}
                    onChange={(e) => setAssignForm({ ...assignForm, handoverDocCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày bàn giao</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={assignForm.assignedDate}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Tình trạng thiết bị khi bàn giao</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={assignForm.conditionOnAssign}
                  onChange={(e) => setAssignForm({ ...assignForm, conditionOnAssign: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Ghi chú bàn giao / Phụ kiện kèm theo</label>
                <textarea
                  rows="2"
                  placeholder="Bao gồm: Củ sạc zin 67W, cáp MagSafe, túi chống sốc..."
                  className="form-input"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: 6 }}>
                  <Check size={16} /> Xác nhận bàn giao & Xuất BM-01
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Thu hồi tài sản (Khi nhân viên nghỉ việc hoặc đổi máy) */}
      {showReturnModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '540px' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  Thu Hồi & Nhập Lại Kho Tài Sản
                </h2>
                <p className="text-muted text-xs">Áp dụng trong quy trình thôi việc hoặc điều chuyển thiết bị</p>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowReturnModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="flex-col gap-4">
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-main)' }}>
                  {returnAssignmentTarget?.asset?.name} ({returnAssignmentTarget?.asset?.code})
                </div>
                <div className="text-xs text-muted">
                  Người đang sử dụng: <strong>{returnAssignmentTarget?.employee?.fullName}</strong> ({returnAssignmentTarget?.employee?.code})
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày hoàn trả</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={returnForm.returnedDate}
                    onChange={(e) => setReturnForm({ ...returnForm, returnedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Trạng thái kho sau thu hồi</label>
                  <select
                    className="form-input"
                    value={returnForm.nextAssetStatus}
                    onChange={(e) => setReturnForm({ ...returnForm, nextAssetStatus: e.target.value })}
                  >
                    <option value="AVAILABLE">Sẵn sàng cấp tiếp (Còn tốt)</option>
                    <option value="MAINTENANCE">Cần bảo dưỡng / Sửa chữa</option>
                    <option value="DISPOSED">Thanh lý / Hủy bỏ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Tình trạng thiết bị khi nhận lại</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Máy hoạt động bình thường, sạc cáp đầy đủ"
                  className="form-input"
                  value={returnForm.conditionOnReturn}
                  onChange={(e) => setReturnForm({ ...returnForm, conditionOnReturn: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Ghi chú kiểm tra</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú thêm nếu phát hiện xước, hư hỏng linh kiện..."
                  className="form-input"
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowReturnModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: 6, background: '#f59e0b', borderColor: '#f59e0b' }}>
                  <RotateCcw size={16} /> Hoàn tất thu hồi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: BIỂU MẪU CHÍNH THỨC BM-01 (In ấn / Xem trực tiếp) */}
      {viewBm01Doc && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card flex-col gap-4 animate-scale-up" style={{
            width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto',
            background: '#ffffff', color: '#1e293b', padding: '2.5rem'
          }}>
            {/* Action Bar (Top) */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Hệ thống Quản Trị Nhân Sự Doanh Nghiệp • Biểu mẫu chuẩn BM-01
              </span>
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary" 
                  style={{ gap: 6, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> In Biên bản
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#64748b', borderColor: '#cbd5e1' }}
                  onClick={() => setViewBm01Doc(null)}
                >
                  <X size={16} /> Đóng
                </button>
              </div>
            </div>

            {/* Official Form Header */}
            <div className="text-center my-2">
              <div className="text-xs uppercase font-bold text-gray-500 tracking-widest">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-xs font-semibold text-gray-600">Độc lập - Tự do - Hạnh phúc</div>
              <div className="my-2 border-b border-gray-300 w-32 mx-auto"></div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900 mt-4">
                BIÊN BẢN BÀN GIAO THIẾT BỊ VÀ TÀI SẢN
              </h2>
              <div className="text-xs italic text-gray-500 font-mono mt-1">
                (Số biên bản: {viewBm01Doc.handoverDocCode || 'BM-01-2026'})
              </div>
            </div>

            {/* Form Intro */}
            <div className="text-sm text-gray-700 leading-relaxed my-2">
              Hôm nay, ngày {new Date(viewBm01Doc.assignedDate).getDate()} tháng {new Date(viewBm01Doc.assignedDate).getMonth() + 1} năm {new Date(viewBm01Doc.assignedDate).getFullYear()}, tại Văn phòng Công ty, chúng tôi tiến hành bàn giao trang thiết bị làm việc với các nội dung sau:
            </div>

            {/* Parties info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div className="flex-col gap-1 text-xs">
                <strong className="text-gray-900 uppercase">BÊN GIAO (BỘ PHẬN IT / HÀNH CHÍNH):</strong>
                <div>Đại diện: <strong>Bộ phận Quản trị Thiết bị CNTT</strong></div>
                <div>Phòng ban: Khối Vận hành Doanh nghiệp</div>
              </div>
              <div className="flex-col gap-1 text-xs">
                <strong className="text-gray-900 uppercase">BÊN NHẬN (NGƯỜI LAO ĐỘNG):</strong>
                <div>Họ và tên: <strong className="text-blue-700">{viewBm01Doc.employee?.fullName}</strong></div>
                <div>Mã nhân viên: <strong>{viewBm01Doc.employee?.code}</strong></div>
                <div>Phòng ban: <strong>{viewBm01Doc.employee?.department?.name || 'Văn phòng'}</strong></div>
              </div>
            </div>

            {/* Asset Table */}
            <div className="my-3">
              <strong className="text-xs font-bold text-gray-800 uppercase block mb-2">CHI TIẾT TRANG THIẾT BỊ BÀN GIAO:</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>STT</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Tên thiết bị</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Mã tài sản</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Số Serial</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Tình trạng khi bàn giao</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>01</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>
                      {viewBm01Doc.asset?.name}
                    </td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                      {viewBm01Doc.asset?.code}
                    </td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                      {viewBm01Doc.asset?.serialNumber || '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {viewBm01Doc.conditionOnAssign || 'Hoạt động tốt, nguyên tem'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Responsibilities */}
            <div className="text-xs text-gray-600 leading-relaxed bg-amber-50 p-3 rounded border border-amber-200">
              <strong>Cam kết của người nhận bàn giao:</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Bảo quản và sử dụng đúng mục đích phục vụ công việc của Công ty.</li>
                <li>Không tự ý tháo dỡ linh kiện, cài đặt phần mềm không bản quyền hoặc chuyển giao cho bên thứ ba.</li>
                <li>Hoàn trả lại toàn bộ thiết bị nguyên trạng cho Bộ phận IT khi kết thúc hợp đồng lao động hoặc có yêu cầu thu hồi.</li>
              </ul>
            </div>

            {/* Signature Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', textAlign: 'center' }}>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">ĐẠI DIỆN BÊN GIAO (IT / HR)</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-gray-700">Bộ phận Quản Trị Hệ Thống</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">NGƯỜI NHẬN BÀN GIAO</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-blue-700">{viewBm01Doc.employee?.fullName}</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default AssetManagement;
