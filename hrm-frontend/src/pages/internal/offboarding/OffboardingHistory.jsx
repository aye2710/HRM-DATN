import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Search, CheckCircle2, UserMinus, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bm02PrintModal } from './OffboardingModals';
import { TablePagination, usePagination } from '../../../components/common/TablePagination';
import { formatDate } from '../../../utils/dateUtils';
import { PageHeader } from '../../../components/common/PageHeader';

export const OffboardingHistory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [resignedList, setResignedList] = useState([]);
  const [historySearch, setHistorySearch] = useState('');

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

  const {
    currentPage: historyPage,
    setCurrentPage: setHistoryPage,
    pageSize: historyItemsPerPage,
    setPageSize: setHistoryItemsPerPage,
    totalItems: totalHistoryItems,
    totalPages: totalHistoryPages,
    paginatedItems: paginatedResigned,
  } = usePagination(filteredResigned, 10);

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header chuẩn đồng bộ */}
      <PageHeader
        icon={<FileText size={20} />}
        iconBg="#FEF2F2"
        iconColor="#DC2626"
        title="Sổ Lịch sử Thôi việc & Bàn giao"
        badge={
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
            LƯU TRỮ HỒ SƠ PHÁP LÝ
          </span>
        }
        subtitle="Tra cứu toàn bộ nhân sự đã hoàn tất thủ tục thôi việc, xem biên bản thu hồi tài sản BM-02 và quyết định thôi việc"
        actions={
          <button
            onClick={() => navigate('/internal/offboarding/checklist')}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={15} /> Về Tiến độ Bàn giao
          </button>
        }
      />

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
                      {formatDate(emp.resignationDate)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic', maxWidth: '220px' }}>
                      {emp.resignationReason || 'Nghỉ việc theo quy định'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          onClick={() => setShowBm02Modal(emp)}
                          className="btn btn-outline"
                          style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', borderColor: '#38bdf8' }}
                          title="Xem Biên bản thu hồi tài sản BM-02"
                        >
                          <FileText size={14} />
                        </button>

                        {emp.decisions && emp.decisions.length > 0 && (
                          <Link
                            to={`/internal/employees/decisions/${emp.decisions[0].id}`}
                            className="btn btn-outline"
                            style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                            title="Xem Quyết định thôi việc"
                          >
                            <FileText size={14} />
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
        {!loading && (
          <TablePagination
            currentPage={historyPage}
            totalPages={totalHistoryPages}
            pageSize={historyItemsPerPage}
            totalItems={totalHistoryItems}
            onPageChange={setHistoryPage}
            onPageSizeChange={setHistoryItemsPerPage}
            itemLabel="hồ sơ"
          />
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
