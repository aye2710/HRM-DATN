import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, Save, RefreshCw, CheckCircle, AlertCircle, 
  DollarSign, Clock, ShieldCheck, UserCheck, Target, 
  Search, Info, Zap, RotateCcw, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const SystemParameters = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('http://localhost:5000/api/settings', { headers });
      if (!res.ok) throw new Error('Không thể tải cấu hình tham số');
      const data = await res.json();
      setSettings(data);

      const initial = {};
      data.forEach(item => {
        initial[item.key] = item.value;
      });
      setFormValues(initial);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải tham số hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setFormValues(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const updates = Object.entries(formValues).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      const res = await fetch('http://localhost:5000/api/settings/bulk', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ updates })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi lưu tham số');
      }

      toast.success('Đã lưu và đồng bộ toàn bộ 28 tham số nghiệp vụ vào Database!');
      fetchSettings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const result = await Swal.fire({
      title: 'Khôi phục Mặc định Pháp luật?',
      text: 'Toàn bộ tham số về Thuế, BHXH, Giờ làm việc, Hệ số OT và Phép năm sẽ được đưa về giá trị chuẩn quy định của Nhà nước.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Đồng ý khôi phục',
      cancelButtonText: 'Hủy bỏ'
    });

    if (!result.isConfirmed) return;

    try {
      setResetting(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch('http://localhost:5000/api/settings/reset', {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi khôi phục tham số');
      }

      const data = await res.json();
      setSettings(data.settings || []);
      const initial = {};
      (data.settings || []).forEach(item => {
        initial[item.key] = item.value;
      });
      setFormValues(initial);

      toast.success('Đã khôi phục thành công toàn bộ tham số về giá trị chuẩn pháp luật!');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi khôi phục');
    } finally {
      setResetting(false);
    }
  };

  // Group definitions
  const CATEGORIES = [
    { key: 'ALL', label: 'Tất cả tham số', icon: Settings },
    { key: 'PAYROLL', label: 'Tiền lương & Thuế TNCN', icon: DollarSign },
    { key: 'ATTENDANCE', label: 'Chấm công & Tăng ca', icon: Clock },
    { key: 'HR', label: 'Hợp đồng & Nhân sự', icon: ShieldCheck },
    { key: 'RECRUITMENT', label: 'Tuyển dụng & Hội nhập', icon: UserCheck },
    { key: 'PERFORMANCE', label: 'Hiệu suất & KPI', icon: Target },
  ];

  // Filtered settings based on Category and Search Term
  const filteredSettings = useMemo(() => {
    return settings.filter(item => {
      const matchCat = activeCategory === 'ALL' || item.category === activeCategory;
      const matchSearch = searchTerm.trim() === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [settings, activeCategory, searchTerm]);

  // Group filtered by Category
  const groupedSettings = useMemo(() => {
    const groups = {};
    filteredSettings.forEach(item => {
      const cat = item.category || 'GENERAL';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredSettings]);

  const getCategoryTitle = (cat) => {
    switch (cat) {
      case 'PAYROLL': return '1. Tiền lương, Thuế TNCN & Bảo hiểm Bắt buộc';
      case 'ATTENDANCE': return '2. Ca làm việc, Chấm công & Hệ số Tăng ca (OT)';
      case 'HR': return '3. Hợp đồng Lao động, Thử việc & Nghỉ phép';
      case 'RECRUITMENT': return '4. Tuyển dụng, Thư mời nhận việc & Hội nhập';
      case 'PERFORMANCE': return '5. Đánh giá Hiệu suất & Thang điểm Xếp loại KPI';
      default: return 'Cấu hình chung';
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'PAYROLL': return '#2563eb';
      case 'ATTENDANCE': return '#10b981';
      case 'HR': return '#8b5cf6';
      case 'RECRUITMENT': return '#f59e0b';
      case 'PERFORMANCE': return '#ec4899';
      default: return '#64748b';
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* 1. Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Cấu Hình Tham Số Nghiệp Vụ Động
          </h1>
          <p className="text-muted text-sm" style={{ margin: '0.25rem 0 0 0' }}>
            Quản trị tập trung 28 chỉ số định lượng về Thuế TNCN, BHXH, Chấm công, Hệ số OT, Hợp đồng và Đánh giá KPI
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleResetDefaults}
            disabled={saving || resetting}
            title="Đưa các giá trị về quy định chuẩn của Nhà nước"
          >
            <RotateCcw size={16} className={resetting ? 'animate-spin' : ''} />
            Mặc định pháp luật
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.5rem' }}
            onClick={handleSave}
            disabled={saving || resetting}
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : 'Lưu toàn bộ cấu hình'}
          </button>
        </div>
      </div>

      {/* 2. Real-time Enterprise Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.06))',
        border: '1px solid rgba(37, 99, 235, 0.2)',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
              Động cơ Nghiệp vụ Tự động nạp từ Database (Dynamic Business Engine)
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.785rem', color: '#64748b' }}>
              100% các giá trị định lượng dưới đây được lưu trong bảng <code>SystemSetting</code> và truyền tự động vào các Engine Chấm công, Tính lương và Cảnh báo HĐLĐ mà không cần can thiệp mã nguồn.
            </p>
          </div>
        </div>
        <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
          <CheckCircle size={13} style={{ marginRight: '4px', display: 'inline' }} /> 28 Tham số Đang hoạt động
        </span>
      </div>

      {/* 3. Toolbar: Category Tabs & Search Bar */}
      <div className="card" style={{ padding: '0.875rem 1rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.625rem' }}>
          {CATEGORIES.map(cat => {
            const count = cat.key === 'ALL' 
              ? settings.length 
              : settings.filter(s => s.category === cat.key).length;
            const IconComp = cat.icon;
            const isActive = activeCategory === cat.key;
            
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={15} color={isActive ? '#2563eb' : '#94a3b8'} />
                <span>{cat.label}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#2563eb' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: 600
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên tham số, mã key hoặc mô tả..."
            className="form-input"
            style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.825rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Form Content */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <RefreshCw size={28} className="animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {Object.keys(groupedSettings).length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Filter size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy tham số nào khớp với từ khóa tìm kiếm</p>
            </div>
          ) : (
            Object.entries(groupedSettings).map(([catKey, items]) => {
              const catColor = getCategoryColor(catKey);
              return (
                <div key={catKey} className="card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Category Title Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <div style={{ width: '4px', height: '18px', backgroundColor: catColor, borderRadius: '2px' }} />
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                      {getCategoryTitle(catKey)}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                      ({items.length} chỉ số)
                    </span>
                  </div>

                  {/* Parameters Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                    {items.map(item => {
                      const val = formValues[item.key] !== undefined ? formValues[item.key] : item.value;
                      const isBool = item.dataType === 'BOOLEAN';

                      return (
                        <div 
                          key={item.key} 
                          style={{ 
                            background: '#f8fafc', 
                            padding: '1rem', 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          {/* Label & Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.35 }}>
                              {item.name}
                            </label>
                            {item.unit && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                background: '#e0e7ff', 
                                color: '#3730a3', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                {item.unit}
                              </span>
                            )}
                          </div>

                          {/* Key code */}
                          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {item.key}
                          </div>

                          {/* Input field */}
                          <div style={{ marginTop: '0.25rem' }}>
                            {isBool ? (
                              <select
                                className="form-input"
                                style={{ height: '36px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: '#ffffff' }}
                                value={String(val)}
                                onChange={(e) => handleChange(item.key, e.target.value)}
                              >
                                <option value="true">BẬT — Kích hoạt tự động</option>
                                <option value="false">TẮT — Không áp dụng</option>
                              </select>
                            ) : (
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                  type={item.dataType === 'NUMBER' || item.dataType === 'PERCENT' ? 'number' : 'text'}
                                  step={item.dataType === 'PERCENT' ? '0.1' : (item.key.includes('HOURS') ? '0.5' : '1')}
                                  className="form-input font-mono"
                                  style={{ 
                                    height: '36px', 
                                    fontSize: '0.9rem', 
                                    fontWeight: 700, 
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a' 
                                  }}
                                  value={val}
                                  onChange={(e) => handleChange(item.key, e.target.value)}
                                />
                                {item.dataType === 'PERCENT' && (
                                  <span style={{ position: 'absolute', right: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
                                    %
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {item.description && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.35 }}>
                              <Info size={12} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <span>{item.description}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Sticky Bottom Bar */}
          <div style={{
            position: 'sticky',
            bottom: '1rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Nhấn <strong>Lưu cấu hình</strong> để áp dụng các thay đổi mới vào toàn bộ hệ thống
            </span>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleResetDefaults}
                disabled={saving || resetting}
              >
                <RotateCcw size={15} /> Mặc định pháp luật
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1.75rem' }}
                disabled={saving || resetting}
              >
                <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu toàn bộ cấu hình'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemParameters;