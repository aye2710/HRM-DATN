/**
 * Tiện ích hỗ trợ sắp xếp tiếng Việt và dữ liệu bảng
 */

/**
 * Trích xuất khóa sắp xếp tên theo chuẩn tiếng Việt:
 * Lấy Tên (từ cuối cùng) làm khóa chính, Họ và Tên đệm làm khóa phụ.
 * Ví dụ:
 *  - "Nguyễn Quốc Bảo" -> "Bảo Nguyễn Quốc"
 *  - "Lê Văn Đôn" -> "Đôn Lê Văn"
 *  - "Trần Văn Tiếp Nhận (Test)" -> "Nhận Trần Văn Tiếp"
 */
export const getVietnameseSortKey = (fullName) => {
  if (!fullName) return '';
  // Loại bỏ các ký tự phụ trong ngoặc hoặc số nếu có (vd: (Test), (Junior)...)
  const clean = fullName.replace(/[()[\]{}0-9]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName.trim().toLowerCase();

  const firstName = parts[parts.length - 1]; // Tên chính
  const rest = parts.slice(0, parts.length - 1).join(' '); // Họ & Đệm

  return `${firstName} ${rest}`.toLowerCase();
};

/**
 * So sánh 2 tên theo bảng chữ cái tiếng Việt
 */
export const compareVietnameseNames = (nameA, nameB, order = 'asc') => {
  const keyA = getVietnameseSortKey(nameA);
  const keyB = getVietnameseSortKey(nameB);
  const result = keyA.localeCompare(keyB, 'vi', { sensitivity: 'base' });
  return order === 'asc' ? result : -result;
};
