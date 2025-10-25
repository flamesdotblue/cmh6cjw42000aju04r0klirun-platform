import { useMemo, useState } from 'react';

function EmployeeRow({ emp, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
      <div className="col-span-4">
        <div className="font-medium">{emp.name}</div>
        <div className="text-xs text-slate-500">{emp.email}</div>
      </div>
      <div className="col-span-3 text-sm">{emp.role}</div>
      <div className="col-span-3 text-sm text-slate-600">{emp.startDate}</div>
      <div className="col-span-2 flex justify-end gap-2">
        <button onClick={() => onEdit(emp)} className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50">Edit</button>
        <button onClick={() => onDelete(emp.id)} className="px-3 py-1.5 rounded-md bg-rose-500 text-white hover:bg-rose-600">Hapus</button>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(
    initial || { name: '', email: '', role: 'Staff', startDate: new Date().toISOString().slice(0, 10) }
  );
  const isEdit = Boolean(initial && initial.id);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 1 && /.+@.+\..+/.test(form.email);
  }, [form]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit(form);
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@perusahaan.com"
            required
          />
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

function EmployeeManager({ employees, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-600 mb-2">
          {editing ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
        </div>
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
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Daftar Karyawan</h4>
          <span className="text-sm text-slate-500">Total: {employees.length}</span>
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs uppercase tracking-wider text-slate-500">
            <div className="col-span-4">Nama</div>
            <div className="col-span-3">Jabatan</div>
            <div className="col-span-3">Mulai</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>
          <div className="bg-white divide-y divide-slate-100">
            {employees.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">Belum ada data karyawan.</div>
            ) : (
              employees.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} onEdit={setEditing} onDelete={onDelete} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeManager;
