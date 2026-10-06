import React, { useState, useEffect } from 'react';
import { Download, Calculator, Lock, Banknote, ShieldAlert, FileSignature } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const PayrollMgmt = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [periodInfo, setPeriodInfo] = useState({ status: 'DRAFT' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollRes, periodRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/payroll?month=${month}&year=${year}`),
        axios.get(`http://localhost:5000/api/payroll/period/info?month=${month}&year=${year}`)
      ]);
      setPayrolls(payrollRes.data);
      setPeriodInfo(periodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleGenerate = async () => {
    if (periodInfo.status === 'LOCKED') {
      return toast.error(`Kỳ lương ${month}/${year} đã bị KHÓA SỔ. Cần mở khóa trước khi chạy lại!`);
    }
    try {
      await axios.post('http://localhost:5000/api/payroll/generate', { month, year });
      toast.success(`Đã tính toán xong bảng lương tháng ${month}/${year}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tính lương');
    }
  };

  const handleTogglePeriodLock = async () => {
    const isLocked = periodInfo.status === 'LOCKED';
    const actionText = isLocked ? 'MỞ KHÓA' : 'KHÓA SỔ';
    const confirmText = isLocked
      ? `Bạn có chắc muốn MỞ KHÓA kỳ lương tháng ${month}/${year}? (Cho phép nhân sự điều chỉnh công và tính lại lương)`
      : `Bạn có chắc muốn KHÓA SỔ kỳ lương tháng ${month}/${year}? (Sau khi khóa, dữ liệu công và lương sẽ chuyển sang Read-Only để phục vụ chi trả)`;

    const result = await Swal.fire({
      title: `${actionText} Kỳ Lương?`,
      text: confirmText,
      icon: isLocked ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonText: `${actionText} ngay`,
      cancelButtonText: 'Đóng',
      confirmButtonColor: isLocked ? '#0284c7' : '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const nextStatus = isLocked ? 'DRAFT' : 'LOCKED';
        await axios.post('http://localhost:5000/api/payroll/period/toggle-lock', {
          month,
          year,
          status: nextStatus
        });
        toast.success(`Đã ${actionText} kỳ lương thành công!`);
        fetchData();
      } catch (err) {
        toast.error('Lỗi khi đổi trạng thái khóa kỳ lương');
      }
    }
  };

  const handleLock = async (id) => {
    const result = await Swal.fire({ title: 'Xác nhận', text: 'Bạn có chắc muốn chốt lương nhân sự này? (Chỉ có thể mở khóa bởi sếp)', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' });
    if (!result.isConfirmed) return;
    try {
      await axios.put(`http://localhost:5000/api/payroll/${id}/status`, { status: 'LOCKED' });
      fetchData();
    } catch (err) {
      toast.error("Lỗi khi chốt lương");
    }
  };

  const handleExportExcel = () => {
    if (payrolls.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    const headers = ["Mã NV", "Họ và tên", "Phòng ban", "Lương cơ bản (VND)", "Số ngày công", "Khấu trừ (VND)", "Thực lãnh (VND)", "Trạng thái"];
    const rows = payrolls.map(pr => [
      `"${pr.employee?.code || ''}"`,
      `"${pr.employee?.fullName || ''}"`,
      `"${pr.employee?.department?.name || ''}"`,
      pr.baseSalary || 0,
      pr.workingDays || 0,
      pr.totalDeduction || 0,
      pr.netSalary || 0,
      pr.status === 'LOCKED' ? '"Đã chốt"' : '"Đang duyệt"'
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Luong_Thang_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  const totalBase = payrolls.reduce((sum, p) => sum + Number(p.baseSalary), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);
  const totalDeduction = payrolls.reduce((sum, p) => sum + Number(p.totalDeduction), 0);

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               Bảng Lương Tháng {month}/{year}
            </h2>
            {periodInfo.status === 'LOCKED' ? (
              <span className="badge badge-danger flex items-center gap-1 font-bold">
                <Lock size={12} /> ĐÃ KHÓA SỔ
              </span>
            ) : (
              <span className="badge badge-warning flex items-center gap-1 font-bold">
                BẢN NHÁP (MỞ)
              </span>
            )}
          </div>
          <p className="text-muted mt-1">Động cơ tính lương tự động cào số công & hợp đồng</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
             <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Tháng {m}</option>)}
             </select>
             <select className="form-input" value={year} onChange={e => setYear(Number(e.target.value))}>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
             </select>
          </div>
          <button
            onClick={handleTogglePeriodLock}
            className="btn btn-outline"
            style={periodInfo.status === 'LOCKED' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'var(--danger)', color: 'var(--danger)' }}
            title={periodInfo.status === 'LOCKED' ? "Mở khóa sổ" : "Khóa sổ kỳ lương"}
          >
            <Lock size={18} /> {periodInfo.status === 'LOCKED' ? 'Mở Khóa Sổ' : 'Khóa Sổ Kỳ Này'}
          </button>
          <button onClick={handleGenerate} className="btn btn-primary" disabled={periodInfo.status === 'LOCKED'}>
            <Calculator size={18} /> Chạy Bảng Lương
          </button>
          <button onClick={handleExportExcel} className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
            <Download size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card text-center flex-col items-center glass card-hover">
          <Banknote size={24} className="mb-3" style={{ color: 'var(--accent)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Tổng Quỹ Lương (Base)</span>
          <span className="money-text text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {formatCurrency(totalBase)}
          </span>
        </div>
        <div className="card text-center flex-col items-center glass card-hover" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <Banknote size={24} className="mb-3" style={{ color: 'var(--success)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Tổng Thực Chi (Net)</span>
          <span className="money-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {formatCurrency(totalNet)}
          </span>
        </div>
        <div className="card text-center flex-col items-center glass card-hover">
          <ShieldAlert size={24} className="mb-3" style={{ color: 'var(--error)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Tổng Khấu Trừ (Phạt/Thuế)</span>
          <span className="money-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)' }}>
            {formatCurrency(totalDeduction)}
          </span>
        </div>
        <div className="card text-center flex-col items-center glass card-hover">
          <FileSignature size={24} className="mb-3" style={{ color: 'var(--warning)' }}/>
          <span className="text-muted mb-1 text-sm uppercase tracking-wider">Trạng thái Kỳ Lương</span>
          <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.6rem 1.2rem', marginTop: '0.25rem' }}>Đang tính (Draft)</span>
        </div>
      </div>

      <div className="card glass">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '1.1rem' }}>Chi tiết lương nhân viên</h3>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Công thức: <strong>Net = (Base / 22) * Số ngày công thực tế - Phạt</strong></span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th><div className="text-right">Lương cơ bản (Base)</div></th>
                <th><div className="text-right">Số công</div></th>
                <th><div className="text-right" style={{ color: 'var(--error)' }}>- Trừ Thuế & Phạt</div></th>
                <th style={{ backgroundColor: 'var(--bg-hover)' }}><div className="text-right">Thực lãnh (Net)</div></th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-8 text-muted">Đang tải dữ liệu...</td></tr>
              ) : payrolls.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-8 text-muted">Chưa chạy bảng lương cho tháng này. Hãy bấm "Chạy Bảng Lương".</td></tr>
              ) : (
                payrolls.map(pr => (
                  <tr key={pr.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {pr.employee?.code}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{pr.employee?.fullName.charAt(0)}</div>
                        <div className="flex-col gap-1">
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pr.employee?.fullName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pr.employee?.department?.name || 'Không có PB'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right money-text">{formatCurrency(pr.baseSalary)}</td>
                    <td className="text-right font-bold" style={{ color: 'var(--warning)' }}>{Number(pr.workingDays)} ngày</td>
                    <td className="text-right money-text" style={{ color: 'var(--error)' }}>
                      {formatCurrency(pr.totalDeduction)}
                    </td>
                    <td className="text-right money-text" style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.05rem', backgroundColor: 'var(--bg-hover)' }}>
                      {formatCurrency(pr.netSalary)}
                    </td>
                    <td className="text-center">
                      {pr.status === 'LOCKED' ? (
                        <Lock size={16} color="var(--text-muted)" title="Đã chốt" />
                      ) : (
                        <button onClick={() => handleLock(pr.id)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          Chốt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

