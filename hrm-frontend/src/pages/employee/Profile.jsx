import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, Building, 
  FileText, Shield, CreditCard, Award, CheckCircle2, Clock, Edit3
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'job' | 'contract' | 'finance'

  const employeeId = localStorage.getItem('employeeId');
  const fullName = localStorage.getItem('fullName') || 'Phạm Hoàng Long';
  const employeeCode = localStorage.getItem('employeeCode') || 'EMP-2026-001';

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/employees/${employeeId}`);
        setEmployee(res.data);
      } catch (error) {
        console.error('Lỗi tải thông tin nhân viên:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [employeeId]);

  // Fallback demo data if DB hasn't populated full profile
  const data = employee || {
    id: employeeId,
    code: employeeCode,
    fullName: fullName,
    email: 'long.ph@lla.vn',
    phone: '0988 123 456',
    gender: 'Nam',
    birthday: '1998-05-15',
    idCard: '001098012345',
    address: 'Số 18, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    department: { name: 'Phòng Phát triển Phần mềm & CNTT' },
    position: { title: 'Kỹ sư Phần mềm Cao cấp (Senior Software Engineer)' },
    joinDate: '2023-03-01',
    status: 'ACTIVE',
    manager: { fullName: 'Trần Văn Quản Lý' },
    bankName: 'Techcombank',
    bankAccount: '19036888888888',
    taxCode: '8549123011',
    insuranceNumber: '7912345678',
    contracts: [
      {
        id: 'HDLD-2024-001',
        contractType: 'INDEFINITE',
        startDate: '2024-03-01',
        endDate: null,
        status: 'ACTIVE'
      }
    ]
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Card với Avatar và Thẻ Nhân Viên */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.85rem',
            fontWeight: 800,
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
          }}>
            {data.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
                {data.fullName}
              </h1>
              <span style={{
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                Chính thức
              </span>
            </div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
              Mã nhân sự: <strong style={{ color: '#2563EB' }}>{data.code || employeeCode}</strong> • {data.position?.title || 'Kỹ sư Phần mềm'}
            </p>
          </div>
        </div>

        <button
          onClick={() => toast('Để cập nhật thông tin cá nhân hoặc tài khoản ngân hàng, vui lòng liên hệ phòng Nhân sự.')}
          className="btn btn-outline"
          style={{ height: '38px', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Edit3 size={15} /> Yêu cầu sửa đổi thông tin
        </button>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '0.25rem'
      }}>
        {[
          { key: 'general', label: 'Lý lịch & Liên hệ', icon: <User size={16} /> },
          { key: 'job', label: 'Công việc & Chức danh', icon: <Briefcase size={16} /> },
          { key: 'contract', label: 'Hợp đồng lao động', icon: <FileText size={16} /> },
          { key: 'finance', label: 'Tài khoản lương & Thuế', icon: <CreditCard size={16} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              border: 'none',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#2563EB' : '#64748B',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #2563EB' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        padding: '2rem'
      }}>
        {activeTab === 'general' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              Thông tin cá nhân & Địa chỉ liên lạc
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Họ và tên khai sinh:</span>
                <strong style={{ color: '#0F172A' }}>{data.fullName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Email công vụ:</span>
                <strong style={{ color: '#2563EB' }}>{data.email || 'long.ph@lla.vn'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Số điện thoại liên hệ:</span>
                <strong style={{ color: '#0F172A' }}>{data.phone || '0988 123 456'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Ngày sinh:</span>
                <strong style={{ color: '#0F172A' }}>{data.birthday ? new Date(data.birthday).toLocaleDateString('vi-VN') : '15/05/1998'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Giới tính:</span>
                <strong style={{ color: '#0F172A' }}>{data.gender || 'Nam'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Số CCCD / Hộ chiếu:</span>
                <strong style={{ color: '#0F172A' }}>{data.idCard || '001098012345'}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Địa chỉ thường trú:</span>
                <strong style={{ color: '#0F172A' }}>{data.address || 'Số 18, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội'}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              Vị trí làm việc & Cơ cấu tổ chức
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Phòng ban trực thuộc:</span>
                <strong style={{ color: '#0F172A' }}>{data.department?.name || 'Phòng Phát triển Phần mềm & CNTT'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Chức danh chuyên môn:</span>
                <strong style={{ color: '#0F172A' }}>{data.position?.title || 'Kỹ sư Phần mềm Cao cấp'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Cấp bậc / Level:</span>
                <strong style={{ color: '#2563EB' }}>Senior (Bậc 3)</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Người quản lý trực tiếp:</span>
                <strong style={{ color: '#0F172A' }}>{data.manager?.fullName || 'Nguyễn Thành Nam (Tech Lead)'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Ngày chính thức gia nhập:</span>
                <strong style={{ color: '#0F172A' }}>{data.joinDate ? new Date(data.joinDate).toLocaleDateString('vi-VN') : '01/03/2023'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Địa điểm làm việc:</span>
                <strong style={{ color: '#0F172A' }}>Tòa nhà LLA Innovation Tower, Cầu Giấy, Hà Nội</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              Thông tin Hợp đồng lao động hiện tại
            </h3>
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '0.75rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                    Hợp đồng lao động không xác định thời hạn
                  </strong>
                  <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Hiệu lực
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Số hợp đồng: #HDLD-2024-001 • Ngày ký: 01/03/2024
                </span>
              </div>
              <button 
                onClick={() => toast('Hợp đồng điện tử đã được lưu trữ bảo mật trên hệ thống.')}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              >
                Xem chi tiết HĐ
              </button>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
              Tài khoản chi trả lương & Bảo hiểm bắt buộc
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Ngân hàng thụ hưởng:</span>
                <strong style={{ color: '#0F172A' }}>Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Số tài khoản nhận lương:</span>
                <strong style={{ color: '#2563EB', fontSize: '1rem' }}>19036888888888</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Mã số thuế cá nhân:</span>
                <strong style={{ color: '#0F172A' }}>8549123011</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Mã số sổ BHXH:</span>
                <strong style={{ color: '#0F172A' }}>7912345678</strong>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
