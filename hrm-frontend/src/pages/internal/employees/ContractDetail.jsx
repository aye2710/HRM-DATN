import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, FileText, Briefcase, Calendar, DollarSign, Upload, 
  Trash2, ExternalLink, Eye, CheckCircle2, AlertTriangle, Clock, 
  Layers, User, Building, ShieldCheck, X, Plus, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

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

const isPdfFile = (url) => {
  if (!url) return false;
  return url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
};

export const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState(null);

  // States Ký Hợp đồng mới
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signMode, setSignMode] = useState('RENEW'); // 'PROBATION_TO_OFFICIAL', 'RENEW_OR_NEW'
  const [formData, setFormData] = useState({
    contractType: 'OFFICIAL_1Y',
    contractNumber: '',
    baseSalary: '',
    allowance: 0,
    insuranceSalary: '',
    paymentMethod: 'BANK_TRANSFER',
    startDate: '',
    endDate: '',
    signBy: 'Ban Giám Đốc',
    signDate: new Date().toISOString().split('T')[0],
    workLocation: 'Trụ sở chính',
    appendixNote: '',
    evaluationResult: 'NONE', // 'PASSED', 'FAILED', 'NONE'
    fileUrls: []
  });

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/employees/${id}`);
      setEmployee(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy thông tin nhân viên hoặc hồ sơ hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const calculateDefaultEndDate = (type, startStr) => {
    if (!startStr) return '';
    if (type === 'INDEFINITE') return '';
    const d = new Date(startStr);
    if (isNaN(d.getTime())) return '';
    if (type === 'PROBATION') {
      d.setDate(d.getDate() + 60);
      return d.toISOString().split('T')[0];
    }
    if (type === 'OFFICIAL_1Y') {
      d.setFullYear(d.getFullYear() + 1);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
    if (type === 'INTERNSHIP') {
      d.setMonth(d.getMonth() + 3);
      return d.toISOString().split('T')[0];
    }
    return '';
  };

  const getDefiniteContractCount = () => {
    if (!employee?.contracts) return 0;
    return employee.contracts.filter(c => c.contractType === 'OFFICIAL_1Y').length;
  };

  const openSignModal = (mode = 'RENEW_OR_NEW') => {
    if (!employee) return;
    setSignMode(mode);
    const definiteCount = getDefiniteContractCount();
    const isProbationEmp = employee.status === 'PROBATION' || employee.status === 'INTERNSHIP';
    
    // Tìm hợp đồng mới nhất
    const latestContract = employee.contracts && employee.contracts.length > 0 ? employee.contracts[0] : null;
    
    let initType = 'OFFICIAL_1Y';
    if (definiteCount >= 2) {
      initType = 'INDEFINITE';
    } else if (isProbationEmp) {
      initType = 'OFFICIAL_1Y';
    }

    let startStr = new Date().toISOString().split('T')[0];
    if (latestContract?.endDate) {
      const nextDay = new Date(latestContract.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      startStr = nextDay.toISOString().split('T')[0];
    }

    const defaultEnd = calculateDefaultEndDate(initType, startStr);
    const year = new Date().getFullYear();
    const genNumber = `HĐLĐ-${year}/${Math.floor(100 + Math.random() * 900)}/${employee.code || 'NV'}`;

    const defaultSalary = latestContract?.baseSalary ? Number(latestContract.baseSalary) : (employee.salary ? Number(employee.salary) : 10000000);
    const defaultAllowance = latestContract?.allowance ? Number(latestContract.allowance) : 0;
    const defaultInsurance = latestContract?.insuranceSalary ? Number(latestContract.insuranceSalary) : defaultSalary;

    setFormData({
      contractType: initType,
      contractNumber: genNumber,
      baseSalary: defaultSalary,
      allowance: defaultAllowance,
      insuranceSalary: defaultInsurance,
      paymentMethod: latestContract?.paymentMethod || 'BANK_TRANSFER',
      startDate: startStr,
      endDate: defaultEnd,
      signBy: latestContract?.signBy || 'Ban Giám Đốc',
      signDate: new Date().toISOString().split('T')[0],
      workLocation: latestContract?.workLocation || employee.workLocation || 'Trụ sở chính',
      appendixNote: '',
      evaluationResult: isProbationEmp ? 'PASSED' : 'NONE',
      fileUrls: []
    });
    setShowSignModal(true);
  };

  // Tự động mở modal nếu có query param ?action=sign
  useEffect(() => {
    if (employee) {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('action') === 'sign') {
        const isProb = employee.status === 'PROBATION' || employee.status === 'INTERNSHIP';
        openSignModal(isProb ? 'PROBATION_TO_OFFICIAL' : 'RENEW_OR_NEW');
      }
    }
  }, [employee, location.search]);

  const handleContractTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      contractType: newType,
      endDate: calculateDefaultEndDate(newType, prev.startDate)
    }));
  };

  const handleStartDateChange = (newStart) => {
    setFormData(prev => ({
      ...prev,
      startDate: newStart,
      endDate: calculateDefaultEndDate(prev.contractType, newStart)
    }));
  };

  const handleModalFileUpload = (files) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    const valid = fileArr.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (valid.length === 0) {
      return toast.error('Vui lòng chọn ảnh scan hoặc tệp PDF!');
    }

    const t = toast.loading(`Đang xử lý ${valid.length} tệp...`);
    Promise.all(valid.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    }))).then(newUrls => {
      toast.dismiss(t);
      setFormData(prev => ({
        ...prev,
        fileUrls: [...prev.fileUrls, ...newUrls]
      }));
      toast.success(`Đã thêm ${newUrls.length} tệp đính kèm.`);
    }).catch(() => {
      toast.dismiss(t);
      toast.error('Lỗi khi đọc tệp!');
    });
  };

  const handleSubmitSignContract = async (e) => {
    e.preventDefault();
    if (!formData.startDate) {
      return toast.error('Vui lòng chọn ngày bắt đầu hợp đồng!');
    }
    if (formData.contractType !== 'INDEFINITE' && !formData.endDate) {
      return toast.error('Vui lòng chọn ngày kết thúc hợp đồng!');
    }
    if (!formData.baseSalary || Number(formData.baseSalary) <= 0) {
      return toast.error('Vui lòng nhập mức lương cơ bản hợp lệ!');
    }
    
    setIsSubmitting(true);
    const t = toast.loading('Đang khởi tạo và ký kết hợp đồng...');
    try {
      await axios.post('http://localhost:5000/api/contracts', {
        employeeId: employee.id,
        contractNumber: formData.contractNumber,
        contractType: formData.contractType,
        baseSalary: Number(formData.baseSalary),
        allowance: Number(formData.allowance || 0),
        insuranceSalary: Number(formData.insuranceSalary || formData.baseSalary),
        paymentMethod: formData.paymentMethod,
        startDate: formData.startDate,
        endDate: formData.contractType === 'INDEFINITE' ? null : formData.endDate,
        signBy: formData.signBy,
        signDate: formData.signDate,
        workLocation: formData.workLocation,
        appendixNote: formData.appendixNote,
        evaluationResult: formData.evaluationResult,
        fileUrl: formData.fileUrls.length > 0 ? JSON.stringify(formData.fileUrls) : null
      });

      toast.dismiss(t);
      toast.success(
        formData.evaluationResult === 'PASSED'
          ? 'Ký HĐ chính thức thành công! Nhân viên đã được nâng trạng thái sang CHÍNH THỨC.'
          : 'Ký hợp đồng thành công!'
      );
      setShowSignModal(false);
      fetchEmployeeData();
      navigate(`/internal/employees/contracts/${employee.id}`, { replace: true });
    } catch (err) {
      toast.dismiss(t);
      const errMsg = err.response?.data?.error || 'Lỗi khi ký hợp đồng!';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContractTypeName = (type) => {
    switch (type) {
      case 'INTERNSHIP': return 'Thực tập sinh';
      case 'PROBATION': return 'Thử việc';
      case 'OFFICIAL_1Y': return 'Có thời hạn (1 năm)';
      case 'INDEFINITE': return 'Không xác định thời hạn';
      default: return type || 'Chưa xác định';
    }
  };

  const formatContractPeriod = (contract) => {
    if (!contract) return '—';
    const start = new Date(contract.startDate).toLocaleDateString('vi-VN');
    if (contract.contractType === 'INDEFINITE') {
      return `${start} ➔ Không thời hạn`;
    }
    if (contract.endDate) {
      return `${start} ➔ ${new Date(contract.endDate).toLocaleDateString('vi-VN')}`;
    }
    return `${start} ➔ Chưa có ngày kết thúc`;
  };

  const getContractStatusBadge = (status, endDate, contractType) => {
    if (contractType === 'INDEFINITE') {
      return (
        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
          Không thời hạn
        </span>
      );
    }

    if (endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
      
      if (diffDays < -30) {
        return (
          <span className="badge" title="Quá 30 ngày kể từ ngày hết hạn (K2 Đ20 BLLĐ 2019)" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            Quá hạn {Math.abs(diffDays)} ngày (Vô thời hạn)
          </span>
        );
      }
      if (diffDays < 0) {
        return (
          <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            Quá hạn {Math.abs(diffDays)} ngày
          </span>
        );
      }
      if (diffDays === 0) {
        return (
          <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            Hết hạn hôm nay
          </span>
        );
      }
      if (diffDays <= 15) {
        return (
          <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            Còn {diffDays} ngày (Sắp hết hạn)
          </span>
        );
      }
      if (diffDays <= 30) {
        return (
          <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            Còn {diffDays} ngày
          </span>
        );
      }
    }

    switch (status) {
      case 'ACTIVE': return <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Hiệu lực</span>;
      case 'EXPIRED': return <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Hết hạn</span>;
      case 'TERMINATED': return <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Đã chấm dứt</span>;
      default: return <span className="badge badge-purple">{status}</span>;
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

  const handleUploadContractFiles = async (contractId, fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (validFiles.length === 0) {
      return toast.error('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP) hoặc tài liệu PDF!');
    }

    const t = toast.loading(`Đang tải ${validFiles.length} tệp...`);
    try {
      const readPromises = validFiles.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      }));

      const newUrls = await Promise.all(readPromises);
      const curContract = employee?.contracts?.find(c => c.id === contractId);
      const existingUrls = curContract ? parseContractFiles(curContract.fileUrl) : [];
      const combinedUrls = [...existingUrls, ...newUrls];

      await axios.patch(`http://localhost:5000/api/contracts/${contractId}`, {
        fileUrl: JSON.stringify(combinedUrls)
      });

      toast.dismiss(t);
      toast.success(`Đã lưu ${combinedUrls.length} tệp hợp đồng!`);
      fetchEmployeeData();

      if (viewingFile && viewingFile.contractId === contractId) {
        setViewingFile({
          ...viewingFile,
          urls: combinedUrls,
          currentIndex: combinedUrls.length - 1
        });
      }
    } catch (err) {
      toast.dismiss(t);
      toast.error('Lỗi khi tải tệp hợp đồng!');
    }
  };

  const handleDeleteContractPage = async (contractId, pageIdx) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tệp/trang ${pageIdx + 1}?`)) return;
    const curContract = employee?.contracts?.find(c => c.id === contractId);
    if (!curContract) return;

    const urls = parseContractFiles(curContract.fileUrl);
    const updatedUrls = urls.filter((_, idx) => idx !== pageIdx);
    const t = toast.loading('Đang xóa tệp...');
    try {
      await axios.patch(`http://localhost:5000/api/contracts/${contractId}`, {
        fileUrl: updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : null
      });
      toast.dismiss(t);
      toast.success('Đã xóa thành công!');
      fetchEmployeeData();

      if (updatedUrls.length === 0) {
        setViewingFile(null);
      } else {
        setViewingFile({
          ...viewingFile,
          urls: updatedUrls,
          currentIndex: Math.max(0, Math.min(pageIdx, updatedUrls.length - 1))
        });
      }
    } catch (err) {
      toast.dismiss(t);
      toast.error('Lỗi khi xóa tệp!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Đang tải dữ liệu lịch sử hợp đồng nhân viên...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/internal/employees/contracts')} className="btn btn-outline mb-4">
          <ChevronLeft size={16} className="mr-1" /> Quay lại danh sách Hợp đồng
        </button>
        <div className="card text-center py-12 text-slate-500">
          Không tìm thấy hồ sơ nhân viên này.
        </div>
      </div>
    );
  }

  const definiteCount = getDefiniteContractCount();

  return (
    <div className="flex-col gap-5 animate-fade-in" style={{ padding: '0.5rem 0.5rem 2rem 0.5rem' }}>
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/internal/employees/contracts')} 
            className="btn btn-outline" 
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <ChevronLeft size={16} /> Danh sách HĐ
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#0f172a' }}>
              Lịch sử Hợp đồng Lao động: {employee.fullName}
            </h1>
            <p className="text-muted text-xs mt-0.5" style={{ margin: 0, color: '#64748b' }}>
              Mã NV: <strong className="text-blue-600">{employee.code}</strong> • {employee.department?.name || 'Phòng ban'} • {employee.position?.title || 'Chức vụ'}
            </p>
          </div>
        </div>

        {/* Trạng thái nhân sự badge & Nút Ký hợp đồng thông minh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Trạng thái:</span>
            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '8px', fontWeight: 600 }}>
              {getEmployeeStatusName(employee.status)}
            </span>
          </div>

          {employee.status === 'PROBATION' || employee.status === 'INTERNSHIP' ? (
            <button
              onClick={() => openSignModal('PROBATION_TO_OFFICIAL')}
              className="btn btn-primary"
              style={{
                backgroundColor: '#16a34a',
                borderColor: '#16a34a',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
              }}
            >
              <CheckCircle2 size={16} /> Ký HĐ tiếp nhận chính thức
            </button>
          ) : employee.status !== 'RESIGNED' ? (
            <button
              onClick={() => openSignModal('RENEW_OR_NEW')}
              className="btn btn-primary"
              style={{
                backgroundColor: '#2563eb',
                borderColor: '#2563eb',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Plus size={16} /> {definiteCount >= 2 ? 'Ký HĐ Vô thời hạn (Lần 3)' : 'Tái ký / Ký HĐ mới'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Thông tin tổng quan hồ sơ nhân sự (Tách từng dòng rõ ràng, không dồn hàng ngang) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <User size={18} color="#2563eb" />
          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
            Thông tin Nhân sự & Hạn ngạch Hợp đồng
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '4px 48px' }}>
          {/* Cột trái: Thông tin định danh & vị trí */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '160px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Họ và tên:</span>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{employee.fullName}</strong>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '160px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Mã nhân viên:</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}>{employee.code}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '160px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Phòng ban:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{employee.department?.name || '—'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '160px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Chức vụ / Vị trí:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{employee.position?.title || '—'}</span>
            </div>
          </div>

          {/* Cột phải: Thông tin hợp đồng & trạng thái */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '190px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Ngày gia nhập công ty:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('vi-VN') : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '190px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Trạng thái nhân sự:</span>
              <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}>
                {getEmployeeStatusName(employee.status)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '190px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Số lần ký HĐ có thời hạn:</span>
              <strong style={{ fontSize: '0.85rem', color: definiteCount >= 2 ? '#b45309' : '#0f172a' }}>
                {definiteCount} / 2 lần {definiteCount >= 2 ? '(Đã hết lượt có thời hạn)' : ''}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ width: '190px', fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>Tổng số hợp đồng đã lưu:</span>
              <span className="badge badge-purple" style={{ fontSize: '0.78rem', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                {employee.contracts?.length || 0} hợp đồng
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách toàn bộ Hợp đồng của nhân sự qua các thời kỳ */}
      <div className="flex-col gap-4">
        <h2 style={{ margin: '8px 0 0 0', fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#3b82f6" /> Danh sách Hợp đồng & Phụ lục ({employee.contracts?.length || 0})
        </h2>

        {!employee.contracts || employee.contracts.length === 0 ? (
          <div className="card text-center py-12 text-slate-400" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            Nhân viên này chưa có bản ghi hợp đồng nào trong hệ thống.
          </div>
        ) : (
          <div className="flex-col gap-4">
            {employee.contracts.map((contract, index) => {
              const contractPages = parseContractFiles(contract.fileUrl);
              const appendices = contract.appendices || [];

              return (
                <div 
                  key={contract.id} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    padding: '20px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
                  }}
                >
                  {/* Header Hợp đồng */}
                  <div className="flex justify-between items-start mb-4" style={{ flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={18} color="#2563eb" />
                        <h3 className="font-bold text-slate-800 m-0 text-base">
                          {index + 1}. {getContractTypeName(contract.contractType)}
                        </h3>
                        {index === 0 && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '1px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            HỢP ĐỒNG MỚI NHẤT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Số hiệu: <strong className="text-slate-700">{contract.contractNumber || 'HĐLĐ-Lưu-nội-bộ'}</strong></span>
                        <span>•</span>
                        <span>Địa điểm: {contract.workLocation || 'Trụ sở chính'}</span>
                        {contract.signBy && <span>• Người ký: {contract.signBy}</span>}
                      </div>
                    </div>
                    <div>
                      {getContractStatusBadge(contract.status, contract.endDate, contract.contractType)}
                    </div>
                  </div>

                  {/* 4 Chỉ số Lương & Thời hạn */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
                    <div>
                      <span className="text-slate-400 text-xs block">Lương cơ bản:</span>
                      <strong className="text-emerald-700 text-sm">{formatCurrency(contract.baseSalary)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Phụ cấp lương:</span>
                      <strong className="text-slate-700 text-sm">{contract.allowance ? formatCurrency(contract.allowance) : '0 đ'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Lương đóng BHXH:</span>
                      <strong className="text-blue-700 text-sm">{contract.insuranceSalary ? formatCurrency(contract.insuranceSalary) : formatCurrency(contract.baseSalary)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Thời hạn hiệu lực:</span>
                      <span className="text-slate-800 font-semibold text-xs">
                        {formatContractPeriod(contract)}
                      </span>
                    </div>
                  </div>

                  {/* Danh sách Phụ lục Hợp đồng (Contract Appendix) */}
                  <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Layers size={14} color="#6366f1" /> Phụ lục Hợp đồng đã ban hành ({appendices.length}):
                      </span>
                      <span className="text-[11px] text-slate-400 italic">
                        (Tự động liên kết khi phê duyệt Quyết định tăng lương)
                      </span>
                    </div>

                    {appendices.length > 0 ? (
                      <div className="flex-col gap-2">
                        {appendices.map(app => (
                          <div 
                            key={app.id} 
                            style={{ 
                              padding: '10px 14px', 
                              borderRadius: '8px', 
                              border: '1px solid #e0e7ff', 
                              backgroundColor: '#f5f7ff', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              fontSize: '0.8rem',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}
                          >
                            <div>
                              <div className="font-semibold text-indigo-900 flex items-center gap-2">
                                <span>{app.appendixNumber}</span>
                                <span className="text-slate-400 font-normal">• Ngày hiệu lực: {new Date(app.effectiveDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="text-slate-600 mt-0.5 text-xs">{app.title}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-xs mr-1">Điều chỉnh:</span>
                              <span className="line-through text-slate-400 mr-2 text-xs">{formatCurrency(app.oldSalary)}</span>
                              <strong className="text-emerald-700 text-sm font-bold">➔ {formatCurrency(app.newSalary)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-1">
                        Chưa có phụ lục điều chỉnh nào gắn với hợp đồng này.
                      </div>
                    )}
                  </div>

                  {/* Bản scan / File đính kèm */}
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <FileText size={14} /> Bản scan giấy & Tài liệu PDF:
                      {contractPages.length > 0 ? (
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 600 }}>
                          {contractPages.length} tệp
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic font-normal">Chưa có tệp đính kèm</span>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {contractPages.length > 0 && (
                        <button
                          onClick={() => setViewingFile({
                            contractId: contract.id,
                            urls: contractPages,
                            currentIndex: 0,
                            title: `${getContractTypeName(contract.contractType)} - ${employee.fullName}`
                          })}
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', borderColor: '#3b82f6', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Xem {contractPages.length} tệp scan
                        </button>
                      )}
                      <label className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Upload size={13} color="#2563eb" /> {contractPages.length > 0 ? 'Thêm tệp' : 'Tải tệp lên'}
                        <input type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(contract.id, e.target.files)} />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Xem tệp PDF / Ảnh scan toàn màn hình */}
      {viewingFile && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '24px' }}>
          <div style={{ width: '920px', maxWidth: '100%', maxHeight: '92vh', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#3b82f6" /> {viewingFile.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Tệp {viewingFile.currentIndex + 1} / {viewingFile.urls.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleDeleteContractPage(viewingFile.contractId, viewingFile.currentIndex)}
                  style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={13} /> Xóa tệp
                </button>
                <a
                  href={viewingFile.urls[viewingFile.currentIndex]}
                  download={`hop-dong-tep-${viewingFile.currentIndex + 1}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={13} /> Mở tab mới
                </a>
                <button
                  onClick={() => setViewingFile(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', position: 'relative' }}>
              {isPdfFile(viewingFile.urls[viewingFile.currentIndex]) ? (
                <iframe
                  src={viewingFile.urls[viewingFile.currentIndex]}
                  title={`Hợp đồng PDF ${viewingFile.currentIndex + 1}`}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px', backgroundColor: '#fff' }}
                />
              ) : (
                <img
                  src={viewingFile.urls[viewingFile.currentIndex]}
                  alt={`Tệp ${viewingFile.currentIndex + 1}`}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Ký Hợp đồng Lao động Mới / Tiếp nhận Chính thức */}
      {showSignModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', padding: '16px' }}>
          <div style={{ width: '840px', maxWidth: '100%', maxHeight: '92vh', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: signMode === 'PROBATION_TO_OFFICIAL' ? '#dcfce7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {signMode === 'PROBATION_TO_OFFICIAL' ? <CheckCircle2 size={22} color="#16a34a" /> : <FileText size={22} color="#2563eb" />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    {signMode === 'PROBATION_TO_OFFICIAL' ? 'Ký HĐ Tiếp nhận Nhân sự Chính thức' : 'Tái ký / Giao kết Hợp đồng Lao động Mới'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Nhân sự: <strong>{employee.fullName}</strong> ({employee.code}) • {employee.department?.name || 'Phòng ban'} • {employee.position?.title || 'Chức vụ'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSignModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitSignContract} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. Đánh giá thử việc nếu nhân sự đang là Thử việc */}
                {(employee.status === 'PROBATION' || employee.status === 'INTERNSHIP') && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <ShieldCheck size={18} color="#16a34a" />
                      <strong style={{ fontSize: '0.88rem', color: '#166534' }}>
                        Đánh giá kết quả Thử việc (Điều 27 Bộ luật Lao động 2019)
                      </strong>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#15803d', lineHeight: 1.4 }}>
                      Hết thời hạn thử việc, nếu đạt yêu cầu thì người sử dụng lao động tiến hành giao kết Hợp đồng lao động chính thức và tự động nâng trạng thái nhân sự lên <strong>CHÍNH THỨC (ACTIVE)</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#14532d', backgroundColor: 'white', padding: '8px 14px', borderRadius: '8px', border: formData.evaluationResult === 'PASSED' ? '2px solid #16a34a' : '1px solid #bbf7d0' }}>
                        <input 
                          type="radio" 
                          name="evalResult" 
                          value="PASSED" 
                          checked={formData.evaluationResult === 'PASSED'} 
                          onChange={() => setFormData({ ...formData, evaluationResult: 'PASSED' })} 
                          style={{ accentColor: '#16a34a' }}
                        />
                        <span>ĐẠT — Kích hoạt trạng thái CHÍNH THỨC (ACTIVE)</span>
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#991b1b', backgroundColor: 'white', padding: '8px 14px', borderRadius: '8px', border: formData.evaluationResult === 'FAILED' ? '2px solid #ef4444' : '1px solid #fecaca' }}>
                        <input 
                          type="radio" 
                          name="evalResult" 
                          value="FAILED" 
                          checked={formData.evaluationResult === 'FAILED'} 
                          onChange={() => setFormData({ ...formData, evaluationResult: 'FAILED' })} 
                          style={{ accentColor: '#ef4444' }}
                        />
                        <span>KHÔNG ĐẠT — Dừng thử việc & Chuyển sang Thôi việc</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. Cảnh báo Luật Lao động nếu đã ký đủ 2 lần HĐ có thời hạn */}
                {definiteCount >= 2 && (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertTriangle size={18} color="#b45309" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
                      <strong>Ràng buộc Pháp lý (Khoản 2 Điều 20 Bộ luật Lao động 2019):</strong><br />
                      Nhân sự này đã ký đủ <strong>02 lần Hợp đồng xác định thời hạn</strong> ({definiteCount}/2 lần). Hệ thống đã tự động khóa loại hợp đồng sang <strong>Hợp đồng không xác định thời hạn (INDEFINITE)</strong> để đảm bảo tuân thủ pháp luật.
                    </div>
                  </div>
                )}

                {/* 3. Lưới các trường thông tin hợp đồng */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Số hợp đồng: <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      className="form-input w-full" 
                      value={formData.contractNumber} 
                      onChange={e => setFormData({ ...formData, contractNumber: e.target.value })} 
                      placeholder="HĐLĐ-2026/001/..." 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Loại hợp đồng: <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="form-input w-full"
                      value={formData.contractType}
                      disabled={definiteCount >= 2}
                      onChange={e => handleContractTypeChange(e.target.value)}
                      style={{ backgroundColor: definiteCount >= 2 ? '#f1f5f9' : 'white' }}
                    >
                      {definiteCount < 2 && <option value="OFFICIAL_1Y">HĐ Lao động xác định thời hạn (1 năm)</option>}
                      <option value="INDEFINITE">HĐ Lao động không xác định thời hạn (Vô thời hạn)</option>
                      {definiteCount < 2 && <option value="PROBATION">Hợp đồng thử việc</option>}
                      {definiteCount < 2 && <option value="INTERNSHIP">Hợp đồng thực tập</option>}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Ngày bắt đầu hiệu lực: <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      required 
                      className="form-input w-full" 
                      value={formData.startDate} 
                      onChange={e => handleStartDateChange(e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Ngày kết thúc: {formData.contractType === 'INDEFINITE' ? <span style={{ color: '#16a34a', fontWeight: 600 }}>(Không thời hạn)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <input 
                      type="date" 
                      className="form-input w-full" 
                      value={formData.contractType === 'INDEFINITE' ? '' : formData.endDate} 
                      disabled={formData.contractType === 'INDEFINITE'} 
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
                      style={{ backgroundColor: formData.contractType === 'INDEFINITE' ? '#f1f5f9' : 'white' }} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Mức lương cơ bản (VNĐ): <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      step="100000" 
                      className="form-input w-full" 
                      value={formData.baseSalary} 
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ 
                          ...formData, 
                          baseSalary: val,
                          insuranceSalary: (!formData.insuranceSalary || formData.insuranceSalary == formData.baseSalary) ? val : formData.insuranceSalary 
                        });
                      }} 
                    />
                    <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '3px', display: 'block' }}>
                      {formatCurrency(formData.baseSalary)}
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Phụ cấp / Trợ cấp (VNĐ):
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      step="100000" 
                      className="form-input w-full" 
                      value={formData.allowance} 
                      onChange={e => setFormData({ ...formData, allowance: e.target.value })} 
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                      {formatCurrency(formData.allowance)}
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Lương đóng BHXH (VNĐ):
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      step="100000" 
                      className="form-input w-full" 
                      value={formData.insuranceSalary} 
                      onChange={e => setFormData({ ...formData, insuranceSalary: e.target.value })} 
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                      {formatCurrency(formData.insuranceSalary || formData.baseSalary)}
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Hình thức thanh toán lương:
                    </label>
                    <select
                      className="form-input w-full"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                      <option value="CASH">Tiền mặt</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Người đại diện ký (Người SDLĐ):
                    </label>
                    <input 
                      type="text" 
                      className="form-input w-full" 
                      value={formData.signBy} 
                      onChange={e => setFormData({ ...formData, signBy: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Ngày ký văn bản:
                    </label>
                    <input 
                      type="date" 
                      className="form-input w-full" 
                      value={formData.signDate} 
                      onChange={e => setFormData({ ...formData, signDate: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Địa điểm làm việc:
                    </label>
                    <input 
                      type="text" 
                      className="form-input w-full" 
                      value={formData.workLocation} 
                      onChange={e => setFormData({ ...formData, workLocation: e.target.value })} 
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Ghi chú / Thỏa thuận phụ:
                    </label>
                    <textarea 
                      rows={2} 
                      className="form-input w-full" 
                      placeholder="Nội dung điều khoản đặc biệt, cam kết đào tạo..." 
                      value={formData.appendixNote} 
                      onChange={e => setFormData({ ...formData, appendixNote: e.target.value })} 
                    />
                  </div>
                </div>

                {/* 4. Đính kèm hồ sơ scan / PDF */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={15} color="#2563eb" /> Đính kèm Bản scan hợp đồng có chữ ký (Ảnh đa trang / PDF):
                    </span>
                    <label style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={13} /> Chọn tệp
                      <input type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => handleModalFileUpload(e.target.files)} />
                    </label>
                  </div>
                  {formData.fileUrls.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {formData.fileUrls.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          {isPdfFile(url) ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.65rem', fontWeight: 700 }}>
                              <FileText size={18} /> PDF
                            </div>
                          ) : (
                            <img src={url} alt={`Trang ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, fileUrls: formData.fileUrls.filter((_, i) => i !== idx) })}
                            style={{ position: 'absolute', top: 2, right: 2, width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', lineHeight: 1 }}
                            title="Xóa tệp này"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chưa đính kèm tệp nào (có thể tải bổ sung bất kỳ lúc nào sau khi ký).</span>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                <button 
                  type="button" 
                  onClick={() => setShowSignModal(false)} 
                  className="btn btn-outline" 
                  style={{ padding: '7px 18px', fontSize: '0.85rem' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '7px 22px', 
                    fontSize: '0.85rem', 
                    backgroundColor: formData.evaluationResult === 'PASSED' ? '#16a34a' : '#2563eb', 
                    borderColor: formData.evaluationResult === 'PASSED' ? '#16a34a' : '#2563eb', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}
                >
                  <CheckCircle2 size={16} />
                  {isSubmitting ? 'Đang xử lý...' : (formData.evaluationResult === 'PASSED' ? 'Ký HĐ & Kích hoạt Chính thức' : 'Hoàn tất & Ký Hợp đồng')}
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
