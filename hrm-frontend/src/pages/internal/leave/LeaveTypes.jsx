import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Search, Plus, Filter, Trash2, Edit2, XCircle, CalendarHeart, Sparkles, Lock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { PageHeader } from '../../../components/common/PageHeader';

const DEFAULT_FORM_DATA = {
  name: '',
  code: '',
  defaultDays: 12,
  paid: true,
  carryForward: false,
  deductAnnualLeave: true,
  paidBy: 'COMPANY',
  maxDaysPerOccasion: '',
  requiresAttachment: false,
  status: 'Hoạt động'
};

export const LeaveTypes = () => {
  const [types, setTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const fetchTypes = () => {
    setLoading(true);
    axios.get('/api/leave-config/types')
      .then(res => setTypes(res.data))
      .catch(err => toast.error('Lỗi lấy dữ liệu loại phép'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(DEFAULT_FORM_DATA);
    setShowModal(true);
  };

  const handleOpenEdit = (leave) => {
    setEditingItem(leave);
    setFormData({
      name: leave.name || '',
      code: leave.code || '',
      defaultDays: leave.defaultDays ?? 12,
      paid: Boolean(leave.paid),
      carryForward: Boolean(leave.carryForward),
      deductAnnualLeave: leave.deductAnnualLeave !== undefined ? Boolean(leave.deductAnnualLeave) : true,
      paidBy: leave.paidBy || (leave.paid ? 'COMPANY' : 'NONE'),
      maxDaysPerOccasion: leave.maxDaysPerOccasion !== null && leave.maxDaysPerOccasion !== undefined ? leave.maxDaysPerOccasion : '',
      requiresAttachment: Boolean(leave.requiresAttachment),
      status: leave.status || 'Hoạt động'
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      code: editingItem ? editingItem.code : 'AUTO',
      defaultDays: Number(formData.defaultDays),
      maxDaysPerOccasion: formData.maxDaysPerOccasion !== '' && formData.maxDaysPerOccasion !== null ? Number(formData.maxDaysPerOccasion) : null
    };

    if (editingItem) {
      axios.put(`/api/leave-config/types/${editingItem.id}`, payload)
        .then(() => {
          toast.success('Cập nhật loại phép thành công');
          setShowModal(false);
          setEditingItem(null);
          fetchTypes();
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi cập nhật loại phép'));
    } else {
      axios.post('/api/leave-config/types', payload)
        .then(() => {
          toast.success('Thêm loại phép mới thành công');
          setShowModal(false);
          setFormData(DEFAULT_FORM_DATA);
          fetchTypes();
        })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi thêm loại phép'));
    }
  };

  const filteredTypes = types.filter(l => 
    (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.code && l.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedTypes,
    resetPage,
  } = usePagination(filteredTypes, 10);

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({ 
      title: 'Xóa loại phép?', 
      text: "Hành động này không thể hoàn tác", 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Xóa', 
      cancelButtonText: 'Hủy' 
    });
    if (result.isConfirmed) {
      axios.delete(`/api/leave-config/types/${id}`)
        .then(() => { toast.success('Xóa thành công'); fetchTypes(); })
        .catch(err => toast.error(err.response?.data?.error || 'Lỗi xóa loại phép'));
    }
  };

  const getPaidByLabel = (paidBy, paid) => {
    if (paidBy === 'COMPANY') return <span style={{ color: 'var(--success)', fontWeight: 600 }}>Công ty trả 100%</span>;
    if (paidBy === 'SOCIAL_INSURANCE') return <span style={{ color: '#8B5CF6', fontWeight: 600 }}>BHXH chi trả</span>;
    if (paidBy === 'NONE' || !paid) return <span style={{ color: 'var(--error)', fontWeight: 600 }}>Không lương</span>;
    return paid ? <span style={{ color: 'var(--success)' }}>Có</span> : <span style={{ color: 'var(--error)' }}>Không</span>;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        icon={<CalendarHeart size={20} />}
        title="Loại Nghỉ phép"
        subtitle="Cấu hình định mức, quy tắc hưởng lương, trừ phép năm và cộng dồn của từng loại phép"
        actions={
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Tạo Loại phép mới
          </button>
        }
      />

      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo mã code hoặc tên loại phép..." 
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
                <th style={{ width: '140px' }}>Mã loại phép</th>
                <th>Tên loại phép</th>
                <th>Định mức mặc định</th>
                <th>Nguồn chi trả</th>
                <th>Trừ phép năm</th>
                <th>Cộng dồn năm sau</th>
                <th>Trạng thái</th>
                <th className="text-center" style={{ width: '110px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : filteredTypes.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có loại phép nào</td></tr>
              ) : (
                paginatedTypes.map(leave => (
                  <tr key={leave.id}>
                    {/* 1. Cột Mã loại phép tách riêng */}
                    <td>
                      <span style={{ 
                        fontFamily: 'Consolas, Monaco, monospace', 
                        fontWeight: 700, 
                        fontSize: '0.8125rem',
                        color: '#1E40AF', 
                        backgroundColor: '#EFF6FF', 
                        padding: '0.3rem 0.65rem', 
                        borderRadius: '0.375rem',
                        border: '1px solid #BFDBFE',
                        letterSpacing: '0.04em',
                        display: 'inline-block'
                      }}>
                        {leave.code}
                      </span>
                    </td>

                    {/* 2. Cột Tên loại phép tách riêng */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          padding: '0.45rem', 
                          borderRadius: '0.5rem', 
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #DCFCE7' 
                        }}>
                          <CalendarHeart size={16} color="#16A34A" />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {leave.name}
                        </span>
                      </div>
                    </td>

                    {/* 3. Định mức */}
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{leave.defaultDays} ngày</span>
                      {leave.maxDaysPerOccasion && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tối đa {leave.maxDaysPerOccasion} ngày/lần
                        </div>
                      )}
                    </td>

                    {/* 4. Nguồn chi trả */}
                    <td>
                      {getPaidByLabel(leave.paidBy, leave.paid)}
                    </td>

                    {/* 5. Trừ phép năm */}
                    <td>
                      {leave.deductAnnualLeave ? (
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>Trừ quỹ phép</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Không trừ</span>
                      )}
                    </td>

                    {/* 6. Cộng dồn */}
                    <td>
                      {leave.carryForward ? (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Có</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Không</span>
                      )}
                    </td>

                    {/* 7. Trạng thái */}
                    <td>
                      <span className={`badge ${leave.status === 'Hoạt động' ? 'badge-success' : 'badge-error'}`}>
                        {leave.status}
                      </span>
                    </td>

                    {/* 8. Thao tác */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleOpenEdit(leave)} 
                          className="btn btn-outline" 
                          title="Chỉnh sửa loại phép"
                          style={{ padding: '0.4rem', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#2563EB' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(leave.id)} 
                          className="btn btn-outline" 
                          title="Xóa loại phép"
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
            itemLabel="loại phép"
            flush={false}
          />
        )}
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card glass animate-fade-in" style={{ width: '520px', maxWidth: '95vw', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                  {editingItem ? 'Chỉnh Sửa Loại Phép' : 'Thêm Loại Phép Mới'}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {editingItem ? `Cập nhật cấu hình loại phép "${editingItem.name}"` : 'Tạo mới loại phép phục vụ đăng ký và tính lương'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Tên loại phép <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    placeholder="VD: Nghỉ khám sức khỏe định kỳ"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {editingItem ? <Lock size={13} color="#64748B" /> : <Sparkles size={13} color="#2563EB" />}
                    Mã loại phép
                  </label>
                  <input 
                    type="text" 
                    disabled 
                    className="form-input" 
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#F8FAFC', 
                      color: editingItem ? '#1E3A8A' : '#64748B', 
                      fontFamily: editingItem ? 'monospace' : 'inherit',
                      fontWeight: editingItem ? 700 : 500,
                      cursor: 'not-allowed',
                      border: '1px solid #E2E8F0'
                    }} 
                    value={editingItem ? formData.code : 'Hệ thống tự động sinh (VD: LP01)'} 
                  />
                  <div style={{ fontSize: '0.72rem', color: editingItem ? '#64748B' : '#16A34A', marginTop: '0.25rem' }}>
                    {editingItem ? 'Mã cố định bảo toàn lịch sử chấm công' : '✓ Hệ thống tự cấp mã tránh trùng'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Số ngày mặc định (Năm) <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    value={formData.defaultDays} 
                    onChange={e => setFormData({...formData, defaultDays: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Giới hạn ngày / lần</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    placeholder="Để trống nếu không giới hạn"
                    value={formData.maxDaysPerOccasion} 
                    onChange={e => setFormData({...formData, maxDaysPerOccasion: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Nguồn chi trả thu nhập</label>
                  <select 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={formData.paidBy} 
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({
                        ...formData, 
                        paidBy: val,
                        paid: val === 'COMPANY'
                      });
                    }}
                  >
                    <option value="COMPANY">Công ty trả 100% lương</option>
                    <option value="SOCIAL_INSURANCE">Cơ quan BHXH chi trả</option>
                    <option value="NONE">Không hưởng lương</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Trạng thái áp dụng</label>
                  <select 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Quy tắc kinh doanh:</span>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.deductAnnualLeave} 
                    onChange={e => setFormData({...formData, deductAnnualLeave: e.target.checked})} 
                  />
                  <span>Trừ vào <strong>Quỹ phép năm (12 ngày)</strong> của nhân sự</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.carryForward} 
                    onChange={e => setFormData({...formData, carryForward: e.target.checked})} 
                  />
                  <span>Được <strong>cộng dồn bảo lưu</strong> sang năm sau (hạn 31/03)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.requiresAttachment} 
                    onChange={e => setFormData({...formData, requiresAttachment: e.target.checked})} 
                  />
                  <span>Bắt buộc <strong>đính kèm hồ sơ minh chứng</strong> (giấy viện, kết hôn...)</span>
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingItem ? 'Lưu Thay Đổi' : 'Tạo Loại Phép'}
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
