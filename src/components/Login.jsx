import { useMemo, useState } from 'react';
import { Shield, User } from 'lucide-react';
import * as DB from './FakeDB';

export default function Login({ employees, onAdminLogin, onEmployeeLogin, onBackHome, onChangeAdminPin, isAdminLevel }) {
  const [tab, setTab] = useState('employee');

  // employee login
  const [selectedEmp, setSelectedEmp] = useState('');
  const [empPin, setEmpPin] = useState('');
  const canEmpLogin = useMemo(() => selectedEmp && empPin.length >= 4, [selectedEmp, empPin]);

  // admin login
  const [adminPinInput, setAdminPinInput] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const canAdminLogin = useMemo(() => adminPinInput.length >= 4, [adminPinInput]);

  const useAdminDemo = async () => {
    const pin = await DB.getAdminPin();
    setTab('admin');
    setAdminPinInput(pin);
  };

  const useEmployeeDemo = async () => {
    const demo = employees.find((e) => e.email === 'manager@demo.local') || employees[0];
    if (!demo) return;
    const pin = String(demo.pin || '');
    setTab('employee');
    setSelectedEmp(demo.id);
    setEmpPin(pin);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-tight">Masuk ke HRKecil</div>
        <button onClick={onBackHome} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Kembali</button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTab('employee')} className={`px-3 py-2 rounded-lg border ${tab==='employee' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}><User size={14}/> Karyawan</button>
        <button onClick={() => setTab('admin')} className={`px-3 py-2 rounded-lg border ${tab==='admin' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}><Shield size={14}/> Admin</button>
        <div className="flex-1" />
        <button onClick={useEmployeeDemo} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Gunakan Karyawan Demo</button>
        <button onClick={useAdminDemo} className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Gunakan Admin Demo</button>
      </div>

      {tab === 'employee' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-5 rounded-xl border border-slate-200 bg-slate-50/60">
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
            <button onClick={() => onEmployeeLogin(selectedEmp, empPin)} disabled={!canEmpLogin} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">Masuk</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">PIN Admin</label>
              <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN Admin" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, '').slice(0,8))} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => onAdminLogin(adminPinInput)} disabled={!canAdminLogin} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">Masuk</button>
            </div>
          </div>
          {isAdminLevel ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-slate-600">Ubah PIN Admin</label>
                <input type="password" inputMode="numeric" pattern="[0-9]*" placeholder="PIN baru (min 4 digit)" value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0,8))} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none" />
              </div>
              <div>
                <button onClick={() => { if ((newAdminPin||'').length>=4) { onChangeAdminPin(newAdminPin); alert('PIN Admin diubah'); setNewAdminPin(''); } else { alert('Minimal 4 digit'); } }} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Simpan PIN</button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
