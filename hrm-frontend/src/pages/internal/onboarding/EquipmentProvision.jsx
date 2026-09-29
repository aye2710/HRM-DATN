import React, { useState } from 'react';
import { Laptop, Search, Plus, Filter, CheckCircle, Clock } from 'lucide-react';

const mockEquipments = [
  { id: 1, employee: 'Phạm Y (Newbie)', item: 'MacBook Pro M3 16GB', code: 'IT-MBP-082', type: 'Máy tính', dateAssigned: '2026-08-20', status: 'Delivered' },
  { id: 2, employee: 'Trần Z (Newbie)', item: 'Dell UltraSharp 27"', code: 'IT-MON-045', type: 'Màn hình', dateAssigned: '2026-08-22', status: 'Pending' },
  { id: 3, employee: 'Lê C', item: 'Thẻ gửi xe Tòa nhà', code: 'AD-CARD-102', type: 'Thẻ/Chìa khóa', dateAssigned: '2026-08-15', status: 'Delivered' },
];

export const EquipmentProvision = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Cấp phát Thiết bị & Tài sản</h1>
          <p className="text-muted text-sm">Quản lý việc bàn giao tài sản cho nhân viên mới và thu hồi khi nghỉ việc</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Cấp phát mới
        </button>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự hoặc mã thiết bị..." 
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
                <th>Nhân viên</th>
                <th>Tên Tài sản / Thiết bị</th>
                <th>Mã Tài sản</th>
                <th>Phân loại</th>
                <th>Ngày cấp</th>
                <th>Trạng thái</th>
                <th className="text-center">Ký nhận</th>
              </tr>
            </thead>
            <tbody>
              {mockEquipments.filter(e => e.employee.toLowerCase().includes(searchTerm.toLowerCase()) || e.item.toLowerCase().includes(searchTerm.toLowerCase())).map(eq => (
                <tr key={eq.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{eq.employee.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{eq.employee}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Laptop size={16} color="var(--primary)" />
                      {eq.item}
                    </div>
                  </td>
                  <td><span className="text-muted font-medium font-mono text-sm">{eq.code}</span></td>
                  <td><span className="badge badge-info">{eq.type}</span></td>
                  <td className="text-muted text-sm">{eq.dateAssigned}</td>
                  <td>
                    {eq.status === 'Pending' && <span className="badge badge-warning">Chờ bàn giao</span>}
                    {eq.status === 'Delivered' && <span className="badge badge-success">Đã bàn giao</span>}
                  </td>
                  <td className="text-center">
                    {eq.status === 'Pending' ? (
                      <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--success)' }} title="Xác nhận đã nhận">
                        <CheckCircle size={18} />
                      </button>
                    ) : (
                      <span className="text-success text-xs font-medium"><CheckCircle size={14} className="inline mr-1"/> Đã ký</span>
                    )}
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
