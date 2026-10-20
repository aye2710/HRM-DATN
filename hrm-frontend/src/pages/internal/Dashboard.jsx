import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CalendarClock, 
  Receipt, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import axios from 'axios';

export const InternalDashboard = () => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    estimatedPayroll: '0'
  });
  const [newEmployees, setNewEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, empRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/employees')
      ]);
      setStatsData(statsRes.data);

      // Sắp xếp nhân sự theo ngày tiếp nhận mới nhất
      const sortedEmp = (empRes.data || []).sort(
        (a, b) => new Date(b.joinDate || b.createdAt || 0).getTime() - new Date(a.joinDate || a.createdAt || 0).getTime()
      );
      setNewEmployees(sortedEmp.slice(0, 5));
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bàn làm việc:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header Bàn Làm Việc: Điềm đạm, tập trung tác vụ */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0F766E' }} />
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Bàn làm việc Quản trị Nhân sự
            </h1>
          </div>
          <p style={{ margin: '0.25rem 0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Theo dõi ngoại lệ chấm công, duyệt hồ sơ nghỉ phép và tiến độ chi trả tiền lương.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              Cập nhật lúc {lastUpdated}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ 
              padding: '0.35rem 0.65rem', 
              fontSize: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem',
              backgroundColor: '#FFFFFF',
              borderColor: 'var(--border)'
            }}
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Layout Phân tầng Bất đối xứng: Vùng Tác vụ Khẩn (60%) vs Vùng Chỉ số Vận hành (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* VÙNG 1: TÁC VỤ CẤP THIẾT CẦN XỬ LÝ (Action Center - Chỗ tiêu sự táo bạo duy nhất) */}
        <div 
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '0.5rem', 
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderBottom: '1px solid var(--border)', 
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color="#B45309" />
              <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Tác vụ cần hành động ngay
              </h2>
            </div>
            <span 
              style={{ 
                fontSize: '0.6875rem', 
                fontWeight: 600, 
                padding: '0.15rem 0.5rem', 
                borderRadius: '0.25rem',
                backgroundColor: Number(statsData.pendingLeaves) > 0 ? '#FEF3C7' : '#F1F5F9',
                color: Number(statsData.pendingLeaves) > 0 ? '#B45309' : '#64748B'
              }}
            >
              {Number(statsData.pendingLeaves) > 0 ? `${statsData.pendingLeaves} việc đang nghẽn` : 'Không có việc nghẽn'}
            </span>
          </div>

          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Tác vụ 1: Phê duyệt Nghỉ phép */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid',
                borderColor: Number(statsData.pendingLeaves) > 0 ? '#FDE68A' : '#E2E8F0',
                backgroundColor: Number(statsData.pendingLeaves) > 0 ? '#FFFBEB' : '#FAFAFA'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CalendarClock size={18} color="#D97706" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400E' }}>
                    Phê duyệt đơn nghỉ phép tồn đọng
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.15rem' }}>
                    {loading ? (
                      'Đang kiểm tra số lượng đơn...'
                    ) : Number(statsData.pendingLeaves) > 0 ? (
                      <>Hiện có <strong>{statsData.pendingLeaves}</strong> đơn xin phép đang chờ phê duyệt trước giờ khóa ca.</>
                    ) : (
                      'Tất cả đơn nghỉ phép của nhân sự đã được giải quyết.'
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/leaves')}
                className="btn"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: Number(statsData.pendingLeaves) > 0 ? '#0F766E' : '#FFFFFF',
                  color: Number(statsData.pendingLeaves) > 0 ? '#FFFFFF' : '#475569',
                  border: Number(statsData.pendingLeaves) > 0 ? 'none' : '1px solid #CBD5E1',
                  borderRadius: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Xem và duyệt</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Tác vụ 2: Kỳ lương và quyết toán */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <Receipt size={18} color="#2563EB" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Kỳ chi trả lương Tháng {currentMonth}/2026
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Dự toán ngân sách: <strong style={{ color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>{statsData.estimatedPayroll || '0'} đ</strong>. Hạn chốt bảng công ngày 05 hàng tháng.
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/payroll')}
                className="btn btn-outline"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#FFFFFF',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                  borderRadius: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Rà soát bảng lương</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* VÙNG 2: CHỈ SỐ VẬN HÀNH TINH GỌN (Compact KPI Panel - Tĩnh lặng, chuẩn Tabular) */}
        <div 
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '0.5rem', 
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderBottom: '1px solid var(--border)', 
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Chỉ số nhân sự chính
            </h2>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Thời gian thực</span>
          </div>

          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Chỉ số 1: Tổng nhân sự */}
            <div 
              onClick={() => navigate('/employees')} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.4rem 0',
                borderBottom: '1px dashed #F1F5F9',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} color="#475569" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tổng số nhân viên</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                {loading ? '...' : `${statsData.totalEmployees} người`}
              </div>
            </div>

            {/* Chỉ số 2: Tuyển dụng */}
            <div 
              onClick={() => navigate('/job-postings')}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.4rem 0',
                borderBottom: '1px dashed #F1F5F9',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={15} color="#475569" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Vị trí đang mở tuyển</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F766E', fontVariantNumeric: 'tabular-nums' }}>
                {loading ? '...' : '4 vị trí'}
              </div>
            </div>

            {/* Chỉ số 3: Tỷ lệ tuân thủ chấm công */}
            <div 
              onClick={() => navigate('/attendance')}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.4rem 0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#16A34A" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tỷ lệ đi làm hôm nay</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
                {loading ? '...' : '98.5%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU DÀY: NHÂN SỰ MỚI TIẾP NHẬN (High Density Data Table) */}
      <div 
        style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: '0.5rem', 
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ 
            padding: '0.75rem 1rem', 
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Nhân sự mới tiếp nhận vào hệ thống
            </h2>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Danh sách 5 nhân sự có ngày bắt đầu làm việc gần nhất cần theo dõi hội nhập.
            </p>
          </div>

          <button
            onClick={() => navigate('/employees')}
            className="btn btn-outline"
            style={{ 
              padding: '0.3rem 0.65rem', 
              fontSize: '0.75rem', 
              backgroundColor: '#FFFFFF',
              borderColor: 'var(--border)' 
            }}
          >
            Xem tất cả hồ sơ ({statsData.totalEmployees})
          </button>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', width: '110px' }}>
                  Mã NV
                </th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Họ và tên
                </th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Phòng ban
                </th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Chức vụ
                </th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Ngày tiếp nhận
                </th>
                <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', width: '130px' }}>
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Loader khi nạp dữ liệu
                [1, 2, 3].map((idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}><div style={{ height: 14, width: 60, backgroundColor: '#E2E8F0', borderRadius: 3 }} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}><div style={{ height: 14, width: 140, backgroundColor: '#E2E8F0', borderRadius: 3 }} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}><div style={{ height: 14, width: 100, backgroundColor: '#E2E8F0', borderRadius: 3 }} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}><div style={{ height: 14, width: 90, backgroundColor: '#E2E8F0', borderRadius: 3 }} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}><div style={{ height: 14, width: 80, backgroundColor: '#E2E8F0', borderRadius: 3 }} /></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}><div style={{ height: 18, width: 70, backgroundColor: '#E2E8F0', borderRadius: 3, marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : newEmployees.length === 0 ? (
                // Empty state định hướng rõ ràng
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Chưa có nhân sự mới nào trong tháng</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Các nhân sự tiếp nhận qua quy trình Tuyển dụng hoặc Onboarding sẽ tự động xuất hiện tại đây.
                    </div>
                  </td>
                </tr>
              ) : (
                newEmployees.map((emp) => {
                  const joinDateFormatted = emp.joinDate
                    ? new Date(emp.joinDate).toLocaleDateString('vi-VN')
                    : 'Chưa xác định';
                  
                  return (
                    <tr 
                      key={emp.id} 
                      onClick={() => navigate('/employees')}
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {emp.code || 'NV----'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {emp.fullName}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={13} color="#64748B" />
                          {emp.department?.name || 'Chưa phân bổ'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                        {emp.position?.title || 'Chuyên viên'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="#64748B" />
                          {joinDateFormatted}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <span 
                          style={{ 
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            backgroundColor: emp.status === 'ACTIVE' ? '#DCFCE7' : '#EFF6FF',
                            color: emp.status === 'ACTIVE' ? '#15803D' : '#1D4ED8',
                            border: `1px solid ${emp.status === 'ACTIVE' ? '#BBF7D0' : '#BFDBFE'}`
                          }}
                        >
                          {emp.status === 'ACTIVE' ? 'Đang làm việc' : emp.status === 'ONBOARDING' ? 'Đang thử việc' : emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


