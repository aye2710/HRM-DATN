import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, Monitor, Smartphone, Key, Box, Plus, Search, Filter, 
  RotateCcw, CheckCircle, AlertTriangle, FileText, ArrowRight, 
  Check, X, Printer, User, DollarSign, Calendar, Eye, Trash2, Edit3, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AssetInventory = () => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAssetTarget, setAssignAssetTarget] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, empsRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/employees')
      ]);

      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (empsRes.ok) setEmployees(await empsRes.json());
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu kho tài sản:', err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Category Icon & Label
  const getCategoryInfo = (category) => {
    switch (category) {
      case 'LAPTOP':
        return { label: 'Laptop', icon: <Laptop size={16} /> };
      case 'DESKTOP':
        return { label: 'Máy tính để bàn', icon: <Box size={16} /> };
      case 'MONITOR':
        return { label: 'Màn hình', icon: <Monitor size={16} /> };
      case 'PHONE':
        return { label: 'Điện thoại/Tablet', icon: <Smartphone size={16} /> };
      case 'ACCESS_CARD':
        return { label: 'Thẻ từ ra vào', icon: <Key size={16} /> };
      default:
        return { label: 'Khác', icon: <Box size={16} /> };
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
        return <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#64748b' }}>Đã thanh lý</span>;
      case 'LOST':
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={12} /> Báo mất</span>;
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

      toast.success(editingAsset ? 'Cập nhật tài sản thành công' : 'Thêm mới tài sản vào kho thành công');
      setShowAddModal(false);
      setEditingAsset(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Complete Maintenance (1-chạm đưa máy về kho)
  const handleCompleteMaintenance = async (asset) => {
    const { value: cost } = await Swal.fire({
      title: 'Hoàn tất bảo trì thiết bị',
      html: `
        <div style="text-align: left; font-size: 0.88rem; color: #334155; margin-bottom: 0.75rem;">
          Thiết bị: <strong>[${asset.code}] ${asset.name}</strong><br/>
          Chủng loại: <strong>${asset.category}</strong> • Serial: <strong>${asset.serialNumber || '—'}</strong>
        </div>
        <div style="text-align: left; font-size: 0.82rem; color: #64748B; margin-bottom: 0.35rem;">
          Nhập chi phí sửa chữa / bảo hành thực tế (VNĐ, để 0đ nếu miễn phí):
        </div>
      `,
      input: 'number',
      inputValue: 0,
      inputAttributes: {
        min: '0',
        step: '1000'
      },
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#64748B',
      confirmButtonText: '✓ Đưa về kho',
      cancelButtonText: 'Hủy'
    });
    if (cost === undefined) return;

    try {
      const res = await fetch(`http://localhost:5000/api/assets/${asset.id}/maintenance-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceCost: Number(cost) || 0,
          condition: 'Đã hoàn tất bảo dưỡng / sửa chữa, hoạt động tốt 100%'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi cập nhật bảo trì');
      }

      toast.success(`Đã đưa tài sản [${asset.code}] về kho sẵn sàng cấp phát!`);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle Delete Asset (Xóa mềm / Chuyển thanh lý)
  const handleDeleteAsset = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển tài sản "${name}" sang trạng thái Thanh lý (Xóa mềm)?\nLịch sử cấp phát cũ sẽ được bảo toàn nguyên vẹn cho kiểm toán.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể xóa');
      }
      toast.success('Đã chuyển tài sản sang trạng thái thanh lý');
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

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Kho Thiết Bị & Tài Sản Công Ty
          </h1>
          <p className="text-muted text-sm">
            Quản lý danh mục thiết bị, số serial, cấu hình, vị trí lưu kho và tình trạng sử dụng
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

      {/* Search & Filter Toolbar */}
      <div className="card glass flex justify-between items-center" style={{ padding: '1rem' }}>
        <div className="flex gap-3 items-center" style={{ flex: 1, maxWidth: 500 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm mã tài sản, tên máy, serial, vị trí kho..." 
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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
            <option value="LOST">Đã báo mất</option>
            <option value="DISPOSED">Đã thanh lý</option>
          </select>
        </div>
      </div>

      {/* Main Inventory Table */}
      {loading ? (
        <div className="card glass flex items-center justify-center" style={{ minHeight: 250 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
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
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 28px)', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {asset.status === 'AVAILABLE' ? (
                              <button
                                className="btn btn-outline"
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', borderColor: '#bfdbfe' }}
                                title="Bàn giao thiết bị cho nhân viên (BM-01)"
                                onClick={() => openAssignModalForAsset(asset)}
                              >
                                <ArrowRight size={14} />
                              </button>
                            ) : asset.status === 'MAINTENANCE' ? (
                              <button
                                className="btn btn-outline"
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', borderColor: '#10b981' }}
                                title="Hoàn tất bảo trì / sửa xong, đưa máy về kho"
                                onClick={() => handleCompleteMaintenance(asset)}
                              >
                                <CheckCircle size={14} />
                              </button>
                            ) : (
                              <div style={{ width: 28, height: 28 }} />
                            )}
                            <button
                              className="btn btn-outline"
                              style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', borderColor: '#cbd5e1' }}
                              title="Sửa thông tin thiết bị"
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
                            {asset.status !== 'ASSIGNED' ? (
                              <button
                                className="btn btn-outline"
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', borderColor: '#fecaca' }}
                                title="Chuyển sang thanh lý / Xóa mềm"
                                onClick={() => handleDeleteAsset(asset.id, asset.name)}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <div style={{ width: 28, height: 28 }} />
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
      )}

      {/* MODAL 1: Thêm mới / Cập nhật thiết bị */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  {editingAsset ? 'Cập Nhật Thiết Bị' : 'Thêm Mới Thiết Bị Vào Kho'}
                </h2>
                <p className="text-muted text-xs">Quản lý vòng đời và nguồn gốc phần cứng của công ty</p>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Tên thiết bị / Model máy *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: MacBook Pro 14 M3 Pro 18GB/512GB"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Chủng loại tài sản *</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="LAPTOP">Laptop / Máy tính xách tay</option>
                    <option value="DESKTOP">Máy tính để bàn (PC)</option>
                    <option value="MONITOR">Màn hình máy tính</option>
                    <option value="PHONE">Điện thoại / Máy tính bảng test</option>
                    <option value="ACCESS_CARD">Thẻ từ ra vào / Chìa khóa</option>
                    <option value="OFFICE_EQUIPMENT">Thiết bị văn phòng / Máy in</option>
                    <option value="OTHER">Thiết bị khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Mã quản lý nội bộ *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TS-LAP-005"
                    className="form-input font-mono"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Số Serial / Service Tag</label>
                  <input
                    type="text"
                    placeholder="VD: C02G90XXMD6M"
                    className="form-input font-mono"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày mua / Nhập kho</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Tình trạng vật lý ban đầu</label>
                  <input
                    type="text"
                    placeholder="VD: Mới 100%, nguyên hộp kèm sạc zin"
                    className="form-input"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  />
                </div>
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

      {/* MODAL 3: BIỂU MẪU CHÍNH THỨC BM-01 (In ấn / Xem trực tiếp) */}
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
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                CÔNG TY TNHH TM DỊCH VỤ VÀ CÔNG NGHỆ LLA • BIỂU MẪU BBBG-LLA
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

            {/* Official Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'flex-start' }} className="my-2">
              <div className="text-center">
                <div className="text-xs font-bold uppercase text-gray-800 leading-tight">
                  CÔNG TY TNHH TM DỊCH VỤ VÀ CÔNG NGHỆ LLA
                </div>
                <div className="text-xs font-mono text-gray-600 mt-1">
                  Số: {viewBm01Doc.handoverDocCode || '1105/2026/BBBG-LLA'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase font-bold text-gray-800 tracking-wider">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="my-1 border-b border-gray-400 w-28 mx-auto"></div>
              </div>
            </div>

            {/* Form Title */}
            <div className="text-center my-3">
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                BIÊN BẢN BÀN GIAO TÀI SẢN
              </h2>
              <div className="text-xs italic text-gray-600 font-medium">
                (Dành cho nhân viên mới)
              </div>
            </div>

            {/* Form Intro */}
            <div className="text-xs text-gray-700 leading-relaxed">
              Hôm nay, ngày {new Date(viewBm01Doc.assignedDate).getDate()} tháng {new Date(viewBm01Doc.assignedDate).getMonth() + 1} năm {new Date(viewBm01Doc.assignedDate).getFullYear()}, tại Công ty TNHH Thương mại dịch vụ và công nghệ LLA, chúng tôi gồm:
            </div>

            {/* Parties info */}
            <div className="flex-col gap-2 text-xs text-gray-800 my-1">
              <div>
                <strong className="uppercase">1. BÊN BÀN GIAO</strong>
                <div className="pl-4 mt-1 space-y-1">
                  <div>• Họ và tên: <strong>{viewBm01Doc.handoverPerson || 'Đỗ Thị Nguyệt'}</strong></div>
                  <div>• Chức vụ: <strong>Kế toán</strong></div>
                  <div>• Bộ phận: <strong>{viewBm01Doc.handoverPersonRole || 'Hành chính – Kế toán'}</strong></div>
                </div>
              </div>

              <div>
                <strong className="uppercase">2. BÊN NHẬN BÀN GIAO</strong>
                <div className="pl-4 mt-1 space-y-1">
                  <div>• Họ và tên: <strong className="text-blue-700">{viewBm01Doc.employee?.fullName}</strong></div>
                  <div>• Chức vụ: <strong>{viewBm01Doc.employee?.position?.title || 'Nhân viên'}</strong></div>
                  <div>• Bộ phận/Phòng: <strong>{viewBm01Doc.employee?.department?.name || 'Văn phòng'}</strong></div>
                </div>
              </div>
            </div>

            {/* Asset Table */}
            <div className="my-2">
              <strong className="text-xs font-bold text-gray-900 uppercase block mb-1">
                3. NỘI DUNG BÀN GIAO THIẾT BỊ
              </strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', border: '1px solid #475569' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #475569', textAlign: 'center' }}>
                    <th style={{ padding: '6px 4px', width: 45, borderRight: '1px solid #475569' }}>STT</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #475569' }}>Tên thiết bị</th>
                    <th style={{ padding: '6px 8px', width: 140, borderRight: '1px solid #475569' }}>Mã/Seri</th>
                    <th style={{ padding: '6px 6px', width: 65, borderRight: '1px solid #475569' }}>Số lượng</th>
                    <th style={{ padding: '6px 8px', width: 85, borderRight: '1px solid #475569' }}>Tình trạng</th>
                    <th style={{ padding: '6px 8px', width: 90 }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #475569', fontWeight: 600 }}>01</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #475569', fontWeight: 500 }}>
                      {viewBm01Doc.asset?.name || 'Thiết bị'}
                    </td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #475569', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {viewBm01Doc.asset?.serialNumber || viewBm01Doc.asset?.code || '—'}
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #475569', fontWeight: 600 }}>01</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #475569' }}>
                      {viewBm01Doc.conditionOnAssign || 'Mới 100%'}
                    </td>
                    <td style={{ padding: '6px 8px', fontSize: '0.72rem', color: '#64748b' }}>
                      {viewBm01Doc.notes || ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mục 4: QUY ĐỊNH VỀ TÀI SẢN PHÁT SINH */}
            <div className="text-xs text-gray-800 leading-relaxed my-1">
              <strong className="uppercase block mb-1">4. QUY ĐỊNH VỀ TÀI SẢN PHÁT SINH</strong>
              <div className="space-y-1 pl-2">
                <div>- Trong quá trình làm việc, Công ty có thể cấp phát bổ sung tài sản, thiết bị, công cụ dụng cụ hoặc các tài sản khác phục vụ công việc cho người lao động.</div>
                <div>- Mọi tài sản được cấp phát bổ sung sau ngày ký biên bản này sẽ được ghi nhận bằng Phụ lục bàn giao tài sản có chữ ký xác nhận của các bên.</div>
                <div>- Các phụ lục được lập trong tương lai là một phần không tách rời của Biên bản bàn giao tài sản này và có giá trị pháp lý tương đương.</div>
              </div>
            </div>

            {/* Mục 5: CAM KẾT */}
            <div className="text-xs text-gray-800 leading-relaxed my-1">
              <strong className="uppercase block mb-1">5. CAM KẾT</strong>
              <div className="space-y-1 pl-2">
                <div>- Bên nhận đã kiểm tra đầy đủ các thiết bị nêu trên và xác nhận tình trạng đúng như mô tả.</div>
                <div>- Bên nhận có trách nhiệm quản lý, sử dụng, bảo quản toàn bộ tài sản được bàn giao theo biên bản này và các phụ lục phát sinh sau đó. Bên nhận chịu trách nhiệm bồi thường theo quy định của công ty nếu làm mất, hư hỏng.</div>
                <div>- Khi nghỉ việc, chuyển công tác hoặc theo yêu cầu của Công ty, bên nhận có trách nhiệm hoàn trả đầy đủ toàn bộ tài sản được ghi nhận tại biên bản này và các phụ lục kèm theo.</div>
                <div className="italic mt-1">Biên bản được lập thành 02 bản, mỗi bên giữ 01 bản và có giá trị pháp lý như nhau.</div>
              </div>
            </div>

            {/* Signature Blocks đúng mẫu 2 cột */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem', textAlign: 'center' }}>
              <div>
                <div className="font-bold text-xs uppercase text-gray-900">BÊN BÀN GIAO</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-gray-800">{viewBm01Doc.handoverPerson || 'Đỗ Thị Nguyệt'}</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase text-gray-900">BÊN NHẬN BÀN GIAO</div>
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

export default AssetInventory;
