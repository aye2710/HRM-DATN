import React, { useState, useEffect } from 'react';
import { UserMinus, Search, Filter, MessageSquare, Briefcase, Printer, X, ShieldAlert, CheckCircle, FileText, Lock } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export const Terminations = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBm02Employee, setSelectedBm02Employee] = useState(null);

  const fetchEmployees = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/employees')
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRunSecurityCheck = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/employees/cron/auto-lock-resigned');
      toast.success(res.data.message || 'Đã kiểm tra an ninh SOP-26 thành công!');
      fetchEmployees();
    } catch (err) {
      toast.error('Lỗi khi chạy kiểm tra an ninh SOP-26');
    }
  };

  const handleTerminate = async (id, name) => {
    const today = new Date().toISOString().split('T')[0];
    const { value: formValues } = await Swal.fire({
      title: 'Thanh lý hợp đồng thôi việc (SOP-26)',
      html: `
        <div style="text-align: left; font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <p style="margin: 0; color: #475569;">
            Bạn đang làm thủ tục thôi việc cho nhân sự: <strong style="color: #0F172A;">${name}</strong>
          </p>
          <div style="background-color: #FEF2F2; border: 1px solid #FECACA; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; color: #991B1B;">
            ⚠️ <strong>Quy trình SOP-26:</strong> Bắt buộc hoàn tất thu hồi trang thiết bị theo mẫu BM-02. Đúng <strong>18:00</strong> ngày làm việc cuối, hệ thống sẽ tự động khóa tài khoản đăng nhập và thu hồi toàn bộ token truy cập.
          </div>
          <div>
            <label style="font-weight: 600; display: block; margin-bottom: 4px; color: #334155;">Ngày làm việc cuối cùng:</label>
            <input id="swal-last-date" type="date" class="swal2-input" value="${today}" style="width: 100%; margin: 0; height: 38px; font-size: 0.875rem;">
          </div>
          <div>
            <label style="font-weight: 600; display: block; margin-bottom: 4px; color: #334155;">Lý do thôi việc (Mẫu F03):</label>
            <select id="swal-reason" class="swal2-input" style="width: 100%; margin: 0; height: 38px; font-size: 0.875rem;">
              <option value="Thỏa thuận chấm dứt hợp đồng lao động (SOP-26)">Thỏa thuận chấm dứt hợp đồng lao động</option>
              <option value="Hết hạn hợp đồng lao động không tái ký">Hết hạn hợp đồng lao động không tái ký</option>
              <option value="Người lao động đơn phương xin nghỉ theo quy định">Người lao động đơn phương xin nghỉ</option>
              <option value="Chuyển đổi định hướng cá nhân">Chuyển đổi định hướng cá nhân</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Xác nhận Báo giảm & Khóa an ninh',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#EF4444',
      preConfirm: () => {
        const lastWorkingDate = document.getElementById('swal-last-date').value;
        const terminationReason = document.getElementById('swal-reason').value;
        if (!lastWorkingDate) {
          Swal.showValidationMessage('Vui lòng chọn ngày làm việc cuối cùng');
          return false;
        }
        return { lastWorkingDate, terminationReason };
      }
    });

    if (!formValues) return;

    axios.post(`http://localhost:5000/api/employees/${id}/terminate`, formValues)
      .then(res => {
        toast.success(res.data.message || 'Đã hoàn tất thủ tục thôi việc thành công!');
        fetchEmployees();
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Lỗi khi thanh lý nghỉ việc');
      });
  };

  const resignedEmployees = employees.filter(e => e.status === 'RESIGNED');
  const activeEmployees = employees.filter(e => e.status !== 'RESIGNED');
  
  const filteredResigned = resignedEmployees.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserMinus size={24} /> Nghỉ việc & Quyết toán
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
              MẪU F03 - LLA (SOP-26)
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Quy trình SOP-26: Quản lý hồ sơ thôi việc, thu hồi tài sản theo biên bản BM-02 và tự động khóa tài khoản lúc 18:00
          </p>
        </div>

        <button
          onClick={handleRunSecurityCheck}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', borderColor: '#FECACA', color: '#DC2626', backgroundColor: '#FEF2F2' }}
          title="Rà soát và tự động khóa mọi tài khoản nhân sự nghỉ việc đúng 18:00 theo quy định SOP-26"
        >
          <ShieldAlert size={16} /> Kiểm tra khóa tài khoản 18:00 (SOP-26)
        </button>
      </div>

      {/* Danh sách đã nghỉ việc */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Lịch sử Nhân sự đã nghỉ</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân sự..." 
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ margin: '0 1.5rem 1.5rem 1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Nhân viên</th>
                <th>Phòng ban cũ</th>
                <th>Vị trí cũ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Bàn giao</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</td></tr>
              ) : filteredResigned.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có nhân sự nào nghỉ việc</td></tr>
              ) : (
                filteredResigned.map(emp => (
                  <tr key={emp.id} style={{ opacity: 0.8 }}>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{emp.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{emp.fullName}</span>
                      </div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.position?.title || '—'}</td>
                    <td>
                      <span className="badge badge-error">Đã nghỉ việc</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedBm02Employee(emp)}
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', borderColor: '#38bdf8' }}
                        title="Xem và in Biên bản thu hồi tài sản BM-02 (SOP-26)"
                      >
                        <Printer size={13} /> In BM-02
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danh sách Active để thao tác Nghỉ việc */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>Khởi tạo Yêu cầu Nghỉ việc</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Chọn nhân sự đang làm việc để tiến hành thủ tục thanh lý hợp đồng</p>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.slice(0, 5).map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: '600' }}>{emp.fullName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.code}</span>
                    </div>
                  </td>
                  <td>{emp.department?.name || '—'}</td>
                  <td><span className="badge badge-success">Đang làm việc</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleTerminate(emp.id, emp.fullName)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Báo giảm & Nghỉ việc
                    </button>
                  </td>
                </tr>
              ))}
              {activeEmployees.length > 5 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Hiển thị 5 nhân sự mới nhất. Vui lòng dùng thanh tìm kiếm để tìm nhân sự khác.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XUẤT BIÊN BẢN THU HỒI TÀI SẢN BM-02 (SOP-26) */}
      {selectedBm02Employee && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card flex-col gap-4 animate-scale-up" style={{
            width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto',
            background: '#ffffff', color: '#1e293b', padding: '2.5rem'
          }}>
            {/* Action Bar (Top) */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Hệ thống Quản Trị Nhân Sự Doanh Nghiệp • Biểu mẫu chuẩn BM-02 (SOP-26)
              </span>
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary" 
                  style={{ gap: 6, padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> In Biên bản BM-02
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#64748b', borderColor: '#cbd5e1' }}
                  onClick={() => setSelectedBm02Employee(null)}
                >
                  <X size={16} /> Đóng
                </button>
              </div>
            </div>

            {/* Official Form Header */}
            <div className="text-center my-2">
              <div className="text-xs uppercase font-bold text-gray-500 tracking-widest">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-xs font-semibold text-gray-600">Độc lập - Tự do - Hạnh phúc</div>
              <div className="my-2 border-b border-gray-300 w-32 mx-auto"></div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900 mt-4">
                BIÊN BẢN THU HỒI & HOÀN TRẢ TRANG THIẾT BỊ
              </h2>
              <div className="text-xs italic text-gray-500 font-mono mt-1">
                (Mẫu BM-02 ban hành theo Quy trình Thôi việc SOP-26 / Mẫu F03 - LLA)
              </div>
            </div>

            {/* Form Intro */}
            <div className="text-sm text-gray-700 leading-relaxed my-2">
              Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại Trụ sở Công ty Cổ phần Công nghệ LLA, các bên tiến hành lập biên bản xác nhận thu hồi thiết bị làm việc:
            </div>

            {/* Parties info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div className="flex-col gap-1 text-xs">
                <strong className="text-gray-900 uppercase">BÊN TIẾP NHẬN THU HỒI (IT / HÀNH CHÍNH):</strong>
                <div>Đại diện: <strong>Bộ phận Quản trị Thiết bị CNTT & An ninh</strong></div>
                <div>Khối Vận hành Doanh nghiệp LLA</div>
              </div>
              <div className="flex-col gap-1 text-xs">
                <strong className="text-gray-900 uppercase">BÊN BÀN GIAO THÔI VIỆC (NGƯỜI LAO ĐỘNG):</strong>
                <div>Họ và tên: <strong className="text-blue-700">{selectedBm02Employee.fullName}</strong></div>
                <div>Mã nhân viên: <strong>{selectedBm02Employee.code}</strong></div>
                <div>Phòng ban: <strong>{selectedBm02Employee.department?.name || 'Văn phòng'}</strong></div>
              </div>
            </div>

            {/* Confirmation Table */}
            <div className="my-3">
              <strong className="text-xs font-bold text-gray-800 uppercase block mb-2">CHI TIẾT KIỂM KÊ THIẾT BỊ VÀ TÀI SẢN HOÀN TRẢ:</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>STT</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Danh mục thiết bị</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Mã tài sản</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Tình trạng khi hoàn trả</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Xác nhận IT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>01</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>Laptop làm việc & Bộ sạc chính hãng</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>LT-LLA-042</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#059669' }}>Nguyên tem, hoạt động bình thường</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>Đã thu đủ</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>02</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>Thẻ từ ra vào tòa nhà & Khóa tủ cá nhân</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>CARD-SEC-015</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#059669' }}>Nguyên vẹn, không hư hỏng</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>Đã thu đủ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legal Confirmation Box */}
            <div className="text-xs text-gray-600 leading-relaxed bg-blue-50 p-3 rounded border border-blue-200">
              <strong>Quy chế An ninh Dữ liệu & Quyết toán Lương (SOP-26):</strong>
              <ul className="list-disc ml-5 mt-1">
                <li>Bộ phận IT xác nhận nhân sự đã sao lưu bàn giao tài liệu công vụ, xóa các quyền truy cập VPN và tài khoản máy chủ.</li>
                <li>Đúng 18:00 ngày làm việc cuối cùng, hệ thống tự động khóa tài khoản đăng nhập ESS.</li>
                <li>Nhân viên đã hoàn tất nghĩa vụ tài sản, đủ điều kiện để Kế toán thanh lý hợp đồng và quyết toán trợ cấp thôi việc.</li>
              </ul>
            </div>

            {/* Signature Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '2rem', textAlign: 'center' }}>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">NGƯỜI BÀN GIAO</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-blue-700">{selectedBm02Employee.fullName}</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">ĐẠI DIỆN TIẾP NHẬN (IT/HC)</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-semibold text-xs text-gray-700">Bộ phận CNTT LLA</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase text-gray-800">DUYỆT NHÂN SỰ (HR)</div>
                <div className="text-xs italic text-gray-500 mb-16">(Ký xác nhận quyết toán)</div>
                <div className="font-semibold text-xs text-emerald-700">Phòng Nhân Sự LLA</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
