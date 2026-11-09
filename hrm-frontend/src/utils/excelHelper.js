import * as XLSX from 'xlsx';

/**
 * Tiện ích Xuất dữ liệu ra file Excel (.xlsx) chuẩn Doanh nghiệp
 * @param {Object} options
 * @param {Array} options.data Danh sách đối tượng cần xuất
 * @param {string} options.fileName Tên file (không cần đuôi .xlsx)
 * @param {string} options.sheetName Tên sheet
 * @param {Array} options.columns Cấu hình cột [{ key, label, format: 'text'|'currency'|'date' }]
 */
export const exportToExcel = ({ data = [], fileName = 'Xuat_Du_Lieu', sheetName = 'Danh sách', columns = [] }) => {
  if (!data || data.length === 0) {
    throw new Error('Không có dữ liệu để xuất file.');
  }

  // 1. Chuyển đổi dữ liệu sang định dạng tiêu đề Tiếng Việt
  const exportRows = data.map((item, index) => {
    const row = {};
    // Cột STT mặc định
    row['STT'] = index + 1;

    columns.forEach(col => {
      let val = item[col.key];

      // Format số tiền VNĐ
      if (col.format === 'currency' && val !== undefined && val !== null && val !== '') {
        val = Number(val) || 0;
      }
      // Format ngày tháng DD/MM/YYYY
      else if (col.format === 'date' && val) {
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            val = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        } catch {
          // giữ nguyên
        }
      }
      // Format text hoặc rỗng
      else if (val === null || val === undefined) {
        val = '';
      }

      row[col.label || col.key] = val;
    });

    return row;
  });

  // 2. Tạo worksheet từ dữ liệu
  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // 3. Tự động tính toán độ rộng tối ưu cho từng cột (!cols)
  const colWidths = [];
  const headerKeys = Object.keys(exportRows[0] || {});
  
  headerKeys.forEach(header => {
    let maxLen = header.length;
    exportRows.forEach(row => {
      const cellVal = String(row[header] || '');
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    // Giới hạn chiều rộng từ 10 đến 45 ký tự
    colWidths.push({ wch: Math.min(45, Math.max(10, maxLen + 3)) });
  });

  worksheet['!cols'] = colWidths;

  // 4. Tạo workbook và ghi file
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fullFileName = `${fileName}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
  return fullFileName;
};

/**
 * Tiện ích Tự sinh File mẫu Excel (.xlsx) cho người dùng điền vào
 * @param {Object} options
 * @param {string} options.fileName Tên file mẫu
 * @param {string} options.sheetName Tên sheet
 * @param {Array} options.columns Danh sách cột cấu hình [{ key, label, required, sample }]
 * @param {Array} options.sampleData Dữ liệu mẫu (2-3 dòng)
 */
export const downloadTemplateExcel = ({ fileName = 'Mau_Nhap_Lieu', sheetName = 'File mẫu', columns = [], sampleData = [] }) => {
  // Tạo dữ liệu mẫu
  const rows = (sampleData.length > 0 ? sampleData : [{}]).map((item, index) => {
    const row = {};
    columns.forEach(col => {
      const headerTitle = col.required ? `${col.label} (*)` : col.label;
      row[headerTitle] = item[col.key] !== undefined ? item[col.key] : (col.sample || '');
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Độ rộng cột
  const colWidths = columns.map(col => {
    const title = col.required ? `${col.label} (*)` : col.label;
    const sample = String(col.sample || '');
    return { wch: Math.min(40, Math.max(14, Math.max(title.length, sample.length) + 4)) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Tiện ích Đọc file Excel / CSV tải lên từ người dùng
 * @param {File} file File đối tượng từ input
 * @returns {Promise<Array>} Mảng các dòng dữ liệu dạng JSON
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Chuyển sheet sang mảng JSON (raw: false để lấy chuỗi ngày tháng / số)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file (.xlsx, .xls, .csv).'));
      }
    };

    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsArrayBuffer(file);
  });
};

