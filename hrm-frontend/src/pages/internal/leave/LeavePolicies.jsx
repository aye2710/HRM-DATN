import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileBadge, Search, Plus, Filter, Trash2, Edit2, XCircle, Award } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { PageHeader } from '../../../components/common/PageHeader';

const DEFAULT_FORM_DATA = {
  name: '',
  type: 'Nghỉ phép năm',
  seniority: '5 năm',
  extraDays: '+1 ngày',
  maxDays: '13 ngày'
};

export const LeavePolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const fetchPolicies = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/leave-config/policies'),
      axios.get('/api/leave-config/types').catch(() => ({ data: [] }))
    ])
      .then(([polRes, typesRes]) => {
        setPolicies(polRes.data || []);
        setLeaveTypes(typesRes.data || []);
      })
      .catch(err => toast.error('Lỗi lấy dữ liệu chính sách'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(DEFAULT_FORM_DATA);
    setShowModal(true);
  };

  const handleOpenEdit = (policy) => {
    setEditingItem(policy);
    setFormData({
      name: policy.name || '',
      type: policy.type || 'Nghỉ phép năm',
      seniority: policy.seniority || '',
      extraDays: policy.extraDays || '',
      maxDays: policy.maxDays || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      axios.put(`/api/leave-config/policies/${editingItem.id}`, formData)
        .then(() => {
          toast.success('Cập nhật chính sách thành công');
          setShowModal(false);
          setEditingItem(null);
          fetchPolicies();
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi cập nhật chính sách'));
    } else {
      axios.post('/api/leave-config/policies', formData)
        .then(() => {
          toast.success('Thêm chính sách thành công');
          setShowModal(false);
          setFormData(DEFAULT_FORM_DATA);
          fetchPolicies();
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi thêm chính sách'));
    }
  };

  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedPolicies,
    resetPage,
  } = usePagination(filteredPolicies, 10);

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({ 
      title: 'Xóa chính sách?', 
      text: "Hành động này không thể hoàn tác", 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Xóa', 
      cancelButtonText: 'Hủy' 
    });
    if (result.isConfirmed) {
      axios.delete(`/api/leave-config/policies/${id}`)
        .then(() => { toast.success('Xóa thành công'); fetchPolicies(); })
        .catch(err => toast.error('Lỗi xóa chính sách'));
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        icon={<FileBadge size={20} />}
        title="Chính sách Nghỉ phép"
        subtitle="Cấu hình quy chế thâm niên, tăng phép theo năm cống hiến và quy định thời hạn báo trước theo SOP-91 & Company-wide Policies"
        actions={
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Thêm Chính sách
          </button>
        }
      />

      {/* Banner Tóm tắt Quy chế Nghỉ phép Doanh nghiệp (Theo Company-wide Policies 14/10/2026 & SOP-91) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E2E8F0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.65rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563EB' }} />
            Quy Định Về Thời Hạn Báo Trước &amp; Quy Trình Phê Duyệt Nghỉ Phép (LLA Policy)
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
            Ưu tiên Company-wide Policies (14/10/2026)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', fontSize: '0.825rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>⏳ Thời hạn báo trước</div>
            <div style={{ color: '#475569', lineHeight: 1.5 }}>
              &bull; Đơn thông thường: <strong>&ge; 48 giờ làm việc</strong>, nộp có xác nhận Trưởng bộ phận trước 1 ngày.<br />
              &bull; Đột xuất / Khẩn cấp: Báo ngay cho Quản lý và hoàn tất bổ sung đơn trong vòng <strong>3 ngày</strong>.
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>📋 Bàn giao công việc (Jira/Confluence)</div>
            <div style={{ color: '#475569', lineHeight: 1.5 }}>
              &bull; Nghỉ từ <strong>3 ngày trở lên</strong>: Bắt buộc lập kế hoạch và bàn giao đầu việc trên <strong>Jira / Confluence</strong>.<br />
              &bull; Chỉ định rõ nhân sự nhận bàn giao thay thế.
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>⚖️ Quỹ phép &amp; Việc riêng có lương</div>
            <div style={{ color: '#475569', lineHeight: 1.5 }}>
              &bull; Phép năm: <strong>12 ngày/năm</strong> + <strong>1 ngày/mỗi 5 năm</strong> thâm niên (Điều 114 BLLĐ).<br />
              &bull; Cưới bản thân: <strong>3 ngày</strong>; Con cưới: <strong>1 ngày</strong>; Tang gia: <strong>3 ngày</strong> (Điều 115 BLLĐ).
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>🔄 Chuyển phép &amp; Mốc tính tháng (SOP LLA)</div>
            <div style={{ color: '#475569', lineHeight: 1.5 }}>
              &bull; <strong>Chuyển phép năm cũ:</strong> Tối đa <strong>5 ngày</strong>, sử dụng đến hết <strong>31/03</strong> năm sau.<br />
              &bull; <strong>Mốc ngày 15:</strong> Vào làm từ ngày 1-15 tính trọn tháng (+1 ngày phép), sau ngày 15 chưa tính.
            </div>
          </div>
        </div>
      </div>

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm chính sách theo tên hoặc loại phép..." 
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên Chính sách</th>
                <th>Áp dụng cho Loại phép</th>
                <th>Điều kiện Thâm niên</th>
                <th>Ngày phép cộng thêm</th>
                <th>Tổng phép tối đa</th>
                <th className="text-center" style={{ width: '110px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : filteredPolicies.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có chính sách nào</td></tr>
              ) : (
                paginatedPolicies.map(policy => (
                  <tr key={policy.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.45rem', borderRadius: '0.5rem', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                          <Award size={16} color="#2563EB" />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{policy.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{policy.type}</span></td>
                    <td><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{policy.seniority}</span></td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 700 }}>{policy.extraDays}</span></td>
                    <td><span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{policy.maxDays}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleOpenEdit(policy)} 
                          className="btn btn-outline" 
                          title="Chỉnh sửa chính sách"
                          style={{ padding: '0.4rem', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#2563EB' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(policy.id)} 
                          className="btn btn-outline" 
                          title="Xóa chính sách"
                          style={{ padding: '0.4rem', border: '1px solid #E2E8F0', borderRadius: '6px', color: 'var(--error)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="chính sách"
            flush={false}
          />
        )}
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card glass animate-fade-in" style={{ width: '480px', maxWidth: '95vw', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                  {editingItem ? 'Chỉnh Sửa Chính Sách' : 'Thêm Chính Sách Mới'}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {editingItem ? `Cập nhật thông số chính sách "${editingItem.name}"` : 'Cấu hình quy tắc cộng dồn thâm niên và định mức phép'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tên chính sách <span style={{ color: 'red' }}>*</span></label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%' }} 
                  placeholder="VD: Thâm niên 5 năm (Điều 114 BLLĐ)"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Áp dụng cho Loại phép <span style={{ color: 'red' }}>*</span></label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Nghỉ phép năm">Nghỉ phép năm</option>
                  {leaveTypes.filter(t => t.name !== 'Nghỉ phép năm').map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Thâm niên yêu cầu <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    placeholder="VD: 5 năm" 
                    value={formData.seniority} 
                    onChange={e => setFormData({...formData, seniority: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Ngày phép cộng thêm <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    placeholder="VD: +1 ngày" 
                    value={formData.extraDays} 
                    onChange={e => setFormData({...formData, extraDays: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Số ngày nghỉ tối đa</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%' }} 
                  placeholder="VD: 13 ngày" 
                  value={formData.maxDays} 
                  onChange={e => setFormData({...formData, maxDays: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingItem ? 'Lưu Thay Đổi' : 'Thêm Chính Sách'}
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
