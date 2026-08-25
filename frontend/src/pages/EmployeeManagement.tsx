import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Employee {
  id: string;
  code: string;
  fullName: string;
  cccd: string;
  status: string;
  joinDate: string;
  department: { name: string } | null;
  position: { title: string } | null;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/employees')
      .then(res => {
        setEmployees(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(search.toLowerCase()) || 
    emp.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Hồ sơ Nhân sự</h2>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-primary-500/30">
          <Plus size={20} />
          Thêm nhân viên
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass flex-1 rounded-2xl flex flex-col overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo mã NV, tên..." 
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100/80 backdrop-blur-sm shadow-sm z-10">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Mã NV</th>
                <th className="p-4 font-semibold text-slate-600">Họ và tên</th>
                <th className="p-4 font-semibold text-slate-600">Phòng ban</th>
                <th className="p-4 font-semibold text-slate-600">Chức vụ</th>
                <th className="p-4 font-semibold text-slate-600">Trạng thái</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy nhân viên nào</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{emp.code}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{emp.fullName}</p>
                      <p className="text-xs text-slate-400">CCCD: {emp.cccd}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium whitespace-nowrap">
                        {emp.department?.name || 'Chưa xếp phòng'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{emp.position?.title || 'Chưa xếp chức vụ'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button className="p-2 text-slate-400 hover:text-primary-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-colors">
                        <Trash2 size={18} />
                      </button>
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
}
