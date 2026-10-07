import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, CheckCircle, AlertCircle, 
  DollarSign, Clock, ShieldCheck, HelpCircle, ArrowRight, Zap, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SystemParameters = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({});

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/settings');
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
    e.preventDefault();
    try {
      setSaving(true);
      const updates = Object.entries(formValues).map(([key, value]) => ({
        key,
        value
      }));

      const res = await fetch('http://localhost:5000/api/settings/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi lưu');
      }

      toast.success('Đã lưu và đồng bộ toàn bộ tham số nghiệp vụ vào Database!');
      fetchSettings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Khôi phục toàn bộ tham số về giá trị chuẩn mặc định của pháp luật?')) return;
    setFormValues({
      INSURANCE_RATE: '10.5',
      PERSONAL_DEDUCTION: '11000000',
      DEPENDENT_DEDUCTION: '4400000',
      MAX_INSURANCE_SALARY: '46800000',
      STANDARD_WORKING_DAYS: '22',
      PAYROLL_CUTOFF_DAY: '25',
      OT_RATE_NORMAL: '150',
      OT_RATE_WEEKEND: '200',
      OT_RATE_HOLIDAY: '300',
      LEAVE_APPROVAL_THRESHOLD: '2',
      CONTRACT_EXPIRY_WARN_DAYS: '30',
      PROBATION_PERIOD_DAYS: '60'
    });
    toast.success('Đã khôi phục các giá trị mặc định. Hãy nhấn "Lưu cấu hình" để áp dụng.');
  };

  // Group settings by category
  const payrollSettings = settings.filter(s => s.category === 'PAYROLL');
  const attendanceSettings = settings.filter(s => s.category === 'ATTENDANCE');
  const hrSettings = settings.filter(s => s.category === 'HR');

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Cấu Hình Tham Số Nghiệp Vụ Động
          </h1>
          <p className="text-muted text-sm">
            Quản trị tập trung các chỉ số định lượng về Thuế TNCN, Bảo hiểm Xã hội, Công chuẩn và Ngưỡng phân luồng duyệt nghỉ phép
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ gap: 6 }}
            onClick={handleResetDefaults}
            disabled={saving}
          >
            <RefreshCw size={16} /> Giá trị mặc định
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ gap: 6 }}
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu toàn bộ cấu hình'}
          </button>
        </div>
      </div>

      {/* Real-time Enterprise Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div className="flex items-center gap-3">
          <div style={{ padding: 10, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
            <Zap size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 2 }}>
              Động cơ Nghiệp vụ Tự động nạp từ Cơ sở Dữ liệu (Dynamic Business Engine)
            </h4>
            <p className="text-xs text-muted" style={{ margin: 0 }}>
              100% các giá trị định lượng dưới đây được lưu trong bảng <code>SystemSetting</code> và tự động truyền vào công thức tính bảng lương (Payroll Engine), không bị gắn cứng (hard-code) trong mã nguồn hệ thống.
            </p>
          </div>
        </div>
        <span className="badge badge-success" style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.8rem' }}>
          <CheckCircle size={14} className="inline mr-1" /> Đang hoạt động
        </span>
      </div>

      {loading ? (
        <div className="card glass flex items-center justify-center" style={{ minHeight: 250 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex-col gap-6">
          {/* Nhóm 1: Lương, Thuế TNCN & Bảo hiểm */}
          <div className="card glass flex-col gap-5">
            <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
                  1. Thuế Thu Nhập Cá Nhân, Bảo Hiểm & Ngày Công Chuẩn
                </h3>
                <p className="text-xs text-muted">Căn cứ tính toán tự động phiếu lương hàng tháng</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {payrollSettings.map(item => (
                <div key={item.key} className="flex-col gap-1.5" style={{ background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-main" style={{ color: 'var(--text-main)' }}>
                      {item.name}
                    </label>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{item.unit || item.dataType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={item.dataType === 'PERCENT' ? '0.1' : '1'}
                      className="form-input font-mono"
                      style={{ fontWeight: 600, fontSize: '1rem' }}
                      value={formValues[item.key] !== undefined ? formValues[item.key] : item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  </div>
                  {item.description && (
                    <span className="text-muted text-xs flex items-center gap-1 mt-1">
                      <Info size={12} className="inline flex-shrink-0" />
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nhóm 2: Hệ số Làm thêm giờ (OT) */}
          <div className="card glass flex-col gap-5">
            <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
                  2. Hệ Số Tính Lương Làm Thêm Giờ (Overtime - OT)
                </h3>
                <p className="text-xs text-muted">Tỷ lệ nhân đơn giá giờ làm việc theo quy định Bộ luật Lao động</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {attendanceSettings.map(item => (
                <div key={item.key} className="flex-col gap-1.5" style={{ background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-main" style={{ color: 'var(--text-main)' }}>
                      {item.name}
                    </label>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{item.unit || '%'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="5"
                      className="form-input font-mono"
                      style={{ fontWeight: 600, fontSize: '1rem' }}
                      value={formValues[item.key] !== undefined ? formValues[item.key] : item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  </div>
                  {item.description && (
                    <span className="text-muted text-xs flex items-center gap-1 mt-1">
                      <Info size={12} className="inline flex-shrink-0" />
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nhóm 3: Quy trình Nhân sự & Cảnh báo */}
          <div className="card glass flex-col gap-5">
            <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
                  3. Quy Trình Nhân Sự, Ngưỡng Phê Duyệt & Cảnh Báo Hết Hạn Hợp Đồng
                </h3>
                <p className="text-xs text-muted">Điều phối luồng công việc tự động giữa các cấp quản trị</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {hrSettings.map(item => (
                <div key={item.key} className="flex-col gap-1.5" style={{ background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-main" style={{ color: 'var(--text-main)' }}>
                      {item.name}
                    </label>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{item.unit || 'Ngày'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="form-input font-mono"
                      style={{ fontWeight: 600, fontSize: '1rem' }}
                      value={formValues[item.key] !== undefined ? formValues[item.key] : item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  </div>
                  {item.description && (
                    <span className="text-muted text-xs flex items-center gap-1 mt-1">
                      <Info size={12} className="inline flex-shrink-0" />
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleResetDefaults}
              disabled={saving}
            >
              <RefreshCw size={16} /> Mặc định pháp luật
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ gap: 6, padding: '0.75rem 2rem' }}
              disabled={saving}
            >
              <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu và Áp dụng tham số'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemParameters;
