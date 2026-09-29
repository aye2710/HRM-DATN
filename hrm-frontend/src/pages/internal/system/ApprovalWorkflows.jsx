import React, { useState } from 'react';
import { GitMerge, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';

const mockWorkflows = [
  { id: 1, requester: 'Lê C (Nhân sự)', type: 'Yêu cầu Tuyển dụng', details: 'Tuyển 2 ReactJS Dev', date: '2026-08-25', status: 'Pending', step: 'Chờ Giám đốc duyệt' },
  { id: 2, requester: 'Phạm D (Kế toán)', type: 'Đơn xin nghỉ phép', details: 'Nghỉ ốm 2 ngày (26-27/08)', date: '2026-08-24', status: 'Approved', step: 'Hoàn tất' },
  { id: 3, requester: 'Trần Văn X (IT)', type: 'Yêu cầu Điều chuyển', details: 'Sang chi nhánh Đà Nẵng', date: '2026-08-20', status: 'Rejected', step: 'Từ chối bởi HR' },
];

export const ApprovalWorkflows = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Trung tâm Phê duyệt</h1>
          <p className="text-muted text-sm">Quản lý luồng duyệt (Approval Workflow) cho mọi loại đề xuất trong hệ thống</p>
        </div>
      </div>

      <div className="card glass flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm yêu cầu phê duyệt..." 
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
                <th>Người yêu cầu</th>
                <th>Loại Yêu cầu</th>
                <th>Chi tiết</th>
                <th>Ngày gửi</th>
                <th>Trạng thái & Bước duyệt</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockWorkflows.filter(w => w.requester.toLowerCase().includes(searchTerm.toLowerCase()) || w.type.toLowerCase().includes(searchTerm.toLowerCase())).map(workflow => (
                <tr key={workflow.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{workflow.requester.charAt(0)}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{workflow.requester}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <GitMerge size={16} color="var(--primary)" />
                      <span className="font-medium text-sm">{workflow.type}</span>
                    </div>
                  </td>
                  <td className="text-muted text-sm">{workflow.details}</td>
                  <td className="text-muted text-sm">{workflow.date}</td>
                  <td>
                    <div className="flex-col gap-1">
                      {workflow.status === 'Pending' && <span className="badge badge-warning"><Clock size={12} className="mr-1"/> {workflow.step}</span>}
                      {workflow.status === 'Approved' && <span className="badge badge-success"><CheckCircle size={12} className="mr-1"/> {workflow.step}</span>}
                      {workflow.status === 'Rejected' && <span className="badge badge-error"><XCircle size={12} className="mr-1"/> {workflow.step}</span>}
                    </div>
                  </td>
                  <td className="text-center">
                    {workflow.status === 'Pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--success)' }} title="Phê duyệt">
                          <CheckCircle size={18} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--error)' }} title="Từ chối">
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">Đã xử lý</span>
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
