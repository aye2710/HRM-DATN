import React, { useState } from 'react';
import { FileDiff, Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';

const mockTemplates = [
  { id: 1, name: 'Đánh giá Năng lực Developer (Q3/2026)', department: 'Phòng Phát triển', criteria: 5, weight: '100%', status: 'Active' },
  { id: 2, name: 'Chỉ tiêu Doanh số Sales (Tháng 8)', department: 'Phòng Kinh doanh', criteria: 3, weight: '100%', status: 'Active' },
  { id: 3, name: 'Đánh giá Thử việc chung', department: 'Tất cả phòng ban', criteria: 8, weight: '100%', status: 'Draft' },
];

export const KPITemplates = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Mẫu đánh giá KPI</h1>
          <p className="text-muted text-sm">Quản lý các bộ tiêu chí và trọng số đánh giá hiệu suất nhân sự</p>
        </div>
        <button className="btn btn-primary">
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
              {mockTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(tpl => (
                <tr key={tpl.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
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
