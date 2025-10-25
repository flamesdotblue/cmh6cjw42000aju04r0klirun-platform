import { useMemo, useState } from 'react';
import { User, LogOut, Shield, Clock } from 'lucide-react';

export default function TopNav({ auth, onLoginStaff, onLogout, listEmployees }) {
  const [openLogin, setOpenLogin] = useState(false);
  const [selected, setSelected] = useState('');
  const [pin, setPin] = useState('');
  const employees = listEmployees || [];

  const canLogin = useMemo(() => selected && pin.length >= 4, [selected, pin]);

  const handleLogin = () => {
    const emp = employees.find((e) => e.id === selected);
    if (!emp) return;
    if (String(emp.pin || '') === String(pin)) {
      onLoginStaff(emp.id);
      setOpenLogin(false);
      setPin('');
    } else {
      alert('PIN salah');
    }
  };

  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 text-white grid place-items-center">
            <Clock size={18} />
          </div>
          <div>
            <div className="font-semibold">HRKecil</div>
            <div className="text-xs text-slate-500">SaaS HR untuk UMKM</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {auth.type === 'admin' ? (
            <button
              onClick={() => setOpenLogin((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <User size={16} /> Masuk sebagai Staff
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              <LogOut size={16} /> Keluar Staff
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500">
            <Shield size={14} /> Mode: {auth.type === 'admin' ? 'Admin' : 'Staff'}
          </span>
        </div>
      </div>

      {openLogin && auth.type === 'admin' ? (
        <div className="border-t border-slate-200 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Pilih Karyawan</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="" disabled>-- pilih --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0,6))}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  onClick={handleLogin}
                  disabled={!canLogin}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                >Masuk</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
