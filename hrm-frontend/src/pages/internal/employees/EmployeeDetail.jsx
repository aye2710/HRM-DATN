import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, Save, Edit, CheckCircle, Plus, FileText, AlertTriangle, Eye, EyeOff, Upload, 
  X, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Laptop, FileSignature, 
  Award, TrendingUp, ShieldCheck, CheckCircle2, Building2, Briefcase,
  GraduationCap, User, Users, Shield, Calendar, CreditCard, MapPin, Phone, Mail, FileCheck,
  Paperclip, FolderOpen, History, Lock, Unlock, MoreVertical, UploadCloud, Printer, Check
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
    default: return 'Nhân viên';
  }
};

// Component trường nhập liệu có thể chỉnh sửa
const FormField = ({ label, value, type = 'text', isEditMode, onChange, options = [], disabled = false, placeholder = '', rows = 2 }) => {
  if (!isEditMode) {
    let displayValue = value;
    if (type === 'select') {
      const matched = options.find(o => String(o.value) === String(value));
      displayValue = matched ? matched.label : value;
    } else if (type === 'date' && value) {
      try {
        const d = new Date(value);
        displayValue = !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : value;
      } catch (e) {
        displayValue = value;
      }
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 600, minHeight: '22px' }}>
          {displayValue || <span style={{ color: '#94A3B8', fontWeight: 400 }}>—</span>}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</label>
      {type === 'select' ? (
        <select 
          className="form-select" 
          value={value || ''} 
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '6px 10px', height: '36px' }}
        >
          <option value="">-- Chọn {label.toLowerCase()} --</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          className="form-input"
          rows={rows}
          value={value || ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '6px 10px' }}
        />
      ) : (
        <input 
          type={type} 
          className="form-input" 
          value={type === 'date' && value ? String(value).split('T')[0] : (value ?? '')} 
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '6px 10px', height: '36px' }}
        />
      )}
    </div>
  );
};

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSalary, setShowSalary] = useState(false); // Mặc định che lương bảo mật theo NĐ 13/2023/NĐ-CP
  const [activeNav, setActiveNav] = useState('overview');
  
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // Accordion Sections Open/Close State (mặc định mở các phần quan trọng như mẫu)
  const [openSections, setOpenSections] = useState({
    overview: true,
    contact: true,
    work: true,
    residence: false,
    finance: false,
    relatives: false,
    training: true, // Mở sẵn như hình chụp của user
    degrees: false,
    certificates: false,
    experience: false,
    contracts: true,
    assets: false,
    decisions: false,
    attachments: false
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToSection = (key) => {
    setActiveNav(key);
    // Tự động mở accordion nếu đang đóng
    setOpenSections(prev => ({ ...prev, [key]: true }));
    const element = document.getElementById(`section-${key}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // State Khóa đào tạo (Training) mô phỏng chính xác giao diện ảnh mẫu
  const [trainings, setTrainings] = useState([
    {
      id: 'train-1',
      courseName: 'Khóa đào tạo nghiệp vụ nhân sự chuyên sâu',
      startDate: '2025-10-01',
      endDate: '2025-10-15',
      decisionNumber: 'QĐ-2025/23523/LLA',
      fileName: 'sample-document.docx',
      result: 'Đạt (Xuất sắc)'
    }
  ]);
  const [isAddingTraining, setIsAddingTraining] = useState(false);
  const [newTrainingForm, setNewTrainingForm] = useState({
    courseName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    decisionNumber: '',
    fileName: '',
    result: 'Đạt'
  });

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

  // Modal Người thân / Phụ thuộc
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
      navigate('/internal/employees');
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

  // Handlers cho Đào tạo
  const handleSaveTraining = () => {
    if (!newTrainingForm.courseName) return toast.error('Vui lòng nhập Tên khóa đào tạo');
    const newCourse = {
      id: `train-${Date.now()}`,
      ...newTrainingForm
    };
    setTrainings([...trainings, newCourse]);
    setIsAddingTraining(false);
    setNewTrainingForm({
      courseName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      decisionNumber: '',
      fileName: '',
      result: 'Đạt'
    });
    toast.success('Đã thêm khóa đào tạo thành công!');
  };

  const handleDeleteTraining = (trainId) => {
    setTrainings(trainings.filter(t => t.id !== trainId));
    toast.success('Đã xóa khóa đào tạo');
  };

  // Handlers Người thân
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

  // Handlers Bằng cấp
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

  // Handlers Chứng chỉ
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

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải thông tin hồ sơ nhân sự...</div>;
  }

  if (!employee) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>Không tìm thấy dữ liệu nhân sự</div>;
  }

  // Danh mục Menu Dọc (In-page Sidebar) mô phỏng chính xác thanh điều hướng ảnh mẫu
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: <User size={16} /> },
    { id: 'contact', label: 'Liên hệ', icon: <Phone size={16} /> },
    { id: 'work', label: 'Phân công công việc', icon: <Briefcase size={16} /> },
    { id: 'residence', label: 'Cư trú', icon: <MapPin size={16} /> },
    { id: 'finance', label: 'Ngân hàng, thuế & BHXH', icon: <CreditCard size={16} /> },
    { id: 'relatives', label: 'Người thân & Người phụ thuộc', icon: <Users size={16} /> },
    { id: 'training', label: 'Đào tạo', icon: <GraduationCap size={16} /> },
    { id: 'degrees', label: 'Bằng cấp', icon: <Award size={16} /> },
    { id: 'certificates', label: 'Chứng chỉ', icon: <FileCheck size={16} /> },
    { id: 'experience', label: 'Kinh nghiệm làm việc', icon: <Building2 size={16} /> },
    { id: 'contracts', label: 'Hợp đồng & Lương', icon: <FileText size={16} /> },
    { id: 'assets', label: 'Tài sản', icon: <Laptop size={16} /> },
    { id: 'decisions', label: 'Quá trình công tác nội bộ', icon: <FileSignature size={16} /> },
    { id: 'attachments', label: 'Hồ sơ đính kèm', icon: <Paperclip size={16} /> }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* 1. Header Cố Định (Top App Bar giống mẫu GHC.Lexora) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '0.85rem 1.5rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Nút quay lại + Tên nhân sự nổi bật */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/internal/employees')}
            className="btn btn-outline"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            title="Quay lại danh sách nhân sự"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              {employee.fullName}
            </h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              {employee.code}
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
              {getEmployeeStatusName(employee.status)}
            </span>
          </div>
        </div>

        {/* Các nút hành động bên phải: Thao tác & Nút Lưu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
            style={{ fontSize: '0.825rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Printer size={14} /> In hồ sơ
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(`/internal/decisions/create?employeeId=${employee.id}`)}
            style={{ fontSize: '0.825rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FileSignature size={14} /> Lập quyết định
          </button>
          
          {!isEditMode ? (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="btn btn-outline"
              style={{ padding: '6px 16px', fontSize: '0.825rem', borderColor: '#2563EB', color: '#2563EB', fontWeight: 600 }}
            >
              <Edit size={14} style={{ display: 'inline', marginRight: '5px' }} />
              Chỉnh sửa
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.825rem' }}
            >
              Hủy
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            style={{ padding: '6px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} /> Lưu
          </button>
        </div>
      </div>

      {/* 2. Bố Cục 2 Cột: Cột Trái (Mục Lục Dọc) + Cột Phải (Các Thẻ Accordion) */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
        
        {/* CỘT TRÁI: Vertical Anchor Sidebar (Menu Đề Mục Dọc giống hệt GHC.Lexora) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '8px',
          position: 'sticky',
          top: '20px',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hồ sơ nhân sự
          </div>

          {navItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#2563EB' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ color: isActive ? '#2563EB' : '#64748B' }}>{item.icon}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* CỘT PHẢI: Collapsible Accordion Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          
          {/* CARD 1: TỔNG QUAN (Thông tin nhân thân cơ bản) */}
          <div id="section-overview" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('overview')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Tổng quan & Nhân thân</h3>
              </div>
              {openSections.overview ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.overview && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <FormField label="Họ và tên" value={employee.fullName} isEditMode={isEditMode} onChange={(v) => handleChange('fullName', v)} />
                <FormField label="Mã nhân sự" value={employee.code} disabled={true} isEditMode={isEditMode} onChange={(v) => handleChange('code', v)} />
                <FormField 
                  label="Giới tính" 
                  value={employee.gender} 
                  type="select" 
                  options={[
                    { value: 'MALE', label: 'Nam' },
                    { value: 'FEMALE', label: 'Nữ' },
                    { value: 'OTHER', label: 'Khác' }
                  ]} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('gender', v)} 
                />
                <FormField label="Ngày sinh" value={employee.dateOfBirth} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('dateOfBirth', v)} />
                <FormField label="Số CCCD / Hộ chiếu" value={employee.cccd} isEditMode={isEditMode} onChange={(v) => handleChange('cccd', v)} />
                <FormField label="Ngày cấp CCCD" value={employee.cccdIssueDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('cccdIssueDate', v)} />
                <FormField label="Nơi cấp CCCD" value={employee.cccdIssuePlace} isEditMode={isEditMode} onChange={(v) => handleChange('cccdIssuePlace', v)} />
                <FormField label="Ngày hết hạn CCCD" value={employee.cccdExpiryDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('cccdExpiryDate', v)} />
                <FormField label="Quốc tịch" value={employee.nationality || 'Việt Nam'} isEditMode={isEditMode} onChange={(v) => handleChange('nationality', v)} />
                <FormField label="Dân tộc" value={employee.ethnicity || 'Kinh'} isEditMode={isEditMode} onChange={(v) => handleChange('ethnicity', v)} />
                <FormField label="Tôn giáo" value={employee.religion || 'Không'} isEditMode={isEditMode} onChange={(v) => handleChange('religion', v)} />
                <FormField 
                  label="Tình trạng hôn nhân" 
                  value={employee.maritalStatus} 
                  type="select" 
                  options={[
                    { value: 'SINGLE', label: 'Độc thân' },
                    { value: 'MARRIED', label: 'Đã kết hôn' },
                    { value: 'DIVORCED', label: 'Ly hôn' }
                  ]} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('maritalStatus', v)} 
                />
              </div>
            )}
          </div>

          {/* CARD 2: LIÊN HỆ */}
          <div id="section-contact" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('contact')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Thông tin liên hệ</h3>
              </div>
              {openSections.contact ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.contact && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <FormField label="Email doanh nghiệp" value={employee.email} isEditMode={isEditMode} onChange={(v) => handleChange('email', v)} />
                <FormField label="Email cá nhân" value={employee.personalEmail} isEditMode={isEditMode} onChange={(v) => handleChange('personalEmail', v)} />
                <FormField label="Số điện thoại di động" value={employee.phone} isEditMode={isEditMode} onChange={(v) => handleChange('phone', v)} />
                <FormField label="Người liên hệ khẩn cấp" value={employee.emergencyContactName} isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactName', v)} />
                <FormField label="SĐT khẩn cấp" value={employee.emergencyContactPhone} isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactPhone', v)} />
                <FormField label="Mối quan hệ người liên hệ" value={employee.emergencyContactRelation} isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactRelation', v)} />
              </div>
            )}
          </div>

          {/* CARD 3: PHÂN CÔNG CÔNG VIỆC */}
          <div id="section-work" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('work')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Phân công công việc & Vị trí</h3>
              </div>
              {openSections.work ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.work && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <FormField 
                  label="Phòng ban" 
                  value={employee.departmentId} 
                  type="select" 
                  options={departments.map(d => ({ value: d.id, label: d.name }))} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('departmentId', v)} 
                />
                <FormField 
                  label="Vị trí / Chức danh" 
                  value={employee.positionId} 
                  type="select" 
                  options={positions} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('positionId', v)} 
                />
                <FormField 
                  label="Cấp bậc quản lý" 
                  value={employee.managementRole} 
                  type="select" 
                  options={[
                    { value: 'BOD', label: 'Ban Tổng Giám Đốc' },
                    { value: 'DIRECTOR', label: 'Giám đốc Khối' },
                    { value: 'DEPUTY_DIRECTOR', label: 'Phó Giám đốc Khối' },
                    { value: 'MANAGER', label: 'Trưởng phòng' },
                    { value: 'DEPUTY_MANAGER', label: 'Phó Trưởng phòng' },
                    { value: 'TEAM_LEAD', label: 'Trưởng nhóm (Lead)' },
                    { value: 'STAFF', label: 'Nhân viên' }
                  ]} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('managementRole', v)} 
                />
                <FormField 
                  label="Quản lý trực tiếp" 
                  value={employee.managerId} 
                  type="select" 
                  options={allEmployees.filter(e => e.id !== employee.id).map(e => ({ value: e.id, label: `${e.fullName} (${e.code})` }))} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('managerId', v)} 
                />
                <FormField 
                  label="Trạng thái làm việc" 
                  value={employee.status} 
                  type="select" 
                  options={[
                    { value: 'ACTIVE', label: 'Chính thức' },
                    { value: 'PROBATION', label: 'Thử việc' },
                    { value: 'INTERNSHIP', label: 'Thực tập' },
                    { value: 'ONBOARDING', label: 'Đang hội nhập' },
                    { value: 'MATERNITY_LEAVE', label: 'Nghỉ thai sản' },
                    { value: 'UNPAID_LEAVE', label: 'Nghỉ không lương' },
                    { value: 'SUSPENDED', label: 'Tạm hoãn HĐLĐ' },
                    { value: 'RESIGNED', label: 'Đã thôi việc' }
                  ]} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('status', v)} 
                />
                <FormField 
                  label="Hình thức nhân sự" 
                  value={employee.employmentType || 'FULL_TIME'} 
                  type="select" 
                  options={[
                    { value: 'FULL_TIME', label: 'Toàn thời gian (Full-time)' },
                    { value: 'PART_TIME', label: 'Bán thời gian (Part-time)' },
                    { value: 'INTERNSHIP', label: 'Thực tập sinh' },
                    { value: 'CONTRACT', label: 'Hợp đồng dự án' }
                  ]} 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('employmentType', v)} 
                />
                <FormField label="Ngày gia nhập công ty" value={employee.joinDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('joinDate', v)} />
                <FormField label="Ngày tiếp nhận chính thức" value={employee.officialJoinDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('officialJoinDate', v)} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Thâm niên công tác</span>
                  <span style={{ fontSize: '0.88rem', color: '#2563EB', fontWeight: 700 }}>{calculateSeniority(employee.joinDate)}</span>
                </div>
                <FormField label="Địa điểm làm việc" value={employee.workLocation || 'Trụ sở chính'} isEditMode={isEditMode} onChange={(v) => handleChange('workLocation', v)} />
              </div>
            )}
          </div>

          {/* CARD 4: CƯ TRÚ */}
          <div id="section-residence" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('residence')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Cư trú & Hộ khẩu</h3>
              </div>
              {openSections.residence ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.residence && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <FormField label="Địa chỉ thường trú (Hộ khẩu)" value={employee.permanentAddress} isEditMode={isEditMode} onChange={(v) => handleChange('permanentAddress', v)} />
                <FormField label="Địa chỉ tạm trú / Hiện tại" value={employee.temporaryAddress} isEditMode={isEditMode} onChange={(v) => handleChange('temporaryAddress', v)} />
                <FormField label="Quê quán" value={employee.hometown} isEditMode={isEditMode} onChange={(v) => handleChange('hometown', v)} />
                <FormField label="Nơi sinh" value={employee.birthPlace} isEditMode={isEditMode} onChange={(v) => handleChange('birthPlace', v)} />
              </div>
            )}
          </div>

          {/* CARD 5: NGÂN HÀNG, THUẾ & BHXH */}
          <div id="section-finance" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('finance')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Ngân hàng, thuế & BHXH</h3>
              </div>
              {openSections.finance ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.finance && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <FormField label="Số tài khoản ngân hàng" value={employee.bankAccount} isEditMode={isEditMode} onChange={(v) => handleChange('bankAccount', v)} />
                <FormField label="Tên ngân hàng" value={employee.bankName} isEditMode={isEditMode} onChange={(v) => handleChange('bankName', v)} />
                <FormField label="Chi nhánh ngân hàng" value={employee.bankBranch} isEditMode={isEditMode} onChange={(v) => handleChange('bankBranch', v)} />
                <FormField label="Chủ tài khoản" value={employee.bankAccountHolder || employee.fullName} isEditMode={isEditMode} onChange={(v) => handleChange('bankAccountHolder', v)} />
                <FormField label="Mã số thuế cá nhân" value={employee.taxCode} isEditMode={isEditMode} onChange={(v) => handleChange('taxCode', v)} />
                <FormField label="Số sổ BHXH" value={employee.socialInsurance} isEditMode={isEditMode} onChange={(v) => handleChange('socialInsurance', v)} />
                <FormField label="Mã thẻ BHYT" value={employee.healthInsurance} isEditMode={isEditMode} onChange={(v) => handleChange('healthInsurance', v)} />
              </div>
            )}
          </div>

          {/* CARD 6: NGƯỜI THÂN & NGƯỜI PHỤ THUỘC */}
          <div id="section-relatives" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('relatives')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Người thân & Người phụ thuộc</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowAddRelativeModal(true); }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', height: '28px', color: '#2563EB', borderColor: '#BFDBFE' }}
                >
                  <Plus size={13} /> Thêm người thân
                </button>
                {openSections.relatives ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
              </div>
            </div>

            {openSections.relatives && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                {employee.relatives && employee.relatives.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {employee.relatives.map(rel => (
                      <div key={rel.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', backgroundColor: '#F8FAFC', position: 'relative' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{rel.fullName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>Quan hệ: {rel.relation}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                          Ngày sinh: {rel.dateOfBirth ? new Date(rel.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                        </div>
                        {rel.isDependent && (
                          <span className="badge" style={{ marginTop: '6px', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', fontSize: '0.7rem' }}>
                            Giảm trừ gia cảnh
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRelative(rel.id)}
                          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>
                    Chưa có thông tin người thân hoặc người phụ thuộc.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 7: ĐÀO TẠO (MÔ PHỎNG CHÍNH XÁC GIAO DIỆN MẪU CỦA USER) */}
          <div id="section-training" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('training')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GraduationCap size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Đào tạo</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsAddingTraining(true); }}
                  className="btn btn-outline"
                  style={{ padding: '4px 12px', fontSize: '0.78rem', height: '28px', color: '#2563EB', borderColor: '#BFDBFE', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Thêm khóa
                </button>
                {openSections.training ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
              </div>
            </div>

            {openSections.training && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Form Thêm mới Khóa Đào tạo khi ấn nút "+ Thêm khóa" */}
                {isAddingTraining && (
                  <div style={{ border: '2px dashed #93C5FD', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E40AF' }}>Khởi tạo khóa đào tạo mới</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Tên khóa đào tạo *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="VD: Khóa đào tạo nghiệp vụ nhân sự..."
                          value={newTrainingForm.courseName}
                          onChange={(e) => setNewTrainingForm({ ...newTrainingForm, courseName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Quyết định liên quan</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="VD: 23523 hoặc QĐ-2026/001"
                          value={newTrainingForm.decisionNumber}
                          onChange={(e) => setNewTrainingForm({ ...newTrainingForm, decisionNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Ngày bắt đầu</label>
                        <input
                          type="date"
                          className="form-input"
                          value={newTrainingForm.startDate}
                          onChange={(e) => setNewTrainingForm({ ...newTrainingForm, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Ngày kết thúc</label>
                        <input
                          type="date"
                          className="form-input"
                          value={newTrainingForm.endDate}
                          onChange={(e) => setNewTrainingForm({ ...newTrainingForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                      <button type="button" onClick={() => setIsAddingTraining(false)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                        Hủy
                      </button>
                      <button type="button" onClick={handleSaveTraining} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '4px 16px' }}>
                        Lưu khóa học
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách các Thẻ Khóa đào tạo đã học (Giống ảnh mẫu 100%) */}
                {trainings.map(t => (
                  <div 
                    key={t.id} 
                    style={{ 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '10px', 
                      padding: '1.25rem', 
                      backgroundColor: '#FFFFFF', 
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Header Thẻ con: Tên khóa học + Thùng rác xóa */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0F172A' }}>
                        {t.courseName}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTraining(t.id)}
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                        title="Xóa khóa đào tạo này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Dòng 1: Tên khóa */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '3px' }}>Tên khóa</div>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={t.courseName} 
                        readOnly 
                        style={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#1E293B' }} 
                      />
                    </div>

                    {/* Dòng 2: Ngày bắt đầu - Ngày kết thúc */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '3px' }}>Ngày bắt đầu</div>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={t.startDate} 
                          readOnly 
                          style={{ backgroundColor: '#F8FAFC' }} 
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '3px' }}>Ngày kết thúc</div>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={t.endDate} 
                          readOnly 
                          style={{ backgroundColor: '#F8FAFC' }} 
                        />
                      </div>
                    </div>

                    {/* Dòng 3: Quyết định liên quan */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '3px' }}>Quyết định liên quan</div>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={t.decisionNumber} 
                        readOnly 
                        style={{ backgroundColor: '#F8FAFC', color: '#2563EB', fontWeight: 600 }} 
                      />
                    </div>

                    {/* Dòng 4: Tài liệu đính kèm (hộp nét đứt giống hệt ảnh) */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '4px' }}>Tài liệu đính kèm</div>
                      <div style={{
                        border: '2px dashed #E2E8F0',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#F8FAFC'
                      }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FileText size={20} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{t.fileName || 'sample-document.docx'}</span>
                      </div>
                    </div>

                    {/* Dòng 5: Kết quả / Ghi chú */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '3px' }}>Kết quả / Ghi chú</div>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={t.result} 
                        readOnly 
                        style={{ backgroundColor: '#F8FAFC', color: '#166534', fontWeight: 700 }} 
                      />
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

          {/* CARD 8: BẰNG CẤP */}
          <div id="section-degrees" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('degrees')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Bằng cấp học vấn</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowAddDegreeModal(true); }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', height: '28px', color: '#2563EB', borderColor: '#BFDBFE' }}
                >
                  <Plus size={13} /> Thêm bằng cấp
                </button>
                {openSections.degrees ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
              </div>
            </div>

            {openSections.degrees && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                {employee.degrees && employee.degrees.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employee.degrees.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{d.degreeName} - {d.major}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Cơ sở: {d.institution} (Năm tốt nghiệp: {d.gradYear || '—'}) | Xếp loại: <strong>{d.classification}</strong></div>
                        </div>
                        <button onClick={() => handleDeleteDegree(d.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>Chưa có dữ liệu bằng cấp.</div>
                )}
              </div>
            )}
          </div>

          {/* CARD 9: CHỨNG CHỈ */}
          <div id="section-certificates" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('certificates')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCheck size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Chứng chỉ chuyên môn</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowAddCertModal(true); }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', height: '28px', color: '#2563EB', borderColor: '#BFDBFE' }}
                >
                  <Plus size={13} /> Thêm chứng chỉ
                </button>
                {openSections.certificates ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
              </div>
            </div>

            {openSections.certificates && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                {employee.certificates && employee.certificates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employee.certificates.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Đơn vị cấp: {c.issuedBy} | Ngày cấp: {c.issueDate ? new Date(c.issueDate).toLocaleDateString('vi-VN') : '—'}</div>
                        </div>
                        <button onClick={() => handleDeleteCert(c.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>Chưa có chứng chỉ.</div>
                )}
              </div>
            )}
          </div>

          {/* CARD 10: KINH NGHIỆM LÀM VIỆC */}
          <div id="section-experience" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('experience')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Kinh nghiệm làm việc trước đây</h3>
              </div>
              {openSections.experience ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.experience && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                <FormField 
                  label="Tóm tắt quá trình công tác & Kinh nghiệm tích lũy" 
                  value={employee.workExperience} 
                  type="textarea" 
                  rows={4} 
                  placeholder="Mô tả các công ty, chức vụ và dự án đã từng làm việc trước khi gia nhập doanh nghiệp..." 
                  isEditMode={isEditMode} 
                  onChange={(v) => handleChange('workExperience', v)} 
                />
              </div>
            )}
          </div>

          {/* CARD 11: HỢP ĐỒNG & LƯƠNG */}
          <div id="section-contracts" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('contracts')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Hợp đồng lao động & Lương</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSalary(prev => !prev); }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.76rem', height: '28px', color: showSalary ? '#047857' : '#64748B', borderColor: '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Ẩn/Hiện mức lương bảo mật theo Nghị định 13/2023/NĐ-CP"
                >
                  {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showSalary ? 'Ẩn lương' : 'Hiện lương'}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowAddContractModal(true); }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', height: '28px', color: '#2563EB', borderColor: '#BFDBFE' }}
                >
                  <Plus size={13} /> Thêm hợp đồng
                </button>
                {openSections.contracts ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
              </div>
            </div>

            {openSections.contracts && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                {employee.contracts && employee.contracts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {employee.contracts.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                            {c.contractNumber} - {getContractTypeName(c.contractType)}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                            Thời hạn: {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—'} ➔ {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Lương cơ bản: {showSalary ? `${Number(c.baseSalary || 0).toLocaleString('vi-VN')} VNĐ/tháng` : '••••••••• VNĐ/tháng'}</span>
                            <button
                              type="button"
                              onClick={() => setShowSalary(prev => !prev)}
                              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center' }}
                              title={showSalary ? 'Ẩn mức lương' : 'Hiển thị mức lương'}
                            >
                              {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getContractStatusBadge(c.status, c.endDate)}
                          <button
                            type="button"
                            onClick={() => navigate(`/internal/contracts/${employee.id}`)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                          >
                            Chi tiết HĐ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>Chưa có hợp đồng nào.</div>
                )}
              </div>
            )}
          </div>

          {/* CARD 12: TÀI SẢN BÀN GIAO */}
          <div id="section-assets" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('assets')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Laptop size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Tài sản & Thiết bị bàn giao</h3>
              </div>
              {openSections.assets ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.assets && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                {employee.assetAssignments && employee.assetAssignments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employee.assetAssignments.map(as => (
                      <div key={as.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{as.asset?.name || 'Thiết bị'} ({as.asset?.code || '—'})</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Ngày bàn giao: {as.assignedDate ? new Date(as.assignedDate).toLocaleDateString('vi-VN') : '—'}</div>
                        </div>
                        <span className="badge" style={{ backgroundColor: as.returnDate ? '#F1F5F9' : '#DCFCE7', color: as.returnDate ? '#64748B' : '#166534', fontSize: '0.75rem' }}>
                          {as.returnDate ? 'Đã thu hồi' : 'Đang sử dụng'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>Chưa bàn giao tài sản thiết bị nào.</div>
                )}
              </div>
            )}
          </div>

          {/* CARD 13: QUÁ TRÌNH CÔNG TÁC & QUYẾT ĐỊNH */}
          <div id="section-decisions" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('decisions')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSignature size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Quá trình công tác nội bộ & Quyết định</h3>
              </div>
              {openSections.decisions ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.decisions && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                {employee.decisions && employee.decisions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employee.decisions.map(dec => (
                      <div key={dec.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#2563EB' }}>{dec.decisionNumber}</span> - <span style={{ fontWeight: 600 }}>{dec.title}</span>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            Hiệu lực: {dec.effectiveDate ? new Date(dec.effectiveDate).toLocaleDateString('vi-VN') : '—'} | Cấp ký: {dec.signBy || 'Ban Giám Đốc'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/internal/decisions/${dec.id}`)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                        >
                          Xem văn bản
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>Chưa có quyết định nhân sự nào.</div>
                )}
              </div>
            )}
          </div>

          {/* CARD 14: HỒ SƠ ĐÍNH KÈM */}
          <div id="section-attachments" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div 
              onClick={() => toggleSection('attachments')}
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Paperclip size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Hồ sơ & Tài liệu đính kèm</h3>
              </div>
              {openSections.attachments ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </div>

            {openSections.attachments && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#F8FAFC'
                }}>
                  <FolderOpen size={28} color="#64748B" />
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Các tài liệu bản sao CCCD, SYLL, Giấy khám sức khỏe, Bản sao bằng cấp</span>
                  <button type="button" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '4px 12px', marginTop: '4px' }}>
                    <Upload size={14} style={{ marginRight: '4px' }} /> Tải lên tài liệu
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL THÊM HỢP ĐỒNG */}
      {showAddContractModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Thêm Hợp Đồng Lao Động Mới</h3>
              <button onClick={() => setShowAddContractModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateContract} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Số hợp đồng *</label>
                <input type="text" className="form-input" required value={newContractForm.contractNumber} onChange={(e) => setNewContractForm({ ...newContractForm, contractNumber: e.target.value })} placeholder="VD: HĐLĐ-2026/001/LLA" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Loại hợp đồng *</label>
                  <select className="form-select" value={newContractForm.contractType} onChange={(e) => setNewContractForm({ ...newContractForm, contractType: e.target.value })}>
                    <option value="PROBATION">Thử việc</option>
                    <option value="OFFICIAL_1Y">Chính thức (1 năm)</option>
                    <option value="INDEFINITE">Không xác định thời hạn</option>
                    <option value="INTERNSHIP">Thực tập sinh</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Lương cơ bản (VNĐ) *</label>
                  <input type="number" className="form-input" required value={newContractForm.baseSalary} onChange={(e) => setNewContractForm({ ...newContractForm, baseSalary: e.target.value })} placeholder="VD: 15000000" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Ngày bắt đầu *</label>
                  <input type="date" className="form-input" required value={newContractForm.startDate} onChange={(e) => setNewContractForm({ ...newContractForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Ngày kết thúc</label>
                  <input type="date" className="form-input" value={newContractForm.endDate} onChange={(e) => setNewContractForm({ ...newContractForm, endDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddContractModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" disabled={isSubmittingContract} className="btn btn-primary">Tạo hợp đồng</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL THÊM NGƯỜI THÂN */}
      {showAddRelativeModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '500px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Thêm Người Thân / Người Phụ Thuộc</h3>
              <button onClick={() => setShowAddRelativeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddRelative} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Họ và tên *</label>
                <input type="text" className="form-input" required value={relativeForm.fullName} onChange={(e) => setRelativeForm({ ...relativeForm, fullName: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Mối quan hệ *</label>
                  <select className="form-select" value={relativeForm.relation} onChange={(e) => setRelativeForm({ ...relativeForm, relation: e.target.value })}>
                    <option value="Con">Con</option>
                    <option value="Vợ/Chồng">Vợ/Chồng</option>
                    <option value="Bố/Mẹ">Bố/Mẹ</option>
                    <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Ngày sinh</label>
                  <input type="date" className="form-input" value={relativeForm.dateOfBirth} onChange={(e) => setRelativeForm({ ...relativeForm, dateOfBirth: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={relativeForm.isDependent} onChange={(e) => setRelativeForm({ ...relativeForm, isDependent: e.target.checked })} />
                  <span>Là người phụ thuộc giảm trừ gia cảnh (Thuế TNCN)</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddRelativeModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu người thân</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL THÊM BẰNG CẤP */}
      {showAddDegreeModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '500px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Thêm Bằng Cấp Mới</h3>
              <button onClick={() => setShowAddDegreeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDegree} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Tên bằng cấp *</label>
                <input type="text" className="form-input" required placeholder="VD: Cử nhân, Thạc sĩ, Kỹ sư..." value={degreeForm.degreeName} onChange={(e) => setDegreeForm({ ...degreeForm, degreeName: e.target.value })} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Chuyên ngành *</label>
                <input type="text" className="form-input" required placeholder="VD: Công nghệ thông tin, Quản trị kinh doanh..." value={degreeForm.major} onChange={(e) => setDegreeForm({ ...degreeForm, major: e.target.value })} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Trường đào tạo *</label>
                <input type="text" className="form-input" required placeholder="VD: Đại học Bách Khoa..." value={degreeForm.institution} onChange={(e) => setDegreeForm({ ...degreeForm, institution: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddDegreeModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu bằng cấp</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL THÊM CHỨNG CHỈ */}
      {showAddCertModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '500px', maxWidth: '95vw', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Thêm Chứng Chỉ Mới</h3>
              <button onClick={() => setShowAddCertModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCert} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Tên chứng chỉ *</label>
                <input type="text" className="form-input" required placeholder="VD: AWS Solutions Architect, IELTS 7.5..." value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Đơn vị cấp *</label>
                <input type="text" className="form-input" required placeholder="VD: Amazon Web Services, British Council..." value={certForm.issuedBy} onChange={(e) => setCertForm({ ...certForm, issuedBy: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddCertModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu chứng chỉ</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
