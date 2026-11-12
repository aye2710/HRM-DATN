import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, Monitor, Search, Filter, RotateCcw, CheckCircle, 
  Check, X, Plus, Send, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';

export const AssetAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('ALL');

  // Modal Bàn giao thiết bị nhanh
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [batchAssignForm, setBatchAssignForm] = useState({
    employeeId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    notes: '',
    includePc: true,
    pcAssetId: '',
    includeMonitor: true,
    monitorQty: 2,
    monitor1AssetId: '',
    monitor2AssetId: '',
    includeArm: true,
    armAssetId: '',
    includeKeyboard: true,
    keyboardAssetId: ''
  });

  // Modal Thu hồi thiết bị nhanh
  const [showBatchReturnModal, setShowBatchReturnModal] = useState(false);
  const [batchReturnEmpId, setBatchReturnEmpId] = useState('');
  const [batchReturnForm, setBatchReturnForm] = useState({
    returnedDate: new Date().toISOString().split('T')[0],
    conditionOnReturn: 'Hoạt động bình thường, đầy đủ phụ kiện',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [assetsRes, assignsRes, empsRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets', { headers }),
        fetch('http://localhost:5000/api/assets/assignments', { headers }),
        fetch('http://localhost:5000/api/employees', { headers })
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

  // Nạp nhanh preset combo
  const applyPresetCombo = (presetType) => {
    const availPcs = assets.filter(a => a.category === 'DESKTOP' && a.status === 'AVAILABLE');
    const availMonitors = assets.filter(a => a.category === 'MONITOR' && a.status === 'AVAILABLE');
    const availArms = assets.filter(a => (a.code?.startsWith('TS-ARM-') || a.category === 'OFFICE_EQUIPMENT') && a.status === 'AVAILABLE');
    const availKbs = assets.filter(a => (a.code?.startsWith('TS-KB-') || a.name?.toLowerCase().includes('phím')) && a.status === 'AVAILABLE');

    if (presetType === 'FULL_WORKSTATION') {
      setBatchAssignForm(prev => ({
        ...prev,
        includePc: true,
        pcAssetId: availPcs[0]?.id || '',
        includeMonitor: true,
        monitorQty: 2,
        monitor1AssetId: availMonitors[0]?.id || '',
        monitor2AssetId: availMonitors[1]?.id || '',
        includeArm: true,
        armAssetId: availArms[0]?.id || '',
        includeKeyboard: true,
        keyboardAssetId: availKbs[0]?.id || ''
      }));
    } else if (presetType === 'BASIC_SINGLE_MONITOR') {
      setBatchAssignForm(prev => ({
        ...prev,
        includePc: true,
        pcAssetId: availPcs[0]?.id || '',
        includeMonitor: true,
        monitorQty: 1,
        monitor1AssetId: availMonitors[0]?.id || '',
        monitor2AssetId: '',
        includeArm: false,
        armAssetId: '',
        includeKeyboard: true,
        keyboardAssetId: availKbs[0]?.id || ''
      }));
    } else if (presetType === 'MONITORS_ONLY') {
      setBatchAssignForm(prev => ({
        ...prev,
        includePc: false,
        pcAssetId: '',
        includeMonitor: true,
        monitorQty: 2,
        monitor1AssetId: availMonitors[0]?.id || '',
        monitor2AssetId: availMonitors[1]?.id || '',
        includeArm: true,
        armAssetId: availArms[0]?.id || '',
        includeKeyboard: false,
        keyboardAssetId: ''
      }));
    }
  };

  // Mở modal bàn giao
  const handleOpenBatchAssignModal = () => {
    const availPcs = assets.filter(a => a.category === 'DESKTOP' && a.status === 'AVAILABLE');
    const availMonitors = assets.filter(a => a.category === 'MONITOR' && a.status === 'AVAILABLE');
    const availArms = assets.filter(a => (a.code?.startsWith('TS-ARM-') || a.category === 'OFFICE_EQUIPMENT') && a.status === 'AVAILABLE');
    const availKbs = assets.filter(a => (a.code?.startsWith('TS-KB-') || a.name?.toLowerCase().includes('phím')) && a.status === 'AVAILABLE');

    const firstActiveEmp = employees.find(e => e.status !== 'RESIGNED');

    setBatchAssignForm({
      employeeId: firstActiveEmp?.id || '',
      assignedDate: new Date().toISOString().split('T')[0],
      notes: '',
      includePc: true,
      pcAssetId: availPcs[0]?.id || '',
      includeMonitor: true,
      monitorQty: 2,
      monitor1AssetId: availMonitors[0]?.id || '',
      monitor2AssetId: availMonitors[1]?.id || '',
      includeArm: true,
      armAssetId: availArms[0]?.id || '',
      includeKeyboard: true,
      keyboardAssetId: availKbs[0]?.id || ''
    });
    setShowBatchAssignModal(true);
  };

  // Submit bàn giao thiết bị nhanh
  const handleBatchAssignSubmit = async (e) => {
    e.preventDefault();
    if (!batchAssignForm.employeeId) {
      toast.error('Vui lòng chọn nhân sự tiếp nhận bàn giao');
      return;
    }

    const itemsToAssign = [];
    let mainAssetId = null;

    if (batchAssignForm.includePc && batchAssignForm.pcAssetId) {
      const pc = assets.find(a => a.id === batchAssignForm.pcAssetId);
      if (pc) {
        mainAssetId = pc.id;
        itemsToAssign.push({
          assetId: pc.id,
          name: pc.name,
          code: pc.code,
          serial: pc.serialNumber || pc.code,
          quantity: 1,
          condition: pc.condition || 'Mới 100%',
          notes: 'Bộ máy tính PC Xeon'
        });
      }
    }

    if (batchAssignForm.includeMonitor) {
      if (batchAssignForm.monitor1AssetId) {
        const m1 = assets.find(a => a.id === batchAssignForm.monitor1AssetId);
        if (m1) {
          if (!mainAssetId) mainAssetId = m1.id;
          itemsToAssign.push({
            assetId: m1.id,
            name: m1.name,
            code: m1.code,
            serial: m1.serialNumber || m1.code,
            quantity: 1,
            condition: m1.condition || 'Mới 100%',
            notes: 'Màn hình 1'
          });
        }
      }
      if (batchAssignForm.monitorQty === 2 && batchAssignForm.monitor2AssetId) {
        const m2 = assets.find(a => a.id === batchAssignForm.monitor2AssetId);
        if (m2) {
          itemsToAssign.push({
            assetId: m2.id,
            name: m2.name,
            code: m2.code,
            serial: m2.serialNumber || m2.code,
            quantity: 1,
            condition: m2.condition || 'Mới 100%',
            notes: 'Màn hình 2 (Dual)'
          });
        }
      }
    }

    if (batchAssignForm.includeArm && batchAssignForm.armAssetId) {
      const arm = assets.find(a => a.id === batchAssignForm.armAssetId);
      if (arm) {
        if (!mainAssetId) mainAssetId = arm.id;
        itemsToAssign.push({
          assetId: arm.id,
          name: arm.name,
          code: arm.code,
          serial: arm.serialNumber || arm.code,
          quantity: 1,
          condition: arm.condition || 'Mới 100%',
          notes: 'Giá đỡ 2 màn hình North Bayou'
        });
      }
    }

    if (batchAssignForm.includeKeyboard && batchAssignForm.keyboardAssetId) {
      const kb = assets.find(a => a.id === batchAssignForm.keyboardAssetId);
      if (kb) {
        if (!mainAssetId) mainAssetId = kb.id;
        itemsToAssign.push({
          assetId: kb.id,
          name: kb.name,
          code: kb.code,
          serial: kb.serialNumber || kb.code,
          quantity: 1,
          condition: kb.condition || 'Mới 100%',
          notes: 'Bàn phím chuột EDRA'
        });
      }
    }

    if (itemsToAssign.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thiết bị để bàn giao');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        assetId: mainAssetId,
        employeeId: batchAssignForm.employeeId,
        handoverDocCode: `BG-${Date.now().toString().slice(-6)}`,
        assignedDate: batchAssignForm.assignedDate,
        notes: batchAssignForm.notes || 'Bàn giao thiết bị làm việc',
        items: itemsToAssign,
        conditionOnAssign: 'Mới 100%, hoạt động bình thường, đầy đủ phụ kiện'
      };

      const res = await fetch('http://localhost:5000/api/assets/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi bàn giao thiết bị');
      }

      toast.success(`Đã bàn giao thành công ${itemsToAssign.length} thiết bị cho nhân sự!`);
      setShowBatchAssignModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Parse items list helper
  const parseItems = (assign) => {
    if (!assign) return [];
    if (Array.isArray(assign.items) && assign.items.length > 0) return assign.items;
    if (assign.itemsJson) {
      try {
        const parsed = JSON.parse(assign.itemsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Parse itemsJson error:', e);
      }
    }
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

  // Danh sách các nhân sự đang giữ thiết bị để thu hồi
  const activeEmployeesWithAssets = useMemo(() => {
    const empMap = new Map();

    for (const a of assets) {
      if (a.status === 'ASSIGNED' && a.assignments && a.assignments.length > 0) {
        const emp = a.assignments[0].employee;
        if (emp && emp.id) {
          if (!empMap.has(emp.id)) {
            empMap.set(emp.id, {
              ...emp,
              items: []
            });
          }
          const record = empMap.get(emp.id);
          if (!record.items.some(x => x.code === a.code)) {
            record.items.push({
              id: a.id,
              code: a.code,
              name: a.name,
              serial: a.serialNumber || a.code,
              condition: a.condition || 'Đang sử dụng',
              price: a.price
            });
          }
        }
      }
    }

    for (const as of assignments) {
      if (as.status === 'ACTIVE' && as.employee && as.employee.id) {
        if (!empMap.has(as.employee.id)) {
          empMap.set(as.employee.id, {
            ...as.employee,
            items: []
          });
        }
        const record = empMap.get(as.employee.id);
        const parsed = parseItems(as);
        for (const it of parsed) {
          const itemCode = it.code || it.serial;
          if (itemCode && !record.items.some(x => x.code === itemCode)) {
            record.items.push({
              id: it.assetId || it.id,
              code: itemCode,
              name: it.name,
              serial: it.serial || it.code || itemCode,
              condition: it.condition || 'Đang sử dụng',
              price: it.price || 0
            });
          }
        }
      }
    }

    return Array.from(empMap.values());
  }, [assets, assignments]);

  // Mở modal thu hồi thiết bị
  const openBatchReturnModal = (targetEmpId) => {
    if (activeEmployeesWithAssets.length === 0) {
      toast.error('Hiện tại không có nhân viên nào đang giữ thiết bị để thu hồi.');
      return;
    }
    const initialEmpId = targetEmpId || activeEmployeesWithAssets[0]?.id || '';
    setBatchReturnEmpId(initialEmpId);
    setBatchReturnForm({
      returnedDate: new Date().toISOString().split('T')[0],
      conditionOnReturn: 'Thiết bị hoàn trả đầy đủ phụ kiện, hoạt động bình thường',
      notes: ''
    });
    setShowBatchReturnModal(true);
  };

  // Submit thu hồi thiết bị
  const handleBatchReturnSubmit = async (e) => {
    e.preventDefault();
    if (!batchReturnEmpId) {
      toast.error('Vui lòng chọn nhân sự cần thu hồi thiết bị');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/assets/assignments/batch-return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          employeeId: batchReturnEmpId,
          returnedDate: batchReturnForm.returnedDate,
          conditionOnReturn: batchReturnForm.conditionOnReturn,
          notes: batchReturnForm.notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi thu hồi thiết bị');
      }

      const data = await res.json();
      toast.success(data.message || 'Đã thu hồi thành công toàn bộ thiết bị về kho!');
      setShowBatchReturnModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedAssignments,
    resetPage,
  } = usePagination(filteredAssignments, 10);

  useEffect(() => {
    resetPage();
  }, [searchTerm, assignmentStatusFilter, resetPage]);

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Bàn Giao & Thu Hồi Thiết Bị
          </h1>
          <p className="text-muted text-sm">
            Quản lý cấp phát trọn bộ thiết bị làm việc cho nhân viên và thu hồi thiết bị về kho
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-primary" 
            style={{ gap: 8, padding: '0.55rem 1.15rem' }}
            onClick={handleOpenBatchAssignModal}
          >
            <Plus size={18} /> Bàn giao thiết bị
          </button>
          <button 
            className="btn btn-outline" 
            style={{ gap: 8, padding: '0.55rem 1.15rem', color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
            onClick={() => openBatchReturnModal()}
          >
            <RotateCcw size={18} /> Thu hồi thiết bị
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
              placeholder="Tìm theo mã bàn giao, họ tên nhân viên, thiết bị cấp phát..."
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
              <option value="ACTIVE">Đang sử dụng</option>
              <option value="RETURNED">Đã hoàn trả về kho</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted">
          Tổng số đợt bàn giao: <strong>{filteredAssignments.length}</strong>
        </div>
      </div>

      {/* Assignments History Table */}
      <div className="card glass flex-col gap-4">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã bàn giao</th>
                <th>Nhân sự nhận</th>
                <th>Danh mục thiết bị cấp phát</th>
                <th>Ngày bàn giao</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">
                    Đang tải dữ liệu hồ sơ bàn giao...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">
                    Chưa có đợt bàn giao thiết bị nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map(assign => {
                  const itemsList = parseItems(assign);
                  const firstItem = itemsList[0];
                  const remainingCount = itemsList.length - 1;

                  return (
                    <tr key={assign.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          {assign.handoverDocCode || 'BG-LLA'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem', background: '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                              {assign.employee?.code} • {assign.employee?.department?.name || 'Văn phòng'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Laptop size={15} color="var(--primary)" />
                            <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {firstItem ? firstItem.name : (assign.asset?.name || 'Thiết bị làm việc')}
                            </span>
                          </div>
                          {remainingCount > 0 && (
                            <span className="badge badge-info" style={{ alignSelf: 'flex-start', fontSize: '0.7rem', padding: '2px 6px' }}>
                              + {remainingCount} thiết bị khác kèm theo (Màn hình, Arm, Phím chuột...)
                            </span>
                          )}
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
                      <td className="text-xs text-muted">
                        {assign.notes || '—'}
                      </td>
                      <td className="text-right">
                        {assign.status === 'ACTIVE' ? (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ height: 28, padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#d97706', borderColor: '#fde68a', fontSize: '0.75rem' }}
                            title="Thu hồi toàn bộ thiết bị của nhân sự này về kho"
                            onClick={() => openBatchReturnModal(assign.employeeId)}
                          >
                            <RotateCcw size={13} /> Thu hồi
                          </button>
                        ) : (
                          <span className="text-xs text-muted italic">Đã trả kho</span>
                        )}
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
          itemLabel="đợt bàn giao"
          flush={false}
        />
      </div>

      {/* MODAL 1: BÀN GIAO THIẾT BỊ CHO NHÂN SỰ (NHANH GỌN, KHÔNG THỦ TỤC RƯỜM RÀ) */}
      {showBatchAssignModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', background: '#fff' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Send size={18} color="var(--primary)" /> Bàn Giao Thiết Bị Cho Nhân Sự
                </h2>
                <p className="text-muted text-xs">Cấp phát nhanh thiết bị làm việc từ kho cho nhân viên (tự động chọn thiết bị khả dụng)</p>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowBatchAssignModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBatchAssignSubmit} className="flex-col gap-4">
              {/* Nút bấm nhanh chọn gói mẫu */}
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span className="text-xs font-bold text-slate-700 block mb-2">⚡ Chọn nhanh gói cấp phát chuẩn:</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#fff' }} onClick={() => applyPresetCombo('FULL_WORKSTATION')}>
                    🖥️ Trọn bộ Workstation (PC + 2 Màn + Arm + Phím chuột)
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#fff' }} onClick={() => applyPresetCombo('BASIC_SINGLE_MONITOR')}>
                    💻 Bộ cơ bản (PC + 1 Màn + Phím chuột)
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#fff' }} onClick={() => applyPresetCombo('MONITORS_ONLY')}>
                    🖥️🖥️ Cặp 2 Màn hình + Giá đỡ Arm
                  </button>
                </div>
              </div>

              {/* Chọn nhân viên tiếp nhận */}
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Nhân sự tiếp nhận bàn giao *</label>
                <select
                  required
                  className="form-input font-medium"
                  value={batchAssignForm.employeeId}
                  onChange={(e) => setBatchAssignForm({ ...batchAssignForm, employeeId: e.target.value })}
                >
                  <option value="">-- Chọn nhân viên tiếp nhận trang thiết bị --</option>
                  {employees.filter(e => e.status !== 'RESIGNED').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'Văn phòng'} {emp.position?.title ? `(${emp.position.title})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Danh sách 4 dòng thiết bị cho phép chọn */}
              <div className="flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Danh mục thiết bị cấp phát (Tích chọn món cần giao):
                </label>

                {/* 1. PC Xeon */}
                {(() => {
                  const availPcs = assets.filter(a => a.category === 'DESKTOP' && a.status === 'AVAILABLE');
                  return (
                    <div style={{ background: batchAssignForm.includePc ? '#eff6ff' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${batchAssignForm.includePc ? '#bfdbfe' : '#e2e8f0'}` }}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs text-slate-800">
                          <input
                            type="checkbox"
                            checked={batchAssignForm.includePc}
                            onChange={(e) => setBatchAssignForm({ ...batchAssignForm, includePc: e.target.checked })}
                            style={{ width: 17, height: 17, accentColor: 'var(--primary)' }}
                          />
                          <span>🖥️ Bộ máy tính PC Xeon E5-2680v4 (Main X99, RAM 32GB, SSD 500GB)</span>
                        </label>
                        <span className="badge badge-success text-xs font-mono">🟢 Còn {availPcs.length} máy trong kho</span>
                      </div>
                      {batchAssignForm.includePc && (
                        <div className="mt-2.5 pt-2 border-t border-blue-200 flex items-center gap-3">
                          <span className="text-xs text-muted font-medium">Chọn máy cụ thể:</span>
                          {availPcs.length === 0 ? (
                            <span className="text-xs text-red-600 font-bold">Kho đã hết PC khả dụng</span>
                          ) : (
                            <select
                              className="form-input text-xs font-mono font-bold flex-1"
                              value={batchAssignForm.pcAssetId}
                              onChange={(e) => setBatchAssignForm({ ...batchAssignForm, pcAssetId: e.target.value })}
                            >
                              {availPcs.map(pc => (
                                <option key={pc.id} value={pc.id}>
                                  [{pc.code}] - {pc.name} ({pc.condition || 'Mới 100%'})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. Màn hình E-Dra 27" */}
                {(() => {
                  const availMonitors = assets.filter(a => a.category === 'MONITOR' && a.status === 'AVAILABLE');
                  return (
                    <div style={{ background: batchAssignForm.includeMonitor ? '#eff6ff' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${batchAssignForm.includeMonitor ? '#bfdbfe' : '#e2e8f0'}` }}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs text-slate-800">
                          <input
                            type="checkbox"
                            checked={batchAssignForm.includeMonitor}
                            onChange={(e) => setBatchAssignForm({ ...batchAssignForm, includeMonitor: e.target.checked })}
                            style={{ width: 17, height: 17, accentColor: 'var(--primary)' }}
                          />
                          <span>🖥️ Màn hình E-Dra 27" (IPS - FHD - 120Hz)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          {batchAssignForm.includeMonitor && (
                            <div className="flex items-center gap-1 bg-white p-1 rounded border border-blue-300">
                              <button
                                type="button"
                                className={`btn btn-xs ${batchAssignForm.monitorQty === 1 ? 'btn-primary' : 'btn-outline'}`}
                                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                                onClick={() => setBatchAssignForm({ ...batchAssignForm, monitorQty: 1 })}
                              >
                                1 Màn
                              </button>
                              <button
                                type="button"
                                className={`btn btn-xs ${batchAssignForm.monitorQty === 2 ? 'btn-primary' : 'btn-outline'}`}
                                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                                onClick={() => setBatchAssignForm({ ...batchAssignForm, monitorQty: 2 })}
                              >
                                2 Màn (Dual)
                              </button>
                            </div>
                          )}
                          <span className="badge badge-success text-xs font-mono">🟢 Còn {availMonitors.length} chiếc</span>
                        </div>
                      </div>
                      {batchAssignForm.includeMonitor && (
                        <div className="mt-2.5 pt-2 border-t border-blue-200 flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted font-medium" style={{ minWidth: 90 }}>Màn hình 1:</span>
                            <select
                              className="form-input text-xs font-mono font-bold flex-1"
                              value={batchAssignForm.monitor1AssetId}
                              onChange={(e) => setBatchAssignForm({ ...batchAssignForm, monitor1AssetId: e.target.value })}
                            >
                              {availMonitors.map(m => (
                                <option key={m.id} value={m.id}>
                                  [{m.code}] - {m.name} ({m.condition || 'Mới 100%'})
                                </option>
                              ))}
                            </select>
                          </div>
                          {batchAssignForm.monitorQty === 2 && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted font-medium" style={{ minWidth: 90 }}>Màn hình 2:</span>
                              <select
                                className="form-input text-xs font-mono font-bold flex-1"
                                value={batchAssignForm.monitor2AssetId}
                                onChange={(e) => setBatchAssignForm({ ...batchAssignForm, monitor2AssetId: e.target.value })}
                              >
                                {availMonitors.filter(m => m.id !== batchAssignForm.monitor1AssetId).map(m => (
                                  <option key={m.id} value={m.id}>
                                    [{m.code}] - {m.name} ({m.condition || 'Mới 100%'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. Giá đỡ Arm F160 */}
                {(() => {
                  const availArms = assets.filter(a => (a.code?.startsWith('TS-ARM-') || a.category === 'OFFICE_EQUIPMENT') && a.status === 'AVAILABLE');
                  return (
                    <div style={{ background: batchAssignForm.includeArm ? '#eff6ff' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${batchAssignForm.includeArm ? '#bfdbfe' : '#e2e8f0'}` }}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs text-slate-800">
                          <input
                            type="checkbox"
                            checked={batchAssignForm.includeArm}
                            onChange={(e) => setBatchAssignForm({ ...batchAssignForm, includeArm: e.target.checked })}
                            style={{ width: 17, height: 17, accentColor: 'var(--primary)' }}
                          />
                          <span>🦾 Giá đỡ 2 màn hình North Bayou F160 (Tải trọng 9kg/tay)</span>
                        </label>
                        <span className="badge badge-success text-xs font-mono">🟢 Còn {availArms.length} chiếc</span>
                      </div>
                      {batchAssignForm.includeArm && (
                        <div className="mt-2.5 pt-2 border-t border-blue-200 flex items-center gap-3">
                          <span className="text-xs text-muted font-medium">Chọn chiếc Arm:</span>
                          <select
                            className="form-input text-xs font-mono font-bold flex-1"
                            value={batchAssignForm.armAssetId}
                            onChange={(e) => setBatchAssignForm({ ...batchAssignForm, armAssetId: e.target.value })}
                          >
                            {availArms.map(arm => (
                              <option key={arm.id} value={arm.id}>
                                [{arm.code}] - {arm.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 4. Phím chuột EDRA */}
                {(() => {
                  const availKbs = assets.filter(a => (a.code?.startsWith('TS-KB-') || a.name?.toLowerCase().includes('phím')) && a.status === 'AVAILABLE');
                  return (
                    <div style={{ background: batchAssignForm.includeKeyboard ? '#eff6ff' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${batchAssignForm.includeKeyboard ? '#bfdbfe' : '#e2e8f0'}` }}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs text-slate-800">
                          <input
                            type="checkbox"
                            checked={batchAssignForm.includeKeyboard}
                            onChange={(e) => setBatchAssignForm({ ...batchAssignForm, includeKeyboard: e.target.checked })}
                            style={{ width: 17, height: 17, accentColor: 'var(--primary)' }}
                          />
                          <span>⌨️ Bàn phím chuột + lót EDRA (Combo Văn phòng)</span>
                        </label>
                        <span className="badge badge-success text-xs font-mono">🟢 Còn {availKbs.length} bộ</span>
                      </div>
                      {batchAssignForm.includeKeyboard && (
                        <div className="mt-2.5 pt-2 border-t border-blue-200 flex items-center gap-3">
                          <span className="text-xs text-muted font-medium">Chọn bộ phím chuột:</span>
                          <select
                            className="form-input text-xs font-mono font-bold flex-1"
                            value={batchAssignForm.keyboardAssetId}
                            onChange={(e) => setBatchAssignForm({ ...batchAssignForm, keyboardAssetId: e.target.value })}
                          >
                            {availKbs.map(kb => (
                              <option key={kb.id} value={kb.id}>
                                [{kb.code}] - {kb.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Ngày bàn giao */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày bàn giao</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={batchAssignForm.assignedDate}
                    onChange={(e) => setBatchAssignForm({ ...batchAssignForm, assignedDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Ghi chú bàn giao (Tùy chọn)</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú cấu hình hoặc phụ kiện kèm theo..."
                  className="form-input"
                  value={batchAssignForm.notes}
                  onChange={(e) => setBatchAssignForm({ ...batchAssignForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBatchAssignModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: 6 }}>
                  <Check size={16} /> Xác nhận bàn giao thiết bị
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: THU HỒI TRỌN BỘ THIẾT BỊ THEO NHÂN VIÊN */}
      {showBatchReturnModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <RotateCcw size={20} color="var(--warning)" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  Thu Hồi Thiết Bị Về Kho
                </h2>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowBatchReturnModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBatchReturnSubmit} className="flex-col gap-4">
              {/* Chọn nhân viên */}
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">
                  Chọn nhân sự hoàn trả thiết bị *
                </label>
                <select
                  className="form-input"
                  style={{ width: '100%', fontWeight: 600 }}
                  value={batchReturnEmpId}
                  onChange={(e) => setBatchReturnEmpId(e.target.value)}
                  required
                >
                  {activeEmployeesWithAssets.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code || 'NV'}) — {emp.department?.name || 'Văn phòng'} [Đang giữ {emp.items?.length || 0} thiết bị]
                    </option>
                  ))}
                </select>
              </div>

              {/* Danh sách thiết bị nhân sự đang giữ sẽ được hoàn trả về kho */}
              {(() => {
                const curEmp = activeEmployeesWithAssets.find(e => e.id === batchReturnEmpId) || activeEmployeesWithAssets[0];
                const heldList = curEmp?.items || [];

                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-700">
                        📦 Danh mục thiết bị nhân sự đang giữ ({heldList.length} thiết bị):
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        Tự động nhập lại kho (AVAILABLE)
                      </span>
                    </div>

                    {heldList.length === 0 ? (
                      <div className="text-xs text-muted text-center py-3">Nhân sự này hiện không giữ thiết bị nào.</div>
                    ) : (
                      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                              <th style={{ padding: '4px 6px', width: 35, textAlign: 'center' }}>STT</th>
                              <th style={{ padding: '4px 8px', width: 130 }}>Mã thiết bị</th>
                              <th style={{ padding: '4px 8px' }}>Tên thiết bị / Cấu hình</th>
                              <th style={{ padding: '4px 8px', width: 95 }}>Tình trạng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heldList.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#0369a1' }}>
                                  {item.code || item.serial || '—'}
                                </td>
                                <td style={{ padding: '5px 8px', fontWeight: 500, color: '#1e293b' }}>
                                  {item.name}
                                </td>
                                <td style={{ padding: '5px 8px', color: '#059669', fontSize: '0.72rem' }}>
                                  {item.condition || 'Đang dùng'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Ngày hoàn trả thiết bị *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={batchReturnForm.returnedDate}
                    onChange={(e) => setBatchReturnForm({ ...batchReturnForm, returnedDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Tình trạng thiết bị khi nhận lại *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thiết bị hoàn trả đầy đủ phụ kiện, hoạt động bình thường"
                  className="form-input"
                  value={batchReturnForm.conditionOnReturn}
                  onChange={(e) => setBatchReturnForm({ ...batchReturnForm, conditionOnReturn: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Ghi chú kiểm tra (Tùy chọn)</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú thêm nếu phát hiện xước, hư hỏng linh kiện..."
                  className="form-input"
                  value={batchReturnForm.notes}
                  onChange={(e) => setBatchReturnForm({ ...batchReturnForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBatchReturnModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: 6, background: '#f59e0b', borderColor: '#f59e0b' }}>
                  <RotateCcw size={16} /> Xác nhận thu hồi về kho
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

export default AssetAssignments;
