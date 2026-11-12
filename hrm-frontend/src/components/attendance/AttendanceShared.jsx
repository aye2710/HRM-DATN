import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getMonthQueryStr = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`;

export const fmtTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Tính số phút đi muộn so với giờ vào chuẩn 08:00. */
export const getLateMinutes = (checkInIso) => {
  if (!checkInIso) return 0;
  const d = new Date(checkInIso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, d.getHours() * 60 + d.getMinutes() - 8 * 60);
};

export const getExplanationCategory = (typeStr = '') => {
  const t = String(typeStr).toLowerCase();
  if (t.includes('đi muộn')) return 'LATE_PERMISSION';
  if (t.includes('về sớm')) return 'EARLY_LEAVE_PERMISSION';
  return 'CONFIRM_ATTENDANCE';
};

export const formatExplanationTypeBadge = (type = '') => {
  const t = String(type).toLowerCase();
  if (t.includes('đi muộn')) {
    return { label: 'Xin đi muộn', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
  }
  if (t.includes('về sớm')) {
    return { label: 'Xin về sớm', bg: '#FFEDD5', color: '#C2410C', border: '#FDBA74' };
  }
  if (t.includes('quên check-out')) {
    return { label: 'Quên Check-out', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  }
  if (t.includes('quên check-in')) {
    return { label: 'Quên Check-in', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' };
  }
  return { label: 'Xác nhận công', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
};

/** Bộ chọn Tháng / Năm dùng chung cho các trang Chấm công Nhân viên. */
export const MonthNavigator = ({
  selectedMonth,
  selectedYear,
  onSelectMonth,
  onSelectYear,
  years = [2025, 2026],
}) => {
  const now = new Date();
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onSelectMonth(12);
      onSelectYear(selectedYear - 1);
    } else {
      onSelectMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) {
      return toast('Hiện tại đang ở tháng hiện hành, chưa có dữ liệu tháng tương lai.');
    }
    if (selectedMonth === 12) {
      onSelectMonth(1);
      onSelectYear(selectedYear + 1);
    } else {
      onSelectMonth(selectedMonth + 1);
    }
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      backgroundColor: '#F8FAFC',
      padding: '0.2rem',
      borderRadius: '0.5rem',
      border: '1px solid #CBD5E1'
    }}>
      <button
        type="button"
        onClick={handlePrevMonth}
        className="btn btn-outline"
        style={{ height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: 'transparent' }}
        title="Xem tháng trước"
      >
        <ChevronLeft size={16} />
      </button>
      <select
        value={selectedMonth}
        onChange={e => onSelectMonth(Number(e.target.value))}
        className="form-input"
        style={{ width: 'auto', height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem' }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
          <option key={m} value={m} disabled={selectedYear === now.getFullYear() && m > now.getMonth() + 1}>
            Tháng {m}
          </option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={e => onSelectYear(Number(e.target.value))}
        className="form-input"
        style={{ width: 'auto', height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem' }}
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleNextMonth}
        className="btn btn-outline"
        style={{ height: 30, padding: '0 0.5rem', border: 'none', backgroundColor: 'transparent' }}
        title="Xem tháng tiếp theo"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const PERMISSION_META = {
  LATE_PERMISSION: {
    actionPhrase: 'đi muộn',
    reasonLabel: 'Lý do xin đi muộn',
    durationPrefix: 'muộn',
  },
  EARLY_LEAVE_PERMISSION: {
    actionPhrase: 'về sớm',
    reasonLabel: 'Lý do xin về sớm',
    durationPrefix: 'sớm',
  },
};

/** Bản xem trước & in khổ A4 dùng chung cho Nhân viên và HR. */
export const ExplanationA4Preview = ({
  fullName,
  positionTitle,
  deptName,
  date,
  category,
  durationLabel,
  subType,
  reason,
  status,
}) => {
  const now = new Date();
  const parsedDate = date ? new Date(date) : now;
  const dayStr = String(parsedDate.getDate()).padStart(2, '0');
  const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const yearStr = parsedDate.getFullYear();

  const resolvedCategory = category || getExplanationCategory(subType);
  const permMeta = PERMISSION_META[resolvedCategory];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '0.75rem',
      border: '1px solid #CBD5E1',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
      padding: '2rem 2.25rem',
      fontFamily: '"Times New Roman", Times, serif',
      color: '#000000',
      lineHeight: 1.6,
      fontSize: '15px'
    }}>
      {permMeta ? (
        <div>
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
            <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style={{ textDecoration: 'underline', marginBottom: '1.25rem' }}>Độc lập – Tự do – Hạnh phúc</div>
            <div style={{ fontSize: '19px', margin: '1rem 0' }}>ĐƠN XIN PHÉP</div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Kính gửi:</strong> Trưởng bộ phận {deptName}
          </div>
          <div>
            Tên tôi là: <strong>{fullName}</strong>, hiện đang làm việc tại phòng {deptName} của Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA.
          </div>
          <div>
            Tôi xin phép được {permMeta.actionPhrase} ngày <strong>{dayStr}/{monthStr}/{yearStr}</strong> (
            {durationLabel ? `${permMeta.durationPrefix} ${durationLabel}` : subType})
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <strong>{permMeta.reasonLabel}:</strong> {reason}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            Rất mong được trưởng bộ phận {deptName} phê duyệt.
          </div>
          <div style={{ marginBottom: '1.25rem' }}>Trân trọng cảm ơn!</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', marginTop: '1rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '0.75rem', width: '50%', verticalAlign: 'top' }}>
                  <strong>Trưởng bộ phận</strong><br />
                  <em>(Phê duyệt và ký tên)</em>
                  <div style={{ height: '75px' }} />
                  <strong>Ngô Xuân Cương</strong>
                </td>
                <td style={{ border: '1px solid #000', padding: '0.75rem', width: '50%', verticalAlign: 'top' }}>
                  <em>Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}</em><br />
                  <strong>Người làm đơn</strong><br />
                  <em>(Ký tên)</em>
                  <div style={{ height: '55px' }} />
                  <strong>{fullName}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
            <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div>Độc lập – Tự do – Hạnh phúc</div>
            <div>—–</div>
          </div>
          <div style={{ textAlign: 'right', fontStyle: 'italic', margin: '0.5rem 0 1rem' }}>
            Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}
          </div>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '19px', marginBottom: '1rem' }}>
            ĐƠN XIN XÁC NHẬN CHẤM CÔNG
          </div>

          <div style={{ marginBottom: '0.75rem', paddingLeft: '1.25rem' }}>
            <strong>Kính gửi:</strong> - Giám đốc Công ty TNHH Thương Mại Dịch Vụ và Công Nghệ LLA<br />
            <span style={{ paddingLeft: '4.1rem' }}>- Phòng HCNS - Kế Toán</span><br />
            <span style={{ paddingLeft: '4.1rem' }}>- Trưởng bộ phận {deptName}</span>
          </div>

          <div>Tên tôi là: <strong>{fullName}</strong></div>
          <div>Chức vụ: <strong>{positionTitle}</strong></div>
          <div>Bộ phận: <strong>{deptName}</strong></div>

          <div style={{ marginTop: '0.5rem', textAlign: 'justify' }}>
            Nay tôi làm đơn này kính mong Giám đốc Công ty, Phòng HCNS - Kế Toán, trưởng bộ phận (nơi bạn trực tiếp làm việc) {deptName} xác nhận chấm công làm việc của tôi theo đúng thời gian tôi đã làm việc tại công ty trong tháng vừa qua. Trong đó:
          </div>
          <div style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
            Xin chấm công ngày {dayStr} tháng {monthStr} năm {yearStr}: {reason}
          </div>
          <div>
            Tôi cam đoan những thông tin tôi trình bày ở trên là đúng sự thật và xin chịu mọi trách nhiệm trước pháp luật.
          </div>
          <div style={{ marginBottom: '1.25rem' }}>Tôi xin chân thành cảm ơn!</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', marginTop: '1rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                  <strong>TP. HCNS-KT</strong><br />
                  <em>(Xác nhận, ký, ghi rõ họ tên)</em>
                  <div style={{ height: '75px' }} />
                  <strong>{status === 'APPROVED' ? 'Đã phê duyệt' : ''}</strong>
                </td>
                <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                  <strong>Trưởng bộ phận</strong><br />
                  <em>(Xác nhận, ký, ghi rõ họ tên)</em>
                  <div style={{ height: '75px' }} />
                  <strong>Ngô Xuân Cương</strong>
                </td>
                <td style={{ border: '1px solid #000', padding: '0.65rem', width: '33.3%', verticalAlign: 'top' }}>
                  <strong>Người làm đơn</strong><br />
                  <em>(Ký, ghi rõ họ tên)</em>
                  <div style={{ height: '75px' }} />
                  <strong>{fullName}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

