import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, Search, Plus, Filter, TrendingUp, DollarSign, 
  ArrowRight, Award, ShieldAlert, XCircle, Calendar, User, ExternalLink, RefreshCw
} from 'lucide-react';
import axios from 'axios';

export const EmploymentHistory = () => {
  const navigate = useNavigate();
  const [employments, setEmployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchHistory = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/employees/history')
      .then(res => setEmployments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getReasonBadge = (reason = '') => {
    const text = reason.toLowerCase();
    if (text.includes('khen thưởng') || text.includes('reward')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
          <Award size={12} /> {reason}
        </span>
      );
    }
    if (text.includes('kỷ luật') || text.includes('discipline')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
          <ShieldAlert size={12} /> {reason}
        </span>
      );
    }
    if (text.includes('thôi việc') || text.includes('nghỉ việc') || text.includes('chấm dứt')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>
          <XCircle size={12} /> {reason}
        </span>
      );
    }
    if (text.includes('bổ nhiệm') || text.includes('thăng chức') || text.includes('promotion')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          <TrendingUp size={12} /> {reason}
        </span>
      );
    }
    if (text.includes('điều chuyển') || text.includes('transfer')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
          <ArrowRight size={12} /> {reason}
        </span>
      );
    }
    if (text.includes('lương') || text.includes('salary')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
          <DollarSign size={12} /> {reason}
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
        {reason || 'Thay đổi thông tin'}
      </span>
    );
  };

  const filtered = employments.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (e.employee?.fullName && e.employee.fullName.toLowerCase().includes(term)) ||
                        (e.employee?.code && e.employee.code.toLowerCase().includes(term)) ||
                        (e.changeReason && e.changeReason.toLowerCase().includes(term)) ||
                        (e.department?.name && e.department.name.toLowerCase().includes(term)) ||
                        (e.position?.title && e.position.title.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (typeFilter === 'SALARY') return e.changeReason?.toLowerCase().includes('lương');
    if (typeFilter === 'PROMOTION') return e.changeReason?.toLowerCase().includes('bổ nhiệm') || e.changeReason?.toLowerCase().includes('thăng');
    if (typeFilter === 'TRANSFER') return e.changeReason?.toLowerCase().includes('điều chuyển');
    if (typeFilter === 'TERMINATION') return e.changeReason?.toLowerCase().includes('thôi việc') || e.changeReason?.toLowerCase().includes('nghỉ việc');
    if (typeFilter === 'REWARD') return e.changeReason?.toLowerCase().includes('khen thưởng');
    if (typeFilter === 'DISCIPLINE') return e.changeReason?.toLowerCase().includes('kỷ luật');

    return true;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={22} color="var(--primary)" /> Quá Trình Công Tác
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              LỊCH SỬ VIỆC LÀM & THĂNG TIẾN
            </span>
          </div>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Dòng thời gian ghi nhận toàn bộ quá trình thăng chức, điều chuyển, nâng lương, khen thưởng và kỷ luật (tự động đồng bộ từ Quyết định nhân sự)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={fetchHistory}
            className="btn btn-outline"
            style={{ padding: '0.6rem', height: '38px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => navigate('/internal/employees/decisions/create')}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.15rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Tạo Quyết Định Biến Động
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '360px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo tên nhân sự, mã NV, chức vụ, số QĐ..." 
              className="form-input"
              style={{ paddingLeft: '2.5rem', height: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả biến động' },
              { id: 'PROMOTION', label: 'Bổ nhiệm' },
              { id: 'TRANSFER', label: 'Điều chuyển' },
              { id: 'SALARY', label: 'Điều chỉnh lương' },
              { id: 'REWARD', label: 'Khen thưởng' },
              { id: 'DISCIPLINE', label: 'Kỷ luật' },
              { id: 'TERMINATION', label: 'Thôi việc' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: typeFilter === tab.id ? 700 : 500,
                  border: typeFilter === tab.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: typeFilter === tab.id ? '#eff6ff' : '#ffffff',
                  color: typeFilter === tab.id ? '#2563eb' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '220px' }}>Nhân Viên</th>
                <th style={{ width: '180px' }}>Chức Vụ Đảm Nhiệm</th>
                <th style={{ width: '180px' }}>Phòng Ban Công Tác</th>
                <th>Nội Dung & Căn Cứ Biến Động</th>
                <th style={{ width: '130px' }}>Ngày Hiệu Lực</th>
                <th style={{ width: '140px' }}>Mức Thu Nhập</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">Đang tải lịch sử công tác...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">Chưa có bản ghi quá trình công tác nào phù hợp.</td>
                </tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                          {emp.employee?.fullName?.charAt(0) || 'N'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Link 
                            to={`/internal/employees/profiles/${emp.employeeId}`}
                            style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}
                          >
                            {emp.employee?.fullName || '—'}
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {emp.employee?.code || 'Chưa có mã'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>
                        <Briefcase size={14} color="#64748b" />
                        <span>{emp.position?.title || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                        {emp.department?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <div>
                        {getReasonBadge(emp.changeReason)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.825rem', color: '#64748b' }}>
                        <Calendar size={13} />
                        {new Date(emp.effectiveDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {emp.salary ? (
                          <span style={{ color: '#16a34a' }}>{Number(emp.salary).toLocaleString('vi-VN')} đ</span>
                        ) : (
                          <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.78rem' }}>Theo HĐLĐ</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
