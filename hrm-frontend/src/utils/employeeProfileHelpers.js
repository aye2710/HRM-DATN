// Shared formatting and normalization helpers for Employee Profile (HR & ESS portals)

export const parseJsonArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const parseContractFiles = (fileUrl) => {
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [fileUrl];
  } catch {
    return [fileUrl];
  }
};

export const parseAttachedFiles = (raw) => {
  const list = parseJsonArray(raw);
  return list
    .filter((item) => item && (item.fileUrl || item.url || typeof item === 'string'))
    .map((item, idx) =>
      typeof item === 'string'
        ? {
            id: `att-${idx}`,
            name: `Tài liệu #${idx + 1}`,
            category: 'Khác',
            fileUrl: item,
            uploadedAt: null
          }
        : {
            id: item.id || `att-${idx}`,
            name: item.name || item.fileName || `Tài liệu #${idx + 1}`,
            category: item.category || 'Khác',
            fileUrl: item.fileUrl || item.url || '',
            uploadedAt: item.uploadedAt || null,
            uploadedBy: item.uploadedBy || null,
            fileSize: item.fileSize || null
          }
    );
};

export const formatDateVN = (value, fallback = '—') => {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('vi-VN');
};

export const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' }
];

export const normalizeGenderCode = (value) => {
  if (!value) return '';
  const upper = String(value).trim().toUpperCase();
  if (upper === 'MALE' || upper === 'NAM') return 'MALE';
  if (upper === 'FEMALE' || upper === 'NỮ' || upper === 'NU') return 'FEMALE';
  if (upper === 'OTHER' || upper === 'KHÁC' || upper === 'KHAC') return 'OTHER';
  return value;
};

export const getGenderLabel = (value) => {
  const code = normalizeGenderCode(value);
  return GENDER_OPTIONS.find((o) => o.value === code)?.label || value || '—';
};

export const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Độc thân' },
  { value: 'MARRIED', label: 'Đã kết hôn' },
  { value: 'DIVORCED', label: 'Ly hôn' },
  { value: 'OTHER', label: 'Khác' }
];

export const normalizeMaritalStatusCode = (value) => {
  if (!value) return '';
  const upper = String(value).trim().toUpperCase();
  if (upper === 'SINGLE' || upper === 'ĐỘC THÂN' || upper === 'DOC THAN') return 'SINGLE';
  if (upper === 'MARRIED' || upper === 'ĐÃ KẾT HÔN' || upper === 'DA KET HON') return 'MARRIED';
  if (upper === 'DIVORCED' || upper === 'LY HÔN' || upper === 'LY HON') return 'DIVORCED';
  if (upper === 'OTHER' || upper === 'KHÁC' || upper === 'KHAC') return 'OTHER';
  return value;
};

export const getMaritalStatusLabel = (value) => {
  const code = normalizeMaritalStatusCode(value);
  return MARITAL_STATUS_OPTIONS.find((o) => o.value === code)?.label || value || '—';
};

export const getEmployeeStatusMeta = (status) => {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Chính thức', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
    case 'PROBATION':
      return { label: 'Thử việc', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    case 'INTERNSHIP':
      return { label: 'Thực tập', bg: '#F3E8FF', color: '#7E22CE', border: '#E9D5FF' };
    case 'ONBOARDING':
      return { label: 'Đang hội nhập', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    case 'MATERNITY_LEAVE':
      return { label: 'Nghỉ thai sản', bg: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' };
    case 'UNPAID_LEAVE':
      return { label: 'Nghỉ không lương', bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' };
    case 'SUSPENDED':
      return { label: 'Tạm hoãn HĐLĐ', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' };
    case 'RESIGNED':
      return { label: 'Đã thôi việc', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
    default:
      return { label: status || 'Chưa xác định', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
  }
};

export const getManagementRoleLabel = (role) => {
  switch (role) {
    case 'BOD': return 'Ban Tổng Giám Đốc';
    case 'DIRECTOR': return 'Giám đốc Khối';
    case 'DEPUTY_DIRECTOR': return 'Phó Giám đốc Khối';
    case 'MANAGER': return 'Trưởng phòng';
    case 'DEPUTY_MANAGER': return 'Phó Trưởng phòng';
    case 'TEAM_LEAD': return 'Trưởng nhóm (Lead)';
    case 'STAFF': return 'Nhân viên';
    default: return role || 'Nhân viên';
  }
};

export const getEmploymentTypeLabel = (type) => {
  switch (type) {
    case 'FULL_TIME': return 'Toàn thời gian (Full-time)';
    case 'PART_TIME': return 'Bán thời gian (Part-time)';
    case 'INTERNSHIP': return 'Thực tập sinh';
    case 'CONTRACT': return 'Hợp đồng dự án';
    default: return type || '—';
  }
};

export const calculateSeniority = (dateStr) => {
  if (!dateStr) return '—';
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return '—';
  const diff = Date.now() - start.getTime();
  if (diff < 0) return 'Chưa nhận việc';
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  if (years === 0 && months === 0) return 'Mới gia nhập';
  if (years === 0) return `${months} tháng`;
  return months > 0 ? `${years} năm ${months} tháng` : `${years} năm`;
};

export const getContractTypeName = (type) => {
  switch (type) {
    case 'PROBATION': return 'Thử việc';
    case 'INTERNSHIP': return 'Thực tập sinh';
    case 'OFFICIAL_1Y': return 'Chính thức (1 năm)';
    case 'INDEFINITE': return 'Không xác định thời hạn';
    default: return type || 'Chưa xác định';
  }
};

export const getContractStatusMeta = (status, endDate) => {
  if (status === 'ACTIVE' && endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { label: 'Hết hạn', bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    }
    if (diffDays <= 15) {
      return {
        label: `Sắp hết hạn (${diffDays === 0 ? 'Hôm nay' : `còn ${diffDays} ngày`})`,
        bg: '#ffedd5',
        color: '#c2410c',
        border: '#fed7aa'
      };
    }
  }

  switch (status) {
    case 'ACTIVE': return { label: 'Hiệu lực', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
    case 'EXPIRED': return { label: 'Hết hạn', bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    case 'TERMINATED': return { label: 'Đã chấm dứt', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
    default: return { label: status || '—', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  }
};

export const getDecisionTypeLabel = (type) => {
  switch (type) {
    case 'RECRUITMENT': return 'Tuyển dụng';
    case 'PROMOTION': return 'Bổ nhiệm';
    case 'DEMOTION': return 'Miễn nhiệm';
    case 'TRANSFER': return 'Điều chuyển';
    case 'SALARY_ADJUSTMENT': return 'Tăng / Giảm lương';
    case 'REWARD': return 'Khen thưởng';
    case 'DISCIPLINE': return 'Kỷ luật';
    case 'TERMINATION': return 'Nghỉ việc';
    default: return type || 'Quyết định';
  }
};

export const getAssetAssignmentStatusMeta = (assignment) => {
  const isReturned = Boolean(assignment?.returnedDate || assignment?.returnDate) || assignment?.status === 'RETURNED';
  if (isReturned) {
    return { label: 'Đã thu hồi', bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
  }
  switch (assignment?.status) {
    case 'DAMAGED':
      return { label: 'Hư hỏng', bg: '#FFEDD5', color: '#C2410C', border: '#FED7AA' };
    case 'LOST':
      return { label: 'Mất thiết bị', bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' };
    default:
      return { label: 'Đang sử dụng', bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' };
  }
};

