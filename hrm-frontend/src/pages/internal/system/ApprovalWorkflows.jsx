import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  GitMerge, Search, Filter, CheckCircle, XCircle, Clock, Plus, 
  X, Check, AlertCircle, FileText, User, Calendar, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const initialWorkflows = [
  { id: 1, requester: 'Lê C (Nhân sự)', type: 'Yêu cầu Tuyển dụng', details: 'Tuyển 2 ReactJS Developer cho dự án FinTech', date: '2026-08-25', status: 'Pending', step: 'Chờ Giám đốc duyệt', reason: '' },
  { id: 2, requester: 'Phạm D (Kế toán)', type: 'Đơn xin nghỉ phép', details: 'Nghỉ phép 2 ngày (26-27/08) việc gia đình', date: '2026-08-24', status: 'Approved', step: 'Hoàn tất (Đã duyệt)', reason: '' },
  { id: 3, requester: 'Trần Văn X (IT)', type: 'Yêu cầu Điều chuyển', details: 'Điều chuyển sang chi nhánh Đà Nẵng', date: '2026-08-20', status: 'Rejected', step: 'Từ chối bởi HR', reason: 'Dự án hiện tại chưa thể bàn giao' },
  { id: 4, requester: 'Nguyễn Văn A (Kinh doanh)', type: 'Đề xuất Tăng lương', details: 'Đề xuất tăng lương 15% sau 1 năm đạt KPI vượt mức', date: '2026-08-18', status: 'Pending', step: 'Chờ HR Review', reason: '' },
  { id: 5, requester: 'Vũ Thị H (Marketing)', type: 'Đơn xin nghỉ việc', details: 'Xin thôi việc từ ngày 01/10/2026 theo nguyện vọng cá nhân', date: '2026-08-15', status: 'Pending', step: 'Chờ Trưởng phòng duyệt', reason: '' },
  { id: 6, requester: 'Đỗ Minh T (Kỹ thuật)', type: 'Đơn xin nghỉ phép', details: 'Nghỉ ốm 1 ngày (19/08)', date: '2026-08-19', status: 'Approved', step: 'Hoàn tất (Đã duyệt)', reason: '' },
];

export const ApprovalWorkflows = () => {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal tạo đề xuất mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequester, setNewRequester] = useState('');
  const [newType, setNewType] = useState('Đơn xin nghỉ phép');
  const [newDetails, setNewDetails] = useState('');
  const [newStep, setNewStep] = useState('Chờ Trưởng phòng duyệt');

  // Phê duyệt yêu cầu
  const handleApprove = async (workflow) => {
    const result = await Swal.fire({
      title: 'Phê duyệt yêu cầu?',
      text: `Bạn có chắc muốn PHÊ DUYỆT "${workflow.type}" của ${workflow.requester}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#10b981'
    });

    if (result.isConfirmed) {
      setWorkflows(prev => prev.map(w => {
        if (w.id === workflow.id) {
          return { ...w, status: 'Approved', step: 'Hoàn tất (Đã duyệt)' };
        }
        return w;
      }));
      toast.success(`Đã phê duyệt yêu cầu của ${workflow.requester}!`);
    }
  };

  // Từ chối yêu cầu
  const handleReject = async (workflow) => {
    const { value: reason } = await Swal.fire({
      title: 'Từ chối yêu cầu',
      text: `Nhập lý do từ chối "${workflow.type}" của ${workflow.requester}:`,
      input: 'text',
      inputPlaceholder: 'Nhập lý do từ chối (bắt buộc)...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
      inputValidator: (val) => {
        if (!val) return 'Vui lòng nhập lý do từ chối!';
      }
    });

    if (reason) {
      setWorkflows(prev => prev.map(w => {
        if (w.id === workflow.id) {
          return { ...w, status: 'Rejected', step: 'Từ chối', reason };
        }
        return w;
      }));
      toast.error(`Đã từ chối yêu cầu của ${workflow.requester}`);
    }
  };

  // Tạo đề xuất mới
  const handleCreateWorkflow = (e) => {
    e.preventDefault();
    if (!newRequester || !newDetails) {
      return toast.error('Vui lòng điền đầy đủ thông tin đề xuất');
    }

    const newObj = {
      id: Date.now(),
      requester: newRequester,
      type: newType,
      details: newDetails,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      step: newStep,
      reason: ''
    };

    setWorkflows([newObj, ...workflows]);
    toast.success('Đã gửi đề xuất vào quy trình phê duyệt thành công!');
    setShowCreateModal(false);
    setNewRequester('');
    setNewDetails('');
  };

  // Lọc dữ liệu
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(w => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || w.requester.toLowerCase().includes(q) || w.details.toLowerCase().includes(q) || w.type.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;
      const matchType = typeFilter === 'ALL' || w.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [workflows, searchTerm, statusFilter, typeFilter]);

  // Phân trang
  const totalRecords = filteredWorkflows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentWorkflows = filteredWorkflows.slice(startIndex, endIndex);

  // Thống kê
  const totalCount = workflows.length;
  const pendingCount = workflows.filter(w => w.status === 'Pending').length;
  const approvedCount = workflows.filter(w => w.status === 'Approved').length;
  const rejectedCount = workflows.filter(w => w.status === 'Rejected').length;

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      {/* 1. Header Layout */}
      <div className="card glass p-5 flex-col gap-4" style={{ borderRadius: '16px' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title">
                Trung Tâm Phê Duyệt (Approval Workflows)
              </h1>
              <span className="badge badge-info font-bold">Multi-level Workflow</span>
            </div>
            <p className="text-muted text-xs mt-1" style={{ margin: 0 }}>
              Quản lý quy trình phê duyệt đa cấp cho mọi loại đề xuất: Tuyển dụng, Nghỉ phép, Điều chuyển, Tăng lương
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-1.5" style={{ height: 36 }}>
              <Plus size={16} />
              <span>Gửi Đề Xuất Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bốn Thẻ Thống Kê Tổng Quan */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Tổng số đề xuất</span>
            <GitMerge size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCount}</div>
          <span className="text-xs text-muted">Tất cả đề xuất trong hệ thống</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Đang chờ duyệt (Pending)</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)' }}>{pendingCount}</div>
          <span className="text-xs text-muted">Cần quản lý hoặc HR xử lý</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Đã phê duyệt (Approved)</span>
            <CheckCircle size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{approvedCount}</div>
          <span className="text-xs text-muted">Đã thông qua và áp dụng</span>
        </div>

        <div className="card glass p-4 flex-col gap-1 card-hover" style={{ borderRadius: '14px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="flex items-center justify-between text-muted text-xs uppercase font-bold tracking-wider mb-1">
            <span>Đã từ chối (Rejected)</span>
            <XCircle size={16} color="var(--error)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)' }}>{rejectedCount}</div>
          <span className="text-xs text-muted">Đã gửi phản hồi kèm lý do</span>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Kèm Bộ Lọc & Thao Tác Phê Duyệt Thật */}
      <div className="card glass flex-col gap-0" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        <div className="p-4 flex justify-between items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3" style={{ flex: 1, minWidth: '280px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm người gửi, nội dung đề xuất..." 
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

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Trạng thái:</span>
              <select 
                className="form-input" 
                style={{ width: 'auto', height: 38, padding: '0 0.75rem', fontSize: '0.85rem' }}
                value={statusFilter} 
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">Tất cả ({workflows.length})</option>
                <option value="Pending">Chờ duyệt ({pendingCount})</option>
                <option value="Approved">Đã duyệt ({approvedCount})</option>
                <option value="Rejected">Đã từ chối ({rejectedCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Loại đề xuất:</span>
              <select 
                className="form-input" 
                style={{ width: 'auto', height: 38, padding: '0 0.75rem', fontSize: '0.85rem' }}
                value={typeFilter} 
                onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">Tất cả loại</option>
                <option value="Đơn xin nghỉ phép">Đơn xin nghỉ phép</option>
                <option value="Yêu cầu Tuyển dụng">Yêu cầu Tuyển dụng</option>
                <option value="Yêu cầu Điều chuyển">Yêu cầu Điều chuyển</option>
                <option value="Đề xuất Tăng lương">Đề xuất Tăng lương</option>
                <option value="Đơn xin nghỉ việc">Đơn xin nghỉ việc</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th>NGƯỜI YÊU CẦU</th>
                <th>LOẠI YÊU CẦU</th>
                <th>NỘI DUNG CHI TIẾT</th>
                <th>NGÀY GỬI</th>
                <th>BƯỚC DUYỆT & TRẠNG THÁI</th>
                <th className="text-center" style={{ width: '180px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkflows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-12 text-muted">
                    Không tìm thấy yêu cầu phê duyệt nào phù hợp.
                  </td>
                </tr>
              ) : (
                currentWorkflows.map(workflow => (
                  <tr key={workflow.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.85rem', background: 'var(--primary)', color: 'white', fontWeight: 700 }}>
                          {workflow.requester.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {workflow.requester}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5 font-semibold text-sm" style={{ color: 'var(--primary)' }}>
                        <GitMerge size={15} />
                        <span>{workflow.type}</span>
                      </div>
                    </td>

                    <td>
                      <div className="flex-col">
                        <span className="text-sm font-medium text-main">{workflow.details}</span>
                        {workflow.reason && (
                          <span className="text-xs" style={{ color: 'var(--error)', marginTop: '2px' }}>
                            Lý do từ chối: {workflow.reason}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-muted text-xs font-mono">{workflow.date}</td>

                    <td>
                      <div className="flex items-center gap-2">
                        {workflow.status === 'Pending' && (
                          <span className="badge badge-warning flex items-center gap-1 font-bold">
                            <Clock size={12} /> {workflow.step}
                          </span>
                        )}
                        {workflow.status === 'Approved' && (
                          <span className="badge badge-success flex items-center gap-1 font-bold">
                            <CheckCircle size={12} /> {workflow.step}
                          </span>
                        )}
                        {workflow.status === 'Rejected' && (
                          <span className="badge badge-danger flex items-center gap-1 font-bold">
                            <XCircle size={12} /> {workflow.step}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center">
                      {workflow.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleApprove(workflow)}
                            className="btn btn-outline flex items-center gap-1"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.4)', height: 32 }}
                            title="Chấp thuận yêu cầu"
                          >
                            <CheckCircle size={14} /> Duyệt
                          </button>
                          <button 
                            onClick={() => handleReject(workflow)}
                            className="btn btn-outline flex items-center gap-1"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.4)', height: 32 }}
                            title="Từ chối yêu cầu kèm lý do"
                          >
                            <XCircle size={14} /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-xs font-semibold">
                          {workflow.status === 'Approved' ? '✓ Đã thông qua' : '✗ Đã đóng'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Thanh Phân Trang */}
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Đang hiển thị <strong>{totalRecords === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> / <strong>{totalRecords}</strong> đề xuất
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

      {/* 5. MODAL TẠO YÊU CẦU PHÊ DUYỆT MỚI (React Portal) */}
      {showCreateModal && createPortal(
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
            maxWidth: '540px',
            backgroundColor: '#1e1e2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(105, 108, 255, 0.15)' }}>
                  <GitMerge size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Khởi Tạo Đề Xuất Phê Duyệt
                  </h3>
                  <p className="text-muted text-xs mt-0.5">Nộp yêu cầu vào quy trình phê duyệt đa cấp</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline" 
                style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Người yêu cầu (Họ tên & Phòng ban) <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Hoàng Văn Nam (Phòng Kinh doanh)" 
                  className="form-input"
                  value={newRequester}
                  onChange={e => setNewRequester(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Loại yêu cầu</label>
                  <select 
                    className="form-input"
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                  >
                    <option value="Đơn xin nghỉ phép">Đơn xin nghỉ phép</option>
                    <option value="Yêu cầu Tuyển dụng">Yêu cầu Tuyển dụng</option>
                    <option value="Yêu cầu Điều chuyển">Yêu cầu Điều chuyển</option>
                    <option value="Đề xuất Tăng lương">Đề xuất Tăng lương</option>
                    <option value="Đơn xin nghỉ việc">Đơn xin nghỉ việc</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Cấp duyệt ban đầu</label>
                  <select 
                    className="form-input"
                    value={newStep}
                    onChange={e => setNewStep(e.target.value)}
                  >
                    <option value="Chờ Trưởng phòng duyệt">Chờ Trưởng phòng duyệt</option>
                    <option value="Chờ HR Review">Chờ HR Review</option>
                    <option value="Chờ Giám đốc duyệt">Chờ Giám đốc duyệt</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Nội dung chi tiết đề xuất <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <textarea 
                  className="form-textarea"
                  rows={3}
                  placeholder="Ghi rõ lý do, thời gian, số lượng hoặc các thông tin phục vụ phê duyệt..."
                  value={newDetails}
                  onChange={e => setNewDetails(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn btn-outline"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Check size={16} /> Gửi Yêu Cầu
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
