import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Trash2, PencilLine } from 'lucide-react';

function EmployeeRow({ emp, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
      <div className="col-span-4">
        <div className="font-medium">{emp.name}</div>
        <div className="text-xs text-slate-500">{emp.email}</div>
      </div>
      <div className="col-span-2 text-sm">{emp.role}</div>
      <div className="col-span-2 text-sm text-slate-600">{emp.startDate}</div>
      <div className="col-span-2 text-sm text-slate-600">{emp.targetHours} jam</div>
      <div className="col-span-2 flex justify-end gap-2">
        <button onClick={() => onEdit(emp)} className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"><PencilLine size={14}/>Edit</button>
        <button onClick={() => onDelete(emp.id)} className="px-3 py-1.5 rounded-md bg-rose-500 text-white hover:bg-rose-600 inline-flex items-center gap-1"><Trash2 size={14}/>Hapus</button>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onCancel, onSubmit, existingEmails }) {
  const [form, setForm] = useState(
    initial || { name: '', email: '', role: 'Staff', startDate: new Date().toISOString().slice(0, 10), pin: '', targetHours: 8 }
  );
  const isEdit = Boolean(initial && initial.id);

  const emailValid = useMemo(() => /.+@.+\..+/.test(form.email), [form.email]);
  const emailUnique = useMemo(() => {
    const emailLower = (form.email || '').trim().toLowerCase();
    if (!emailLower) return false;
    const exists = existingEmails.has(emailLower);
    if (!isEdit) return !exists;
    // if editing, allow same email as initial
    const initLower = (initial?.email || '').trim().toLowerCase();
    return emailLower === initLower || !exists;
  }, [existingEmails, form.email, initial, isEdit]);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 1 && emailValid && emailUnique && String(form.pin || '').length >= 4 && Number(form.targetHours) > 0;
  }, [form, emailValid, emailUnique]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ ...form, targetHours: Number(form.targetHours) });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama lengkap"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${emailValid && emailUnique ? 'border-slate-300 focus:ring-slate-400' : 'border-rose-300 focus:ring-rose-300'}`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@perusahaan.com"
            required
          />
          {!emailUnique && emailValid ? (
            <div className="text-xs text-rose-600 mt-1">Email sudah digunakan.</div>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jabatan</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option>Staff</option>
            <option>Supervisor</option>
            <option>Manager</option>
            <option>Intern</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mulai Bekerja</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PIN Absensi (4-6 digit)</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0,6) })}
            placeholder="Contoh: 1234"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Jam/Hari</label>
          <input
            type="number"
            min={1}
            step={0.5}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.targetHours}
            onChange={(e) => setForm({ ...form, targetHours: e.target.value })}
            placeholder="8"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
        >
          {isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200">Batal</button>
        ) : null}
      </div>
    </form>
  );
}

export default function EmployeeManager({ employees, onAdd, onUpdate, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const existingEmails = useMemo(() => new Set(employees.map((e) => e.email?.trim().toLowerCase()).filter(Boolean)), [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = employees.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q));
    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const valA = sortBy === 'startDate' ? a.startDate : (sortBy === 'role' ? a.role : a.name);
      const valB = sortBy === 'startDate' ? b.startDate : (sortBy === 'role' ? b.role : b.name);
      return valA.localeCompare(valB) * dir;
    });
    return data;
  }, [employees, query, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const exportEmployeesCSV = () => {
    const rows = [['Nama', 'Email', 'Jabatan', 'Mulai', 'Target Jam/Hari']];
    employees.forEach((e) => rows.push([e.name, e.email, e.role, e.startDate, String(e.targetHours || 8)]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_hrkecil_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-600 mb-2">
          {editing ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
        </div>
        {isAdmin ? (
          <EmployeeForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(form) => {
              if (editing) {
                onUpdate(editing.id, form);
                setEditing(null);
              } else {
                onAdd(form);
              }
            }}
            existingEmails={existingEmails}
          />
        ) : (
          <div className="text-sm p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">Hanya admin yang dapat mengubah data karyawan.</div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
              <input
                placeholder="Cari nama atau email..."
                className="pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 w-[240px]"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Nama</button>
            <button onClick={() => toggleSort('role')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Jabatan</button>
            <button onClick={() => toggleSort('startDate')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Mulai</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Total: {employees.length}</span>
            <button onClick={exportEmployeesCSV} className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Ekspor CSV</button>
          </div>
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs uppercase tracking-wider text-slate-500">
            <div className="col-span-4">Nama</div>
            <div className="col-span-2">Jabatan</div>
            <div className="col-span-2">Mulai</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>
          <div className="bg-white divide-y divide-slate-100">
            {pageData.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">Belum ada data karyawan.</div>
            ) : (
              pageData.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} onEdit={isAdmin ? setEditing : () => {}} onDelete={isAdmin ? onDelete : () => {}} />
              ))
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50">Prev</button>
          <span className="text-sm text-slate-600">Halaman {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
