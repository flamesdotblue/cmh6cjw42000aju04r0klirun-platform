import { LogOut, Lock, Home } from 'lucide-react';

export default function TopBar({ auth, role, onNavigate, onLogout }) {
  const levelLabel = auth.level === 'admin' ? 'Admin' : auth.level === 'employee' ? (role || 'Karyawan') : 'Publik';
  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate('/')} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 text-white grid place-items-center">
            <Lock size={18} />
          </div>
          <div className="text-left">
            <div className="font-semibold">HRKecil</div>
            <div className="text-xs text-slate-500">SaaS HR untuk UMKM</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('/')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
            <Home size={16} /> Beranda
          </button>
          {auth.level === 'public' ? (
            <button onClick={() => onNavigate('/login')} className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Masuk</button>
          ) : (
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"><LogOut size={16} /> Keluar</button>
          )}
          <span className="hidden sm:inline text-xs text-slate-500">Akses: {levelLabel}</span>
        </div>
      </div>
    </nav>
  );
}
