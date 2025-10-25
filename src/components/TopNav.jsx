import { useMemo, useState } from 'react';
import { User, LogOut, Shield, Lock } from 'lucide-react';

export default function TopNav({ auth, employees, adminPin, onAdminLogin, onEmployeeLogin, onLogout, onUpdateAdminPin, isAdmin }) {
  const [openLogin, setOpenLogin] = useState(false);
  const [tab, setTab] = useState('employee');

  const [selectedEmp, setSelectedEmp] = useState('');
  const [empPin, setEmpPin] = useState('');

  const [adminPinInput, setAdminPinInput] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');

  const canEmpLogin = useMemo(() => selectedEmp && empPin.length >= 4, [selectedEmp, empPin]);
  const canAdminLogin = useMemo(() => adminPinInput.length >= 4, [adminPinInput]);

  const handleAdminLogin = () => {
    onAdminLogin(adminPinInput);
    setAdminPinInput('');
    setOpenLogin(false);
  };

  const handleEmployeeLogin = () => {
    onEmployeeLogin(selectedEmp, empPin);
    setEmpPin('');
    setOpenLogin(false);
  };

  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 text-white grid place-items-center">
            <Lock size={18} />
          </div>
          <div>
            <div className="font-semibold">HRKecil</div>
            <div className="text-xs text-slate-500">SaaS HR untuk UMKM</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {auth.level === 'public' ? (
            <button onClick={() => setOpenLogin((v) => !v)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
              <User size={16} /> Masuk
            </button>
          ) : (
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
              <LogOut size={16} /> Keluar
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500">
            <Shield size={14} /> Akses: {auth.level === 'admin' ? 'Admin' : auth.level === 'employee' ? 'Karyawan' : 'Publik'}
          </span>
        </div>
      </div>

      {openLogin && auth.level === 'public' ? (
        <div className="border-t border-slate-200 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setTab('employee')} className={`px-3 py-1.5 rounded-lg border ${tab==='employee' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>Karyawan</button>
              <button onClick={() => setTab('admin')} className={`px-3 py-1.5 rounded-lg border ${tab==='admin' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>Admin</button>
            </div>

            {tab === 'employee' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Pilih Karyawan</label>
                  <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <option value="">-- pilih --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN" value={empPin} onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, '').slice(0,6))} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
                  <button onClick={handleEmployeeLogin} disabled={!canEmpLogin} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">Masuk</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">PIN Admin</label>
                  <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN Admin" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, '').slice(0,8))} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAdminLogin} disabled={!canAdminLogin} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">Masuk</button>
                </div>
              </div>
            )}

            {isAdmin ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1 text-slate-600">Ubah PIN Admin</label>
                  <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN baru (min 4 digit)" value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0,8))} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none" />
                </div>
                <div>
                  <button onClick={() => { if ((newAdminPin||'').length>=4) { onUpdateAdminPin(newAdminPin); setNewAdminPin(''); alert('PIN Admin diubah'); } else { alert('Minimal 4 digit'); } }} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Simpan PIN</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
