import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Search, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, 
  TrendingUp, Award, Layers, Sparkles, Filter, X, ArrowRight, UserCheck, Calendar, BookOpen
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

export const KPIAssignments = () => {
  const [kpis, setKpis] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterPeriod, setFilterPeriod] = useState('ALL');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal 1: Giao KPI từ Mẫu chuẩn (Khuyến nghị)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [assignPeriod, setAssignPeriod] = useState('Q3-2026');
  const [templateItems, setTemplateItems] = useState([]);

  // Modal 2: Giao KPI đơn lẻ thủ công
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    description: '',
    target: 100,
    unit: '%',
    weight: 25,
    category: 'OUTPUT',
    period: 'Q3-2026'
  });

  // Modal 3: Cập nhật tiến độ thực tế (Achieved)
  const [updatingKpi, setUpdatingKpi] = useState(null);
  const [achievedVal, setAchievedVal] = useState(0);

  // Modal 4: Chỉnh sửa chỉ tiêu KPI (Quản lý)
  const [editingKpi, setEditingKpi] = useState(null);
  const [editKpiForm, setEditKpiForm] = useState({
    description: '',
    target: 100,
    achieved: 0,
    unit: '%',
    weight: 25,
    category: 'OUTPUT',
    period: 'Q3-2026'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, empRes, tplRes] = await Promise.all([
        axios.get('http://localhost:5000/api/kpi/kpi'),
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/kpi/templates')
      ]);
      setKpis(kpiRes.data || []);
      setEmployees(empRes.data || []);
      setTemplates(tplRes.data || []);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Khi chọn nhân viên trong Modal Giao từ Mẫu -> Tự động tìm Mẫu KPI phù hợp của phòng ban đó
  const handleSelectEmployeeForTemplate = (empId) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    // Tìm template có department trùng khớp
    const empDeptName = emp.department?.name || '';
    const matchedTpl = templates.find(t => 
      t.department && empDeptName && (
        t.department.toLowerCase().includes(empDeptName.toLowerCase()) ||
        empDeptName.toLowerCase().includes(t.department.toLowerCase())
      )
    ) || templates[0];

    if (matchedTpl) {
      setSelectedTemplateId(matchedTpl.id);
      loadTemplateItems(matchedTpl);
    }
  };

  const handleSelectTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      loadTemplateItems(tpl);
    }
  };

  const loadTemplateItems = (tpl) => {
    if (!tpl || !tpl.items) {
      setTemplateItems([]);
      return;
    }
    try {
      const parsed = JSON.parse(tpl.items);
      if (Array.isArray(parsed)) {
        setTemplateItems(parsed.map(item => ({ ...item })));
      }
    } catch (e) {
      setTemplateItems([]);
    }
  };

  const handleTemplateItemTargetChange = (idx, newTarget) => {
    const updated = [...templateItems];
    updated[idx].target = Number(newTarget);
    setTemplateItems(updated);
  };

  // Xác nhận Giao KPI từ Mẫu
  const handleConfirmAssignTemplate = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error('Vui lòng chọn nhân viên cần giao KPI');
    if (!templateItems || templateItems.length === 0) return toast.error('Mẫu KPI chưa có danh sách tiêu chuẩn');

    try {
      await axios.post('http://localhost:5000/api/kpi/assign-template', {
        employeeId: selectedEmpId,
        templateId: selectedTemplateId,
        period: assignPeriod,
        customItems: templateItems
      });
      toast.success(`Đã giao thành công ${templateItems.length} chỉ tiêu KPI chuẩn hóa cho nhân sự!`);
      setIsTemplateModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi giao mẫu KPI');
    }
  };

  // Giao KPI đơn lẻ thủ công
  const handleCreateManualKpi = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.description.trim()) {
      return toast.error('Vui lòng điền đầy đủ thông tin nhân viên và mô tả chỉ tiêu');
    }
    try {
      await axios.post('http://localhost:5000/api/kpi/kpi', {
        ...manualForm,
        target: Number(manualForm.target),
        weight: Number(manualForm.weight)
      });
      toast.success('Giao chỉ tiêu KPI thành công!');
      setIsManualModalOpen(false);
      setManualForm({
        employeeId: '',
        description: '',
        target: 100,
        unit: '%',
        weight: 25,
        category: 'OUTPUT',
        period: 'Q3-2026'
      });
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi giao KPI');
    }
  };

  // Cập nhật tiến độ thực tế (Achieved)
  const handleUpdateAchieved = async (e) => {
    e.preventDefault();
    if (!updatingKpi) return;
    try {
      await axios.put(`http://localhost:5000/api/kpi/kpi/${updatingKpi.id}`, {
        achieved: Number(achievedVal)
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
      await axios.put(`http://localhost:5000/api/kpi/kpi/${editingKpi.id}`, {
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
      await axios.delete(`http://localhost:5000/api/kpi/kpi/${id}`);
      toast.success('Đã xóa KPI');
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi xóa KPI');
    }
  };

  // Tính tỷ lệ % hoàn thành
  const computeProgress = (target, achieved, unit) => {
    const t = Number(target || 0);
    const a = Number(achieved || 0);
    if (t <= 0) return 0;
    if (unit === 'ms' || unit === 'ngày') {
      return a <= t ? 100 : Math.max(0, Math.round((t / a) * 100));
    }
    return Math.min(100, Math.round((a / t) * 100));
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = kpis.length;
    let excellent = 0;
    let onTrack = 0;
    let needsAttention = 0;

    kpis.forEach(k => {
      const p = computeProgress(k.target, k.achieved, k.unit);
      if (p >= 90) excellent++;
      else if (p >= 70) onTrack++;
      else needsAttention++;
    });

    return { total, excellent, onTrack, needsAttention };
  }, [kpis]);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department?.name).filter(Boolean)));
  }, [employees]);

  const filteredKpis = useMemo(() => {
    return kpis.filter(k => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        k.description.toLowerCase().includes(q) ||
        (k.employee?.fullName && k.employee.fullName.toLowerCase().includes(q)) ||
        (k.employee?.code && k.employee.code.toLowerCase().includes(q));

      const matchDept = filterDept === 'ALL' || k.employee?.department?.name === filterDept;
      const matchPeriod = filterPeriod === 'ALL' || k.period === filterPeriod;

      return matchSearch && matchDept && matchPeriod;
    });
  }, [kpis, searchTerm, filterDept, filterPeriod]);

  // Phân trang
  const totalPages = Math.ceil(filteredKpis.length / itemsPerPage) || 1;
  const paginatedKpis = useMemo(() => {
    return filteredKpis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredKpis, currentPage, itemsPerPage]);

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={22} color="#2563EB" />
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Quản lý Giao Chỉ Tiêu KPI (KPI Assignments)
            </h1>
          </div>
          <p className="text-muted text-xs mt-1" style={{ margin: 0, color: '#64748B' }}>
            Giao mục tiêu định lượng từ Bộ Mẫu Chuẩn Hóa, theo dõi tiến độ thực tế và kết quả hoàn thành của từng nhân sự.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsManualModalOpen(true)}
            style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            + Giao chỉ tiêu lẻ
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (employees.length > 0) {
                handleSelectEmployeeForTemplate(employees[0].id);
              }
              setIsTemplateModalOpen(true);
            }}
            style={{ padding: '8px 18px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={16} /> Giao từ Mẫu Chuẩn (Khuyến nghị)
          </button>
        </div>
      </div>

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

            <select
              className="form-select"
              value={filterPeriod}
              onChange={e => { setFilterPeriod(e.target.value); setCurrentPage(1); }}
              style={{ width: '140px', height: '36px', fontSize: '0.825rem' }}
            >
              <option value="ALL">-- Tất cả kỳ --</option>
              <option value="Q3-2026">Quý 3 / 2026</option>
              <option value="Q4-2026">Quý 4 / 2026</option>
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
                const progress = computeProgress(k.target, k.achieved, k.unit);
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
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                          {k.category || 'OUTPUT'}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
                          {k.period || 'Q3-2026'}
                        </span>
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
        {filteredKpis.length > 0 && (
          <div style={{
            padding: '0.75rem 0.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredKpis.length)} trong tổng số {filteredKpis.length} chỉ tiêu
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button 
                className="btn btn-outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    height: '32px', minWidth: '32px', padding: 0,
                    fontSize: '0.8rem', fontWeight: currentPage === page ? 700 : 500
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button 
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: GIAO KPI TỪ MẪU CHUẨN (KHÔNG CẦN TỰ NGHĨ TỪ ĐẦU) */}
      {isTemplateModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '760px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#2563EB" /> Giao KPI Chuẩn Hóa Theo Mẫu Phòng Ban
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  Hệ thống tự động nạp các chỉ tiêu nghiệp vụ chuẩn ngành, Quản lý chỉ cần kiểm tra con số và xác nhận.
                </p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleConfirmAssignTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>1. Chọn nhân viên áp dụng *</label>
                  <select 
                    className="form-select" 
                    value={selectedEmpId} 
                    onChange={e => handleSelectEmployeeForTemplate(e.target.value)}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.code}) - {emp.department?.name || 'Tổ chức'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>2. Mẫu KPI chuẩn được đề xuất *</label>
                  <select 
                    className="form-select" 
                    value={selectedTemplateId} 
                    onChange={e => handleSelectTemplate(e.target.value)}
                  >
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>3. Kỳ đánh giá *</label>
                  <select 
                    className="form-select" 
                    value={assignPeriod} 
                    onChange={e => setAssignPeriod(e.target.value)}
                  >
                    <option value="Q3-2026">Quý 3 / 2026</option>
                    <option value="Q4-2026">Quý 4 / 2026</option>
                    <option value="YEAR-2026">Cả năm 2026</option>
                  </select>
                </div>
              </div>

              {/* Danh sách tiêu chí tự động nạp */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Danh sách {templateItems.length} chỉ số sẽ được tự động giao:</span>
                  <span style={{ fontSize: '0.78rem', color: '#047857' }}>✓ Tổng trọng số: 100%</span>
                </div>

                {templateItems.map((item, idx) => (
                  <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
                        #{idx + 1}. {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {item.description || item.category}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '0.75rem' }}>
                        Trọng số: {item.weight}%
                      </span>
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
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{item.unit || '%'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 22px', fontWeight: 700 }}>
                  Xác nhận Giao bộ KPI
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: GIAO KPI THỦ CÔNG ĐƠN LẺ */}
      {isManualModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '560px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Giao Thêm Chỉ Tiêu KPI Đơn Lẻ
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateManualKpi} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhân viên áp dụng *</label>
                <select 
                  className="form-select" 
                  required
                  value={manualForm.employeeId} 
                  onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })}
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.department?.name || 'Tổ chức'}
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
                  placeholder="VD: Nghiên cứu tích hợp Cổng thanh toán VNPay..."
                  value={manualForm.description}
                  onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                />
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
                    placeholder="%, ms, VNĐ..."
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700 }}>
                  Lưu Chỉ Tiêu
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Kỳ áp dụng</label>
                  <select 
                    className="form-select"
                    value={editKpiForm.period}
                    onChange={e => setEditKpiForm({ ...editKpiForm, period: e.target.value })}
                  >
                    <option value="Q3-2026">Quý 3 - 2026</option>
                    <option value="Q4-2026">Quý 4 - 2026</option>
                    <option value="YEAR-2026">Năm 2026</option>
                  </select>
                </div>
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
