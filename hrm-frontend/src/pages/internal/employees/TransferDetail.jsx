import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileSignature, Briefcase, Building, Calendar, DollarSign, 
  ChevronRight, AlertCircle, History, User, CheckCircle2, Clock, 
  ArrowRight, ShieldCheck, FileText, ExternalLink, RefreshCw, Layers
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const TransferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/employees/${id}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Error fetching employee detail for transfer history:', error);
      toast.error('Không tìm thấy thông tin nhân viên hoặc hồ sơ điều chuyển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tính lương hiện tại từ hợp đồng ACTIVE hoặc contract mới nhất hoặc employee.salary
  const activeContract = useMemo(() => {
    if (!employee?.contracts || employee.contracts.length === 0) return null;
    return employee.contracts.find(c => c.status === 'ACTIVE') || employee.contracts[0];
  }, [employee]);

  const currentSalary = activeContract?.baseSalary || employee?.salary || 0;

  // Lấy danh sách lịch sử công tác & quyết định liên quan
  const mobilityRecords = useMemo(() => {
    if (!employee) return [];

    const histories = (employee.employmentHistories || []).map(h => ({
      id: h.id,
      date: new Date(h.effectiveDate),
      type: 'HISTORY',
      changeReason: h.changeReason,
      department: h.department?.name,
      position: h.position?.title,
      salary: h.salary,
      raw: h
    }));

    // Bổ sung các quyết định có liên quan (TRANSFER, PROMOTION, SALARY_ADJUSTMENT)
    const decisions = (employee.decisions || []).filter(d => 
      ['TRANSFER', 'PROMOTION', 'SALARY_ADJUSTMENT'].includes(d.type)
    ).map(d => ({
      id: d.id,
      date: new Date(d.effectiveDate || d.createdAt),
      type: 'DECISION',
      decisionNumber: d.decisionNumber,
      decisionTitle: d.title,
      decisionType: d.type,
      decisionStatus: d.status,
      oldDepartment: employee.department?.name,
      newDepartment: d.newDepartment?.name,
      oldPosition: employee.position?.title,
      newPosition: d.newPosition?.title,
      oldSalary: d.oldSalary,
      newSalary: d.newSalary,
      reason: d.reason,
      raw: d
    }));

    // Gộp và sắp xếp theo ngày hiệu lực giảm dần (mới nhất lên đầu)
    return { histories, decisions };
  }, [employee]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
        Đang tải hồ sơ và lịch sử điều chuyển của nhân sự...
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 0.5rem auto' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Không tìm thấy nhân sự</h3>
        <button onClick={() => navigate('/internal/employees/transfers')} className="btn btn-primary">
          <ArrowLeft size={16} /> Quay lại danh sách điều chuyển
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. Header Bar with Breadcrumb and Main Action */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button 
            onClick={() => navigate('/internal/employees/transfers')}
            className="btn btn-outline"
            style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px', height: '38px', borderRadius: '8px' }}
            title="Quay lại danh sách điều chuyển"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
              <Link to="/internal/employees/transfers" style={{ color: '#64748b', textDecoration: 'none' }}>Điều chuyển</Link>
              <ChevronRight size={13} />
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{employee.fullName} ({employee.code})</span>
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Lịch sử Điều chuyển & Biến động Công tác</span>
              <span className={`badge ${employee.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                {employee.status === 'ACTIVE' ? 'Chính thức' : employee.status}
              </span>
            </h1>
          </div>
        </div>

        {/* NÚT LẬP QUYẾT ĐỊNH ĐIỀU CHUYỂN NỔI BẬT */}
        <button 
          onClick={() => navigate(`/internal/employees/decisions/create?type=TRANSFER&employeeId=${employee.id}`)}
          className="btn btn-primary"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.6rem 1.25rem', 
            fontSize: '0.88rem', 
            fontWeight: 700,
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
          title="Tạo Quyết định Điều chuyển chính thức cho nhân sự này trình Ban Giám Đốc"
        >
          <FileSignature size={18} /> Lập Quyết định Điều chuyển
        </button>
      </div>

      {/* 2. Employee Profile & Current Salary Card */}
      <div className="card glass" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Avatar and Basic Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px' }}>
            <div 
              className="avatar" 
              style={{ 
                width: '54px', 
                height: '54px', 
                borderRadius: '12px', 
                backgroundColor: '#eff6ff', 
                color: '#2563eb', 
                fontWeight: 800,
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #bfdbfe'
              }}
            >
              {employee.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {employee.fullName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{employee.code}</span>
                <span>•</span>
                <span>{employee.email || 'Chưa cập nhật email'}</span>
                <span>•</span>
                <span>{employee.phone || 'Chưa có SĐT'}</span>
              </div>
            </div>
          </div>

          {/* 4 Mini Stat Boxes: Đơn vị, Chức vụ, Mức lương ban đầu/hiện tại, Thâm niên */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: '1rem', 
            flex: 1, 
            maxWidth: '750px' 
          }}>
            {/* Đơn vị hiện tại */}
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={12} /> Đơn vị hiện tại
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginTop: '3px' }}>
                {employee.department?.name || <span style={{ color: '#94a3b8' }}>Chưa phân bổ</span>}
              </div>
            </div>

            {/* Chức vụ hiện tại */}
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} /> Vị trí / Chức danh
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginTop: '3px' }}>
                {employee.position?.title || <span style={{ color: '#94a3b8' }}>Chưa có chức vụ</span>}
              </div>
            </div>

            {/* Mức lương ban đầu / Hiện tại theo HĐ */}
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.72rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={12} /> Lương hợp đồng hiện tại
              </div>
              <div style={{ fontWeight: 800, color: '#047857', fontSize: '1rem', marginTop: '3px' }}>
                {formatCurrency(currentSalary)}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#15803d', marginTop: '1px' }}>
                (Theo HĐLĐ đang hiệu lực)
              </div>
            </div>

            {/* Ngày gia nhập & Số lần điều chuyển */}
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Ngày vào làm
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginTop: '3px' }}>
                {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('vi-VN') : '—'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                {mobilityRecords.histories.length} mốc ghi nhận
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Section: Lịch sử Điều chuyển & Biến động Công tác của nhân viên */}
      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid var(--border)', 
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--primary)" /> Sổ Theo dõi Lịch sử Điều chuyển & Biến động Công tác
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Ghi nhận toàn bộ các đợt chuyển phòng ban, chuyển ngạch chức vụ (VD: BA ➔ Dev), điều chỉnh lương và các Quyết định pháp lý liên quan
            </p>
          </div>

          <button
            onClick={() => navigate(`/internal/employees/decisions/create?type=TRANSFER&employeeId=${employee.id}`)}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FileSignature size={14} /> Lập QĐ Điều chuyển mới
          </button>
        </div>

        {/* Timeline View of Employment History */}
        {mobilityRecords.histories.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            <Layers size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontWeight: 700 }}>Chưa phát sinh biến động công tác</h4>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem' }}>
              Nhân sự <strong>{employee.fullName}</strong> hiện vẫn đang công tác tại phòng ban và chức danh ban đầu kể từ ngày gia nhập.
            </p>
            <button 
              onClick={() => navigate(`/internal/employees/decisions/create?type=TRANSFER&employeeId=${employee.id}`)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSignature size={16} /> Lập Quyết định Điều chuyển đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ position: 'relative', borderLeft: '2px solid #e2e8f0', marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '1.5rem' }}>
              {mobilityRecords.histories.map((hist, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={hist.id} style={{ position: 'relative' }}>
                    
                    {/* Timeline Node Dot */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-2rem', 
                      top: '4px', 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      backgroundColor: isLatest ? 'var(--primary)' : '#94a3b8', 
                      border: '3px solid #ffffff',
                      boxShadow: '0 0 0 2px rgba(37,99,235,0.2)'
                    }} />

                    {/* Timeline Content Card */}
                    <div style={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '10px', 
                      border: isLatest ? '1px solid #bfdbfe' : '1px solid #e2e8f0', 
                      padding: '1.15rem 1.25rem',
                      boxShadow: isLatest ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                    }}>
                      {/* Card Header: Ngày hiệu lực & Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ 
                            fontSize: '0.82rem', 
                            fontWeight: 700, 
                            color: isLatest ? 'var(--primary)' : '#334155',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px' 
                          }}>
                            <Calendar size={14} />
                            Ngày hiệu lực: {new Date(hist.raw.effectiveDate).toLocaleDateString('vi-VN')}
                          </span>

                          {isLatest && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '1px 8px', borderRadius: '99px', fontWeight: 700 }}>
                              Hiện tại
                            </span>
                          )}
                        </div>

                        <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          {hist.raw.changeReason?.includes('Transfer') ? 'Điều chuyển công tác' : 
                           hist.raw.changeReason?.includes('PROMOTION') || hist.raw.changeReason?.includes('Bổ nhiệm') ? 'Bổ nhiệm chức vụ' : 
                           hist.raw.changeReason?.includes('Lương') || hist.raw.changeReason?.includes('SALARY') ? 'Điều chỉnh lương' : 
                           'Biến động nhân sự'}
                        </span>
                      </div>

                      {/* Thông tin Đơn vị & Vị trí & Lương */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                        gap: '0.75rem',
                        backgroundColor: '#f8fafc',
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Đơn vị / Phòng ban ghi nhận:</div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Building size={14} color="#64748b" />
                            {hist.raw.department?.name || 'Không xác định'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Vị trí / Chức danh đảm nhiệm:</div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Briefcase size={14} color="#64748b" />
                            {hist.raw.position?.title || 'Không xác định'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Mức lương áp dụng:</div>
                          <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <DollarSign size={14} color="#047857" />
                            {hist.raw.salary ? formatCurrency(hist.raw.salary) : 'Giữ nguyên theo HĐ'}
                          </div>
                        </div>
                      </div>

                      {/* Lý do & Căn cứ chi tiết */}
                      <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                        <strong>Căn cứ / Lý do:</strong> {hist.raw.changeReason || 'Điều chuyển theo nhu cầu công tác'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Section: Danh sách Quyết định Hành chính đã ban hành cho nhân sự này */}
      {mobilityRecords.decisions.length > 0 && (
        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSignature size={18} color="var(--primary)" /> Quyết định Hành chính Liên quan ({mobilityRecords.decisions.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Các văn bản Quyết định điều chuyển, bổ nhiệm hoặc điều chỉnh lương chính thức do Ban Giám Đốc ban hành
            </p>
          </div>

          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Số Quyết định</th>
                  <th>Trích yếu văn bản</th>
                  <th>Loại QĐ</th>
                  <th>Ngày hiệu lực</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {mobilityRecords.decisions.map(dec => (
                  <tr key={dec.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {dec.decisionNumber}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {dec.decisionTitle}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {dec.decisionType === 'TRANSFER' ? 'Điều chuyển' : 
                         dec.decisionType === 'PROMOTION' ? 'Bổ nhiệm' : 'Điều chỉnh lương'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.83rem', color: '#475569' }}>
                      {new Date(dec.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <span className={`badge ${
                        dec.decisionStatus === 'APPROVED' ? 'badge-success' : 
                        dec.decisionStatus === 'PENDING' ? 'badge-warning' : 'badge-danger'
                      }`} style={{ fontSize: '0.72rem' }}>
                        {dec.decisionStatus === 'APPROVED' ? 'Đã ban hành' : 
                         dec.decisionStatus === 'PENDING' ? 'Chờ duyệt' : dec.decisionStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link 
                        to={`/internal/employees/decisions/${dec.id}`}
                        className="btn btn-outline"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        Xem văn bản <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
