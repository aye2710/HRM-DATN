import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, Save, Edit, CheckCircle, Plus, FileText, AlertTriangle, Eye, Upload, 
  X, ExternalLink, ChevronLeft, ChevronRight, Trash2, Laptop, FileSignature, 
  Award, TrendingUp, ShieldCheck, CheckCircle2, Building2, Briefcase,
  GraduationCap, Users, Shield, Calendar, CreditCard, MapPin, Phone, Mail, FileCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';

const parseContractFiles = (fileUrl) => {
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [fileUrl];
  } catch (e) {
    return [fileUrl];
  }
};

const getContractTypeName = (type) => {
  switch (type) {
    case 'PROBATION': return 'Thử việc';
    case 'INTERNSHIP': return 'Thực tập sinh';
    case 'OFFICIAL_1Y': return 'Chính thức (1 năm)';
    case 'INDEFINITE': return 'Không xác định thời hạn';
    default: return type || 'Chưa xác định';
  }
};

const getContractStatusBadge = (status, endDate) => {
  if (status === 'ACTIVE' && endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
    
    if (diffDays < 0) {
      return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Hết hạn</span>;
    }
    if (diffDays <= 15) {
      return <span className="badge" style={{ backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Sắp hết hạn ({diffDays === 0 ? 'Hôm nay' : `còn ${diffDays} ngày`})</span>;
    }
  }

  switch (status) {
    case 'ACTIVE': return <span className="badge badge-success" style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Hiệu lực</span>;
    case 'EXPIRED': return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Hết hạn</span>;
    case 'TERMINATED': return <span className="badge badge-error" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Đã chấm dứt</span>;
    default: return <span className="badge badge-info" style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
  }
};

const getEmployeeStatusName = (status) => {
  switch (status) {
    case 'ACTIVE': return 'Chính thức';
    case 'PROBATION': return 'Thử việc';
    case 'INTERNSHIP': return 'Thực tập';
    case 'ONBOARDING': return 'Đang hội nhập';
    case 'MATERNITY_LEAVE': return 'Nghỉ thai sản';
    case 'UNPAID_LEAVE': return 'Nghỉ không lương';
    case 'SUSPENDED': return 'Tạm hoãn HĐLĐ';
    case 'RESIGNED': return 'Đã thôi việc';
    default: return status || '—';
  }
};

const getManagementRoleLabel = (role) => {
  switch (role) {
    case 'BOD': return 'Ban Tổng Giám Đốc';
    case 'DIRECTOR': return 'Giám đốc Khối';
    case 'DEPUTY_DIRECTOR': return 'Phó Giám đốc Khối';
    case 'MANAGER': return 'Trưởng phòng';
    case 'DEPUTY_MANAGER': return 'Phó Trưởng phòng';
    case 'TEAM_LEAD': return 'Trưởng nhóm (Lead)';
    default: return 'Nhân viên chuyên môn';
  }
};

const managementRolesList = [
  { value: 'STAFF', label: 'Nhân viên chuyên môn' },
  { value: 'TEAM_LEAD', label: 'Trưởng nhóm (Team Lead)' },
  { value: 'DEPUTY_MANAGER', label: 'Phó Trưởng phòng' },
  { value: 'MANAGER', label: 'Trưởng phòng' },
  { value: 'DEPUTY_DIRECTOR', label: 'Phó Giám đốc Khối' },
  { value: 'DIRECTOR', label: 'Giám đốc Khối' },
  { value: 'BOD', label: 'Ban Tổng Giám Đốc' }
];

const employmentTypesList = [
  { value: 'FULL_TIME', label: 'Toàn thời gian (Full-time)' },
  { value: 'PART_TIME', label: 'Bán thời gian (Part-time)' },
  { value: 'INTERNSHIP', label: 'Thực tập sinh (Internship)' },
  { value: 'COLLABORATOR', label: 'Cộng tác viên (CTV)' }
];

const employeeStatusOptions = [
  { value: 'ACTIVE', label: 'Chính thức (Active)' },
  { value: 'PROBATION', label: 'Thử việc (Probation)' },
  { value: 'ONBOARDING', label: 'Đang hội nhập (Onboarding)' },
  { value: 'INTERNSHIP', label: 'Thực tập (Internship)' },
  { value: 'MATERNITY_LEAVE', label: 'Nghỉ thai sản' },
  { value: 'UNPAID_LEAVE', label: 'Nghỉ không lương' },
  { value: 'SUSPENDED', label: 'Tạm hoãn HĐLĐ' },
  { value: 'RESIGNED', label: 'Đã thôi việc (Resigned)' }
];

const InfoField = ({ label, value, type = 'text', isEditMode, onChange, required = false, options = [], helperText = '' }) => {
  const readOnlyStyle = {
    padding: '10px 16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    fontSize: '0.925rem',
    fontWeight: '500',
    color: '#0f172a',
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center'
  };

  const editStyle = {
    padding: '10px 16px', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    outline: 'none', 
    fontSize: '0.925rem',
    backgroundColor: 'white',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'border-color 0.2s',
    width: '100%'
  };

  if (type === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {isEditMode ? (
          <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={editStyle}>
            <option value="">-- Chọn --</option>
            {options.map(o => <option key={o.value || o.id} value={o.value || o.id}>{o.label || o.name}</option>)}
          </select>
        ) : (
          <div style={readOnlyStyle}>
            {options.find(o => (o.value || o.id) === value)?.label || options.find(o => (o.value || o.id) === value)?.name || value || '—'}
          </div>
        )}
        {helperText && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{helperText}</span>}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {isEditMode ? (
          <textarea 
            rows={3}
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
            style={editStyle}
          />
        ) : (
          <div style={{ ...readOnlyStyle, minHeight: '60px', alignItems: 'flex-start' }}>
            {value || '—'}
          </div>
        )}
        {helperText && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{helperText}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {isEditMode ? (
        <input 
          type={type} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          style={editStyle}
        />
      ) : (
        <div style={readOnlyStyle}>
          {type === 'date' && value ? new Date(value).toLocaleDateString('vi-VN') : (value || '—')}
        </div>
      )}
      {helperText && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{helperText}</span>}
    </div>
  );
};

const ProfileHeader = ({ employee, isEditMode, onToggleEdit, onSave, onBack, calculateSeniority }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', borderTop: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ width: '92px', height: '92px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)', border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: '700', color: '#2563eb', flexShrink: 0 }}>
        {employee?.fullName ? (employee.fullName.split(' ').pop()?.substring(0, 2).toUpperCase() || 'NV') : 'NV'}
      </div>
      <div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {employee.fullName}
          <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: employee.status === 'ACTIVE' ? '#dcfce7' : '#fef9c3', color: employee.status === 'ACTIVE' ? '#166534' : '#854d0e' }}>
            {getEmployeeStatusName(employee.status)}
          </span>
        </h2>
        <div style={{ fontSize: '0.925rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '700', color: '#2563EB', fontFamily: 'monospace' }}>{employee.code}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {employee.position?.title || 'Chưa xếp chức danh'}
            {employee.position?.level && (
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                {employee.position.level}
              </span>
            )}
            {employee.managementRole && employee.managementRole !== 'STAFF' && (
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                {getManagementRoleLabel(employee.managementRole)}
              </span>
            )}
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{employee.department?.name || 'Chưa xếp phòng ban'}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#64748b' }}>📍 {employee.workLocation || 'Trụ sở chính'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px', fontSize: '0.875rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>📞 <span style={{ fontWeight: '500', color: '#334155' }}>{employee.phone || '—'}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>✉️ <span style={{ fontWeight: '500', color: '#334155' }}>{employee.email || '—'}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: '600', backgroundColor: '#f0fdf4', padding: '3px 10px', borderRadius: '6px' }}>
            📅 Thâm niên: {calculateSeniority(employee.joinDate)}
          </span>
        </div>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
        <ArrowLeft size={16} /> Trở về
      </button>
      {!isEditMode ? (
        <button onClick={onToggleEdit} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}>
          <Edit size={16} /> Sửa hồ sơ
        </button>
      ) : (
        <button onClick={onSave} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
          <Save size={16} /> Lưu thay đổi
        </button>
      )}
    </div>
  </div>
);

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('PERSONAL');
  
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // Modal Hợp đồng
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [viewingContractFile, setViewingContractFile] = useState(null);
  const [newContractForm, setNewContractForm] = useState({
    contractNumber: '',
    contractType: 'OFFICIAL_1Y',
    baseSalary: '',
    allowance: '0',
    insuranceSalary: '',
    paymentMethod: 'BANK_TRANSFER',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    signBy: 'Ban Giám Đốc',
    workLocation: 'Trụ sở chính',
    appendixNote: '',
    fileUrls: []
  });
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // Modal Người thân / Phụ thuộc (Thuế TNCN)
  const [showAddRelativeModal, setShowAddRelativeModal] = useState(false);
  const [relativeForm, setRelativeForm] = useState({
    fullName: '',
    relation: 'Con',
    dateOfBirth: '',
    cccd: '',
    taxCode: '',
    isDependent: true,
    taxDeductionStart: '',
    taxDeductionEnd: '',
    proofDocument: 'Giấy khai sinh'
  });

  // Modal Bằng cấp
  const [showAddDegreeModal, setShowAddDegreeModal] = useState(false);
  const [degreeForm, setDegreeForm] = useState({
    degreeName: '',
    major: '',
    institution: '',
    gradYear: new Date().getFullYear(),
    classification: 'Giỏi',
    fileUrl: ''
  });

  // Modal Chứng chỉ
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuedBy: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    fileUrl: ''
  });

  // Modal Kinh nghiệm làm việc
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [expForm, setExpForm] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  // Modal xem ảnh tài liệu / scan bằng cấp & chứng chỉ
  const [previewDocModal, setPreviewDocModal] = useState(null); // { title: '', url: '' }

  // Upload file scan cho bằng cấp / chứng chỉ
  const handleDegreeCertFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Dung lượng tệp đính kèm không được vượt quá 10MB');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target.result);
      toast.success('Đã tải lên tệp đính kèm!');
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes, allEmpRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/employees/${id}`),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions'),
        axios.get('http://localhost:5000/api/employees')
      ]);
      const formattedPositions = (posRes.data || []).map(p => ({
        id: p.id,
        value: p.id,
        label: `${p.title}${p.level ? ` (${p.level})` : ''}`,
        title: p.title,
        level: p.level
      }));
      setEmployee(empRes.data);
      setDepartments(deptRes.data);
      setPositions(formattedPositions);
      setAllEmployees(allEmpRes.data || []);
    } catch (error) {
      toast.error('Không thể tải thông tin nhân sự');
      navigate('/internal/employees/profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleChange = (field, value) => {
    setEmployee({ ...employee, [field]: value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/employees/${id}`, employee);
      toast.success('Đã cập nhật hồ sơ thành công!');
      setIsEditMode(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
    }
  };

  const calculateSeniority = (dateStr) => {
    if (!dateStr) return '0 năm';
    const diff = new Date() - new Date(dateStr);
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    if (years === 0 && months === 0) return 'Mới gia nhập';
    if (years === 0) return `${months} tháng`;
    return `${years} năm ${months} tháng`;
  };

  // Quản lý Hợp đồng
  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!newContractForm.baseSalary || !newContractForm.startDate) {
      return toast.error('Vui lòng nhập Lương cơ bản và Ngày bắt đầu');
    }
    setIsSubmittingContract(true);
    try {
      await axios.post('http://localhost:5000/api/contracts', {
        employeeId: id,
        ...newContractForm,
        fileUrl: newContractForm.fileUrls.length > 0 ? JSON.stringify(newContractForm.fileUrls) : null,
        baseSalary: parseFloat(newContractForm.baseSalary),
        allowance: parseFloat(newContractForm.allowance || 0),
        insuranceSalary: newContractForm.insuranceSalary ? parseFloat(newContractForm.insuranceSalary) : parseFloat(newContractForm.baseSalary)
      });
      toast.success('Thêm hợp đồng mới thành công!');
      setShowAddContractModal(false);
      setNewContractForm({
        contractNumber: '',
        contractType: 'OFFICIAL_1Y',
        baseSalary: '',
        allowance: '0',
        insuranceSalary: '',
        paymentMethod: 'BANK_TRANSFER',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        signBy: 'Ban Giám Đốc',
        workLocation: 'Trụ sở chính',
        appendixNote: '',
        fileUrls: []
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo hợp đồng');
    } finally {
      setIsSubmittingContract(false);
    }
  };

  // Upload ảnh hợp đồng
  const handleUploadContractFiles = (contractId, files, isAppend = true) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return toast.error('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!');
    const t = toast.loading(`Đang tải ${validFiles.length} trang ảnh hợp đồng...`);
    
    Promise.all(validFiles.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    }))).then(async (newImages) => {
      try {
        const currentContract = employee?.contracts?.find(c => c.id === contractId);
        const existingImages = isAppend ? parseContractFiles(currentContract?.fileUrl) : [];
        const allImages = [...existingImages, ...newImages];
        
        await axios.patch(`http://localhost:5000/api/contracts/${contractId}`, { 
          fileUrl: JSON.stringify(allImages) 
        });
        toast.dismiss(t);
        toast.success(`Đã lưu ${validFiles.length} trang hợp đồng!`);
        fetchData();
        if (viewingContractFile && viewingContractFile.contractId === contractId) {
          setViewingContractFile({
            ...viewingContractFile,
            urls: allImages,
            currentIndex: allImages.length - 1
          });
        }
      } catch (err) {
        toast.dismiss(t);
        toast.error('Lỗi khi lưu ảnh hợp đồng!');
      }
    });
  };

  const handleDeleteContractPage = async (contractId, pageIndex) => {
    const currentContract = employee?.contracts?.find(c => c.id === contractId);
    const existingImages = parseContractFiles(currentContract?.fileUrl);
    const newImages = existingImages.filter((_, idx) => idx !== pageIndex);
    const t = toast.loading('Đang cập nhật trang hợp đồng...');
    try {
      await axios.patch(`http://localhost:5000/api/contracts/${contractId}`, {
        fileUrl: newImages.length > 0 ? JSON.stringify(newImages) : null
      });
      toast.dismiss(t);
      toast.success('Đã xóa trang hợp đồng!');
      fetchData();
      if (newImages.length === 0) setViewingContractFile(null);
      else setViewingContractFile({ ...viewingContractFile, urls: newImages, currentIndex: Math.max(0, pageIndex - 1) });
    } catch (err) {
      toast.dismiss(t);
      toast.error('Lỗi khi xóa trang hợp đồng');
    }
  };

  // Quản lý Người thân / Phụ thuộc
  const handleAddRelative = async (e) => {
    e.preventDefault();
    if (!relativeForm.fullName || !relativeForm.relation) {
      return toast.error('Vui lòng điền Họ tên và Mối quan hệ');
    }
    try {
      await axios.post(`http://localhost:5000/api/employees/${id}/relatives`, relativeForm);
      toast.success('Đã thêm người thân / người phụ thuộc thành công!');
      setShowAddRelativeModal(false);
      setRelativeForm({
        fullName: '',
        relation: 'Con',
        dateOfBirth: '',
        cccd: '',
        taxCode: '',
        isDependent: true,
        taxDeductionStart: '',
        taxDeductionEnd: '',
        proofDocument: 'Giấy khai sinh'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi thêm người phụ thuộc');
    }
  };

  const handleDeleteRelative = async (relId) => {
    if (!window.confirm('Xác nhận xóa người thân/người phụ thuộc này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}/relatives/${relId}`);
      toast.success('Đã xóa thành công!');
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi xóa');
    }
  };

  // Quản lý Bằng cấp
  const handleAddDegree = async (e) => {
    e.preventDefault();
    if (!degreeForm.degreeName || !degreeForm.major || !degreeForm.institution) {
      return toast.error('Vui lòng điền Tên bằng cấp, Chuyên ngành và Trường đào tạo');
    }
    try {
      await axios.post(`http://localhost:5000/api/employees/${id}/degrees`, degreeForm);
      toast.success('Đã thêm bằng cấp thành công!');
      setShowAddDegreeModal(false);
      setDegreeForm({
        degreeName: '',
        major: '',
        institution: '',
        gradYear: new Date().getFullYear(),
        classification: 'Giỏi',
        fileUrl: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi thêm bằng cấp');
    }
  };

  const handleDeleteDegree = async (degId) => {
    if (!window.confirm('Xác nhận xóa bằng cấp này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}/degrees/${degId}`);
      toast.success('Đã xóa bằng cấp!');
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi xóa bằng cấp');
    }
  };

  // Quản lý Chứng chỉ
  const handleAddCert = async (e) => {
    e.preventDefault();
    if (!certForm.name || !certForm.issuedBy) {
      return toast.error('Vui lòng điền Tên chứng chỉ và Đơn vị cấp');
    }
    try {
      await axios.post(`http://localhost:5000/api/employees/${id}/certificates`, certForm);
      toast.success('Đã thêm chứng chỉ thành công!');
      setShowAddCertModal(false);
      setCertForm({
        name: '',
        issuedBy: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        fileUrl: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi thêm chứng chỉ');
    }
  };

  const handleDeleteCert = async (certId) => {
    if (!window.confirm('Xác nhận xóa chứng chỉ này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}/certificates/${certId}`);
      toast.success('Đã xóa chứng chỉ!');
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi xóa chứng chỉ');
    }
  };

  // Quản lý Kinh nghiệm làm việc trước đây
  const parsedWorkExp = useMemo(() => {
    if (!employee?.workExperience) return [];
    try {
      return typeof employee.workExperience === 'string' ? JSON.parse(employee.workExperience) : employee.workExperience;
    } catch (e) {
      return [];
    }
  }, [employee]);

  const handleAddExp = async (e) => {
    e.preventDefault();
    if (!expForm.company || !expForm.position) {
      return toast.error('Vui lòng điền Tên công ty và Vị trí làm việc');
    }
    const newExps = [...parsedWorkExp, expForm];
    try {
      await axios.put(`http://localhost:5000/api/employees/${id}`, {
        workExperience: JSON.stringify(newExps)
      });
      toast.success('Đã thêm kinh nghiệm làm việc!');
      setShowAddExpModal(false);
      setExpForm({ company: '', position: '', startDate: '', endDate: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi thêm kinh nghiệm làm việc');
    }
  };

  const handleDeleteExp = async (index) => {
    if (!window.confirm('Xác nhận xóa kinh nghiệm này?')) return;
    const newExps = parsedWorkExp.filter((_, idx) => idx !== index);
    try {
      await axios.put(`http://localhost:5000/api/employees/${id}`, {
        workExperience: JSON.stringify(newExps)
      });
      toast.success('Đã xóa kinh nghiệm làm việc!');
      fetchData();
    } catch (err) {
      toast.error('Lỗi khi xóa kinh nghiệm');
    }
  };

  const handleApproveChangeRequest = async (requestId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/employees/change-requests/${requestId}/approve`);
      toast.success(res.data.message || 'Đã phê duyệt yêu cầu thay đổi hồ sơ!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi phê duyệt yêu cầu.');
    }
  };

  const handleRejectChangeRequest = async (requestId) => {
    const { value: reason } = await Swal.fire({
      title: 'Từ chối yêu cầu thay đổi?',
      input: 'textarea',
      inputLabel: 'Lý do từ chối (sẽ thông báo lại cho nhân viên):',
      inputPlaceholder: 'Ví dụ: Ảnh chụp CCCD bị mờ, thông tin STK không trùng tên...',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#ef4444'
    });

    if (reason !== undefined) {
      try {
        const res = await axios.put(`http://localhost:5000/api/employees/change-requests/${requestId}/reject`, {
          rejectReason: reason || 'Thông tin chưa chính xác hoặc thiếu tài liệu minh chứng.'
        });
        toast.success(res.data.message || 'Đã từ chối yêu cầu.');
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Lỗi khi từ chối yêu cầu.');
      }
    }
  };

  const FIELD_LABELS = {
    fullName: 'Họ và tên',
    gender: 'Giới tính',
    dateOfBirth: 'Ngày sinh',
    cccd: 'Số CCCD',
    cccdIssueDate: 'Ngày cấp CCCD',
    cccdExpiryDate: 'Ngày hết hạn CCCD',
    cccdIssuePlace: 'Nơi cấp CCCD',
    birthPlace: 'Nơi sinh',
    hometown: 'Quê quán',
    nationality: 'Quốc tịch',
    ethnicity: 'Dân tộc',
    maritalStatus: 'Tình trạng hôn nhân',
    permanentAddress: 'Địa chỉ thường trú',
    highestEducation: 'Trình độ học vấn',
    bankName: 'Ngân hàng thụ hưởng',
    bankBranch: 'Chi nhánh ngân hàng',
    bankAccount: 'Số tài khoản ngân hàng',
    bankAccountHolder: 'Tên chủ tài khoản',
    taxCode: 'Mã số thuế cá nhân (MST)',
    socialInsurance: 'Số sổ BHXH',
    healthInsurance: 'Số thẻ BHYT'
  };

  if (loading || !employee) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu hồ sơ...</div>;

  const pendingRequest = employee?.profileChangeRequests?.find(r => r.status === 'PENDING');
  let proposedData = {};
  if (pendingRequest) {
    try {
      proposedData = JSON.parse(pendingRequest.proposedData || '{}');
    } catch (e) {
      proposedData = {};
    }
  }

  const tabs = [
    { id: 'PERSONAL', label: 'Cá nhân & Định danh' },
    { id: 'WORK', label: 'Thông tin Công tác' },
    { id: 'CONTRACTS', label: 'Hợp đồng & Lương' },
    { id: 'ASSETS', label: 'Tài sản & Thiết bị' },
    { id: 'DECISIONS', label: 'Quyết định & Biến động' },
    { id: 'RELATIVES', label: 'Người thân & Phụ thuộc' },
    { id: 'EDUCATION', label: 'Học vấn & Bằng cấp' },
    { id: 'ATTACHMENTS', label: 'Hồ sơ & Đính kèm' }
  ];

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <ProfileHeader 
        employee={employee} 
        isEditMode={isEditMode} 
        onToggleEdit={() => setIsEditMode(!isEditMode)} 
        onSave={handleSave}
        onBack={() => navigate('/internal/employees/profiles')}
        calculateSeniority={calculateSeniority}
      />

      {/* Banner Yêu cầu cập nhật hồ sơ đang chờ duyệt từ nhân viên */}
      {pendingRequest && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#92400E' }}>
                  Yêu cầu thay đổi hồ sơ cá nhân đang chờ phê duyệt
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.825rem', color: '#B45309' }}>
                  Gửi lúc: {new Date(pendingRequest.createdAt).toLocaleString('vi-VN')} • Ghi chú: {pendingRequest.note || 'Không có'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleRejectChangeRequest(pendingRequest.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #FCA5A5',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ❌ Từ chối
              </button>
              <button
                onClick={() => handleApproveChangeRequest(pendingRequest.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                }}
              >
                ✅ Phê duyệt & Cập nhật
              </button>
            </div>
          </div>

          {/* Bảng so sánh các trường đề xuất thay đổi */}
          <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#FEF9C3', color: '#854D0E', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Trường dữ liệu</th>
                  <th style={{ padding: '10px 14px' }}>Dữ liệu hiện tại</th>
                  <th style={{ padding: '10px 14px', color: '#047857' }}>Dữ liệu đề xuất mới</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(proposedData).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '12px', textAlign: 'center', color: '#9CA3AF' }}>Không có dữ liệu chi tiết</td>
                  </tr>
                ) : (
                  Object.entries(proposedData).map(([key, newVal]) => {
                    const label = FIELD_LABELS[key] || key;
                    const oldVal = employee?.[key];
                    const formatVal = (v) => {
                      if (!v) return '—';
                      if (v instanceof Date) return new Date(v).toLocaleDateString('vi-VN');
                      return String(v);
                    };
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #FEF3C7' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1F2937' }}>{label}</td>
                        <td style={{ padding: '10px 14px', color: '#6B7280' }}>{formatVal(oldVal)}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5' }}>
                          {formatVal(newVal)}
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

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Horizontal Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '18px 26px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#334155'; }}
              onMouseOut={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#64748b'; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: '36px' }}>
          
          {/* ======================================================== */}
          {/* TAB 1: CÁ NHÂN & ĐỊNH DANH                               */}
          {/* ======================================================== */}
          {activeTab === 'PERSONAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px' }}>
                
                {/* Cột trái: Hồ sơ nhân thân & Giấy tờ định danh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={20} color="#3b82f6" /> Hồ sơ nhân thân
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <InfoField label="Họ và Tên" value={employee.fullName} isEditMode={isEditMode} onChange={(v) => handleChange('fullName', v)} required />
                    <InfoField label="Giới tính" value={employee.gender} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('gender', v)} options={[{value:'MALE',label:'Nam'},{value:'FEMALE',label:'Nữ'},{value:'OTHER',label:'Khác'}]} />
                    <InfoField label="Ngày sinh" value={employee.dateOfBirth} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('dateOfBirth', v)} />
                    <InfoField label="Quốc tịch" value={employee.nationality || 'Việt Nam'} isEditMode={isEditMode} onChange={(v) => handleChange('nationality', v)} />
                    <InfoField label="Dân tộc" value={employee.ethnicity || 'Kinh'} isEditMode={isEditMode} onChange={(v) => handleChange('ethnicity', v)} />
                    <InfoField label="Tình trạng hôn nhân" value={employee.maritalStatus} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('maritalStatus', v)} options={[{value:'SINGLE',label:'Độc thân'},{value:'MARRIED',label:'Đã kết hôn'},{value:'DIVORCED',label:'Ly hôn'}]} />
                    <InfoField label="Nơi sinh" value={employee.birthPlace} isEditMode={isEditMode} onChange={(v) => handleChange('birthPlace', v)} />
                    <InfoField label="Quê quán" value={employee.hometown} isEditMode={isEditMode} onChange={(v) => handleChange('hometown', v)} />
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={20} color="#3b82f6" /> Căn cước công dân (CCCD)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <InfoField label="Số Căn cước công dân" value={employee.cccd} isEditMode={isEditMode} onChange={(v) => handleChange('cccd', v)} />
                    </div>
                    <InfoField label="Ngày cấp" value={employee.cccdIssueDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('cccdIssueDate', v)} />
                    <InfoField label="Ngày hết hạn" value={employee.cccdExpiryDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('cccdExpiryDate', v)} />
                    <div style={{ gridColumn: 'span 2' }}>
                      <InfoField label="Nơi cấp" value={employee.cccdIssuePlace || 'Cục Cảnh sát QLHC về TTXH'} isEditMode={isEditMode} onChange={(v) => handleChange('cccdIssuePlace', v)} />
                    </div>
                  </div>
                </div>
                
                {/* Cột phải: Địa chỉ & Liên hệ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={20} color="#f59e0b" /> Địa chỉ cư trú
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InfoField label="Địa chỉ thường trú" value={employee.permanentAddress || employee.address} isEditMode={isEditMode} onChange={(v) => handleChange('permanentAddress', v)} />
                    <InfoField label="Nơi ở hiện tại" value={employee.currentAddress || employee.temporaryAddress} isEditMode={isEditMode} onChange={(v) => handleChange('currentAddress', v)} />
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={20} color="#3b82f6" /> Thông tin liên hệ công việc
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <InfoField label="Số điện thoại di động" value={employee.phone} isEditMode={isEditMode} onChange={(v) => handleChange('phone', v)} />
                    <InfoField label="Email công việc" value={employee.email} type="email" isEditMode={isEditMode} onChange={(v) => handleChange('email', v)} />
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '12px 0 0 0' }}>
                    Liên hệ trong trường hợp khẩn cấp
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', backgroundColor: '#fff7ed', padding: '20px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                    <InfoField label="Họ tên người liên hệ" value={employee.emergencyContactName} isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactName', v)} />
                    <InfoField label="Mối quan hệ" value={employee.emergencyContactRelation} isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactRelation', v)} />
                    <div style={{ gridColumn: 'span 2' }}>
                      <InfoField label="Số điện thoại khẩn cấp" value={employee.emergencyContactPhone} isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactPhone', v)} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: THÔNG TIN CÔNG TÁC (TÁCH BIỆT LEVEL & CHỨC VỤ QUẢN LÝ) */}
          {/* ======================================================== */}
          {activeTab === 'WORK' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Thông tin Bổ nhiệm & Vị trí công tác
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Mã Nhân Viên" value={employee.code} isEditMode={isEditMode} onChange={(v) => handleChange('code', v)} required />
                  <InfoField label="Công ty / Pháp nhân" value="Công ty TNHH LLA" isEditMode={false} />
                  <InfoField label="Phòng ban trực thuộc" value={employee.departmentId} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('departmentId', v)} options={departments} />
                  <InfoField label="Vị trí / Chức danh công việc" value={employee.positionId} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('positionId', v)} options={positions} />
                  
                  {/* TÁCH BẠCH 2 KHÁI NIỆM: LEVEL VÀ CHỨC VỤ QUẢN LÝ */}
                  <InfoField 
                    label="Cấp bậc chuyên môn (Level)" 
                    value={employee.position?.level || 'Junior'} 
                    isEditMode={false} 
                    helperText="Cấp độ năng lực chuyên môn: Intern → Fresher → Junior → Middle → Senior → Lead → Expert"
                  />
                  <InfoField 
                    label="Chức vụ quản lý" 
                    value={employee.managementRole || 'STAFF'} 
                    type="select" 
                    isEditMode={isEditMode} 
                    onChange={(v) => handleChange('managementRole', v)} 
                    options={managementRolesList}
                    helperText="Chức vụ quản lý hành chính trong sơ đồ tổ chức"
                  />
                  
                  {/* QUẢN LÝ TRỰC TIẾP */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <InfoField 
                      label="Người quản lý trực tiếp (Direct Manager)" 
                      value={employee.managerId} 
                      type="select" 
                      isEditMode={isEditMode} 
                      onChange={(v) => handleChange('managerId', v)} 
                      options={allEmployees.filter(e => e.id !== id).map(e => ({ id: e.id, value: e.id, label: `${e.code} - ${e.fullName} (${e.position?.title || 'Nhân sự'})` }))}
                      helperText="Người chịu trách nhiệm phân công mục tiêu, duyệt phép và đánh giá KPI"
                    />
                  </div>

                  <InfoField 
                    label="Địa điểm làm việc / Chi nhánh" 
                    value={employee.workLocation || 'Trụ sở chính'} 
                    type="select" 
                    isEditMode={isEditMode} 
                    onChange={(v) => handleChange('workLocation', v)} 
                    options={[
                      { value: 'Trụ sở chính', label: 'Trụ sở chính - Hà Nội' },
                      { value: 'Chi nhánh TP.HCM', label: 'Chi nhánh TP. Hồ Chí Minh' },
                      { value: 'Chi nhánh Đà Nẵng', label: 'Chi nhánh Đà Nẵng' },
                      { value: 'Remote', label: 'Làm việc từ xa (Remote WFM)' }
                    ]}
                  />
                  <InfoField 
                    label="Loại hình lao động" 
                    value={employee.employmentType || 'FULL_TIME'} 
                    type="select" 
                    isEditMode={isEditMode} 
                    onChange={(v) => handleChange('employmentType', v)} 
                    options={employmentTypesList}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Vòng đời Nhân sự & Trạng thái làm việc
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Ngày bắt đầu vào làm" value={employee.joinDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('joinDate', v)} required />
                  <InfoField label="Trạng thái làm việc" value={employee.status} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('status', v)} options={employeeStatusOptions} />
                  <InfoField label="Ngày bắt đầu thử việc" value={employee.probationStartDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('probationStartDate', v)} />
                  <InfoField label="Ngày kết thúc thử việc" value={employee.probationEndDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('probationEndDate', v)} />
                  <InfoField label="Ngày ký HĐLĐ chính thức" value={employee.officialJoinDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('officialJoinDate', v)} />
                  <InfoField label="Thâm niên công tác" value={calculateSeniority(employee.joinDate)} isEditMode={false} />
                  
                  {employee.status === 'RESIGNED' && (
                    <>
                      <InfoField label="Ngày nghỉ việc" value={employee.resignationDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('resignationDate', v)} />
                      <div style={{ gridColumn: 'span 2' }}>
                        <InfoField label="Lý do thôi việc" value={employee.resignationReason} isEditMode={isEditMode} onChange={(v) => handleChange('resignationReason', v)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: HỢP ĐỒNG & CẤU PHẦN LƯƠNG (BHXH, PHỤ CẤP, HÌNH THỨC TRẢ) */}
          {/* ======================================================== */}
          {activeTab === 'CONTRACTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0' }}>
                  Thông tin Tài chính, Ngân hàng & Thuế / BHXH
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <InfoField label="Ngân hàng thụ hưởng" value={employee.bankName} isEditMode={isEditMode} onChange={(v) => handleChange('bankName', v)} helperText="VD: Vietcombank, Techcombank..." />
                  <InfoField label="Chi nhánh ngân hàng" value={employee.bankBranch} isEditMode={isEditMode} onChange={(v) => handleChange('bankBranch', v)} helperText="VD: Chi nhánh Thăng Long" />
                  <InfoField label="Số tài khoản ngân hàng" value={employee.bankAccount} isEditMode={isEditMode} onChange={(v) => handleChange('bankAccount', v)} />
                  <InfoField label="Tên chủ tài khoản" value={employee.bankAccountHolder || employee.fullName} isEditMode={isEditMode} onChange={(v) => handleChange('bankAccountHolder', v)} />
                  
                  <InfoField label="Mã số thuế cá nhân (MST)" value={employee.taxCode} isEditMode={isEditMode} onChange={(v) => handleChange('taxCode', v)} helperText="Theo quy định mới mã số định danh / MST" />
                  <InfoField label="Số sổ BHXH" value={employee.socialInsurance} isEditMode={isEditMode} onChange={(v) => handleChange('socialInsurance', v)} />
                  <InfoField label="Số thẻ BHYT" value={employee.healthInsurance} isEditMode={isEditMode} onChange={(v) => handleChange('healthInsurance', v)} />
                  <InfoField label="Hình thức chi trả lương" value="Chuyển khoản (Bank Transfer)" isEditMode={false} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={20} color="#3b82f6" /> Danh sách Hợp đồng lao động & Cấu phần lương
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Quản lý chi tiết: Lương cơ bản, Phụ cấp, Lương đóng BHXH, Người ký, Địa điểm và File scan hợp đồng gốc
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAddContractModal(true)} 
                    style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(59,130,246,0.25)' }}
                  >
                    <Plus size={16}/> Thêm hợp đồng mới
                  </button>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '14px 16px', fontWeight: '600' }}>Số & Loại HĐ</th>
                        <th style={{ padding: '14px 16px', fontWeight: '600' }}>Cấu phần Lương</th>
                        <th style={{ padding: '14px 16px', fontWeight: '600' }}>Thời hạn HĐ</th>
                        <th style={{ padding: '14px 16px', fontWeight: '600' }}>Người ký & Nơi làm việc</th>
                        <th style={{ padding: '14px 16px', fontWeight: '600' }}>Trạng thái</th>
                        <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'center' }}>Bản scan HĐ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.contracts && employee.contracts.length > 0 ? (
                        employee.contracts.map(c => (
                          <tr key={c.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                                {c.contractNumber || 'HĐLĐ-LLA'}
                              </div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                {getContractTypeName(c.contractType)}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700, color: '#16a34a' }}>
                                Lương CB: {Number(c.baseSalary).toLocaleString('vi-VN')} đ
                              </div>
                              {c.allowance && Number(c.allowance) > 0 && (
                                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                  Phụ cấp: +{Number(c.allowance).toLocaleString('vi-VN')} đ
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Đóng BHXH: {Number(c.insuranceSalary || c.baseSalary).toLocaleString('vi-VN')} đ
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#475569' }}>
                              <div>Từ: <strong>{new Date(c.startDate).toLocaleDateString('vi-VN')}</strong></div>
                              <div>Đến: <strong>{c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</strong></div>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>
                              <div>Ký bởi: <strong>{c.signBy || 'Ban Giám Đốc'}</strong></div>
                              <div>Địa điểm: {c.workLocation || 'Trụ sở chính'}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {getContractStatusBadge(c.status, c.endDate)}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              {(() => {
                                const files = parseContractFiles(c.fileUrl);
                                return files.length > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <button
                                      onClick={() => setViewingContractFile({
                                        contractId: c.id,
                                        urls: files,
                                        currentIndex: 0,
                                        title: `${c.contractNumber || getContractTypeName(c.contractType)} - ${employee.fullName}`
                                      })}
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                      <Eye size={14} /> Xem {files.length} trang
                                    </button>
                                    <label style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px dashed #bfdbfe', backgroundColor: '#f8fafc' }}>
                                      <Plus size={14} /> Thêm
                                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(c.id, e.target.files, true)} />
                                    </label>
                                  </div>
                                ) : (
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#f8fafc', color: '#3b82f6', border: '1px dashed #93c5fd', borderRadius: '6px', cursor: 'pointer' }}>
                                    <Upload size={14} /> Tải ảnh scan
                                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(c.id, e.target.files, false)} />
                                  </label>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Chưa có hợp đồng nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: TÀI SẢN & THIẾT BỊ                                */}
          {/* ======================================================== */}
          {activeTab === 'ASSETS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Laptop size={20} color="#3b82f6" /> Danh mục Tài sản & Thiết bị cấp phát
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Theo dõi Laptop, màn hình, thẻ ra vào và thiết bị làm việc của nhân sự
                </p>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Mã Tài Sản</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Tên Thiết Bị</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Loại</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Ngày Cấp</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Trạng Thái</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Tình Trạng & Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.assetAssignments && employee.assetAssignments.length > 0 ? (
                      employee.assetAssignments.map(a => (
                        <tr key={a.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                            {a.asset?.code || '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                            {a.asset?.name || 'Thiết bị làm việc'}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>
                            {a.asset?.type || 'IT Equipment'}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>
                            {a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {a.status === 'ACTIVE' ? (
                              <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Đang sử dụng
                              </span>
                            ) : a.status === 'RETURNED' ? (
                              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                Đã hoàn trả
                              </span>
                            ) : (
                              <span style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {a.status}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                            {a.notes || a.asset?.specifications || 'Bàn giao đầy đủ phụ kiện'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                          <Laptop size={36} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                          Chưa có tài sản nào được cấp phát cho nhân sự này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: QUYẾT ĐỊNH & BIẾN ĐỘNG                            */}
          {/* ======================================================== */}
          {activeTab === 'DECISIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSignature size={20} color="#3b82f6" /> Lịch sử Quyết định Nhân sự ban hành
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Văn bản pháp lý chính thức điều chỉnh mức lương, bổ nhiệm chức vụ, điều chuyển phòng ban và khen thưởng kỷ luật
                </p>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Số Quyết Định</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Loại Quyết Định</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Trích Yếu</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Nội Dung Biến Động</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Ngày Hiệu Lực</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.decisions && employee.decisions.length > 0 ? (
                      employee.decisions.map(d => (
                        <tr key={d.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                            {d.decisionNumber}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                              {d.type === 'SALARY_ADJUSTMENT' ? 'Điều chỉnh lương' :
                               d.type === 'PROMOTION' ? 'Bổ nhiệm chức vụ' :
                               d.type === 'TRANSFER' ? 'Điều chuyển' :
                               d.type === 'TERMINATION' ? 'Thôi việc' :
                               d.type === 'REWARD' ? 'Khen thưởng' :
                               d.type === 'DISCIPLINE' ? 'Kỷ luật' : d.type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{d.title}</td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>
                            {d.type === 'SALARY_ADJUSTMENT' && d.newSalary ? (
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                Lương mới: {Number(d.newSalary).toLocaleString('vi-VN')} đ/tháng
                              </span>
                            ) : d.type === 'PROMOTION' && d.newPosition ? (
                              <span>Vị trí mới: <strong>{d.newPosition.title}</strong></span>
                            ) : d.type === 'TRANSFER' && d.newDepartment ? (
                              <span>Phòng ban mới: <strong>{d.newDepartment.name}</strong></span>
                            ) : (
                              <span>{d.reason || 'Theo quy chế nội bộ'}</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>
                            {d.effectiveDate ? new Date(d.effectiveDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {d.status === 'APPROVED' ? (
                              <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Đã ban hành
                              </span>
                            ) : (
                              <span style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {d.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Chưa có quyết định nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: NGƯỜI THÂN & PHỤ THUỘC                            */}
          {/* ======================================================== */}
          {activeTab === 'RELATIVES' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} color="#3b82f6" /> Người thân & Người phụ thuộc
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Quản lý thông tin thân nhân, người phụ thuộc và thời hạn giảm trừ gia cảnh
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddRelativeModal(true)} 
                  style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16}/> Thêm người phụ thuộc
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Họ và tên</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Quan hệ</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>CCCD / Mã định danh</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Mã số thuế</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Thời gian giảm trừ</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600' }}>Hồ sơ chứng minh</th>
                      <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.relatives && employee.relatives.length > 0 ? (
                      employee.relatives.map(r => (
                        <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                            {r.fullName}
                            {r.dateOfBirth && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Sinh: {new Date(r.dateOfBirth).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>{r.relation}</td>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#2563eb' }}>{r.cccd || '—'}</td>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#475569' }}>{r.taxCode || '—'}</td>
                          <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.825rem' }}>
                            {r.isDependent ? (
                              <div>
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>Từ: {r.taxDeductionStart ? new Date(r.taxDeductionStart).toLocaleDateString('vi-VN') : 'Khi bắt đầu'}</span>
                                {r.taxDeductionEnd && <div>Đến: {new Date(r.taxDeductionEnd).toLocaleDateString('vi-VN')}</div>}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Không đăng ký giảm trừ</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.825rem' }}>
                            {r.proofDocument || 'Giấy khai sinh'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleDeleteRelative(r.id)} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Chưa có bản ghi người thân / người phụ thuộc.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* ======================================================== */}
          {/* TAB 7: HỌC VẤN & KINH NGHIỆM LÀM VIỆC TRƯỚC ĐÂY           */}
          {/* ======================================================== */}
          {activeTab === 'EDUCATION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              
              {/* Trình độ cao nhất */}
              <div style={{ backgroundColor: '#f8fafc', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Trình độ đào tạo cao nhất
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Căn cứ xếp ngạch lương và quy hoạch cán bộ nguồn
                  </p>
                </div>
                <div style={{ minWidth: 200 }}>
                  <InfoField 
                    label="" 
                    value={employee.highestEducation || 'Đại học'} 
                    type="select" 
                    isEditMode={isEditMode} 
                    onChange={(v) => handleChange('highestEducation', v)} 
                    options={[
                      { value: 'Tiến sĩ', label: 'Tiến sĩ' },
                      { value: 'Thạc sĩ', label: 'Thạc sĩ' },
                      { value: 'Đại học', label: 'Đại học' },
                      { value: 'Cao đẳng', label: 'Cao đẳng' },
                      { value: 'Trung cấp', label: 'Trung cấp' },
                      { value: 'Chứng chỉ nghề', label: 'Chứng chỉ nghề' }
                    ]}
                  />
                </div>
              </div>

              {/* Bằng cấp */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={20} color="#3b82f6" /> Danh sách Bằng cấp chính quy (Degrees)
                  </h3>
                  <button 
                    onClick={() => setShowAddDegreeModal(true)} 
                    style={{ padding: '6px 14px', fontSize: '0.825rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14}/> Thêm bằng cấp
                  </button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Tên Bằng cấp</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Chuyên ngành</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Cơ sở đào tạo</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Năm TN</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Xếp loại</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Bản scan / Ảnh</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.degrees && employee.degrees.length > 0 ? (
                        employee.degrees.map(d => (
                          <tr key={d.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{d.degreeName}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{d.major}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{d.institution}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#3b82f6' }}>{d.gradYear || '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {d.classification || 'Khá'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {d.fileUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal({ title: `Bằng: ${d.degreeName} - ${d.major}`, url: d.fileUrl })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Eye size={12} /> Xem ảnh bằng
                                </button>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Chưa có scan</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button onClick={() => handleDeleteDegree(d.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu bằng cấp.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chứng chỉ nghề nghiệp */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} color="#3b82f6" /> Chứng chỉ nghề nghiệp & Thời hạn hiệu lực
                  </h3>
                  <button 
                    onClick={() => setShowAddCertModal(true)} 
                    style={{ padding: '6px 14px', fontSize: '0.825rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14}/> Thêm chứng chỉ
                  </button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Tên Chứng chỉ</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Đơn vị cấp</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Ngày cấp</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Thời hạn hiệu lực</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Bản scan / Ảnh</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.certificates && employee.certificates.length > 0 ? (
                        employee.certificates.map(c => (
                          <tr key={c.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{c.issuedBy}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>
                              {c.issueDate ? new Date(c.issueDate).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {c.expiryDate ? (
                                <span style={{ color: new Date(c.expiryDate) < new Date() ? '#ef4444' : '#16a34a', fontWeight: 600, fontSize: '0.825rem' }}>
                                  Hết hạn: {new Date(c.expiryDate).toLocaleDateString('vi-VN')}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '0.825rem' }}>Vô thời hạn</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {c.fileUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal({ title: `Chứng chỉ: ${c.name} (${c.issuedBy})`, url: c.fileUrl })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    backgroundColor: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Eye size={12} /> Xem chứng chỉ
                                </button>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Chưa có scan</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button onClick={() => handleDeleteCert(c.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa có chứng chỉ nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kinh nghiệm làm việc trước đây */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={20} color="#3b82f6" /> Lịch sử Kinh nghiệm làm việc trước đây
                  </h3>
                  <button 
                    onClick={() => setShowAddExpModal(true)} 
                    style={{ padding: '6px 14px', fontSize: '0.825rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14}/> Thêm kinh nghiệm
                  </button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Đơn vị / Công ty cũ</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Vị trí / Chức vụ</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Thời gian công tác</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Mô tả nhiệm vụ</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedWorkExp && parsedWorkExp.length > 0 ? (
                        parsedWorkExp.map((w, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{w.company}</td>
                            <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 500 }}>{w.position}</td>
                            <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.825rem' }}>
                              {w.startDate} - {w.endDate || 'Hiện tại'}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>{w.description || '—'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button onClick={() => handleDeleteExp(idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa ghi nhận kinh nghiệm làm việc trước đây.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: HỒ SƠ ĐÍNH KÈM (CV, GIẤY KSK, NDA)               */}
          {/* ======================================================== */}
          {activeTab === 'ATTACHMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={20} color="#3b82f6" /> Danh mục Hồ sơ Pháp lý & Tài liệu nhân sự lưu trữ
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Quản lý hồ sơ đầu vào: Sơ yếu lý lịch, Giấy khám sức khỏe, Cam kết bảo mật thông tin (NDA)
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* 1. CV */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>CV / Sơ yếu lý lịch</h4>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Đã tiếp nhận khi tuyển dụng</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 16px 0' }}>Bản hồ sơ ứng tuyển chính thức của ứng viên.</p>
                  <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Đã thẩm định
                  </span>
                </div>

                {/* 2. Giấy khám sức khỏe */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Giấy khám sức khỏe</h4>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Còn hạn hiệu lực (Loại I)</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 16px 0' }}>Chứng nhận sức khỏe theo Thông tư 14/2013/TT-BYT.</p>
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Đạt tiêu chuẩn
                  </span>
                </div>

                {/* 3. Cam kết bảo mật NDA */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                      <Shield size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Cam kết bảo mật (NDA)</h4>
                      <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>✓ Đã ký kết song phương</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 16px 0' }}>Bản thỏa thuận bảo mật dữ liệu doanh nghiệp và sở hữu trí tuệ.</p>
                  <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Có hiệu lực pháp lý
                  </span>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM HỢP ĐỒNG MỚI (CẤU PHẦN LƯƠNG & BLLĐ 2019)  */}
      {/* ======================================================== */}
      {showAddContractModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '640px', maxWidth: '100%', maxHeight: '92vh', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> Tạo Hợp đồng Lao động Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Nhân sự: <strong>{employee?.fullName}</strong> ({employee?.code})
                </p>
              </div>
              <button onClick={() => setShowAddContractModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateContract} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Số hiệu hợp đồng</label>
                  <input
                    type="text"
                    placeholder="VD: HĐLĐ-2026/012/LLA"
                    value={newContractForm.contractNumber}
                    onChange={(e) => setNewContractForm({ ...newContractForm, contractNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Loại Hợp đồng *</label>
                  <select
                    required
                    value={newContractForm.contractType}
                    onChange={(e) => setNewContractForm({ ...newContractForm, contractType: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  >
                    <option value="PROBATION">Thử việc (Tối đa 60 ngày - BLLĐ 2019)</option>
                    <option value="INTERNSHIP">Thực tập sinh (Internship)</option>
                    <option value="OFFICIAL_1Y">Xác định thời hạn (1 năm)</option>
                    <option value="INDEFINITE">Không xác định thời hạn</option>
                  </select>
                </div>
              </div>

              {/* TÁCH CẤU PHẦN LƯƠNG */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  Cấu phần Lương & Đóng BHXH
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lương cơ bản thỏa thuận (đ/tháng) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100000"
                      placeholder="VD: 15000000"
                      value={newContractForm.baseSalary}
                      onChange={(e) => setNewContractForm({ ...newContractForm, baseSalary: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phụ cấp (Cơm, Xăng, Trách nhiệm...)</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      placeholder="VD: 1500000"
                      value={newContractForm.allowance}
                      onChange={(e) => setNewContractForm({ ...newContractForm, allowance: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mức lương đóng BHXH</label>
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="Mặc định = Lương cơ bản"
                      value={newContractForm.insuranceSalary}
                      onChange={(e) => setNewContractForm({ ...newContractForm, insuranceSalary: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Hình thức chi trả</label>
                    <select
                      value={newContractForm.paymentMethod}
                      onChange={(e) => setNewContractForm({ ...newContractForm, paymentMethod: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                    >
                      <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                      <option value="CASH">Tiền mặt</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày bắt đầu hiệu lực *</label>
                  <input
                    type="date"
                    required
                    value={newContractForm.startDate}
                    onChange={(e) => setNewContractForm({ ...newContractForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày hết hạn (Nếu có)</label>
                  <input
                    type="date"
                    value={newContractForm.endDate}
                    onChange={(e) => setNewContractForm({ ...newContractForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Đại diện NSDLĐ ký</label>
                  <input
                    type="text"
                    value={newContractForm.signBy}
                    onChange={(e) => setNewContractForm({ ...newContractForm, signBy: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Địa điểm làm việc theo HĐ</label>
                  <input
                    type="text"
                    value={newContractForm.workLocation}
                    onChange={(e) => setNewContractForm({ ...newContractForm, workLocation: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ghi chú phụ lục hợp đồng (nếu có)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú điều khoản bổ sung hoặc số phụ lục..."
                  value={newContractForm.appendixNote}
                  onChange={(e) => setNewContractForm({ ...newContractForm, appendixNote: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowAddContractModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContract}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}
                >
                  {isSubmittingContract ? 'Đang tạo...' : 'Ký & Ban hành HĐ'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THÊM NGƯỜI PHỤ THUỘC (THUẾ TNCN, CCCD, HỒ SƠ)   */}
      {/* ======================================================== */}
      {showAddRelativeModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '560px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Khai báo Người thân & Người phụ thuộc (Thuế TNCN)
              </h3>
              <button onClick={() => setShowAddRelativeModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRelative} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={relativeForm.fullName}
                    onChange={(e) => setRelativeForm({ ...relativeForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mối quan hệ *</label>
                  <select
                    value={relativeForm.relation}
                    onChange={(e) => setRelativeForm({ ...relativeForm, relation: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  >
                    <option value="Con">Con ruột / Con nuôi</option>
                    <option value="Vợ/Chồng">Vợ / Chồng</option>
                    <option value="Bố/Mẹ">Bố / Mẹ</option>
                    <option value="Khác">Người phụ thuộc khác</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày sinh</label>
                  <input
                    type="date"
                    value={relativeForm.dateOfBirth}
                    onChange={(e) => setRelativeForm({ ...relativeForm, dateOfBirth: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Số CCCD / Định danh</label>
                  <input
                    type="text"
                    placeholder="12 số hoặc mã ĐD cá nhân"
                    value={relativeForm.cccd}
                    onChange={(e) => setRelativeForm({ ...relativeForm, cccd: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mã số thuế người phụ thuộc</label>
                  <input
                    type="text"
                    value={relativeForm.taxCode}
                    onChange={(e) => setRelativeForm({ ...relativeForm, taxCode: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Hồ sơ chứng minh</label>
                  <input
                    type="text"
                    placeholder="VD: Giấy khai sinh, Sổ hộ khẩu..."
                    value={relativeForm.proofDocument}
                    onChange={(e) => setRelativeForm({ ...relativeForm, proofDocument: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Bắt đầu giảm trừ</label>
                  <input
                    type="date"
                    value={relativeForm.taxDeductionStart}
                    onChange={(e) => setRelativeForm({ ...relativeForm, taxDeductionStart: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Kết thúc giảm trừ (nếu có)</label>
                  <input
                    type="date"
                    value={relativeForm.taxDeductionEnd}
                    onChange={(e) => setRelativeForm({ ...relativeForm, taxDeductionEnd: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="isDepCheck"
                  checked={relativeForm.isDependent}
                  onChange={(e) => setRelativeForm({ ...relativeForm, isDependent: e.target.checked })}
                />
                <label htmlFor="isDepCheck" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Đăng ký tính người phụ thuộc giảm trừ gia cảnh thuế TNCN
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddRelativeModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600 }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600 }}>Lưu hồ sơ</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 3: THÊM BẰNG CẤP                                   */}
      {/* ======================================================== */}
      {showAddDegreeModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '500px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Khai báo Bằng cấp chính quy</h3>
              <button onClick={() => setShowAddDegreeModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDegree} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tên Bằng cấp *</label>
                <input type="text" required placeholder="VD: Cử nhân, Kỹ sư, Thạc sĩ..." value={degreeForm.degreeName} onChange={e => setDegreeForm({ ...degreeForm, degreeName: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Chuyên ngành đào tạo *</label>
                <input type="text" required placeholder="VD: Khoa học máy tính, Kế toán..." value={degreeForm.major} onChange={e => setDegreeForm({ ...degreeForm, major: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Cơ sở / Trường đào tạo *</label>
                <input type="text" required placeholder="VD: Đại học Bách Khoa..." value={degreeForm.institution} onChange={e => setDegreeForm({ ...degreeForm, institution: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Năm tốt nghiệp</label>
                  <input type="number" min="1980" max="2040" value={degreeForm.gradYear} onChange={e => setDegreeForm({ ...degreeForm, gradYear: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Xếp loại tốt nghiệp</label>
                  <select value={degreeForm.classification} onChange={e => setDegreeForm({ ...degreeForm, classification: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}>
                    <option value="Xuất sắc">Xuất sắc</option>
                    <option value="Giỏi">Giỏi</option>
                    <option value="Khá">Khá</option>
                    <option value="Trung bình">Trung bình</option>
                  </select>
                </div>
              </div>

              {/* Upload ảnh bằng cấp */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Ảnh chụp / Scan bằng tốt nghiệp (Tùy chọn)
                </label>
                {degreeForm.fileUrl ? (
                  <div style={{ position: 'relative', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={degreeForm.fileUrl} 
                      alt="Scan bằng cấp" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block' }}>Đã đính kèm ảnh bằng</span>
                      <button
                        type="button"
                        onClick={() => setDegreeForm(prev => ({ ...prev, fileUrl: '' }))}
                        style={{ fontSize: '0.78rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '3px' }}
                      >
                        Xóa & Chọn ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px', border: '2px dashed #CBD5E1', borderRadius: '8px', backgroundColor: '#F8FAFC', cursor: 'pointer', gap: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563EB' }}>Chọn ảnh scan hoặc tài liệu</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>PNG, JPG, PDF (Tối đa 10MB)</span>
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleDegreeCertFileUpload(e, (base64) => setDegreeForm(prev => ({ ...prev, fileUrl: base64 })))} />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddDegreeModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600 }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600 }}>Lưu bằng cấp</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 4: THÊM CHỨNG CHỈ NGHỀ NGHIỆP                      */}
      {/* ======================================================== */}
      {showAddCertModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '500px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Khai báo Chứng chỉ nghề nghiệp</h3>
              <button onClick={() => setShowAddCertModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCert} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tên Chứng chỉ *</label>
                <input type="text" required placeholder="VD: AWS Certified, PMP, IELTS..." value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Đơn vị cấp *</label>
                <input type="text" required placeholder="VD: Amazon Web Services, PMI..." value={certForm.issuedBy} onChange={e => setCertForm({ ...certForm, issuedBy: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày cấp</label>
                  <input type="date" value={certForm.issueDate} onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày hết hạn (Nếu có)</label>
                  <input type="date" value={certForm.expiryDate} onChange={e => setCertForm({ ...certForm, expiryDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

              {/* Upload ảnh chứng chỉ */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Ảnh chụp / Scan chứng chỉ (Tùy chọn)
                </label>
                {certForm.fileUrl ? (
                  <div style={{ position: 'relative', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={certForm.fileUrl} 
                      alt="Scan chứng chỉ" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block' }}>Đã đính kèm ảnh chứng chỉ</span>
                      <button
                        type="button"
                        onClick={() => setCertForm(prev => ({ ...prev, fileUrl: '' }))}
                        style={{ fontSize: '0.78rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '3px' }}
                      >
                        Xóa & Chọn ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px', border: '2px dashed #CBD5E1', borderRadius: '8px', backgroundColor: '#F8FAFC', cursor: 'pointer', gap: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563EB' }}>Chọn ảnh chứng chỉ hoặc scan</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>PNG, JPG, PDF (Tối đa 10MB)</span>
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleDegreeCertFileUpload(e, (base64) => setCertForm(prev => ({ ...prev, fileUrl: base64 })))} />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddCertModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600 }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600 }}>Lưu chứng chỉ</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 5: THÊM KINH NGHIỆM LÀM VIỆC TRƯỚC ĐÂY              */}
      {/* ======================================================== */}
      {showAddExpModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '520px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Khai báo Kinh nghiệm làm việc</h3>
              <button onClick={() => setShowAddExpModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddExp} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tên Công ty / Đơn vị cũ *</label>
                <input type="text" required placeholder="VD: Tập đoàn Viettel, FPT Software..." value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Vị trí / Chức danh từng đảm nhiệm *</label>
                <input type="text" required placeholder="VD: Senior React Developer, Trưởng nhóm..." value={expForm.position} onChange={e => setExpForm({ ...expForm, position: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Từ thời gian</label>
                  <input type="text" placeholder="VD: 03/2022" value={expForm.startDate} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Đến thời gian</label>
                  <input type="text" placeholder="VD: 09/2025" value={expForm.endDate} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mô tả trách nhiệm & thành tích</label>
                <textarea rows={3} placeholder="Mô tả tóm tắt kinh nghiệm chuyên môn..." value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddExpModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600 }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600 }}>Lưu kinh nghiệm</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 6: XEM NHIỀU TRANG SCAN HỢP ĐỒNG PHÓNG TO          */}
      {/* ======================================================== */}
      {viewingContractFile && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '24px' }}>
          <div style={{ width: '920px', maxWidth: '100%', maxHeight: '94vh', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> {viewingContractFile.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Trang {viewingContractFile.currentIndex + 1} / {viewingContractFile.urls.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={14} /> Thêm trang
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(viewingContractFile.contractId, e.target.files, true)} />
                </label>
                <button
                  onClick={() => handleDeleteContractPage(viewingContractFile.contractId, viewingContractFile.currentIndex)}
                  style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="Xóa trang hiện tại"
                >
                  <Trash2 size={14} /> Xóa trang
                </button>
                <a
                  href={viewingContractFile.urls[viewingContractFile.currentIndex]}
                  download={`hop-dong-trang-${viewingContractFile.currentIndex + 1}.png`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <ExternalLink size={14} /> Mở tab mới
                </a>
                <button
                  onClick={() => setViewingContractFile(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', position: 'relative' }}>
              {viewingContractFile.urls.length > 1 && (
                <>
                  <button
                    disabled={viewingContractFile.currentIndex === 0}
                    onClick={() => setViewingContractFile({ ...viewingContractFile, currentIndex: Math.max(0, viewingContractFile.currentIndex - 1) })}
                    style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: viewingContractFile.currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: viewingContractFile.currentIndex === 0 ? 0.3 : 1, transition: 'all 0.2s', zIndex: 10 }}
                    title="Trang trước"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    disabled={viewingContractFile.currentIndex === viewingContractFile.urls.length - 1}
                    onClick={() => setViewingContractFile({ ...viewingContractFile, currentIndex: Math.min(viewingContractFile.urls.length - 1, viewingContractFile.currentIndex + 1) })}
                    style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: viewingContractFile.currentIndex === viewingContractFile.urls.length - 1 ? 'not-allowed' : 'pointer', opacity: viewingContractFile.currentIndex === viewingContractFile.urls.length - 1 ? 0.3 : 1, transition: 'all 0.2s', zIndex: 10 }}
                    title="Trang sau"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              <img
                src={viewingContractFile.urls[viewingContractFile.currentIndex]}
                alt={`Hợp đồng trang ${viewingContractFile.currentIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '66vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
              />
            </div>

            {viewingContractFile.urls.length > 1 && (
              <div style={{ padding: '12px 24px', backgroundColor: '#1e293b', display: 'flex', gap: '10px', overflowX: 'auto', borderTop: '1px solid #334155' }}>
                {viewingContractFile.urls.map((u, idx) => (
                  <div
                    key={idx}
                    onClick={() => setViewingContractFile({ ...viewingContractFile, currentIndex: idx })}
                    style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', border: idx === viewingContractFile.currentIndex ? '2px solid #3b82f6' : '2px solid transparent', opacity: idx === viewingContractFile.currentIndex ? 1 : 0.6, cursor: 'pointer', flexShrink: 0, position: 'relative' }}
                  >
                    <img src={u} alt={`Trang ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px' }}>
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      {/* ======================================================== */}
      {/* MODAL 7: XEM ẢNH SCAN BẰNG CẤP / CHỨNG CHỈ PHÓNG TO        */}
      {/* ======================================================== */}
      {previewDocModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)', padding: '24px' }}>
          <div style={{ width: '840px', maxWidth: '100%', maxHeight: '92vh', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{previewDocModal.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a href={previewDocModal.url} target="_blank" rel="noreferrer" download style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={14} /> Mở tab mới / Tải về
                </a>
                <button onClick={() => setPreviewDocModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
              {previewDocModal.url.startsWith('data:application/pdf') ? (
                <iframe src={previewDocModal.url} title={previewDocModal.title} style={{ width: '100%', height: '70vh', border: 'none' }} />
              ) : (
                <img src={previewDocModal.url} alt={previewDocModal.title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }} />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
