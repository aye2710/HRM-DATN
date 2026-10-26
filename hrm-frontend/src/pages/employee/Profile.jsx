import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Briefcase, FileText, CreditCard, Award, Clock, Edit3, X, Save, AlertCircle,
  Users, Laptop, Plus, Trash2, Eye, UploadCloud, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Reusable FormField matching Admin portal inline editing style
const FormField = ({
  label,
  value,
  onChange,
  isEdit = false,
  type = 'text',
  readOnly = false,
  options = [],
  badge = null,
  placeholder = '',
  colSpan = 1
}) => {
  const readOnlyStyle = {
    padding: '10px 14px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    fontSize: '0.875rem',
    color: '#0F172A',
    fontWeight: '500',
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  };

  const editStyle = {
    padding: '10px 14px',
    backgroundColor: readOnly ? '#F1F5F9' : '#FFFFFF',
    borderRadius: '8px',
    border: isEdit && !readOnly ? '1px solid #93C5FD' : '1px solid #CBD5E1',
    fontSize: '0.875rem',
    color: readOnly ? '#64748B' : '#0F172A',
    outline: 'none',
    width: '100%',
    cursor: readOnly ? 'not-allowed' : 'text',
    boxShadow: isEdit && !readOnly ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
    transition: 'all 0.2s'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
          {label}
        </label>
        {isEdit && badge && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: badge.bg,
            color: badge.color
          }}>
            {badge.text}
          </span>
        )}
      </div>

      {isEdit && !readOnly ? (
        type === 'select' ? (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={editStyle}
          >
            {options.map((opt) => (
              <option key={opt.value !== undefined ? opt.value : opt} value={opt.value !== undefined ? opt.value : opt}>
                {opt.label !== undefined ? opt.label : opt}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            rows={2}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ ...editStyle, resize: 'vertical' }}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={editStyle}
          />
        )
      ) : (
        <div style={readOnlyStyle}>
          {type === 'date' && value ? new Date(value).toLocaleDateString('vi-VN') : (value || '—')}
        </div>
      )}
    </div>
  );
};

export const EmployeeProfile = () => {
  const [searchParams] = useSearchParams();
  const queryEmployeeId = searchParams.get('id');
  const activeEmployeeId = queryEmployeeId || localStorage.getItem('employeeId');

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'job' | 'contract' | 'finance' | 'relatives' | 'education' | 'assets' | 'decisions'

  // Inline Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Modals for Relatives, Degrees, Certificates
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

  const [showAddDegreeModal, setShowAddDegreeModal] = useState(false);
  const [degreeForm, setDegreeForm] = useState({
    degreeName: '',
    major: '',
    institution: '',
    gradYear: new Date().getFullYear(),
    classification: 'Giỏi',
    fileUrl: ''
  });

  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuedBy: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    fileUrl: ''
  });

  // Modal xem ảnh / file đính kèm phóng to
  const [previewImage, setPreviewImage] = useState(null); // { title: '', url: '' }

  // Xử lý upload file scan / ảnh bằng cấp & chứng chỉ
  const handleFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Dung lượng tệp đính kèm không được vượt quá 10MB');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target.result);
      toast.success('Đã tải lên tệp đính kèm thành công!');
    };
    reader.readAsDataURL(file);
  };

  const employeeCode = localStorage.getItem('employeeCode') || 'NV-2026';
  const localFullName = localStorage.getItem('fullName') || 'Nhân viên';

  const fetchEmployee = async () => {
    if (!activeEmployeeId) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/employees/${activeEmployeeId}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Lỗi tải thông tin nhân viên:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [activeEmployeeId]);

  // Fallback demo data if DB hasn't populated full profile
  const data = employee || {
    id: activeEmployeeId,
    code: employeeCode,
    fullName: localFullName,
    email: 'long.ph@lla.vn',
    personalEmail: 'long.ph@gmail.com',
    phone: '0988 123 456',
    gender: 'Nam',
    birthday: '1998-05-15',
    idCard: '001098012345',
    address: 'Số 18, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    department: { name: 'Phòng Phát triển Phần mềm & CNTT' },
    position: { title: 'Kỹ sư Phần mềm Cao cấp (Senior Software Engineer)' },
    joinDate: '2023-03-01',
    status: 'ACTIVE',
    manager: { fullName: 'Trần Văn Quản Lý' },
    bankName: 'Techcombank',
    bankAccount: '19036888888888',
    taxCode: '8549123011',
    insuranceNumber: '7912345678',
    contracts: [
      {
        id: 'HDLD-2024-001',
        contractType: 'INDEFINITE',
        startDate: '2024-03-01',
        endDate: null,
        status: 'ACTIVE'
      }
    ],
    relatives: [],
    degrees: [],
    certificates: []
  };

  const pendingRequest = (employee?.profileChangeRequests || data?.profileChangeRequests || []).find(r => r.status === 'PENDING');
  const lastRejectedRequest = (employee?.profileChangeRequests || data?.profileChangeRequests || []).find(r => r.status === 'REJECTED');

  const handleStartEdit = () => {
    setEditFormData({
      fullName: data.fullName || '',
      email: data.email || '',
      personalEmail: data.personalEmail || '',
      phone: data.phone || '',
      gender: data.gender === 'FEMALE' ? 'Nữ' : (data.gender === 'MALE' ? 'Nam' : (data.gender || 'Nam')),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : (data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : ''),
      nationality: data.nationality || 'Việt Nam',
      ethnicity: data.ethnicity || 'Kinh',
      birthPlace: data.birthPlace || '',
      hometown: data.hometown || '',
      maritalStatus: data.maritalStatus === 'SINGLE' ? 'Độc thân' : (data.maritalStatus === 'MARRIED' ? 'Đã kết hôn' : (data.maritalStatus === 'DIVORCED' ? 'Ly hôn' : (data.maritalStatus || 'Độc thân'))),
      currentAddress: data.currentAddress || data.address || '',
      permanentAddress: data.permanentAddress || '',
      
      cccd: data.cccd || data.idCard || '',
      cccdIssueDate: data.cccdIssueDate ? new Date(data.cccdIssueDate).toISOString().split('T')[0] : '',
      cccdExpiryDate: data.cccdExpiryDate ? new Date(data.cccdExpiryDate).toISOString().split('T')[0] : '',
      cccdIssuePlace: data.cccdIssuePlace || '',
      highestEducation: data.highestEducation || '',
      
      bankName: data.bankName || '',
      bankBranch: data.bankBranch || '',
      bankAccount: data.bankAccount || '',
      bankAccountHolder: data.bankAccountHolder || data.fullName || '',
      taxCode: data.taxCode || '',
      socialInsurance: data.socialInsurance || '',
      healthInsurance: data.healthInsurance || '',
      
      emergencyContactName: data.emergencyContactName || '',
      emergencyContactPhone: data.emergencyContactPhone || '',
      emergencyContactRelation: data.emergencyContactRelation || '',
      requestNote: ''
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) {
      return toast.error('Không tìm thấy mã định danh nhân viên.');
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/employees/${targetId}`, editFormData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.hasPendingApproval) {
        toast.success(res.data.message || 'Các thông tin nhạy cảm đã gửi tới Ban Nhân sự chờ phê duyệt!', { duration: 6000 });
      } else {
        toast.success(res.data?.message || 'Hồ sơ cá nhân đã được cập nhật thành công!');
      }
      setIsEditMode(false);
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật hồ sơ cá nhân.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quản lý Người thân / Người phụ thuộc
  const handleAddRelative = async (e) => {
    e.preventDefault();
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return toast.error('Không tìm thấy mã nhân viên.');
    if (!relativeForm.fullName || !relativeForm.relation) {
      return toast.error('Vui lòng điền Họ tên và Mối quan hệ');
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/employees/${targetId}/relatives`, relativeForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm người phụ thuộc');
    }
  };

  const handleDeleteRelative = async (relId) => {
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return;
    if (!window.confirm('Xác nhận xóa thông tin người thân này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/employees/${targetId}/relatives/${relId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Đã xóa thông tin người thân thành công!');
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa người thân');
    }
  };

  // Quản lý Bằng cấp
  const handleAddDegree = async (e) => {
    e.preventDefault();
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return toast.error('Không tìm thấy mã nhân viên.');
    if (!degreeForm.degreeName || !degreeForm.major || !degreeForm.institution) {
      return toast.error('Vui lòng điền Tên bằng cấp, Chuyên ngành và Trường đào tạo');
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/employees/${targetId}/degrees`, degreeForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm bằng cấp');
    }
  };

  const handleDeleteDegree = async (degId) => {
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return;
    if (!window.confirm('Xác nhận xóa bằng cấp này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/employees/${targetId}/degrees/${degId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Đã xóa bằng cấp thành công!');
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa bằng cấp');
    }
  };

  // Quản lý Chứng chỉ
  const handleAddCert = async (e) => {
    e.preventDefault();
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return toast.error('Không tìm thấy mã nhân viên.');
    if (!certForm.name || !certForm.issuedBy) {
      return toast.error('Vui lòng điền Tên chứng chỉ và Đơn vị cấp');
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/employees/${targetId}/certificates`, certForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Đã thêm chứng chỉ thành công!');
      setShowAddCertModal(false);
      setCertForm({
        name: '',
        issuedBy: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        fileUrl: ''
      });
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi thêm chứng chỉ');
    }
  };

  const handleDeleteCert = async (certId) => {
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return;
    if (!window.confirm('Xác nhận xóa chứng chỉ này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/employees/${targetId}/certificates/${certId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Đã xóa chứng chỉ thành công!');
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa chứng chỉ');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Card với Avatar và Thẻ Nhân Viên + Nút Sửa / Lưu hồ sơ */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.85rem',
            fontWeight: 800,
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
          }}>
            {data.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
                {data.fullName}
              </h1>
              <span style={{
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                Chính thức
              </span>
            </div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
              Mã nhân sự: <strong style={{ color: '#2563EB' }}>{data.code || employeeCode}</strong> • {data.position?.title || 'Kỹ sư Phần mềm'}
            </p>
          </div>
        </div>

        {/* Nút Sửa hồ sơ / Lưu thay đổi tương tự trang Quản trị */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isEditMode ? (
            <button
              onClick={handleStartEdit}
              style={{
                height: '40px',
                padding: '0 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Edit3 size={16} /> Sửa hồ sơ
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={16} /> Hủy bỏ
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                style={{
                  height: '40px',
                  padding: '0 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thanh thông báo khi đang ở Chế độ Chỉnh sửa Inline */}
      {isEditMode && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(37,99,235,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontSize: '0.875rem', fontWeight: 700 }}>
              <span>✏️</span> Bạn đang ở chế độ chỉnh sửa hồ sơ:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem' }}>
              <span style={{ color: '#15803D', fontWeight: 600 }}>🟢 Tự lưu ngay: <span style={{ fontWeight: 400, color: '#334155' }}>SĐT, Email cá nhân, Nơi ở hiện tại, Liên hệ khẩn cấp</span></span>
              <span style={{ color: '#B45309', fontWeight: 600 }}>🟡 Cần HR duyệt: <span style={{ fontWeight: 400, color: '#334155' }}>CCCD, Ngân hàng nhận lương, MST, Sổ BHXH...</span></span>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Ghi chú / Lý do thay đổi gửi Ban Nhân sự (Tùy chọn):
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
              placeholder="Ví dụ: Em vừa làm lại CCCD gắn chip mới / Mới đổi số tài khoản ngân hàng nhận lương..."
              value={editFormData.requestNote || ''}
              onChange={(e) => setEditFormData({ ...editFormData, requestNote: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Thông báo trạng thái yêu cầu cập nhật hồ sơ */}
      {pendingRequest && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#92400E',
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.08)'
        }}>
          <Clock size={20} color="#D97706" />
          <div style={{ flex: 1, fontSize: '0.875rem' }}>
            <strong style={{ display: 'block' }}>Yêu cầu cập nhật hồ sơ đang chờ Ban Nhân sự phê duyệt</strong>
            <span style={{ fontSize: '0.8rem', color: '#B45309' }}>
              Gửi lúc: {new Date(pendingRequest.createdAt).toLocaleString('vi-VN')} {pendingRequest.note ? `• Ghi chú: ${pendingRequest.note}` : ''}
            </span>
          </div>
          <span style={{ backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: '#B45309' }}>
            ⏳ Chờ duyệt
          </span>
        </div>
      )}

      {!pendingRequest && lastRejectedRequest && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#991B1B'
        }}>
          <AlertCircle size={20} color="#DC2626" />
          <div style={{ flex: 1, fontSize: '0.875rem' }}>
            <strong style={{ display: 'block' }}>Yêu cầu cập nhật hồ sơ gần nhất bị từ chối</strong>
            <span style={{ fontSize: '0.8rem', color: '#B91C1C' }}>
              Lý do: {lastRejectedRequest.rejectReason || 'Thông tin chưa hợp lệ'}. Bạn có thể chỉnh sửa lại và gửi yêu cầu mới.
            </span>
          </div>
        </div>
      )}

      {/* 2. Navigation Tabs (8 Tabs) */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '0.25rem',
        overflowX: 'auto'
      }}>
        {[
          { key: 'general', label: 'Lý lịch & Liên hệ', icon: <User size={16} /> },
          { key: 'job', label: 'Công việc & Tổ chức', icon: <Briefcase size={16} /> },
          { key: 'contract', label: 'Hợp đồng lao động', icon: <FileText size={16} /> },
          { key: 'finance', label: 'Tài khoản lương & Thuế', icon: <CreditCard size={16} /> },
          { key: 'relatives', label: 'Người thân & Phụ thuộc', icon: <Users size={16} /> },
          { key: 'education', label: 'Học vấn & Bằng cấp', icon: <Award size={16} /> },
          { key: 'assets', label: 'Tài sản & Thiết bị', icon: <Laptop size={16} /> },
          { key: 'decisions', label: 'Quyết định & Lịch sử', icon: <Clock size={16} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              border: 'none',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#2563EB' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #2563EB' : '2px solid transparent',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        padding: '2rem'
      }}>

        {/* TAB 1: Lý lịch & Liên hệ (Hỗ trợ sửa Inline) */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Thông tin cá nhân & Giấy tờ tùy thân
                </h3>
                {isEditMode && (
                  <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>
                    🟡 Các trường định danh sẽ được gửi duyệt
                  </span>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Họ và tên khai sinh"
                  value={isEditMode ? editFormData.fullName : data.fullName}
                  onChange={(v) => setEditFormData({ ...editFormData, fullName: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Họ và tên..."
                />
                <FormField
                  label="Email công vụ"
                  value={data.email || 'Chưa cấp'}
                  isEdit={isEditMode}
                  readOnly={true}
                  badge={{ text: '🔒 Do công ty cấp', color: '#64748B', bg: '#F1F5F9' }}
                />
                <FormField
                  label="Email cá nhân (Nhận thông báo)"
                  value={isEditMode ? editFormData.personalEmail : (data.personalEmail || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, personalEmail: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="email.canhan@gmail.com..."
                />
                <FormField
                  label="Số điện thoại liên hệ"
                  value={isEditMode ? editFormData.phone : (data.phone || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, phone: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="0912..."
                />
                <FormField
                  label="Ngày sinh"
                  value={isEditMode ? editFormData.dateOfBirth : (data.dateOfBirth || data.birthday)}
                  onChange={(v) => setEditFormData({ ...editFormData, dateOfBirth: v })}
                  isEdit={isEditMode}
                  type="date"
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                />
                <FormField
                  label="Giới tính"
                  value={isEditMode ? editFormData.gender : (data.gender === 'MALE' ? 'Nam' : (data.gender === 'FEMALE' ? 'Nữ' : (data.gender || 'Nam')))}
                  onChange={(v) => setEditFormData({ ...editFormData, gender: v })}
                  isEdit={isEditMode}
                  type="select"
                  options={['Nam', 'Nữ', 'Khác']}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                />
                <FormField
                  label="Quốc tịch"
                  value={isEditMode ? editFormData.nationality : (data.nationality || 'Việt Nam')}
                  onChange={(v) => setEditFormData({ ...editFormData, nationality: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Việt Nam..."
                />
                <FormField
                  label="Dân tộc"
                  value={isEditMode ? editFormData.ethnicity : (data.ethnicity || 'Kinh')}
                  onChange={(v) => setEditFormData({ ...editFormData, ethnicity: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Kinh..."
                />
                <FormField
                  label="Số CCCD / Hộ chiếu"
                  value={isEditMode ? editFormData.cccd : (data.cccd || data.idCard || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, cccd: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="001098..."
                />
                <FormField
                  label="Ngày cấp CCCD"
                  value={isEditMode ? editFormData.cccdIssueDate : data.cccdIssueDate}
                  onChange={(v) => setEditFormData({ ...editFormData, cccdIssueDate: v })}
                  isEdit={isEditMode}
                  type="date"
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                />
                <FormField
                  label="Ngày hết hạn CCCD"
                  value={isEditMode ? editFormData.cccdExpiryDate : data.cccdExpiryDate}
                  onChange={(v) => setEditFormData({ ...editFormData, cccdExpiryDate: v })}
                  isEdit={isEditMode}
                  type="date"
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                />
                <FormField
                  label="Nơi cấp CCCD"
                  value={isEditMode ? editFormData.cccdIssuePlace : (data.cccdIssuePlace || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, cccdIssuePlace: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Cục CSQLHC về TTXH..."
                />
                <FormField
                  label="Nơi sinh"
                  value={isEditMode ? editFormData.birthPlace : (data.birthPlace || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, birthPlace: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Hà Nội, Nam Định..."
                />
                <FormField
                  label="Quê quán"
                  value={isEditMode ? editFormData.hometown : (data.hometown || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, hometown: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Xã/Huyện/Tỉnh..."
                />
                <FormField
                  label="Trình độ học vấn cao nhất"
                  value={isEditMode ? editFormData.highestEducation : (data.highestEducation || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, highestEducation: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Đại học, Thạc sĩ..."
                />
                <FormField
                  label="Tình trạng hôn nhân"
                  value={isEditMode ? editFormData.maritalStatus : (data.maritalStatus === 'SINGLE' ? 'Độc thân' : (data.maritalStatus === 'MARRIED' ? 'Đã kết hôn' : (data.maritalStatus === 'DIVORCED' ? 'Ly hôn' : (data.maritalStatus || 'Độc thân'))))}
                  onChange={(v) => setEditFormData({ ...editFormData, maritalStatus: v })}
                  isEdit={isEditMode}
                  type="select"
                  options={['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Khác']}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Địa chỉ cư trú & Nơi ở
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Địa chỉ thường trú (theo hộ khẩu / CCCD)"
                  value={isEditMode ? editFormData.permanentAddress : (data.permanentAddress || data.address || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, permanentAddress: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Địa chỉ thường trú trên CCCD..."
                />
                <FormField
                  label="Nơi ở hiện tại"
                  value={isEditMode ? editFormData.currentAddress : (data.currentAddress || data.address || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, currentAddress: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="Số nhà, đường, phường, quận..."
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Người liên hệ khẩn cấp
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Họ và tên người liên hệ"
                  value={isEditMode ? editFormData.emergencyContactName : (data.emergencyContactName || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, emergencyContactName: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="Nguyễn Văn B..."
                />
                <FormField
                  label="Số điện thoại khẩn cấp"
                  value={isEditMode ? editFormData.emergencyContactPhone : (data.emergencyContactPhone || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, emergencyContactPhone: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="0912..."
                />
                <FormField
                  label="Mối quan hệ"
                  value={isEditMode ? editFormData.emergencyContactRelation : (data.emergencyContactRelation || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, emergencyContactRelation: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="Bố/Mẹ/Vợ/Chồng..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Công việc & Tổ chức (Chỉ xem) */}
        {activeTab === 'job' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              Vị trí làm việc & Cơ cấu tổ chức
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Phòng ban trực thuộc:</span>
                <strong style={{ color: '#0F172A' }}>{data.department?.name || 'Phòng Phát triển Phần mềm & CNTT'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Chức danh chuyên môn:</span>
                <strong style={{ color: '#0F172A' }}>{data.position?.title || 'Kỹ sư Phần mềm Cao cấp'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Cấp bậc / Level:</span>
                <strong style={{ color: '#2563EB' }}>Staff</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Người quản lý trực tiếp:</span>
                <strong style={{ color: '#0F172A' }}>{data.manager?.fullName || 'Trần Văn Quản Lý'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Ngày chính thức gia nhập:</span>
                <strong style={{ color: '#0F172A' }}>{data.joinDate ? new Date(data.joinDate).toLocaleDateString('vi-VN') : '01/03/2023'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Địa điểm làm việc:</span>
                <strong style={{ color: '#0F172A' }}>{data.workLocation || 'Trụ sở chính'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Hợp đồng lao động (Chỉ xem) */}
        {activeTab === 'contract' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              Thông tin Hợp đồng lao động hiện tại
            </h3>
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '0.75rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                    Hợp đồng lao động điện tử
                  </strong>
                  <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Hiệu lực
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Số hợp đồng: #{data.contracts?.[0]?.id || 'HDLD-2024-001'}
                </span>
              </div>
              <button 
                onClick={() => toast('Hợp đồng điện tử đã được lưu trữ bảo mật trên hệ thống.')}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              >
                Xem chi tiết HĐ
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Tài khoản lương & Thuế (Hỗ trợ sửa Inline) */}
        {activeTab === 'finance' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Tài khoản chi trả lương & Bảo hiểm bắt buộc
              </h3>
              {isEditMode && (
                <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>
                  🟡 Thay đổi thông tin ngân hàng cần HR duyệt
                </span>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <FormField
                label="Ngân hàng thụ hưởng"
                value={isEditMode ? editFormData.bankName : (data.bankName || '')}
                onChange={(v) => setEditFormData({ ...editFormData, bankName: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="Techcombank, Vietcombank, MB..."
              />
              <FormField
                label="Chi nhánh ngân hàng"
                value={isEditMode ? editFormData.bankBranch : (data.bankBranch || '')}
                onChange={(v) => setEditFormData({ ...editFormData, bankBranch: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="Chi nhánh Thăng Long, Ba Đình..."
              />
              <FormField
                label="Số tài khoản nhận lương"
                value={isEditMode ? editFormData.bankAccount : (data.bankAccount || '')}
                onChange={(v) => setEditFormData({ ...editFormData, bankAccount: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="1903..."
              />
              <FormField
                label="Tên chủ tài khoản"
                value={isEditMode ? editFormData.bankAccountHolder : (data.bankAccountHolder || data.fullName || '')}
                onChange={(v) => setEditFormData({ ...editFormData, bankAccountHolder: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="NGUYEN VAN A..."
              />
              <FormField
                label="Mã số thuế cá nhân (MST)"
                value={isEditMode ? editFormData.taxCode : (data.taxCode || '')}
                onChange={(v) => setEditFormData({ ...editFormData, taxCode: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="8549..."
              />
              <FormField
                label="Mã số sổ BHXH"
                value={isEditMode ? editFormData.socialInsurance : (data.socialInsurance || '')}
                onChange={(v) => setEditFormData({ ...editFormData, socialInsurance: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="7912..."
              />
              <FormField
                label="Số thẻ BHYT"
                value={isEditMode ? editFormData.healthInsurance : (data.healthInsurance || '')}
                onChange={(v) => setEditFormData({ ...editFormData, healthInsurance: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="DN479..."
              />
            </div>
          </div>
        )}

        {/* TAB 5: Người thân & Phụ thuộc (Cho phép Nhân viên tự khai báo & Xóa) */}
        {activeTab === 'relatives' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Thông tin Thân nhân & Người phụ thuộc
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                  Khai báo người phụ thuộc để tính giảm trừ gia cảnh thuế TNCN theo quy định
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRelativeModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.25)'
                }}
              >
                <Plus size={16} /> + Thêm người thân / người phụ thuộc
              </button>
            </div>

            {(!data.relatives || data.relatives.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1' }}>
                <Users size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                  Chưa có thông tin thân nhân hoặc người phụ thuộc
                </p>
                <p style={{ margin: '4px 0 1rem 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                  Bạn có thể khai báo con cái, vợ/chồng hoặc người phụ thuộc để đăng ký giảm trừ gia cảnh
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddRelativeModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #2563EB',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  + Khai báo ngay
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '12px 16px' }}>Họ và tên</th>
                      <th style={{ padding: '12px 16px' }}>Mối quan hệ</th>
                      <th style={{ padding: '12px 16px' }}>Ngày sinh</th>
                      <th style={{ padding: '12px 16px' }}>Số CCCD / Mã ĐD</th>
                      <th style={{ padding: '12px 16px' }}>Mã số thuế</th>
                      <th style={{ padding: '12px 16px' }}>Giảm trừ gia cảnh</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.relatives.map((r, i) => (
                      <tr key={r.id || i} style={{ borderTop: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{r.fullName}</td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{r.relation || r.relationship}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.cccd || r.idNumber || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.taxCode || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ backgroundColor: r.isDependent ? '#ECFDF5' : '#F1F5F9', color: r.isDependent ? '#059669' : '#64748B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {r.isDependent ? 'Đã đăng ký' : 'Không'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteRelative(r.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #FCA5A5',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Xóa người thân"
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Học vấn & Bằng cấp (Cho phép Nhân viên tự khai báo văn bằng & chứng chỉ) */}
        {activeTab === 'education' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Trình độ học vấn cao nhất
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Trình độ học vấn cao nhất"
                  value={isEditMode ? editFormData.highestEducation : (data.highestEducation || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, highestEducation: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Đại học, Thạc sĩ, Cử nhân..."
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
                  Văn bằng tốt nghiệp ({data.degrees?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddDegreeModal(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> + Thêm bằng cấp
                </button>
              </div>

              {(!data.degrees || data.degrees.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Chưa có văn bằng nào được ghi nhận. Bấm "+ Thêm bằng cấp" để khai báo văn bằng của bạn.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {data.degrees.map((d, i) => (
                    <div key={d.id || i} style={{ padding: '1rem 1.25rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.95rem' }}>{d.degreeName}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#2563EB', display: 'block', marginTop: '2px', fontWeight: 600 }}>Chuyên ngành: {d.major || '—'}</span>
                        <span style={{ fontSize: '0.825rem', color: '#475569', display: 'block', marginTop: '2px' }}>Trường: {d.institution}</span>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginTop: '4px' }}>Năm tốt nghiệp: {d.gradYear || d.graduationYear || '—'} • Loại: {d.classification || '—'}</span>
                        {d.fileUrl && (
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ title: `Bản scan: ${d.degreeName} - ${d.major}`, url: d.fileUrl })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> Xem ảnh / Scan bằng
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDegree(d.id)}
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="Xóa bằng cấp"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
                  Chứng chỉ chuyên môn ({data.certificates?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> + Thêm chứng chỉ
                </button>
              </div>

              {(!data.certificates || data.certificates.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Chưa có chứng chỉ nào được ghi nhận. Bấm "+ Thêm chứng chỉ" để tải lên chứng chỉ nghề nghiệp của bạn.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {data.certificates.map((c, i) => (
                    <div key={c.id || i} style={{ padding: '1rem 1.25rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.95rem' }}>{c.name}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#059669', display: 'block', marginTop: '2px', fontWeight: 600 }}>Cấp bởi: {c.issuedBy || '—'}</span>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginTop: '4px' }}>
                          Ngày cấp: {c.issueDate ? new Date(c.issueDate).toLocaleDateString('vi-VN') : (c.issuedDate ? new Date(c.issuedDate).toLocaleDateString('vi-VN') : '—')}
                          {c.expiryDate ? ` • Hết hạn: ${new Date(c.expiryDate).toLocaleDateString('vi-VN')}` : ''}
                        </span>
                        {c.fileUrl && (
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ title: `Chứng chỉ: ${c.name} (${c.issuedBy})`, url: c.fileUrl })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> Xem ảnh chứng chỉ
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCert(c.id)}
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="Xóa chứng chỉ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: Tài sản & Thiết bị */}
        {activeTab === 'assets' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Tài sản & Thiết bị công ty cấp phát
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Danh sách trang thiết bị làm việc đang được giao cho bạn quản lý và sử dụng
              </p>
            </div>

            {(!data.assetAssignments || data.assetAssignments.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1' }}>
                <Laptop size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                  Bạn chưa có tài sản hoặc thiết bị nào được bàn giao
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                  Khi phòng IT/Hành chính cấp máy, thông tin thiết bị sẽ hiển thị tại đây
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '12px 16px' }}>Mã tài sản</th>
                      <th style={{ padding: '12px 16px' }}>Tên thiết bị</th>
                      <th style={{ padding: '12px 16px' }}>Số Serial</th>
                      <th style={{ padding: '12px 16px' }}>Ngày bàn giao</th>
                      <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assetAssignments.map((a, i) => (
                      <tr key={a.id || i} style={{ borderTop: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB' }}>{a.asset?.code || `TS-${i+1}`}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{a.asset?.name || 'Thiết bị làm việc'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{a.asset?.serialNumber || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('vi-VN') : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {a.status === 'ASSIGNED' ? 'Đang sử dụng' : (a.status || 'Đang sử dụng')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: Quyết định & Lịch sử */}
        {activeTab === 'decisions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Quyết định Nhân sự của bạn
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                  Các quyết định chính thức do Ban Giám đốc ban hành (Bổ nhiệm, Tăng lương, Khen thưởng...)
                </p>
              </div>

              {(!data.decisions || data.decisions.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Chưa có quyết định nhân sự nào được ban hành cho hồ sơ này.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Số quyết định</th>
                        <th style={{ padding: '12px 16px' }}>Loại quyết định</th>
                        <th style={{ padding: '12px 16px' }}>Tiêu đề</th>
                        <th style={{ padding: '12px 16px' }}>Ngày hiệu lực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.decisions.map((d, i) => (
                        <tr key={d.id || i} style={{ borderTop: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB' }}>{d.decisionNumber || `QD-${i+1}`}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {d.type || 'Quyết định'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#0F172A' }}>{d.title}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{d.effectiveDate ? new Date(d.effectiveDate).toLocaleDateString('vi-VN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Lịch sử công tác & Biến động việc làm
                </h3>
              </div>

              {(!data.employmentHistories || data.employmentHistories.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Chưa có lịch sử biến động việc làm.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Ngày hiệu lực</th>
                        <th style={{ padding: '12px 16px' }}>Phòng ban</th>
                        <th style={{ padding: '12px 16px' }}>Chức danh</th>
                        <th style={{ padding: '12px 16px' }}>Lý do biến động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employmentHistories.map((h, i) => (
                        <tr key={h.id || i} style={{ borderTop: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{h.effectiveDate ? new Date(h.effectiveDate).toLocaleDateString('vi-VN') : '—'}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{h.department?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{h.position?.title || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#2563EB', fontWeight: 500 }}>{h.changeReason || 'Điều chuyển / Bổ nhiệm'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM NGƯỜI THÂN & PHỤ THUỘC (THUẾ TNCN)          */}
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
                    placeholder="Nguyễn Văn A..."
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Số CCCD / Mã định danh</label>
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
                    placeholder="MST nếu có..."
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
                <button type="button" onClick={() => setShowAddRelativeModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Lưu hồ sơ</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THÊM BẰNG CẤP CHÍNH QUY                          */}
      {/* ======================================================== */}
      {showAddDegreeModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '520px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
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
                <input type="text" required placeholder="VD: Khoa học máy tính, Công nghệ thông tin..." value={degreeForm.major} onChange={e => setDegreeForm({ ...degreeForm, major: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
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

              {/* Upload ảnh scan bằng cấp */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Ảnh chụp / Bản scan bằng tốt nghiệp (Tùy chọn)
                </label>
                {degreeForm.fileUrl ? (
                  <div style={{ position: 'relative', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={degreeForm.fileUrl} 
                      alt="Scan bằng cấp" 
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block' }}>Đã đính kèm ảnh bằng cấp</span>
                      <button
                        type="button"
                        onClick={() => setDegreeForm(prev => ({ ...prev, fileUrl: '' }))}
                        style={{ fontSize: '0.78rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Trash2 size={13} /> Xóa & Chọn ảnh khác
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ title: degreeForm.degreeName || 'Bằng tốt nghiệp', url: degreeForm.fileUrl })}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> Xem trước
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    border: '2px dashed #CBD5E1',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    gap: '6px'
                  }}>
                    <UploadCloud size={24} color="#3B82F6" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                      Bấm vào đây để chọn ảnh scan / chụp bằng cấp
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Hỗ trợ PNG, JPG, JPEG hoặc PDF (Tối đa 10MB)
                    </span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleFileUpload(e, (base64) => setDegreeForm(prev => ({ ...prev, fileUrl: base64 })))} 
                    />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddDegreeModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Lưu bằng cấp</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 3: THÊM CHỨNG CHỈ NGHỀ NGHIỆP                      */}
      {/* ======================================================== */}
      {showAddCertModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '520px', maxWidth: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Khai báo Chứng chỉ nghề nghiệp</h3>
              <button onClick={() => setShowAddCertModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCert} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tên Chứng chỉ *</label>
                <input type="text" required placeholder="VD: AWS Certified, PMP, IELTS, TOEIC..." value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Đơn vị cấp *</label>
                <input type="text" required placeholder="VD: Amazon Web Services, British Council, PMI..." value={certForm.issuedBy} onChange={e => setCertForm({ ...certForm, issuedBy: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
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
                  Ảnh chụp / Bản scan chứng chỉ (Tùy chọn)
                </label>
                {certForm.fileUrl ? (
                  <div style={{ position: 'relative', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={certForm.fileUrl} 
                      alt="Scan chứng chỉ" 
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', display: 'block' }}>Đã đính kèm ảnh chứng chỉ</span>
                      <button
                        type="button"
                        onClick={() => setCertForm(prev => ({ ...prev, fileUrl: '' }))}
                        style={{ fontSize: '0.78rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Trash2 size={13} /> Xóa & Chọn ảnh khác
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ title: certForm.name || 'Chứng chỉ', url: certForm.fileUrl })}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> Xem trước
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    border: '2px dashed #CBD5E1',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    gap: '6px'
                  }}>
                    <UploadCloud size={24} color="#059669" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                      Bấm vào đây để chọn ảnh scan / chụp chứng chỉ
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Hỗ trợ PNG, JPG, JPEG hoặc PDF (Tối đa 10MB)
                    </span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleFileUpload(e, (base64) => setCertForm(prev => ({ ...prev, fileUrl: base64 })))} 
                    />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddCertModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Lưu chứng chỉ</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 4: XEM ẢNH SCAN BẰNG CẤP / CHỨNG CHỈ PHÓNG TO        */}
      {/* ======================================================== */}
      {previewImage && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(5px)',
          padding: '24px'
        }}>
          <div style={{
            width: '840px',
            maxWidth: '100%',
            maxHeight: '92vh',
            backgroundColor: 'white',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {previewImage.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ExternalLink size={14} /> Mở tab mới / Tải về
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
              {previewImage.url.startsWith('data:application/pdf') ? (
                <iframe src={previewImage.url} title={previewImage.title} style={{ width: '100%', height: '70vh', border: 'none' }} />
              ) : (
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
