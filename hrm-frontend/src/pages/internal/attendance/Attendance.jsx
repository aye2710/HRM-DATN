import React, { useState, useEffect } from 'react';
import { Search, Download, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AttendanceMgmt = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={24} color="var(--primary)" /> Quản lý Chấm công
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Giám sát giờ giấc & Tự động tính công theo bộ luật LLA</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-input" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} style={{ padding: '0.5rem 1rem', width: '220px' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '0.875rem' }}>
        <AlertCircle size={18} />
        <span><strong>Luật công ty:</strong> Khung giờ hành chính 08:30 - 17:30. Cho phép ân hạn (Grace Period) đi muộn tối đa 15 phút (08:45). Nửa ngày = 0.5 công, cả ngày = 1.0 công.</span>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Bảng công theo ngày</h3>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Nhập Mã NV, Tên NV..." 
              style={{ paddingLeft: '2.5rem', width: '100%' }} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-container" style={{ margin: '0 1.5rem 1.5rem 1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Tên nhân sự</th>
                <th>Ngày</th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14}/> Check-in</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14}/> Check-out</div></th>
                <th>Trạng thái</th>
                <th>Số công</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : filteredAttendances.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không có dữ liệu chấm công nào.</td></tr>
              ) : (
                filteredAttendances.map(att => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{att.employee?.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold' }}>
                          {att.employee?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{att.employee?.fullName}</span>
                      </div>
                    </td>
                    <td>{new Date(att.date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ fontWeight: '600', color: att.checkIn ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                    </td>
                    <td style={{ fontWeight: '600', color: att.checkOut ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                    </td>
                    <td>
                      <span className={`badge ${att.status === 'NORMAL' ? 'badge-success' : att.status === 'LATE' ? 'badge-warning' : 'badge-error'}`}>
                        {att.status === 'NORMAL' ? 'Đúng giờ' : att.status === 'LATE' ? 'Đi muộn' : 'Vắng mặt'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{Number(att.workingDay)}</span>
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
