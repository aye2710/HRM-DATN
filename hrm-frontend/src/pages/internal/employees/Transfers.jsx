import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';


export const Transfers = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [transferForm, setTransferForm] = useState({ departmentId: '', positionId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error('Vui lòng chọn nhân viên');
    
    axios.post(`http://localhost:5000/api/employees/${selectedEmpId}/transfer`, transferForm)
      .then(() => {
        toast.success('Điều chuyển thành công!');
        setShowModal(false);
        fetchData();
      })
      .catch(err => toast.error('Lỗi khi điều chuyển'));
  };

  const activeEmployees = employees.filter(e => e.status !== 'RESIGNED');

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Điều chuyển Nhân sự</h1>
          <p className="text-muted text-sm">Cập nhật phòng ban và vị trí mới cho nhân sự đang làm việc</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tạo Đề xuất Điều chuyển
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự..." 
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
                <th>Đơn vị hiện tại</th>
                <th>Vị trí hiện tại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center p-8">Đang tải...</td></tr>
              ) : (
                activeEmployees.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                  <tr key={emp.id}>
                    <td className="font-semibold text-[var(--primary)]">{emp.code}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{emp.fullName.charAt(0)}</div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium">{emp.department?.name || 'Chưa phân bổ'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-muted">{emp.position?.title || '-'}</span>
                    </td>
                    <td>
                      <span className="badge badge-success">Đang làm việc</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
               <h3 className="text-xl font-bold">Thực hiện Luân chuyển</h3>
               <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 flex-col gap-4">
               <div>
                  <label className="form-label text-muted">Chọn Nhân viên *</label>
                  <select required className="form-input w-full" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                    <option value="">-- Lựa chọn --</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.code})</option>)}
                  </select>
               </div>
               
               <div className="flex items-center justify-center py-2">
                 <ArrowRight size={24} className="text-muted" />
               </div>

               <div>
                  <label className="form-label text-muted">Phòng ban mới *</label>
                  <select required className="form-input w-full" value={transferForm.departmentId} onChange={e => setTransferForm({...transferForm, departmentId: e.target.value})}>
                    <option value="">-- Lựa chọn --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
               </div>

               <div>
                  <label className="form-label text-muted">Vị trí mới *</label>
                  <select required className="form-input w-full" value={transferForm.positionId} onChange={e => setTransferForm({...transferForm, positionId: e.target.value})}>
                    <option value="">-- Lựa chọn --</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
               </div>

               <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                 <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                 <button type="submit" className="btn btn-primary">Xác nhận Luân chuyển</button>
               </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

