import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Plus, Filter, AlertTriangle, FileText, CheckCircle, ChevronRight, X, Briefcase } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';


export const Contracts = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create contract form states
  const [formData, setFormData] = useState({
    contractType: 'OFFICIAL_1Y',
    baseSalary: '',
    startDate: '',
    endDate: '',
    evaluationResult: 'NONE' // PASSED, FAILED, NONE
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

  const openHistoryModal = (emp) => {
    setSelectedEmp(emp);
    setShowHistoryModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      contractType: 'OFFICIAL_1Y',
      baseSalary: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      evaluationResult: 'NONE'
    });
    setShowCreateModal(true);
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
        baseSalary: parseFloat(formData.baseSalary)
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
      case 'INTERNSHIP': return 'Thực tập';
      case 'PROBATION': return 'Thử việc';
      case 'OFFICIAL_1Y': return 'Chính thức (1 năm)';
      case 'INDEFINITE': return 'Không xác định thời hạn';
      default: return type;
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 1rem', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Quản lý Hợp đồng</h1>
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
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-[var(--border)] hover:bg-white transition-colors">
                    <td className="p-4 font-semibold text-[var(--primary)]">{emp.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-col">
                          <span className="font-semibold text-[var(--text-heading)]">{emp.fullName}</span>
                          <span className="text-muted text-xs">Trạng thái: {emp.status}</span>
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
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedEmp && createPortal(
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)' }}>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] m-0">Hồ sơ Hợp đồng: {selectedEmp.fullName}</h3>
                <p className="text-muted text-sm m-0 mt-1">Trạng thái NS: {selectedEmp.status}</p>
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
                        <span className={`badge ${contract.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>{contract.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted">
                        <div><strong className="text-[var(--text-heading)]">Lương cơ bản:</strong> <span className="money-text">{formatCurrency(contract.baseSalary)}</span></div>
                        <div><strong className="text-[var(--text-heading)]">Ngày bắt đầu:</strong> {new Date(contract.startDate).toLocaleDateString('vi-VN')}</div>
                        {contract.endDate && <div><strong className="text-[var(--text-heading)]">Ngày hết hạn:</strong> {new Date(contract.endDate).toLocaleDateString('vi-VN')}</div>}
                      </div>
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
        <div className="flex items-center justify-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110, backgroundColor: 'rgba(67, 89, 113, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card glass flex-col overflow-hidden relative" style={{ width: '500px', maxWidth: '95vw', padding: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-[var(--text-main)] m-0">Tạo Hợp đồng Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateContract} className="p-6 flex-col gap-4">
              
              {/* Nếu nhân viên đang thử việc/thực tập, hiện khung đánh giá */}
              {(selectedEmp.status === 'PROBATION' || selectedEmp.status === 'INTERNSHIP') && (
                <div className="p-4 rounded-lg mb-2" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <h4 className="font-bold text-warning mb-2" style={{ fontSize: '0.9rem' }}>Đánh giá Kết thúc Thử việc/Thực tập</h4>
                  <p className="text-muted text-xs mb-3">Nhân viên này đang ở trạng thái {selectedEmp.status}. Vui lòng nhập kết quả đánh giá để ký hợp đồng tiếp theo.</p>
                  <label className="form-label text-muted">Kết quả đánh giá</label>
                  <select required className="form-input w-full" value={formData.evaluationResult} onChange={e => setFormData({...formData, evaluationResult: e.target.value})}>
                    <option value="NONE">-- Chọn kết quả --</option>
                    <option value="PASSED" className="text-black">ĐẠT (Tự động chuyển lên Chính thức)</option>
                    <option value="FAILED" className="text-black">KHÔNG ĐẠT (Tiếp tục gia hạn)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label text-muted">Loại hợp đồng *</label>
                  <select className="form-input w-full" required value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value})}>
                    <option value="INTERNSHIP" className="text-black">Thực tập</option>
                    <option value="PROBATION" className="text-black">Thử việc</option>
                    <option value="OFFICIAL_1Y" className="text-black">Chính thức (1 năm)</option>
                    <option value="INDEFINITE" className="text-black">Không xác định thời hạn</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label text-muted">Mức lương cơ bản (VND) *</label>
                  <input type="number" required min="0" className="form-input w-full" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} />
                </div>
                <div>
                  <label className="form-label text-muted">Ngày bắt đầu *</label>
                  <input type="date" required className="form-input w-full" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label text-muted">Ngày kết thúc</label>
                  <input type="date" className="form-input w-full" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Đang tạo...' : 'Tạo hợp đồng'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
