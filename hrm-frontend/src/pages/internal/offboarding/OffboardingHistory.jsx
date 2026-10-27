import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Search, Printer, ChevronsLeft, ChevronLeft, 
  ChevronRight, ChevronsRight, CheckCircle2, UserMinus, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bm02PrintModal } from './OffboardingModals';

export const OffboardingHistory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [resignedList, setResignedList] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  // Modal
  const [showBm02Modal, setShowBm02Modal] = useState(null);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/offboarding/overview');
      setResignedList(res.data.resigned || []);
    } catch (error) {
      console.error('Error fetching offboarding history:', error);
      toast.error('Lỗi khi tải sổ lịch sử thôi việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  // Filter Resigned Employees
  const filteredResigned = useMemo(() => {
    return resignedList.filter(emp => {
      if (!historySearch) return true;
      const term = historySearch.toLowerCase();
      return (
        emp.fullName?.toLowerCase().includes(term) ||
        emp.code?.toLowerCase().includes(term) ||
        emp.department?.name?.toLowerCase().includes(term) ||
        emp.resignationReason?.toLowerCase().includes(term)
      );
    });
  }, [resignedList, historySearch]);

  const totalHistoryPages = Math.ceil(filteredResigned.length / historyItemsPerPage) || 1;
  const startHistoryIndex = (historyPage - 1) * historyItemsPerPage;
  const paginatedResigned = filteredResigned.slice(startHistoryIndex, startHistoryIndex + historyItemsPerPage);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
              <FileText size={26} color="#dc2626" /> Sổ Lịch sử Thôi việc & Bàn giao
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
              LƯU TRỮ HỒ SƠ PHÁP LÝ
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Tra cứu toàn bộ nhân sự đã hoàn tất thủ tục thôi việc, xem biên bản thu hồi tài sản BM-02 và quyết định thôi việc
          </p>
        </div>

        <div>
          <button
            onClick={() => navigate('/internal/offboarding/checklist')}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={15} /> Về Tiến độ Bàn giao
          </button>
        </div>
      </div>

      {/* 2. Bảng Danh sách Sổ Lịch sử */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Search header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#ffffff' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Tìm nhân sự theo tên, mã NV, phòng ban, lý do..." 
              className="form-input"
              style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
              value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Tổng cộng <strong style={{ color: '#0f172a' }}>{filteredResigned.length}</strong> nhân sự đã hoàn tất thôi việc
          </div>
        </div>

        {/* Table */}
        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table style={{ minWidth: '950px' }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Phòng ban cũ</th>
                <th>Vị trí cũ</th>
                <th>Ngày nghỉ việc</th>
                <th>Lý do thôi việc</th>
                <th style={{ textAlign: 'right' }}>Văn bản & Biên bản</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang nạp dữ liệu sổ lịch sử...</td></tr>
              ) : paginatedResigned.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chưa có hồ sơ thôi việc nào phù hợp</td></tr>
              ) : (
                paginatedResigned.map(emp => (
                  <tr key={emp.id} style={{ opacity: 0.9 }}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.code}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.fullName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>Đã thôi việc (RESIGNED)</div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.position?.title || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {emp.resignationDate ? new Date(emp.resignationDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic', maxWidth: '220px' }}>
                      {emp.resignationReason || 'Nghỉ việc theo quy định'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          onClick={() => setShowBm02Modal(emp)}
                          className="btn btn-outline"
                          style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0284c7', borderColor: '#38bdf8' }}
                          title="In Biên bản thu hồi tài sản BM-02"
                        >
                          <Printer size={12} /> In BM-02
                        </button>

                        {emp.decisions && emp.decisions.length > 0 && (
                          <Link
                            to={`/internal/employees/decisions/${emp.decisions[0].id}`}
                            className="btn btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#475569' }}
                            title="Xem Quyết định thôi việc"
                          >
                            <FileText size={12} /> Xem QĐ
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {filteredResigned.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Hiển thị {startHistoryIndex + 1} - {Math.min(startHistoryIndex + historyItemsPerPage, filteredResigned.length)} trong {filteredResigned.length} hồ sơ
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-outline" disabled={historyPage === 1} onClick={() => setHistoryPage(1)} style={{ padding: '3px 8px' }}><ChevronsLeft size={14} /></button>
              <button className="btn btn-outline" disabled={historyPage === 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))} style={{ padding: '3px 8px' }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: '0.8rem', padding: '0 8px', display: 'flex', alignItems: 'center' }}>Trang {historyPage} / {totalHistoryPages}</span>
              <button className="btn btn-outline" disabled={historyPage === totalHistoryPages} onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} style={{ padding: '3px 8px' }}><ChevronRight size={14} /></button>
              <button className="btn btn-outline" disabled={historyPage === totalHistoryPages} onClick={() => setHistoryPage(totalHistoryPages)} style={{ padding: '3px 8px' }}><ChevronsRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal In BM-02 */}
      {showBm02Modal && (
        <Bm02PrintModal
          employee={showBm02Modal}
          onClose={() => setShowBm02Modal(null)}
        />
      )}

    </div>
  );
};
