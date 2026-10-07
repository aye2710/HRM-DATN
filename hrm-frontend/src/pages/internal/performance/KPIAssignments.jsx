import React, { useState, useEffect } from 'react';
import { Target, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const KPIAssignments = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState(0);

  const fetchKpis = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/kpi/kpi');
      setKpis(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleOpenModal = () => {
    setEmployeeId('');
    setDescription('');
    setTarget(0);
    setIsModalOpen(true);
  };

  const handleCreateKpi = async () => {
    if (!employeeId || !description || target <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/kpi/kpi', {
        employeeId,
        description,
        target: Number(target)
      });
      toast.success('Giao KPI thành công!');
      setIsModalOpen(false);
      fetchKpis();
    } catch (err) {
      toast.error('Lỗi khi giao KPI');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa KPI này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/kpi/kpi/${id}`);
      toast.success('Đã xóa KPI');
      fetchKpis();
    } catch (err) {
      toast.error('Lỗi xóa KPI');
    }
  };

  const filteredKpis = kpis.filter(k => 
    k.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (k.employee?.fullName && k.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Quản lý Giao KPI (Assignments)
            </h2>
            <p className="text-muted mt-2">Giao mục tiêu chi tiết cho từng nhân viên.</p>
          </div>
          <button onClick={handleOpenModal} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
            <Plus size={18} /> Giao KPI mới
          </button>
        </div>

      <div className="card glass mb-6">
        <div className="p-4 flex gap-4">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo tên nhân viên hoặc mô tả..." 
              className="form-input w-full"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Mô tả KPI</th>
                <th>Chỉ tiêu (Target)</th>
                <th>Đạt được (Achieved)</th>
                <th>Tiến độ (%)</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8 text-muted">Đang tải...</td></tr>
              ) : filteredKpis.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-muted">Chưa có KPI nào.</td></tr>
              ) : (
                filteredKpis.map(kpi => {
                  const progress = kpi.target > 0 ? (kpi.achieved / kpi.target) * 100 : 0;
                  return (
                    <tr key={kpi.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{kpi.employee?.fullName || 'N/A'}</span>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{kpi.employee?.code || ''}</div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>{kpi.description}</td>
                      <td><strong>{kpi.target}</strong></td>
                      <td className="text-primary font-bold">{kpi.achieved}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                          </div>
                          <span className="text-xs">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                            <Edit2 size={16} color="var(--text-muted)" />
                          </button>
                          <button onClick={() => handleDelete(kpi.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                            <Trash2 size={16} color="var(--error)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target size={22} color="var(--primary)" /> Giao KPI mới
            </h3>
            
            <div className="mb-4">
              <label className="form-label">Mã Nhân viên (UUID / ID)</label>
              <input 
                type="text" 
                className="form-input" 
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Nhập Employee ID (Ví dụ để test)..."
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Mô tả mục tiêu</label>
              <textarea 
                className="form-input" 
                style={{ height: '80px', resize: 'none' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Đạt doanh số 500 triệu / ký 10 hợp đồng..."
              ></textarea>
            </div>

            <div className="mb-8">
              <label className="form-label">Chỉ tiêu (Target)</label>
              <input 
                type="number" 
                className="form-input" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleCreateKpi}>Giao việc</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
