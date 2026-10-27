import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Search, Download, RefreshCw, Calendar, Users, 
  CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, 
  FileSpreadsheet, Filter, Check, X, ShieldAlert, Zap, Edit3, Plus, Laptop, Building2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const AttendanceMgmt = () => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'monthly'
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Phân trang chuẩn Positions.jsx
  const [dailyPage, setDailyPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const itemsPerPage = 10;

  // Manual Adjust Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '08:30',
    checkOutTime: '17:30',
    status: 'NORMAL',
    workingDay: 1.0,
    note: 'Điều chỉnh công theo đề xuất nhân viên'
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes, deptRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments')
      ]);
      setAttendances(attRes.data || []);
      setEmployees((empRes.data || []).filter(e => e.status !== 'RESIGNED'));
      setDepartments(deptRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Statistics for the selected day
  const stats = useMemo(() => {
    const totalActive = employees.length;
    const recordsOnDay = attendances.filter(att => (att.date && att.date.split('T')[0]) === selectedDate);
    const onTime = recordsOnDay.filter(r => r.status === 'NORMAL').length;
    const late = recordsOnDay.filter(r => r.status === 'LATE').length;
    const earlyLeave = recordsOnDay.filter(r => r.status === 'EARLY_LEAVE').length;
    const onLeave = recordsOnDay.filter(r => r.status === 'ON_LEAVE').length;
    const holiday = recordsOnDay.filter(r => r.status === 'HOLIDAY').length;
    const absent = recordsOnDay.filter(r => r.status === 'ABSENT').length;
    const wfh = recordsOnDay.filter(r => r.status === 'WFH').length;
    const presentCount = onTime + late + earlyLeave + wfh;
    const presentRate = totalActive > 0 ? Math.round((presentCount / totalActive) * 100) : 0;

    return { totalActive, presentCount, onTime, late, earlyLeave, onLeave, holiday, absent, wfh, presentRate };
  }, [attendances, employees, selectedDate]);

  // WFM Remote / WFH Guardrail Check (Cảnh báo định mức 30% quân số theo quy định nội bộ)
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
      // Find all records of this employee in selectedMonth & selectedYear
      const empRecords = attendances.filter(att => {
        if (!att.date || att.employeeId !== emp.id) return false;
        const d = new Date(att.date);
        return d.getMonth() + 1 === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      });

      const totalActualDays = empRecords.reduce((sum, r) => sum + (Number(r.workingDay) || 0), 0);
      const lateCount = empRecords.filter(r => r.status === 'LATE').length;
      const earlyLeaveCount = empRecords.filter(r => r.status === 'EARLY_LEAVE').length;
      const onLeaveCount = empRecords.filter(r => r.status === 'ON_LEAVE').length;
      const holidayCount = empRecords.filter(r => r.status === 'HOLIDAY').length;
      const absentCount = empRecords.filter(r => r.status === 'ABSENT').length;
      const wfhCount = empRecords.filter(r => r.status === 'WFH').length;
      const standardDays = 22; // chuẩn doanh nghiệp
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
      fetchData();
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
      const checkInISO = manualForm.checkInTime ? `${manualForm.date}T${manualForm.checkForm || manualForm.checkInTime}:00` : null;
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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu điều chỉnh công');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Quick Open Manual Adjustment from table row
  const handleOpenEditRow = (att) => {
    setManualForm({
      employeeId: att.employeeId,
      date: att.date ? att.date.split('T')[0] : selectedDate,
      checkInTime: att.checkIn ? new Date(att.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:30',
      checkOutTime: att.checkOut ? new Date(att.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '17:30',
      status: att.status || 'NORMAL',
      workingDay: Number(att.workingDay) || 1.0,
      note: 'Hiệu chỉnh công trực tiếp bởi HR'
    });
    setShowManualModal(true);
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
        `"${r.checkIn ? new Date(r.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}"`,
        `"${r.checkOut ? new Date(r.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}"`,
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
      const headers = ['Mã NV', 'Họ và Tên', 'Phòng ban', 'Công chuẩn', 'Công thực tế', 'Số lần đi muộn', 'Số ngày vắng', 'Tỷ lệ hoàn thành'];
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
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '6px',
              backgroundColor: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={18} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Quản lý Chấm công & Bảng công Doanh nghiệp
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Giám sát thời gian thực, tự động tính công chuẩn theo BLLĐ 2019 (Ân hạn 15 phút: 08:45).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleDailySweep} 
            disabled={sweeping}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.875rem' }}
            title="Chốt công tự động cho toàn công ty ngày hôm nay"
          >
            <Zap size={16} /> {sweeping ? 'Đang chốt...' : 'Quét chốt công ngày'}
          </button>

          <button 
            onClick={() => setShowManualModal(true)} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.875rem', borderColor: '#CBD5E1', color: '#334155' }}
          >
            <Plus size={16} /> Điều chỉnh công
          </button>

          <button 
            onClick={handleExportCSV} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.875rem', borderColor: '#CBD5E1', color: '#059669' }}
          >
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>

          <button 
            onClick={fetchData} 
            className="btn btn-outline"
            style={{ padding: '0.55rem', borderColor: '#CBD5E1', color: '#64748B' }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Card 1: Tổng quân số */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Quân số công ty</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{stats.totalActive}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Nhân sự đang làm việc</div>
          </div>
        </div>

        {/* Card 2: Đúng giờ */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Đúng giờ (On-time)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534' }}>{stats.onTime}</div>
            <div style={{ fontSize: '0.75rem', color: '#15803D' }}>Check-in &le; 08:45</div>
          </div>
        </div>

        {/* Card 3: Đi muộn & Về sớm */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Muộn / Về sớm</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>
              {stats.late} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>/ {stats.earlyLeave} sớm</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B45309' }}>Check-in &gt; 08:45 hoặc ra &lt; 17:00</div>
          </div>
        </div>

        {/* Card 4: Nghỉ phép hợp lệ */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '8px', backgroundColor: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4338CA', textTransform: 'uppercase' }}>Nghỉ phép (On Leave)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4338CA' }}>{stats.onLeave}</div>
            <div style={{ fontSize: '0.75rem', color: '#6366F1' }}>Có đơn xin nghỉ được duyệt</div>
          </div>
        </div>

        {/* Card 5: Vắng mặt không phép */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Vắng mặt (Absent)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991B1B' }}>{stats.absent}</div>
            <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>Không check-in & không phép</div>
          </div>
        </div>

        {/* Card 6: Tỷ lệ có mặt */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase' }}>Tỷ lệ có mặt</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8' }}>{stats.presentRate}%</div>
            <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>{stats.presentCount}/{stats.totalActive} nhân viên</div>
          </div>
        </div>
      </div>

      {/* 2.5. WFM Guardrail Alerts */}

      {wfhAlertDepartments.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '0.75rem',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div style={{ width: 38, height: 38, borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldAlert size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              CẢNH BÁO QUY CHẾ WFM / WFH (VƯỢT ĐỊNH MỨC 30% QUÂN SỐ PHÒNG BAN)
              <span style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 8px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                BLLĐ 2019 Điều 105 & Quy chế nội bộ
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '2px' }}>
              {wfhAlertDepartments.map((a, idx) => (
                <span key={idx} style={{ marginRight: '1rem' }}>
                  • <strong>{a.deptName}:</strong> {a.wfhCount}/{a.total} nhân sự ({a.ratePercent}%) làm việc từ xa.
                </span>
              ))}
              <span>Yêu cầu Trưởng bộ phận rà soát phê duyệt để đảm bảo vận hành trực tiếp.</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab Bar & Filter Controls */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
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
              padding: '0.45rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'monthly' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'monthly' ? '#2563EB' : '#64748B',
              boxShadow: activeTab === 'monthly' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Bảng tổng hợp tháng
          </button>
        </div>

        {/* Filters according to active tab */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeTab === 'daily' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Ngày xem:</span>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => { setSelectedDate(e.target.value); setDailyPage(1); }}
                className="form-input"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Kỳ công:</span>
              <select 
                value={selectedMonth} 
                onChange={e => { setSelectedMonth(Number(e.target.value)); setMonthlyPage(1); }}
                className="form-input" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={e => { setSelectedYear(Number(e.target.value)); setMonthlyPage(1); }}
                className="form-input" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          )}

          <select 
            value={selectedDept} 
            onChange={e => { setSelectedDept(e.target.value); setDailyPage(1); setMonthlyPage(1); }}
            className="form-input"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
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
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="NORMAL">Đúng giờ</option>
              <option value="LATE">Đi muộn</option>
              <option value="EARLY_LEAVE">Về sớm</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="HOLIDAY">Ngày Lễ</option>
              <option value="WFH">Làm việc từ xa (WFH)</option>
              <option value="ABSENT">Vắng mặt (Không phép)</option>
            </select>
          )}

          <div style={{ position: 'relative', width: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Tìm theo Tên hoặc Mã NV..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setDailyPage(1); setMonthlyPage(1); }}
              className="form-input"
              style={{ paddingLeft: '2.1rem', paddingRight: '0.5rem', width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Data Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {activeTab === 'daily' ? (
          /* TAB 1: DAILY ATTENDANCE */
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem', width: 110 }}>Mã NV</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Nhân sự</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Phòng ban</th>
                  <th style={{ padding: '0.85rem 1rem', width: 130 }}>Giờ Check-in</th>
                  <th style={{ padding: '0.85rem 1rem', width: 130 }}>Giờ Check-out</th>
                  <th style={{ padding: '0.85rem 1rem', width: 120 }}>Đi muộn (phút)</th>
                  <th style={{ padding: '0.85rem 1rem', width: 130 }}>Trạng thái</th>
                  <th style={{ padding: '0.85rem 1rem', width: 100, textAlign: 'center' }}>Số công</th>
                  <th style={{ padding: '0.85rem 1rem', width: 90, textAlign: 'right' }}>Thao tác</th>
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
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                      <Clock size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                      Không có bản ghi chấm công nào phù hợp trong ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}.
                    </td>
                  </tr>
                ) : (
                  paginatedDailyRecords.map(att => {
                    const checkInDate = att.checkIn ? new Date(att.checkIn) : null;
                    const checkOutDate = att.checkOut ? new Date(att.checkOut) : null;
                    
                    // Phút đi muộn sau 08:30
                    let lateMinutes = 0;
                    if (checkInDate) {
                      const h = checkInDate.getHours();
                      const m = checkInDate.getMinutes();
                      const totalMin = h * 60 + m;
                      const standardMin = 8 * 60 + 30; // 08:30
                      if (totalMin > standardMin) {
                        lateMinutes = totalMin - standardMin;
                      }
                    }

                    return (
                      <tr key={att.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="hover:bg-slate-50">
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2563EB' }}>
                          {att.employee?.code || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              backgroundColor: '#EFF6FF', color: '#1D4ED8',
                              fontWeight: 700, fontSize: '0.8rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {att.employee?.fullName?.split(' ').pop()?.substring(0, 2).toUpperCase() || 'NV'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0F172A' }}>{att.employee?.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{att.employee?.position?.title || 'Nhân viên'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                          {att.employee?.department?.name || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: checkInDate ? '#0F172A' : '#94A3B8' }}>
                          {checkInDate ? checkInDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: checkOutDate ? '#0F172A' : '#94A3B8' }}>
                          {checkOutDate ? checkOutDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {lateMinutes > 0 ? (
                            <span style={{ color: lateMinutes > 15 ? '#B91C1C' : '#B45309', fontWeight: 600 }}>
                              +{lateMinutes} phút {lateMinutes <= 15 ? '(ân hạn)' : ''}
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontSize: '0.8rem' }}>Đúng giờ</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {att.status === 'NORMAL' && (
                            <span className="badge badge-success" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Đúng giờ</span>
                          )}
                          {att.status === 'LATE' && (
                            <span className="badge badge-warning" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Đi muộn</span>
                          )}
                          {att.status === 'EARLY_LEAVE' && (
                            <span className="badge" style={{ backgroundColor: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                              ⏱️ Về sớm
                            </span>
                          )}
                          {att.status === 'ON_LEAVE' && (
                            <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#4338CA', border: '1px solid #C7D2FE', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                              🏖️ Nghỉ phép
                            </span>
                          )}
                          {att.status === 'HOLIDAY' && (
                            <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                              🎉 Ngày Lễ
                            </span>
                          )}
                          {att.status === 'WFH' && (
                            <span className="badge" style={{ backgroundColor: '#CFFAFE', color: '#0E7490', border: '1px solid #A5F3FC', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                              🏠 WFH (Từ xa)
                            </span>
                          )}
                          {att.status === 'ABSENT' && (
                            <span className="badge badge-error" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Vắng mặt</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: Number(att.workingDay) >= 1 ? '#DCFCE7' : Number(att.workingDay) > 0 ? '#FEF3C7' : '#F1F5F9',
                            color: Number(att.workingDay) >= 1 ? '#15803D' : Number(att.workingDay) > 0 ? '#B45309' : '#64748B'
                          }}>
                            {Number(att.workingDay).toFixed(1)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEditRow(att)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.5rem', color: '#2563EB', borderColor: '#E2E8F0' }}
                            title="Chỉnh sửa công"
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {totalDailyPages > 1 && (
              <div style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Hiển thị {((dailyPage - 1) * itemsPerPage) + 1} - {Math.min(dailyPage * itemsPerPage, dailyRecords.length)} trong tổng số {dailyRecords.length} bản ghi chấm công
                </span>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-outline" 
                    disabled={dailyPage === 1}
                    onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                    style={{ height: 32, padding: '0 12px', fontSize: '0.8rem' }}
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalDailyPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn ${dailyPage === page ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        height: 32, minWidth: 32, padding: 0,
                        fontSize: '0.8rem', fontWeight: dailyPage === page ? 700 : 500
                      }}
                      onClick={() => setDailyPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button 
                    className="btn btn-outline"
                    disabled={dailyPage === totalDailyPages}
                    onClick={() => setDailyPage(p => Math.min(totalDailyPages, p + 1))}
                    style={{ height: 32, padding: '0 12px', fontSize: '0.8rem' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: MONTHLY SUMMARY MATRIX */
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem', width: 110 }}>Mã NV</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Nhân sự</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Phòng ban</th>
                  <th style={{ padding: '0.85rem 1rem', width: 110, textAlign: 'center' }}>Công chuẩn</th>
                  <th style={{ padding: '0.85rem 1rem', width: 120, textAlign: 'center' }}>Công thực tế</th>
                  <th style={{ padding: '0.85rem 1rem', width: 110, textAlign: 'center' }}>Số lần muộn</th>
                  <th style={{ padding: '0.85rem 1rem', width: 110, textAlign: 'center' }}>Số ngày vắng</th>
                  <th style={{ padding: '0.85rem 1rem', width: 160 }}>Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                      Đang tính toán tổng hợp công tháng...
                    </td>
                  </tr>
                ) : monthlySummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                      Không có nhân sự nào phù hợp trong danh sách.
                    </td>
                  </tr>
                ) : (
                  paginatedMonthly.map(item => (
                    <tr key={item.employee.id} style={{ borderBottom: '1px solid #F1F5F9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2563EB' }}>
                        {item.employee.code}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.employee.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.employee.position?.title || '—'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                        {item.employee.department?.name || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                        {item.standardDays}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color: Number(item.totalActualDays) >= 20 ? '#15803D' : '#0F172A' }}>
                          {item.totalActualDays}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {item.lateCount > 0 ? (
                          <span style={{ color: '#B45309', fontWeight: 600 }}>{item.lateCount} lần</span>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '0.8rem' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: item.absentCount > 0 ? '#B91C1C' : '#64748B' }}>
                        {item.absentCount}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, backgroundColor: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${item.completionRate}%`,
                              backgroundColor: item.completionRate >= 90 ? '#10B981' : item.completionRate >= 70 ? '#3B82F6' : '#EF4444',
                              height: '100%',
                              borderRadius: 4
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: 35 }}>
                            {item.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalMonthlyPages > 1 && (
              <div style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Hiển thị {((monthlyPage - 1) * itemsPerPage) + 1} - {Math.min(monthlyPage * itemsPerPage, monthlySummary.length)} trong tổng số {monthlySummary.length} nhân sự
                </span>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-outline" 
                    disabled={monthlyPage === 1}
                    onClick={() => setMonthlyPage(p => Math.max(1, p - 1))}
                    style={{ height: 32, padding: '0 12px', fontSize: '0.8rem' }}
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalMonthlyPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn ${monthlyPage === page ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        height: 32, minWidth: 32, padding: 0,
                        fontSize: '0.8rem', fontWeight: monthlyPage === page ? 700 : 500
                      }}
                      onClick={() => setMonthlyPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button 
                    className="btn btn-outline"
                    disabled={monthlyPage === totalMonthlyPages}
                    onClick={() => setMonthlyPage(p => Math.min(totalMonthlyPages, p + 1))}
                    style={{ height: 32, padding: '0 12px', fontSize: '0.8rem' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Modal Điều chỉnh công thủ công (Manual Adjustment) */}
      {showManualModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '1rem',
            width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0', overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Ghi nhận / Điều chỉnh Công thủ công
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Dành cho trường hợp quên chấm công hoặc công tác ngoài</span>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Chọn nhân sự <span style={{ color: '#EF4444' }}>*</span></label>
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
                  <label className="form-label">Số ngày công quy đổi</label>
                  <select 
                    className="form-input w-full"
                    value={manualForm.workingDay}
                    onChange={e => setManualForm({ ...manualForm, workingDay: Number(e.target.value) })}
                  >
                    <option value={1.0}>1.0 công (Cả ngày &ge;7.5h)</option>
                    <option value={0.5}>0.5 công (Nửa ngày &ge;3.5h)</option>
                    <option value={0.0}>0.0 công (Vắng / Không đủ giờ)</option>
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
                <label className="form-label">Trạng thái ghi nhận</label>
                <select 
                  className="form-input w-full"
                  value={manualForm.status}
                  onChange={e => setManualForm({ ...manualForm, status: e.target.value })}
                >
                  <option value="NORMAL">Đúng giờ (NORMAL)</option>
                  <option value="LATE">Đi muộn (LATE)</option>
                  <option value="EARLY_LEAVE">Về sớm (EARLY_LEAVE)</option>
                  <option value="ON_LEAVE">Nghỉ phép (ON_LEAVE)</option>
                  <option value="HOLIDAY">Ngày Lễ (HOLIDAY)</option>
                  <option value="WFH">Làm việc từ xa (WFH - Hệ số 1.0)</option>
                  <option value="ABSENT">Vắng mặt (ABSENT)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Lý do điều chỉnh / Ghi chú <span style={{ color: '#EF4444' }}>*</span></label>
                <textarea 
                  className="form-input w-full"
                  rows={3}
                  placeholder="Ghi rõ lý do (Quên mang thẻ, máy vân tay lỗi, đi công tác khách hàng...)"
                  value={manualForm.note}
                  onChange={e => setManualForm({ ...manualForm, note: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowManualModal(false)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={submittingManual}
                  className="btn btn-primary"
                >
                  {submittingManual ? 'Đang lưu...' : 'Xác nhận điều chỉnh'}
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
