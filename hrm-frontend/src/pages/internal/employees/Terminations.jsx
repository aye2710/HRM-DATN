import React, { useState, useEffect } from 'react';
import { UserMinus, Search, Filter, MessageSquare, Briefcase } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


export const Terminations = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEmployees = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/employees')
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleTerminate = async (id, name) => {
    const result = await Swal.fire({ title: 'Thanh lý hợp đồng', text: `Bạn có chắc chắn muốn cho nhân sự ${name} nghỉ việc? Toàn bộ hợp đồng hiện tại sẽ bị thanh lý.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' });
    if (!result.isConfirmed) return;
    
    axios.post(`http://localhost:5000/api/employees/${id}/terminate`)
      .then(() => {
        toast.success('Đã cập nhật trạng thái nghỉ việc thành công!');
        fetchEmployees();
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi khi thanh lý nghỉ việc');
      });
  };

  // Chỉ hiển thị nhân viên đã nghỉ việc (RESIGNED) hoặc có thể hiển thị tất cả để chọn nghỉ việc
  // Ở đây ta hiển thị list danh sách nhân viên đã nghỉ việc, và cung cấp nút để "Khởi tạo nghỉ việc" cho nhân viên đang active.
  const resignedEmployees = employees.filter(e => e.status === 'RESIGNED');

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Nghỉ việc & Thanh lý</h1>
          <p className="text-muted text-sm">Danh sách nhân sự đã nghỉ việc, bàn giao tài sản và thanh lý hợp đồng</p>
        </div>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự đã nghỉ việc..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Vị trí</th>
                <th>Trạng thái NS</th>
                <th className="text-center">Công cụ Bàn giao</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8 text-muted">Đang tải...</td></tr>
              ) : resignedEmployees.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-muted">Chưa có nhân sự nào nghỉ việc</td></tr>
              ) : (
                resignedEmployees.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                  <tr key={emp.id}>
                    <td className="font-semibold text-muted">{emp.code}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <div className="flex-col gap-1">
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.fullName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{emp.department?.name || '-'}</span>
                    </td>
                    <td className="text-muted text-sm font-medium">{emp.position?.title || '-'}</td>
                    <td>
                      <span className="badge badge-error">Đã nghỉ việc</span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Phỏng vấn nghỉ việc (Exit Interview)">
                          <MessageSquare size={16} color="var(--primary)" />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} title="Checklist bàn giao">
                          <Briefcase size={16} color="var(--text-muted)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-bold mb-4">Danh sách Nhân sự Đang làm việc (Cần thanh lý?)</h2>
        <div className="table-container max-h-[300px] overflow-y-auto">
          <table>
             <thead>
               <tr>
                 <th>NV</th>
                 <th>Phòng ban</th>
                 <th>Thao tác</th>
               </tr>
             </thead>
             <tbody>
               {employees.filter(e => e.status !== 'RESIGNED').map(e => (
                 <tr key={e.id}>
                   <td className="font-medium">{e.fullName}</td>
                   <td>{e.department?.name}</td>
                   <td>
                      <button onClick={() => handleTerminate(e.id, e.fullName)} className="btn" style={{ padding: '0.4rem 1rem', background: 'var(--error-bg)', color: 'var(--error)' }}>
                         Cho Nghỉ việc
                      </button>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

