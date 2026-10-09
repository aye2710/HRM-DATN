import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Edit, CheckCircle, Plus, FileText, AlertTriangle } from 'lucide-react';

const InfoField = ({ label, value, type = 'text', isEditMode, onChange, required = false, options = [] }) => {
  const readOnlyStyle = {
    padding: '10px 16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#0f172a',
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center'
  };

  const editStyle = {
    padding: '10px 16px', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    outline: 'none', 
    fontSize: '0.95rem',
    backgroundColor: 'white',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'border-color 0.2s'
  };

  if (type === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {isEditMode ? (
          <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={editStyle}>
            <option value="">-- Chọn --</option>
            {options.map(o => <option key={o.value || o.id} value={o.value || o.id}>{o.label || o.name}</option>)}
          </select>
        ) : (
          <div style={readOnlyStyle}>
            {options.find(o => (o.value || o.id) === value)?.label || options.find(o => (o.value || o.id) === value)?.name || '—'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {isEditMode ? (
        <input 
          type={type} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          style={editStyle}
        />
      ) : (
        <div style={readOnlyStyle}>
          {type === 'date' && value ? new Date(value).toLocaleDateString('vi-VN') : (value || '—')}
        </div>
      )}
    </div>
  );
};

const ProfileHeader = ({ employee, isEditMode, onToggleEdit, onSave, onBack, calculateSeniority }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', borderTop: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)', border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '700', color: '#2563eb', flexShrink: 0 }}>
        {employee.fullName?.split(' ').pop().substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {employee.fullName}
          <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: employee.status === 'ACTIVE' ? '#dcfce7' : '#fef9c3', color: employee.status === 'ACTIVE' ? '#166534' : '#854d0e' }}>
            {employee.status === 'ACTIVE' ? 'Đang làm việc' : employee.status}
          </span>
        </h2>
        <div style={{ fontSize: '0.95rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '600', color: '#3b82f6' }}>{employee.code}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee.position?.title || 'Chưa xếp chức danh'}
            {employee.position?.level && (
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                {employee.position.level}
              </span>
            )}
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{employee.department?.name || 'Chưa xếp phòng ban'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📞 <span style={{ fontWeight: '500', color: '#334155' }}>{employee.phone || '—'}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✉️ <span style={{ fontWeight: '500', color: '#334155' }}>{employee.email || '—'}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: '600', backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '6px' }}>📅 Thâm niên: {calculateSeniority(employee.joinDate)}</span>
        </div>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
        <ArrowLeft size={16} /> Trở về
      </button>
      {!isEditMode ? (
        <button onClick={onToggleEdit} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}>
          <Edit size={16} /> Sửa hồ sơ
        </button>
      ) : (
        <button onClick={onSave} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
          <Save size={16} /> Lưu thay đổi
        </button>
      )}
    </div>
  </div>
);

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('PERSONAL');
  
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/employees/${id}`),
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/positions')
      ]);
      const formattedPositions = (posRes.data || []).map(p => ({
        id: p.id,
        value: p.id,
        label: `${p.title}${p.level ? ` (${p.level})` : ''}`,
        title: p.title,
        level: p.level
      }));
      setEmployee(empRes.data);
      setDepartments(deptRes.data);
      setPositions(formattedPositions);
    } catch (error) {
      toast.error('Không thể tải thông tin');
      navigate('/internal/employees/profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setEmployee({ ...employee, [field]: value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/employees/${id}`, employee);
      toast.success('Đã cập nhật hồ sơ thành công!');
      setIsEditMode(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
    }
  };

  const calculateSeniority = (dateStr) => {
    if (!dateStr) return '0 năm';
    const diff = new Date() - new Date(dateStr);
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    if (years === 0 && months === 0) return 'Mới gia nhập';
    if (years === 0) return `${months} tháng`;
    return `${years} năm ${months} tháng`;
  };

  if (loading || !employee) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu hồ sơ...</div>;

  const tabs = [
    { id: 'PERSONAL', label: 'Cá nhân & Liên hệ' },
    { id: 'WORK', label: 'Thông tin Công tác' },
    { id: 'CONTRACTS', label: 'Hợp đồng & Lương' },
    { id: 'RELATIVES', label: 'Người thân' },
    { id: 'EDUCATION', label: 'Học vấn & Bằng cấp' }
  ];

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <ProfileHeader 
        employee={employee} 
        isEditMode={isEditMode} 
        onToggleEdit={() => setIsEditMode(!isEditMode)} 
        onSave={handleSave}
        onBack={() => navigate('/internal/employees/profiles')}
        calculateSeniority={calculateSeniority}
      />

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Horizontal Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '20px 32px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontWeight: activeTab === tab.id ? '700' : '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#334155'; }}
              onMouseOut={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#64748b'; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: '40px' }}>
          {activeTab === 'PERSONAL' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} color="#3b82f6" /> Hồ sơ nhân thân
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Họ và Tên" value={employee.fullName} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('fullName', v)} required />
                  <InfoField label="Giới tính" value={employee.gender} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('gender', v)} options={[{value:'MALE',label:'Nam'},{value:'FEMALE',label:'Nữ'}]} />
                  <InfoField label="Ngày sinh" value={employee.dateOfBirth} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('dateOfBirth', v)} />
                  <InfoField label="Quốc tịch" value={employee.nationality} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('nationality', v)} />
                  <InfoField label="Tôn giáo / Dân tộc" value={employee.maritalStatus} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('maritalStatus', v)} />
                </div>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '16px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#3b82f6" /> Giấy tờ định danh
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Số CMND / CCCD" value={employee.cccd} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('cccd', v)} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="#f59e0b" /> Thông tin liên hệ
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Điện thoại di động" value={employee.phone} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('phone', v)} />
                  <InfoField label="Email công việc" value={employee.email} type="email" isEditMode={isEditMode} onChange={(v) => handleChange('email', v)} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <InfoField label="Địa chỉ thường trú" value={employee.address} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('address', v)} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '16px 0 0 0' }}>
                  Liên hệ khẩn cấp
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#fff7ed', padding: '24px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                  <InfoField label="Họ tên người liên hệ" value={employee.emergencyContactName} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactName', v)} />
                  <InfoField label="Quan hệ" value={employee.emergencyContactRelation} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactRelation', v)} />
                  <InfoField label="Số điện thoại khẩn cấp" value={employee.emergencyContactPhone} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('emergencyContactPhone', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WORK' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Thông tin công tác hiện tại</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Mã Nhân Viên" value={employee.code} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('code', v)} required />
                  <InfoField label="Công ty / Pháp nhân" value="Công ty TNHH LLA" type="text" isEditMode={false} />
                  <InfoField label="Phòng ban" value={employee.departmentId} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('departmentId', v)} options={departments} />
                  <InfoField label="Vị trí / Chức danh" value={employee.positionId} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('positionId', v)} options={positions} />
                  <InfoField label="Cấp bậc chuyên môn (Level)" value={employee.position?.level || '—'} type="text" isEditMode={false} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Ngày tháng & Trạng thái</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InfoField label="Ngày vào làm" value={employee.joinDate} type="date" isEditMode={isEditMode} onChange={(v) => handleChange('joinDate', v)} required />
                  <InfoField label="Trạng thái làm việc" value={employee.status} type="select" isEditMode={isEditMode} onChange={(v) => handleChange('status', v)} options={[{value:'ONBOARDING',label:'Đang hội nhập'},{value:'ACTIVE',label:'Đang làm việc'},{value:'RESIGNED',label:'Đã nghỉ việc'}]} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CONTRACTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 24px 0' }}>Lương & Thuế / Bảo hiểm</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <InfoField label="Ngân hàng" value={employee.bankName} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('bankName', v)} />
                  <InfoField label="Số tài khoản" value={employee.bankAccount} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('bankAccount', v)} />
                  <InfoField label="Mã số thuế" value={employee.taxCode} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('taxCode', v)} />
                  <InfoField label="Số sổ BHXH" value={employee.socialInsurance} type="text" isEditMode={isEditMode} onChange={(v) => handleChange('socialInsurance', v)} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Danh sách Hợp đồng lao động</h3>
                  <button style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16}/> Thêm hợp đồng
                  </button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Loại Hợp đồng</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Mức lương</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Ngày bắt đầu</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.contracts && employee.contracts.length > 0 ? (
                        employee.contracts.map(c => (
                          <tr key={c.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{c.contractType}</td>
                            <td style={{ padding: '16px', fontWeight: 600, color: '#16a34a' }}>{Number(c.baseSalary).toLocaleString()} đ</td>
                            <td style={{ padding: '16px', color: '#475569' }}>{new Date(c.startDate).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '16px' }}>
                              <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>{c.status}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.95rem' }}>Chưa có hợp đồng nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RELATIVES' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Người thân / Phụ thuộc</h3>
                <button style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16}/> Thêm người thân
                </button>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Họ và tên</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Quan hệ</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Ngày sinh</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Mã số thuế</th>
                      <th style={{ padding: '16px', fontWeight: '600', textAlign: 'center' }}>Phụ thuộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.relatives && employee.relatives.length > 0 ? (
                      employee.relatives.map(r => (
                        <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{r.fullName}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{r.relation}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</td>
                          <td style={{ padding: '16px', color: '#475569', fontFamily: 'monospace' }}>{r.taxCode || '-'}</td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>{r.isDependent ? <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '99px', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: '600' }}>Có</span> : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Chưa có bản ghi người thân.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'EDUCATION' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Bằng cấp & Chứng chỉ</h3>
                <button style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16}/> Thêm bằng cấp
                </button>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Tên Bằng cấp / Chứng chỉ</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Chuyên ngành</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Nơi đào tạo</th>
                      <th style={{ padding: '16px', fontWeight: '600' }}>Năm TN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.degrees && employee.degrees.length > 0 ? (
                      employee.degrees.map(d => (
                        <tr key={d.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{d.degreeName}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{d.major}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{d.institution}</td>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#3b82f6' }}>{d.gradYear || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Chưa có dữ liệu bằng cấp.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
