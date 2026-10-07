import React, { useState } from 'react';
import { CheckSquare, Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';

const mockChecklists = [
  { id: 1, task: 'Chuẩn bị chỗ ngồi & Bàn làm việc', category: 'Hành chính (Admin)', assignee: 'Admin Team', dayOffset: -1, mandatory: true },
  { id: 2, task: 'Cấp phát Laptop & Màn hình', category: 'IT Support', assignee: 'IT Team', dayOffset: 0, mandatory: true },
  { id: 3, task: 'Tạo tài khoản Email & Slack', category: 'IT Support', assignee: 'IT Team', dayOffset: 0, mandatory: true },
  { id: 4, task: 'Giới thiệu văn hóa công ty', category: 'Đào tạo (Training)', assignee: 'HR Executive', dayOffset: 1, mandatory: true },
  { id: 5, task: 'Mua hoa và thiệp chào mừng', category: 'Hành chính (Admin)', assignee: 'Admin Team', dayOffset: 0, mandatory: false },
];

export const ChecklistMgmt = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cấu hình Checklist Hội nhập</h1>
          <p className="text-muted text-sm">Định nghĩa các nhiệm vụ bắt buộc phải thực hiện khi tiếp nhận nhân sự mới</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Thêm Nhiệm vụ
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhiệm vụ..." 
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
                <th>Tên Nhiệm vụ</th>
                <th>Phân loại</th>
                <th>Người phụ trách (Assignee)</th>
                <th>Thời điểm (So với Ngày Onboard)</th>
                <th>Bắt buộc</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockChecklists.filter(c => c.task.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <CheckSquare size={16} color="var(--primary)" />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.task}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{item.category}</span></td>
                  <td className="text-muted font-medium">{item.assignee}</td>
                  <td>
                    {item.dayOffset < 0 && <span className="text-warning">Trước {Math.abs(item.dayOffset)} ngày</span>}
                    {item.dayOffset === 0 && <span className="text-success font-medium">Trong ngày (Day 1)</span>}
                    {item.dayOffset > 0 && <span className="text-info">Sau {item.dayOffset} ngày</span>}
                  </td>
                  <td>
                    {item.mandatory ? <span className="text-error font-medium">Có</span> : <span className="text-muted">Không</span>}
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
