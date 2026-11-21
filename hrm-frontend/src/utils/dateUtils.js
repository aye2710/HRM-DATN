/**
 * Bộ tiện ích định dạng ngày tháng chuẩn Việt Nam (Ngày / Tháng / Năm - DD/MM/YYYY).
 * Đảm bảo 100% đồng bộ trên toàn bộ hệ thống HRM, tránh xung đột locale hệ điều hành.
 */

/**
 * Định dạng ngày sang Ngày/Tháng/Năm (DD/MM/YYYY)
 * @param {string|Date|number} value - Ngày cần định dạng (ISO, YYYY-MM-DD, Date object)
 * @param {string} fallback - Giá trị hiển thị khi ngày rỗng / không hợp lệ (mặc định '—')
 * @returns {string} Chuỗi ngày định dạng DD/MM/YYYY (VD: 15/10/2026)
 */
export const formatDate = (value, fallback = '—') => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    // Nếu đã ở dạng DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    // Nếu ở dạng YYYY-MM-DD...
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [y, m, d] = trimmed.slice(0, 10).split('-');
      return `${d}/${m}/${y}`;
    }
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Định dạng ngày giờ sang DD/MM/YYYY HH:mm:ss hoặc DD/MM/YYYY HH:mm
 */
export const formatDateTime = (value, includeSeconds = true, fallback = '—') => {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return includeSeconds 
    ? `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    : `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Chuyển đổi an toàn giá trị ngày thành chuỗi YYYY-MM-DD dùng cho API và input date
 */
export const toISODateString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return `${y}-${m}-${d}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Chuyển chuỗi DD/MM/YYYY sang YYYY-MM-DD
 */
export const dmyToISO = (dmyStr) => {
  if (!dmyStr || typeof dmyStr !== 'string') return '';
  const clean = dmyStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    return `${y}-${m}-${d}`;
  }
  return clean;
};

/**
 * Chuyển chuỗi YYYY-MM-DD sang DD/MM/YYYY
 */
export const isoToDMY = (isoStr) => {
  return formatDate(isoStr, '');
};

// Alias tương thích ngược với employeeProfileHelpers
export const formatDateVN = formatDate;
