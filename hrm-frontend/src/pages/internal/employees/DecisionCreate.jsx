import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle2, FileSignature, DollarSign, TrendingUp, 
  ArrowRight, Award, ShieldAlert, UploadCloud, Trash2, Calendar, User, 
  Building2, Briefcase, FileText, Check, AlertCircle, Info, RotateCcw, XCircle, UserCheck
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AUTHORITIES = [
  'Ban Giám Đốc',
  'Tổng Giám Đốc',
  'Phó Tổng Giám Đốc',
  'Giám Đốc Khối Nhân Sự'
];

const DISCIPLINE_FORMS = [
  'Khiển trách',
  'Kéo dài thời hạn nâng lương (không quá 06 tháng)',
  'Cách chức',
  'Sa thải (Chấm dứt hợp đồng lao động)'
];

const DECISION_CONFIG = {
  PROMOTION: {
    name: 'Bổ nhiệm',
    pageTitle: 'Soạn Thảo Quyết Định Bổ Nhiệm',
    subDesc: 'Ban hành quyết định bổ nhiệm nhân sự vào chức vụ, vị trí quản lý hoặc chuyên môn cao hơn',
    badgeColor: '#0284c7',
    badgeBg: 'rgba(2, 132, 199, 0.1)',
    badgeBorder: 'rgba(2, 132, 199, 0.25)',
    defaultTitle: 'Quyết định bổ nhiệm chức vụ mới',
    defaultReason: 'Căn cứ vào kết quả đánh giá năng lực công tác, phẩm chất đạo đức và nhu cầu kiện toàn bộ máy nhân sự.',
    backUrl: '/internal/decisions/promotion',
    icon: <TrendingUp size={16} />
  },
  DEMOTION: {
    name: 'Miễn nhiệm',
    pageTitle: 'Soạn Thảo Quyết Định Miễn Nhiệm',
    subDesc: 'Ban hành quyết định thôi giữ chức vụ quản lý hoặc điều chuyển về vị trí công tác phù hợp',
    badgeColor: '#ea580c',
    badgeBg: 'rgba(234, 88, 12, 0.1)',
    badgeBorder: 'rgba(234, 88, 12, 0.25)',
    defaultTitle: 'Quyết định miễn nhiệm chức vụ',
    defaultReason: 'Căn cứ theo nguyện vọng cá nhân hoặc yêu cầu sắp xếp lại cơ cấu tổ chức bộ máy.',
    backUrl: '/internal/decisions/demotion',
    icon: <RotateCcw size={16} />
  },
  TRANSFER: {
    name: 'Điều chuyển',
    pageTitle: 'Soạn Thảo Quyết Định Điều Chuyển',
    subDesc: 'Điều chuyển nhân sự giữa các phòng ban, khối chuyên môn hoặc thay đổi vị trí công tác',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.1)',
    badgeBorder: 'rgba(16, 185, 129, 0.25)',
    defaultTitle: 'Quyết định điều chuyển công tác / vị trí',
    defaultReason: 'Căn cứ vào nhu cầu điều chuyển nhân sự giữa các bộ phận trong doanh nghiệp và năng lực chuyên môn.',
    backUrl: '/internal/decisions/transfer',
    icon: <ArrowRight size={16} />
  },
  TERMINATION: {
    name: 'Nghỉ việc',
    pageTitle: 'Soạn Thảo Quyết Định Nghỉ Việc',
    subDesc: 'Chấm dứt hợp đồng lao động, hoàn tất thủ tục bàn giao tài sản và giải quyết thôi việc',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.1)',
    badgeBorder: 'rgba(239, 68, 68, 0.25)',
    defaultTitle: 'Quyết định chấm dứt hợp đồng lao động và thôi việc',
    defaultReason: 'Căn cứ vào Đơn xin chấm dứt hợp đồng lao động của người lao động và sự chấp thuận của Ban Giám Đốc.',
    backUrl: '/internal/decisions/termination',
    icon: <XCircle size={16} />
  },
  RECRUITMENT: {
    name: 'Tuyển dụng',
    pageTitle: 'Soạn Thảo Quyết Định Tiếp Nhận Tuyển Dụng',
    subDesc: 'Quyết định tiếp nhận nhân sự sau thời gian thử việc lên nhân viên chính thức',
    badgeColor: '#2563eb',
    badgeBg: 'rgba(59, 130, 246, 0.1)',
    badgeBorder: 'rgba(59, 130, 246, 0.25)',
    defaultTitle: 'Quyết định tiếp nhận nhân sự chính thức',
    defaultReason: 'Căn cứ vào kết quả đánh giá hoàn thành xuất sắc thời gian thử việc của nhân sự.',
    backUrl: '/internal/decisions/recruitment',
    icon: <CheckCircle2 size={16} />
  },
  SALARY_ADJUSTMENT: {
    name: 'Tăng / Giảm lương',
    pageTitle: 'Soạn Thảo Quyết Định Điều Chỉnh Mức Lương',
    subDesc: 'Xét duyệt tăng lương định kỳ hoặc điều chỉnh mức thu nhập theo kết quả đánh giá KPI',
    badgeColor: '#7c3aed',
    badgeBg: 'rgba(124, 58, 237, 0.1)',
    badgeBorder: 'rgba(124, 58, 237, 0.25)',
    defaultTitle: 'Quyết định điều chỉnh mức lương định kỳ',
    defaultReason: 'Căn cứ vào kết quả đánh giá năng lực và hiệu suất hoàn thành tốt nhiệm vụ.',
    backUrl: '/internal/decisions/salary',
    icon: <DollarSign size={16} />
  },
  REWARD: {
    name: 'Khen thưởng',
    pageTitle: 'Soạn Thảo Quyết Định Khen Thưởng',
    subDesc: 'Khen thưởng cá nhân hoặc tập thể có thành tích đột xuất, xuất sắc trong công việc',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.1)',
    badgeBorder: 'rgba(245, 158, 11, 0.25)',
    defaultTitle: 'Quyết định khen thưởng thành tích xuất sắc',
    defaultReason: 'Căn cứ vào thành tích đóng góp nổi bật và cống hiến xuất sắc trong phong trào thi đua và dự án.',
    backUrl: '/internal/decisions/reward',
    icon: <Award size={16} />
  },
  DISCIPLINE: {
    name: 'Kỷ luật nhân sự',
    pageTitle: 'Soạn Thảo Quyết Định Kỷ Luật Lao Động',
    subDesc: 'Thi hành biện pháp chế tài đối với các hành vi vi phạm nội quy, quy chế công ty',
    badgeColor: '#dc2626',
    badgeBg: 'rgba(220, 38, 38, 0.1)',
    badgeBorder: 'rgba(220, 38, 38, 0.25)',
    defaultTitle: 'Quyết định thi hành kỷ luật nhân sự',
    defaultReason: 'Căn cứ vào biên bản họp xét kỷ luật của Hội đồng Kỷ luật Công ty về hành vi vi phạm nội quy lao động.',
    backUrl: '/internal/decisions/discipline',
    icon: <ShieldAlert size={16} />
  }
};

export const DecisionCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramType = searchParams.get('type');
  const paramEmpId = searchParams.get('employeeId');

  const currentConfig = paramType && DECISION_CONFIG[paramType] ? DECISION_CONFIG[paramType] : null;

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const initialType = currentConfig ? paramType : (paramType || 'SALARY_ADJUSTMENT');
  const initialTitle = currentConfig ? currentConfig.defaultTitle : 'Quyết định điều chỉnh mức lương định kỳ';
  const initialReason = currentConfig ? currentConfig.defaultReason : 'Căn cứ vào kết quả đánh giá năng lực và hiệu suất hoàn thành tốt nhiệm vụ.';

  const [formData, setFormData] = useState({
    decisionNumber: '',
    title: initialTitle,
    type: initialType,
    employeeId: paramEmpId || '',
    oldSalary: 0,
    newSalary: '',
    oldDepartmentId: '',
    newDepartmentId: '',
    oldPositionId: '',
    newPositionId: '',
    reason: initialReason,
    effectiveDate: new Date().toISOString().split('T')[0],
    signBy: 'Ban Giám Đốc',
    fileUrl: '',
    rewardAmount: '',
    disciplineForm: 'Khiển trách',
    disciplineDuration: '03 tháng',
    status: 'PENDING'
  });

  const selectedEmp = employees.find(e => e.id === formData.employeeId);
  const newDeptObj = departments.find(d => d.id === formData.newDepartmentId);
  const newPosObj = positions.find(p => p.id === formData.newPositionId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, deptRes, posRes, decRes] = await Promise.all([
          axios.get('http://localhost:5000/api/employees'),
          axios.get('http://localhost:5000/api/departments'),
          axios.get('http://localhost:5000/api/positions'),
          axios.get('http://localhost:5000/api/decisions')
        ]);
        const activeEmps = empRes.data.filter(e => e.status !== 'RESIGNED');
        setEmployees(activeEmps);
        setDepartments(deptRes.data);
        setPositions(posRes.data);

        // Auto generate decision number
        const year = new Date().getFullYear();
        const nextNum = (decRes.data?.length || 0) + 1;

        let initOldSalary = 0;
        let initOldDept = '';
        let initOldPos = '';

        if (paramEmpId) {
          const matchedEmp = activeEmps.find(e => e.id === paramEmpId);
          if (matchedEmp) {
            const activeContract = matchedEmp.contracts?.find(c => c.status === 'ACTIVE') || matchedEmp.contracts?.[0];
            initOldSalary = activeContract?.baseSalary ? Number(activeContract.baseSalary) : (matchedEmp.salary || 0);
            initOldDept = matchedEmp.departmentId || '';
            initOldPos = matchedEmp.positionId || '';
          }
        }

        setFormData(prev => ({
          ...prev,
          decisionNumber: `QĐ-${year}/${String(nextNum).padStart(3, '0')}/LLA`,
          employeeId: paramEmpId || prev.employeeId,
          oldSalary: initOldSalary || prev.oldSalary,
          oldDepartmentId: initOldDept || prev.oldDepartmentId,
          oldPositionId: initOldPos || prev.oldPositionId
        }));
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi tải dữ liệu khởi tạo');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [paramEmpId, paramType]);

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(item => item.id === empId);
    if (emp) {
      const activeContract = emp.contracts?.find(c => c.status === 'ACTIVE') || emp.contracts?.[0];
      const currentSalary = activeContract?.baseSalary ? Number(activeContract.baseSalary) : (emp.salary || 0);
      setFormData(prev => ({
        ...prev,
        employeeId: empId,
        oldSalary: currentSalary,
        oldDepartmentId: emp.departmentId || '',
        oldPositionId: emp.positionId || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, employeeId: empId, oldSalary: 0, oldDepartmentId: '', oldPositionId: '' }));
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const cfg = DECISION_CONFIG[newType];
    setFormData(prev => ({
      ...prev,
      type: newType,
      title: cfg ? cfg.defaultTitle : prev.title,
      reason: cfg ? cfg.defaultReason : prev.reason
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Dung lượng tệp đính kèm không được vượt quá 10MB');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, fileUrl: event.target.result }));
      toast.success('Đã tải lên tệp đính kèm!');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (statusTarget = 'PENDING') => {
    if (!formData.employeeId) return toast.error('Vui lòng chọn nhân sự áp dụng');
    if (!formData.title?.trim()) return toast.error('Vui lòng nhập trích yếu quyết định');

    if (formData.type === 'SALARY_ADJUSTMENT' && (!formData.newSalary || Number(formData.newSalary) <= 0)) {
      return toast.error('Vui lòng nhập mức lương mới hợp lệ');
    }
    if ((formData.type === 'PROMOTION' || formData.type === 'DEMOTION') && !formData.newPositionId) {
      return toast.error('Vui lòng chọn chức vụ / vị trí mới');
    }
    if (formData.type === 'RECRUITMENT' && !formData.newPositionId) {
      return toast.error('Vui lòng chọn chức vụ tiếp nhận chính thức');
    }
    if (formData.type === 'TRANSFER' && !formData.newDepartmentId && !formData.newPositionId) {
      return toast.error('Vui lòng chọn Phòng ban tiếp nhận hoặc Vị trí chức danh mới cần điều chuyển!');
    }

    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/decisions', {
        ...formData,
        status: statusTarget
      });
      toast.success(statusTarget === 'DRAFT' ? 'Đã lưu bản nháp quyết định thành công!' : 'Đã tạo và gửi quyết định chờ phê duyệt!');
      
      const targetUrl = currentConfig?.backUrl || '/internal/decisions/all';
      navigate(targetUrl);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo quyết định');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang khởi tạo trang soạn thảo quyết định...</div>;
  }

  const effectiveDateObj = new Date(formData.effectiveDate || new Date());
  const activeConfig = DECISION_CONFIG[formData.type] || currentConfig;

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Navigation Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(currentConfig?.backUrl || '/internal/decisions/all')}
            className="btn btn-outline"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> {currentConfig ? currentConfig.name : 'Danh sách'}
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSignature size={22} color={activeConfig?.badgeColor || '#2563EB'} />
                {currentConfig ? currentConfig.pageTitle : 'Soạn Thảo Quyết Định Mới'}
              </h2>
              {activeConfig && (
                <span className="badge" style={{ backgroundColor: activeConfig.badgeBg, color: activeConfig.badgeColor, border: `1px solid ${activeConfig.badgeBorder}`, fontSize: '0.75rem', fontWeight: 700 }}>
                  {activeConfig.name}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              {currentConfig ? currentConfig.subDesc : 'Điền đầy đủ thông tin để khởi tạo văn bản quyết định trình Ban Giám Đốc phê duyệt'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate(currentConfig?.backUrl || '/internal/decisions/all')}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('DRAFT')}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: '#93C5FD', color: '#2563EB', fontWeight: 600 }}
          >
            <Save size={15} style={{ display: 'inline', marginRight: '5px' }} />
            Lưu Bản Nháp
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('PENDING')}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Gửi Phê Duyệt
          </button>
        </div>
      </div>

      {/* 2. Form Container Căn Giữa Hiện Đại - Không cần bản Word Preview */}
      <div style={{ maxWidth: '880px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Card 1: Thông tin văn bản */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#2563EB" /> 1. Định danh & Loại quyết định
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Số hiệu quyết định</label>
                <span style={{ fontSize: '0.72rem', color: '#059669', backgroundColor: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, border: '1px solid #A7F3D0' }}>
                  Tự động sinh
                </span>
              </div>
              <input
                type="text"
                className="form-input"
                value={formData.decisionNumber || 'Đang tạo số tự động...'}
                readOnly
                style={{ backgroundColor: '#F8FAFC', color: '#1E293B', fontWeight: 700, cursor: 'not-allowed', border: '1px solid #CBD5E1' }}
                title="Hệ thống tự động sinh số hiệu văn bản theo quy chuẩn pháp lý"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Loại quyết định *</label>
              {currentConfig ? (
                /* Khi truy cập từ từng trang con: Khóa cố định chỉ hiển thị duy nhất 1 loại */
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  backgroundColor: currentConfig.badgeBg,
                  border: `1px solid ${currentConfig.badgeBorder}`,
                  borderRadius: '6px',
                  fontWeight: 700,
                  color: currentConfig.badgeColor,
                  fontSize: '0.875rem',
                  height: '38px'
                }}>
                  {currentConfig.icon}
                  <span>{currentConfig.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginLeft: 'auto' }}>(Cố định theo mục)</span>
                </div>
              ) : (
                /* Khi truy cập từ trang Tổng hợp: Cho phép chọn loại */
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={handleTypeChange}
                >
                  <option value="PROMOTION">Bổ nhiệm chức vụ</option>
                  <option value="DEMOTION">Miễn nhiệm chức vụ</option>
                  <option value="TRANSFER">Điều chuyển công tác / Vị trí</option>
                  <option value="TERMINATION">Thôi việc / Chấm dứt HĐ</option>
                  <option value="RECRUITMENT">Tuyển dụng / Tiếp nhận chính thức</option>
                  <option value="SALARY_ADJUSTMENT">Điều chỉnh mức lương</option>
                  <option value="REWARD">Khen thưởng thành tích</option>
                  <option value="DISCIPLINE">Thi hành kỷ luật</option>
                </select>
              )}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trích yếu văn bản (Tiêu đề) *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Quyết định bổ nhiệm chức vụ mới..."
              required
            />
          </div>
        </div>

        {/* Card 2: Nhân sự áp dụng & Chi tiết biến động */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#2563EB" /> 2. Nhân sự áp dụng & Chi tiết nội dung
          </h4>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhân sự áp dụng quyết định *</label>
            <select
              className="form-select"
              value={formData.employeeId}
              onChange={handleEmployeeChange}
              required
            >
              <option value="">-- Chọn nhân sự áp dụng --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.code}) - {emp.department?.name || 'Chưa gán PB'} ({emp.position?.title || 'Chưa có vị trí'})
                </option>
              ))}
            </select>
          </div>

          {/* Thông tin hồ sơ ban đầu của nhân sự */}
          {selectedEmp && (
            <div style={{ 
              marginTop: '10px',
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              backgroundColor: '#F1F5F9', 
              border: '1px solid #E2E8F0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.65rem',
              fontSize: '0.8rem'
            }}>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Phòng ban hiện tại:</div>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>{selectedEmp.department?.name || 'Chưa phân bổ'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Chức danh hiện tại:</div>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>{selectedEmp.position?.title || 'Chưa bổ nhiệm'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Mức lương HĐLĐ hiện tại:</div>
                <div style={{ fontWeight: 700, color: '#047857' }}>
                  {Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ/tháng
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS THEO TỪNG LOẠI QUYẾT ĐỊNH */}
          <div style={{ marginTop: '14px' }}>
            
            {/* 1. TĂNG / GIẢM LƯƠNG */}
            {formData.type === 'SALARY_ADJUSTMENT' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #7C3AED' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7C3AED', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} /> Điều chỉnh Mức lương cơ bản
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Lương hợp đồng hiện tại</label>
                    <input
                      type="text"
                      className="form-input"
                      value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                      disabled
                      style={{ backgroundColor: '#F1F5F9', color: '#047857', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>Mức lương mới (VNĐ) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="VD: 15000000"
                      value={formData.newSalary}
                      onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                      style={{ fontWeight: 700, borderColor: '#7C3AED' }}
                      required
                    />
                  </div>
                </div>
                {formData.newSalary && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#F5F3FF', fontSize: '0.75rem', color: '#6D28D9', fontWeight: 600 }}>
                    ➔ Chênh lệch: {Number(formData.newSalary) - Number(formData.oldSalary || 0) >= 0 ? `Tăng +${(Number(formData.newSalary) - Number(formData.oldSalary || 0)).toLocaleString('vi-VN')} VNĐ` : `Giảm ${(Number(formData.newSalary) - Number(formData.oldSalary || 0)).toLocaleString('vi-VN')} VNĐ`}
                  </div>
                )}
              </div>
            )}

            {/* 2. BỔ NHIỆM */}
            {formData.type === 'PROMOTION' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #0284C7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} /> Bổ nhiệm Chức vụ / Vị trí mới
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Chức vụ / Vị trí bổ nhiệm mới *</label>
                  <select
                    className="form-select"
                    value={formData.newPositionId}
                    onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn chức vụ bổ nhiệm mới --</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Toàn công ty'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mức lương hiện tại</label>
                      <input
                        type="text"
                        className="form-input"
                        value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                        disabled
                        style={{ backgroundColor: '#F1F5F9', color: '#047857', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mức lương mới sau bổ nhiệm (VNĐ - Tùy chọn)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Để trống nếu giữ nguyên mức lương cũ"
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  {formData.newSalary && (
                    <div style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600, marginTop: '6px' }}>
                      ➔ Lương mới: {Number(formData.newSalary).toLocaleString('vi-VN')} VNĐ/tháng (Chênh lệch: {Number(formData.newSalary) - Number(formData.oldSalary || 0) >= 0 ? '+' : ''}{(Number(formData.newSalary) - Number(formData.oldSalary || 0)).toLocaleString('vi-VN')} VNĐ)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. MIỄN NHIỆM */}
            {formData.type === 'DEMOTION' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #EA580C', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EA580C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={16} /> Miễn nhiệm & Chuyển giao vị trí
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vị trí / Chức danh mới sau miễn nhiệm *</label>
                  <select
                    className="form-select"
                    value={formData.newPositionId}
                    onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn vị trí mới sau miễn nhiệm --</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Toàn công ty'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mức lương hiện tại</label>
                      <input
                        type="text"
                        className="form-input"
                        value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                        disabled
                        style={{ backgroundColor: '#F1F5F9', color: '#047857', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mức lương mới sau miễn nhiệm (VNĐ - Tùy chọn)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Để trống nếu giữ nguyên lương cũ"
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. THUYÊN CHUYỂN */}
            {formData.type === 'TRANSFER' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #10B981', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowRight size={16} /> Điều chuyển Công tác / Vị trí chuyên môn
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Đơn vị / Phòng ban tiếp nhận</label>
                    <select
                      className="form-select"
                      value={formData.newDepartmentId}
                      onChange={(e) => setFormData({ ...formData, newDepartmentId: e.target.value })}
                    >
                      <option value="">-- Giữ nguyên phòng ban hiện tại --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      (Hiện tại: {selectedEmp?.department?.name || 'Chưa gán'})
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vị trí / Chức danh mới</label>
                    <select
                      className="form-select"
                      value={formData.newPositionId}
                      onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                    >
                      <option value="">-- Giữ nguyên chức danh hiện tại --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Toàn công ty'})</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      (Hiện tại: {selectedEmp?.position?.title || 'Chưa có'})
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                        Mức lương ban đầu (Hiện tại)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                        disabled
                        style={{ backgroundColor: '#ECFDF5', color: '#047857', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                        Mức lương mới sau điều chuyển (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        className="form-input"
                        placeholder="Để trống nếu giữ nguyên mức lương"
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. NGHỈ VIỆC */}
            {formData.type === 'TERMINATION' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px dashed #EF4444', color: '#991B1B', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={16} color="#EF4444" /> Quy trình Chấm dứt Hợp đồng & Bàn giao thôi việc
                </div>
                <div>
                  Khi quyết định này được Ban Giám Đốc phê duyệt, hệ thống sẽ:
                </div>
                <ul style={{ margin: '4px 0 0 1.25rem', padding: 0, fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <li>Chuyển trạng thái nhân sự thành <strong>RESIGNED (Đã thôi việc)</strong>.</li>
                  <li>Khóa quyền đăng nhập cổng nhân viên của người lao động.</li>
                  <li>Tự động đóng Hợp đồng lao động hiện tại và lập biên bản kiểm kê bàn giao thiết bị.</li>
                </ul>
              </div>
            )}

            {/* 6. TUYỂN DỤNG / TIẾP NHẬN CHÍNH THỨC */}
            {formData.type === 'RECRUITMENT' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #2563EB', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Tiếp nhận Nhân sự Chính thức sau Thử việc
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vị trí chức danh chính thức *</label>
                    <select
                      className="form-select"
                      value={formData.newPositionId}
                      onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn vị trí chính thức --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Toàn công ty'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mức lương chính thức (VNĐ/tháng) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="VD: 12000000"
                      value={formData.newSalary}
                      onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                      style={{ fontWeight: 700, borderColor: '#2563EB' }}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. KHEN THƯỞNG */}
            {formData.type === 'REWARD' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px dashed #F59E0B' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} /> Hình thức & Tiền thưởng Khen thưởng
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Số tiền thưởng bằng tiền mặt (VNĐ - Tùy chọn)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="VD: 5000000"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                    style={{ fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    (Tiền thưởng sẽ được tự động cộng vào kỳ tính lương tương ứng)
                  </span>
                </div>
              </div>
            )}

            {/* 8. KỶ LUẬT */}
            {formData.type === 'DISCIPLINE' && (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px dashed #DC2626' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#DC2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} /> Hình thức Kỷ luật theo Bộ luật Lao động
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Hình thức kỷ luật *</label>
                    <select
                      className="form-select"
                      value={formData.disciplineForm}
                      onChange={(e) => setFormData({ ...formData, disciplineForm: e.target.value })}
                    >
                      {DISCIPLINE_FORMS.map((form, i) => (
                        <option key={i} value={form}>{form}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Thời hạn chấp hành kỷ luật</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: 03 tháng, 06 tháng..."
                      value={formData.disciplineDuration}
                      onChange={(e) => setFormData({ ...formData, disciplineDuration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Card 3: Thẩm quyền & Pháp lý */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#2563EB" /> 3. Hiệu lực, Thẩm quyền ký & Tệp đính kèm
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ngày bắt đầu có hiệu lực *</label>
              <input
                type="date"
                className="form-input"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cấp có thẩm quyền ký quyết định *</label>
              <select
                className="form-select"
                value={formData.signBy}
                onChange={(e) => setFormData({ ...formData, signBy: e.target.value })}
              >
                {AUTHORITIES.map((auth, i) => (
                  <option key={i} value={auth}>{auth}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Căn cứ pháp lý & Lý do ban hành *</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="VD: Căn cứ vào kết quả đánh giá năng lực công tác và yêu cầu nhiệm vụ..."
              required
            />
          </div>

          {/* Tệp scan đính kèm */}
          <div style={{ marginTop: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tệp văn bản scan hoặc PDF đính kèm (Tùy chọn)</label>
            {formData.fileUrl ? (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={formData.fileUrl} alt="Scan QĐ" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block' }}>Đã đính kèm tệp văn bản</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, fileUrl: '' }))}
                    style={{ fontSize: '0.78rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '3px' }}
                  >
                    Xóa & Tải tệp khác
                  </button>
                </div>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px', border: '2px dashed #CBD5E1', borderRadius: '8px', backgroundColor: '#F8FAFC', cursor: 'pointer', gap: '4px' }}>
                <UploadCloud size={20} color="#2563EB" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563EB' }}>Chọn ảnh scan hoặc tài liệu đính kèm</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>PNG, JPG, PDF (Tối đa 10MB)</span>
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Action Buttons ở cuối trang */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate(currentConfig?.backUrl || '/internal/decisions/all')}
            className="btn btn-outline"
            style={{ padding: '8px 20px', fontSize: '0.875rem' }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('DRAFT')}
            className="btn btn-outline"
            style={{ padding: '8px 20px', fontSize: '0.875rem', borderColor: '#93C5FD', color: '#2563EB', fontWeight: 600 }}
          >
            <Save size={15} style={{ display: 'inline', marginRight: '5px' }} />
            Lưu Bản Nháp
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('PENDING')}
            className="btn btn-primary"
            style={{ padding: '8px 24px', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Gửi Phê Duyệt
          </button>
        </div>

      </div>

    </div>
  );
};
