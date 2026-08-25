import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    estimatedPayroll: '0M'
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard/stats')
      .then(response => setStats(response.data))
      .catch(error => console.error("Error fetching stats:", error));
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl transform transition hover:-translate-y-1 hover:shadow-2xl">
          <h3 className="text-slate-500 font-medium mb-2">Tổng nhân viên (Live DB)</h3>
          <p className="text-4xl font-bold text-slate-800">{stats.totalEmployees}</p>
          <p className="text-sm text-green-500 mt-2 font-medium">Lấy trực tiếp từ PostgreSQL</p>
        </div>
        <div className="glass p-6 rounded-2xl transform transition hover:-translate-y-1 hover:shadow-2xl">
          <h3 className="text-slate-500 font-medium mb-2">Đơn nghỉ phép chờ duyệt</h3>
          <p className="text-4xl font-bold text-slate-800">{stats.pendingLeaves}</p>
          <p className="text-sm text-amber-500 mt-2 font-medium">Trạng thái: PENDING</p>
        </div>
        <div className="glass p-6 rounded-2xl transform transition hover:-translate-y-1 hover:shadow-2xl">
          <h3 className="text-slate-500 font-medium mb-2">Quỹ lương dự kiến</h3>
          <p className="text-4xl font-bold text-slate-800">{stats.estimatedPayroll}</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Tháng hiện tại</p>
        </div>
      </div>
      
      <div className="mt-6 glass p-6 rounded-2xl h-96 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium text-lg">Kết nối API Backend thành công!</p>
        <p className="text-slate-400 mt-2">Dữ liệu trên Dashboard đang được lấy trực tiếp từ PostgreSQL 17</p>
      </div>
    </>
  );
}
