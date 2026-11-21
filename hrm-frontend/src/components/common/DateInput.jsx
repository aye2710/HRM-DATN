import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate, toISODateString, dmyToISO } from '../../utils/dateUtils';

/**
 * Component ô nhập ngày chuẩn Việt Nam (Ngày / Tháng / Năm - DD/MM/YYYY).
 * Khắc phục hoàn toàn lỗi trình duyệt tự đổi sang MM/DD/YYYY trên Windows.
 * Vẫn giữ popup lịch gốc để chọn ngày trực quan, giá trị trả về qua onChange
 * luôn là 'YYYY-MM-DD' để tương thích 100% với backend.
 */
export const DateInput = ({
  value = '',
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  className = 'form-input',
  style = {},
  placeholder = 'dd/mm/yyyy',
  name,
  id,
  ...rest
}) => {
  const pickerRef = useRef(null);

  // Chuỗi ISO (YYYY-MM-DD)
  const isoVal = toISODateString(value);

  // Chuỗi hiển thị trực quan (DD/MM/YYYY)
  const [displayText, setDisplayText] = useState(() => (isoVal ? formatDate(isoVal, '') : ''));

  useEffect(() => {
    setDisplayText(isoVal ? formatDate(isoVal, '') : '');
  }, [isoVal]);

  // Xử lý khi người dùng gõ phím trực tiếp
  const handleTextChange = (e) => {
    let input = e.target.value;
    
    // Chỉ giữ lại số và dấu /
    input = input.replace(/[^0-9/]/g, '');

    // Tự động chèn dấu / khi gõ đủ 2 hoặc 5 ký tự
    if (input.length === 2 && !input.includes('/')) {
      input = input + '/';
    } else if (input.length === 5 && input.split('/').length === 2) {
      input = input + '/';
    }
    
    // Giới hạn tối đa 10 ký tự (dd/mm/yyyy)
    if (input.length > 10) {
      input = input.slice(0, 10);
    }

    setDisplayText(input);

    if (input.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      const [d, m, y] = input.split('/').map(Number);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        const iso = dmyToISO(input);
        if (max && iso > max) {
          return;
        }
        if (min && iso < min) {
          return;
        }
        if (onChange) {
          onChange({
            target: {
              name,
              id,
              value: iso
            }
          });
        }
      }
    } else if (input.length === 0) {
      if (onChange) {
        onChange({
          target: {
            name,
            id,
            value: ''
          }
        });
      }
    }
  };

  const handleBlur = () => {
    if (displayText && displayText.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(displayText)) {
      const [d, m, y] = displayText.split('/').map(Number);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        return;
      }
    }
    // Nếu gõ dở hoặc không hợp lệ, khôi phục lại giá trị props
    setDisplayText(isoVal ? formatDate(isoVal, '') : '');
  };

  // Mở popup chọn ngày của trình duyệt
  const openDatePicker = () => {
    if (disabled) return;
    try {
      if (pickerRef.current && typeof pickerRef.current.showPicker === 'function') {
        pickerRef.current.showPicker();
      } else {
        pickerRef.current?.focus();
      }
    } catch {
      pickerRef.current?.focus();
    }
  };

  // Khi người dùng chọn từ lịch popup gốc
  const handlePickerChange = (e) => {
    let selectedIso = e.target.value;
    if (max && selectedIso > max) selectedIso = max;
    if (min && selectedIso < min) selectedIso = min;
    setDisplayText(selectedIso ? formatDate(selectedIso, '') : '');
    if (onChange) {
      onChange({
        target: {
          name,
          id,
          value: selectedIso
        }
      });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
    >
      <input
        type="text"
        className={className}
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        autoComplete="off"
        style={{
          width: '100%',
          paddingRight: '2.2rem',
          fontSize: 'inherit',
          backgroundColor: disabled ? '#F8FAFC' : undefined,
          cursor: disabled ? 'not-allowed' : 'text'
        }}
        {...rest}
      />

      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openDatePicker}
        style={{
          position: 'absolute',
          right: '0.45rem',
          background: 'transparent',
          border: 'none',
          padding: '0.25rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: disabled ? '#94A3B8' : '#64748B',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
        title="Chọn ngày (Ngày/Tháng/Năm)"
      >
        <Calendar size={16} />
      </button>

      {/* Input date ẩn để mở popup lịch của trình duyệt */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={isoVal}
        min={min}
        max={max}
        disabled={disabled}
        onChange={handlePickerChange}
        style={{
          position: 'absolute',
          bottom: 0,
          right: '0.5rem',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          border: 'none',
          padding: 0
        }}
      />
    </div>
  );
};
export default DateInput;
