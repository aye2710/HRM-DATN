import React from 'react';
import { Users, Calendar, DollarSign, Settings, Bell, Search, Menu, LayoutDashboard, Network } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass flex flex-col m-4 rounded-2xl">
        <div className="p-6 border-b border-slate-200/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">L</div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">LLA HRM</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${location.pathname === '/' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-100/50'}`}>
            <LayoutDashboard size={20} />
            Tổng quan
          </Link>
          <Link to="/organization" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${location.pathname === '/organization' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-100/50'}`}>
            <Network size={20} />
            Cơ cấu Tổ chức
          </Link>
          <Link to="/employees" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${location.pathname === '/employees' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-100/50'}`}>
            <Users size={20} />
            Nhân sự
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100/50 rounded-xl font-medium transition-all">
            <Calendar size={20} />
            Chấm công & Phép
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100/50 rounded-xl font-medium transition-all">
            <DollarSign size={20} />
            Tiền lương
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200/50">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100/50 rounded-xl font-medium transition-all">
            <Settings size={20} />
            Cài đặt
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden p-4 pl-0">
        <header className="h-20 glass rounded-2xl flex items-center justify-between px-6 mb-4">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Menu size={24} /></button>
            <h1 className="text-2xl font-semibold text-slate-800">Tổng quan Nhân sự</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Tìm kiếm..." className="pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-64 transition-all" />
            </div>
            <button className="relative p-2 text-slate-500 hover:text-primary-600 transition-colors">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center text-white font-bold">
                T
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Trúc LH</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          {children}
        </div>
      </main>
    </div>
  );
}
