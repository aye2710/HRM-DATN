import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserMinus, Search, Filter, ChevronsLeft, ChevronLeft, 
  ChevronRight, ChevronsRight, CheckCircle2, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { InitiateOffboardingModal } from './OffboardingModals';

export const OffboardingInitiate = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal
  const [showInitiateModal, setShowInitiateModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/departments')
      ]);
      setAllEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (error) {
      console.error('Error fetching employees for initiate:', error);
      toast.error('Lỗi khi tải danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Active Employees
  const filteredActiveEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      if (emp.status === 'RESIGNED') return false; // Hide already resigned
      const matchSearch = !searchTerm || 
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm);
      const matchDept = !deptFilter || emp.departmentId === deptFilter;
      return matchSearch && matchDept;
    });
  }, [allEmployees, searchTerm, deptFilter]);

  const totalPages = Math.ceil(filteredActiveEmployees.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredActiveEmployees.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
              <UserMinus size={26} color="#dc2626" /> Khởi tạo Thôi việc & Tiếp nhận Đơn xin nghỉ
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
              TIẾP NHẬN BÁO GIẢM
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Chọn nhân sự nộp đơn xin thôi việc hoặc thỏa thuận chấm dứt hợp đồng để khởi tạo quy trình bàn giao 4 giai đoạn
          </p>
        </div>

        <div>
          <button
            onClick={() => navigate('/internal/offboarding/checklist')}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            Xem Tiến độ Checklist Bàn giao <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 2. Banner Quy trình chuẩn */}
      <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ color: '#ea580c', marginTop: '2px' }}>
          <CheckCircle2 size={20} />
        </div>
        <div style={{ fontSize: '0.84rem', color: '#9a3412', lineHeight: 1.5 }}>
          <strong>Lưu ý nghiệp vụ Tiếp nhận Thôi việc:</strong>
          <div>
            1. Khi chọn nhân viên và nhập Ngày làm việc cuối cùng, hệ thống sẽ tự động gán bộ <strong>Checklist Bàn giao chuẩn 4 giai đoạn</strong>.<br/>
            2. Tài khoản của nhân sự sẽ tiếp tục hoạt động cho đến hết <strong>Ngày làm việc cuối cùng</strong> hoặc khi HR thực hiện Chốt thôi việc.<br/>
            3. Nếu nhân viên còn nắm giữ tài sản công ty (Laptop, Thẻ từ...), hệ thống sẽ yêu cầu hoàn tất thu hồi trước khi cho phép chốt hồ sơ thôi việc.
          </div>
        </div>
      </div>

      {/* 3. Bảng Nhân sự đang công tác để chọn khởi tạo */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Bộ lọc */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Tìm nhân sự theo họ tên, mã NV, số điện thoại..." 
                className="form-input"
                style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '220px', fontSize: '0.85rem' }}
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">-- Tất cả phòng ban --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Tìm thấy <strong style={{ color: '#0f172a' }}>{filteredActiveEmployees.length}</strong> nhân sự đang công tác
          </div>
        </div>

        {/* Table */}
        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table style={{ minWidth: '950px' }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ và tên</th>
                <th>Phòng ban</th>
                <th>Vị trí</th>
                <th>Loại hợp đồng</th>
                <th>Trạng thái hiện tại</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang nạp danh sách nhân sự...</td></tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Không tìm thấy nhân viên phù hợp</td></tr>
              ) : (
                paginatedEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.code}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email || '—'}</div>
                    </td>
                    <td>{emp.department?.name || 'Chưa gán'}</td>
                    <td>{emp.position?.title || 'Chưa có chức danh'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {emp.contracts?.[0]?.contractType === 'OFFICIAL' ? 'HĐ Lao động chính thức' : (emp.contracts?.[0]?.contractType || 'Thử việc')}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        {emp.status === 'ACTIVE' ? 'Đang làm việc' : emp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/internal/employees/decisions/create?type=TERMINATION&employeeId=${emp.id}`)}
                        className="btn btn-outline"
                        style={{ height: 28, width: 28, padding: 0, color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Soạn thảo Quyết định thôi việc & Kích hoạt bàn giao"
                      >
                        <UserMinus size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {filteredActiveEmployees.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredActiveEmployees.length)} trong {filteredActiveEmployees.length} nhân viên
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} style={{ padding: '3px 8px' }}><ChevronsLeft size={14} /></button>
              <button className="btn btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={{ padding: '3px 8px' }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: '0.8rem', padding: '0 8px', display: 'flex', alignItems: 'center' }}>Trang {currentPage} / {totalPages}</span>
              <button className="btn btn-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} style={{ padding: '3px 8px' }}><ChevronRight size={14} /></button>
              <button className="btn btn-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: '3px 8px' }}><ChevronsRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Khởi tạo */}
      {showInitiateModal && (
        <InitiateOffboardingModal
          employee={showInitiateModal}
          onClose={() => setShowInitiateModal(null)}
          onSuccess={() => {
            navigate('/internal/offboarding/checklist');
          }}
        />
      )}

    </div>
  );
};
