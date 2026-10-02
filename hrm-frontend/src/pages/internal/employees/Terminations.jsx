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
    const result = await Swal.fire({ 
      title: 'Thanh lý hợp đồng', 
      text: `Bạn có chắc chắn muốn cho nhân sự ${name} nghỉ việc? Toàn bộ hợp đồng hiện tại sẽ bị thanh lý.`, 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Đồng ý', 
      cancelButtonText: 'Hủy' 
    });
    
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

  const resignedEmployees = employees.filter(e => e.status === 'RESIGNED');
  const activeEmployees = employees.filter(e => e.status !== 'RESIGNED');
  
  const filteredResigned = resignedEmployees.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserMinus size={24} /> Nghỉ việc & Thanh lý
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Quản lý danh sách nhân sự đã nghỉ việc và thực hiện thanh lý hợp đồng</p>
        </div>
      </div>

      {/* Danh sách đã nghỉ việc */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Lịch sử Nhân sự đã nghỉ</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân sự..." 
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ margin: '0 1.5rem 1.5rem 1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Phòng ban cũ</th>
                <th>Vị trí cũ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Bàn giao</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : filteredResigned.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có nhân sự nào nghỉ việc</td></tr>
              ) : (
                filteredResigned.map(emp => (
                  <tr key={emp.id} style={{ opacity: 0.8 }}>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{emp.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{emp.fullName}</span>
                      </div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.position?.title || '—'}</td>
                    <td>
                      <span className="badge badge-error">Đã nghỉ việc</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', padding: '4px 12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                        Hoàn tất
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danh sách Active để thao tác Nghỉ việc */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>Khởi tạo Yêu cầu Nghỉ việc</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Chọn nhân sự đang làm việc để tiến hành thủ tục thanh lý hợp đồng</p>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.slice(0, 5).map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: '600' }}>{emp.fullName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.code}</span>
                    </div>
                  </td>
                  <td>{emp.department?.name || '—'}</td>
                  <td><span className="badge badge-success">Đang làm việc</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleTerminate(emp.id, emp.fullName)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Báo giảm & Nghỉ việc
                    </button>
                  </td>
                </tr>
              ))}
              {activeEmployees.length > 5 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Hiển thị 5 nhân sự mới nhất. Vui lòng dùng thanh tìm kiếm để tìm nhân sự khác.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
