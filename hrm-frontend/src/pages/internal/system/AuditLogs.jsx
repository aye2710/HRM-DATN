import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, Search, Filter, History, Download, Eye, 
  X, Check, Plus, RefreshCw, FileText, ArrowRight, Shield,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

const initialLogs = [
  { id: 1, action: 'LOCK_PAYROLL', user: 'admin.hr', resource: 'Kỳ Lương Tháng 10/2026', oldVal: 'Draft (Bản nháp)', newVal: 'Locked (Đã khóa sổ)', ip: '192.168.1.45', time: '2026-10-06 17:05:22' },
  { id: 2, action: 'UPDATE_SALARY', user: 'admin.hr', resource: 'Nhân viên: Hoàng Nam (NV001)', oldVal: '20,000,000 VND', newVal: '25,000,000 VND', ip: '192.168.1.45', time: '2026-10-06 16:42:10' },
  { id: 3, action: 'CREATE_DECISION', user: 'truclh', resource: 'Quyết định bổ nhiệm Phó Giám đốc', oldVal: 'Chưa có', newVal: 'QĐ-BN-2026/01', ip: '192.168.1.12', time: '2026-10-06 15:30:00' },
  { id: 4, action: 'DELETE_CONTRACT', user: 'admin.hr', resource: 'Hợp đồng thử việc: Lê C', oldVal: 'Active', newVal: 'Deleted', ip: '192.168.1.45', time: '2026-10-05 09:15:00' },
  { id: 5, action: 'LOGIN_FAILED', user: 'anonymous', resource: 'Hệ thống xác thực Auth', oldVal: '-', newVal: 'Sai mật khẩu 3 lần', ip: '113.190.45.22', time: '2026-10-04 22:40:11' },
  { id: 6, action: 'GENERATE_PAYROLL', user: 'admin.hr', resource: 'Bảng Lương Tháng 10/2026', oldVal: '0 payslips', newVal: '132 payslips', ip: '192.168.1.45', time: '2026-10-04 10:15:20' },
  { id: 7, action: 'UPDATE_QUOTA', user: 'truclh', resource: 'Phòng Công nghệ Thông tin', oldVal: 'Định biên: 15', newVal: 'Định biên: 20', ip: '192.168.1.12', time: '2026-10-03 14:00:00' },
];

export const AuditLogs = () => {
  const [logs, setLogs] = useState(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Chi Tiết Kiểm Toán
  const [selectedLog, setSelectedLog] = useState(null);

  // Modal Ghi Vết Thủ Công
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAction, setNewAction] = useState('SECURITY_NOTE');
  const [newResource, setNewResource] = useState('');
  const [newOldVal, setNewOldVal] = useState('-');
  const [newNewVal, setNewNewVal] = useState('');

  // Lọc dữ liệu
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q);
      const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, actionFilter]);

  // Phân trang
  const totalRecords = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Xuất file CSV
  const handleExportCSV = () => {
    const headers = ["Thời gian", "Hành động (Action)", "Người thực hiện", "Đối tượng tác động", "Giá trị cũ", "Giá trị mới", "Địa chỉ IP"];
    const rows = logs.map(l => [
      `"${l.time}"`,
      `"${l.action}"`,
      `"${l.user}"`,
      `"${l.resource}"`,
      `"${l.oldVal}"`,
      `"${l.newVal}"`,
      `"${l.ip}"`
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Logs_HRM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống file Nhật ký Kiểm toán!');
  };

  // Thêm log thủ công
  const handleCreateLog = (e) => {
    e.preventDefault();
    if (!newResource || !newNewVal) {
      return toast.error('Vui lòng điền đủ thông tin đối tượng và nội dung');
    }

    const newLogItem = {
      id: Date.now(),
      action: newAction,
      user: localStorage.getItem('fullName') || 'admin',
      resource: newResource,
      oldVal: newOldVal,
      newVal: newNewVal,
      ip: '127.0.0.1 (Local)',
      time: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    setLogs([newLogItem, ...logs]);
    toast.success('Đã ghi lại nhật ký kiểm toán mới!');
    setShowAddModal(false);
    setNewResource('');
    setNewNewVal('');
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Nhật Ký Kiểm Toán & An Toàn Dữ Liệu (Audit Logs)
              </h1>
              <span className="badge badge-info font-bold">Immutable Trail</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Ghi nhận và lưu vết toàn bộ lịch sử thao tác tác động lên dữ liệu nhạy cảm của hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowAddModal(true)} className="btn btn-outline flex items-center gap-1.5" style={{ height: 36 }}>
              <Plus size={15} />
              <span>Ghi Vết Kiểm Toán</span>
            </button>
            <button onClick={handleExportCSV} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <FileSpreadsheet size={15} />
              <span>Xuất File Audit (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bảng Dữ Liệu Nhật Ký */}
      <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div className="p-4 flex justify-between items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3" style={{ flex: 1, minWidth: '280px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm user, hành động, đối tượng tác động..." 
                className="form-input"
                style={{ paddingLeft: '2.4rem', height: 38 }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Hành động:</span>
            <select 
              className="form-input" 
              style={{ width: 'auto', height: 38, padding: '0 0.75rem', fontSize: '0.85rem' }}
              value={actionFilter} 
              onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Tất cả hành động ({logs.length})</option>
              <option value="LOCK_PAYROLL">LOCK_PAYROLL (Khóa sổ)</option>
              <option value="UPDATE_SALARY">UPDATE_SALARY (Đổi lương)</option>
              <option value="CREATE_DECISION">CREATE_DECISION (Quyết định)</option>
              <option value="DELETE_CONTRACT">DELETE_CONTRACT (Xóa hợp đồng)</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED (Cảnh báo đăng nhập)</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th>THỜI GIAN</th>
                <th>HÀNH ĐỘNG (ACTION)</th>
                <th>NGƯỜI THỰC HIỆN</th>
                <th>ĐỐI TƯỢNG BỊ TÁC ĐỘNG</th>
                <th>CHI TIẾT (CŨ ➜ MỚI)</th>
                <th>IP ADDRESS</th>
                <th className="text-center" style={{ width: '90px' }}>XEM</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-12 text-muted">
                    Không tìm thấy nhật ký kiểm toán phù hợp.
                  </td>
                </tr>
              ) : (
                currentLogs.map(log => (
                  <tr key={log.id}>
                    <td className="text-muted text-xs font-mono">{log.time}</td>
                    
                    <td>
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={15} color={log.action.includes('DELETE') || log.action.includes('FAILED') ? 'var(--error)' : 'var(--warning)'} />
                        <span className="font-bold text-xs" style={{ color: log.action.includes('DELETE') || log.action.includes('FAILED') ? 'var(--error)' : 'var(--text-main)' }}>
                          {log.action}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-outline font-semibold">{log.user}</span>
                    </td>

                    <td className="text-sm font-medium text-main">{log.resource}</td>

                    <td>
                      {log.oldVal !== '-' ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted line-through">{log.oldVal}</span>
                          <span>➜</span>
                          <span className="text-main font-bold" style={{ color: 'var(--success)' }}>{log.newVal}</span>
                        </div>
                      ) : (
                        <span className="text-main font-bold text-xs">{log.newVal}</span>
                      )}
                    </td>

                    <td className="text-muted text-xs font-mono">{log.ip}</td>

                    <td className="text-center">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.5rem', height: 30 }}
                        title="Xem chi tiết bản ghi kiểm toán"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Phân trang */}
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Đang hiển thị <strong>{totalRecords === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> / <strong>{totalRecords}</strong> bản ghi
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted">| Hiển thị:</span>
              <select 
                className="form-input" 
                style={{ width: 'auto', height: 30, padding: '0 0.5rem', fontSize: '0.8rem' }}
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage === 1 ? 0.4 : 1 }}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-main">
              Trang {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
              title="Trang tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="btn btn-outline" 
              style={{ width: 32, height: 32, padding: 0, opacity: currentPage >= totalPages ? 0.4 : 1 }}
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: XEM CHI TIẾT NHẬT KÝ (React Portal) */}
      {selectedLog && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
                  <ShieldAlert size={22} color="var(--warning)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Chi Tiết Bản Ghi Kiểm Toán
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Mã sự kiện: #{selectedLog.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <div className="flex-col gap-4 text-sm">
              <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-muted">Hành động:</span>
                <strong style={{ color: 'var(--primary)' }}>{selectedLog.action}</strong>
              </div>
              <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-muted">Tài khoản thực hiện:</span>
                <strong className="text-main">{selectedLog.user}</strong>
              </div>
              <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-muted">Thời điểm:</span>
                <span className="font-mono text-muted">{selectedLog.time}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-muted">Địa chỉ IP:</span>
                <span className="font-mono text-muted">{selectedLog.ip}</span>
              </div>
              <div className="p-3 rounded-xl flex-col gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-muted">Đối tượng & Biến động:</span>
                <strong className="text-main block">{selectedLog.resource}</strong>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-muted line-through">{selectedLog.oldVal}</span>
                  <span>➜</span>
                  <span className="text-success font-bold">{selectedLog.newVal}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button 
                type="button" 
                onClick={() => setSelectedLog(null)} 
                className="btn btn-outline"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: GHI VẾT KIỂM TOÁN THỦ CÔNG (React Portal) */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.15)' }}>
                  <Shield size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Ghi Vết Kiểm Toán Thủ Công
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Lưu nhật ký bảo mật hoặc kiểm toán tuân thủ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Mã hành động (Action Code)</label>
                <select 
                  className="form-input"
                  value={newAction}
                  onChange={e => setNewAction(e.target.value)}
                >
                  <option value="SECURITY_NOTE">SECURITY_NOTE (Ghi chú an toàn)</option>
                  <option value="AUDIT_VERIFY">AUDIT_VERIFY (Kiểm tra tuân thủ)</option>
                  <option value="DB_BACKUP">DB_BACKUP (Sao lưu dữ liệu)</option>
                  <option value="ACCESS_OVERRIDE">ACCESS_OVERRIDE (Cấp quyền khẩn cấp)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Đối tượng kiểm toán <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Kiểm tra dữ liệu hồ sơ nhân sự tháng 10..."
                  className="form-input"
                  value={newResource}
                  onChange={e => setNewResource(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Giá trị trước</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={newOldVal}
                    onChange={e => setNewOldVal(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Giá trị sau <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Đã xác nhận khớp 100%"
                    className="form-input"
                    value={newNewVal}
                    onChange={e => setNewNewVal(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn btn-outline"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Check size={16} /> Lưu Nhật Ký
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
