import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, AlertCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';


export const AttendanceMgmt = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]); // Để dùng cho form check-in nhanh
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected for checkin simulation (Vì chưa có màn hình Login cho nhân viên)
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/employees')
      ]);
      setAttendances(attRes.data);
      setEmployees(empRes.data.filter(e => e.status !== 'RESIGNED'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    if (!selectedEmpId) return toast.error('Vui lòng chọn nhân viên để Check-in');
    try {
      await axios.post('http://localhost:5000/api/attendance/check-in', { employeeId: selectedEmpId });
      toast.success('Check-in thành công!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi Check-in');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmpId) return toast.error('Vui lòng chọn nhân viên để Check-out');
    try {
      await axios.post('http://localhost:5000/api/attendance/check-out', { employeeId: selectedEmpId });
      toast.success('Check-out thành công!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi Check-out');
    }
  };

  const filteredAttendances = attendances.filter(att => 
    att.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    att.employee?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (filteredAttendances.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    const headers = ["Mã NV", "Tên nhân sự", "Ngày", "Check-in", "Check-out", "Trạng thái", "Số công"];
    const rows = filteredAttendances.map(att => [
      `"${att.employee?.code || ''}"`,
      `"${att.employee?.fullName || ''}"`,
      `"${new Date(att.date).toLocaleDateString('vi-VN')}"`,
      `"${att.checkIn ? new Date(att.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--'}"`,
      `"${att.checkOut ? new Date(att.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--'}"`,
      `"${att.status === 'NORMAL' ? 'Đúng giờ' : att.status === 'LATE' ? 'Đi muộn' : 'Nghỉ phép'}"`,
      Number(att.workingDay)
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Cong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Quản lý Chấm công
          </h2>
          <p className="text-muted mt-1">Giám sát giờ giấc & Tự động tính công theo bộ luật LLA</p>
        </div>
        <div className="flex gap-2 items-center">
           <select className="form-input" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} style={{ padding: '0.4rem 1rem' }}>
              <option value="">-- Chọn NV để giả lập --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
           </select>
           <button onClick={handleCheckIn} className="btn btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
             Check-in
           </button>
           <button onClick={handleCheckOut} className="btn btn-outline" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
             Check-out
           </button>
           <button onClick={handleExportExcel} className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)', marginLeft: '1rem' }}>
             <Download size={18} /> Xuất Excel
           </button>
        </div>
      </div>

      <div className="card glass mb-6 card-hover">
        <div className="flex gap-4 mb-2">
          <div className="flex-col" style={{ flex: 1 }}>
            <label className="form-label text-muted">Tìm kiếm nhân sự</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input bg-white" placeholder="Nhập Mã NV, Tên NV..." style={{ paddingLeft: '2.75rem' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-muted" style={{ fontSize: '0.85rem' }}>
        <AlertCircle size={16} color="var(--warning)" />
        <span><strong>Luật công ty:</strong> Khung giờ hành chính 08:30 - 17:30. Cho phép ân hạn (Grace Period) đi muộn tối đa 15 phút (08:45). Nửa ngày = 0.5 công, cả ngày = 1.0 công.</span>
      </div>

      <div className="card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Tên nhân sự</th>
                <th>Ngày</th>
                <th><div className="flex items-center gap-2"><Clock size={14}/> Check-in</div></th>
                <th><div className="flex items-center gap-2"><Clock size={14}/> Check-out</div></th>
                <th>Trạng thái</th>
                <th>Số công</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-8 text-muted">Đang tải dữ liệu...</td></tr>
              ) : filteredAttendances.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-8 text-muted">Chưa có dữ liệu chấm công nào</td></tr>
              ) : (
                filteredAttendances.map(att => (
                  <tr key={att.id} className="hover:bg-white/5 transition-colors">
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{att.employee?.code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{att.employee?.fullName}</td>
                    <td className="text-muted">{new Date(att.date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ color: att.status === 'LATE' ? 'var(--warning)' : 'var(--success)', fontWeight: 500 }}>
                      {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                    </td>
                    <td>
                      {att.status === 'NORMAL' && <span className="badge badge-success">Đúng giờ</span>}
                      {att.status === 'LATE' && <span className="badge badge-warning">Đi muộn</span>}
                      {att.status === 'ABSENT' && <span className="badge badge-error">Nghỉ phép</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 font-bold" style={{ color: Number(att.workingDay) === 1 ? 'var(--success)' : Number(att.workingDay) === 0 ? 'var(--error)' : 'var(--warning)' }}>
                        {Number(att.workingDay)} công
                      </div>
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

