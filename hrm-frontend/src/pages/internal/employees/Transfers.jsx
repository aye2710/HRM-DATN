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
  const filteredEmployees = activeEmployees.filter(e => 
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Điều chuyển Nhân sự</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Cập nhật phòng ban và vị trí mới cho nhân sự đang làm việc</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tạo Đề xuất Điều chuyển
        </button>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
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
                <th>Đơn vị hiện tại</th>
                <th>Vị trí hiện tại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy nhân sự phù hợp</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{emp.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold' }}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{emp.fullName}</span>
                      </div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.position?.title || '—'}</td>
                    <td>
                      <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : emp.status === 'PROBATION' ? 'badge-warning' : 'badge-info'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card glass" style={{ width: '500px', maxWidth: '95vw', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Điều chuyển Nhân sự</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleTransferSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Chọn nhân viên cần điều chuyển *</label>
                  <select 
                    required 
                    className="form-input w-full" 
                    value={selectedEmpId} 
                    onChange={e => setSelectedEmpId(e.target.value)}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {activeEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.code} - {emp.fullName} ({emp.department?.name || 'Không có'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Đơn vị / Phòng ban mới</label>
                  <select 
                    className="form-input w-full" 
                    value={transferForm.departmentId} 
                    onChange={e => setTransferForm({...transferForm, departmentId: e.target.value})}
                  >
                    <option value="">-- Giữ nguyên --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Vị trí / Chức danh mới</label>
                  <select 
                    className="form-input w-full" 
                    value={transferForm.positionId} 
                    onChange={e => setTransferForm({...transferForm, positionId: e.target.value})}
                  >
                    <option value="">-- Giữ nguyên --</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowRight size={16} /> Xác nhận Điều chuyển
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
