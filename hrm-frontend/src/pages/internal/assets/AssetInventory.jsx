import Swal from 'sweetalert2';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, Monitor, Smartphone, Key, Box, Plus, Search, Filter, 
  RotateCcw, CheckCircle, AlertTriangle, FileText, ArrowRight, 
  Check, X, Printer, User, DollarSign, Calendar, Eye, Trash2, Edit3, Send,
  ShieldAlert, Layers, Package, Grid, List, Wrench, Shield, ChevronRight, UserCheck,
  Download, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../../utils/excelHelper';
import { UniversalImportModal } from '../../../components/common/UniversalImportModal';

export const AssetInventory = () => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chế độ xem: 'PRODUCT_CATALOG' (Gom theo dòng sản phẩm & theo dõi số lượng) hoặc 'UNIT_LIST' (Tất cả mã cá thể/serial)
  const [viewMode, setViewMode] = useState('PRODUCT_CATALOG');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

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

  // Modal Ma Trận Phân Bổ (Detail Matrix Modal)
  const [selectedProductCode, setSelectedProductCode] = useState(null);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixStatusFilter, setMatrixStatusFilter] = useState('ALL');
  const [targetProduct, setTargetProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'DESKTOP',
    code: '',
    price: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    condition: 'Mới 100%',
    notes: '',
    quantity: 1
  });

  const [assignForm, setAssignForm] = useState({
    assetId: '',
    employeeId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    conditionOnAssign: 'Hoạt động tốt, nguyên tem bảo hành, đầy đủ phụ kiện',
    handoverDocCode: '',
    notes: ''
  });

  // Modal Nhập dữ liệu dùng chung
  const [showImportModal, setShowImportModal] = useState(false);

  const assetImportColumns = [
    { key: 'name', label: 'Tên thiết bị', required: true, sample: 'Bộ máy tính Xeon E5-2680v4 (RAM 32GB)' },
    { key: 'quantity', label: 'Số lượng nhập', required: false, sample: '10' },
    { key: 'code', label: 'Mã bắt đầu (để trống sẽ tự sinh)', required: false, sample: 'TS-PC-021' },
    { key: 'serialNumber', label: 'Số Serial', required: false, sample: 'XEON-26021' },
    { key: 'price', label: 'Đơn giá (VNĐ)', required: false, sample: '10500000' },
    { key: 'supplier', label: 'Nhà cung cấp', required: false, sample: 'Vi tính Phong Vũ' },
    { key: 'purchaseDate', label: 'Ngày nhập (YYYY-MM-DD)', required: false, sample: '2026-11-01' },
    { key: 'condition', label: 'Tình trạng', required: false, sample: 'Mới 100%' },
    { key: 'notes', label: 'Ghi chú', required: false, sample: 'Bảo hành 24 tháng chính hãng' }
  ];

  const sampleAssetData = [
    {
      code: 'TS-PC-021',
      name: 'Bộ máy tính Xeon E5-2680v4 (RAM 32GB, SSD 500GB)',
      quantity: '5',
      serialNumber: 'XEON-26021',
      price: '10500000',
      supplier: 'Vi tính Phong Vũ',
      purchaseDate: '2026-11-01',
      condition: 'Mới 100%',
      notes: 'Máy bộ văn phòng cấu hình cao'
    },
    {
      code: 'TS-MON-041',
      name: 'Màn hình E-Dra 27" IPS 120Hz',
      quantity: '10',
      serialNumber: 'EDRA-MON-26041',
      price: '2600000',
      supplier: 'E-Dra Việt Nam',
      purchaseDate: '2026-11-05',
      condition: 'Mới 100%',
      notes: 'Màn hình IPS góc nhìn rộng'
    }
  ];

  // Xuất file Excel kho tài sản
  const handleExportExcelAssets = () => {
    if (assets.length === 0) return toast.error('Không có dữ liệu tài sản để xuất.');
    try {
      const exportData = assets.map(a => ({
        code: a.code,
        name: a.name,
        serialNumber: a.serialNumber || '',
        supplier: a.supplier || 'Chưa có thông tin',
        purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('vi-VN') : '',
        condition: a.condition || 'Mới 100%',
        price: a.price,
        status: a.status === 'AVAILABLE' ? 'Sẵn sàng cấp phát' : a.status === 'ASSIGNED' ? 'Đang cấp phát' : a.status === 'MAINTENANCE' ? 'Đang bảo hành' : a.status,
        assignedTo: a.assignments?.find(as => as.status === 'ACTIVE')?.employee?.fullName || 'Chưa cấp',
        notes: a.notes || ''
      }));

      const columns = [
        { key: 'code', label: 'Mã thiết bị' },
        { key: 'name', label: 'Tên thiết bị' },
        { key: 'serialNumber', label: 'Số Serial' },
        { key: 'supplier', label: 'Nhà cung cấp' },
        { key: 'purchaseDate', label: 'Ngày nhập kho' },
        { key: 'condition', label: 'Tình trạng' },
        { key: 'price', label: 'Đơn giá (VNĐ)', format: 'currency' },
        { key: 'status', label: 'Trạng thái kho' },
        { key: 'assignedTo', label: 'Nhân sự đang giữ' },
        { key: 'notes', label: 'Ghi chú' }
      ];

      exportToExcel({
        data: exportData,
        fileName: 'Kiem_Ke_Tai_San_Doanh_Nghiep',
        sheetName: 'Kho tài sản',
        columns
      });
      toast.success('Đã xuất file Excel kiểm kê tài sản thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xuất file Excel tài sản.');
    }
  };

  // Xác nhận nạp lô thiết bị
  const handleConfirmImportAssets = async (validRows) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch('http://localhost:5000/api/assets/bulk-import', {
      method: 'POST',
      headers,
      body: JSON.stringify({ assets: validRows })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi nạp tài sản vào kho');
    }
    fetchData();
    return res.json();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [assetsRes, empsRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets', { headers }),
        fetch('http://localhost:5000/api/employees', { headers })
      ]);

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data);
      } else {
        const err = await assetsRes.json().catch(() => ({}));
        console.error('Lỗi API assets:', err);
        toast.error(err.error || 'Lỗi khi tải dữ liệu tài sản');
      }

      if (empsRes.ok) {
        setEmployees(await empsRes.json());
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu kho tài sản:', err);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Gom nhóm danh mục sản phẩm từ danh sách tài sản trong kho
  const products = useMemo(() => {
    const map = new Map();

    for (const a of assets) {
      let productCode = '';
      let productName = a.name;

      if (a.code?.startsWith('TS-PC-')) {
        productCode = 'SP-PC-XEON';
        productName = 'Bộ máy tính Xeon E5-2680v4 (Main X99, RAM 32GB ECC, SSD 500GB, VGA M4000 8GB)';
      } else if (a.code?.startsWith('TS-MON-')) {
        productCode = 'SP-MON-EDRA27';
        productName = 'Màn hình E-Dra 27" (IPS - FHD - 120Hz)';
      } else if (a.code?.startsWith('TS-ARM-')) {
        productCode = 'SP-ARM-F160';
        productName = 'Giá đỡ 2 màn hình North Bayou F160';
      } else if (a.code?.startsWith('TS-KB-')) {
        productCode = 'SP-KB-EDRA';
        productName = 'Bàn phím chuột + lót EDRA';
      } else {
        const match = a.code?.match(/^(TS-[A-Z0-9]+)-/);
        const prefix = match ? match[1].replace('TS-', '') : (a.category || 'GEN');
        productCode = `SP-${prefix}`;
        productName = a.name;
      }

      if (!map.has(productCode)) {
        map.set(productCode, {
          productCode,
          name: productName,
          category: a.category,
          price: Number(a.price || 0),
          supplier: a.supplier || 'Chưa có thông tin',
          condition: a.condition || 'Mới 100%',
          purchaseDate: a.purchaseDate || null,
          notes: a.notes,
          totalQuantity: 0,
          availableQuantity: 0,
          assignedQuantity: 0,
          maintenanceQuantity: 0,
          disposedQuantity: 0,
          lostQuantity: 0,
          units: []
        });
      }

      const grp = map.get(productCode);
      if (a.supplier && (!grp.supplier || grp.supplier === 'Chưa có thông tin')) grp.supplier = a.supplier;
      if (a.condition) grp.condition = a.condition;
      if (a.purchaseDate && (!grp.purchaseDate || new Date(a.purchaseDate) > new Date(grp.purchaseDate))) {
        grp.purchaseDate = a.purchaseDate;
      }

      grp.totalQuantity += 1;
      if (a.status === 'AVAILABLE') grp.availableQuantity += 1;
      else if (a.status === 'ASSIGNED') grp.assignedQuantity += 1;
      else if (a.status === 'MAINTENANCE') grp.maintenanceQuantity += 1;
      else if (a.status === 'DISPOSED') grp.disposedQuantity += 1;
      else if (a.status === 'LOST') grp.lostQuantity += 1;

      grp.units.push(a);
    }

    // Sắp xếp mã cá thể tăng dần theo số thứ tự (TS-PC-001 -> TS-PC-020)
    for (const grp of map.values()) {
      grp.units.sort((u1, u2) => (u1.code || '').localeCompare(u2.code || '', undefined, { numeric: true }));
    }

    return Array.from(map.values());
  }, [assets]);

  // Sản phẩm đang được chọn xem ma trận chi tiết
  const currentProduct = useMemo(() => {
    if (!selectedProductCode) return null;
    return products.find(p => p.productCode === selectedProductCode) || null;
  }, [products, selectedProductCode]);

  // Category Icon & Label
  const getCategoryInfo = (category) => {
    switch (category) {
      case 'DESKTOP':
        return { label: 'Máy tính để bàn', icon: <Box size={16} /> };
      case 'MONITOR':
        return { label: 'Màn hình', icon: <Monitor size={16} /> };
      case 'OFFICE_EQUIPMENT':
        return { label: 'Phụ kiện làm việc', icon: <Package size={16} /> };
      default:
        return { label: 'Thiết bị IT', icon: <Box size={16} /> };
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

  // Xử lý Lưu Thêm mới / Cập nhật tài sản
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      const url = editingAsset 
        ? `http://localhost:5000/api/assets/${editingAsset.id}` 
        : 'http://localhost:5000/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      const payload = { ...formData };
      if (!editingAsset) {
        payload.quantity = Number(formData.quantity) || 1;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi lưu thông tin');
      }

      toast.success(data.message || (editingAsset ? 'Cập nhật tài sản thành công' : 'Thêm mới tài sản vào kho thành công'));
      setShowAddModal(false);
      setEditingAsset(null);
      setTargetProduct(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Báo hỏng 1 thiết bị cá thể từ bảng ma trận
  const handleSendToMaintenance = async (asset) => {
    try {
      const activeAssign = asset.assignments && asset.assignments[0];
      const holderName = activeAssign?.employee ? `${activeAssign.employee.fullName} (${activeAssign.employee.code})` : '';

      const { value: formValues } = await Swal.fire({
        title: 'Báo hỏng / Chuyển bảo trì',
        html: `
          <div style="text-align: left; font-size: 0.88rem; color: #334155; margin-bottom: 0.75rem;">
            Thiết bị: <strong>[${asset.code}] ${asset.name}</strong><br/>
            Serial: <strong>${asset.serialNumber || '—'}</strong>
            ${holderName ? `<div style="margin-top: 4px; color: #1e40af;">Nhân sự đang giữ: <strong>${holderName}</strong></div>` : ''}
          </div>
          <div style="text-align: left; font-size: 0.82rem; color: #64748B; margin-bottom: 0.35rem;">
            Mô tả sự cố / Lý do hỏng hóc: *
          </div>
          <textarea id="swal-issue" class="swal2-textarea" placeholder="Ví dụ: Màn hình bị sọc ngang, nguồn không lên..." style="margin-top:0; margin-bottom:12px; width:100%;"></textarea>
          <div style="text-align: left; font-size: 0.82rem; color: #64748B; margin-bottom: 0.35rem;">
            Tình trạng kỹ thuật:
          </div>
          <input id="swal-cond" class="swal2-input" value="Cần gửi hãng bảo hành / sửa chữa" style="margin-top:0; width:100%;">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#eab308',
        cancelButtonColor: '#64748B',
        confirmButtonText: '⚠ Xác nhận chuyển bảo trì',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
          const issue = document.getElementById('swal-issue').value;
          if (!issue?.trim()) {
            Swal.showValidationMessage('Vui lòng nhập mô tả sự cố');
            return false;
          }
          return {
            issueDescription: issue.trim(),
            condition: document.getElementById('swal-cond').value
          };
        }
      });

      if (!formValues) return;

      const res = await fetch(`http://localhost:5000/api/assets/${asset.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi chuyển trạng thái bảo trì');
      }

      toast.success(`Đã chuyển thiết bị [${asset.code}] sang trạng thái bảo trì!`);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Hoàn tất bảo trì (1-chạm đưa máy về kho AVAILABLE)
  const handleCompleteMaintenance = async (asset) => {
    const { value: formValues } = await Swal.fire({
      title: 'Hoàn tất bảo trì thiết bị',
      html: `
        <div style="text-align: left; font-size: 0.88rem; color: #334155; margin-bottom: 0.75rem;">
          Thiết bị: <strong>[${asset.code}] ${asset.name}</strong><br/>
          Serial: <strong>${asset.serialNumber || '—'}</strong>
        </div>
        <div style="text-align: left; font-size: 0.82rem; color: #64748B; margin-bottom: 0.35rem;">
          Chi phí sửa chữa thực tế (VNĐ, để 0đ nếu bảo hành miễn phí):
        </div>
        <input id="swal-cost" type="number" class="swal2-input" value="0" min="0" step="1000" style="margin-top:0; margin-bottom:12px; width:100%;">
        <div style="text-align: left; font-size: 0.82rem; color: #64748B; margin-bottom: 0.35rem;">
          Tình trạng sau sửa:
        </div>
        <input id="swal-cond" class="swal2-input" value="Đã sửa xong, hoạt động hoàn hảo 100%" style="margin-top:0; width:100%;">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#64748B',
      confirmButtonText: '✓ Đưa về kho sẵn sàng',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        return {
          maintenanceCost: Number(document.getElementById('swal-cost').value) || 0,
          condition: document.getElementById('swal-cond').value
        };
      }
    });

    if (!formValues) return;

    try {
      const res = await fetch(`http://localhost:5000/api/assets/${asset.id}/maintenance-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
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

  // Xóa mềm / Chuyển thanh lý
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

  // Lọc sản phẩm theo thanh tìm kiếm
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase().trim();
    return products.filter(prod => {
      return (
        prod.name?.toLowerCase().includes(term) ||
        prod.productCode?.toLowerCase().includes(term) ||
        prod.supplier?.toLowerCase().includes(term) ||
        prod.units.some(u => 
          u.code?.toLowerCase().includes(term) ||
          u.serialNumber?.toLowerCase().includes(term) ||
          u.supplier?.toLowerCase().includes(term) ||
          u.assignments?.[0]?.employee?.fullName?.toLowerCase().includes(term) ||
          u.assignments?.[0]?.employee?.code?.toLowerCase().includes(term)
        )
      );
    });
  }, [products, searchTerm]);

  // Lọc danh sách cá thể đơn chiếc (cho chế độ UNIT_LIST)
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        item.name?.toLowerCase().includes(term) ||
        item.code?.toLowerCase().includes(term) ||
        item.serialNumber?.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term) ||
        item.assignments?.[0]?.employee?.fullName?.toLowerCase().includes(term) ||
        item.assignments?.[0]?.employee?.code?.toLowerCase().includes(term)
      );
      const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [assets, searchTerm, selectedStatus]);

  // Lọc units bên trong Modal Ma Trận
  const filteredMatrixUnits = useMemo(() => {
    if (!currentProduct) return [];
    const term = matrixSearch.toLowerCase().trim();
    return currentProduct.units.filter(unit => {
      const matchesSearch = !term || (
        unit.code?.toLowerCase().includes(term) ||
        unit.serialNumber?.toLowerCase().includes(term) ||
        unit.supplier?.toLowerCase().includes(term) ||
        unit.assignments?.[0]?.employee?.fullName?.toLowerCase().includes(term) ||
        unit.assignments?.[0]?.employee?.code?.toLowerCase().includes(term)
      );

      const matchesStatus = matrixStatusFilter === 'ALL' || unit.status === matrixStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [currentProduct, matrixSearch, matrixStatusFilter]);

  // Tổng quan số lượng toàn kho
  const totalStockStats = useMemo(() => {
    const totalAssets = assets.length;
    const totalAvailable = assets.filter(a => a.status === 'AVAILABLE').length;
    const totalAssigned = assets.filter(a => a.status === 'ASSIGNED').length;
    const totalMaintenance = assets.filter(a => a.status === 'MAINTENANCE').length;
    return { totalAssets, totalAvailable, totalAssigned, totalMaintenance, totalModels: products.length };
  }, [assets, products]);

  // Tự động tính toán mã tài sản gợi ý tiếp theo theo chủng loại
  const getSuggestedCode = (category, currentAssets = assets) => {
    let prefix = 'PC';
    if (category === 'MONITOR') prefix = 'MON';
    else if (category === 'OFFICE_EQUIPMENT') prefix = 'ARM';
    else if (category === 'LAPTOP') prefix = 'LAP';
    else if (category === 'OTHER') prefix = 'OTH';

    let maxNum = 0;
    (currentAssets || []).forEach(a => {
      const match = a.code?.match(new RegExp(`TS-${prefix}-(\\d+)`, 'i'));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `TS-${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Mở modal thêm mới với tính năng tự gợi ý mã thông minh
  const handleOpenAddModal = (presetProduct = null) => {
    setEditingAsset(null);
    setTargetProduct(presetProduct);
    if (presetProduct) {
      const cat = presetProduct.category || 'DESKTOP';
      const nextCode = getSuggestedCode(cat, assets);
      setFormData({
        name: presetProduct.name,
        category: cat,
        code: nextCode,
        price: presetProduct.price || '',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplier: presetProduct.supplier && presetProduct.supplier !== 'Chưa có thông tin' ? presetProduct.supplier : '',
        condition: presetProduct.condition || 'Mới 100%',
        notes: '',
        quantity: 1
      });
    } else {
      setFormData({
        name: '',
        category: 'DESKTOP',
        code: getSuggestedCode('DESKTOP', assets),
        price: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplier: '',
        condition: 'Mới 100%',
        notes: '',
        quantity: 1
      });
    }
    setShowAddModal(true);
  };

  // Dự kiến mã kết thúc khi nhập số lượng > 1
  const previewLastCode = useMemo(() => {
    if (!formData.code || !formData.quantity || formData.quantity <= 1) return null;
    const match = formData.code.match(/^(.*?)(\d+)$/);
    if (!match) return null;
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    const pad = match[2].length;
    return `${prefix}${String(num + formData.quantity - 1).padStart(pad, '0')}`;
  }, [formData.code, formData.quantity]);

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
    return Array.from(empMap.values());
  }, [assets]);

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
      conditionOnReturn: 'Hoạt động bình thường, đầy đủ phụ kiện',
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

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Kho Thiết Bị & Danh Mục Sản Phẩm</h1>
          <p className="text-muted text-sm">Quản lý mã sản phẩm, theo dõi số lượng tồn kho theo dòng thiết bị và ma trận phân bổ người giữ</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          {/* Nút 1: Xuất dữ liệu */}
          <button 
            onClick={handleExportExcelAssets} 
            className="btn btn-outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              padding: '0.5rem 0.95rem', 
              fontSize: '0.84rem', 
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1', 
              color: '#0F172A',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Download size={15} color="#475569" />
            <span>Xuất dữ liệu</span>
          </button>

          {/* Nút 2: Nhập dữ liệu */}
          <button 
            onClick={() => setShowImportModal(true)} 
            className="btn btn-outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              padding: '0.5rem 0.95rem', 
              fontSize: '0.84rem', 
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1', 
              color: '#0F172A',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Upload size={15} color="#475569" />
            <span>Nhập dữ liệu</span>
          </button>

          {/* Nút 3: Tạo mới / Thêm thiết bị */}
          <button 
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              padding: '0.5rem 1rem', 
              fontSize: '0.84rem',
              fontWeight: 700
            }}
            onClick={() => handleOpenAddModal(null)}
          >
            <Plus size={16} />
            <span>Thêm thiết bị</span>
          </button>

          <button 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.9rem', fontSize: '0.84rem', borderColor: '#93C5FD', color: '#1D4ED8', background: '#EFF6FF' }}
            onClick={handleOpenBatchAssignModal}
          >
            <Send size={14} /> Bàn giao thiết bị
          </button>

          <button 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.9rem', fontSize: '0.84rem', borderColor: '#CBD5E1', color: '#059669', background: '#F0FDF4' }}
            onClick={() => openBatchReturnModal()}
            title="Thu hồi toàn bộ thiết bị từ nhân viên về kho"
          >
            <RotateCcw size={14} /> Thu hồi thiết bị
          </button>
        </div>
      </div>

      {/* Search & View Toolbar */}
      <div className="card glass flex items-center justify-between gap-4" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên thiết bị, mã SP (SP-PC-XEON...), mã cá thể (TS-PC-001...), serial, nhà cung cấp, hoặc người dùng..." 
            className="form-input"
            style={{ paddingLeft: '2.6rem', width: '100%', fontSize: '0.88rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* View Switcher: Gom theo dòng sản phẩm vs Toàn bộ thiết bị chi tiết */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', flexShrink: 0 }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'PRODUCT_CATALOG' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              fontSize: '0.82rem', 
              padding: '0.45rem 0.85rem', 
              gap: '0.4rem', 
              fontWeight: viewMode === 'PRODUCT_CATALOG' ? 700 : 500,
              boxShadow: viewMode === 'PRODUCT_CATALOG' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
            }}
            onClick={() => setViewMode('PRODUCT_CATALOG')}
          >
            <Grid size={15} /> Gom theo dòng ({products.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'UNIT_LIST' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              fontSize: '0.82rem', 
              padding: '0.45rem 0.85rem', 
              gap: '0.4rem', 
              fontWeight: viewMode === 'UNIT_LIST' ? 700 : 500,
              boxShadow: viewMode === 'UNIT_LIST' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
            }}
            onClick={() => setViewMode('UNIT_LIST')}
          >
            <List size={15} /> Toàn bộ thiết bị ({assets.length})
          </button>
        </div>
      </div>

      {/* Main Inventory Content */}
      {loading ? (
        <div className="card glass flex items-center justify-center" style={{ minHeight: 250 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'PRODUCT_CATALOG' ? (
        /* CHẾ ĐỘ 1: BẢNG THEO DÕI SỐ LƯỢNG THEO DÒNG SẢN PHẨM (MẶC ĐỊNH) */
        <div className="card glass flex-col gap-4">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Mã dòng</th>
                  <th style={{ minWidth: 220 }}>Tên thiết bị</th>
                  <th style={{ minWidth: 150 }}>Nhà cung cấp</th>
                  <th style={{ width: 120 }}>Ngày nhập</th>
                  <th style={{ width: 110 }}>Tình trạng</th>
                  <th style={{ minWidth: 160 }}>Đơn giá & Tổng giá</th>
                  <th style={{ minWidth: 260 }}>Cột theo dõi số lượng</th>
                  <th className="text-center" style={{ width: 85 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-muted">
                      Không tìm thấy dòng sản phẩm nào phù hợp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => {
                    const totalPrice = prod.units?.reduce((sum, u) => sum + Number(u.price || 0), 0) || (Number(prod.price || 0) * prod.totalQuantity);
                    const distinctPrices = Array.from(new Set((prod.units || []).map(u => Number(u.price || 0)).filter(p => p > 0)));
                    const assignedPct = prod.totalQuantity > 0 ? Math.round((prod.assignedQuantity / prod.totalQuantity) * 100) : 0;
                    const availablePct = prod.totalQuantity > 0 ? Math.round((prod.availableQuantity / prod.totalQuantity) * 100) : 0;
                    const maintPct = prod.totalQuantity > 0 ? Math.round((prod.maintenanceQuantity / prod.totalQuantity) * 100) : 0;

                    return (
                      <tr 
                        key={prod.productCode} 
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onClick={() => setSelectedProductCode(prod.productCode)}
                        className="hover:bg-slate-50"
                      >
                        <td>
                          <span 
                            className="font-mono text-xs px-2.5 py-1 rounded font-bold"
                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'inline-block' }}
                          >
                            {prod.productCode}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                            {prod.name}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-medium text-slate-700">
                            {prod.supplier || 'Chưa cập nhật'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-muted font-mono">
                            {prod.purchaseDate ? new Date(prod.purchaseDate).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.74rem' }}>
                            {prod.condition || 'Mới 100%'}
                          </span>
                        </td>
                        <td>
                          <div className="flex-col">
                            <span className="text-sm font-bold text-slate-800">
                              {totalPrice > 0 ? `${totalPrice.toLocaleString('vi-VN')} đ` : '—'}
                            </span>
                            {distinctPrices.length === 1 && (
                              <span className="text-xs text-muted">
                                Đơn giá: {distinctPrices[0].toLocaleString('vi-VN')} đ
                              </span>
                            )}
                            {distinctPrices.length > 1 && (
                              <span className="text-xs text-muted" title={`Có ${distinctPrices.length} mức giá nhập khác nhau qua các đợt`}>
                                Đơn giá: {Math.min(...distinctPrices).toLocaleString('vi-VN')} ~ {Math.max(...distinctPrices).toLocaleString('vi-VN')} đ
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex-col gap-1.5" style={{ width: '100%' }}>
                            <div className="flex items-center justify-between" style={{ fontSize: '0.78rem' }}>
                              <span className="font-semibold text-xs text-slate-700">
                                Tổng: <strong>{prod.totalQuantity}</strong> {prod.category === 'MONITOR' ? 'Màn hình' : prod.category === 'DESKTOP' ? 'Bộ' : 'Chiếc'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="badge badge-success" style={{ padding: '2px 7px', fontSize: '0.74rem' }}>
                                  🟢 {prod.availableQuantity} Trong kho
                                </span>
                                <span className="badge badge-primary" style={{ padding: '2px 7px', fontSize: '0.74rem' }}>
                                  🔵 {prod.assignedQuantity} Đang dùng
                                </span>
                                {prod.maintenanceQuantity > 0 && (
                                  <span className="badge badge-warning" style={{ padding: '2px 7px', fontSize: '0.74rem' }}>
                                    🟡 {prod.maintenanceQuantity} Bảo dưỡng
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Mini Progress Bar */}
                            <div style={{ height: 6, width: '100%', background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                              <div style={{ width: `${assignedPct}%`, background: '#3b82f6' }} title={`Đang dùng: ${prod.assignedQuantity} (${assignedPct}%)`} />
                              <div style={{ width: `${availablePct}%`, background: '#10b981' }} title={`Trong kho: ${prod.availableQuantity} (${availablePct}%)`} />
                              <div style={{ width: `${maintPct}%`, background: '#f59e0b' }} title={`Bảo dưỡng: ${prod.maintenanceQuantity} (${maintPct}%)`} />
                            </div>
                          </div>
                        </td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-outline"
                            style={{ 
                              height: 34, 
                              width: 34, 
                              padding: 0, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: '#2563eb', 
                              borderColor: '#bfdbfe',
                              borderRadius: '8px',
                              background: 'rgba(59, 130, 246, 0.06)'
                            }}
                            title={`Xem chi tiết ${prod.totalQuantity} mã cá thể, giá từng chiếc và ma trận phân bổ`}
                            onClick={() => setSelectedProductCode(prod.productCode)}
                          >
                            <Eye size={16} />
                          </button>
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
        /* CHẾ ĐỘ 2: BẢNG DANH SÁCH TOÀN BỘ CÁ THỂ (UNIT SERIAL VIEW) */
        <div className="card glass flex-col gap-4">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã & Tên Thiết Bị</th>
                  <th>Số Serial / SN</th>
                  <th>Nhà cung cấp</th>
                  <th>Ngày nhập</th>
                  <th>Tình trạng</th>
                  <th>Nguyên giá</th>
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
                          <span className="font-mono text-xs text-muted">
                            {asset.serialNumber || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-medium text-slate-700">
                            {asset.supplier || 'Chưa có thông tin'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-muted font-mono">
                            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-muted" title={asset.condition}>{asset.condition || 'Mới 100%'}</span>
                        </td>
                        <td>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                            {Number(asset.price || 0) > 0 ? `${Number(asset.price).toLocaleString('vi-VN')} đ` : '—'}
                          </span>
                        </td>
                        <td>{getStatusBadge(asset.status)}</td>
                        <td>
                          {activeAssign?.employee ? (
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
                                title="Bàn giao thiết bị cho nhân sự"
                                onClick={handleOpenBatchAssignModal}
                              >
                                <ArrowRight size={14} />
                              </button>
                            ) : asset.status === 'ASSIGNED' ? (
                              <button
                                className="btn btn-outline"
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', borderColor: '#fde047' }}
                                title="Báo hỏng 1 thiết bị này và chuyển sang bảo trì"
                                onClick={() => handleSendToMaintenance(asset)}
                              >
                                <AlertTriangle size={14} />
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

      {/* MODAL MA TRẬN PHÂN BỔ & CHI TIẾT CÁC MÃ BÊN TRONG CỦA DÒNG SẢN PHẨM */}
      {currentProduct && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '1150px', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff' }}>
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-3 items-center">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  {getCategoryInfo(currentProduct.category).icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold" style={{ background: '#2563eb', color: '#fff' }}>
                      {currentProduct.productCode}
                    </span>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)', margin: 0 }}>
                      {currentProduct.name}
                    </h2>
                  </div>
                  <p className="text-muted text-xs mt-1">
                    Nhà cung cấp: <strong>{currentProduct.supplier || 'Chưa cập nhật'}</strong> • Đơn giá tham chiếu: <strong>{currentProduct.price > 0 ? `${currentProduct.price.toLocaleString('vi-VN')} đ` : '—'}</strong> • Tình trạng: <strong>{currentProduct.condition || 'Mới 100%'}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ gap: 5, fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
                  title="Nhập thêm số lượng thiết bị cho đúng dòng sản phẩm này"
                  onClick={() => handleOpenAddModal(currentProduct)}
                >
                  <Plus size={15} /> Nhập thêm vào dòng này
                </button>
                <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} onClick={() => setSelectedProductCode(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 4 Thống kê nhanh trong Modal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="card glass flex-col items-center justify-center p-3" style={{ background: 'rgba(241, 245, 249, 0.5)', textAlign: 'center' }}>
                <span className="text-xs text-muted font-medium">Tổng thiết bị nhập</span>
                <span className="text-2xl font-extrabold" style={{ color: 'var(--text-main)' }}>{currentProduct.totalQuantity}</span>
              </div>
              <div className="card glass flex-col items-center justify-center p-3" style={{ background: 'rgba(16, 185, 129, 0.08)', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span className="text-xs text-muted font-medium">🟢 Sẵn sàng trong kho</span>
                <span className="text-2xl font-extrabold" style={{ color: '#059669' }}>{currentProduct.availableQuantity}</span>
              </div>
              <div className="card glass flex-col items-center justify-center p-3" style={{ background: 'rgba(59, 130, 246, 0.08)', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <span className="text-xs text-muted font-medium">🔵 Đang cấp phát (Nhân sự dùng)</span>
                <span className="text-2xl font-extrabold" style={{ color: '#2563eb' }}>{currentProduct.assignedQuantity}</span>
              </div>
              <div className="card glass flex-col items-center justify-center p-3" style={{ background: 'rgba(245, 158, 11, 0.08)', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span className="text-xs text-muted font-medium">🟡 Bảo dưỡng / Sửa chữa</span>
                <span className="text-2xl font-extrabold" style={{ color: '#d97706' }}>{currentProduct.maintenanceQuantity}</span>
              </div>
            </div>

            {/* Thanh công cụ lọc bên trong Modal */}
            <div className="flex justify-between items-center gap-3">
              <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Tìm theo mã cá thể (TS-PC-001...), serial, nhà cung cấp, hoặc nhân sự giữ..."
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', width: '100%' }}
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                {[
                  { key: 'ALL', label: `Tất cả (${currentProduct.totalQuantity})` },
                  { key: 'AVAILABLE', label: `Trong kho (${currentProduct.availableQuantity})` },
                  { key: 'ASSIGNED', label: `Đang dùng (${currentProduct.assignedQuantity})` },
                  { key: 'MAINTENANCE', label: `Bảo dưỡng (${currentProduct.maintenanceQuantity})` }
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`btn btn-sm ${matrixStatusFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => setMatrixStatusFilter(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BẢNG MA TRẬN CÁ THỂ & NHÂN SỰ GIỮ */}
            <div className="table-container" style={{ maxHeight: '440px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 45 }}>STT</th>
                    <th style={{ width: 130 }}>Mã thiết bị</th>
                    <th style={{ width: 120 }}>Số Serial</th>
                    <th style={{ minWidth: 140 }}>Nhà cung cấp</th>
                    <th style={{ width: 105 }}>Ngày nhập</th>
                    <th style={{ width: 100 }}>Tình trạng</th>
                    <th style={{ width: 120 }}>Đơn giá</th>
                    <th style={{ width: 130 }}>Trạng thái</th>
                    <th>Nhân sự giữ</th>
                    <th className="text-center" style={{ width: 85 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrixUnits.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-8 text-muted">
                        Không tìm thấy thiết bị nào khớp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrixUnits.map((unit, idx) => {
                      const activeAssign = unit.assignments && unit.assignments[0];
                      const holder = activeAssign?.employee;
                      const holderMonitors = (unit.category === 'MONITOR' && holder)
                        ? assets.filter(a => a.category === 'MONITOR' && a.assignments?.[0]?.employeeId === holder.id && a.status === 'ASSIGNED')
                        : [];

                      return (
                        <tr key={unit.id} style={{ background: unit.status === 'ASSIGNED' ? 'rgba(59, 130, 246, 0.02)' : 'transparent' }}>
                          <td className="text-muted text-xs font-semibold">{idx + 1}</td>
                          <td>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                              {unit.code}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-xs text-muted">
                              {unit.serialNumber || '—'}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-700 font-medium">
                              {unit.supplier || 'Chưa cập nhật'}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-muted font-mono">
                              {unit.purchaseDate ? new Date(unit.purchaseDate).toLocaleDateString('vi-VN') : '—'}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.74rem' }}>
                              {unit.condition || 'Mới 100%'}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs font-semibold text-slate-800 font-mono">
                              {Number(unit.price || 0) > 0 ? `${Number(unit.price).toLocaleString('vi-VN')} đ` : '—'}
                            </span>
                          </td>
                          <td>{getStatusBadge(unit.status)}</td>
                          <td>
                            {holder ? (
                              <div className="flex items-center gap-2.5 p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.07)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem', flexShrink: 0, background: '#3b82f6', color: '#fff', borderRadius: '50%' }}>
                                  {holder.avatar ? (
                                    <img src={holder.avatar} alt="" style={{ borderRadius: '50%' }} />
                                  ) : (
                                    holder.fullName?.charAt(0) || 'U'
                                  )}
                                </div>
                                <div className="flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                                      {holder.fullName}
                                    </span>
                                    {holderMonitors.length >= 2 && (
                                      <span 
                                        className="badge" 
                                        style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.68rem', padding: '1px 6px', fontWeight: 600 }}
                                        title="Nhân viên này đang giữ 2 màn hình (Dual Monitor)"
                                      >
                                        🖥️ 2 Màn hình
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted">
                                    {holder.code} • {holder.department?.name || 'Văn phòng'} {holder.position?.title ? `(${holder.position.title})` : ''}
                                  </span>
                                  {activeAssign?.handoverDocCode && (
                                    <span 
                                      className="text-xs text-muted flex items-center gap-1 font-mono mt-0.5" 
                                      style={{ fontSize: '0.72rem' }}
                                    >
                                      Mã BG: {activeAssign.handoverDocCode} {activeAssign.assignedDate ? `(${new Date(activeAssign.assignedDate).toLocaleDateString('vi-VN')})` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : unit.status === 'AVAILABLE' ? (
                              <span className="badge badge-success text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={12} /> Còn trong kho (Chưa cấp phát)
                              </span>
                            ) : unit.status === 'MAINTENANCE' ? (
                              <span className="badge badge-warning text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <AlertTriangle size={12} /> Đang bảo dưỡng / Sửa chữa
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {unit.status === 'AVAILABLE' && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ width: 30, height: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', borderColor: '#bfdbfe', borderRadius: 6 }}
                                  title="Bàn giao thiết bị này cho nhân sự"
                                  onClick={handleOpenBatchAssignModal}
                                >
                                  <ArrowRight size={15} />
                                </button>
                              )}
                              {unit.status === 'ASSIGNED' && (
                                <>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ width: 30, height: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669', borderColor: '#a7f3d0', borderRadius: 6, background: '#f0fdf4' }}
                                    title={`Thu hồi thiết bị từ ${holder?.fullName || 'nhân sự'} về kho`}
                                    onClick={() => openBatchReturnModal(holder?.id)}
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ width: 30, height: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', borderColor: '#fde047', borderRadius: 6 }}
                                    title="Báo hỏng 1 thiết bị này và chuyển sang bảo trì"
                                    onClick={() => handleSendToMaintenance(unit)}
                                  >
                                    <AlertTriangle size={15} />
                                  </button>
                                </>
                              )}
                              {unit.status === 'MAINTENANCE' && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ width: 30, height: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', borderColor: '#86efac', borderRadius: 6 }}
                                  title="Đã sửa chữa xong, đưa máy về lại kho"
                                  onClick={() => handleCompleteMaintenance(unit)}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ width: 30, height: 30, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1', borderRadius: 6, color: '#475569' }}
                                title="Sửa giá mua, mã hoặc tình trạng chiếc máy này"
                                onClick={() => {
                                  setTargetProduct(null);
                                  setEditingAsset(unit);
                                  setFormData({
                                    name: unit.name,
                                    category: unit.category,
                                    code: unit.code,
                                    price: unit.price || '',
                                    purchaseDate: unit.purchaseDate ? unit.purchaseDate.split('T')[0] : '',
                                    condition: unit.condition || 'Mới 100%',
                                    notes: unit.notes || '',
                                    quantity: 1
                                  });
                                  setShowAddModal(true);
                                }}
                              >
                                <Edit3 size={14} />
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

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs text-muted">
                Đang hiển thị <strong>{filteredMatrixUnits.length}</strong> / <strong>{currentProduct.totalQuantity}</strong> thiết bị cá thể thuộc dòng <strong>{currentProduct.productCode}</strong>
              </span>
              <button className="btn btn-primary" onClick={() => setSelectedProductCode(null)}>
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 1: Thêm mới / Cập nhật thiết bị */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
        }}>
          <div className="card glass flex-col gap-4 animate-scale-up" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', background: '#fff' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  {editingAsset 
                    ? `Cập Nhật Thiết Bị [${editingAsset.code}]` 
                    : targetProduct 
                      ? `Nhập Thêm Vào Dòng: ${targetProduct.name}`
                      : 'Thêm Dòng Thiết Bị Mới Vào Kho'}
                </h2>
                <p className="text-muted text-xs">
                  {editingAsset
                    ? 'Chỉnh sửa nguyên giá mua, mã hoặc tình trạng thiết bị'
                    : targetProduct
                      ? `Mã dòng: ${targetProduct.productCode} • Đang có ${targetProduct.totalQuantity} chiếc trong kho`
                      : 'Khai báo thiết bị mới vào danh mục kho công ty'}
                </p>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none' }} onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="flex-col gap-4">
              {/* Tên thiết bị */}
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Tên thiết bị / Model máy *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(targetProduct)}
                  placeholder="VD: Bộ máy tính PC Xeon E5-2680v4 / 64GB"
                  className="form-input"
                  style={targetProduct ? { background: '#f8fafc', color: '#1e293b', fontWeight: 600, cursor: 'default' } : {}}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* 3. Mã bắt đầu & Số lượng nhập */}
              <div style={{ display: 'grid', gridTemplateColumns: editingAsset ? '1fr' : '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">
                    Mã quản lý nội bộ {!editingAsset && '(Mã bắt đầu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TS-PC-021"
                    className="form-input font-mono"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                {!editingAsset && (
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1 block">
                      Số lượng nhập kho
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="form-input font-bold"
                      value={formData.quantity || 1}
                      onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                  </div>
                )}
              </div>

              {previewLastCode && (
                <div style={{ background: '#eff6ff', padding: '0.45rem 0.65rem', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: '0.74rem', color: '#1d4ed8' }}>
                  ⚡ Dự kiến sinh <strong>{formData.quantity}</strong> mã liên tiếp: <span className="font-mono">[{formData.code}]</span> ➔ <span className="font-mono">[{previewLastCode}]</span>
                </div>
              )}

              {/* 4. Đơn giá & Ngày mua */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Nguyên giá mua (VNĐ)</label>
                  <input
                    type="number"
                    placeholder="VD: 14500000"
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

              {/* 5. Nhà cung cấp & Tình trạng máy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Nhà cung cấp</label>
                  <input
                    type="text"
                    placeholder="VD: Vi tính Phong Vũ, FPT Shop..."
                    className="form-input"
                    value={formData.supplier || ''}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Tình trạng máy ban đầu</label>
                  <input
                    type="text"
                    placeholder="VD: Mới 100% hoặc 2ND hoạt động tốt"
                    className="form-input"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  />
                </div>
              </div>

              {/* 6. Ghi chú */}
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
                  {editingAsset ? 'Lưu thay đổi' : targetProduct ? 'Nhập thêm vào kho' : 'Thêm vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL BÀN GIAO THIẾT BỊ NHANH */}
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

      {/* MODAL THU HỒI TRỌN BỘ THIẾT BỊ THEO NHÂN VIÊN */}
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

      {/* MODAL 5: Nhập lô thiết bị từ Excel dùng chung */}
      <UniversalImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Nhập danh mục Thiết bị phần cứng từ Excel"
        subtitle="Tải file mẫu, điền mã và cấu hình thiết bị để nạp hàng loạt vào kho"
        templateFileName="Mau_Nhap_Kho_Thiet_Bi"
        columns={assetImportColumns}
        sampleData={sampleAssetData}
        onConfirmImport={handleConfirmImportAssets}
      />
    </div>
  );
};

export default AssetInventory;
