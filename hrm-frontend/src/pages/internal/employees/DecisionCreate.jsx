import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle2, FileSignature, DollarSign, TrendingUp, 
  ArrowRight, Award, ShieldAlert, UploadCloud, Trash2, Calendar, User, 
  Building2, Briefcase, FileText, Check, AlertCircle, Eye, Printer, Info
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

export const DecisionCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramType = searchParams.get('type');
  const paramEmpId = searchParams.get('employeeId');

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    decisionNumber: '',
    title: paramType === 'TRANSFER' ? 'Quyết định điều chuyển công tác / vị trí' : 
           paramType === 'PROMOTION' ? 'Quyết định bổ nhiệm chức vụ mới' : 
           paramType === 'TERMINATION' ? 'Quyết định chấm dứt hợp đồng lao động và thôi việc' :
           'Quyết định điều chỉnh mức lương định kỳ',
    type: paramType || 'SALARY_ADJUSTMENT',
    employeeId: paramEmpId || '',
    oldSalary: 0,
    newSalary: '',
    oldDepartmentId: '',
    newDepartmentId: '',
    oldPositionId: '',
    newPositionId: '',
    reason: 'Căn cứ vào kết quả đánh giá năng lực và hiệu suất hoàn thành tốt nhiệm vụ.',
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

        // Xử lý nạp sẵn nhân viên từ URL param
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
    let defaultTitle = '';
    if (newType === 'SALARY_ADJUSTMENT') defaultTitle = 'Quyết định điều chỉnh mức lương định kỳ';
    else if (newType === 'PROMOTION') defaultTitle = 'Quyết định bổ nhiệm chức vụ mới';
    else if (newType === 'TRANSFER') defaultTitle = 'Quyết định điều chuyển công tác / vị trí';
    else if (newType === 'TERMINATION') defaultTitle = 'Quyết định chấm dứt hợp đồng lao động';
    else if (newType === 'REWARD') defaultTitle = 'Quyết định khen thưởng thành tích xuất sắc';
    else if (newType === 'DISCIPLINE') defaultTitle = 'Quyết định thi hành kỷ luật';

    setFormData(prev => ({
      ...prev,
      type: newType,
      title: defaultTitle
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
    if (formData.type === 'PROMOTION' && !formData.newPositionId) {
      return toast.error('Vui lòng chọn chức vụ bổ nhiệm mới');
    }
    if (formData.type === 'TRANSFER' && !formData.newDepartmentId && !formData.newPositionId) {
      return toast.error('Vui lòng chọn Phòng ban tiếp nhận mới hoặc Vị trí chức danh mới cần điều chuyển!');
    }

    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/decisions', {
        ...formData,
        status: statusTarget
      });
      toast.success(statusTarget === 'DRAFT' ? 'Đã lưu bản nháp quyết định thành công!' : 'Đã tạo và gửi quyết định chờ phê duyệt!');
      navigate(`/internal/employees/decisions/${res.data.id}`);
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
            onClick={() => navigate('/internal/employees/decisions')}
            className="btn btn-outline"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Danh sách
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSignature size={22} color="#2563EB" /> Soạn Thảo Quyết Định Nhân Sự
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Chế độ Live Preview: Nhập liệu bên trái và theo dõi văn bản thể thức A4 trực tiếp bên phải
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/internal/employees/decisions')}
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

      {/* 2. Main 2-Column Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.15fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* COLUMN 1: FORM NHẬP LIỆU THÔNG MINH */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card 1: Thông tin văn bản */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#2563EB" /> 1. Định danh & Loại văn bản
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
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={handleTypeChange}
                >
                  <option value="SALARY_ADJUSTMENT">Điều chỉnh lương</option>
                  <option value="PROMOTION">Bổ nhiệm chức vụ</option>
                  <option value="TRANSFER">Điều chuyển công tác / Vị trí</option>
                  <option value="TERMINATION">Thôi việc / Chấm dứt HĐ</option>
                  <option value="REWARD">Khen thưởng thành tích</option>
                  <option value="DISCIPLINE">Thi hành kỷ luật</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Trích yếu văn bản (Tiêu đề) *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Quyết định điều chỉnh mức lương định kỳ 2026..."
                required
              />
            </div>
          </div>

          {/* Card 2: Nhân sự áp dụng & Chi tiết biến động */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#2563EB" /> 2. Nhân sự & Chi tiết thay đổi
            </h4>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nhân sự áp dụng quyết định *</label>
              <select
                className="form-select"
                value={formData.employeeId}
                onChange={handleEmployeeChange}
                required
              >
                <option value="">-- Chọn nhân viên áp dụng --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.code}) - {emp.department?.name || 'Chưa gán PB'}
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.65rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Phòng ban ban đầu:</div>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{selectedEmp.department?.name || 'Chưa phân bổ'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Chức danh ban đầu:</div>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{selectedEmp.position?.title || 'Chưa bổ nhiệm'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Mức lương ban đầu (HĐLĐ):</div>
                  <div style={{ fontWeight: 700, color: '#047857' }}>
                    {Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ/tháng
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS THEO TYPE */}
            <div style={{ marginTop: '14px' }}>
              {formData.type === 'SALARY_ADJUSTMENT' && (
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #2563EB' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} /> Điều chỉnh Mức lương cơ bản
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Lương hợp đồng ban đầu (Hiện tại)</label>
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
                        style={{ fontWeight: 700, borderColor: '#2563EB' }}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'PROMOTION' && (
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #0284C7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} /> Bổ nhiệm Chức vụ mới
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Chức vụ / Vị trí bổ nhiệm mới *</label>
                    <select
                      className="form-select"
                      value={formData.newPositionId}
                      onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn chức vụ mới --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.department?.name || 'Toàn công ty'})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mức lương ban đầu (HĐLĐ)</label>
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
                          placeholder="Để trống nếu giữ nguyên lương cũ"
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

              {formData.type === 'TRANSFER' && (
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px dashed #10B981', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={16} /> Điều chuyển Công tác / Vị trí chuyên môn
                  </div>
                  
                  {/* Chọn Đơn vị mới & Vị trí mới */}
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

                  {/* KHỐI TIỀN LƯƠNG: HIỆN MỨC LƯƠNG BAN ĐẦU & NHẬP LƯƠNG MỚI */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DollarSign size={15} color="#047857" /> Chế độ Tiền lương sau Điều chuyển
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Mức lương ban đầu */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                          Mức lương ban đầu (Hiện tại)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={Number(formData.oldSalary || 0).toLocaleString('vi-VN') + ' VNĐ'}
                            disabled
                            style={{ 
                              backgroundColor: '#ECFDF5', 
                              color: '#047857', 
                              fontWeight: 700, 
                              border: '1px solid #A7F3D0',
                              cursor: 'not-allowed'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          (Theo Hợp đồng lao động hiện tại)
                        </span>
                      </div>

                      {/* Mức lương mới */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                          Mức lương mới sau điều chuyển (VNĐ)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100000"
                          className="form-input"
                          placeholder="Để trống nếu giữ nguyên mức lương ban đầu"
                          value={formData.newSalary}
                          onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                          style={{ fontWeight: 700, borderColor: formData.newSalary ? '#047857' : '#CBD5E1' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          (Tùy chọn: Nhập nếu có điều chỉnh thu nhập)
                        </span>
                      </div>
                    </div>

                    {/* Banner so sánh chênh lệch trực quan */}
                    <div style={{ 
                      marginTop: '4px',
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      backgroundColor: formData.newSalary ? '#F0FDF4' : '#F8FAFC', 
                      border: formData.newSalary ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      fontSize: '0.75rem'
                    }}>
                      {formData.newSalary ? (
                        <div style={{ color: '#166534', fontWeight: 600 }}>
                          ➔ <strong>So sánh biến động:</strong> {Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ ➔ <strong style={{ color: '#047857', fontSize: '0.85rem' }}>{Number(formData.newSalary).toLocaleString('vi-VN')} VNĐ/tháng</strong> ({Number(formData.newSalary) - Number(formData.oldSalary || 0) >= 0 ? `Tăng +${(Number(formData.newSalary) - Number(formData.oldSalary || 0)).toLocaleString('vi-VN')} VNĐ` : `Giảm ${(Number(formData.newSalary) - Number(formData.oldSalary || 0)).toLocaleString('vi-VN')} VNĐ`})
                        </div>
                      ) : (
                        <div style={{ color: '#64748B' }}>
                          ➔ <strong>Chế độ lương:</strong> Giữ nguyên mức lương ban đầu là <strong>{Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ/tháng</strong>.
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={13} style={{ flexShrink: 0, color: '#2563EB' }} />
                      <span>Khi Ban Giám Đốc phê duyệt, hệ thống sẽ tự động cập nhật chức danh/phòng ban và sinh <strong>Phụ lục Hợp đồng lao động</strong> ghi nhận mức lương mới.</span>
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'TERMINATION' && (
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px dashed #EF4444', color: '#991B1B', fontSize: '0.85rem' }}>
                  <strong>Quy định thu hồi:</strong> Khi quyết định này được phê duyệt, hệ thống sẽ tự động khóa tài khoản đăng nhập, đóng Hợp đồng lao động và đổi trạng thái nhân sự thành RESIGNED (Lưu ý: Nhân sự cần trả hết thiết bị/tài sản trước khi duyệt).
                </div>
              )}

              {formData.type === 'REWARD' && (
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px dashed #F59E0B' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} /> Hình thức & Mức thưởng
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Số tiền thưởng bằng tiền mặt (VNĐ - Tùy chọn)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="VD: 5000000"
                      value={formData.rewardAmount}
                      onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.type === 'DISCIPLINE' && (
                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px dashed #DC2626' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#DC2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={16} /> Hình thức Kỷ luật theo Bộ luật Lao động
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Hình thức kỷ luật *</label>
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
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Thời hạn chấp hành kỷ luật</label>
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
              <Calendar size={18} color="#2563EB" /> 3. Hiệu lực & Căn cứ pháp lý
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
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Thẩm quyền ký duyệt</label>
                <select
                  className="form-select"
                  value={formData.signBy}
                  onChange={(e) => setFormData({ ...formData, signBy: e.target.value })}
                >
                  {AUTHORITIES.map((auth, idx) => (
                    <option key={idx} value={auth}>{auth}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Căn cứ ban hành văn bản</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Ghi rõ căn cứ tờ trình, biên bản họp hoặc lý do điều chỉnh..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              ></textarea>
            </div>

            {/* Upload file đính kèm */}
            <div style={{ marginTop: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Đính kèm bản scan quyết định có chữ ký / Tờ trình (Tùy chọn)
              </label>
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
        </div>

        {/* COLUMN 2: REAL-TIME LIVE DOCUMENT PREVIEW (MẪU VĂN BẢN QUY CHUẨN A4) */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            padding: '2.5rem 2.8rem',
            color: '#0F172A',
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: 1.6,
            minHeight: '720px',
            position: 'relative'
          }}>
            {/* Watermark Dự thảo */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '4.5rem',
              fontWeight: 900,
              color: 'rgba(226, 232, 240, 0.65)',
              pointerEvents: 'none',
              letterSpacing: '10px'
            }}>
              DỰ THẢO
            </div>

            {/* Header 2 cột */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>CÔNG TY TNHH LLA</div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>PHÒNG NHÂN SỰ</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Số: <strong>{formData.decisionNumber || 'QĐ-2026/...'}</strong></div>
              </div>

              <div style={{ textAlign: 'center', width: '50%' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: '6px' }}>
                  Hà Nội, ngày {effectiveDateObj.getDate()} tháng {effectiveDateObj.getMonth() + 1} năm {effectiveDateObj.getFullYear()}
                </div>
              </div>
            </div>

            {/* Tiêu đề Quyết định */}
            <div style={{ textAlign: 'center', margin: '1.75rem 0 1.25rem 0' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                QUYẾT ĐỊNH
              </h2>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', fontStyle: 'italic' }}>
                V/v {formData.title || 'Biến động nhân sự'}
              </div>
            </div>

            {/* Thẩm quyền & Căn cứ */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '0.85rem' }}>
              {formData.signBy?.toUpperCase() || 'BAN GIÁM ĐỐC CÔNG TY TNHH LLA'}
            </div>

            <div style={{ fontSize: '0.925rem', fontStyle: 'italic', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '1.25rem', textAlign: 'justify' }}>
              <div>- Căn cứ Bộ luật Lao động số 45/2019/QH14 được Quốc hội nước CHXHCN Việt Nam thông qua ngày 20/11/2019;</div>
              <div>- Căn cứ Điều lệ tổ chức và hoạt động hiện hành của Công ty TNHH LLA;</div>
              <div>- Căn cứ chức năng, quyền hạn của {formData.signBy || 'Ban Giám Đốc'};</div>
              {formData.reason && <div>- Căn cứ {formData.reason};</div>}
              <div>- Xét đề nghị của Trưởng phòng Nhân sự và nhu cầu công tác thực tế,</div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', margin: '0.85rem 0' }}>
              QUYẾT ĐỊNH:
            </div>

            {/* Điều khoản */}
            <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'justify' }}>
              <div>
                <strong>Điều 1. </strong>
                {formData.type === 'SALARY_ADJUSTMENT' && (
                  <span>
                    Nay điều chỉnh mức lương cơ bản đối với Ông/Bà <strong>{selectedEmp?.fullName || '[Họ tên nhân viên]'}</strong> (Mã nhân viên: <strong>{selectedEmp?.code || '[Mã NV]'}</strong>), 
                    chức vụ: <strong>{selectedEmp?.position?.title || 'Chuyên viên'}</strong>, thuộc phòng ban: <strong>{selectedEmp?.department?.name || 'Phòng ban'}</strong>.
                    <br/>
                    - Mức lương cũ: <strong>{Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ</strong>.
                    <br/>
                    - Mức lương mới áp dụng: <strong>{Number(formData.newSalary || 0).toLocaleString('vi-VN')} VNĐ</strong> / tháng.
                  </span>
                )}

                {formData.type === 'PROMOTION' && (
                  <span>
                    Bổ nhiệm Ông/Bà <strong>{selectedEmp?.fullName || '[Họ tên nhân viên]'}</strong> (Mã nhân viên: <strong>{selectedEmp?.code || '[Mã NV]'}</strong>) 
                    giữ chức vụ mới: <strong>{newPosObj?.title || '[Chức vụ bổ nhiệm mới]'}</strong> thuộc Công ty TNHH LLA.
                  </span>
                )}

                {formData.type === 'TRANSFER' && (
                  <span>
                    Điều chuyển công tác đối với Ông/Bà <strong>{selectedEmp?.fullName || '[Họ tên nhân viên]'}</strong> (Mã nhân viên: <strong>{selectedEmp?.code || '[Mã NV]'}</strong>) 
                    {newDeptObj && formData.oldDepartmentId !== formData.newDepartmentId ? (
                      <> từ phòng ban <strong>{selectedEmp?.department?.name || '---'}</strong> sang đơn vị tiếp nhận mới: <strong style={{ color: '#10b981' }}>{newDeptObj.name}</strong>,</>
                    ) : (
                      <> công tác tại đơn vị <strong>{selectedEmp?.department?.name || '---'}</strong>,</>
                    )}
                    {newPosObj && formData.oldPositionId !== formData.newPositionId ? (
                      <> đảm nhiệm chức danh công việc mới: <strong style={{ color: '#2563eb' }}>{newPosObj.title}</strong> (vị trí cũ: <em>{selectedEmp?.position?.title || '---'}</em>).</>
                    ) : (
                      <> giữ nguyên chức vụ: <strong>{selectedEmp?.position?.title || '---'}</strong>.</>
                    )}
                    <br/>
                    - Mức lương ban đầu (theo HĐLĐ): <strong>{Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ</strong> / tháng.
                    <br/>
                    - Mức lương mới áp dụng: <strong>{formData.newSalary ? `${Number(formData.newSalary).toLocaleString('vi-VN')} VNĐ / tháng` : `Giữ nguyên mức lương ban đầu (${Number(formData.oldSalary || 0).toLocaleString('vi-VN')} VNĐ)`}</strong>.
                    <br/>
                    - Hai bên thống nhất tiến hành giao kết Phụ lục Hợp đồng lao động ghi nhận chức vụ và mức lương mới theo quy định của pháp luật lao động.
                  </span>
                )}

                {formData.type === 'TERMINATION' && (
                  <span>
                    Chấm dứt hợp đồng lao động và giải quyết thủ tục thôi việc đối với Ông/Bà <strong>{selectedEmp?.fullName || '[Họ tên nhân viên]'}</strong> (Mã nhân viên: <strong>{selectedEmp?.code || '[Mã NV]'}</strong>). 
                    Ông/Bà có trách nhiệm hoàn tất bàn giao công việc, tài sản, trang thiết bị trước ngày thôi việc.
                  </span>
                )}

                {formData.type === 'REWARD' && (
                  <span>
                    Khen thưởng thành tích xuất sắc đối với Ông/Bà <strong>{selectedEmp?.fullName || '[Họ tên nhân viên]'}</strong> (Mã nhân viên: <strong>{selectedEmp?.code || '[Mã NV]'}</strong>).
                    {formData.rewardAmount && <span> Kèm theo số tiền khen thưởng là: <strong>{Number(formData.rewardAmount).toLocaleString('vi-VN')} VNĐ</strong>.</span>}
                  </span>
                )}

                {formData.type === 'DISCIPLINE' && (
                  <span>
                    Thi hành kỷ luật lao động bằng hình thức <strong>{formData.disciplineForm || 'Khiển trách'}</strong> đối với Ông/Bà <strong>{selectedEmp?.fullName || '[Họ tên nhân viên]'}</strong> (Mã nhân viên: <strong>{selectedEmp?.code || '[Mã NV]'}</strong>).
                    {formData.disciplineDuration && <span> Thời hạn chấp hành: <strong>{formData.disciplineDuration}</strong> kể từ ngày quyết định có hiệu lực.</span>}
                  </span>
                )}
              </div>

              <div>
                <strong>Điều 2. </strong>
                Quyết định này có hiệu lực thi hành kể từ ngày <strong>{effectiveDateObj.toLocaleDateString('vi-VN')}</strong>.
              </div>

              <div>
                <strong>Điều 3. </strong>
                Các thành viên Ban Giám Đốc, Trưởng phòng Nhân sự, Trưởng phòng Tài chính - Kế toán và Ông/Bà <strong>{selectedEmp?.fullName || '[Tên nhân sự]'}</strong> chịu trách nhiệm thi hành Quyết định này.
              </div>
            </div>

            {/* Footer Ký tên */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '2rem' }}>
              <div style={{ fontSize: '0.8rem', width: '45%' }}>
                <strong><em>Nơi nhận:</em></strong>
                <div>- Như Điều 3;</div>
                <div>- Ban Giám Đốc;</div>
                <div>- Lưu: VT, HSNV.</div>
              </div>

              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>TM. BAN TỔNG GIÁM ĐỐC</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '3.5rem' }}>{formData.signBy?.toUpperCase() || 'TỔNG GIÁM ĐỐC'}</div>
                <div style={{ fontStyle: 'italic', color: '#94A3B8', fontSize: '0.75rem' }}>(Ký, đóng dấu điện tử khi ban hành)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
