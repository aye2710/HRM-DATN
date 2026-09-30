import React, { useState, useEffect } from 'react';
import { FileDiff, Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const KPITemplates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/kpi/templates');
        setTemplates(res.data);
      } catch (err) {
        toast.error('Lỗi lấy dữ liệu templates');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Mẫu đánh giá KPI</h1>
          <p className="text-muted text-sm">Quản lý các bộ tiêu chí và trọng số đánh giá hiệu suất nhân sự</p>
        </div>
        <button className="btn btn-primary" onClick={() => toast.success('Mở form tạo mới KPI Template')}>
          <Plus size={18} /> Tạo Mẫu KPI mới
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm mẫu đánh giá..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-outline" style={{ padding: '0.75rem', height: '100%' }}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên Mẫu đánh giá</th>
                <th>Phòng ban áp dụng</th>
                <th>Số Tiêu chí</th>
                <th>Tổng Trọng số</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8 text-muted">Đang tải...</td></tr>
              ) : templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(tpl => (
                <tr key={tpl.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <FileDiff size={16} color="var(--primary)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tpl.name}</span>
                    </div>
                  </td>
                  <td className="text-muted text-sm font-medium">{tpl.department}</td>
                  <td><span className="badge badge-info">{tpl.criteria} tiêu chí</span></td>
                  <td className="text-success font-bold">{tpl.weight}</td>
                  <td>
                    <span className={`badge ${tpl.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {tpl.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                        <Edit2 size={16} color="var(--text-muted)" />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                        <Trash2 size={16} color="var(--error)" />
                      </button>
                    </div>
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
