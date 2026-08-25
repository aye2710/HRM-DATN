import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Building2 } from 'lucide-react';

interface Department {
  id: string;
  code: string;
  name: string;
  _count: {
    employees: number;
  };
}

export default function OrganizationManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({ code: '', name: '' });
  
  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ code: '', name: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setFormData({ code: dept.code, name: dept.name });
    setShowModal(true);
  };

  const handleSave = () => {
    if (modalMode === 'add') {
      axios.post('http://localhost:5000/api/departments', formData)
        .then(() => {
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => alert(err.response?.data?.error || 'Lỗi'));
    } else {
      axios.put(`http://localhost:5000/api/departments/${editingId}`, formData)
        .then(() => {
          fetchDepartments();
          setShowModal(false);
        })
        .catch(err => alert(err.response?.data?.error || 'Lỗi'));
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    axios.delete(`http://localhost:5000/api/departments/${deleteId}`)
      .then(() => {
        fetchDepartments();
        setDeleteId(null);
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Lỗi xóa phòng ban');
        setDeleteId(null);
      });
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Cơ cấu Tổ chức</h2>
        <button onClick={handleOpenAdd} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-primary-500/30">
          <Plus size={20} />
          Thêm Phòng ban
        </button>
      </div>

      <div className="glass flex-1 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm phòng ban..." 
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100/80 backdrop-blur-sm shadow-sm z-10">
              <tr>
                <th className="p-4 font-semibold text-slate-600 w-1/4">Mã PB</th>
                <th className="p-4 font-semibold text-slate-600 w-2/4">Tên Phòng ban</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Nhân sự</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
              ) : filteredDepts.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Không có dữ liệu</td></tr>
              ) : (
                filteredDepts.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{dept.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={18} /></div>
                        <p className="font-semibold text-slate-800">{dept.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                        {dept._count.employees} người
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(dept)} className="p-2 text-slate-400 hover:text-primary-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => setDeleteId(dept.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-slate-100 transition-colors">
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

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{modalMode === 'add' ? 'Thêm Phòng ban' : 'Cập nhật Phòng ban'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Mã phòng ban</label>
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" placeholder="VD: MKT" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tên phòng ban</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" placeholder="VD: Phòng Marketing" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">Lưu lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Xóa phòng ban?</h3>
              <p className="text-slate-500">Thao tác này không thể hoàn tác. Các nhân viên thuộc phòng ban này cần được thuyên chuyển trước.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors">Xóa luôn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
