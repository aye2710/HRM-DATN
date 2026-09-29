import React, { useState } from 'react';
import { FileBadge, Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';

const mockPolicies = [
  { id: 1, name: 'Chính sách Phép năm Tiêu chuẩn', type: 'Nghỉ phép năm', seniority: '0-5 năm', extraDays: '+0 ngày', maxDays: '12 ngày' },
  { id: 2, name: 'Chính sách Phép năm Thâm niên', type: 'Nghỉ phép năm', seniority: '> 5 năm', extraDays: '+1 ngày / năm', maxDays: '15 ngày' },
  { id: 3, name: 'Thai sản dành cho Nữ', type: 'Nghỉ thai sản', seniority: 'Không yêu cầu', extraDays: '-', maxDays: '180 ngày' },
];

export const LeavePolicies = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Chính sách Nghỉ phép</h1>
          <p className="text-muted text-sm">Cấu hình điều kiện hưởng và số ngày tối đa dựa theo thâm niên</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Thêm Chính sách
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm chính sách..." 
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
                <th>Tên Chính sách</th>
                <th>Áp dụng cho Loại phép</th>
                <th>Điều kiện Thâm niên</th>
                <th>Ngày cộng thêm</th>
                <th>Tối đa</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockPolicies.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(policy => (
                <tr key={policy.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <FileBadge size={16} color="var(--primary)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{policy.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{policy.type}</span></td>
                  <td className="text-muted font-medium">{policy.seniority}</td>
                  <td className="text-success">{policy.extraDays}</td>
                  <td><span className="font-bold text-main">{policy.maxDays}</span></td>
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
