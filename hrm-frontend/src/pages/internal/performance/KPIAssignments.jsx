import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Search, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, 
  TrendingUp, Award, Layers, Sparkles, Filter, X, ArrowRight, UserCheck, Calendar, BookOpen
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { PageHeader } from '../../../components/common/PageHeader';
import { DateInput } from '../../../components/common/DateInput';
import { formatDate } from '../../../utils/dateUtils';

export const KPIAssignments = () => {
  const [kpis, setKpis] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  // Modal Giao KPI (Chọn Mẫu -> Chọn Phòng Ban -> Danh Sách Checkbox Nhân Sự)
  const [positions, setPositions] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState('TEMPLATE'); // 'TEMPLATE' | 'MANUAL'
  const [assignTargetScope, setAssignTargetScope] = useState('DEPARTMENT'); // 'DEPARTMENT' | 'INDIVIDUAL'
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateItems, setTemplateItems] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [assignStartDate, setAssignStartDate] = useState('2026-10-01');
  const [assignEndDate, setAssignEndDate] = useState('2026-12-31');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Form tự tạo chỉ tiêu lẻ
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    description: '',
    target: 100,
    unit: '%',
    weight: 25,
    direction: 'HIGHER_IS_BETTER',
    maxScoreCap: 120,
    category: 'OUTPUT',
    evidenceUrl: ''
  });

  // Modal 3: Cập nhật tiến độ thực tế (Achieved)
  const [updatingKpi, setUpdatingKpi] = useState(null);
  const [achievedVal, setAchievedVal] = useState(0);
  const [evidenceUrlVal, setEvidenceUrlVal] = useState('');

  // Modal 4: Chỉnh sửa chỉ tiêu KPI (Quản lý)
  const [editingKpi, setEditingKpi] = useState(null);
  const [editKpiForm, setEditKpiForm] = useState({
    description: '',
    target: 100,
    achieved: 0,
    unit: '%',
    weight: 25,
    direction: 'HIGHER_IS_BETTER',
    maxScoreCap: 120,
    category: 'OUTPUT',
    evidenceUrl: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, empRes, tplRes, posRes] = await Promise.all([
        axios.get('/api/kpi/kpi'),
        axios.get('/api/employees'),
        axios.get('/api/kpi/templates'),
        axios.get('/api/positions').catch(() => ({ data: [] }))
      ]);
      setKpis(kpiRes.data || []);
      const emps = empRes.data || [];
      setEmployees(emps);
      const tpls = tplRes.data || [];
      setTemplates(tpls);
      setPositions(posRes.data || []);
      if (emps.length > 0 && !manualForm.employeeId) {
        setManualForm(prev => ({ ...prev, employeeId: emps[0].id }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper lấy nhân sự chính xác theo phòng ban (tránh lỗi null/undefined gây lọt danh sách)
  const getEmployeesByDept = (deptName) => {
    if (!deptName || deptName === 'ALL') return employees;
    if (deptName === 'Chưa phân phòng ban') {
      return employees.filter(e => !e.department?.name);
    }
    return employees.filter(e => e.department?.name === deptName);
  };

  const departments = useMemo(() => {
    const list = Array.from(new Set(employees.map(e => e.department?.name).filter(Boolean)));
    const hasUnassigned = employees.some(e => !e.department?.name);
    if (hasUnassigned) {
      list.push('Chưa phân phòng ban');
    }
    return list;
  }, [employees]);

  // Danh sách các chức danh thực tế có trong phòng ban đã chọn
  const deptPositions = useMemo(() => {
    const list = getEmployeesByDept(selectedDepartment);
    return Array.from(new Set(list.map(e => e.position?.title).filter(Boolean)));
  }, [selectedDepartment, employees]);

  // Danh sách nhân sự thuộc phòng ban được chọn (có lọc theo Chức danh nếu chọn)
  const deptEmployees = useMemo(() => {
    let list = getEmployeesByDept(selectedDepartment);
    if (selectedPositionFilter) {
      list = list.filter(e => e.position?.title === selectedPositionFilter);
    }
    return list;
  }, [selectedDepartment, employees, selectedPositionFilter]);

  // Danh sách nhân sự khi chọn lẻ (có lọc theo tìm kiếm)
  const individualEmployees = useMemo(() => {
    if (!empSearchTerm.trim()) return employees;
    const q = empSearchTerm.toLowerCase().trim();
    return employees.filter(e => 
      e.fullName.toLowerCase().includes(q) || 
      e.code.toLowerCase().includes(q) ||
      (e.department?.name && e.department.name.toLowerCase().includes(q))
    );
  }, [employees, empSearchTerm]);

  // Mẫu KPI hiện đang được chọn
  const currentTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0] || null;
  }, [templates, selectedTemplateId]);

  const loadTemplateItems = (tpl) => {
    if (!tpl || !tpl.items) {
      setTemplateItems([]);
      return;
    }
    try {
      const parsed = typeof tpl.items === 'string' ? JSON.parse(tpl.items) : tpl.items;
      if (Array.isArray(parsed)) {
        setTemplateItems(parsed.map(item => ({ 
          ...item,
          direction: item.direction || 'HIGHER_IS_BETTER',
          maxScoreCap: item.maxScoreCap !== undefined ? item.maxScoreCap : 120
        })));
      }
    } catch (e) {
      setTemplateItems([]);
    }
  };

  const handleSelectDepartment = (deptName) => {
    setSelectedDepartment(deptName);
    setSelectedPositionFilter('');
    const emps = getEmployeesByDept(deptName);
    // Tự động tích chọn toàn bộ nhân sự trong phòng ban được chọn
    setSelectedEmployeeIds(emps.map(e => e.id));
  };

  const handleSelectPositionFilter = (posTitle) => {
    setSelectedPositionFilter(posTitle);
    const baseList = getEmployeesByDept(selectedDepartment);
    const filtered = posTitle ? baseList.filter(e => e.position?.title === posTitle) : baseList;
    setSelectedEmployeeIds(filtered.map(e => e.id));
  };

  const handleSelectTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      loadTemplateItems(tpl);

      // Nếu mẫu có gợi ý phòng ban cụ thể (không phải Toàn công ty) thì tự động chuyển sang phòng ban đó
      if (tpl.department && !tpl.department.toLowerCase().includes('toàn công ty')) {
        const matchedDept = departments.find(d => 
          d.toLowerCase() === tpl.department.toLowerCase()
        );
        if (matchedDept) {
          handleSelectDepartment(matchedDept);
          return;
        }
      }

      // Nếu không, giữ nguyên phòng ban hiện tại hoặc chọn phòng ban đầu tiên
      if (!selectedDepartment && departments.length > 0) {
        handleSelectDepartment(departments[0]);
      }
    }
  };

  const handleOpenAssignModal = () => {
    setAssignMode('TEMPLATE');
    setAssignTargetScope('DEPARTMENT');
    setEmpSearchTerm('');
    setSelectedPositionFilter('');
    setAssignStartDate('2026-10-01');
    setAssignEndDate('2026-12-31');

    if (templates.length > 0) {
      const firstTpl = templates[0];
      setSelectedTemplateId(firstTpl.id);
      loadTemplateItems(firstTpl);

      // Gợi ý phòng ban
      let targetDept = departments[0] || '';
      if (firstTpl.department && !firstTpl.department.toLowerCase().includes('toàn công ty')) {
        const found = departments.find(d => 
          d.toLowerCase() === firstTpl.department.toLowerCase()
        );
        if (found) targetDept = found;
      }

      if (targetDept) {
        handleSelectDepartment(targetDept);
      } else {
        setSelectedEmployeeIds(employees.map(e => e.id));
      }
    } else if (departments.length > 0) {
      handleSelectDepartment(departments[0]);
    }

    if (employees.length > 0) {
      setManualForm(prev => ({ ...prev, employeeId: employees[0].id }));
    }
    setIsAssignModalOpen(true);
  };

  const handleToggleEmployee = (empId) => {
    if (selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
    }
  };

  const handleSelectAllInScope = (currentList) => {
    const currentIds = currentList.map(e => e.id);
    const allSelected = currentIds.length > 0 && currentIds.every(id => selectedEmployeeIds.includes(id));
    if (allSelected) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedEmployeeIds(Array.from(new Set([...selectedEmployeeIds, ...currentIds])));
    }
  };

  const handleTemplateItemTargetChange = (idx, newTarget) => {
    const updated = [...templateItems];
    updated[idx].target = Number(newTarget);
    setTemplateItems(updated);
  };

  const handleTemplateItemWeightChange = (idx, newWeight) => {
    const updated = [...templateItems];
    updated[idx].weight = Number(newWeight);
    setTemplateItems(updated);
  };

  const totalTemplateWeight = useMemo(() => {
    return templateItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  }, [templateItems]);

  const handleSubmitAssign = async (e) => {
    e.preventDefault();

    setAssignSubmitting(true);
    try {
      if (assignStartDate && assignEndDate && new Date(assignStartDate) > new Date(assignEndDate)) {
        setAssignSubmitting(false);
        return toast.error('Ngày bắt đầu không thể sau ngày kết thúc!');
      }
      const computedPeriod = (assignStartDate && assignEndDate) 
        ? `${formatDate(assignStartDate)} - ${formatDate(assignEndDate)}` 
        : '01/10/2026 - 31/12/2026';

      if (assignMode === 'TEMPLATE') {
        if (selectedEmployeeIds.length === 0) {
          setAssignSubmitting(false);
          return toast.error('Vui lòng chọn ít nhất 1 nhân sự để giao KPI');
        }
        if (!templateItems || templateItems.length === 0) {
          setAssignSubmitting(false);
          return toast.error('Mẫu KPI chưa có danh sách tiêu chuẩn');
        }
        if (Math.abs(totalTemplateWeight - 100) > 1) {
          setAssignSubmitting(false);
          return toast.error(`Tổng trọng số bộ chỉ tiêu phải bằng 100% (Hiện tại là ${totalTemplateWeight}%)`);
        }

        await axios.post('/api/kpi/assign-template', {
          employeeIds: selectedEmployeeIds,
          templateId: selectedTemplateId,
          customItems: templateItems,
          period: computedPeriod,
          startDate: assignStartDate,
          endDate: assignEndDate
        });

        toast.success(`Đã giao thành công bộ ${templateItems.length} KPI cho ${selectedEmployeeIds.length} nhân sự thuộc phòng ${currentTemplate?.department || ''}!`);
      } else {
        if (!manualForm.employeeId) {
          setAssignSubmitting(false);
          return toast.error('Vui lòng chọn nhân sự áp dụng');
        }
        if (!manualForm.description.trim()) {
          setAssignSubmitting(false);
          return toast.error('Vui lòng nhập mô tả chỉ tiêu KPI');
        }

        await axios.post('/api/kpi/kpi', {
          employeeId: manualForm.employeeId,
          description: manualForm.description,
          target: Number(manualForm.target),
          unit: manualForm.unit,
          weight: Number(manualForm.weight),
          direction: manualForm.direction,
          maxScoreCap: Number(manualForm.maxScoreCap),
          category: manualForm.category,
          period: computedPeriod,
          startDate: assignStartDate,
          endDate: assignEndDate,
          evidenceUrl: manualForm.evidenceUrl
        });

        toast.success(`Đã giao chỉ tiêu "${manualForm.description}" thành công!`);
        setManualForm({
          employeeId: employees.length > 0 ? employees[0].id : '',
          description: '',
          target: 100,
          unit: '%',
          weight: 25,
          direction: 'HIGHER_IS_BETTER',
          maxScoreCap: 120,
          category: 'OUTPUT',
          evidenceUrl: ''
        });
      }

      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error assigning KPI:', err);
      toast.error(err.response?.data?.error || 'Lỗi khi giao KPI');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Cập nhật tiến độ thực tế (Achieved)
  const handleUpdateAchieved = async (e) => {
    e.preventDefault();
    if (!updatingKpi) return;
    try {
      await axios.put(`/api/kpi/kpi/${updatingKpi.id}`, {
        achieved: Number(achievedVal),
        evidenceUrl: evidenceUrlVal
      });
      toast.success('Đã cập nhật tiến độ KPI thành công!');
      setUpdatingKpi(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi cập nhật tiến độ');
    }
  };

  // Mở modal Sửa Chỉ tiêu KPI
  const handleOpenEditKpi = (k) => {
    setEditingKpi(k);
    setEditKpiForm({
      description: k.description,
      target: Number(k.target || 100),
      achieved: Number(k.achieved || 0),
      unit: k.unit || '%',
      weight: Number(k.weight || 25),
      category: k.category || 'OUTPUT',
      period: k.period || 'Q3-2026'
    });
  };

  // Lưu chỉnh sửa KPI
  const handleSaveEditKpi = async (e) => {
    e.preventDefault();
    if (!editingKpi) return;
    try {
      await axios.put(`/api/kpi/kpi/${editingKpi.id}`, {
        description: editKpiForm.description,
        target: Number(editKpiForm.target),
        achieved: Number(editKpiForm.achieved),
        unit: editKpiForm.unit,
        weight: Number(editKpiForm.weight),
        category: editKpiForm.category,
        period: editKpiForm.period
      });
      toast.success('Đã cập nhật chỉ tiêu KPI thành công!');
      setEditingKpi(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi cập nhật chỉ tiêu KPI');
    }
  };

  const handleDeleteKpi = async (id, desc) => {
    if (!window.confirm(`Xác nhận xóa chỉ tiêu KPI: "${desc}"?`)) return;
    try {
      await axios.delete(`/api/kpi/kpi/${id}`);
      toast.success('Đã xóa KPI');
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi xóa KPI');
    }
  };

  // Tính tỷ lệ % hoàn thành chuẩn hóa theo chiều đo & trần điểm
  const computeProgress = (target, achieved, unit, direction, maxCap = 120, minFloor = 0) => {
    const t = Number(target || 0);
    const a = Number(achieved || 0);
    const dir = direction || ((unit === 'ms' || unit === 'ngày' || unit === 'bug' || unit === 'lỗi' || unit === 'lần') ? 'LOWER_IS_BETTER' : 'HIGHER_IS_BETTER');
    const cap = Number(maxCap || 120);
    const floor = Number(minFloor || 0);

    if (dir === 'BOOLEAN') {
      if (t === 0) return a === 0 ? 100 : 0;
      return a >= t ? 100 : 0;
    }
    if (dir === 'LOWER_IS_BETTER') {
      if (t === 0) return a <= 0 ? 100 : Math.max(floor, 100 - a * 25);
      if (a <= t) {
        const bonus = t > 0 ? ((t - a) / t) * (cap - 100) : 0;
        return Math.min(cap, Math.round(100 + bonus));
      }
      return Math.max(floor, Math.round((t / a) * 100));
    }
    // HIGHER_IS_BETTER
    if (t === 0) return a > 0 ? cap : 100;
    return Math.max(floor, Math.min(cap, Math.round((a / t) * 100)));
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = kpis.length;
    let excellent = 0;
    let onTrack = 0;
    let needsAttention = 0;

    kpis.forEach(k => {
      const p = computeProgress(k.target, k.achieved, k.unit, k.direction, k.maxScoreCap, k.minScoreFloor);
      if (p >= 90) excellent++;
      else if (p >= 70) onTrack++;
      else needsAttention++;
    });

    return { total, excellent, onTrack, needsAttention };
  }, [kpis]);

  // Filtered KPIs

  const filteredKpis = useMemo(() => {
    return kpis.filter(k => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        k.description.toLowerCase().includes(q) ||
        (k.employee?.fullName && k.employee.fullName.toLowerCase().includes(q)) ||
        (k.employee?.code && k.employee.code.toLowerCase().includes(q));

      const matchDept = filterDept === 'ALL' || k.employee?.department?.name === filterDept;

      return matchSearch && matchDept;
    });
  }, [kpis, searchTerm, filterDept]);

  // Phân trang
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedKpis,
  } = usePagination(filteredKpis, 10);

  return (
    <div className="flex-col gap-5 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      
      {/* 1. Header chuẩn đồng bộ */}
      <PageHeader
        icon={<Target size={20} />}
        title="Quản lý Giao Chỉ Tiêu KPI (KPI Assignments)"
        subtitle="Giao mục tiêu định lượng từ Bộ Mẫu Chuẩn Hóa, theo dõi tiến độ thực tế và kết quả hoàn thành của từng nhân sự."
        actions={
          <button 
            className="btn btn-primary" 
            onClick={handleOpenAssignModal}
            style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Giao chỉ tiêu KPI
          </button>
        }
      />

      {/* 2. Thống Kê 4 Khối Mini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>TỔNG CHỈ TIÊU ĐÃ GIAO</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{stats.total}</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>XUẤT SẮC (TIẾN ĐỘ ≥ 90%)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>{stats.excellent}</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 600 }}>ĐÚNG TIẾN ĐỘ (70% - 89%)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1D4ED8', marginTop: '4px' }}>{stats.onTrack}</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.78rem', color: '#C2410C', fontWeight: 600 }}>CẦN CẢI THIỆN (&lt; 70%)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#C2410C', marginTop: '4px' }}>{stats.needsAttention}</div>
        </div>
      </div>

      {/* 3. Bảng Danh Sách KPI Chi Tiết */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        {/* Bộ lọc tìm kiếm */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm nhân viên, mã NV hoặc mô tả chỉ tiêu..." 
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '0.85rem', height: '36px' }}
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <select
              className="form-select"
              value={filterDept}
              onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }}
              style={{ width: '180px', height: '36px', fontSize: '0.825rem' }}
            >
              <option value="ALL">-- Tất cả phòng ban --</option>
              {departments.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            Hiển thị: <strong>{filteredKpis.length}</strong> chỉ tiêu
          </span>
        </div>

        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>NHÂN SỰ ÁP DỤNG</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>PHÒNG BAN & CHỨC DANH</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>MÔ TẢ TIÊU CHÍ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>TRỌNG SỐ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>CHỈ TIÊU (TARGET)</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>ĐÃ ĐẠT (ACHIEVED)</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>TIẾN ĐỘ (%)</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>TRẠNG THÁI</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Đang tải dữ liệu...</td></tr>
              ) : filteredKpis.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Chưa có chỉ tiêu KPI nào phù hợp.</td></tr>
              ) : paginatedKpis.map(k => {
                const progress = computeProgress(k.target, k.achieved, k.unit, k.direction, k.maxScoreCap, k.minScoreFloor);
                const isExcellent = progress >= 90;
                const isOnTrack = progress >= 70 && progress < 90;
                const unitStr = k.unit || '%';

                return (
                  <tr key={k.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    
                    {/* Cột 1: Nhân sự */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                        {k.employee?.fullName || '—'}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>
                        {k.employee?.code || '—'}
                      </span>
                    </td>

                    {/* Cột 2: Phòng ban & Chức danh */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                        {k.employee?.department?.name || 'Tổ chức'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {k.employee?.position?.title || 'Chuyên viên'}
                      </div>
                    </td>

                    {/* Cột 3: Mô tả chỉ tiêu */}
                    <td style={{ padding: '12px 14px', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>
                        {k.description}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                          {k.category || 'OUTPUT'}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} /> Hạn: {k.period || '31/12/2026'}
                        </span>
                        {k.direction === 'LOWER_IS_BETTER' && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600 }}>
                            📉 Càng ít lỗi càng tốt
                          </span>
                        )}
                        {k.direction === 'BOOLEAN' && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F3E8FF', color: '#7E22CE', fontWeight: 600 }}>
                            ⚖️ Đạt / Không đạt
                          </span>
                        )}
                        {k.evidenceUrl && (
                          <a 
                            href={k.evidenceUrl.startsWith('http') ? k.evidenceUrl : `https://${k.evidenceUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 600, textDecoration: 'none' }}
                          >
                            📎 Xem minh chứng
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Cột 4: Trọng số */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
                      {k.weight ? `${k.weight}%` : '25%'}
                    </td>

                    {/* Cột 5: Mục tiêu */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                      {Number(k.target).toLocaleString('vi-VN')} {unitStr}
                    </td>

                    {/* Cột 6: Đã đạt */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#047857', fontSize: '0.85rem' }}>
                      {Number(k.achieved).toLocaleString('vi-VN')} {unitStr}
                    </td>

                    {/* Cột 7: Thanh tiến độ */}
                    <td style={{ padding: '12px 14px', minWidth: '150px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '3px' }}>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '7px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: isExcellent ? '#16A34A' : (isOnTrack ? '#2563EB' : '#EA580C'),
                          borderRadius: '99px'
                        }} />
                      </div>
                    </td>

                    {/* Cột 8: Trạng thái badge */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className="badge" style={{
                        backgroundColor: isExcellent ? '#DCFCE7' : (isOnTrack ? '#DBEAFE' : '#FFEDD5'),
                        color: isExcellent ? '#166534' : (isOnTrack ? '#1E40AF' : '#C2410C'),
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px'
                      }}>
                        {isExcellent ? 'Vượt chỉ tiêu' : (isOnTrack ? 'Đạt tiến độ' : 'Cần đôn đốc')}
                      </span>
                    </td>

                    {/* Cột 9: Thao tác */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          className="btn btn-outline"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', borderColor: '#BFDBFE' }}
                          title="Cập nhật tiến độ thực tế"
                          onClick={() => {
                            setUpdatingKpi(k);
                            setAchievedVal(Number(k.achieved || 0));
                            setEvidenceUrlVal(k.evidenceUrl || '');
                          }}
                        >
                          <TrendingUp size={15} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669', borderColor: '#A7F3D0' }}
                          title="Chỉnh sửa chỉ tiêu"
                          onClick={() => handleOpenEditKpi(k)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', borderColor: '#FECACA' }}
                          title="Xóa chỉ tiêu này"
                          onClick={() => handleDeleteKpi(k.id, k.description)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phân Trang */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="chỉ tiêu"
          flush={false}
        />
      </div>

      {/* MODAL GIAO CHỈ TIÊU KPI (TỰ ĐỘNG QUÉT NHÂN SỰ THEO PHÒNG BAN & CHỨC DANH CỦA MẪU) */}
      {isAssignModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', width: '840px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={22} color="#2563EB" /> Giao Mục Tiêu Định Lượng (KPI)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Áp dụng bộ mẫu chuẩn hóa cho phòng ban hoặc tự tùy biến chỉ tiêu riêng lẻ.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAssignModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Chọn HÌNH THỨC GIAO (2 Tabs) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#F1F5F9', padding: '5px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAssignMode('TEMPLATE')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    backgroundColor: assignMode === 'TEMPLATE' ? '#FFFFFF' : 'transparent',
                    color: assignMode === 'TEMPLATE' ? '#2563EB' : '#64748B',
                    boxShadow: assignMode === 'TEMPLATE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Sparkles size={16} /> Áp dụng từ Mẫu Chuẩn (Khuyến nghị)
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('MANUAL')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    backgroundColor: assignMode === 'MANUAL' ? '#FFFFFF' : 'transparent',
                    color: assignMode === 'MANUAL' ? '#2563EB' : '#64748B',
                    boxShadow: assignMode === 'MANUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Plus size={16} /> Tự tạo chỉ tiêu lẻ (Tùy biến)
                </button>
              </div>

              {assignMode === 'TEMPLATE' ? (
                /* TAB 1: GIAO THEO MẪU CHUẨN */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* 1. Chọn Mẫu KPI */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      1. Chọn Bộ Mẫu KPI Tiêu Chuẩn *
                    </label>
                    <select 
                      className="form-select" 
                      value={selectedTemplateId} 
                      onChange={e => handleSelectTemplate(e.target.value)}
                      style={{ fontSize: '0.88rem', fontWeight: 600, height: '40px' }}
                    >
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.department ? `Gợi ý: ${tpl.department}` : 'Dùng chung'}) — {tpl.criteria || 4} tiêu chí
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Thời gian áp dụng: Ngày bắt đầu & Ngày kết thúc */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} color="#2563EB" />
                      <span>Thời gian áp dụng chỉ tiêu KPI:</span>
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Từ ngày (Ngày bắt đầu) *
                        </span>
                        <DateInput
                          value={assignStartDate}
                          onChange={val => setAssignStartDate(val)}
                          required
                          style={{ height: '38px', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Đến ngày (Hạn chót hoàn thành) *
                        </span>
                        <DateInput
                          value={assignEndDate}
                          onChange={val => setAssignEndDate(val)}
                          required
                          style={{ height: '38px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Chọn Đối Tượng Áp Dụng (Theo Phòng ban CÓ CHECKBOX LỌC NGƯỜI HOẶC Chọn lẻ) */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={16} color="#2563EB" />
                        <span>2. Chọn nhân sự áp dụng:</span>
                      </div>

                      {/* Nút chuyển chế độ: Giao theo Phòng ban vs Chọn lẻ */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignTargetScope('DEPARTMENT');
                            if (departments.length > 0 && !selectedDepartment) {
                              handleSelectDepartment(departments[0]);
                            } else if (selectedDepartment) {
                              handleSelectDepartment(selectedDepartment);
                            }
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: assignTargetScope === 'DEPARTMENT' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                            backgroundColor: assignTargetScope === 'DEPARTMENT' ? '#EFF6FF' : '#FFFFFF',
                            color: assignTargetScope === 'DEPARTMENT' ? '#1D4ED8' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Layers size={14} /> Giao theo Phòng ban
                        </button>

                        <button
                          type="button"
                          onClick={() => setAssignTargetScope('INDIVIDUAL')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: assignTargetScope === 'INDIVIDUAL' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                            backgroundColor: assignTargetScope === 'INDIVIDUAL' ? '#EFF6FF' : '#FFFFFF',
                            color: assignTargetScope === 'INDIVIDUAL' ? '#1D4ED8' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <UserCheck size={14} /> Chọn nhân sự lẻ
                        </button>
                      </div>
                    </div>

                    {/* NẾU LÀ GIAO THEO PHÒNG BAN */}
                    {assignTargetScope === 'DEPARTMENT' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Chọn Phòng ban cần giao KPI:
                            </label>
                            <select
                              className="form-select"
                              value={selectedDepartment}
                              onChange={e => handleSelectDepartment(e.target.value)}
                              style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              {departments.map((d, i) => (
                                <option key={i} value={d}>
                                  Phòng ban: {d} ({getEmployeesByDept(d).length} nhân sự)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Lọc theo Chức danh (Tùy chọn):
                            </label>
                            <select
                              className="form-select"
                              value={selectedPositionFilter}
                              onChange={e => handleSelectPositionFilter(e.target.value)}
                              style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              <option value="">
                                -- Tất cả chức danh trong phòng ({getEmployeesByDept(selectedDepartment).length} nhân sự) --
                              </option>
                              {deptPositions.map((posTitle, i) => (
                                <option key={i} value={posTitle}>
                                  {posTitle} ({getEmployeesByDept(selectedDepartment).filter(e => e.position?.title === posTitle).length} nhân sự)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Tiêu đề & Nút Chọn tất cả / Bỏ chọn */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                            Danh sách nhân sự phòng <u>{selectedDepartment}</u> {selectedPositionFilter ? `— Vị trí: "${selectedPositionFilter}"` : ''} (Tích chọn người nhận KPI):
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectAllInScope(deptEmployees)}
                              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {deptEmployees.length > 0 && deptEmployees.every(e => selectedEmployeeIds.includes(e.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.78rem', fontWeight: 700, border: '1px solid #BFDBFE' }}>
                              Đã chọn: {selectedEmployeeIds.filter(id => deptEmployees.some(e => e.id === id)).length} / {deptEmployees.length} nhân sự
                            </span>
                          </div>
                        </div>

                        {/* Checkbox Grid nhân viên trong phòng */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px 2px' }}>
                          {deptEmployees.length === 0 ? (
                            <div style={{ color: '#94A3B8', fontSize: '0.8rem', padding: '10px' }}>Không có nhân viên nào phù hợp với điều kiện lọc này.</div>
                          ) : (
                            deptEmployees.map(emp => {
                              const isChecked = selectedEmployeeIds.includes(emp.id);
                              return (
                                <label 
                                  key={emp.id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    padding: '8px 12px', 
                                    borderRadius: '8px', 
                                    border: isChecked ? '1.5px solid #2563EB' : '1px solid #CBD5E1', 
                                    backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF', 
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => handleToggleEmployee(emp.id)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                  <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? '#1E40AF' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {emp.fullName}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                      {emp.code} • {emp.position?.title || (selectedDepartment === 'Chưa phân phòng ban' ? 'Chưa gắn chức danh' : 'Nhân viên')}
                                    </div>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      /* NẾU LÀ CHỌN LẺ TỪNG NHÂN SỰ */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            placeholder="Tìm nhân sự theo tên, mã NV hoặc phòng ban..." 
                            className="form-input"
                            value={empSearchTerm}
                            onChange={e => setEmpSearchTerm(e.target.value)}
                            style={{ height: '36px', fontSize: '0.82rem', width: '320px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectAllInScope(individualEmployees)}
                              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {selectedEmployeeIds.length === individualEmployees.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.78rem', fontWeight: 700, border: '1px solid #BFDBFE' }}>
                              Đã chọn: {selectedEmployeeIds.length} nhân sự
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px 2px' }}>
                          {individualEmployees.map(emp => {
                            const isChecked = selectedEmployeeIds.includes(emp.id);
                            return (
                              <label 
                                key={emp.id} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  padding: '8px 12px', 
                                  borderRadius: '8px', 
                                  border: isChecked ? '1.5px solid #2563EB' : '1px solid #CBD5E1', 
                                  backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF', 
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleToggleEmployee(emp.id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? '#1E40AF' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {emp.fullName}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                    {emp.code} • {emp.position?.title || 'Chưa gắn chức danh'} • <span style={{ color: '#2563EB', fontWeight: 600 }}>{emp.department?.name || 'Chưa phân phòng'}</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Danh sách các chỉ tiêu trong mẫu */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                        3. Danh sách {templateItems.length} chỉ số đo lường trong mẫu:
                      </span>
                      <span className="badge" style={{
                        backgroundColor: Math.abs(totalTemplateWeight - 100) <= 0.5 ? '#DCFCE7' : '#FEE2E2',
                        color: Math.abs(totalTemplateWeight - 100) <= 0.5 ? '#166534' : '#991B1B',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px'
                      }}>
                        Tổng trọng số: {totalTemplateWeight}% / 100%
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                      {templateItems.map((item, idx) => (
                        <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#FFFFFF', display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                              #{idx + 1}. {item.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>
                                {item.category || 'OUTPUT'}
                              </span>
                              <span className="badge" style={{
                                backgroundColor: item.direction === 'LOWER_IS_BETTER' ? '#FEF2F2' : (item.direction === 'BOOLEAN' ? '#F0FDF4' : '#EFF6FF'),
                                color: item.direction === 'LOWER_IS_BETTER' ? '#991B1B' : (item.direction === 'BOOLEAN' ? '#166534' : '#1D4ED8'),
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}>
                                {item.direction === 'LOWER_IS_BETTER' ? 'Càng thấp càng tốt' : (item.direction === 'BOOLEAN' ? 'Nhị phân (Đạt/Không)' : 'Càng cao càng tốt')}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                              Trọng số (%):
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={item.weight} 
                                onChange={e => handleTemplateItemWeightChange(idx, e.target.value)}
                                style={{ height: '32px', fontSize: '0.85rem', fontWeight: 700, width: '70px', textAlign: 'center' }}
                              />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>%</span>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                              Mức chỉ tiêu (`Target`):
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={item.target} 
                                onChange={e => handleTemplateItemTargetChange(idx, e.target.value)}
                                style={{ height: '32px', fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}
                              />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: '24px' }}>{item.unit || '%'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* TAB 2: TỰ TẠO CHỈ TIÊU LẺ */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhân sự áp dụng *</label>
                    <select 
                      className="form-select"
                      value={manualForm.employeeId}
                      onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })}
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.code}) — {emp.department?.name || 'Tổ chức'} ({emp.position?.title || 'Chuyên viên'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mô tả chỉ tiêu cụ thể *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="VD: Nghiên cứu tích hợp Cổng thanh toán VNPay, Đạt doanh số tháng..."
                      value={manualForm.description}
                      onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhóm chỉ số (Category)</label>
                      <select 
                        className="form-select"
                        value={manualForm.category}
                        onChange={e => setManualForm({ ...manualForm, category: e.target.value })}
                      >
                        <option value="OUTPUT">OUTPUT (Kết quả đầu ra)</option>
                        <option value="QUALITY">QUALITY (Chất lượng / Độ chính xác)</option>
                        <option value="TIMELINE">TIMELINE (Tiến độ hoàn thành)</option>
                        <option value="BEHAVIOR">BEHAVIOR (Thái độ / Kỷ luật)</option>
                        <option value="COMPLIANCE">COMPLIANCE (Tuân thủ quy trình)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chiều đo lường (Direction)</label>
                      <select 
                        className="form-select"
                        value={manualForm.direction}
                        onChange={e => setManualForm({ ...manualForm, direction: e.target.value })}
                      >
                        <option value="HIGHER_IS_BETTER">Càng cao càng tốt (Doanh thu, % hoàn thành)</option>
                        <option value="LOWER_IS_BETTER">Càng thấp càng tốt (Tỷ lệ lỗi, ms, khiếu nại)</option>
                        <option value="BOOLEAN">Nhị phân Đạt / Không đạt (100% hoặc 0%)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mục tiêu (`Target`) *</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required
                        value={manualForm.target}
                        onChange={e => setManualForm({ ...manualForm, target: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Đơn vị đo *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="%, ms, VNĐ, bug..."
                        value={manualForm.unit}
                        onChange={e => setManualForm({ ...manualForm, unit: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trọng số (%) *</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required
                        value={manualForm.weight}
                        onChange={e => setManualForm({ ...manualForm, weight: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trần điểm thưởng (Cap %)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={manualForm.maxScoreCap}
                        onChange={e => setManualForm({ ...manualForm, maxScoreCap: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Link minh chứng / Báo cáo</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="VD: https://jira.company.com/browse/PROJ-123..."
                        value={manualForm.evidenceUrl}
                        onChange={e => setManualForm({ ...manualForm, evidenceUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Thời gian áp dụng cho chỉ tiêu lẻ */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} color="#2563EB" /> Thời gian áp dụng (Từ ngày — Đến ngày) *
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Ngày bắt đầu *</span>
                        <DateInput value={assignStartDate} onChange={val => setAssignStartDate(val)} required />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Ngày kết thúc (Hạn chót) *</span>
                        <DateInput value={assignEndDate} onChange={val => setAssignEndDate(val)} required />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAssignModalOpen(false)} 
                  className="btn btn-outline" 
                  style={{ fontSize: '0.85rem' }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={assignSubmitting || (assignMode === 'TEMPLATE' && selectedEmployeeIds.length === 0)}
                  className="btn btn-primary" 
                  style={{ fontSize: '0.85rem', padding: '8px 24px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {assignSubmitting ? (
                    'Đang xử lý...'
                  ) : assignMode === 'TEMPLATE' ? (
                    <>
                      <CheckCircle2 size={16} /> Xác nhận Giao KPI cho {selectedEmployeeIds.length} nhân sự
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Lưu Chỉ Tiêu KPI
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: CẬP NHẬT TIẾN ĐỘ THỰC TẾ (ACHIEVED) */}
      {updatingKpi && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '480px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Cập Nhật Tiến Độ Thực Tế (Achieved)
              </h3>
              <button onClick={() => setUpdatingKpi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateAchieved} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Chỉ tiêu đánh giá:</span>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', marginTop: '2px' }}>
                  {updatingKpi.description}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>Mức mục tiêu cam kết (`Target`):</span>
                <strong style={{ fontSize: '0.95rem', color: '#047857' }}>
                  {updatingKpi.target} {updatingKpi.unit || '%'}
                </strong>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  Số lượng thực tế đã đạt (`Achieved`) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    required
                    value={achievedVal}
                    onChange={e => setAchievedVal(e.target.value)}
                    style={{ fontSize: '1rem', fontWeight: 800, color: '#2563EB', height: '40px' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                    {updatingKpi.unit || '%'}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                  Link minh chứng / Báo cáo kết quả
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="VD: https://jira.company.com/browse/PROJ-123 hoặc link Google Drive..." 
                  value={evidenceUrlVal}
                  onChange={e => setEvidenceUrlVal(e.target.value)}
                  style={{ fontSize: '0.82rem', height: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setUpdatingKpi(null)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700 }}>
                  Lưu Tiến Độ
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: CHỈNH SỬA CHỈ TIÊU KPI (QUẢN LÝ / HR) */}
      {editingKpi && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '560px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit2 size={16} color="#059669" /> Chỉnh Sửa Chỉ Tiêu KPI
              </h3>
              <button onClick={() => setEditingKpi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveEditKpi} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Nhân sự áp dụng:</span>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', marginTop: '2px' }}>
                  {editingKpi.employee?.fullName} ({editingKpi.employee?.code})
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mô tả chỉ tiêu *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={editKpiForm.description}
                  onChange={e => setEditKpiForm({ ...editKpiForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mục tiêu (`Target`)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    value={editKpiForm.target}
                    onChange={e => setEditKpiForm({ ...editKpiForm, target: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Thực tế (`Achieved`)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    value={editKpiForm.achieved}
                    onChange={e => setEditKpiForm({ ...editKpiForm, achieved: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Đơn vị đo</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editKpiForm.unit}
                    onChange={e => setEditKpiForm({ ...editKpiForm, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trọng số (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    value={editKpiForm.weight}
                    onChange={e => setEditKpiForm({ ...editKpiForm, weight: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                  Link minh chứng / Báo cáo kết quả
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="VD: https://jira.company.com/browse/PROJ-123 hoặc link Google Drive..." 
                  value={editKpiForm.evidenceUrl || ''}
                  onChange={e => setEditKpiForm({ ...editKpiForm, evidenceUrl: e.target.value })}
                  style={{ fontSize: '0.82rem', height: '36px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                  Thời hạn áp dụng (Thời gian)
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="VD: 01/10/2026 - 31/12/2026" 
                  value={editKpiForm.period || ''}
                  onChange={e => setEditKpiForm({ ...editKpiForm, period: e.target.value })}
                  style={{ fontSize: '0.82rem', height: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setEditingKpi(null)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700, backgroundColor: '#059669', borderColor: '#059669' }}>
                  Cập nhật Chỉ Tiêu
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
