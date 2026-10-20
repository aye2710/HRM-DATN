import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Plus, Filter, AlertTriangle, FileText, CheckCircle, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Trash2, X, Briefcase, Eye, Upload, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const parseContractFiles = (fileUrl) => {
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [fileUrl];
  } catch (e) {
    return [fileUrl];
  }
};

export const Contracts = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  // Create contract form states
  const [formData, setFormData] = useState({
    contractType: 'OFFICIAL_1Y',
    baseSalary: '',
    startDate: '',
    endDate: '',
    evaluationResult: 'NONE', // PASSED, FAILED, NONE
    fileUrls: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const openHistoryModal = (emp) => {
    setSelectedEmp(emp);
    setShowHistoryModal(true);
  };

  const calculateDefaultEndDate = (type, startStr) => {
    if (!startStr || type === 'INDEFINITE') return '';
    const d = new Date(startStr);
    if (isNaN(d.getTime())) return '';
    if (type === 'OFFICIAL_1Y') {
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    }
    if (type === 'PROBATION') {
      d.setDate(d.getDate() + 60);
      return d.toISOString().split('T')[0];
    }
    if (type === 'INTERNSHIP') {
      d.setMonth(d.getMonth() + 3);
      return d.toISOString().split('T')[0];
    }
    return '';
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const isProbation = selectedEmp?.status === 'PROBATION' || selectedEmp?.status === 'INTERNSHIP';
    const initType = 'OFFICIAL_1Y';
    const defaultEnd = calculateDefaultEndDate(initType, today);

    // Lấy lương từ hợp đồng gần nhất nếu có
    const lastSalary = selectedEmp?.contracts?.[0]?.baseSalary 
      ? Number(selectedEmp.contracts[0].baseSalary).toString() 
      : '';

    setFormData({
      contractType: initType,
      baseSalary: lastSalary,
      startDate: today,
      endDate: defaultEnd,
      evaluationResult: isProbation ? 'PASSED' : 'NONE',
      fileUrls: []
    });
    setShowCreateModal(true);
  };

  const handleContractTypeChange = (newType) => {
    const isProbationEmp = selectedEmp?.status === 'PROBATION' || selectedEmp?.status === 'INTERNSHIP';
    let newEval = formData.evaluationResult;
    if (isProbationEmp) {
      if (newType === 'OFFICIAL_1Y' || newType === 'INDEFINITE') {
        newEval = 'PASSED';
      } else {
        newEval = 'FAILED';
      }
    }
    setFormData({
      ...formData,
      contractType: newType,
      endDate: calculateDefaultEndDate(newType, formData.startDate),
      evaluationResult: newEval
    });
  };

  const handleUploadContractFiles = async (contractId, fileList, append = false) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      return toast.error('Vui lòng chọn các file hình ảnh (PNG, JPG, WebP)!');
    }

    const t = toast.loading(`Đang tải ${validFiles.length} trang ảnh hợp đồng...`);
    try {
      const readPromises = validFiles.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      }));

      const newUrls = await Promise.all(readPromises);
      
      const curContract = selectedEmp?.contracts?.find(c => c.id === contractId);
      const existingUrls = (append && curContract) ? parseContractFiles(curContract.fileUrl) : [];
      const combinedUrls = [...existingUrls, ...newUrls];

      await axios.patch(`http://localhost:5000/api/contracts/${contractId}`, {
        fileUrl: JSON.stringify(combinedUrls)
      });

      toast.dismiss(t);
      toast.success(`Đã lưu ${combinedUrls.length} trang ảnh hợp đồng!`);

      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
      if (selectedEmp) {
        const updatedEmp = res.data.find(emp => emp.id === selectedEmp.id);
        setSelectedEmp(updatedEmp);
      }
      if (viewingFile && viewingFile.contractId === contractId) {
        setViewingFile({
          ...viewingFile,
          urls: combinedUrls,
          currentIndex: combinedUrls.length - 1
        });
      }
    } catch (err) {
      toast.dismiss(t);
      toast.error('Lỗi khi tải ảnh hợp đồng!');
    }
  };

  const handleDeleteContractPage = async (contractId, pageIdx) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa trang ${pageIdx + 1} của hợp đồng này?`)) return;
    const curContract = selectedEmp?.contracts?.find(c => c.id === contractId);
    if (!curContract) return;

    const urls = parseContractFiles(curContract.fileUrl);
    const updatedUrls = urls.filter((_, idx) => idx !== pageIdx);
    const t = toast.loading('Đang xóa trang...');
    try {
      await axios.patch(`http://localhost:5000/api/contracts/${contractId}`, {
        fileUrl: updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : null
      });
      toast.dismiss(t);
      toast.success('Đã xóa trang thành công!');

      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
      if (selectedEmp) {
        const updatedEmp = res.data.find(emp => emp.id === selectedEmp.id);
        setSelectedEmp(updatedEmp);
      }
      if (updatedUrls.length === 0) {
        setViewingFile(null);
      } else {
        setViewingFile({
          ...viewingFile,
          urls: updatedUrls,
          currentIndex: Math.max(0, Math.min(pageIdx, updatedUrls.length - 1))
        });
      }
    } catch (err) {
      toast.dismiss(t);
      toast.error('Lỗi khi xóa trang!');
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!formData.baseSalary || !formData.startDate) {
      return toast.error("Vui lòng điền đủ Lương cơ bản và Ngày bắt đầu");
    }

    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/contracts', {
        employeeId: selectedEmp.id,
        ...formData,
        baseSalary: parseFloat(formData.baseSalary),
        fileUrl: formData.fileUrls.length > 0 ? JSON.stringify(formData.fileUrls) : null
      });
      toast.success("Tạo hợp đồng thành công!");
      setShowCreateModal(false);
      // Refresh the employee list to get updated contracts
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
      // Update selected employee for the history modal
      const updatedEmp = res.data.find(e => e.id === selectedEmp.id);
      setSelectedEmp(updatedEmp);
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi tạo hợp đồng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getContractTypeName = (type) => {
    switch (type) {
      case 'INTERNSHIP': return 'Thực tập sinh';
      case 'PROBATION': return 'Thử việc';
      case 'OFFICIAL_1Y': return 'Chính thức (1 năm)';
      case 'INDEFINITE': return 'Không xác định thời hạn';
      default: return type || 'Chưa xác định';
    }
  };

  const getContractStatusBadge = (status, endDate) => {
    if (status === 'ACTIVE' && endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - today) / (1000 * 3600 * 24));
      
      if (diffDays < 0) {
        return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Hết hạn</span>;
      }
      if (diffDays <= 15) {
        return <span className="badge" style={{ backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Sắp hết hạn ({diffDays === 0 ? 'Hôm nay' : `còn ${diffDays} ngày`})</span>;
      }
    }

    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success" style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Hiệu lực</span>;
      case 'EXPIRED': return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Hết hạn</span>;
      case 'TERMINATED': return <span className="badge badge-error" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Đã chấm dứt</span>;
      default: return <span className="badge badge-purple">{status}</span>;
    }
  };

  const getEmployeeStatusName = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Chính thức';
      case 'PROBATION': return 'Thử việc';
      case 'INTERNSHIP': return 'Thực tập';
      case 'ONBOARDING': return 'Đang hội nhập';
      case 'RESIGNED': return 'Đã nghỉ việc';
      default: return status || '—';
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="page-title">Quản lý Hợp đồng</h1>
          <p className="text-muted text-sm">Gom nhóm hợp đồng theo từng nhân viên, tích hợp Đánh giá Thử việc.</p>
        </div>
      </div>

      <div className="card glass flex-col flex-1 overflow-hidden p-0">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
          <div className="flex gap-4 items-center w-1/2">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân sự..." 
                className="form-input w-full"
                style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.02)' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
             <div className="p-8 text-center text-muted">Đang tải dữ liệu...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white backdrop-blur-md z-10">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-4 text-sm font-semibold text-muted">Mã NV</th>
                  <th className="p-4 text-sm font-semibold text-muted">Nhân viên</th>
                  <th className="p-4 text-sm font-semibold text-muted">Chức vụ / Phòng ban</th>
                  <th className="p-4 text-sm font-semibold text-muted text-center">Số Hợp đồng</th>
                  <th className="p-4 text-sm font-semibold text-muted text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-[var(--border)] hover:bg-white transition-colors">
                    <td className="p-4 font-semibold text-[var(--primary)]">{emp.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-col">
                          <span className="font-semibold text-[var(--text-heading)]">{emp.fullName}</span>
                          <span className="text-muted text-xs">Trạng thái: {getEmployeeStatusName(emp.status)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{emp.position?.title || '-'}</div>
                      <div className="text-xs text-muted mt-1">{emp.department?.name || '-'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="badge badge-purple">{emp.contracts?.length || 0}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openHistoryModal(emp)} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                        Lịch sử HĐ <ChevronRight size={14} className="ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredEmployees.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-[var(--border)] bg-white flex-shrink-0" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>Hiển thị</span>
              <select
                className="form-input"
                style={{ width: '70px', padding: '4px 8px', fontSize: '0.85rem' }}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>
                nhân sự/trang (Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} / {filteredEmployees.length} nhân sự)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              {(() => {
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 || 
                    i === totalPages || 
                    (i >= currentPage - 1 && i <= currentPage + 1)
                  ) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== '...') {
                    pages.push('...');
                  }
                }
                return pages.map((page, idx) => 
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: '#94a3b8' }}>...</span>
                  ) : (
                    <button
                      key={page}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: '36px', height: '36px', padding: '0 8px', fontSize: '0.85rem', fontWeight: currentPage === page ? 700 : 500 }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              <button 
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.85rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.85rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedEmp && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)' }}>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] m-0">Hồ sơ Hợp đồng: {selectedEmp.fullName}</h3>
                <p className="text-muted text-sm m-0 mt-1">Trạng thái NS: <strong>{getEmployeeStatusName(selectedEmp.status)}</strong></p>
              </div>
              <div className="flex gap-2">
                <button onClick={openCreateModal} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Plus size={16} className="mr-1" /> Ký HĐ Mới
                </button>
                <button onClick={() => setShowHistoryModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar" style={{ flex: 1 }}>
              {!selectedEmp.contracts || selectedEmp.contracts.length === 0 ? (
                <div className="text-center text-muted py-8">Nhân viên này chưa có hợp đồng nào.</div>
              ) : (
                <div className="flex-col gap-4">
                  {selectedEmp.contracts.map(contract => (
                    <div key={contract.id} className="card p-4" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Briefcase size={18} className="text-primary" />
                          <h4 className="font-bold text-[var(--text-heading)] m-0">{getContractTypeName(contract.contractType)}</h4>
                        </div>
                        {getContractStatusBadge(contract.status, contract.endDate)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted">
                        <div><strong className="text-[var(--text-heading)]">Lương cơ bản:</strong> <span className="money-text">{formatCurrency(contract.baseSalary)}</span></div>
                        <div><strong className="text-[var(--text-heading)]">Ngày bắt đầu:</strong> {new Date(contract.startDate).toLocaleDateString('vi-VN')}</div>
                        {contract.endDate && <div><strong className="text-[var(--text-heading)]">Ngày hết hạn:</strong> {new Date(contract.endDate).toLocaleDateString('vi-VN')}</div>}
                      </div>

                      {/* Bản scan hợp đồng giấy */}
                      {(() => {
                        const contractPages = parseContractFiles(contract.fileUrl);
                        return (
                          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                            <span className="text-xs text-muted flex items-center gap-1.5 font-medium">
                              <FileText size={14} /> Bản scan hợp đồng giấy:
                              {contractPages.length > 0 && (
                                <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                  {contractPages.length} trang
                                </span>
                              )}
                            </span>
                            {contractPages.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingFile({
                                    contractId: contract.id,
                                    urls: contractPages,
                                    currentIndex: 0,
                                    title: `${getContractTypeName(contract.contractType)} - ${selectedEmp.fullName}`
                                  })}
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: '#3b82f6', color: '#3b82f6' }}
                                >
                                  <Eye size={13} /> Xem {contractPages.length} trang ký
                                </button>
                                <label className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Tải thêm trang vào hợp đồng này">
                                  <Upload size={13} /> Thêm trang
                                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(contract.id, e.target.files, true)} />
                                </label>
                              </div>
                            ) : (
                              <label className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', borderStyle: 'dashed' }}>
                                <Upload size={13} color="var(--primary)" /> Tải ảnh scan lên (nhiều trang)
                                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(contract.id, e.target.files, false)} />
                              </label>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Contract Modal */}
      {showCreateModal && selectedEmp && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ width: '560px', maxWidth: '100%', maxHeight: '92vh', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> Tạo Hợp đồng Mới
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Nhân viên: <strong>{selectedEmp.fullName}</strong> ({selectedEmp.code})
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateContract} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* Nếu nhân viên đang thử việc/thực tập, hiện khung đánh giá */}
              {(selectedEmp.status === 'PROBATION' || selectedEmp.status === 'INTERNSHIP') && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <AlertTriangle size={16} color="#d97706" />
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#b45309' }}>
                      Đánh giá Kết thúc Thử việc / Thực tập
                    </h4>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.4 }}>
                    Nhân viên đang ở trạng thái <strong>{getEmployeeStatusName(selectedEmp.status)}</strong>. Hệ thống sẽ tự động chuyển trạng thái sang <strong>Chính thức</strong> khi đánh giá ĐẠT.
                  </p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#78350f', marginBottom: '4px' }}>
                      Kết quả đánh giá:
                    </label>
                    <select
                      className="form-input w-full"
                      value={formData.evaluationResult}
                      onChange={e => setFormData({ ...formData, evaluationResult: e.target.value })}
                      style={{ fontSize: '0.85rem', backgroundColor: 'white' }}
                    >
                      <option value="PASSED">ĐẠT — Tự động kích hoạt Nhân viên Chính thức (ACTIVE)</option>
                      <option value="FAILED">KHÔNG ĐẠT — Tiếp tục gia hạn hoặc xem xét</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Loại hợp đồng */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Loại hợp đồng *
                </label>
                <select
                  required
                  className="form-input w-full"
                  value={formData.contractType}
                  onChange={e => handleContractTypeChange(e.target.value)}
                >
                  <option value="OFFICIAL_1Y">Chính thức (1 năm)</option>
                  <option value="INDEFINITE">Không xác định thời hạn</option>
                  <option value="PROBATION">Thử việc (Probation)</option>
                  <option value="INTERNSHIP">Thực tập sinh (Internship)</option>
                </select>
              </div>

              {/* Mức lương cơ bản */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mức lương cơ bản (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100000"
                  placeholder="Ví dụ: 15000000"
                  className="form-input w-full"
                  value={formData.baseSalary}
                  onChange={e => setFormData({ ...formData, baseSalary: e.target.value })}
                />
                {formData.baseSalary && (
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    {Number(formData.baseSalary).toLocaleString('vi-VN')} đ/tháng
                  </span>
                )}
              </div>

              {/* Ngày bắt đầu & Ngày kết thúc */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input w-full"
                    value={formData.startDate}
                    onChange={e => {
                      const newStart = e.target.value;
                      setFormData({
                        ...formData,
                        startDate: newStart,
                        endDate: calculateDefaultEndDate(formData.contractType, newStart)
                      });
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Ngày kết thúc {formData.contractType === 'INDEFINITE' ? '(Không thời hạn)' : ''}
                  </label>
                  <input
                    type="date"
                    disabled={formData.contractType === 'INDEFINITE'}
                    className="form-input w-full"
                    value={formData.contractType === 'INDEFINITE' ? '' : formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ backgroundColor: formData.contractType === 'INDEFINITE' ? '#f1f5f9' : 'white' }}
                  />
                </div>
              </div>

              {/* Upload nhiều ảnh scan giấy trong modal */}
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '14px 16px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Ảnh scan / Chụp Hợp đồng giấy (Hỗ trợ nhiều trang):
                  </label>
                  {formData.fileUrls.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                      Đã chọn {formData.fileUrls.length} trang
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={15} /> Chọn ảnh các trang HĐ
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                          Promise.all(files.map(file => new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => resolve(ev.target.result);
                            reader.readAsDataURL(file);
                          }))).then(newUrls => {
                            setFormData({ ...formData, fileUrls: [...formData.fileUrls, ...newUrls] });
                          });
                        }
                      }}
                    />
                  </label>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Giữ phím Ctrl/Shift để chọn nhiều ảnh (Trang 1, Trang 2...)
                  </span>
                </div>
                {formData.fileUrls.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    {formData.fileUrls.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={url} alt={`Trang ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px' }}>
                          Trang {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fileUrls: formData.fileUrls.filter((_, i) => i !== idx) })}
                          style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                          title="Xóa trang này"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" style={{ padding: '8px 18px' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo hợp đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Xem Nhiều Trang Ảnh Scan Hợp đồng phóng to */}
      {viewingFile && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '24px' }}>
          <div style={{ width: '920px', maxWidth: '100%', maxHeight: '94vh', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> {viewingFile.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Trang {viewingFile.currentIndex + 1} / {viewingFile.urls.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={14} /> Thêm trang
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUploadContractFiles(viewingFile.contractId, e.target.files, true)} />
                </label>
                <button
                  onClick={() => handleDeleteContractPage(viewingFile.contractId, viewingFile.currentIndex)}
                  style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="Xóa trang hiện tại"
                >
                  <Trash2 size={14} /> Xóa trang
                </button>
                <a
                  href={viewingFile.urls[viewingFile.currentIndex]}
                  download={`hop-dong-trang-${viewingFile.currentIndex + 1}.png`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <ExternalLink size={14} /> Mở tab mới
                </a>
                <button
                  onClick={() => setViewingFile(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            
            {/* Vùng xem ảnh kèm nút chuyển trang */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', position: 'relative' }}>
              {viewingFile.urls.length > 1 && (
                <>
                  <button
                    disabled={viewingFile.currentIndex === 0}
                    onClick={() => setViewingFile({ ...viewingFile, currentIndex: Math.max(0, viewingFile.currentIndex - 1) })}
                    style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: viewingFile.currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: viewingFile.currentIndex === 0 ? 0.3 : 1, transition: 'all 0.2s', zIndex: 10 }}
                    title="Trang trước"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    disabled={viewingFile.currentIndex === viewingFile.urls.length - 1}
                    onClick={() => setViewingFile({ ...viewingFile, currentIndex: Math.min(viewingFile.urls.length - 1, viewingFile.currentIndex + 1) })}
                    style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: viewingFile.currentIndex === viewingFile.urls.length - 1 ? 'not-allowed' : 'pointer', opacity: viewingFile.currentIndex === viewingFile.urls.length - 1 ? 0.3 : 1, transition: 'all 0.2s', zIndex: 10 }}
                    title="Trang sau"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              <img
                src={viewingFile.urls[viewingFile.currentIndex]}
                alt={`Hợp đồng trang ${viewingFile.currentIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '66vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
              />
            </div>

            {/* Thumbnail preview list ở đáy */}
            {viewingFile.urls.length > 1 && (
              <div style={{ padding: '12px 24px', backgroundColor: '#1e293b', display: 'flex', gap: '10px', overflowX: 'auto', borderTop: '1px solid #334155' }}>
                {viewingFile.urls.map((u, idx) => (
                  <div
                    key={idx}
                    onClick={() => setViewingFile({ ...viewingFile, currentIndex: idx })}
                    style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', border: idx === viewingFile.currentIndex ? '2px solid #3b82f6' : '2px solid transparent', opacity: idx === viewingFile.currentIndex ? 1 : 0.6, cursor: 'pointer', flexShrink: 0, position: 'relative' }}
                  >
                    <img src={u} alt={`Trang ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px' }}>
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
