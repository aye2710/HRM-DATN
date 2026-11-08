import React, { useState, useEffect, useMemo } from 'react';
import { FileDiff, Search, Plus, Filter, Edit2, Trash2, Eye, X, CheckCircle, Award, Target, Layers, Sparkles, BookOpen } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

export const KPITemplates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal tạo Mẫu mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: 'Tổ Phát triển (Dev)',
    status: 'Active',
    items: [
      { title: '', category: 'TIMELINE', target: 100, unit: '%', weight: 40, description: '' },
      { title: '', category: 'QUALITY', target: 100, unit: '%', weight: 30, description: '' },
      { title: '', category: 'COMPLIANCE', target: 100, unit: '%', weight: 20, description: '' },
      { title: '', category: 'GROWTH', target: 100, unit: '%', weight: 10, description: '' }
    ]
  });

  // Modal chỉnh sửa Mẫu có sẵn
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  // Modal xem chi tiết tiêu chuẩn
  const [viewingTemplate, setViewingTemplate] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/kpi/templates');
      setTemplates(res.data);
    } catch (err) {
      toast.error('Lỗi lấy dữ liệu Mẫu KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const totalCreateWeight = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  }, [formData.items]);

  const totalEditWeight = useMemo(() => {
    if (!editFormData || !editFormData.items) return 0;
    return editFormData.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  }, [editFormData]);

  const handleAddItem = (isEdit = false) => {
    if (isEdit) {
      setEditFormData({
        ...editFormData,
        items: [
          ...editFormData.items,
          { title: '', category: 'OUTPUT', target: 100, unit: '%', weight: 10, description: '' }
        ]
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          { title: '', category: 'OUTPUT', target: 100, unit: '%', weight: 10, description: '' }
        ]
      });
    }
  };

  const handleRemoveItem = (index, isEdit = false) => {
    if (isEdit) {
      if (editFormData.items.length <= 1) return toast.error('Mẫu phải có tối thiểu 1 tiêu chí');
      const newItems = editFormData.items.filter((_, i) => i !== index);
      setEditFormData({ ...editFormData, items: newItems });
    } else {
      if (formData.items.length <= 1) return toast.error('Mẫu phải có tối thiểu 1 tiêu chí');
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleItemChange = (index, field, value, isEdit = false) => {
    if (isEdit) {
      const newItems = [...editFormData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setEditFormData({ ...editFormData, items: newItems });
    } else {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Vui lòng nhập tên Mẫu KPI');
    if (totalCreateWeight !== 100) return toast.error(`Tổng trọng số các tiêu chí phải bằng đúng 100% (Hiện tại: ${totalCreateWeight}%)`);

    for (let i = 0; i < formData.items.length; i++) {
      if (!formData.items[i].title.trim()) {
        return toast.error(`Vui lòng nhập tên cho Tiêu chí #${i + 1}`);
      }
    }

    try {
      await axios.post('http://localhost:5000/api/kpi/templates', {
        name: formData.name,
        department: formData.department,
        criteria: formData.items.length,
        weight: '100%',
        status: formData.status,
        items: formData.items
      });
      toast.success('Đã tạo Mẫu KPI mới chuẩn hóa thành công!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        department: 'Tổ Phát triển (Dev)',
        status: 'Active',
        items: [
          { title: '', category: 'TIMELINE', target: 100, unit: '%', weight: 40, description: '' },
          { title: '', category: 'QUALITY', target: 100, unit: '%', weight: 30, description: '' },
          { title: '', category: 'COMPLIANCE', target: 100, unit: '%', weight: 20, description: '' },
          { title: '', category: 'GROWTH', target: 100, unit: '%', weight: 10, description: '' }
        ]
      });
      fetchTemplates();
    } catch (err) {
      toast.error('Lỗi khi tạo mẫu KPI');
    }
  };

  const handleOpenEdit = (tpl) => {
    let parsedItems = [];
    try {
      parsedItems = tpl.items ? JSON.parse(tpl.items) : [];
    } catch (e) {
      parsedItems = [];
    }
    setEditFormData({
      id: tpl.id,
      name: tpl.name,
      department: tpl.department,
      status: tpl.status || 'Active',
      items: parsedItems.length > 0 ? parsedItems : [
        { title: '', category: 'TIMELINE', target: 100, unit: '%', weight: 100, description: '' }
      ]
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) return toast.error('Vui lòng nhập tên Mẫu KPI');
    if (totalEditWeight !== 100) return toast.error(`Tổng trọng số các tiêu chí phải bằng đúng 100% (Hiện tại: ${totalEditWeight}%)`);

    for (let i = 0; i < editFormData.items.length; i++) {
      if (!editFormData.items[i].title.trim()) {
        return toast.error(`Vui lòng nhập tên cho Tiêu chí #${i + 1}`);
      }
    }

    try {
      await axios.put(`http://localhost:5000/api/kpi/templates/${editFormData.id}`, {
        name: editFormData.name,
        department: editFormData.department,
        criteria: editFormData.items.length,
        status: editFormData.status,
        items: editFormData.items
      });
      toast.success('Đã cập nhật Mẫu KPI thành công!');
      setIsEditModalOpen(false);
      setEditFormData(null);
      fetchTemplates();
    } catch (err) {
      toast.error('Lỗi khi cập nhật Mẫu KPI');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xác nhận xóa Mẫu KPI: "${name}"?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/kpi/templates/${id}`);
      toast.success('Đã xóa mẫu KPI');
      fetchTemplates();
    } catch (err) {
      toast.error('Lỗi khi xóa mẫu KPI');
    }
  };

  const parseTemplateItems = (itemsStr) => {
    if (!itemsStr) return [];
    try {
      const parsed = JSON.parse(itemsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const paginatedTemplates = useMemo(() => {
    return filteredTemplates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredTemplates, currentPage, itemsPerPage]);

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0 0.5rem' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileDiff size={22} color="#2563EB" />
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Mẫu Đánh Giá KPI (KPI Templates)
            </h1>
          </div>
          <p className="text-muted text-xs mt-1" style={{ margin: 0, color: '#64748B' }}>
            Thư viện tiêu chí chuẩn và tỷ lệ trọng số 100% theo từng phòng ban, giúp chuẩn hóa và giao mục tiêu chỉ trong 1 click.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Tạo Mẫu KPI mới
        </button>
      </div>

      {/* 2. Banner Hướng Dẫn Quy Chuẩn Sổ Tay Vận Hành DEV (LLA) */}
      <div style={{
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            backgroundColor: '#EFF6FF', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>
              Quy chuẩn KPI Khối Phát triển Phần mềm (DEV) theo Sổ tay vận hành LLA
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
              Cơ cấu 100 điểm bảo vệ lương cứng: <strong>Tiến độ UCP (40%)</strong> • <strong>Chất lượng Review (30%)</strong> • <strong>Kỷ luật Git/Wiki (20%)</strong> • <strong>Đóng góp đội ngũ (10%)</strong>.
            </div>
          </div>
        </div>
        <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.75rem', padding: '4px 10px' }}>
          Đã Chuẩn Hóa 100%
        </span>
      </div>

      {/* 3. Bảng Danh Sách Mẫu KPI */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        {/* Tìm kiếm */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm mẫu đánh giá theo tên hoặc phòng ban..." 
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.85rem', height: '36px' }}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            Tổng số: <strong>{filteredTemplates.length}</strong> bộ mẫu chuẩn
          </span>
        </div>

        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>TÊN MẪU ĐÁNH GIÁ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'left' }}>PHÒNG BAN ÁP DỤNG</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>SỐ TIÊU CHÍ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>TỔNG TRỌNG SỐ</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>TRẠNG THÁI</th>
                <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Đang tải danh sách Mẫu KPI...</td></tr>
              ) : filteredTemplates.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Chưa có Mẫu KPI nào phù hợp.</td></tr>
              ) : paginatedTemplates.map(tpl => {
                const items = parseTemplateItems(tpl.items);
                return (
                  <tr key={tpl.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileDiff size={16} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>{tpl.name}</span>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Chuẩn hóa bộ khung đánh giá định kỳ</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      {tpl.department}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '0.75rem', fontWeight: 700 }}>
                        {items.length || tpl.criteria} tiêu chí
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>
                      {tpl.weight || '100%'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                        {tpl.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', borderColor: '#BFDBFE' }}
                          onClick={() => setViewingTemplate(tpl)}
                          title="Xem chi tiết các tiêu chuẩn trong mẫu"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669', borderColor: '#A7F3D0' }}
                          onClick={() => handleOpenEdit(tpl)}
                          title="Chỉnh sửa Mẫu KPI"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', borderColor: '#FECACA' }} 
                          onClick={() => handleDelete(tpl.id, tpl.name)}
                          title="Xóa mẫu KPI"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phân Trang */}
        {filteredTemplates.length > 0 && (
          <div style={{
            padding: '0.75rem 0.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTemplates.length)} trong tổng số {filteredTemplates.length} bộ mẫu
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button 
                className="btn btn-outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    height: '32px', minWidth: '32px', padding: 0,
                    fontSize: '0.8rem', fontWeight: currentPage === page ? 700 : 500
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button 
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT CÁC TIÊU CHÍ TRONG MẪU */}
      {viewingTemplate && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '700px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  {viewingTemplate.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}>Phòng ban áp dụng: {viewingTemplate.department}</span>
              </div>
              <button onClick={() => setViewingTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                Danh sách các chỉ số KPI tiêu chuẩn ({parseTemplateItems(viewingTemplate.items).length} chỉ số):
              </div>

              {parseTemplateItems(viewingTemplate.items).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>Mẫu này chưa thiết lập danh sách tiêu chí con.</div>
              ) : (
                parseTemplateItems(viewingTemplate.items).map((item, idx) => (
                  <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                        #{idx + 1}. {item.title}
                      </div>
                      <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '0.75rem' }}>
                        Trọng số: {item.weight}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap' }}>
                      <span>Phân loại: <strong style={{ color: '#0F172A' }}>{item.category || 'OUTPUT'}</strong></span>
                      <span>Mức chỉ tiêu chuẩn (`Target`): <strong style={{ color: '#047857' }}>{item.target} {item.unit || '%'}</strong></span>
                    </div>

                    {item.description && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
              <button type="button" onClick={() => setViewingTemplate(null)} className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '0.85rem' }}>
                Đóng
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL TẠO MẪU KPI MỚI */}
      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '760px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="#2563EB" /> Thiết lập Mẫu KPI Chuẩn Hóa Mới
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tên Mẫu KPI *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="VD: Mẫu KPI Khối Lập trình viên Backend..." 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phòng ban áp dụng *</label>
                  <select 
                    className="form-select" 
                    value={formData.department} 
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Tổ Phát triển (Dev)">Tổ Phát triển (Dev)</option>
                    <option value="Tổ Kiểm thử">Tổ Kiểm thử (QA/QC)</option>
                    <option value="Phòng Nhân sự">Phòng Nhân sự (HR)</option>
                    <option value="Phòng Kinh doanh">Phòng Kinh doanh (Sales)</option>
                    <option value="Phòng Tài chính - Kế toán">Phòng Tài chính - Kế toán</option>
                    <option value="Toàn công ty">Toàn công ty</option>
                  </select>
                </div>
              </div>

              {/* Danh sách tiêu chí con */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                    Các chỉ số tiêu chuẩn trong mẫu (Tổng trọng số: <span style={{ color: totalCreateWeight === 100 ? '#166534' : '#DC2626', fontWeight: 800 }}>{totalCreateWeight}%</span>)
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleAddItem(false)}
                    className="btn btn-outline" 
                    style={{ fontSize: '0.78rem', padding: '3px 10px', color: '#2563EB', borderColor: '#BFDBFE' }}
                  >
                    + Thêm tiêu chí
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={`Tên tiêu chí #${index + 1}...`}
                          required
                          value={item.title}
                          onChange={e => handleItemChange(index, 'title', e.target.value, false)}
                          style={{ fontSize: '0.82rem', height: '34px' }}
                        />
                      </div>
                      <div>
                        <select 
                          className="form-select" 
                          value={item.category} 
                          onChange={e => handleItemChange(index, 'category', e.target.value, false)}
                          style={{ fontSize: '0.82rem', height: '34px' }}
                        >
                          <option value="OUTPUT">Khối lượng (Output)</option>
                          <option value="QUALITY">Chất lượng (Quality)</option>
                          <option value="TIMELINE">Tiến độ (Timeline)</option>
                          <option value="COMPLIANCE">Quy trình (Compliance)</option>
                          <option value="GROWTH">Đào tạo (Growth)</option>
                        </select>
                      </div>
                      <div>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="Chỉ tiêu"
                          required
                          value={item.target}
                          onChange={e => handleItemChange(index, 'target', e.target.value, false)}
                          style={{ fontSize: '0.82rem', height: '34px' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Đơn vị (%, ms...)"
                            value={item.unit}
                            onChange={e => handleItemChange(index, 'unit', e.target.value, false)}
                            style={{ fontSize: '0.82rem', height: '34px', width: '60px' }}
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Trọng số %"
                            required
                            value={item.weight}
                            onChange={e => handleItemChange(index, 'weight', e.target.value, false)}
                            style={{ fontSize: '0.82rem', height: '34px', width: '55px', fontWeight: 700 }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>%</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index, false)}
                        style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Mô tả / Hướng dẫn cách đo lường chỉ tiêu này..."
                      value={item.description}
                      onChange={e => handleItemChange(index, 'description', e.target.value, false)}
                      style={{ fontSize: '0.78rem', height: '30px', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700 }}>
                  Lưu Mẫu KPI
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL CHỈNH SỬA MẪU KPI CÓ SẴN */}
      {isEditModalOpen && editFormData && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '760px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="#059669" /> Chỉnh Sửa Mẫu KPI: {editFormData.name}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tên Mẫu KPI *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={editFormData.name} 
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phòng ban áp dụng *</label>
                  <select 
                    className="form-select" 
                    value={editFormData.department} 
                    onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                  >
                    <option value="Tổ Phát triển (Dev)">Tổ Phát triển (Dev)</option>
                    <option value="Tổ Kiểm thử">Tổ Kiểm thử (QA/QC)</option>
                    <option value="Phòng Nhân sự">Phòng Nhân sự (HR)</option>
                    <option value="Phòng Kinh doanh">Phòng Kinh doanh (Sales)</option>
                    <option value="Phòng Tài chính - Kế toán">Phòng Tài chính - Kế toán</option>
                    <option value="Toàn công ty">Toàn công ty</option>
                  </select>
                </div>
              </div>

              {/* Danh sách tiêu chí con */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                    Các chỉ số tiêu chuẩn trong mẫu (Tổng trọng số: <span style={{ color: totalEditWeight === 100 ? '#166534' : '#DC2626', fontWeight: 800 }}>{totalEditWeight}%</span>)
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleAddItem(true)}
                    className="btn btn-outline" 
                    style={{ fontSize: '0.78rem', padding: '3px 10px', color: '#2563EB', borderColor: '#BFDBFE' }}
                  >
                    + Thêm tiêu chí
                  </button>
                </div>

                {editFormData.items.map((item, index) => (
                  <div key={index} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={`Tên tiêu chí #${index + 1}...`}
                          required
                          value={item.title}
                          onChange={e => handleItemChange(index, 'title', e.target.value, true)}
                          style={{ fontSize: '0.82rem', height: '34px' }}
                        />
                      </div>
                      <div>
                        <select 
                          className="form-select" 
                          value={item.category} 
                          onChange={e => handleItemChange(index, 'category', e.target.value, true)}
                          style={{ fontSize: '0.82rem', height: '34px' }}
                        >
                          <option value="OUTPUT">Khối lượng (Output)</option>
                          <option value="QUALITY">Chất lượng (Quality)</option>
                          <option value="TIMELINE">Tiến độ (Timeline)</option>
                          <option value="COMPLIANCE">Quy trình (Compliance)</option>
                          <option value="GROWTH">Đào tạo (Growth)</option>
                        </select>
                      </div>
                      <div>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="Chỉ tiêu"
                          required
                          value={item.target}
                          onChange={e => handleItemChange(index, 'target', e.target.value, true)}
                          style={{ fontSize: '0.82rem', height: '34px' }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Đơn vị (%, ms...)"
                            value={item.unit}
                            onChange={e => handleItemChange(index, 'unit', e.target.value, true)}
                            style={{ fontSize: '0.82rem', height: '34px', width: '60px' }}
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Trọng số %"
                            required
                            value={item.weight}
                            onChange={e => handleItemChange(index, 'weight', e.target.value, true)}
                            style={{ fontSize: '0.82rem', height: '34px', width: '55px', fontWeight: 700 }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>%</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index, true)}
                        style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Mô tả / Hướng dẫn cách đo lường chỉ tiêu này..."
                      value={item.description}
                      onChange={e => handleItemChange(index, 'description', e.target.value, true)}
                      style={{ fontSize: '0.78rem', height: '30px', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 20px', fontWeight: 700, backgroundColor: '#059669', borderColor: '#059669' }}>
                  Cập nhật Mẫu KPI
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
