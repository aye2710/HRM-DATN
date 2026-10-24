import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Save, Edit, CheckCircle, Plus, FileText, AlertTriangle, Eye, Upload, 
  Image, X, ExternalLink, ChevronLeft, ChevronRight, Trash2, Laptop, FileSignature, 
  Award, TrendingUp, ShieldCheck, CheckCircle2, Building2, Network, Briefcase
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
    case 'RESIGNED': return 'Đã nghỉ việc';
    default: return status || '—';
  }
};

const InfoField = ({ label, value, type = 'text', isEditMode, onChange, required = false, options = [] }) => {
  const readOnlyStyle = {
    padding: '10px 16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    fontSize: '0.95rem',
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
    fontSize: '0.95rem',
    backgroundColor: 'white',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'border-color 0.2s'
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
            {options.find(o => (o.value || o.id) === value)?.label || options.find(o => (o.value || o.id) === value)?.name || '—'}
          </div>
        )}
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
    </div>
  );
};

const ProfileHeader = ({ employee, isEditMode, onToggleEdit, onSave, onBack, calculateSeniority }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', borderTop: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)', border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '700', color: '#2563eb', flexShrink: 0 }}>
        {employee.fullName?.split(' ').pop().substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {employee.fullName}
          <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: employee.status === 'ACTIVE' ? '#dcfce7' : '#fef9c3', color: employee.status === 'ACTIVE' ? '#166534' : '#854d0e' }}>
            {getEmployeeStatusName(employee.status)}
          </span>
        </h2>
        <div style={{ fontSize: '0.95rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '600', color: '#3b82f6' }}>{employee.code}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee.position?.title || 'Chưa xếp chức danh'}
            {employee.position?.level && (
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                {employee.position.level}
              </span>
            )}
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{employee.department?.name || 'Chưa xếp phòng ban'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📞 <span style={{ fontWeight: '500', color: '#334155' }}>{employee.phone || '—'}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✉️ <span style={{ fontWeight: '500', color: '#334155' }}>{employee.email || '—'}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: '600', backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '6px' }}>📅 Thâm niên: {calculateSeniority(employee.joinDate)}</span>
        </div>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
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

  // Quản lý Hợp đồng & Upload nhiều trang ảnh scan giấy
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [viewingContractFile, setViewingContractFile] = useState(null); // { contractId, urls: [], currentIndex: 0, title: '' }
  const [newContractForm, setNewContractForm] = useState({
    contractType: 'OFFICIAL_1Y',
    baseSalary: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    fileUrls: []
  });
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  const handleUploadContractFiles = (contractId, files, isAppend = true) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      return toast.error('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!');
    }
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
      if (newImages.length === 0) {
        setViewingContractFile(null);
      } else {
        setViewingContractFile({
          ...viewingContractFile,
          urls: newImages,
          currentIndex: Math.max(0, pageIndex - 1)
        });
      }
    } catch (err) {
      toast.dismiss(t);
      toast.error('Lỗi khi xóa trang hợp đồng!');
    }
  };

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
        baseSalary: parseFloat(newContractForm.baseSalary)
      });
      toast.success('Thêm hợp đồng mới thành công!');
      setShowAddContractModal(false);
      setNewContractForm({
        contractType: 'OFFICIAL_1Y',
        baseSalary: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        fileUrls: []
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo hợp đồng');
    } finally {
      setIsSubmittingContract(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/employees/${id}`),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
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
    } catch (error) {
      toast.error('Không thể tải thông tin');
      navigate('/internal/employees/profiles');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading || !employee) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu hồ sơ...</div>;

  const tabs = [
    { id: 'PERSONAL', label: 'Cá nhân & Liên hệ' },
    { id: 'WORK', label: 'Thông tin Công tác' },
    { id: 'CONTRACTS', label: 'Hợp đồng & Lương' },
    { id: 'ASSETS', label: 'Tài sản & Thiết bị' },
    { id: 'DECISIONS', label: 'Quyết định & Biến động' },
    { id: 'RELATIVES', label: 'Người thân & Phụ thuộc' },
    { id: 'EDUCATION', label: 'Học vấn & Bằng cấp' }
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

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Horizontal Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '20px 32px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '600',
                fontSize: '0.95rem',
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
        <div style={{ padding: '40px' }}>
          {activeTab === 'PERSONAL' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} color="#3b82f6" /> Hồ sơ nhân thân
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Họ và Tên" value={employee.fullName} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('fullName', v)} required />
                  <InfoField label="Giới tính" value={employee.gender} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('gender', v)} options={[{value:'MALE',label:'Nam'},{value:'FEMALE',label:'Nữ'}]} />
                  <InfoField label="Ngày sinh" value={employee.dateOfBirth} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('dateOfBirth', v)} />
                  <InfoField label="Quốc tịch" value={employee.nationality} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('nationality', v)} />
                  <InfoField label="Tôn giáo / Dân tộc" value={employee.maritalStatus} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('maritalStatus', v)} />
                </div>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '16px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> Giấy tờ định danh
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Số CMND / CCCD" value={employee.cccd} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('cccd', v)} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="#f59e0b" /> Thông tin liên hệ
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Điện thoại di động" value={employee.phone} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('phone', v)} />
                  <InfoField label="Email công việc" value={employee.email} type="email" isEditMode={isEditMode} onChange={(v) => handleChange('email', v)} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <InfoField label="Địa chỉ thường trú" value={employee.address} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('address', v)} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '16px 0 0 0' }}>
                  Liên hệ khẩn cấp
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#fff7ed', padding: '24px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                  <InfoField label="Họ tên người liên hệ" value={employee.emergencyContactName} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactName', v)} />
                  <InfoField label="Quan hệ" value={employee.emergencyContactRelation} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactRelation', v)} />
                  <InfoField label="Số điện thoại khẩn cấp" value={employee.emergencyContactPhone} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactPhone', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WORK' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Thông tin công tác hiện tại</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Mã Nhân Viên" value={employee.code} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('code', v)} required />
                  <InfoField label="Công ty / Pháp nhân" value="Công ty TNHH LLA" type="text" isEditMode={false} />
                  <InfoField label="Phòng ban" value={employee.departmentId} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('departmentId', v)} options={departments} />
                  <InfoField label="Vị trí / Chức danh" value={employee.positionId} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('positionId', v)} options={positions} />
                  <InfoField label="Cấp bậc chuyên môn (Level)" value={employee.position?.level || '—'} type="text" isEditMode={false} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Ngày tháng & Trạng thái</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Ngày vào làm" value={employee.joinDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('joinDate', v)} required />
                  <InfoField label="Trạng thái làm việc" value={employee.status} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('status', v)} options={[{value:'ONBOARDING',label:'Đang hội nhập'},{value:'ACTIVE',label:'Đang làm việc'},{value:'RESIGNED',label:'Đã nghỉ việc'}]} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CONTRACTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 24px 0' }}>Lương & Thuế / Bảo hiểm</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <InfoField label="Ngân hàng" value={employee.bankName} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('bankName', v)} />
                  <InfoField label="Số tài khoản" value={employee.bankAccount} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('bankAccount', v)} />
                  <InfoField label="Mã số thuế" value={employee.taxCode} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('taxCode', v)} />
                  <InfoField label="Số sổ BHXH" value={employee.socialInsurance} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('socialInsurance', v)} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="#3b82f6" /> Danh sách Hợp đồng lao động
                  </h3>
                  <button 
                    onClick={() => setShowAddContractModal(true)} 
                    style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(59,130,246,0.25)' }}
                  >
                    <Plus size={16}/> Thêm hợp đồng
                  </button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Loại Hợp đồng</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Mức lương</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Ngày bắt đầu</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Ngày hết hạn</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Trạng thái</th>
                        <th style={{ padding: '16px', fontWeight: '600', textAlign: 'center' }}>Bản scan / Ảnh HĐ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.contracts && employee.contracts.length > 0 ? (
                        employee.contracts.map(c => (
                          <tr key={c.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>
                              {getContractTypeName(c.contractType)}
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600, color: '#16a34a' }}>
                              {Number(c.baseSalary).toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ padding: '16px', color: '#475569' }}>
                              {new Date(c.startDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '16px', color: '#475569' }}>
                              {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {getContractStatusBadge(c.status, c.endDate)}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              {(() => {
                                const files = parseContractFiles(c.fileUrl);
                                return files.length > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <button
                                      onClick={() => setViewingContractFile({
                                        contractId: c.id,
                                        urls: files,
                                        currentIndex: 0,
                                        title: `${getContractTypeName(c.contractType)} - ${employee.fullName}`
                                      })}
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                      title="Xem tất cả các trang scan của hợp đồng"
                                    >
                                      <Eye size={14} /> Xem {files.length} trang
                                    </button>
                                    <label style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px dashed #bfdbfe', backgroundColor: '#f8fafc' }} title="Thêm trang vào hợp đồng này">
                                      <Plus size={14} /> Thêm trang
                                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(c.id, e.target.files, true)} />
                                    </label>
                                  </div>
                                ) : (
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#f8fafc', color: '#3b82f6', border: '1px dashed #93c5fd', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Upload size={14} /> Tải ảnh/trang HĐ
                                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(c.id, e.target.files, false)} />
                                  </label>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.95rem' }}>Chưa có hợp đồng nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RELATIVES' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Người thân / Phụ thuộc</h3>
                <button style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16}/> Thêm người thân
                </button>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Họ và tên</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Quan hệ</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Ngày sinh</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Mã số thuế</th>
                      <th style={{ padding: '16px', fontWeight: '600', textAlign: 'center' }}>Phụ thuộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.relatives && employee.relatives.length > 0 ? (
                      employee.relatives.map(r => (
                        <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{r.fullName}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{r.relation}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</td>
                          <td style={{ padding: '16px', color: '#475569', fontFamily: 'monospace' }}>{r.taxCode || '-'}</td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>{r.isDependent ? <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '99px', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: '600' }}>Có</span> : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Chưa có bản ghi người thân.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'EDUCATION' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Bằng cấp & Chứng chỉ</h3>
                <button style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16}/> Thêm bằng cấp
                </button>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Tên Bằng cấp / Chứng chỉ</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Chuyên ngành</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Nơi đào tạo</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Năm TN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.degrees && employee.degrees.length > 0 ? (
                      employee.degrees.map(d => (
                        <tr key={d.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{d.degreeName}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{d.major}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{d.institution}</td>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#3b82f6' }}>{d.gradYear || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Chưa có dữ liệu bằng cấp.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: TÀI SẢN & THIẾT BỊ (BM-01 / BM-02 / FE-H10) */}
          {activeTab === 'ASSETS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Laptop size={20} color="#3b82f6" /> Danh mục Tài sản & Thiết bị cấp phát
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Theo dõi laptop, màn hình, thẻ ra vào (Biên bản bàn giao BM-01 & Thu hồi BM-02 khi thôi việc)
                  </p>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Mã Tài Sản</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Tên Thiết Bị</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Loại</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Ngày Cấp</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Trạng Thái</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Tình Trạng & Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.assetAssignments && employee.assetAssignments.length > 0 ? (
                      employee.assetAssignments.map(a => (
                        <tr key={a.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                            {a.asset?.code || '—'}
                          </td>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>
                            {a.asset?.name || 'Thiết bị làm việc'}
                          </td>
                          <td style={{ padding: '16px', color: '#475569' }}>
                            {a.asset?.type || 'IT Equipment'}
                          </td>
                          <td style={{ padding: '16px', color: '#475569' }}>
                            {a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {a.status === 'ACTIVE' ? (
                              <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Đang sử dụng (BM-01)
                              </span>
                            ) : a.status === 'RETURNED' ? (
                              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                Đã hoàn trả (BM-02)
                              </span>
                            ) : (
                              <span style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {a.status}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px', color: '#64748b', fontSize: '0.85rem' }}>
                            {a.notes || a.asset?.specifications || 'Bàn giao đầy đủ phụ kiện'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
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

          {/* TAB 12 & 13: QUYẾT ĐỊNH & BIẾN ĐỘNG (SOP-99 / FE-H14 - FE-H16) */}
          {activeTab === 'DECISIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileSignature size={20} color="#3b82f6" /> Lịch sử Quyết định Nhân sự ban hành
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Văn bản pháp lý chính thức điều chỉnh mức lương, bổ nhiệm chức vụ, điều chuyển phòng ban và khen thưởng kỷ luật
                    </p>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Số Quyết Định</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Loại Quyết Định</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Trích Yếu</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Nội Dung Biến Động</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Ngày Hiệu Lực</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.decisions && employee.decisions.length > 0 ? (
                        employee.decisions.map(d => (
                          <tr key={d.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                              {d.decisionNumber}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                                {d.type === 'SALARY_ADJUSTMENT' ? 'Điều chỉnh lương' :
                                 d.type === 'PROMOTION' ? 'Bổ nhiệm chức vụ' :
                                 d.type === 'TRANSFER' ? 'Điều chuyển' :
                                 d.type === 'TERMINATION' ? 'Thôi việc' :
                                 d.type === 'REWARD' ? 'Khen thưởng' :
                                 d.type === 'DISCIPLINE' ? 'Kỷ luật' : d.type}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>
                              {d.title}
                            </td>
                            <td style={{ padding: '16px', color: '#475569', fontSize: '0.875rem' }}>
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
                            <td style={{ padding: '16px', color: '#475569' }}>
                              {d.effectiveDate ? new Date(d.effectiveDate).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {d.status === 'APPROVED' ? (
                                <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> Đã ban hành
                                </span>
                              ) : d.status === 'PENDING' ? (
                                <span style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Chờ phê duyệt
                                </span>
                              ) : (
                                <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Đã từ chối
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
                            <FileSignature size={36} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                            Chưa có quyết định nhân sự nào được ban hành cho nhân sự này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lịch sử biến động công tác (Employment Histories) */}
              {employee.employmentHistories && employee.employmentHistories.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#0284c7" /> Nhật ký diễn biến chức vụ & phòng ban
                  </h4>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                        <tr>
                          <th style={{ padding: '12px 16px' }}>Ngày Hiệu Lực</th>
                          <th style={{ padding: '12px 16px' }}>Phòng Ban</th>
                          <th style={{ padding: '12px 16px' }}>Vị Trí</th>
                          <th style={{ padding: '12px 16px' }}>Lý Do Biến Động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.employmentHistories.map(h => (
                          <tr key={h.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>
                              {new Date(h.effectiveDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>
                              {h.department?.name || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>
                              {h.position?.title || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#0284c7', fontWeight: 500 }}>
                              {h.changeReason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm Hợp đồng mới */}
      {showAddContractModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '560px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> Tạo Hợp đồng Lao động Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Nhân viên: <strong>{employee?.fullName}</strong> ({employee?.code})
                </p>
              </div>
              <button onClick={() => setShowAddContractModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateContract} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Loại Hợp đồng *</label>
                <select
                  required
                  value={newContractForm.contractType}
                  onChange={(e) => setNewContractForm({ ...newContractForm, contractType: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                >
                  <option value="PROBATION">Thử việc (Probation)</option>
                  <option value="INTERNSHIP">Thực tập sinh (Internship)</option>
                  <option value="OFFICIAL_1Y">Chính thức (1 năm)</option>
                  <option value="INDEFINITE">Không xác định thời hạn</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mức lương cơ bản (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100000"
                  placeholder="Ví dụ: 15000000"
                  value={newContractForm.baseSalary}
                  onChange={(e) => setNewContractForm({ ...newContractForm, baseSalary: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
                {newContractForm.baseSalary && (
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    {Number(newContractForm.baseSalary).toLocaleString('vi-VN')} đ/tháng
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={newContractForm.startDate}
                    onChange={(e) => setNewContractForm({ ...newContractForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày kết thúc</label>
                  <input
                    type="date"
                    value={newContractForm.endDate}
                    onChange={(e) => setNewContractForm({ ...newContractForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Upload nhiều ảnh scan giấy */}
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Ảnh scan / Chụp Hợp đồng giấy (Hỗ trợ nhiều trang):
                  </label>
                  {newContractForm.fileUrls.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                      Đã chọn {newContractForm.fileUrls.length} trang
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={16} /> Chọn ảnh các trang HĐ
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                          Promise.all(files.map(file => new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => resolve(ev.target.result);
                            reader.readAsDataURL(file);
                          }))).then(newUrls => {
                            setNewContractForm({
                              ...newContractForm,
                              fileUrls: [...newContractForm.fileUrls, ...newUrls]
                            });
                          });
                        }
                      }}
                    />
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Giữ Ctrl/Shift để chọn nhiều ảnh (Trang 1, Trang 2...)
                  </span>
                </div>
                {newContractForm.fileUrls.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    {newContractForm.fileUrls.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={url} alt={`Trang ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px' }}>
                          Trang {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewContractForm({ ...newContractForm, fileUrls: newContractForm.fileUrls.filter((_, i) => i !== idx) })}
                          style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                          title="Xóa trang này"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {isSubmittingContract ? 'Đang lưu...' : 'Lưu hợp đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Xem Nhiều Trang Ảnh Scan Hợp đồng phóng to */}
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
            
            {/* Vùng xem ảnh kèm nút chuyển trang */}
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

            {/* Thumbnail preview list ở đáy */}
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
    </div>
  );
};
