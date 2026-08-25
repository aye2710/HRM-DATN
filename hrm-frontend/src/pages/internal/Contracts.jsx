import React, { useState } from 'react';
import { ScrollText, Search, Plus, Filter, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const mockContracts = [
  { id: 1, employee: 'Lê Đại Dương', type: 'Không xác định thời hạn', startDate: '2023-01-01', endDate: '-', salary: '80,000,000 VND', status: 'Active' },
  { id: 2, employee: 'Nguyễn Văn A', type: 'Có thời hạn (12 tháng)', startDate: '2025-09-01', endDate: '2026-08-31', salary: '45,000,000 VND', status: 'Expiring Soon' },
  { id: 3, employee: 'Trần Thị B', type: 'Thử việc (2 tháng)', startDate: '2026-07-15', endDate: '2026-09-15', salary: '25,000,000 VND', status: 'Probation' },
  { id: 4, employee: 'Lê C', type: 'Có thời hạn (12 tháng)', startDate: '2025-05-01', endDate: '2026-04-30', salary: '15,000,000 VND', status: 'Expired' },
];

export const Contracts = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Hợp đồng Lao động</h1>
          <p className="text-muted text-sm">Quản lý vòng đời hợp đồng, gia hạn và cảnh báo hết hạn</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Tạo Hợp đồng mới
        </button>
      </div>

      {/* Cảnh báo hợp đồng sắp hết hạn */}
      <div className="card glass flex gap-4 items-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <AlertTriangle size={24} color="var(--warning)" />
        <div>
          <h4 className="font-bold text-main m-0">Có 2 hợp đồng sắp hết hạn trong 30 ngày tới</h4>
          <p className="text-muted text-sm m-0">Vui lòng rà soát và tạo phụ lục gia hạn hoặc thanh lý hợp đồng cho nhân viên.</p>
        </div>
        <button className="btn btn-outline ml-auto" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Xem chi tiết</button>
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
                <th>Loại Hợp đồng</th>
                <th>Mức lương cơ bản</th>
                <th>Ngày hiệu lực</th>
                <th>Ngày hết hạn</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {mockContracts.filter(c => c.employee.toLowerCase().includes(searchTerm.toLowerCase())).map(contract => (
                <tr key={contract.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{contract.employee.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{contract.employee}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ScrollText size={16} color="var(--text-muted)" />
                      {contract.type}
                    </div>
                  </td>
                  <td><span className="money-text font-medium">{contract.salary}</span></td>
                  <td className="text-muted text-sm">{contract.startDate}</td>
                  <td className="text-muted text-sm">{contract.endDate}</td>
                  <td>
                    {contract.status === 'Active' && <span className="badge badge-success"><CheckCircle size={12} className="mr-1"/> Hiệu lực</span>}
                    {contract.status === 'Probation' && <span className="badge badge-info">Thử việc</span>}
                    {contract.status === 'Expiring Soon' && <span className="badge badge-warning"><AlertTriangle size={12} className="mr-1"/> Sắp hết hạn</span>}
                    {contract.status === 'Expired' && <span className="badge badge-error">Đã hết hạn</span>}
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
