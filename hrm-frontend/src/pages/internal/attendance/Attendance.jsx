import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Search, RefreshCw, Calendar, 
  FileSpreadsheet, X, ShieldAlert, Zap, Edit3, Plus, ChevronLeft, ChevronRight, Upload
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const AttendanceMgmt = () => {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'daily' | 'monthly'
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [syncingMonth, setSyncingMonth] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [matrixRange, setMatrixRange] = useState('W1'); // 'W1' (1-8), 'W2' (9-16), 'W3' (17-24), 'W4' (25-end), 'ALL' (1-end)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination
  const [matrixPage, setMatrixPage] = useState(1);
  const [dailyPage, setDailyPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const itemsPerPage = 12;

  // Manual Adjust Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '07:50',
    checkOutTime: '17:35',
    status: 'NORMAL',
    workingDay: 1.0,
    note: 'Điều chỉnh công theo đề xuất nhân viên'
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const fetchData = async (autoSyncIfEmpty = false) => {
    setLoading(true);
    try {
      const [attRes, empRes, deptRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/attendance?month=${monthStr}`),
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments')
      ]);
      const activeEmps = (empRes.data || []).filter(e => e.status !== 'RESIGNED');
      setEmployees(activeEmps);
      setDepartments(deptRes.data || []);

      let attList = attRes.data || [];
      if (autoSyncIfEmpty && attList.length === 0 && activeEmps.length > 0) {
        // Tự động đồng bộ dữ liệu máy chấm công mẫu cho tháng hiện hành nếu chưa có bản ghi nào
        try {
          await axios.post('http://localhost:5000/api/attendance/sync-month', {
            month: selectedMonth,
            year: selectedYear
          });
          const reloadAtt = await axios.get(`http://localhost:5000/api/attendance?month=${monthStr}`);
          attList = reloadAtt.data || [];
        } catch (syncErr) {
          console.error('Auto sync skipped:', syncErr);
        }
      }
      setAttendances(attList);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [selectedMonth, selectedYear]);

  // Đồng bộ dữ liệu máy chấm công tháng thủ công (API Gateway / ADMS)
  const handleSyncMonth = async () => {
    setSyncingMonth(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/sync-month', {
        month: selectedMonth,
        year: selectedYear
      });
      toast.success(res.data.message || `Đã đồng bộ bảng công tháng ${selectedMonth}/${selectedYear}`);
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi đồng bộ máy chấm công');
    } finally {
      setSyncingMonth(false);
    }
  };

  // Import file CSV xuất từ máy chấm công vân tay / FaceID (Ronald Jack / ZKTeco)
  const handleImportMachineCSV = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const logs = [];
      for (let i = 0; i < lines.length; i++) {
        if (i === 0 && (lines[i].toLowerCase().includes('mã') || lines[i].toLowerCase().includes('code'))) continue;
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 3) {
          logs.push({
            employeeCode: cols[0],
            date: cols[1],
            checkIn: cols[2] || '',
            checkOut: cols[3] || ''
          });
        }
      }
      if (logs.length === 0) {
        return toast.error('File CSV không đúng định dạng: Mã NV, YYYY-MM-DD, HH:mm (Vào), HH:mm (Ra)');
      }
      const res = await axios.post('http://localhost:5000/api/attendance/import-logs', { logs });
      toast.success(res.data.message || `Đã import ${logs.length} dòng log máy chấm công!`);
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi đọc file log máy chấm công');
    }
  };

  // Danh sách các ngày trong tháng được chọn & lọc theo khung tuần/tháng
  const daysInSelectedMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const allDays = [];
    const dowNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d);
      const dow = dateObj.getDay();
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      allDays.push({
        day: d,
        dateStr,
        dow,
        dowLabel: dowNames[dow],
        isWeekend: dow === 0 || dow === 6
      });
    }

    if (matrixRange === 'W1') return allDays.filter(x => x.day >= 1 && x.day <= 8);
    if (matrixRange === 'W2') return allDays.filter(x => x.day >= 9 && x.day <= 16);
    if (matrixRange === 'W3') return allDays.filter(x => x.day >= 17 && x.day <= 24);
    if (matrixRange === 'W4') return allDays.filter(x => x.day >= 25);
    return allDays;
  }, [selectedMonth, selectedYear, matrixRange]);

  // Map tra cứu nhanh bản ghi chấm công theo `${employeeId}_${YYYY-MM-DD}`
  const attendanceMap = useMemo(() => {
    const map = {};
    attendances.forEach(att => {
      if (!att.date) return;
      const dStr = att.date.split('T')[0];
      map[`${att.employeeId}_${dStr}`] = att;
    });
    return map;
  }, [attendances]);

  // Danh sách nhân viên đã lọc cho bảng Matrix
  const filteredMatrixEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = searchTerm === '' ||
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
      return matchSearch && matchDept;
    });
  }, [employees, searchTerm, selectedDept]);

  const totalMatrixPages = Math.ceil(filteredMatrixEmployees.length / itemsPerPage) || 1;
  const paginatedMatrixEmployees = useMemo(() => {
    return filteredMatrixEmployees.slice((matrixPage - 1) * itemsPerPage, matrixPage * itemsPerPage);
  }, [filteredMatrixEmployees, matrixPage, itemsPerPage]);

  // Filtered Daily Records
  const dailyRecords = useMemo(() => {
    return attendances.filter(att => {
      const recordDate = att.date ? att.date.split('T')[0] : '';
      const matchDate = recordDate === selectedDate;
      const matchSearch = searchTerm === '' || 
        (att.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (att.employee?.code?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDept = selectedDept === 'ALL' || att.employee?.departmentId === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || att.status === selectedStatus;

      return matchDate && matchSearch && matchDept && matchStatus;
    });
  }, [attendances, selectedDate, searchTerm, selectedDept, selectedStatus]);

  // WFM Remote / WFH Guardrail Check
  const wfhAlertDepartments = useMemo(() => {
    const recordsOnDay = attendances.filter(att => (att.date && att.date.split('T')[0]) === selectedDate);
    const alerts = [];
    departments.forEach(dept => {
      const deptEmployees = employees.filter(e => e.departmentId === dept.id);
      if (deptEmployees.length === 0) return;
      const deptWfh = recordsOnDay.filter(r => r.status === 'WFH' && r.employee?.departmentId === dept.id).length;
      const rate = deptWfh / deptEmployees.length;
      if (rate > 0.30) {
        alerts.push({
          deptName: dept.name,
          wfhCount: deptWfh,
          total: deptEmployees.length,
          ratePercent: Math.round(rate * 100)
        });
      }
    });
    return alerts;
  }, [attendances, employees, departments, selectedDate]);

  // Monthly Aggregated Summary per Employee
  const monthlySummary = useMemo(() => {
    return employees.map(emp => {
      const empRecords = attendances.filter(att => {
        if (!att.date || att.employeeId !== emp.id) return false;
        const d = new Date(att.date);
        return d.getMonth() + 1 === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      });

      const totalActualDays = empRecords.reduce((sum, r) => sum + (Number(r.workingDay) || 0), 0);
      const lateCount = empRecords.filter(r => r.status === 'LATE' || (r.checkIn && !r.checkOut)).length;
      const earlyLeaveCount = empRecords.filter(r => r.status === 'EARLY_LEAVE').length;
      const onLeaveCount = empRecords.filter(r => r.status === 'ON_LEAVE').length;
      const holidayCount = empRecords.filter(r => r.status === 'HOLIDAY').length;
      const absentCount = empRecords.filter(r => r.status === 'ABSENT').length;
      const wfhCount = empRecords.filter(r => r.status === 'WFH').length;
      const standardDays = 22;
      const completionRate = standardDays > 0 ? Math.min(100, Math.round((totalActualDays / standardDays) * 100)) : 0;

      return {
        employee: emp,
        standardDays,
        totalActualDays: totalActualDays.toFixed(1),
        lateCount,
        earlyLeaveCount,
        onLeaveCount,
        holidayCount,
        absentCount,
        wfhCount,
        completionRate
      };
    }).filter(item => {
      const matchSearch = searchTerm === '' || 
        item.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'ALL' || item.employee.departmentId === selectedDept;
      return matchSearch && matchDept;
    });
  }, [employees, attendances, selectedMonth, selectedYear, searchTerm, selectedDept]);

  // Phân trang Daily & Monthly
  const totalDailyPages = Math.ceil(dailyRecords.length / itemsPerPage) || 1;
  const paginatedDailyRecords = useMemo(() => {
    return dailyRecords.slice((dailyPage - 1) * itemsPerPage, dailyPage * itemsPerPage);
  }, [dailyRecords, dailyPage, itemsPerPage]);

  const totalMonthlyPages = Math.ceil(monthlySummary.length / itemsPerPage) || 1;
  const paginatedMonthly = useMemo(() => {
    return monthlySummary.slice((monthlyPage - 1) * itemsPerPage, monthlyPage * itemsPerPage);
  }, [monthlySummary, monthlyPage, itemsPerPage]);

  // Daily Midnight Sweep Action
  const handleDailySweep = async () => {
    const confirmResult = await Swal.fire({
      title: 'Chốt công tự động (Daily Sweep)?',
      text: `Hệ thống sẽ quét và tự động chốt công cho toàn bộ nhân sự ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}. Nhân viên không check-in sẽ được ghi nhận Vắng (ABSENT), ngày Lễ tự động hưởng 1.0 công theo BLLĐ 2019 Điều 112.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Chốt công ngay',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#2563eb'
    });

    if (!confirmResult.isConfirmed) return;

    setSweeping(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/daily-sweep', {
        date: selectedDate
      });
      toast.success(res.data.message || 'Đã hoàn tất quét và chốt công ngày!');
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi quét chốt công');
    } finally {
      setSweeping(false);
    }
  };

  // Submit Manual Adjustment
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.date) {
      return toast.error('Vui lòng chọn nhân viên và ngày chấm công');
    }

    setSubmittingManual(true);
    try {
      const checkInISO = manualForm.checkInTime ? `${manualForm.date}T${manualForm.checkInTime}:00` : null;
      const checkOutISO = manualForm.checkOutTime ? `${manualForm.date}T${manualForm.checkOutTime}:00` : null;

      await axios.post('http://localhost:5000/api/attendance/manual', {
        employeeId: manualForm.employeeId,
        date: manualForm.date,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        status: manualForm.status,
        workingDay: Number(manualForm.workingDay),
        note: manualForm.note
      });

      toast.success('Ghi nhận điều chỉnh công thành công!');
      setShowManualModal(false);
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu điều chỉnh công');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Quick Open Manual Adjustment from table row or matrix cell
  const handleOpenEditRow = (att, fallbackEmpId = '', fallbackDateStr = '') => {
    if (att) {
      setManualForm({
        employeeId: att.employeeId,
        date: att.date ? att.date.split('T')[0] : (fallbackDateStr || selectedDate),
        checkInTime: att.checkIn ? new Date(att.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '07:50',
        checkOutTime: att.checkOut ? new Date(att.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '17:35',
        status: att.status || 'NORMAL',
        workingDay: Number(att.workingDay) ?? 1.0,
        note: 'Hiệu chỉnh công trực tiếp bởi HR'
      });
    } else {
      setManualForm({
        employeeId: fallbackEmpId,
        date: fallbackDateStr || selectedDate,
        checkInTime: '07:50',
        checkOutTime: '17:35',
        status: 'NORMAL',
        workingDay: 1.0,
        note: 'Bổ sung công trực tiếp trên bảng ma trận'
      });
    }
    setShowManualModal(true);
  };

  const formatTimeShort = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'daily') {
      if (dailyRecords.length === 0) return toast.error('Không có dữ liệu ngày để xuất');
      const headers = ['Mã NV', 'Họ và Tên', 'Phòng ban', 'Ngày', 'Giờ vào', 'Giờ ra', 'Trạng thái', 'Số công'];
      const rows = dailyRecords.map(r => [
        `"${r.employee?.code || ''}"`,
        `"${r.employee?.fullName || ''}"`,
        `"${r.employee?.department?.name || ''}"`,
        `"${new Date(r.date).toLocaleDateString('vi-VN')}"`,
        `"${r.checkIn ? formatTimeShort(r.checkIn) : '--:--'}"`,
        `"${r.checkOut ? formatTimeShort(r.checkOut) : '--:--'}"`,
        `"${r.status === 'NORMAL' ? 'Đúng giờ' : r.status === 'LATE' ? 'Đi muộn' : r.status === 'WFH' ? 'Làm từ xa (WFH)' : 'Vắng mặt'}"`,
        Number(r.workingDay)
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bang_Cong_Ngay_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (monthlySummary.length === 0) return toast.error('Không có dữ liệu tháng để xuất');
      const headers = ['Mã NV', 'Họ và Tên', 'Phòng ban', 'Công chuẩn', 'Công thực tế', 'Số lần đi muộn/thiếu giờ', 'Số ngày vắng', 'Tỷ lệ hoàn thành'];
      const rows = monthlySummary.map(m => [
        `"${m.employee.code}"`,
        `"${m.employee.fullName}"`,
        `"${m.employee.department?.name || ''}"`,
        m.standardDays,
        m.totalActualDays,
        m.lateCount,
        m.absentCount,
        `"${m.completionRate}%"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tong_Hop_Cong_Thang_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      
      {/* 1. Compact Header Toolbar (Đã bỏ 6 thẻ KPI chiếm diện tích theo yêu cầu) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.85rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '6px',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Clock size={17} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                Bảng Chấm Công Doanh Nghiệp
              </h1>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.775rem' }}>
                Click trực tiếp vào từng ô ngày trên bảng ma trận để điều chỉnh hoặc bổ sung giờ Vào / Ra.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleSyncMonth} 
            disabled={syncingMonth}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: 34, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}
            title="Đồng bộ dữ liệu qua API Gateway (ADMS) từ máy chấm công"
          >
            <Zap size={14} /> {syncingMonth ? 'Đang đồng bộ...' : `Đồng bộ máy chấm công T${selectedMonth}`}
          </button>

          <label
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: 34, borderColor: '#CBD5E1', color: '#334155', fontWeight: 600, cursor: 'pointer', margin: 0 }}
            title="Import file CSV xuất từ máy chấm công vân tay / FaceID (Mã NV, YYYY-MM-DD, HH:mm, HH:mm)"
          >
            <Upload size={14} /> Import file máy
            <input type="file" accept=".csv" onChange={handleImportMachineCSV} style={{ display: 'none' }} />
          </label>

          <button 
            onClick={() => setShowManualModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', height: 34 }}
          >
            <Plus size={14} /> Điều chỉnh công
          </button>

          <button 
            onClick={handleExportCSV} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: 34, borderColor: '#CBD5E1', color: '#059669' }}
          >
            <FileSpreadsheet size={14} /> Xuất Excel
          </button>

          <button 
            onClick={() => fetchData(false)} 
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.55rem', height: 34, borderColor: '#CBD5E1', color: '#64748B' }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* WFM Guardrail Alerts */}
      {wfhAlertDepartments.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '0.75rem',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldAlert size={18} color="#D97706" />
          <div style={{ fontSize: '0.8rem', color: '#92400E' }}>
            <strong>Cảnh báo WFH (&gt;30% quân số):</strong>{' '}
            {wfhAlertDepartments.map((a, idx) => (
              <span key={idx} style={{ marginRight: '0.75rem' }}>
                {a.deptName} ({a.wfhCount}/{a.total} - {a.ratePercent}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Tab Bar & Single-Line Filter Controls */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.6rem 0.85rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: '#F1F5F9', padding: '0.2rem', borderRadius: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '0.38rem 0.85rem',
              borderRadius: '0.375rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'matrix' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'matrix' ? '#2563EB' : '#64748B',
              boxShadow: activeTab === 'matrix' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Bảng chấm công (Ma trận)
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '0.38rem 0.85rem',
              borderRadius: '0.375rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'daily' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'daily' ? '#2563EB' : '#64748B',
              boxShadow: activeTab === 'daily' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Nhật ký theo ngày
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              padding: '0.38rem 0.85rem',
              borderRadius: '0.375rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'monthly' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'monthly' ? '#2563EB' : '#64748B',
              boxShadow: activeTab === 'monthly' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Tổng hợp công tháng
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeTab === 'daily' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>Ngày:</span>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => { setSelectedDate(e.target.value); setDailyPage(1); }}
                className="form-input"
                style={{ width: 'auto', padding: '0.25rem 0.55rem', fontSize: '0.8rem', height: 32 }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select 
                value={selectedMonth} 
                onChange={e => { setSelectedMonth(Number(e.target.value)); setMatrixPage(1); setMonthlyPage(1); }}
                className="form-input" 
                style={{ width: 'auto', padding: '0.25rem 0.55rem', fontSize: '0.8rem', height: 32, fontWeight: 600 }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={e => { setSelectedYear(Number(e.target.value)); setMatrixPage(1); setMonthlyPage(1); }}
                className="form-input" 
                style={{ width: 'auto', padding: '0.25rem 0.55rem', fontSize: '0.8rem', height: 32, fontWeight: 600 }}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>

              {activeTab === 'matrix' && (
                <select
                  value={matrixRange}
                  onChange={e => setMatrixRange(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', padding: '0.25rem 0.55rem', fontSize: '0.8rem', height: 32, backgroundColor: '#F8FAFC', color: '#1E293B', fontWeight: 600 }}
                >
                  <option value="W1">Ngày 01 ➔ 08 (Tuần 1)</option>
                  <option value="W2">Ngày 09 ➔ 16 (Tuần 2)</option>
                  <option value="W3">Ngày 17 ➔ 24 (Tuần 3)</option>
                  <option value="W4">Ngày 25 ➔ Cuối tháng</option>
                  <option value="ALL">Cả tháng (01 ➔ {new Date(selectedYear, selectedMonth, 0).getDate()})</option>
                </select>
              )}
            </div>
          )}

          <select 
            value={selectedDept} 
            onChange={e => { setSelectedDept(e.target.value); setMatrixPage(1); setDailyPage(1); setMonthlyPage(1); }}
            className="form-input"
            style={{ width: 'auto', minWidth: 145, padding: '0.25rem 0.55rem', fontSize: '0.8rem', height: 32 }}
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {activeTab === 'daily' && (
            <select 
              value={selectedStatus} 
              onChange={e => { setSelectedStatus(e.target.value); setDailyPage(1); }}
              className="form-input"
              style={{ width: 'auto', minWidth: 135, padding: '0.25rem 0.55rem', fontSize: '0.8rem', height: 32 }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="NORMAL">Đúng giờ</option>
              <option value="LATE">Đi muộn</option>
              <option value="EARLY_LEAVE">Về sớm</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="HOLIDAY">Ngày Lễ</option>
              <option value="WFH">Làm việc từ xa (WFH)</option>
              <option value="ABSENT">Vắng mặt</option>
            </select>
          )}

          <div style={{ position: 'relative', width: 185 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Tìm Tên hoặc Mã NV..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setMatrixPage(1); setDailyPage(1); setMonthlyPage(1); }}
              className="form-input"
              style={{ paddingLeft: '1.9rem', paddingRight: '0.5rem', width: '100%', fontSize: '0.8rem', height: 32 }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {activeTab === 'matrix' ? (
          /* TAB 1: TIMESHEET MATRIX (GIỐNG BẢNG CHẤM CÔNG THỰC TẾ DOANH NGHIỆP) */
          <div>
            {/* Chú thích nhanh (Legend bar) + Điều hướng tuần */}
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#475569'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#E6F4EA', border: '1px solid #A7F3D0', display: 'inline-block' }} />
                  <span>Đủ công Vào/Ra (07:50 / 17:35)</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', display: 'inline-block' }} />
                  <span>⚠ Thiếu giờ ra / Đi muộn</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', display: 'inline-block' }} />
                  <span><strong>P</strong>: Nghỉ phép</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'inline-block' }} />
                  <span><strong>—</strong>: Nghỉ cuối tuần / Chưa phát sinh</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {['W1', 'W2', 'W3', 'W4', 'ALL'].map((key, i) => {
                  const labels = ['Tuần 1 (01-08)', 'Tuần 2 (09-16)', 'Tuần 3 (17-24)', 'Tuần 4 (25+)', 'Cả tháng'];
                  return (
                    <button
                      key={key}
                      onClick={() => setMatrixRange(key)}
                      style={{
                        border: '1px solid',
                        borderColor: matrixRange === key ? '#2563EB' : '#CBD5E1',
                        backgroundColor: matrixRange === key ? '#EFF6FF' : '#FFFFFF',
                        color: matrixRange === key ? '#1D4ED8' : '#475569',
                        fontWeight: matrixRange === key ? 700 : 500,
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: matrixRange === 'ALL' ? 'fixed' : 'auto' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      backgroundColor: '#F8FAFC',
                      width: 210,
                      minWidth: 210,
                      padding: '0.6rem 0.9rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                      borderRight: '2px solid #E2E8F0'
                    }}>
                      HỌ VÀ TÊN NHÂN SỰ
                    </th>
                    {daysInSelectedMonth.map(d => (
                      <th
                        key={d.dateStr}
                        style={{
                          width: matrixRange === 'ALL' ? 68 : 'auto',
                          minWidth: 68,
                          padding: '0.45rem 0.35rem',
                          textAlign: 'center',
                          backgroundColor: d.isWeekend ? '#F1F5F9' : '#F8FAFC',
                          color: d.isWeekend ? '#64748B' : '#334155',
                          borderRight: '1px solid #E2E8F0',
                          fontSize: '0.72rem',
                          textTransform: 'none'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: d.dow === 0 ? '#DC2626' : d.dow === 6 ? '#D97706' : '#1E293B' }}>
                          {d.dowLabel}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>
                          {String(d.day).padStart(2, '0')}/{String(selectedMonth).padStart(2, '0')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={daysInSelectedMonth.length + 1} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                        <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                        Đang tải bảng chấm công ma trận...
                      </td>
                    </tr>
                  ) : paginatedMatrixEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={daysInSelectedMonth.length + 1} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                        Không tìm thấy nhân sự phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedMatrixEmployees.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        {/* Cột Tên Nhân viên cố định bên trái */}
                        <td style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          backgroundColor: '#FFFFFF',
                          padding: '0.65rem 0.9rem',
                          borderRight: '2px solid #E2E8F0',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.84rem', lineHeight: 1.3 }}>
                            {emp.fullName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 1 }}>
                            {emp.code} • {emp.department?.name || 'Chưa xếp PB'}
                          </div>
                        </td>

                        {/* Các ô ngày trong kỳ */}
                        {daysInSelectedMonth.map(d => {
                          const att = attendanceMap[`${emp.id}_${d.dateStr}`];
                          const checkInStr = att?.checkIn ? formatTimeShort(att.checkIn) : null;
                          const checkOutStr = att?.checkOut ? formatTimeShort(att.checkOut) : null;

                          // Xác định trạng thái màu sắc giống bảng chấm công thực tế của user
                          const isLeave = att?.status === 'ON_LEAVE';
                          const isHoliday = att?.status === 'HOLIDAY';
                          const isWfh = att?.status === 'WFH';
                          const isAbsent = att?.status === 'ABSENT';
                          const isMissingOut = Boolean(checkInStr && !checkOutStr && !isLeave && !isHoliday);
                          const isLateOrEarly = att?.status === 'LATE' || att?.status === 'EARLY_LEAVE' || isMissingOut;
                          const isNormalFull = Boolean(checkInStr && checkOutStr && !isLateOrEarly);

                          let cellBg = '#FFFFFF';
                          if (d.isWeekend && !att) cellBg = '#FAFAFA';
                          else if (isLeave) cellBg = '#EEF2FF'; // Xanh tím nhạt cho chữ P
                          else if (isHoliday) cellBg = '#FEF3C7';
                          else if (isWfh) cellBg = '#ECFEFF';
                          else if (isAbsent) cellBg = '#FEF2F2';
                          else if (isLateOrEarly) cellBg = '#FFF8DB'; // Vàng cam nhạt cảnh báo ⚠
                          else if (isNormalFull) cellBg = '#EBFBEE'; // Xanh lá nhạt đủ công

                          return (
                            <td
                              key={d.dateStr}
                              onClick={() => handleOpenEditRow(att, emp.id, d.dateStr)}
                              title={`Nhấn để điều chỉnh công của ${emp.fullName} ngày ${d.day}/${selectedMonth}/${selectedYear}`}
                              style={{
                                backgroundColor: cellBg,
                                borderRight: '1px solid #E2E8F0',
                                padding: '0.5rem 0.55rem',
                                verticalAlign: 'middle',
                                cursor: 'pointer',
                                minWidth: 68,
                                height: 54,
                                transition: 'filter 0.12s ease'
                              }}
                            >
                              {!att ? (
                                <div style={{ color: '#475569', fontSize: '0.82rem', fontWeight: 500 }}>—</div>
                              ) : isLeave ? (
                                <div style={{ color: '#2563EB', fontSize: '0.82rem', fontWeight: 600 }}>P</div>
                              ) : isHoliday ? (
                                <div style={{ color: '#B45309', fontSize: '0.78rem', fontWeight: 700 }}>Lễ</div>
                              ) : isWfh ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.76rem', color: '#0E7490', fontWeight: 600 }}>
                                  <span>{checkInStr || 'WFH'}</span>
                                  <span>{checkOutStr || '17:30'}</span>
                                </div>
                              ) : isAbsent ? (
                                <div style={{ color: '#DC2626', fontSize: '0.78rem', fontWeight: 600 }}>KP</div>
                              ) : isLateOrEarly ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem', lineHeight: 1.25 }}>
                                  <div style={{ color: '#854D0E', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    ⚠ {checkInStr || '--:--'}
                                  </div>
                                  <div style={{ color: '#854D0E', fontWeight: 500 }}>
                                    {checkOutStr || '—'}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem', lineHeight: 1.25 }}>
                                  <div style={{ color: '#14532D', fontWeight: 500 }}>
                                    {checkInStr || '--:--'}
                                  </div>
                                  <div style={{ color: '#14532D', fontWeight: 500 }}>
                                    {checkOutStr || '—'}
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang Matrix */}
            {totalMatrixPages > 1 && (
              <div style={{
                padding: '0.65rem 1rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Hiển thị {((matrixPage - 1) * itemsPerPage) + 1} - {Math.min(matrixPage * itemsPerPage, filteredMatrixEmployees.length)} / {filteredMatrixEmployees.length} nhân sự
                </span>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="btn btn-outline"
                    disabled={matrixPage === 1}
                    onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                    style={{ height: 28, padding: '0 8px', fontSize: '0.75rem' }}
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  {Array.from({ length: Math.min(7, totalMatrixPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalMatrixPages > 7 && matrixPage > 4) {
                      pageNum = Math.min(totalMatrixPages - 6 + i, matrixPage - 3 + i);
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`btn ${matrixPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                        style={{ height: 28, minWidth: 28, padding: '0 6px', fontSize: '0.75rem' }}
                        onClick={() => setMatrixPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-outline"
                    disabled={matrixPage === totalMatrixPages}
                    onClick={() => setMatrixPage(p => Math.min(totalMatrixPages, p + 1))}
                    style={{ height: 28, padding: '0 8px', fontSize: '0.75rem' }}
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'daily' ? (
          /* TAB 2: DAILY ATTENDANCE */
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem', width: 100 }}>Mã NV</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nhân sự</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phòng ban</th>
                  <th style={{ padding: '0.75rem 1rem', width: 120 }}>Giờ Check-in</th>
                  <th style={{ padding: '0.75rem 1rem', width: 120 }}>Giờ Check-out</th>
                  <th style={{ padding: '0.75rem 1rem', width: 120 }}>Đi muộn (phút)</th>
                  <th style={{ padding: '0.75rem 1rem', width: 130 }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', width: 90, textAlign: 'center' }}>Số công</th>
                  <th style={{ padding: '0.75rem 1rem', width: 85, textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                      Đang tải dữ liệu chấm công...
                    </td>
                  </tr>
                ) : dailyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                      <Clock size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                      <div>Không có bản ghi chấm công nào trong ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}.</div>
                      <button
                        onClick={handleDailySweep}
                        className="btn btn-outline"
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem', height: 32 }}
                      >
                        <Zap size={14} /> Quét chốt công ngày này
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedDailyRecords.map(att => {
                    const checkInDate = att.checkIn ? new Date(att.checkIn) : null;
                    const checkOutDate = att.checkOut ? new Date(att.checkOut) : null;
                    
                    let lateMinutes = 0;
                    if (checkInDate) {
                      const totalMin = checkInDate.getHours() * 60 + checkInDate.getMinutes();
                      const standardMin = 8 * 60 + 30;
                      if (totalMin > standardMin) {
                        lateMinutes = totalMin - standardMin;
                      }
                    }

                    return (
                      <tr key={att.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#2563EB' }}>
                          {att.employee?.code || '—'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#0F172A' }}>
                          {att.employee?.fullName}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', color: '#475569' }}>
                          {att.employee?.department?.name || '—'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: checkInDate ? '#0F172A' : '#94A3B8' }}>
                          {checkInDate ? formatTimeShort(att.checkIn) : '--:--'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: checkOutDate ? '#0F172A' : '#94A3B8' }}>
                          {checkOutDate ? formatTimeShort(att.checkOut) : '—'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          {lateMinutes > 0 ? (
                            <span style={{ color: lateMinutes > 15 ? '#B91C1C' : '#B45309', fontWeight: 600 }}>
                              +{lateMinutes} phút {lateMinutes <= 15 ? '(ân hạn)' : ''}
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontSize: '0.8rem' }}>Đúng giờ</span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          {att.status === 'NORMAL' && <span className="badge badge-success">Đúng giờ</span>}
                          {att.status === 'LATE' && <span className="badge badge-warning">Đi muộn</span>}
                          {att.status === 'EARLY_LEAVE' && <span className="badge badge-warning">Thiếu giờ / Về sớm</span>}
                          {att.status === 'ON_LEAVE' && <span className="badge badge-info">Nghỉ phép (P)</span>}
                          {att.status === 'HOLIDAY' && <span className="badge badge-warning">Ngày Lễ</span>}
                          {att.status === 'WFH' && <span className="badge badge-info">WFH</span>}
                          {att.status === 'ABSENT' && <span className="badge badge-error">Vắng mặt</span>}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 700 }}>
                          {Number(att.workingDay).toFixed(1)}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEditRow(att)}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.5rem', height: 28, color: '#2563EB', borderColor: '#E2E8F0' }}
                            title="Chỉnh sửa công"
                          >
                            <Edit3 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 3: MONTHLY SUMMARY */
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem', width: 100 }}>Mã NV</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nhân sự</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phòng ban</th>
                  <th style={{ padding: '0.75rem 1rem', width: 110, textAlign: 'center' }}>Công chuẩn</th>
                  <th style={{ padding: '0.75rem 1rem', width: 120, textAlign: 'center' }}>Công thực tế</th>
                  <th style={{ padding: '0.75rem 1rem', width: 130, textAlign: 'center' }}>Đi muộn / Thiếu giờ</th>
                  <th style={{ padding: '0.75rem 1rem', width: 110, textAlign: 'center' }}>Nghỉ phép (P)</th>
                  <th style={{ padding: '0.75rem 1rem', width: 150 }}>Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMonthly.map(item => (
                  <tr key={item.employee.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#2563EB' }}>
                      {item.employee.code}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#0F172A' }}>
                      {item.employee.fullName}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: '#475569' }}>
                      {item.employee.department?.name || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                      {item.standardDays}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 800, color: '#15803D' }}>
                      {item.totalActualDays}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: item.lateCount > 0 ? '#B45309' : '#64748B', fontWeight: 600 }}>
                      {item.lateCount} lần
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#2563EB', fontWeight: 600 }}>
                      {item.onLeaveCount} ngày
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, backgroundColor: '#E2E8F0', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${item.completionRate}%`,
                            backgroundColor: item.completionRate >= 90 ? '#10B981' : item.completionRate >= 70 ? '#3B82F6' : '#EF4444',
                            height: '100%'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: 35 }}>
                          {item.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Điều chỉnh công thủ công (Manual Adjustment) */}
      {showManualModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '1rem',
            width: '100%', maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0', overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  Ghi nhận / Điều chỉnh Công
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Cập nhật giờ Vào / Ra hoặc trạng thái nghỉ phép (P)</span>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Nhân sự <span style={{ color: '#EF4444' }}>*</span></label>
                <select 
                  className="form-input w-full"
                  value={manualForm.employeeId}
                  onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.code} - {e.fullName} ({e.department?.name || 'Chưa xếp PB'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Ngày chấm công <span style={{ color: '#EF4444' }}>*</span></label>
                  <input 
                    type="date"
                    className="form-input w-full"
                    value={manualForm.date}
                    onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Số ngày công</label>
                  <select 
                    className="form-input w-full"
                    value={manualForm.workingDay}
                    onChange={e => setManualForm({ ...manualForm, workingDay: Number(e.target.value) })}
                  >
                    <option value={1.0}>1.0 công (Đủ ngày)</option>
                    <option value={0.5}>0.5 công (Nửa ngày)</option>
                    <option value={0.0}>0.0 công (Vắng)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Giờ vào (Check-in)</label>
                  <input 
                    type="time"
                    className="form-input w-full"
                    value={manualForm.checkInTime}
                    onChange={e => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Giờ ra (Check-out)</label>
                  <input 
                    type="time"
                    className="form-input w-full"
                    value={manualForm.checkOutTime}
                    onChange={e => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Trạng thái</label>
                <select 
                  className="form-input w-full"
                  value={manualForm.status}
                  onChange={e => setManualForm({ ...manualForm, status: e.target.value })}
                >
                  <option value="NORMAL">Đúng giờ / Đủ công (Xanh lá)</option>
                  <option value="EARLY_LEAVE">Thiếu giờ ra / Về sớm (Vàng ⚠)</option>
                  <option value="LATE">Đi muộn (Vàng ⚠)</option>
                  <option value="ON_LEAVE">Nghỉ phép có lương (Chữ P)</option>
                  <option value="WFH">Làm việc từ xa (WFH)</option>
                  <option value="HOLIDAY">Ngày Lễ</option>
                  <option value="ABSENT">Vắng không phép (KP)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Ghi chú / Lý do <span style={{ color: '#EF4444' }}>*</span></label>
                <textarea 
                  className="form-input w-full"
                  rows={2}
                  value={manualForm.note}
                  onChange={e => setManualForm({ ...manualForm, note: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button type="submit" disabled={submittingManual} className="btn btn-primary">
                  {submittingManual ? 'Đang lưu...' : 'Lưu điều chỉnh'}
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
