import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, Monitor, Smartphone, Key, Box, Plus, Search, Filter, 
  RotateCcw, CheckCircle, AlertTriangle, FileText, ArrowRight, 
  Check, X, Printer, User, DollarSign, Calendar, Eye, Trash2, Edit3, ShieldAlert, Sparkles, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AssetAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('ALL');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAssignmentTarget, setReturnAssignmentTarget] = useState(null);
  const [viewBm01Doc, setViewBm01Doc] = useState(null);
  const [viewBm02Doc, setViewBm02Doc] = useState(null);

  // Form bàn giao theo danh sách Onboarding (Chuẩn Công ty LLA)
  const [handoverForm, setHandoverForm] = useState({
    employeeId: '',
    handoverDocCode: '',
    assignedDate: new Date().toISOString().split('T')[0],
    handoverPerson: 'Đỗ Thị Nguyệt',
    handoverPersonRole: 'Hành chính - Kế toán',
    notes: '',
    items: []
  });

  // Form thu hồi BM-02
  const [returnForm, setReturnForm] = useState({
    returnedDate: new Date().toISOString().split('T')[0],
    conditionOnReturn: 'Hoạt động bình thường, không nứt vỡ',
    nextAssetStatus: 'AVAILABLE',
    notes: '',
    hasCompensation: false,
    compensationAmount: '',
    compensationReason: '',
    securityWiped: true,
    dataWipeNotes: 'Đã sao lưu bàn giao và xóa sạch dữ liệu công vụ theo NĐ 13/2023/NĐ-CP'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, assignsRes, empsRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/assets/assignments'),
        fetch('http://localhost:5000/api/employees')
      ]);

      const [assetsData, assignsData, empsData] = await Promise.all([
        assetsRes.json(),
        assignsRes.json(),
        empsRes.json()
      ]);

      if (Array.isArray(assetsData)) setAssets(assetsData);
      if (Array.isArray(assignsData)) setAssignments(assignsData);
      if (Array.isArray(empsData)) setEmployees(empsData);
    } catch (err) {
      console.error('Failed to fetch asset assignments data:', err);
      toast.error('Lỗi khi tải dữ liệu bàn giao tài sản');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal lập biên bản bàn giao Onboarding mới
  const openAssignModal = () => {
    const defaultEmp = employees[0]?.id || '';
    const generatedDocCode = `${Math.floor(1000 + Math.random() * 9000)}/2026/BBBG-LLA`;
    
    setHandoverForm({
      employeeId: defaultEmp,
      handoverDocCode: generatedDocCode,
      assignedDate: new Date().toISOString().split('T')[0],
      handoverPerson: 'Đỗ Thị Nguyệt',
      handoverPersonRole: 'Hành chính - Kế toán',
      notes: '',
      items: [
        {
          id: Date.now(),
          name: 'Bộ máy tính (Mainboard X99H DDR4, CPU Xeon E5-2680v4, Tản AM404, RAM 32GB ECC, SSD 500GB, HDD 500GB, VGA M4000 8GB, Nguồn 700W, Case Xeon)',
          serial: 'PC-XEON-LLA-01',
          quantity: 1,
          condition: 'Mới / 2ND',
          notes: ''
        },
        {
          id: Date.now() + 1,
          name: 'Màn hình E-Dra (27 inch - IPS - FHD - 120Hz)',
          serial: 'EDRA-27-01, EDRA-27-02',
          quantity: 2,
          condition: 'Mới',
          notes: ''
        },
        {
          id: Date.now() + 2,
          name: 'Giá đỡ 2 màn hình North Bayou F160',
          serial: 'NB-F160',
          quantity: 1,
          condition: 'Mới',
          notes: ''
        },
        {
          id: Date.now() + 3,
          name: 'Bàn phím chuột + lót EDRA',
          serial: 'EDRA-COMBO',
          quantity: 1,
          condition: 'Mới',
          notes: ''
        },
        {
          id: Date.now() + 4,
          name: 'Tài khoản cá nhân (Tài khoản domain: user.domain | Email: user@lla.net.vn)',
          serial: 'Tài khoản công vụ',
          quantity: 1,
          condition: 'Cấp mới',
          notes: 'Mật khẩu khởi tạo gửi riêng'
        }
      ]
    });
    setShowAssignModal(true);
  };

  // Nạp bộ combo mẫu chuẩn của công ty LLA
  const loadLLAStandardKit = () => {
    const selectedEmp = employees.find(e => e.id === handoverForm.employeeId);
    const empEmail = selectedEmp?.email || 'nhanvien@lla.net.vn';
    const domainUser = selectedEmp?.code ? selectedEmp.code.toLowerCase() : 'anhntn';

    setHandoverForm(prev => ({
      ...prev,
      items: [
        {
          id: Date.now(),
          name: 'Bộ máy tính (Mainboard X99H DDR4, CPU Xeon E5-2680v4, Tản AM404, RAM 32GB ECC, SSD 500GB, HDD 500GB, VGA M4000 8GB, Nguồn 700W, Case Xeon)',
          serial: 'PC-XEON-LLA-01',
          quantity: 1,
          condition: 'Mới / 2ND',
          notes: ''
        },
        {
          id: Date.now() + 1,
          name: 'Màn hình E-Dra (27 inch - IPS - FHD - 120Hz)',
          serial: 'EDRA-27-01, EDRA-27-02',
          quantity: 2,
          condition: 'Mới',
          notes: 'Kèm dây nguồn và cáp DisplayPort'
        },
        {
          id: Date.now() + 2,
          name: 'Giá đỡ 2 màn hình North Bayou F160',
          serial: 'NB-F160',
          quantity: 1,
          condition: 'Mới',
          notes: 'Nguyên hộp đầy đủ ốc vít kẹp bàn'
        },
        {
          id: Date.now() + 3,
          name: 'Bàn phím chuột + lót EDRA',
          serial: 'EDRA-COMBO',
          quantity: 1,
          condition: 'Mới',
          notes: 'Phím cơ + chuột quang + pad full size'
        },
        {
          id: Date.now() + 4,
          name: `Tài khoản cá nhân (Domain: ${domainUser} | Email: ${empEmail})`,
          serial: domainUser,
          quantity: 1,
          condition: 'Hoạt động tốt',
          notes: 'Đã kích hoạt quyền truy cập hệ thống'
        }
      ]
    }));
    toast.success('Đã nạp bộ Combo thiết bị Onboarding chuẩn Công ty LLA!');
  };

  // Thêm 1 dòng thiết bị vào danh sách bàn giao
  const handleAddItem = () => {
    setHandoverForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          name: '',
          serial: '',
          quantity: 1,
          condition: 'Mới 100%',
          notes: ''
        }
      ]
    }));
  };

  // Cập nhật giá trị 1 dòng thiết bị
  const handleItemChange = (index, field, value) => {
    const updated = [...handoverForm.items];
    updated[index][field] = value;
    setHandoverForm({ ...handoverForm, items: updated });
  };

  // Xóa 1 dòng thiết bị
  const handleRemoveItem = (index) => {
    const updated = handoverForm.items.filter((_, i) => i !== index);
    setHandoverForm({ ...handoverForm, items: updated });
  };

  // Chọn nhanh thiết bị từ Kho tài sản có sẵn
  const handlePickFromWarehouse = (index, assetId) => {
    const found = assets.find(a => a.id === assetId);
    if (!found) return;
    const updated = [...handoverForm.items];
    updated[index] = {
      ...updated[index],
      assetId: found.id,
      name: found.name,
      serial: found.serialNumber || found.code,
      quantity: 1,
      condition: found.condition || 'Mới 100%',
      notes: `Vị trí kho: ${found.location || 'Kho CNTT'}`
    };
    setHandoverForm({ ...handoverForm, items: updated });
  };

  // Submit Lập biên bản bàn giao Onboarding (BM-01)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!handoverForm.employeeId) {
      toast.error('Vui lòng chọn nhân sự tiếp nhận bàn giao');
      return;
    }
    if (handoverForm.items.length === 0) {
      toast.error('Vui lòng nhập ít nhất một thiết bị hoặc tài sản bàn giao');
      return;
    }

    try {
      const payload = {
        employeeId: handoverForm.employeeId,
        handoverDocCode: handoverForm.handoverDocCode,
        assignedDate: handoverForm.assignedDate,
        handoverPerson: handoverForm.handoverPerson,
        handoverPersonRole: handoverForm.handoverPersonRole,
        notes: handoverForm.notes,
        items: handoverForm.items,
        conditionOnAssign: 'Đã kiểm tra hoạt động tốt, đúng tình trạng mô tả trong biên bản'
      };

      const res = await fetch('http://localhost:5000/api/assets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể lập biên bản bàn giao');
      }

      const created = await res.json();
      toast.success('Đã lập Biên bản bàn giao tài sản Onboarding thành công!');
      setShowAssignModal(false);
      fetchData();

      // Mở ngay biên bản BM-01 chuẩn LLA để xem & in
      setViewBm01Doc(created);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Submit Thu hồi BM-02
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnAssignmentTarget) return;

    try {
      const res = await fetch(`http://localhost:5000/api/assets/assignments/${returnAssignmentTarget.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnedDate: returnForm.returnedDate,
          conditionOnReturn: returnForm.conditionOnReturn,
          notes: returnForm.notes,
          nextAssetStatus: returnForm.nextAssetStatus,
          compensationAmount: returnForm.hasCompensation ? Number(returnForm.compensationAmount || 0) : 0,
          compensationReason: returnForm.hasCompensation ? returnForm.compensationReason : null,
          securityWiped: returnForm.securityWiped,
          dataWipeNotes: returnForm.dataWipeNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể thu hồi');
      }

      const data = await res.json();
      toast.success('Thu hồi và nhập lại kho thành công');
      setShowReturnModal(false);
      fetchData();

      if (data.assignment) {
        setViewBm02Doc({
          ...returnAssignmentTarget,
          ...data.assignment
        });
      }
      setReturnAssignmentTarget(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Parse items list helper
  const parseItems = (assign) => {
    if (!assign) return [];
    if (assign.itemsJson) {
      try {
        const parsed = JSON.parse(assign.itemsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Parse itemsJson error:', e);
      }
    }
    // Fallback nếu là bản ghi đơn lẻ
    if (assign.asset) {
      return [{
        name: assign.asset.name,
        serial: assign.asset.serialNumber || assign.asset.code,
        quantity: 1,
        condition: assign.conditionOnAssign || 'Mới 100%',
        notes: ''
      }];
    }
    return [];
  };

  // Filtered Assignments
  const filteredAssignments = assignments.filter(assign => {
    const matchesStatus = assignmentStatusFilter === 'ALL' || assign.status === assignmentStatusFilter;
    const itemsList = parseItems(assign);
    const itemsText = itemsList.map(i => i.name).join(' ');
    const matchesSearch = 
      assign.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assign.handoverDocCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemsText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assign.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header - Không dùng card metric */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Bàn Giao & Thu Hồi Thiết Bị (Onboarding)
          </h1>
          <p className="text-muted text-sm">
            Quản lý cấp phát trọn bộ thiết bị làm việc cho nhân viên mới (Biểu mẫu BBBG-LLA), thu hồi khi thôi việc và xử lý bồi thường
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-primary" 
            style={{ gap: 8, padding: '0.55rem 1.15rem' }}
            onClick={openAssignModal}
          >
            <Sparkles size={18} /> Lập Biên bản Bàn giao Onboarding (BM-01)
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="card glass flex items-center justify-between gap-4" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1" style={{ maxWidth: 450 }}>
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm theo số biên bản, họ tên nhân viên, thiết bị trong gói bàn giao..."
              className="form-input"
              style={{ paddingLeft: 36, width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted" />
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 170 }}
              value={assignmentStatusFilter}
              onChange={(e) => setAssignmentStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang sử dụng (Chưa trả)</option>
              <option value="RETURNED">Đã hoàn trả / Thu hồi</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted">
          Tổng số hồ sơ: <strong>{filteredAssignments.length}</strong>
        </div>
      </div>

      {/* Assignments History Table */}
      <div className="card glass flex-col gap-4">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Số Biên Bản (BBBG-LLA)</th>
                <th>Nhân sự nhận bàn giao</th>
                <th>Danh mục thiết bị & Công cụ cấp phát</th>
                <th>Người đại diện bàn giao</th>
                <th>Ngày bàn giao</th>
                <th>Trạng thái</th>
                <th>Ghi chú / Bồi thường</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted">
                    Đang tải dữ liệu hồ sơ bàn giao...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted">
                    Chưa có biên bản bàn giao nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(assign => {
                  const itemsList = parseItems(assign);
                  const firstItem = itemsList[0];
                  const remainingCount = itemsList.length - 1;

                  return (
                    <tr key={assign.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                          {assign.handoverDocCode || 'BBBG-LLA'}
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
                              {assign.employee?.position?.title || 'Nhân sự'} • {assign.employee?.department?.name || 'Văn phòng'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Laptop size={15} color="var(--primary)" />
                            <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {firstItem ? firstItem.name : (assign.asset?.name || 'Gói thiết bị làm việc')}
                            </span>
                          </div>
                          {remainingCount > 0 && (
                            <span className="badge badge-info" style={{ alignSelf: 'flex-start', fontSize: '0.7rem', padding: '2px 6px' }}>
                              + {remainingCount} hạng mục khác (Màn hình, Arm, Phím chuột, Email...)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex-col text-xs">
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {assign.handoverPerson || 'Đỗ Thị Nguyệt'}
                          </span>
                          <span className="text-muted">
                            {assign.handoverPersonRole || 'Hành chính - Kế toán'}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(assign.assignedDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        {assign.status === 'ACTIVE' ? (
                          <span className="badge badge-success">Đang sử dụng</span>
                        ) : (
                          <span className="badge badge-info">Đã hoàn trả</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 text-xs">
                          {Number(assign.compensationAmount || 0) > 0 && (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              Bồi thường: {Number(assign.compensationAmount).toLocaleString('vi-VN')} đ
                            </span>
                          )}
                          {assign.securityWiped && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem', color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}>
                              ✓ Đã xóa dữ liệu
                            </span>
                          )}
                          {Number(assign.compensationAmount || 0) === 0 && !assign.securityWiped && (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 28px)', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            className="btn btn-outline"
                            style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', borderColor: '#bfdbfe' }}
                            title="Xem và in Biên bản bàn giao BBBG-LLA"
                            onClick={() => setViewBm01Doc(assign)}
                          >
                            <FileText size={14} />
                          </button>
                          {assign.status === 'RETURNED' ? (
                            <button
                              className="btn btn-outline"
                              style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', borderColor: '#38bdf8' }}
                              title="Xem và in Biên bản thu hồi BM-02"
                              onClick={() => setViewBm02Doc(assign)}
                            >
                              <FileCheck size={14} />
                            </button>
                          ) : assign.status === 'ACTIVE' ? (
                            <button
                              className="btn btn-outline"
                              style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', borderColor: '#fde68a' }}
                              title="Lập thủ tục thu hồi lại kho khi thôi việc"
                              onClick={() => {
                                setReturnAssignmentTarget(assign);
                                setReturnForm({
                                  returnedDate: new Date().toISOString().split('T')[0],
                                  conditionOnReturn: 'Hoạt động bình thường, không nứt vỡ',
                                  nextAssetStatus: 'AVAILABLE',
                                  notes: '',
                                  hasCompensation: false,
                                  compensationAmount: '',
                                  compensationReason: '',
                                  securityWiped: true,
                                  dataWipeNotes: 'Đã sao lưu bàn giao và xóa sạch dữ liệu công vụ theo NĐ 13/2023/NĐ-CP'
                                });
                                setShowReturnModal(true);
                              }}
                            >
                              <RotateCcw size={14} />
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

      {/* MODAL 1: LẬP BIÊN BẢN BÀN GIAO THEO DANH SÁCH (DÀNH CHO NHÂN VIÊN MỚI ONBOARD) */}
      {showAssignModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <FileText size={20} color="var(--primary)" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  Lập Biên Bản Bàn Giao Tài Sản (Dành cho nhân viên mới Onboard)
                </h2>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex-col gap-4">
              {/* Phần 1: Thông tin nhân sự & Bên bàn giao */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">1. Nhân viên mới nhận bàn giao (Bên nhận) *</label>
                  <select
                    required
                    className="form-input"
                    value={handoverForm.employeeId}
                    onChange={(e) => setHandoverForm({ ...handoverForm, employeeId: e.target.value })}
                  >
                    <option value="">-- Chọn nhân viên mới onboard --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.code}) — {emp.position?.title || 'Nhân viên'} / {emp.department?.name || 'Văn phòng'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">2. Số biên bản bàn giao (Biểu mẫu LLA)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 1105/2026/BBBG-LLA"
                    className="form-input font-mono"
                    value={handoverForm.handoverDocCode}
                    onChange={(e) => setHandoverForm({ ...handoverForm, handoverDocCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Đại diện bên bàn giao (Họ và tên)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đỗ Thị Nguyệt"
                    className="form-input"
                    value={handoverForm.handoverPerson}
                    onChange={(e) => setHandoverForm({ ...handoverForm, handoverPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Bộ phận / Chức vụ bên giao</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hành chính - Kế toán"
                    className="form-input"
                    value={handoverForm.handoverPersonRole}
                    onChange={(e) => setHandoverForm({ ...handoverForm, handoverPersonRole: e.target.value })}
                  />
                </div>
              </div>

              {/* Phần 2: Thanh công cụ danh mục thiết bị */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    3. Danh mục trang thiết bị, phụ kiện & tài khoản bàn giao ({handoverForm.items.length} món)
                  </h3>
                  <span className="text-xs text-muted">
                    Có thể nạp nhanh mẫu Combo Onboarding chuẩn của công ty hoặc tự thêm các dòng linh kiện.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', gap: 6, color: '#0284c7', borderColor: '#38bdf8', padding: '0.35rem 0.75rem' }}
                    onClick={loadLLAStandardKit}
                  >
                    <Sparkles size={14} /> Nạp Combo Onboarding chuẩn LLA
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', gap: 4, padding: '0.35rem 0.75rem' }}
                    onClick={handleAddItem}
                  >
                    <Plus size={14} /> Thêm dòng
                  </button>
                </div>
              </div>

              {/* Bảng danh sách thiết bị bàn giao */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ width: 40, textAlign: 'center', padding: '8px 6px' }}>STT</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px' }}>Tên thiết bị / Hạng mục *</th>
                      <th style={{ width: 140, textAlign: 'left', padding: '8px 10px' }}>Mã / Seri</th>
                      <th style={{ width: 70, textAlign: 'center', padding: '8px 6px' }}>Số lượng</th>
                      <th style={{ width: 110, textAlign: 'left', padding: '8px 10px' }}>Tình trạng</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px' }}>Ghi chú</th>
                      <th style={{ width: 40, textAlign: 'center', padding: '8px 6px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {handoverForm.items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-muted">
                          Chưa có thiết bị nào. Hãy bấm "Nạp Combo Onboarding chuẩn LLA" hoặc "Thêm dòng".
                        </td>
                      </tr>
                    ) : (
                      handoverForm.items.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <div className="flex-col gap-1">
                              <input
                                type="text"
                                required
                                placeholder="Tên máy, linh kiện, màn hình..."
                                className="form-input"
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                                value={item.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              />
                              {/* Chọn nhanh từ kho nếu muốn */}
                              <div className="flex items-center gap-1 text-xs text-muted">
                                <span>Hoặc chọn từ kho:</span>
                                <select 
                                  className="text-xs" 
                                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', outline: 'none' }}
                                  onChange={(e) => handlePickFromWarehouse(idx, e.target.value)}
                                >
                                  <option value="">-- Kho sẵn sàng --</option>
                                  {assets.filter(a => a.status === 'AVAILABLE').map(a => (
                                    <option key={a.id} value={a.id}>
                                      [{a.code}] {a.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              placeholder="Số Seri / Tag"
                              className="form-input font-mono"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                              value={item.serial}
                              onChange={(e) => handleItemChange(idx, 'serial', e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              required
                              className="form-input text-center"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.2rem', width: '100%' }}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value) || 1)}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              placeholder="Mới / 2ND..."
                              className="form-input"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                              value={item.condition}
                              onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              placeholder="Ghi chú thêm..."
                              className="form-input"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                              value={item.notes}
                              onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.25rem', border: 'none', color: 'var(--danger)' }}
                              onClick={() => handleRemoveItem(idx)}
                              title="Xóa dòng"
                            >
                              <X size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phần 3: Ghi chú bàn giao & Điều khoản */}
              <div className="text-xs text-muted" style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem', borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <strong>Căn cứ pháp lý biên bản bàn giao:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Biên bản bàn giao chuẩn theo Biểu mẫu công ty (Mục 4 Tài sản phát sinh & Mục 5 Cam kết bồi thường).</li>
                  <li>Là cơ sở để Người lao động chịu trách nhiệm bảo quản và hoàn trả đầy đủ khi nghỉ việc hoặc chuyển công tác.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: 6, padding: '0.5rem 1.25rem' }}>
                  <Check size={16} /> Xác nhận bàn giao & In Biên bản (BBBG-LLA)
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: THU HỒI THIẾT BỊ BM-02 (CÓ BỒI THƯỜNG & AN TOÀN DỮ LIỆU) */}
      {showReturnModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <RotateCcw size={20} color="var(--warning)" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  Thu Hồi & Nhập Lại Kho Thiết Bị (BM-02)
                </h2>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowReturnModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="flex-col gap-4">
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-main)' }}>
                  Biên bản gốc: <strong>{returnAssignmentTarget?.handoverDocCode}</strong>
                </div>
                <div className="text-xs text-muted">
                  Người đang sử dụng: <strong>{returnAssignmentTarget?.employee?.fullName}</strong> ({returnAssignmentTarget?.employee?.code}) — {returnAssignmentTarget?.employee?.department?.name || 'Văn phòng'}
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
                    <option value="LOST">Báo mất thiết bị (Không thu hồi được)</option>
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

              {/* Bồi thường thiệt hại (Điều 129 BLLĐ 2019) */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.85rem', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs" style={{ color: '#dc2626' }}>
                  <input 
                    type="checkbox" 
                    checked={returnForm.hasCompensation}
                    onChange={(e) => setReturnForm({ ...returnForm, hasCompensation: e.target.checked })}
                  />
                  <span>Phát sinh trách nhiệm vật chất / Bồi thường thiệt hại (Điều 129 BLLĐ 2019)</span>
                </label>

                {returnForm.hasCompensation && (
                  <div className="flex-col gap-2 mt-3 pt-2 border-t border-red-200">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Số tiền bồi thường thỏa thuận (VNĐ) *</label>
                      <input 
                        type="number"
                        placeholder="VD: 2500000"
                        className="form-input"
                        value={returnForm.compensationAmount}
                        onChange={(e) => setReturnForm({ ...returnForm, compensationAmount: e.target.value })}
                        required={returnForm.hasCompensation}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Căn cứ & Lý do bồi thường</label>
                      <input 
                        type="text"
                        placeholder="VD: Vỡ góc màn hình do làm rơi, khấu trừ vào lương tháng cuối"
                        className="form-input"
                        value={returnForm.compensationReason}
                        onChange={(e) => setReturnForm({ ...returnForm, compensationReason: e.target.value })}
                        required={returnForm.hasCompensation}
                      />
                    </div>
                    <span className="text-xs text-muted italic">
                      * Khoản bồi thường sẽ được kẹp vào Biên bản BM-02 làm căn cứ kế toán khấu trừ lương thôi việc (không quá 30% lương theo Điều 102 BLLĐ 2019).
                    </span>
                  </div>
                )}
              </div>

              {/* An toàn thông tin & Dữ liệu (Nghị định 13/2023/NĐ-CP) */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.85rem', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs" style={{ color: '#059669' }}>
                  <input 
                    type="checkbox" 
                    checked={returnForm.securityWiped}
                    onChange={(e) => setReturnForm({ ...returnForm, securityWiped: e.target.checked })}
                  />
                  <span>Xác nhận An toàn Thông tin & Bảo vệ Dữ liệu (Nghị định 13/2023/NĐ-CP)</span>
                </label>
                <div className="text-xs text-gray-600 mt-2 pl-5 space-y-1">
                  <div>✓ Đã thu hồi toàn bộ tài khoản công vụ (Google Workspace, Slack, VPN, GitHub)</div>
                  <div>✓ Đã sao lưu dữ liệu công việc và tiến hành xóa sạch dữ liệu (Remote Wipe / Factory Reset) trên máy</div>
                </div>
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
                  <RotateCcw size={16} /> Hoàn tất thu hồi & Xuất BM-02
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: BIỂU MẪU CHUẨN CÔNG TY LLA - BIÊN BẢN BÀN GIAO TÀI SẢN (DÀNH CHO NHÂN VIÊN MỚI) */}
      {viewBm01Doc && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card flex-col gap-4 animate-scale-up" style={{
            width: '100%', maxWidth: '820px', maxHeight: '94vh', overflowY: 'auto',
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

            {/* Official Header đúng theo ảnh công ty LLA */}
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

            {/* Intro */}
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
                  <div>• Họ và tên: <strong className="text-blue-700" style={{ fontSize: '0.85rem' }}>{viewBm01Doc.employee?.fullName}</strong></div>
                  <div>• Chức vụ: <strong>{viewBm01Doc.employee?.position?.title || 'Intern BA'}</strong></div>
                  <div>• Bộ phận/Phòng: <strong>{viewBm01Doc.employee?.department?.name || 'Lập trình'}</strong></div>
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
                  {parseItems(viewBm01Doc).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #475569', fontWeight: 600 }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '6px 8px', borderRight: '1px solid #475569', fontWeight: 500 }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '6px 8px', borderRight: '1px solid #475569', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {item.serial || '—'}
                      </td>
                      <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #475569', fontWeight: 600 }}>
                        {String(item.quantity).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #475569' }}>
                        {item.condition || 'Mới'}
                      </td>
                      <td style={{ padding: '6px 8px', fontSize: '0.72rem', color: '#64748b' }}>
                        {item.notes || ''}
                      </td>
                    </tr>
                  ))}
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

      {/* MODAL 4: BIỂU MẪU THU HỒI BM-02 */}
      {viewBm02Doc && createPortal(
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
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Hệ thống Quản Trị Doanh Nghiệp • Biểu mẫu chuẩn BM-02
              </span>
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary" 
                  style={{ gap: 6, padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> In Biên bản
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#64748b', borderColor: '#cbd5e1' }}
                  onClick={() => setViewBm02Doc(null)}
                >
                  <X size={16} /> Đóng
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="text-center my-2">
              <div className="text-xs uppercase font-bold text-gray-500 tracking-widest">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-xs font-semibold text-gray-600">Độc lập - Tự do - Hạnh phúc</div>
              <div className="my-2 border-b border-gray-300 w-32 mx-auto"></div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900 mt-4">
                BIÊN BẢN THU HỒI & HOÀN TRẢ TRANG THIẾT BỊ
              </h2>
              <div className="text-xs italic text-gray-500 font-mono mt-1">
                (Căn cứ Quy trình Thôi việc & Bàn giao tài sản • Kèm theo biên bản: {viewBm02Doc.handoverDocCode})
              </div>
            </div>

            {/* Intro */}
            <div className="text-sm text-gray-700 leading-relaxed my-2">
              Hôm nay, ngày {new Date(viewBm02Doc.returnedDate || Date.now()).getDate()} tháng {new Date(viewBm02Doc.returnedDate || Date.now()).getMonth() + 1} năm {new Date(viewBm02Doc.returnedDate || Date.now()).getFullYear()}, tại Văn phòng Công ty TNHH Thương mại dịch vụ và công nghệ LLA, chúng tôi tiến hành kiểm tra và hoàn tất thủ tục thu hồi tài sản phục vụ quyết toán thôi việc:
            </div>

            {/* Parties info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div className="flex-col gap-1 text-xs">
                <strong className="text-gray-900 uppercase">BÊN TIẾP NHẬN THU HỒI:</strong>
                <div>Đại diện: <strong>{viewBm02Doc.handoverPerson || 'Đỗ Thị Nguyệt'}</strong></div>
                <div>Phòng ban: <strong>{viewBm02Doc.handoverPersonRole || 'Hành chính - Kế toán'}</strong></div>
              </div>
              <div className="flex-col gap-1 text-xs">
                <strong className="text-gray-900 uppercase">BÊN BÀN GIAO HOÀN TRẢ:</strong>
                <div>Họ và tên: <strong className="text-blue-700">{viewBm02Doc.employee?.fullName}</strong></div>
                <div>Chức vụ: <strong>{viewBm02Doc.employee?.position?.title || 'Intern BA'}</strong></div>
                <div>Phòng ban: <strong>{viewBm02Doc.employee?.department?.name || 'Văn phòng'}</strong></div>
              </div>
            </div>

            {/* Asset Table */}
            <div className="my-3">
              <strong className="text-xs font-bold text-gray-800 uppercase block mb-2">DANH MỤC THIẾT BỊ HOÀN TRẢ:</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>STT</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Tên thiết bị</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Mã / Seri</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Số lượng</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Tình trạng khi thu hồi</th>
                  </tr>
                </thead>
                <tbody>
                  {parseItems(viewBm02Doc).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>{String(idx + 1).padStart(2, '0')}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{item.serial || '—'}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}>{String(item.quantity).padStart(2, '0')}</td>
                      <td style={{ padding: '8px 10px', color: '#059669', fontWeight: 600 }}>{viewBm02Doc.conditionOnReturn || 'Đầy đủ phụ kiện, hoạt động tốt'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Responsibilities & Compensation (Điều 129 BLLĐ 2019) */}
            <div className="my-3 text-xs leading-relaxed">
              {Number(viewBm02Doc.compensationAmount || 0) > 0 ? (
                <div style={{ background: '#fef2f2', padding: '0.85rem', borderRadius: 6, border: '1px solid #fecaca', color: '#991b1b' }}>
                  <div className="font-bold text-red-900 uppercase mb-1">
                    ⚖️ XỬ LÝ TRÁCH NHIỆM VẬT CHẤT & BỒI THƯỜNG (ĐIỀU 129 BLLĐ 2019):
                  </div>
                  <div>• Căn cứ / Thiệt hại ghi nhận: <strong>{viewBm02Doc.compensationReason || 'Thiệt hại linh kiện thiết bị trong quá trình sử dụng'}</strong></div>
                  <div>• Số tiền người lao động cam kết bồi thường: <strong className="text-red-700" style={{ fontSize: '0.95rem' }}>{Number(viewBm02Doc.compensationAmount).toLocaleString('vi-VN')} VNĐ</strong></div>
                  <div className="italic text-gray-600 mt-1">
                    * Căn cứ Điều 102 Bộ luật Lao động 2019, số tiền bồi thường này được hai bên thống nhất khấu trừ trực tiếp vào đợt thanh toán lương và trợ cấp thôi việc cuối cùng.
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 6, border: '1px solid #bbf7d0', color: '#166534' }}>
                  <strong>Xác nhận tình trạng tài sản:</strong> Thiết bị hoàn trả đầy đủ phụ kiện, hoạt động bình thường, không phát sinh chi phí bồi thường trách nhiệm vật chất.
                </div>
              )}
            </div>

            {/* Signature Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '2rem', textAlign: 'center' }}>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">NGƯỜI BÀN GIAO</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-blue-700">{viewBm02Doc.employee?.fullName}</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">BÊN TIẾP NHẬN (IT/HC)</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-gray-700">{viewBm02Doc.handoverPerson || 'Đỗ Thị Nguyệt'}</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">DUYỆT NHÂN SỰ (HR)</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký xác nhận quyết toán)</div>
                <div className="font-semibold text-xs text-emerald-700">Phòng Nhân Sự LLA</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AssetAssignments;
