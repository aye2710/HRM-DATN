import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Building, Search, Plus, Filter, MoreVertical, Edit2, Trash2, X, AlertTriangle, Lock, Unlock, Download, Upload, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../../utils/excelHelper';
import { UniversalImportModal } from '../../../components/common/UniversalImportModal';
import { TableCheckbox, BulkSelectionBar, useTableSelection, runBatchDelete } from '../../../components/common/TableSelection';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

// Hàm sinh mã phòng ban thông minh theo chuẩn doanh nghiệp (tự động khử trùng lặp)
const generateDeptCode = (deptName, existingDepartments = [], currentId = '') => {
  if (!deptName || !deptName.trim()) return '';

  const clean = removeVietnameseTones(deptName.trim().toLowerCase());

  // 1. Đối chiếu từ điển quy ước doanh nghiệp phổ biến
  const keywordMap = [
    { regex: /nhan\s*su|tuyen\s*dung|hr/i, code: 'HR' },
    { regex: /tai\s*chinh|ke\s*toan|finance/i, code: 'TCKT' },
    { regex: /phat\s*trien|phan\s*mem|lap\s*trinh|dev|software/i, code: 'DEV' },
    { regex: /kiem\s*thu|tester|qa|qc/i, code: 'TEST' },
    { regex: /phan\s*tich|business\s*analyst|ba/i, code: 'BA' },
    { regex: /giam\s*doc|ban\s*giam\s*doc|board/i, code: 'BGD' },
    { regex: /marketing|truyen\s*thong|mkt/i, code: 'MKT' },
    { regex: /kinh\s*doanh|ban\s*hang|sales/i, code: 'KD' },
    { regex: /ky\s*thuat|cong\s*nghe|it/i, code: 'IT' },
    { regex: /van\s*hanh|operations|ops/i, code: 'OPS' },
    { regex: /hanh\s*chinh|admin/i, code: 'HC' },
    { regex: /phap\s*che|legal/i, code: 'LEGAL' },
    { regex: /cham\s*soc\s*khach\s*hang|cskh/i, code: 'CSKH' },
    { regex: /an\s*ninh|bao\s*mat|security/i, code: 'SEC' }
  ];

  let baseCode = '';
  for (const item of keywordMap) {
    if (item.regex.test(clean)) {
      baseCode = item.code;
      break;
    }
  }

  // 2. Nếu không khớp từ điển: Lược bỏ hư từ tiền tố ('phong', 'ban', 'to', 'khoi', 'trung tam') và lấy chữ cái đầu
  if (!baseCode) {
    const words = clean
      .split(/[\s\-_]+/)
      .filter(w => !['phong', 'ban', 'to', 'khoi', 'trung', 'tam', 'bo', 'phan'].includes(w));

    const targetWords = words.length > 0 ? words : clean.split(/[\s\-_]+/);
    baseCode = targetWords.map(w => w[0]?.toUpperCase()).join('').slice(0, 6);
  }

  if (!baseCode) {
    baseCode = 'PB';
  }

  // 3. Tự động kiểm tra trùng lặp với danh sách phòng ban hiện có
  let finalCode = baseCode;
  let counter = 2;
  const isCodeTaken = (c) => existingDepartments.some(d => d.code?.toUpperCase() === c.toUpperCase() && d.id !== currentId);
  while (isCodeTaken(finalCode)) {
    finalCode = `${baseCode}${counter}`;
    counter++;
  }

  return finalCode;
};

export const Departments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({ code: '', name: '', managerName: '', quota: 15, parentId: '', status: 'ACTIVE' });

  // Delete confirm state
  const [deleteId, setDeleteId] = useState(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  // Lock/Unlock confirm state
  const [lockTarget, setLockTarget] = useState(null);

  // Modal Nhập dữ liệu dùng chung
  const [showImportModal, setShowImportModal] = useState(false);

  const departmentImportColumns = [
    { key: 'name', label: 'Tên phòng ban', required: true, sample: 'Phòng Kỹ thuật & Công nghệ' },
    { key: 'code', label: 'Mã phòng ban (để trống tự sinh)', required: false, sample: 'IT' },
    { key: 'managerName', label: 'Người đại diện / Trưởng phòng', required: false, sample: 'Nguyễn Văn An' },
    { key: 'quota', label: 'Định biên nhân sự', required: false, sample: '20' },
    { key: 'parentName', label: 'Trực thuộc phòng ban cha', required: false, sample: 'Ban Giám đốc' },
    { key: 'status', label: 'Trạng thái', required: false, sample: 'Hoạt động' }
  ];

  const sampleDepartmentData = [
    {
      name: 'Ban Giám đốc',
      code: 'BGD',
      managerName: 'Trần Văn Tổng',
      quota: '5',
      parentName: '',
      status: 'Hoạt động'
    },
    {
      name: 'Phòng Kỹ thuật & Công nghệ',
      code: 'IT',
      managerName: 'Lê Hoàng IT',
      quota: '25',
      parentName: 'Ban Giám đốc',
      status: 'Hoạt động'
    },
    {
      name: 'Phòng Nhân sự & Hành chính',
      code: 'HR',
      managerName: 'Đặng Mai Phương',
      quota: '10',
      parentName: 'Ban Giám đốc',
      status: 'Hoạt động'
    },
    {
      name: 'Phòng Tài chính - Kế toán',
      code: 'TCKT',
      managerName: 'Hoàng Kim Chi',
      quota: '8',
      parentName: 'Ban Giám đốc',
      status: 'Hoạt động'
    },
    {
      name: 'Phòng Marketing & Truyền thông',
      code: 'MKT',
      managerName: 'Vũ Quốc Đạt',
      quota: '12',
      parentName: 'Ban Giám đốc',
      status: 'Hoạt động'
    }
  ];

  // Tính toán số nhân sự và định biên lũy kế tự động theo cây phả hệ (Rollup Hierarchy)
  const getDeptHierarchyStats = useMemo(() => {
    const statsMap = new Map();

    const calculateStats = (deptId) => {
      if (statsMap.has(deptId)) return statsMap.get(deptId);

      const dept = departments.find(d => d.id === deptId);
      if (!dept) {
        return { directHeadcount: 0, totalHeadcount: 0, directQuota: 0, totalQuota: 0, hasChildren: false, childCount: 0 };
      }

      const directHeadcount = dept._count?.employees || 0;
      const directQuota = dept.quota || 0;

      const children = departments.filter(d => d.parentId === deptId);
      const hasChildren = children.length > 0;

      if (!hasChildren) {
        const res = {
          directHeadcount,
          totalHeadcount: directHeadcount,
          directQuota,
          totalQuota: directQuota,
          hasChildren: false,
          childCount: 0
        };
        statsMap.set(deptId, res);
        return res;
      }

      let childHeadcountSum = 0;
      let childQuotaSum = 0;

      for (const child of children) {
        const cStats = calculateStats(child.id);
        childHeadcountSum += cStats.totalHeadcount;
        childQuotaSum += cStats.directQuota;
      }

      const totalHeadcount = directHeadcount + childHeadcountSum;
      // Giữ nguyên định biên trần của đơn vị cha (không tự động cộng dồn / phình theo phòng con)
      const effectiveQuota = directQuota;

      const res = {
        directHeadcount,
        totalHeadcount,
        directQuota,
        totalQuota: effectiveQuota,
        childQuotaSum,
        hasChildren: true,
        childCount: children.length
      };
      statsMap.set(deptId, res);
      return res;
    };

    departments.forEach(d => calculateStats(d.id));
    return statsMap;
  }, [departments]);

  // Xuất file Excel cơ cấu phòng ban (hỗ trợ xuất toàn bộ hoặc chỉ các dòng đã chọn)
  const handleExportExcelDepartments = (rowsOverride = null) => {
    const sourceList = Array.isArray(rowsOverride) ? rowsOverride : departments;
    if (sourceList.length === 0) return toast.error('Không có dữ liệu phòng ban để xuất.');
    try {
      const parentMap = new Map(departments.map(d => [d.id, d.name]));
      const exportData = sourceList.map(d => {
        const stats = getDeptHierarchyStats.get(d.id) || { directHeadcount: d._count?.employees || 0, totalHeadcount: d._count?.employees || 0, directQuota: d.quota || 15, hasChildren: false, childCount: 0 };
        const headcount = stats.directHeadcount;
        const quota = stats.directQuota;
        const fillRate = Math.round((headcount / (quota || 1)) * 100);
        return {
          code: d.code,
          name: d.name,
          managerName: d.managerName || 'Chưa có',
          parentName: d.parentId ? (parentMap.get(d.parentId) || 'Trực thuộc khác') : 'Cấp cao nhất',
          quota: quota,
          headcount: headcount,
          fillRate: `${fillRate}%`,
          positionsCount: d._count?.positions || 0,
          status: d.status === 'ACTIVE' || d.status === 'Hoạt động' ? 'Hoạt động' : 'Tạm khóa',
          hierarchyType: stats.hasChildren ? `Tổ chức mẹ (Tổng ${stats.childCount} đơn vị con)` : 'Đơn vị trực tiếp'
        };
      });

      const columns = [
        { key: 'code', label: 'Mã phòng ban' },
        { key: 'name', label: 'Tên phòng ban' },
        { key: 'managerName', label: 'Người đại diện / Trưởng phòng' },
        { key: 'parentName', label: 'Phòng ban trực thuộc' },
        { key: 'quota', label: 'Định biên nhân sự' },
        { key: 'headcount', label: 'Nhân sự thực tế' },
        { key: 'fillRate', label: 'Tỷ lệ lấp đầy' },
        { key: 'positionsCount', label: 'Số vị trí chức danh' },
        { key: 'status', label: 'Trạng thái' },
        { key: 'hierarchyType', label: 'Phân cấp tổ chức' }
      ];

      exportToExcel({
        data: exportData,
        fileName: Array.isArray(rowsOverride) ? `Phong_Ban_Da_Chon_${sourceList.length}` : 'Danh_Sach_Phong_Ban_Doanh_Nghiep',
        sheetName: 'Cơ cấu phòng ban',
        columns
      });
      toast.success(`Đã xuất file Excel (${sourceList.length} phòng ban) thành công!`);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xuất file Excel phòng ban.');
    }
  };

  // Xác nhận nạp danh sách phòng ban từ Excel
  const handleConfirmImportDepartments = async (validRows) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch('http://localhost:5000/api/departments/bulk-import', {
      method: 'POST',
      headers,
      body: JSON.stringify({ departments: validRows })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi nạp danh sách phòng ban');
    }
    fetchDepartments();
    return res.json();
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ code: '', name: '', managerName: '', quota: 15, parentId: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setFormData({
      code: dept.code,
      name: dept.name,
      managerName: dept.managerName || '',
      quota: dept.quota || 15,
      parentId: dept.parentId || '',
      status: dept.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  // Tự động sinh mã phòng ban khi nhập Tên phòng ban
  const handleNameChange = (e) => {
    const newName = e.target.value;
    const autoCode = modalMode === 'add' ? generateDeptCode(newName, departments, editingId) : formData.code;
    setFormData({
      ...formData,
      name: newName,
      code: autoCode
    });
  };

  const handleSave = () => {
    const cleanName = formData.name.trim();
    let cleanCode = formData.code ? formData.code.trim().toUpperCase() : '';

    if (!cleanName) {
      toast.error('Vui lòng nhập Tên phòng ban!');
      return;
    }

    if (!cleanCode) {
      cleanCode = generateDeptCode(cleanName, departments, editingId);
    }

    if (!cleanCode || cleanCode.length < 2) {
      toast.error('Mã phòng ban phải có tối thiểu 2 ký tự (Ví dụ: HR, IT, MKT)!');
      return;
    }

    // Kiểm tra trùng lặp mã phòng ban
    const isDuplicate = departments.some(
      d => d.code.toUpperCase() === cleanCode && d.id !== editingId
    );
    if (isDuplicate) {
      toast.error(`Mã phòng ban "${cleanCode}" đã được sử dụng! Vui lòng chọn tên khác.`);
      return;
    }

    const parsedQuota = Math.max(1, parseInt(formData.quota, 10) || 1);

    const payload = {
      ...formData,
      name: cleanName,
      code: cleanCode,
      quota: parsedQuota
    };

    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/departments', payload)
        .then(() => {
          toast.success('Đã thêm phòng ban thành công!');
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi thêm phòng ban'));
    } else {
      axios.put(`http://localhost:5000/api/departments/${editingId}`, payload)
        .then(() => {
          toast.success('Đã cập nhật phòng ban!');
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi sửa phòng ban'));
    }
  };

  const handleConfirmToggleStatus = () => {
    if (!lockTarget) return;
    const isCurrentlyActive = lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    axios.put(`http://localhost:5000/api/departments/${lockTarget.id}`, { ...lockTarget, status: newStatus })
      .then(() => {
        toast.success(newStatus === 'ACTIVE' ? 'Đã mở khóa phòng ban!' : 'Đã khóa phòng ban!');
        fetchDepartments();
        setLockTarget(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái');
        setLockTarget(null);
      });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    axios.delete(`http://localhost:5000/api/departments/${deleteId}`)
      .then(() => {
        fetchDepartments();
        setDeleteId(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi xóa phòng ban');
        setDeleteId(null);
      });
  };

  const filteredDepartments = departments.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === '' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });
  
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedDepartments,
  } = usePagination(filteredDepartments, 10);

  const {
    selectedIds,
    selectedSet,
    selectedCount,
    toggleOne,
    toggleMany,
    getHeaderCheckState,
    clearSelection,
    getSelectedItems
  } = useTableSelection(departments);

  const headerCheckState = getHeaderCheckState(paginatedDepartments);

  const handleBatchDeleteDepartments = () => {
    runBatchDelete({
      count: selectedCount,
      itemLabel: 'phòng ban',
      confirmText: `Hệ thống sẽ xóa các phòng ban đã chọn (những phòng ban còn nhân sự, vị trí hoặc đơn vị con trực thuộc sẽ được tự động giữ lại).`,
      executeDeletes: () => selectedIds.map(id => axios.delete(`http://localhost:5000/api/departments/${id}`)),
      onDone: () => {
        clearSelection();
        fetchDepartments();
      },
      setIsDeleting: setIsBatchDeleting
    });
  };

  return (
    <div className="flex-col gap-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Phòng ban</h1>
          <p className="text-muted text-sm">Quản lý cơ cấu phòng ban, định biên nhân sự và tỷ lệ lấp đầy tổ chức</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          {/* Nút 1: Xuất dữ liệu */}
          <button 
            onClick={() => handleExportExcelDepartments()} 
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

          {/* Nút 3: Thêm Phòng ban */}
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 700 }}>
            <Plus size={16} /> Thêm Phòng ban
          </button>

          {/* Nút 4: Làm mới */}
          <button onClick={fetchDepartments} className="btn btn-outline" style={{ padding: '0.5rem', borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }} title="Tải lại danh sách">
            <RefreshCw size={15} color="#475569" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="card glass flex-col gap-4" style={{ flex: 1 }}>
        {/* Toolbar gọn nhẹ tối giản */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm mã PB, tên phòng ban..."
                className="form-input w-full"
                style={{ paddingLeft: '2.35rem', height: 38, fontSize: '0.85rem' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <select
              className="form-input"
              style={{ width: '175px', height: 38, fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">-- Trạng thái --</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </div>
        </div>

        <BulkSelectionBar
          selectedCount={selectedCount}
          itemLabel="phòng ban"
          onExportSelected={() => handleExportExcelDepartments(getSelectedItems())}
          onDeleteSelected={handleBatchDeleteDepartments}
          onClear={clearSelection}
          isDeleting={isBatchDeleting}
        />

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '44px', textAlign: 'center' }}>
                  <TableCheckbox
                    checked={headerCheckState.checked}
                    indeterminate={headerCheckState.indeterminate}
                    onChange={() => toggleMany(paginatedDepartments)}
                    title="Chọn tất cả trang này"
                  />
                </th>
                <th>Mã PB</th>
                <th>Tên Phòng ban</th>
                <th>Người đại diện</th>
                <th>Trực thuộc</th>
                <th style={{ minWidth: '180px' }}>Nhân sự / Định biên</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-8">Đang tải dữ liệu từ server...</td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-8">Không tìm thấy phòng ban nào</td>
                </tr>
              ) : (
                paginatedDepartments.map(dept => {
                  const stats = getDeptHierarchyStats.get(dept.id) || {
                    directHeadcount: dept._count?.employees || 0,
                    totalHeadcount: dept._count?.employees || 0,
                    directQuota: dept.quota || 15,
                    hasChildren: false,
                    childCount: 0
                  };
                  const currentHeadcount = stats.directHeadcount;
                  const quota = stats.directQuota;
                  const status = dept.status || 'Hoạt động';
                  const isChecked = selectedSet.has(dept.id);

                  return (
                    <tr key={dept.id} style={isChecked ? { backgroundColor: '#F8FAFF' } : undefined}>
                      <td style={{ textAlign: 'center' }}>
                        <TableCheckbox
                          checked={isChecked}
                          onChange={() => toggleOne(dept.id)}
                          title={`Chọn ${dept.name}`}
                        />
                      </td>
                      <td>
                        <span style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          {dept.code}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                            <Building size={16} color="var(--text-muted)" />
                          </div>
                          <div className="flex-col">
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dept.name}</span>
                              {!dept.parentId && (
                                <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                  Pháp nhân gốc
                                </span>
                              )}
                            </div>
                            {stats.hasChildren && (
                              <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                                Quản lý {stats.childCount} phòng ban trực thuộc
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{dept.managerName || '-'}</td>
                      <td>
                        {dept.parentId ? (
                          <span className="badge badge-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-muted)' }}>
                            {departments.find(d => d.id === dept.parentId)?.name || 'Không rõ'}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold italic" style={{ color: 'var(--primary)' }}>
                            🏛️ Tổ chức mẹ (Cấp gốc)
                          </span>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const fillPercent = Math.round((currentHeadcount / (quota || 1)) * 100);
                          const isOver = currentHeadcount > quota;
                          const isFull = currentHeadcount === quota && quota > 0;
                          const barColor = isOver ? '#DC2626' : (isFull || fillPercent >= 80) ? '#16A34A' : '#2563EB';

                          return (
                            <div style={{ minWidth: 175 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div className="flex items-center gap-1.5">
                                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                    {currentHeadcount} <span style={{ fontWeight: 400, color: '#64748B' }}>/ {quota} người</span>
                                  </span>
                                  {stats.hasChildren && (
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        fontSize: '0.65rem', 
                                        padding: '1px 5px', 
                                        backgroundColor: '#EFF6FF', 
                                        color: '#1D4ED8', 
                                        border: '1px solid #BFDBFE',
                                        fontWeight: 600
                                      }}
                                      title={`Quản lý ${stats.childCount} phòng con (định biên riêng độc lập với phòng cha)`}
                                    >
                                      +{stats.childCount} phòng con
                                    </span>
                                  )}
                                </div>
                                <span 
                                  style={{ 
                                    fontSize: '0.6875rem', 
                                    fontWeight: 600,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: isOver ? '#FEF2F2' : isFull ? '#F0FDF4' : '#EFF6FF',
                                    color: isOver ? '#DC2626' : isFull ? '#16A34A' : '#2563EB',
                                    border: `1px solid ${isOver ? '#FECACA' : isFull ? '#BBF7D0' : '#BFDBFE'}`
                                  }}
                                >
                                  {isOver ? `Vượt ${currentHeadcount - quota} ⚠` : isFull ? 'Đủ 100%' : `Còn ${quota - currentHeadcount}`}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${Math.min(100, fillPercent)}%`, 
                                    height: '100%', 
                                    backgroundColor: barColor,
                                    borderRadius: 3,
                                    transition: 'width 0.3s ease'
                                  }} 
                                />
                              </div>
                              {stats.hasChildren && (
                                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 3 }}>
                                  Phòng con: <strong>{stats.totalHeadcount - stats.directHeadcount}</strong> người • Toàn nhánh: <strong>{stats.totalHeadcount}</strong>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${status === 'ACTIVE' || status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                          {status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 28px)', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => setLockTarget(dept)} 
                            style={{
                              height: 28, width: 28, padding: 0,
                              borderRadius: '6px',
                              backgroundColor: (status === 'ACTIVE' || status === 'Hoạt động') ? '#F0FDF4' : '#FEF3C7',
                              border: `1px solid ${(status === 'ACTIVE' || status === 'Hoạt động') ? '#BBF7D0' : '#FDE68A'}`,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={status === 'ACTIVE' || status === 'Hoạt động' ? 'Khóa (Ngưng hoạt động)' : 'Mở khóa (Hoạt động)'}
                          >
                            {status === 'ACTIVE' || status === 'Hoạt động' ? <Unlock size={14} color="#16A34A" /> : <Lock size={14} color="#D97706" />}
                          </button>
                          
                          <button 
                            onClick={() => handleOpenEdit(dept)} 
                            style={{
                              height: 28, width: 28, padding: 0,
                              borderRadius: '6px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#475569',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#2563EB'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                            title="Chỉnh sửa thông tin phòng ban"
                          >
                            <Edit2 size={14} />
                          </button>
                          
                          <button 
                            onClick={() => setDeleteId(dept.id)} 
                            style={{
                              height: 28, width: 28, padding: 0,
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              color: '#94A3B8',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#94A3B8'; }}
                            title="Xóa phòng ban"
                          >
                            <Trash2 size={14} />
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
          itemLabel="phòng ban"
          flush={false}
        />
      </div>

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden" style={{ width: '600px', maxWidth: '95vw', padding: 0, animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {modalMode === 'add' ? 'Thêm Phòng ban Mới' : 'Cập nhật Phòng ban'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Tên phòng ban <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Nhập tên phòng ban..."
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Mã phòng ban <span className="text-xs text-[var(--text-muted)] font-normal">(Hệ thống tự sinh)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  className="form-input w-full font-mono font-semibold"
                  value={formData.code}
                  placeholder="Hệ thống tự sinh theo tên..."
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.75, cursor: 'not-allowed', backgroundColor: 'var(--bg-hover)' }}
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Người đại diện</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.managerName || ''}
                  onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="Họ tên người đại diện..."
                />
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 1' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">Phòng ban trực thuộc (Cấp cha)</label>
                <select
                  className="form-input w-full"
                  style={{ padding: '0.5rem' }}
                  value={formData.parentId}
                  onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="" className="text-black">-- Không thuộc phòng nào (Độc lập) --</option>
                  {departments.filter(d => d.id !== editingId).map(d => (
                    <option key={d.id} value={d.id} className="text-black">{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-col gap-2" style={{ gridColumn: 'span 2' }}>
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  Định biên nhân sự (Số người tối đa được duyệt) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  className="form-input w-full font-semibold"
                  value={formData.quota || 15}
                  onChange={e => setFormData({ ...formData, quota: Math.max(1, parseInt(e.target.value) || 1) })}
                  placeholder="Ví dụ: 15"
                />
                <span className="text-xs text-[var(--text-muted)]">
                  Định biên riêng cho các vị trí trực thuộc trực tiếp đơn vị này (Ví dụ cấp cha gồm Trưởng, Phó, Thư ký...; các phòng/tổ con tự quản lý định biên riêng và không cộng dồn hay giới hạn lẫn nhau).
                </span>
                {(() => {
                  const currentStats = modalMode === 'edit' && editingId ? getDeptHierarchyStats.get(editingId) : null;
                  if (currentStats && currentStats.hasChildren) {
                    return (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.76rem', color: '#1D4ED8', marginTop: 4 }}>
                        🏢 <strong>Đơn vị cấp cha:</strong> Đang quản lý <strong>{currentStats.childCount}</strong> phòng ban con (Mối quan hệ trực thuộc trên cây tổ chức; định biên của mỗi đơn vị là độc lập).
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="flex justify-end" style={{ gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy bỏ</button>
              <button onClick={handleSave} className="btn btn-primary">Lưu thông tin</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lock/Unlock Confirmation Modal */}
      {lockTarget && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col items-center justify-center text-center gap-4" style={{ width: '420px', padding: '1.5rem', animation: 'zoomIn 0.2s ease-out' }}>
            <div className="flex items-center justify-center mb-2" style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: (lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' }}>
              {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? (
                <Lock size={32} color="#F59E0B" />
              ) : (
                <Unlock size={32} color="#10B981" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">
              {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? 'Xác nhận khóa phòng ban?' : 'Xác nhận mở khóa phòng ban?'}
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? (
                <>Phòng ban <strong>{lockTarget.name}</strong> ({lockTarget.code}) sẽ chuyển sang trạng thái <strong>Ngưng hoạt động</strong>. Bạn có chắc chắn muốn khóa?</>
              ) : (
                <>Phòng ban <strong>{lockTarget.name}</strong> ({lockTarget.code}) sẽ được mở khóa và chuyển sang trạng thái <strong>Hoạt động</strong>.</>
              )}
            </p>

            <div className="flex justify-center w-full" style={{ gap: '0.75rem' }}>
              <button onClick={() => setLockTarget(null)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
              <button 
                onClick={handleConfirmToggleStatus} 
                className="btn" 
                style={{ 
                  flex: 1, 
                  backgroundColor: (lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? '#F59E0B' : '#10B981', 
                  color: 'white',
                  border: 'none'
                }}
              >
                {(lockTarget.status === 'ACTIVE' || lockTarget.status === 'Hoạt động') ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col items-center justify-center text-center gap-4" style={{ width: '400px', padding: '1.5rem', animation: 'zoomIn 0.2s ease-out' }}>
            <div className="flex items-center justify-center mb-2" style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'var(--bg-hover)' }}>
              <AlertTriangle size={32} color="var(--error)" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Xác nhận xóa?</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Thao tác này sẽ xóa vĩnh viễn phòng ban khỏi hệ thống. Các nhân viên thuộc phòng ban này (nếu có) sẽ bị mất dữ liệu liên kết.
            </p>

            <div className="flex justify-center w-full" style={{ gap: '0.75rem' }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
              <button onClick={handleDelete} className="btn" style={{ flex: 1, backgroundColor: 'var(--error)', color: 'white' }}>Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Nhập Excel Hàng Loạt */}
      <UniversalImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Nhập danh sách phòng ban từ Excel"
        subtitle="Tải file mẫu, điền tên phòng ban và nạp cơ cấu tổ chức tự động"
        templateFileName="Mau_Nhap_Phong_Ban"
        columns={departmentImportColumns}
        sampleData={sampleDepartmentData}
        onConfirmImport={handleConfirmImportDepartments}
      />
    </div>
  );
};
