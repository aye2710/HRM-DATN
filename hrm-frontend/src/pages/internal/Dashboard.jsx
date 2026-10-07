import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, FileText } from 'lucide-react';
import axios from 'axios';

export const InternalDashboard = () => {
  const [statsData, setStatsData] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    estimatedPayroll: '0'
  });
  const [newEmployees, setNewEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, empRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats'),
          axios.get('http://localhost:5000/api/employees')
        ]);
        setStatsData(statsRes.data);
        
        // Lấy 3 nhân sự mới nhất
        const sortedEmp = empRes.data.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
        setNewEmployees(sortedEmp.slice(0, 3));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Tổng Nhân Sự', value: statsData.totalEmployees, icon: <Users size={24} />, color: 'var(--primary)', trend: 'Active' },
    { label: 'Tuyển dụng', value: 4, icon: <UserPlus size={24} />, color: 'var(--accent)', trend: 'Vị trí trống' },
    { label: 'Đơn Phép (Chờ)', value: statsData.pendingLeaves, icon: <Clock size={24} />, color: 'var(--warning)', trend: 'Cần duyệt' },
    { label: 'Dự toán Lương', value: statsData.estimatedPayroll, icon: <FileText size={24} />, color: 'var(--success)', trend: 'VNĐ' },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">
            System Dashboard
          </h1>
          <p className="text-muted mt-2">Tổng quan tình hình nhân sự và các cảnh báo hệ thống.</p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card glass card-hover" style={{ borderLeft: `4px solid ${stat.color}`, padding: '1.5rem' }}>
            <div className="flex items-start justify-between mb-4">
              <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div className="flex-col">
              <span className="text-muted mb-1" style={{ fontSize: '0.95rem', fontWeight: 500 }}>{stat.label}</span>
              <div className="flex items-end gap-3">
                <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                   {loading ? '...' : stat.value}
                </span>
                <span style={{ fontSize: '0.85rem', color: stat.color, marginBottom: '0.5rem', fontWeight: 600 }}>{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Onboarding Table */}
        <div className="card glass">
          <h3 className="mb-6" style={{ }}>Nhân sự mới gia nhập</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Phòng ban</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="text-center p-4">Đang tải...</td></tr>
                ) : newEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600 }}>{emp.fullName}</span>
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{emp.code}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{emp.department?.name || 'Đang chờ xếp'}</span></td>
                    <td><span className="badge badge-info">{emp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* To-Do List */}
        <div className="card glass">
          <h3 className="mb-6" style={{ }}>Cần xử lý (To-do)</h3>
          <div className="flex-col gap-4">
            <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-4">
                <div style={{ padding: '0.75rem', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '50%' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Duyệt đơn nghỉ phép</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Có {statsData.pendingLeaves} đơn đang chờ duyệt</p>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Review</button>
            </div>
            
            <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-4">
                <div style={{ padding: '0.75rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: '50%' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Chốt bảng lương Tháng {new Date().getMonth() + 1}</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Hạn chót: Mùng 5 hàng tháng</p>
                </div>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Processing</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

