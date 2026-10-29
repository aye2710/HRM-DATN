import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Laptop, ChevronRight, CheckCircle2, 
  AlertCircle, Clock, ShieldAlert, UserMinus, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { 
  HandoverDrawerModal, 
  Bm02PrintModal 
} from './OffboardingModals';

export const OffboardingChecklist = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [inProgressList, setInProgressList] = useState([]);
  const [stats, setStats] = useState({ resignedCount: 0, inProgressCount: 0, pendingAssetReturns: 0 });

  // Modal states
  const [selectedHandoverEmp, setSelectedHandoverEmp] = useState(null);
  const [handoverDetail, setHandoverDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showBm02Modal, setShowBm02Modal] = useState(null);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/offboarding/overview');
      setInProgressList(res.data.inProgress || []);
      setStats(res.data.stats || { resignedCount: 0, inProgressCount: 0, pendingAssetReturns: 0 });
    } catch (error) {
      console.error('Error fetching offboarding overview:', error);
      toast.error('Lỗi khi tải dữ liệu tiến độ bàn giao');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const openHandoverDrawer = async (emp) => {
    setSelectedHandoverEmp(emp);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/offboarding/${emp.id}/detail`);
      setHandoverDetail(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải chi tiết bàn giao của nhân sự');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRunSecurityCheck = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/offboarding/trigger-daily-cutoff');
      Swal.fire({
        title: 'Quét An Ninh Hoàn Tất',
        html: `Đã rà soát danh sách nhân sự thôi việc trong ngày.<br/><b>Số tài khoản đã tự động khóa:</b> ${res.data?.lockedCount || 0}`,
        icon: 'success',
        confirmButtonColor: '#b91c1c'
      });
      fetchOverviewData();
    } catch (err) {
      toast.error('Lỗi khi kích hoạt quét an ninh');
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
              <CheckSquare size={26} color="#dc2626" /> Tiến độ Bàn giao & Checklist Thôi việc
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
              QUY TRÌNH BÀN GIAO • BM-02
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Kiểm soát 4 giai đoạn bàn giao: Chuyên môn & Dự án, Thu hồi tài sản BM-02, Hành chính, và Quyết toán phép tồn
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRunSecurityCheck}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', borderColor: '#FECACA', color: '#DC2626', backgroundColor: '#FEF2F2' }}
            title="Rà soát và tự động khóa mọi tài khoản nhân sự đến ngày thôi việc"
          >
            <ShieldAlert size={16} /> Quét an ninh khóa tài khoản
          </button>

          <button
            onClick={() => navigate('/internal/offboarding/initiate')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          >
            <UserMinus size={16} /> + Khởi tạo Thôi việc mới
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ea580c' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Đang tiến hành bàn giao</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stats.inProgressCount} nhân sự</div>
            <div style={{ fontSize: '0.7rem', color: '#ea580c' }}>Đang thực hiện checklist</div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Laptop size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Tài sản đang chờ thu hồi</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>{stats.pendingAssetReturns} thiết bị</div>
            <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>Cần thu hồi trước khi chốt</div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Đã hoàn tất thôi việc</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{stats.resignedCount} hồ sơ</div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Lưu trữ trong Sổ lịch sử</div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Tiêu chuẩn Khóa an ninh</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af' }}>Đúng 18:00</div>
            <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>Tự động khóa token & tài khoản</div>
          </div>
        </div>
      </div>

      {/* 3. Danh sách Nhân viên Đang Bàn giao */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Danh sách Hồ sơ đang xử lý Bàn giao</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cần hoàn tất 100% tài sản & công việc trước khi chuyển sang trạng thái thôi việc chính thức</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '6px' }}>
            {inProgressList.length} hồ sơ đang mở
          </span>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table style={{ minWidth: '950px' }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Ngày nghỉ dự kiến</th>
                <th>Tiến độ Checklist</th>
                <th>Tài sản hoàn trả</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang nạp danh sách bàn giao...</td></tr>
              ) : inProgressList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle2 size={36} color="#16a34a" />
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>Hiện không có hồ sơ bàn giao nào đang tồn đọng!</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Tất cả nhân sự thôi việc đã được bàn giao tài sản và chốt hồ sơ an toàn.</div>
                      <button 
                        onClick={() => navigate('/internal/offboarding/initiate')}
                        className="btn btn-outline"
                        style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        Khởi tạo Hồ sơ Thôi việc mới
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                inProgressList.map(emp => {
                  const tasks = emp.onboardingTasks || [];
                  const doneTasks = tasks.filter(t => t.isCompleted).length;
                  const totalTasks = tasks.length || 8;
                  const percent = Math.round((doneTasks / totalTasks) * 100);
                  const activeAssets = emp.assetAssignments?.filter(a => a.status === 'ASSIGNED') || [];

                  return (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.code}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.position?.title || 'Chuyên viên'}</div>
                      </td>
                      <td>{emp.department?.name || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.85rem' }}>
                          {emp.resignationDate ? new Date(emp.resignationDate).toLocaleDateString('vi-VN') : 'Chưa chốt'}
                        </span>
                      </td>
                      <td style={{ width: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', backgroundColor: percent === 100 ? '#16a34a' : '#ea580c', transition: 'width 0.3s ease' }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: percent === 100 ? '#16a34a' : '#ea580c', minWidth: '35px' }}>
                            {percent}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          Đã xong {doneTasks}/{totalTasks} đầu việc
                        </div>
                      </td>
                      <td>
                        {activeAssets.length > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
                            <AlertCircle size={12} /> Còn giữ {activeAssets.length} thiết bị
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                            <CheckCircle2 size={12} /> Đã thu hồi đủ
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openHandoverDrawer(emp)}
                            className="btn btn-outline"
                            style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', borderColor: '#38bdf8' }}
                            title="Mở Phiếu Bàn giao Checklist thôi việc"
                          >
                            <CheckSquare size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODALS */}
      {selectedHandoverEmp && (
        <HandoverDrawerModal
          employee={selectedHandoverEmp}
          handoverDetail={handoverDetail}
          loadingDetail={loadingDetail}
          onClose={() => setSelectedHandoverEmp(null)}
          onRefresh={() => {
            fetchOverviewData();
            openHandoverDrawer(selectedHandoverEmp);
          }}
          onOpenBm02={(emp) => setShowBm02Modal(emp)}
        />
      )}

      {showBm02Modal && (
        <Bm02PrintModal
          employee={showBm02Modal}
          onClose={() => setShowBm02Modal(null)}
        />
      )}

    </div>
  );
};
