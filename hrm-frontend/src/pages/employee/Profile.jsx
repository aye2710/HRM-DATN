import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  User, Briefcase, FileText, CreditCard, Award, Clock, Edit3, X, Save, AlertCircle,
  Users, Laptop, Plus, Trash2, Eye, EyeOff, UploadCloud, ExternalLink,
  Paperclip, FolderOpen, Building2, GraduationCap, FileSignature
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  normalizeGenderCode,
  normalizeMaritalStatusCode,
  formatDateVN,
  toDateInputValue,
  getEmployeeStatusMeta,
  getManagementRoleLabel,
  getEmploymentTypeLabel,
  calculateSeniority,
  getContractTypeName,
  getContractStatusMeta,
  getDecisionTypeLabel,
  getAssetAssignmentStatusMeta,
  parseAttachedFiles,
  parseContractFiles
} from '../../utils/employeeProfileHelpers';

const EMPTY_FALLBACK = {
  contracts: [],
  relatives: [],
  degrees: [],
  certificates: [],
  assetAssignments: [],
  decisions: [],
  employmentHistories: [],
  profileChangeRequests: [],
  trainings: []
};

const ReadOnlyInfoItem = ({ label, value, highlight = false, badge = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{label}</span>
    {badge ? (
      <div>
        <span
          style={{
            display: 'inline-block',
            backgroundColor: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          {badge.label}
        </span>
      </div>
    ) : (
      <span
        style={{
          fontSize: '0.9rem',
          color: highlight ? '#2563EB' : '#0F172A',
          fontWeight: highlight ? 700 : 600,
          minHeight: '22px'
        }}
      >
        {value || <span style={{ color: '#94A3B8', fontWeight: 400 }}>—</span>}
      </span>
    )}
  </div>
);

// Reusable FormField matching Admin portal inline editing + ESS permission badges
const FormField = ({
  label,
  value,
  displayValue,
  onChange,
  isEdit = false,
  type = 'text',
  readOnly = false,
  options = [],
  badge = null,
  placeholder = '',
  colSpan = 1,
  rows = 3
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
    width: '100%',
    whiteSpace: type === 'textarea' ? 'pre-wrap' : 'normal'
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

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null ? opt : { value: opt, label: opt }
  );

  const renderReadValue = () => {
    if (displayValue !== undefined && displayValue !== null && displayValue !== '') {
      return displayValue;
    }
    if (type === 'select') {
      const matched = normalizedOptions.find((opt) => String(opt.value) === String(value));
      return matched ? matched.label : (value || '—');
    }
    if (type === 'date') {
      return formatDateVN(value);
    }
    return value || '—';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
          {label}
        </label>
        {isEdit && badge && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: badge.bg,
              color: badge.color,
              whiteSpace: 'nowrap'
            }}
          >
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
            <option value="">-- Chọn {label.toLowerCase()} --</option>
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            rows={rows}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ ...editStyle, resize: 'vertical' }}
          />
        ) : (
          <input
            type={type}
            value={type === 'date' ? toDateInputValue(value) : (value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={editStyle}
          />
        )
      ) : (
        <div style={readOnlyStyle}>{renderReadValue()}</div>
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
  // 'general' | 'job' | 'contract' | 'finance' | 'relatives' | 'education' | 'assets' | 'decisions' | 'attachments'
  const [activeTab, setActiveTab] = useState('general');

  // Inline Edit Mode & Sensitive Salary Visibility
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showSalary, setShowSalary] = useState(false);

  // Modals: Relatives, Degrees, Certificates, Contract Detail, Decision Detail, File Preview
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

  const [attachmentCategory, setAttachmentCategory] = useState('CCCD / Hộ chiếu');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);
  const [viewingDecision, setViewingDecision] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // { title: '', url: '' }

  const handleFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      e.target.value = '';
      return toast.error('Dung lượng tệp đính kèm không được vượt quá 10MB');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target.result, file);
      toast.success('Đã tải lên tệp đính kèm thành công!');
    };
    reader.readAsDataURL(file);
  };

  const employeeCode = localStorage.getItem('employeeCode') || '';
  const localFullName = localStorage.getItem('fullName') || 'Nhân viên';

  const fetchEmployee = useCallback(async () => {
    if (!activeEmployeeId) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/employees/${activeEmployeeId}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Lỗi tải thông tin nhân viên:', error);
      toast.error(error.response?.data?.error || 'Không thể tải thông tin hồ sơ nhân sự.');
    } finally {
      setLoading(false);
    }
  }, [activeEmployeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const data = employee || {
    ...EMPTY_FALLBACK,
    id: activeEmployeeId,
    code: employeeCode,
    fullName: localFullName
  };

  const statusMeta = getEmployeeStatusMeta(data.status);
  const attachedFilesList = parseAttachedFiles(data.attachedFiles);
  const pendingRequest = (data.profileChangeRequests || []).find((r) => r.status === 'PENDING');
  const lastRejectedRequest = (data.profileChangeRequests || []).find((r) => r.status === 'REJECTED');

  const handleStartEdit = () => {
    // Nếu đang ở tab chỉ xem thì tự chuyển về tab có trường chỉnh sửa
    if (!['general', 'finance', 'education'].includes(activeTab)) {
      setActiveTab('general');
    }
    const resolvedCurrentAddress = data.temporaryAddress || data.currentAddress || data.address || '';
    setEditFormData({
      fullName: data.fullName || '',
      email: data.email || '',
      personalEmail: data.personalEmail || '',
      phone: data.phone || '',
      gender: normalizeGenderCode(data.gender),
      dateOfBirth: toDateInputValue(data.dateOfBirth || data.birthday),
      nationality: data.nationality || '',
      ethnicity: data.ethnicity || '',
      religion: data.religion || '',
      birthPlace: data.birthPlace || '',
      hometown: data.hometown || '',
      maritalStatus: normalizeMaritalStatusCode(data.maritalStatus),
      currentAddress: resolvedCurrentAddress,
      temporaryAddress: resolvedCurrentAddress,
      permanentAddress: data.permanentAddress || data.address || '',

      cccd: data.cccd || data.idCard || '',
      cccdIssueDate: toDateInputValue(data.cccdIssueDate),
      cccdExpiryDate: toDateInputValue(data.cccdExpiryDate),
      cccdIssuePlace: data.cccdIssuePlace || '',
      highestEducation: data.highestEducation || '',
      workExperience: data.workExperience || '',

      bankName: data.bankName || '',
      bankBranch: data.bankBranch || '',
      bankAccount: data.bankAccount || '',
      bankAccountHolder: data.bankAccountHolder || '',
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
      const payload = {
        ...editFormData,
        temporaryAddress: editFormData.currentAddress
      };
      const res = await axios.put(`http://localhost:5000/api/employees/${targetId}`, payload);
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
      await axios.post(`http://localhost:5000/api/employees/${targetId}/relatives`, relativeForm);
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
      await axios.delete(`http://localhost:5000/api/employees/${targetId}/relatives/${relId}`);
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
      await axios.post(`http://localhost:5000/api/employees/${targetId}/degrees`, degreeForm);
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
      await axios.delete(`http://localhost:5000/api/employees/${targetId}/degrees/${degId}`);
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
      await axios.post(`http://localhost:5000/api/employees/${targetId}/certificates`, certForm);
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
      await axios.delete(`http://localhost:5000/api/employees/${targetId}/certificates/${certId}`);
      toast.success('Đã xóa chứng chỉ thành công!');
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa chứng chỉ');
    }
  };

  // Quản lý Hồ sơ đính kèm (đồng bộ cột Employee.attachedFiles)
  const handleUploadAttachment = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) {
      e.target.value = '';
      return toast.error('Không tìm thấy mã nhân viên.');
    }
    if (file.size > 10 * 1024 * 1024) {
      e.target.value = '';
      return toast.error('Dung lượng tài liệu không được vượt quá 10MB');
    }
    setIsUploadingAttachment(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const nextFiles = [
          ...attachedFilesList,
          {
            id: `att-${Date.now()}`,
            name: file.name,
            category: attachmentCategory,
            fileUrl: ev.target.result,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Nhân viên'
          }
        ];
        await axios.put(`http://localhost:5000/api/employees/${targetId}`, {
          attachedFiles: JSON.stringify(nextFiles)
        });
        toast.success('Đã tải lên tài liệu đính kèm thành công!');
        fetchEmployee();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Lỗi khi tải lên tài liệu đính kèm');
      } finally {
        setIsUploadingAttachment(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (attId) => {
    const targetId = activeEmployeeId || data?.id;
    if (!targetId) return;
    if (!window.confirm('Xác nhận xóa tài liệu đính kèm này?')) return;
    try {
      const nextFiles = attachedFilesList.filter((f) => f.id !== attId);
      await axios.put(`http://localhost:5000/api/employees/${targetId}`, {
        attachedFiles: nextFiles.length > 0 ? JSON.stringify(nextFiles) : null
      });
      toast.success('Đã xóa tài liệu đính kèm!');
      fetchEmployee();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa tài liệu');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '0.95rem' }}>
        Đang tải thông tin hồ sơ cá nhân...
      </div>
    );
  }

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
            {data.fullName?.charAt(0)?.toUpperCase() || 'N'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
                {data.fullName}
              </h1>
              <span style={{
                backgroundColor: statusMeta.bg,
                color: statusMeta.color,
                border: `1px solid ${statusMeta.border}`,
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {statusMeta.label}
              </span>
            </div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
              Mã nhân sự: <strong style={{ color: '#2563EB' }}>{data.code || '—'}</strong>
              {data.position?.title ? ` • ${data.position.title}` : ''}
              {data.department?.name ? ` • ${data.department.name}` : ''}
            </p>
          </div>
        </div>

        {/* Nút Sửa hồ sơ / Lưu thay đổi */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#15803D', fontWeight: 600 }}>🟢 Tự lưu ngay: <span style={{ fontWeight: 400, color: '#334155' }}>SĐT, Email cá nhân, Địa chỉ tạm trú/hiện tại, Liên hệ khẩn cấp, Kinh nghiệm</span></span>
              <span style={{ color: '#B45309', fontWeight: 600 }}>🟡 Cần HR duyệt: <span style={{ fontWeight: 400, color: '#334155' }}>CCCD, Tôn giáo, Hôn nhân, Ngân hàng, MST, Sổ BHXH...</span></span>
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

      {/* 2. Navigation Tabs (9 Tabs đồng bộ đủ trường bên HR) */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '0.25rem',
        overflowX: 'auto'
      }}>
        {[
          { key: 'general', label: 'Lý lịch & Liên hệ', icon: <User size={15} /> },
          { key: 'job', label: 'Công việc & Tổ chức', icon: <Briefcase size={15} /> },
          { key: 'contract', label: 'Hợp đồng & Lương', icon: <FileText size={15} /> },
          { key: 'finance', label: 'Ngân hàng, Thuế & BHXH', icon: <CreditCard size={15} /> },
          { key: 'relatives', label: 'Người thân & Phụ thuộc', icon: <Users size={15} /> },
          { key: 'education', label: 'Học vấn & Kinh nghiệm', icon: <Award size={15} /> },
          { key: 'assets', label: 'Tài sản & Thiết bị', icon: <Laptop size={15} /> },
          { key: 'decisions', label: 'Quyết định & Lịch sử', icon: <FileSignature size={15} /> },
          { key: 'attachments', label: 'Hồ sơ đính kèm', icon: <Paperclip size={15} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 0.95rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              border: 'none',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#2563EB' : '#64748B',
              fontWeight: 700,
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
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

        {/* TAB 1: Tổng quan & Nhân thân + Liên hệ + Cư trú & Hộ khẩu */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Tổng quan & Nhân thân
                </h3>
                {isEditMode && (
                  <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>
                    🟡 Các trường định danh sẽ được gửi duyệt
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Họ và tên khai sinh"
                  value={isEditMode ? editFormData.fullName : data.fullName}
                  onChange={(v) => setEditFormData({ ...editFormData, fullName: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Họ và tên..."
                />
                <FormField
                  label="Mã nhân sự"
                  value={data.code || '—'}
                  isEdit={isEditMode}
                  readOnly={true}
                  badge={{ text: '🔒 Do công ty cấp', color: '#64748B', bg: '#F1F5F9' }}
                />
                <FormField
                  label="Giới tính"
                  value={isEditMode ? editFormData.gender : normalizeGenderCode(data.gender)}
                  onChange={(v) => setEditFormData({ ...editFormData, gender: v })}
                  isEdit={isEditMode}
                  type="select"
                  options={GENDER_OPTIONS}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
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
                  label="Nơi cấp CCCD"
                  value={isEditMode ? editFormData.cccdIssuePlace : (data.cccdIssuePlace || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, cccdIssuePlace: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Cục CSQLHC về TTXH..."
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
                  label="Quốc tịch"
                  value={isEditMode ? editFormData.nationality : (data.nationality || '')}
                  displayValue={!isEditMode ? (data.nationality || 'Việt Nam') : undefined}
                  onChange={(v) => setEditFormData({ ...editFormData, nationality: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Việt Nam"
                />
                <FormField
                  label="Dân tộc"
                  value={isEditMode ? editFormData.ethnicity : (data.ethnicity || '')}
                  displayValue={!isEditMode ? (data.ethnicity || 'Kinh') : undefined}
                  onChange={(v) => setEditFormData({ ...editFormData, ethnicity: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Kinh"
                />
                <FormField
                  label="Tôn giáo"
                  value={isEditMode ? editFormData.religion : (data.religion || '')}
                  displayValue={!isEditMode ? (data.religion || 'Không') : undefined}
                  onChange={(v) => setEditFormData({ ...editFormData, religion: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Không, Phật giáo, Thiên Chúa giáo..."
                />
                <FormField
                  label="Tình trạng hôn nhân"
                  value={isEditMode ? editFormData.maritalStatus : normalizeMaritalStatusCode(data.maritalStatus)}
                  onChange={(v) => setEditFormData({ ...editFormData, maritalStatus: v })}
                  isEdit={isEditMode}
                  type="select"
                  options={MARITAL_STATUS_OPTIONS}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                />
                <FormField
                  label="Trình độ học vấn cao nhất"
                  value={isEditMode ? editFormData.highestEducation : (data.highestEducation || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, highestEducation: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Đại học, Thạc sĩ..."
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Thông tin liên hệ
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Email doanh nghiệp (Công vụ)"
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
                  label="Số điện thoại di động"
                  value={isEditMode ? editFormData.phone : (data.phone || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, phone: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="0912..."
                />
                <FormField
                  label="Người liên hệ khẩn cấp"
                  value={isEditMode ? editFormData.emergencyContactName : (data.emergencyContactName || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, emergencyContactName: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="Nguyễn Văn B..."
                />
                <FormField
                  label="SĐT khẩn cấp"
                  value={isEditMode ? editFormData.emergencyContactPhone : (data.emergencyContactPhone || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, emergencyContactPhone: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="0912..."
                />
                <FormField
                  label="Mối quan hệ người liên hệ"
                  value={isEditMode ? editFormData.emergencyContactRelation : (data.emergencyContactRelation || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, emergencyContactRelation: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="Bố/Mẹ/Vợ/Chồng..."
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Cư trú & Hộ khẩu
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <FormField
                  label="Địa chỉ thường trú (theo hộ khẩu / CCCD)"
                  value={isEditMode ? editFormData.permanentAddress : (data.permanentAddress || data.address || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, permanentAddress: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Địa chỉ thường trú trên CCCD..."
                />
                <FormField
                  label="Địa chỉ tạm trú / Nơi ở hiện tại"
                  value={isEditMode ? editFormData.currentAddress : (data.temporaryAddress || data.currentAddress || data.address || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, currentAddress: v, temporaryAddress: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                  placeholder="Số nhà, đường, phường, quận..."
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
                  label="Nơi sinh"
                  value={isEditMode ? editFormData.birthPlace : (data.birthPlace || '')}
                  onChange={(v) => setEditFormData({ ...editFormData, birthPlace: v })}
                  isEdit={isEditMode}
                  badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                  placeholder="Hà Nội, Nam Định..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Phân công công việc & Tổ chức (Đầy đủ 10 trường như HR, Chỉ xem) */}
        {activeTab === 'job' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Phân công công việc & Vị trí
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                  Thông tin tổ chức do Ban Nhân sự quản lý và điều chỉnh thông qua Quyết định nhân sự
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                🔒 Dữ liệu do HR quản trị
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <ReadOnlyInfoItem label="Phòng ban trực thuộc" value={data.department?.name} />
              <ReadOnlyInfoItem
                label="Vị trí / Chức danh"
                value={
                  data.position?.title
                    ? `${data.position.title}${data.position.level ? ` (${data.position.level})` : ''}`
                    : null
                }
              />
              <ReadOnlyInfoItem label="Cấp bậc quản lý" value={getManagementRoleLabel(data.managementRole)} highlight={true} />
              <ReadOnlyInfoItem
                label="Quản lý trực tiếp"
                value={
                  data.manager?.fullName
                    ? `${data.manager.fullName}${data.manager.code ? ` (${data.manager.code})` : ''}`
                    : null
                }
              />
              <ReadOnlyInfoItem label="Trạng thái làm việc" badge={statusMeta} />
              <ReadOnlyInfoItem label="Hình thức nhân sự" value={getEmploymentTypeLabel(data.employmentType)} />
              <ReadOnlyInfoItem label="Ngày gia nhập công ty" value={formatDateVN(data.joinDate)} />
              <ReadOnlyInfoItem label="Ngày tiếp nhận chính thức" value={formatDateVN(data.officialJoinDate)} />
              <ReadOnlyInfoItem label="Thâm niên công tác" value={calculateSeniority(data.joinDate)} highlight={true} />
              <ReadOnlyInfoItem label="Địa điểm làm việc" value={data.workLocation || 'Trụ sở chính'} />
            </div>

            {(data.probationStartDate || data.probationEndDate || data.resignationDate) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                {data.probationStartDate && (
                  <ReadOnlyInfoItem label="Ngày bắt đầu thử việc" value={formatDateVN(data.probationStartDate)} />
                )}
                {data.probationEndDate && (
                  <ReadOnlyInfoItem label="Ngày kết thúc thử việc" value={formatDateVN(data.probationEndDate)} />
                )}
                {data.resignationDate && (
                  <ReadOnlyInfoItem label="Ngày nghỉ việc / hiệu lực" value={formatDateVN(data.resignationDate)} />
                )}
                {data.resignationReason && (
                  <ReadOnlyInfoItem label="Lý do nghỉ việc" value={data.resignationReason} />
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Hợp đồng lao động & Lương (Đồng bộ 100% với HR + modal chi tiết) */}
        {activeTab === 'contract' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Hợp đồng lao động & Lương
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                  Danh sách toàn bộ hợp đồng lao động, mức lương hợp đồng và phụ lục đã ký kết ({data.contracts?.length || 0} hợp đồng)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSalary((prev) => !prev)}
                className="btn btn-outline"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  color: showSalary ? '#047857' : '#64748B',
                  borderColor: '#CBD5E1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer'
                }}
                title="Ẩn/Hiện mức lương bảo mật theo Nghị định 13/2023/NĐ-CP"
              >
                {showSalary ? <EyeOff size={14} /> : <Eye size={14} />}
                {showSalary ? 'Ẩn mức lương' : 'Hiện mức lương'}
              </button>
            </div>

            {(!data.contracts || data.contracts.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                Chưa có hợp đồng lao động nào được ghi nhận trên hệ thống.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.contracts.map((c) => {
                  const contractStatus = getContractStatusMeta(c.status, c.endDate);
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: '1.15rem 1.35rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '0.75rem',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                            {c.contractNumber || `HĐ-${String(c.id).slice(0, 8).toUpperCase()}`} — {getContractTypeName(c.contractType)}
                          </strong>
                          {c.appendices?.length > 0 && (
                            <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
                              {c.appendices.length} phụ lục
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                          Thời hạn: <strong>{formatDateVN(c.startDate)}</strong> ➔ <strong>{c.endDate ? formatDateVN(c.endDate) : 'Vô thời hạn'}</strong>
                          {c.workLocation ? ` • Nơi làm việc: ${c.workLocation}` : ''}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>
                            Lương cơ bản: {showSalary ? `${Number(c.baseSalary || 0).toLocaleString('vi-VN')} VNĐ/tháng` : '••••••••• VNĐ/tháng'}
                          </span>
                          {Number(c.allowance || 0) > 0 && (
                            <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.8rem' }}>
                              (Phụ cấp: {showSalary ? `${Number(c.allowance).toLocaleString('vi-VN')} VNĐ` : '•••••• VNĐ'})
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: contractStatus.bg,
                            color: contractStatus.color,
                            border: `1px solid ${contractStatus.border}`,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {contractStatus.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingContract(c)}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          Chi tiết HĐ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Tài khoản lương, Thuế & BHXH (7/7 trường) */}
        {activeTab === 'finance' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Ngân hàng, Thuế & Bảo hiểm bắt buộc
              </h3>
              {isEditMode && (
                <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>
                  🟡 Thay đổi thông tin ngân hàng / MST / BHXH cần HR duyệt
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <FormField
                label="Số tài khoản nhận lương"
                value={isEditMode ? editFormData.bankAccount : (data.bankAccount || '')}
                onChange={(v) => setEditFormData({ ...editFormData, bankAccount: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="1903..."
              />
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
                label="Tên chủ tài khoản"
                value={isEditMode ? editFormData.bankAccountHolder : (data.bankAccountHolder || '')}
                displayValue={!isEditMode ? (data.bankAccountHolder || data.fullName || '') : undefined}
                onChange={(v) => setEditFormData({ ...editFormData, bankAccountHolder: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder={data.fullName || 'NGUYEN VAN A...'}
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
                label="Số sổ BHXH"
                value={isEditMode ? editFormData.socialInsurance : (data.socialInsurance || '')}
                onChange={(v) => setEditFormData({ ...editFormData, socialInsurance: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="7912..."
              />
              <FormField
                label="Mã thẻ BHYT"
                value={isEditMode ? editFormData.healthInsurance : (data.healthInsurance || '')}
                onChange={(v) => setEditFormData({ ...editFormData, healthInsurance: v })}
                isEdit={isEditMode}
                badge={{ text: '🟡 Cần HR duyệt', color: '#B45309', bg: '#FEF3C7' }}
                placeholder="DN479..."
              />
            </div>
          </div>
        )}

        {/* TAB 5: Người thân & Phụ thuộc */}
        {activeTab === 'relatives' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Người thân & Người phụ thuộc
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
                <Plus size={16} /> Thêm người thân / phụ thuộc
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
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>
                          <div>{r.fullName}</div>
                          {r.proofDocument && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>HS: {r.proofDocument}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{r.relation || r.relationship}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{formatDateVN(r.dateOfBirth)}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.cccd || r.idNumber || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.taxCode || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ backgroundColor: r.isDependent ? '#ECFDF5' : '#F1F5F9', color: r.isDependent ? '#059669' : '#64748B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {r.isDependent ? 'Đã đăng ký' : 'Không'}
                          </span>
                          {r.isDependent && (r.taxDeductionStart || r.taxDeductionEnd) && (
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
                              {formatDateVN(r.taxDeductionStart)} ➔ {r.taxDeductionEnd ? formatDateVN(r.taxDeductionEnd) : 'Chưa kết thúc'}
                            </div>
                          )}
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

        {/* TAB 6: Học vấn, Bằng cấp, Chứng chỉ, Đào tạo & Kinh nghiệm */}
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

            {/* Bằng cấp học vấn */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
                  Bằng cấp học vấn ({data.degrees?.length || 0})
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
                  <Plus size={15} /> Thêm bằng cấp
                </button>
              </div>

              {(!data.degrees || data.degrees.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Chưa có văn bằng nào được ghi nhận. Bấm "Thêm bằng cấp" để khai báo văn bằng của bạn.
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

            {/* Chứng chỉ chuyên môn */}
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
                  <Plus size={15} /> Thêm chứng chỉ
                </button>
              </div>

              {(!data.certificates || data.certificates.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Chưa có chứng chỉ nào được ghi nhận. Bấm "Thêm chứng chỉ" để tải lên chứng chỉ nghề nghiệp của bạn.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {data.certificates.map((c, i) => (
                    <div key={c.id || i} style={{ padding: '1rem 1.25rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.95rem' }}>{c.name}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#059669', display: 'block', marginTop: '2px', fontWeight: 600 }}>Cấp bởi: {c.issuedBy || '—'}</span>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginTop: '4px' }}>
                          Ngày cấp: {formatDateVN(c.issueDate || c.issuedDate)}
                          {c.expiryDate ? ` • Hết hạn: ${formatDateVN(c.expiryDate)}` : ''}
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

            {/* Kinh nghiệm làm việc trước đây (đồng bộ trực tiếp cột workExperience trong Employee) */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Building2 size={18} color="#2563EB" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  Kinh nghiệm làm việc trước đây
                </h4>
              </div>
              <FormField
                label="Tóm tắt quá trình công tác & Kinh nghiệm tích lũy"
                value={isEditMode ? editFormData.workExperience : (data.workExperience || '')}
                onChange={(v) => setEditFormData({ ...editFormData, workExperience: v })}
                isEdit={isEditMode}
                type="textarea"
                rows={4}
                badge={{ text: '🟢 Lưu ngay', color: '#16A34A', bg: '#DCFCE7' }}
                placeholder="Mô tả các công ty, chức vụ và dự án đã từng làm việc trước khi gia nhập doanh nghiệp..."
              />
            </div>

            {/* Đào tạo nội bộ */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <GraduationCap size={18} color="#2563EB" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  Quá trình đào tạo nội bộ
                </h4>
              </div>
              {(!data.trainings || data.trainings.length === 0) ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.85rem' }}>
                  Chưa có khóa đào tạo nội bộ nào được ghi nhận cho hồ sơ này.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.trainings.map((t, idx) => (
                    <div key={t.id || idx} style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem', backgroundColor: '#F8FAFC' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{t.courseName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                        {formatDateVN(t.startDate)} ➔ {formatDateVN(t.endDate)}
                        {t.decisionNumber ? ` • Quyết định: ${t.decisionNumber}` : ''}
                        {t.result ? ` • Kết quả: ${t.result}` : ''}
                      </div>
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
                Tài sản & Thiết bị bàn giao
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Danh sách trang thiết bị làm việc đang được giao hoặc đã thu hồi từ hồ sơ của bạn
              </p>
            </div>

            {(!data.assetAssignments || data.assetAssignments.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px dashed #CBD5E1' }}>
                <Laptop size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                  Bạn chưa có tài sản hoặc thiết bị nào được bàn giao
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                  Khi phòng IT/Hành chính cấp thiết bị, thông tin sẽ hiển thị tại đây
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
                      <th style={{ padding: '12px 16px' }}>Tình trạng / Biên bản</th>
                      <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assetAssignments.map((a, i) => {
                      const assetStatus = getAssetAssignmentStatusMeta(a);
                      return (
                        <tr key={a.id || i} style={{ borderTop: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB' }}>{a.asset?.code || `TS-${i + 1}`}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{a.asset?.name || 'Thiết bị làm việc'}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{a.asset?.serialNumber || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>
                            <div>{formatDateVN(a.assignedDate)}</div>
                            {a.returnedDate && (
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Thu hồi: {formatDateVN(a.returnedDate)}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>
                            <div>{a.conditionOnAssign || '—'}</div>
                            {a.handoverDocCode && (
                              <div style={{ color: '#2563EB', fontSize: '0.75rem' }}>BB: {a.handoverDocCode}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              backgroundColor: assetStatus.bg,
                              color: assetStatus.color,
                              border: `1px solid ${assetStatus.border}`,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {assetStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: Quá trình công tác nội bộ & Quyết định */}
        {activeTab === 'decisions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Quyết định Nhân sự của bạn
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                  Các quyết định chính thức do Ban Giám đốc ban hành (Bổ nhiệm, Điều chuyển, Tăng lương, Khen thưởng...)
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
                        <th style={{ padding: '12px 16px' }}>Cấp ký</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.decisions.map((d, i) => (
                        <tr key={d.id || i} style={{ borderTop: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB' }}>{d.decisionNumber || `QD-${i + 1}`}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {getDecisionTypeLabel(d.type)}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 500 }}>{d.title}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{formatDateVN(d.effectiveDate)}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{d.signBy || 'Ban Giám Đốc'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setViewingDecision(d)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#334155',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Xem văn bản
                            </button>
                          </td>
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
                          <td style={{ padding: '12px 16px', color: '#64748B' }}>{formatDateVN(h.effectiveDate)}</td>
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

        {/* TAB 9: Hồ sơ & Tài liệu đính kèm (đồng bộ cột attachedFiles) */}
        {activeTab === 'attachments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Hồ sơ & Tài liệu đính kèm ({attachedFilesList.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Lưu trữ bản sao CCCD, Sơ yếu lý lịch, Giấy khám sức khỏe và các văn bằng chứng từ nhân sự
              </p>
            </div>

            {attachedFilesList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {attachedFilesList.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', wordBreak: 'break-word' }}>{att.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>
                        Phân loại: <strong style={{ color: '#2563EB' }}>{att.category}</strong>
                        {att.uploadedAt ? ` • Tải lên: ${formatDateVN(att.uploadedAt)}` : ''}
                        {att.fileSize ? ` • ${(att.fileSize / 1024).toFixed(0)} KB` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ title: `${att.name} (${att.category})`, url: att.fileUrl })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #BFDBFE',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Eye size={14} /> Xem tài liệu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
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
                        title="Xóa tài liệu"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '12px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#F8FAFC'
            }}>
              <FolderOpen size={32} color="#3B82F6" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1E293B' }}>
                  Tải lên hồ sơ nhân sự cá nhân
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  Hỗ trợ ảnh chụp (PNG, JPG), file PDF hoặc tài liệu Word (Tối đa 10MB)
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                <select
                  value={attachmentCategory}
                  onChange={(e) => setAttachmentCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="CCCD / Hộ chiếu">CCCD / Hộ chiếu</option>
                  <option value="Sơ yếu lý lịch (SYLL)">Sơ yếu lý lịch (SYLL)</option>
                  <option value="Giấy khám sức khỏe">Giấy khám sức khỏe</option>
                  <option value="Bản sao bằng cấp">Bản sao bằng cấp</option>
                  <option value="Tài liệu khác">Tài liệu khác</option>
                </select>
                <label style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isUploadingAttachment ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <UploadCloud size={16} />
                  {isUploadingAttachment ? 'Đang tải lên...' : 'Chọn & Tải tệp lên'}
                  <input
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    disabled={isUploadingAttachment}
                    style={{ display: 'none' }}
                    onChange={handleUploadAttachment}
                  />
                </label>
              </div>
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
                    <option value="Anh/Chị/Em">Anh / Chị / Em</option>
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
                <input type="text" required placeholder="VD: Cử nhân, Kỹ sư, Thạc sĩ..." value={degreeForm.degreeName} onChange={(e) => setDegreeForm({ ...degreeForm, degreeName: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Chuyên ngành đào tạo *</label>
                <input type="text" required placeholder="VD: Khoa học máy tính, Công nghệ thông tin..." value={degreeForm.major} onChange={(e) => setDegreeForm({ ...degreeForm, major: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Cơ sở / Trường đào tạo *</label>
                <input type="text" required placeholder="VD: Đại học Bách Khoa..." value={degreeForm.institution} onChange={(e) => setDegreeForm({ ...degreeForm, institution: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Năm tốt nghiệp</label>
                  <input type="number" min="1980" max="2040" value={degreeForm.gradYear} onChange={(e) => setDegreeForm({ ...degreeForm, gradYear: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Xếp loại tốt nghiệp</label>
                  <select value={degreeForm.classification} onChange={(e) => setDegreeForm({ ...degreeForm, classification: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}>
                    <option value="Xuất sắc">Xuất sắc</option>
                    <option value="Giỏi">Giỏi</option>
                    <option value="Khá">Khá</option>
                    <option value="Trung bình">Trung bình</option>
                  </select>
                </div>
              </div>

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
                        onClick={() => setDegreeForm((prev) => ({ ...prev, fileUrl: '' }))}
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
                      onChange={(e) => handleFileUpload(e, (base64) => setDegreeForm((prev) => ({ ...prev, fileUrl: base64 })))}
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
                <input type="text" required placeholder="VD: AWS Certified, PMP, IELTS, TOEIC..." value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Đơn vị cấp *</label>
                <input type="text" required placeholder="VD: Amazon Web Services, British Council, PMI..." value={certForm.issuedBy} onChange={(e) => setCertForm({ ...certForm, issuedBy: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày cấp</label>
                  <input type="date" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ngày hết hạn (Nếu có)</label>
                  <input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

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
                        onClick={() => setCertForm((prev) => ({ ...prev, fileUrl: '' }))}
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
                    gap: '6px'
                  }}>
                    <UploadCloud size={24} color="#3B82F6" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                      Bấm vào đây để chọn ảnh chứng chỉ
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Hỗ trợ PNG, JPG, JPEG hoặc PDF (Tối đa 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, (base64) => setCertForm((prev) => ({ ...prev, fileUrl: base64 })))}
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
      {/* MODAL 4: CHI TIẾT HỢP ĐỒNG LAO ĐỘNG & PHỤ LỤC            */}
      {/* ======================================================== */}
      {viewingContract && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '680px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Chi tiết Hợp đồng: {viewingContract.contractNumber || viewingContract.id}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{getContractTypeName(viewingContract.contractType)}</span>
              </div>
              <button onClick={() => setViewingContract(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <ReadOnlyInfoItem label="Số hợp đồng" value={viewingContract.contractNumber} highlight={true} />
                <ReadOnlyInfoItem label="Loại hợp đồng" value={getContractTypeName(viewingContract.contractType)} />
                <ReadOnlyInfoItem label="Trạng thái" badge={getContractStatusMeta(viewingContract.status, viewingContract.endDate)} />
                <ReadOnlyInfoItem label="Ngày bắt đầu" value={formatDateVN(viewingContract.startDate)} />
                <ReadOnlyInfoItem label="Ngày kết thúc" value={viewingContract.endDate ? formatDateVN(viewingContract.endDate) : 'Vô thời hạn'} />
                <ReadOnlyInfoItem label="Địa điểm làm việc" value={viewingContract.workLocation || data.workLocation || 'Trụ sở chính'} />
                <ReadOnlyInfoItem label="Người đại diện ký" value={viewingContract.signBy || 'Ban Giám Đốc'} />
                <ReadOnlyInfoItem label="Ngày ký" value={formatDateVN(viewingContract.signDate)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>Thông tin thu nhập theo hợp đồng</strong>
                <button
                  type="button"
                  onClick={() => setShowSalary((prev) => !prev)}
                  style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showSalary ? 'Ẩn số tiền' : 'Hiện số tiền'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem', borderRadius: '10px', border: '1px solid #DCFCE7', backgroundColor: '#F0FDF4' }}>
                <ReadOnlyInfoItem
                  label="Lương cơ bản"
                  value={showSalary ? `${Number(viewingContract.baseSalary || 0).toLocaleString('vi-VN')} VNĐ` : '••••••••• VNĐ'}
                />
                <ReadOnlyInfoItem
                  label="Phụ cấp hợp đồng"
                  value={showSalary ? `${Number(viewingContract.allowance || 0).toLocaleString('vi-VN')} VNĐ` : '•••••• VNĐ'}
                />
                <ReadOnlyInfoItem
                  label="Lương đóng BHXH"
                  value={
                    viewingContract.insuranceSalary
                      ? (showSalary ? `${Number(viewingContract.insuranceSalary).toLocaleString('vi-VN')} VNĐ` : '••••••••• VNĐ')
                      : 'Theo lương cơ bản'
                  }
                />
                <ReadOnlyInfoItem
                  label="Hình thức chi trả"
                  value={viewingContract.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản ngân hàng'}
                />
              </div>

              {viewingContract.appendixNote && (
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>Ghi chú / Điều khoản bổ sung</span>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {viewingContract.appendixNote}
                  </div>
                </div>
              )}

              {viewingContract.appendices && viewingContract.appendices.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                    Phụ lục hợp đồng ({viewingContract.appendices.length})
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {viewingContract.appendices.map((app) => (
                      <div key={app.id} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{app.appendixNumber} — {app.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                          Hiệu lực: {formatDateVN(app.effectiveDate)}
                          {app.newSalary ? ` • Lương mới: ${showSalary ? `${Number(app.newSalary).toLocaleString('vi-VN')} VNĐ` : '••••••••• VNĐ'}` : ''}
                        </div>
                        {app.content && <div style={{ marginTop: '4px', color: '#475569' }}>{app.content}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parseContractFiles(viewingContract.fileUrl).length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                    Bản scan hợp đồng đính kèm
                  </strong>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {parseContractFiles(viewingContract.fileUrl).map((fileUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewImage({ title: `Hợp đồng ${viewingContract.contractNumber || ''} - Tệp ${idx + 1}`, url: fileUrl })}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Eye size={14} /> Xem bản scan #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CHI TIẾT QUYẾT ĐỊNH NHÂN SỰ                     */}
      {/* ======================================================== */}
      {viewingDecision && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '620px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  {viewingDecision.decisionNumber} — {viewingDecision.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>{getDecisionTypeLabel(viewingDecision.type)}</span>
              </div>
              <button onClick={() => setViewingDecision(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <ReadOnlyInfoItem label="Số quyết định" value={viewingDecision.decisionNumber} highlight={true} />
                <ReadOnlyInfoItem label="Loại quyết định" value={getDecisionTypeLabel(viewingDecision.type)} />
                <ReadOnlyInfoItem label="Ngày hiệu lực" value={formatDateVN(viewingDecision.effectiveDate)} />
                <ReadOnlyInfoItem label="Cấp ký" value={viewingDecision.signBy || 'Ban Giám Đốc'} />
                <ReadOnlyInfoItem label="Ngày ký" value={formatDateVN(viewingDecision.signDate)} />
                <ReadOnlyInfoItem label="Trạng thái" value={viewingDecision.status} />
                {viewingDecision.newDepartment?.name && (
                  <ReadOnlyInfoItem label="Đơn vị tiếp nhận mới" value={viewingDecision.newDepartment.name} />
                )}
                {viewingDecision.newPosition?.title && (
                  <ReadOnlyInfoItem label="Chức danh mới" value={viewingDecision.newPosition.title} />
                )}
              </div>

              {(viewingDecision.oldSalary || viewingDecision.newSalary || viewingDecision.rewardAmount) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem', borderRadius: '10px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF' }}>
                  {viewingDecision.oldSalary && (
                    <ReadOnlyInfoItem label="Mức lương cũ" value={`${Number(viewingDecision.oldSalary).toLocaleString('vi-VN')} VNĐ`} />
                  )}
                  {viewingDecision.newSalary && (
                    <ReadOnlyInfoItem label="Mức lương mới" value={`${Number(viewingDecision.newSalary).toLocaleString('vi-VN')} VNĐ`} highlight={true} />
                  )}
                  {viewingDecision.rewardAmount && (
                    <ReadOnlyInfoItem label="Mức thưởng" value={`${Number(viewingDecision.rewardAmount).toLocaleString('vi-VN')} VNĐ`} highlight={true} />
                  )}
                </div>
              )}

              {viewingDecision.reason && (
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>Nội dung / Lý do ban hành</span>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {viewingDecision.reason}
                  </div>
                </div>
              )}

              {viewingDecision.fileUrl && (
                <div>
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ title: `Văn bản: ${viewingDecision.decisionNumber}`, url: viewingDecision.fileUrl })}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} /> Xem bản scan văn bản quyết định
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL 6: XEM ẢNH / PDF SCAN PHÓNG TO                      */}
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
              {String(previewImage.url).startsWith('data:application/pdf') ? (
                <iframe src={previewImage.url} title={previewImage.title} style={{ width: '100%', height: '70vh', border: 'none', backgroundColor: '#FFF' }} />
              ) : String(previewImage.url).startsWith('data:image/') || !String(previewImage.url).startsWith('data:') ? (
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#CBD5E1', padding: '2rem' }}>
                  <p style={{ marginBottom: '12px' }}>Trình duyệt không hỗ trợ xem trực tiếp định dạng tệp này.</p>
                  <a href={previewImage.url} download className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    Tải xuống tài liệu
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
