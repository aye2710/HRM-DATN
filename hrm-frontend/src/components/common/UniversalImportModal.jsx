import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { parseExcelFile, downloadTemplateExcel } from '../../utils/excelHelper';
import toast from 'react-hot-toast';

export const UniversalImportModal = ({
  isOpen,
  onClose,
  title = 'Nhập dữ liệu từ Excel',
  subtitle = 'Tải file mẫu, điền dữ liệu và nạp hàng loạt vào hệ thống',
  templateFileName = 'Mau_Nhap_Lieu',
  columns = [],
  sampleData = [],
  onConfirmImport
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tải file mẫu Excel
  const handleDownloadTemplate = () => {
    try {
      downloadTemplateExcel({
        fileName: templateFileName,
        sheetName: 'Dữ liệu mẫu',
        columns,
        sampleData
      });
      toast.success('Đã tải xuống file mẫu thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải file mẫu.');
    }
  };

  // 2. Xử lý khi người dùng chọn hoặc kéo thả file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Vui lòng chọn file định dạng .xlsx, .xls hoặc .csv');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setPreviewRows([]);

    try {
      const rawData = await parseExcelFile(file);

      if (!rawData || rawData.length === 0) {
        toast.error('File Excel không có dữ liệu.');
        setIsParsing(false);
        return;
      }

      // Chuẩn hóa và soát lỗi từng dòng dữ liệu
      const parsed = rawData.map((rawRow, idx) => {
        const item = {};
        const errors = [];

        // Ánh xạ cột từ tiêu đề trong file sang key tương ứng
        columns.forEach(col => {
          // Tìm giá trị trong rawRow khớp với col.label hoặc col.label (*)
          const exactLabel = col.label;
          const requiredLabel = `${col.label} (*)`;
          const rawKey = Object.keys(rawRow).find(k => {
            const cleanKey = k.trim().toLowerCase();
            return cleanKey === exactLabel.toLowerCase() || 
                   cleanKey === requiredLabel.toLowerCase() || 
                   cleanKey === col.key.toLowerCase();
          });

          let val = rawKey ? rawRow[rawKey] : '';
          if (typeof val === 'string') val = val.trim();

          // Kiểm tra trường bắt buộc
          if (col.required && (!val || val === '')) {
            errors.push(`Thiếu ${col.label}`);
          }

          // Kiểm tra định dạng tùy chỉnh nếu có
          if (val && col.validate) {
            const valErr = col.validate(val, rawRow);
            if (valErr) errors.push(valErr);
          }

          item[col.key] = val;
        });

        return {
          _index: idx + 1,
          _raw: rawRow,
          _isValid: errors.length === 0,
          _errors: errors,
          ...item
        };
      });

      setPreviewRows(parsed);
      const validCount = parsed.filter(r => r._isValid).length;
      toast.success(`Đã phân tích ${parsed.length} dòng: ${validCount} dòng hợp lệ.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi đọc file Excel.');
    } finally {
      setIsParsing(false);
    }
  };

  // 3. Reset file đã chọn
  const handleResetFile = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 4. Xác nhận nạp dữ liệu
  const handleConfirm = async () => {
    const validRows = previewRows.filter(r => r._isValid);
    if (validRows.length === 0) {
      toast.error('Không có dòng dữ liệu hợp lệ nào để nạp vào hệ thống.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmImport(validRows);
      toast.success(`Đã nhập thành công ${validRows.length} bản ghi vào hệ thống!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Lỗi khi nạp dữ liệu vào máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = previewRows.filter(r => r._isValid).length;
  const invalidCount = previewRows.length - validCount;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {title}
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          
          {/* Hàng 1: Nút Tải Template Mẫu */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '0.65rem',
            padding: '0.75rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSpreadsheet size={18} color="#16A34A" />
              <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                Chưa có file chuẩn? Hãy tải <strong>File mẫu Excel</strong> có sẵn định dạng cột và dữ liệu ví dụ.
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="btn"
              style={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                height: 32,
                padding: '0 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '6px'
              }}
            >
              <Download size={14} />
              <span>Tải file mẫu (.xlsx)</span>
            </button>
          </div>

          {/* Hàng 2: Khu vực Kéo thả file */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '0.75rem',
                padding: '1.75rem 1rem',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={20} />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                Kéo thả file Excel vào đây hoặc <span style={{ color: '#2563EB' }}>Chọn từ máy tính</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Hỗ trợ định dạng: .xlsx, .xls, .csv (Tối đa 5.000 dòng)
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '0.65rem',
              padding: '0.65rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileSpreadsheet size={20} color="#2563EB" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40AF' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Dung lượng: {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={handleResetFile}
                className="btn btn-outline"
                style={{ height: 28, padding: '0 0.65rem', fontSize: '0.74rem', backgroundColor: '#FFFFFF' }}
              >
                Chọn file khác
              </button>
            </div>
          )}

          {/* Hàng 3: Bảng Preview Xem Trước & Soát Lỗi */}
          {isParsing && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '0.82rem' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              Đang phân tích và kiểm tra tính hợp lệ dữ liệu...
            </div>
          )}

          {!isParsing && previewRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              {/* Thẻ thống kê kết quả kiểm tra */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                padding: '0.55rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: '#475569' }}>
                  Tổng cộng: <strong>{previewRows.length}</strong> dòng dữ liệu
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontWeight: 700
                  }}>
                    <CheckCircle2 size={13} /> {validCount} hợp lệ
                  </span>
                  {invalidCount > 0 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      fontWeight: 700
                    }}>
                      <AlertTriangle size={13} /> {invalidCount} lỗi
                    </span>
                  )}
                </div>
              </div>

              {/* Bảng dữ liệu Preview */}
              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '260px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '0.55rem 0.65rem', textAlign: 'center', width: 45 }}>#</th>
                      <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: 95 }}>Trạng thái</th>
                      <th style={{ padding: '0.55rem 0.85rem', textAlign: 'left', minWidth: 140 }}>Chi tiết lỗi</th>
                      {columns.map(col => (
                        <th key={col.key} style={{ padding: '0.55rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {col.label} {col.required && <span style={{ color: '#DC2626' }}>*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr 
                        key={idx}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          backgroundColor: row._isValid ? '#FFFFFF' : '#FFF5F5'
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                          {row._index}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          {row._isValid ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: '#DCFCE7',
                              color: '#15803D'
                            }}>
                              ✓ Hợp lệ
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626'
                            }}>
                              ⚠ Lỗi
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem 0.85rem', color: row._isValid ? '#16A34A' : '#DC2626', fontSize: '0.72rem' }}>
                          {row._isValid ? 'Sẵn sàng nạp' : row._errors.join(', ')}
                        </td>
                        {columns.map(col => (
                          <td key={col.key} style={{ padding: '0.5rem 0.75rem', color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {row[col.key] ? (
                              String(row[col.key])
                            ) : col.key === 'code' ? (
                              <span style={{ color: '#16A34A', fontStyle: 'italic', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '1px 6px', borderRadius: '4px', border: '1px dashed #86EFAC' }}>
                                Tự sinh tăng dần
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '0.9rem 1.4rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {validCount > 0 
              ? `Chỉ có ${validCount} dòng hợp lệ sẽ được nạp vào hệ thống.`
              : 'Vui lòng chọn file mẫu và điền dữ liệu đúng quy định.'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-outline"
              style={{ height: 36, padding: '0 1rem', fontSize: '0.82rem' }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirm}
              disabled={validCount === 0 || isSubmitting}
              className="btn btn-primary"
              style={{
                height: 36,
                padding: '0 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: validCount === 0 ? 0.6 : 1,
                cursor: validCount === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang nạp vào CSDL...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Xác nhận nạp {validCount} bản ghi</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

