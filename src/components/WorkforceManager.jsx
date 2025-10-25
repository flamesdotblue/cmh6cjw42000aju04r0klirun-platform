import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Trash2, PencilLine, Users, GraduationCap, FileDown, Plus, X, CheckCircle, RefreshCw } from 'lucide-react';

function SectionHeader({ title, icon }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-8 w-8 rounded-lg bg-slate-900 text-white grid place-items-center">
        <Icon size={16} />
      </div>
      <h4 className="font-semibold">{title}</h4>
    </div>
  );
}

function RowActions({ onEdit, onDelete, onConvert, isIntern, canManage }) {
  return (
    <div className="col-span-2 flex justify-end gap-2">
      {isIntern && canManage ? (
        <button onClick={onConvert} className="px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1"><RefreshCw size={14}/>Konversi</button>
      ) : null}
      <button onClick={onEdit} disabled={!canManage} className={`px-3 py-1.5 rounded-md border ${canManage ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'} inline-flex items-center gap-1`}><PencilLine size={14}/>Edit</button>
      <button onClick={onDelete} disabled={!canManage} className={`px-3 py-1.5 rounded-md ${canManage ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-rose-200 text-white/70 cursor-not-allowed'} inline-flex items-center gap-1`}><Trash2 size={14}/>Hapus</button>
    </div>
  );
}

function EmployeeRow({ emp, onEdit, onDelete, canManage }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
      <div className="col-span-4">
        <div className="font-medium flex items-center gap-2">
          {emp.role === 'Intern' ? <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Magang</span> : null}
          <span>{emp.name}</span>
        </div>
        <div className="text-xs text-slate-500">{emp.email}</div>
      </div>
      <div className="col-span-2 text-sm">{emp.role}</div>
      <div className="col-span-2 text-sm text-slate-600">{emp.startDate}</div>
      <div className="col-span-2 text-sm text-slate-600">{Number(emp.targetHours || 8)} jam</div>
      <RowActions onEdit={() => onEdit(emp)} onDelete={() => onDelete(emp.id)} canManage={canManage} />
    </div>
  );
}

function InternRow({ emp, onEdit, onDelete, onConvert, canManage }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
      <div className="col-span-4">
        <div className="font-medium flex items-center gap-2">
          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Magang</span>
          <span>{emp.name}</span>
        </div>
        <div className="text-xs text-slate-500">{emp.email} • {emp.school || '-'}</div>
      </div>
      <div className="col-span-2 text-sm">{emp.mentor || '-'}</div>
      <div className="col-span-2 text-sm text-slate-600">{emp.internshipStart || '-'} → {emp.internshipEnd || '-'}</div>
      <div className="col-span-2 text-sm text-slate-600">{emp.status || 'Aktif'}</div>
      <RowActions onEdit={() => onEdit(emp)} onDelete={() => onDelete(emp.id)} onConvert={() => onConvert(emp.id)} isIntern canManage={canManage} />
    </div>
  );
}

function EmployeeForm({ initial, onCancel, onSubmit, existingEmails, canEdit }) {
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
    const initLower = (initial?.email || '').trim().toLowerCase();
    return emailLower === initLower || !exists;
  }, [existingEmails, form.email, initial, isEdit]);

  const canSubmit = useMemo(() => {
    return canEdit && form.name.trim().length > 1 && emailValid && emailUnique && String(form.pin || '').length >= 4 && Number(form.targetHours) > 0;
  }, [form, emailValid, emailUnique, canEdit]);

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
          <input disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input disabled={!canEdit} type="email" className={`w-full rounded-lg border px-3 py-2 disabled:bg-slate-50 ${emailValid && emailUnique ? 'border-slate-300' : 'border-rose-300'}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@perusahaan.com" required />
          {!emailUnique && emailValid ? (
            <div className="text-xs text-rose-600 mt-1">Email sudah digunakan.</div>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jabatan</label>
          <select disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-50" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Staff</option>
            <option>Supervisor</option>
            <option>Manager</option>
            <option>Intern</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mulai Bekerja</label>
          <input disabled={!canEdit} type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PIN Absensi (4-6 digit)</label>
          <input disabled={!canEdit} type="password" inputMode="numeric" pattern="[0-9]*" className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0,6) })} placeholder="Contoh: 1234" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Jam/Hari</label>
          <input disabled={!canEdit} type="number" min={1} step={0.5} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.targetHours} onChange={(e) => setForm({ ...form, targetHours: e.target.value })} placeholder="8" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!canSubmit} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">{isEdit ? 'Simpan Perubahan' : 'Tambah'}</button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200">Batal</button>
        ) : null}
      </div>
    </form>
  );
}

function InternForm({ initial, onCancel, onSubmit, existingEmails, canEdit }) {
  const [form, setForm] = useState(
    initial || {
      name: '', email: '', role: 'Intern', startDate: new Date().toISOString().slice(0, 10), pin: '', targetHours: 8,
      internshipStart: new Date().toISOString().slice(0, 10), internshipEnd: '', mentor: '', school: '', stipend: '', status: 'Aktif', tasks: []
    }
  );
  const [taskInput, setTaskInput] = useState('');
  const isEdit = Boolean(initial && initial.id);

  const emailValid = useMemo(() => /.+@.+\..+/.test(form.email), [form.email]);
  const emailUnique = useMemo(() => {
    const emailLower = (form.email || '').trim().toLowerCase();
    if (!emailLower) return false;
    const exists = existingEmails.has(emailLower);
    if (!isEdit) return !exists;
    const initLower = (initial?.email || '').trim().toLowerCase();
    return emailLower === initLower || !exists;
  }, [existingEmails, form.email, initial, isEdit]);

  const canSubmit = useMemo(() => {
    return canEdit && form.name.trim().length > 1 && emailValid && emailUnique && String(form.pin || '').length >= 4 && Number(form.targetHours) > 0;
  }, [form, emailValid, emailUnique, canEdit]);

  const addTask = () => {
    const t = taskInput.trim();
    if (!t || !canEdit) return;
    setForm((f) => ({ ...f, tasks: [...(f.tasks || []), t] }));
    setTaskInput('');
  };

  const removeTask = (idx) => {
    if (!canEdit) return;
    setForm((f) => ({ ...f, tasks: (f.tasks || []).filter((_, i) => i !== idx) }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ ...form, role: 'Intern', targetHours: Number(form.targetHours) });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama</label>
          <input disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input disabled={!canEdit} type="email" className={`w-full rounded-lg border px-3 py-2 disabled:bg-slate-50 ${emailValid && emailUnique ? 'border-slate-300' : 'border-rose-300'}`} value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
          {!emailUnique && emailValid ? (<div className="text-xs text-rose-600 mt-1">Email sudah digunakan.</div>) : null}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sekolah/Universitas</label>
          <input disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.school} onChange={(e)=>setForm({...form, school: e.target.value})} placeholder="Nama institusi" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mentor</label>
          <input disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.mentor} onChange={(e)=>setForm({...form, mentor: e.target.value})} placeholder="Nama mentor" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Periode Magang</label>
          <div className="grid grid-cols-2 gap-2">
            <input disabled={!canEdit} type="date" className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.internshipStart} onChange={(e)=>setForm({...form, internshipStart: e.target.value})} />
            <input disabled={!canEdit} type="date" className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.internshipEnd} onChange={(e)=>setForm({...form, internshipEnd: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
            <option>Aktif</option>
            <option>Selesai</option>
            <option>Drop</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PIN Absensi (4-6 digit)</label>
          <input disabled={!canEdit} type="password" inputMode="numeric" pattern="[0-9]*" className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.pin} onChange={(e)=>setForm({...form, pin: e.target.value.replace(/\D/g,'').slice(0,6)})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Jam/Hari</label>
          <input disabled={!canEdit} type="number" min={1} step={0.5} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.targetHours} onChange={(e)=>setForm({...form, targetHours: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Uang Saku (opsional)</label>
          <input disabled={!canEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.stipend} onChange={(e)=>setForm({...form, stipend: e.target.value})} placeholder="cth: 1.000.000/bulan" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tugas/Rencana Pembelajaran</label>
        <div className="flex gap-2 mb-2">
          <input disabled={!canEdit} value={taskInput} onChange={(e)=>setTaskInput(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" placeholder="Tambahkan tugas (Enter/klik +)" onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addTask(); } }} />
          <button type="button" onClick={addTask} disabled={!canEdit} className={`px-3 py-2 rounded-lg border inline-flex items-center gap-1 ${canEdit ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'}`}><Plus size={14}/>Tambah</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.tasks||[]).map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle size={12}/>{t}
              <button type="button" onClick={()=>removeTask(i)} disabled={!canEdit} className={`text-slate-500 ${canEdit ? 'hover:text-rose-600' : 'opacity-40 cursor-not-allowed'}`}><X size={12}/></button>
            </span>
          ))}
          {(form.tasks||[]).length === 0 ? <span className="text-xs text-slate-500">Belum ada tugas.</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={!canSubmit} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">{isEdit ? 'Simpan Perubahan' : 'Tambah Magang'}</button>
        {onCancel ? <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200">Batal</button> : null}
      </div>
    </form>
  );
}

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function diffHours(inTs, outTs) {
  if (!inTs || !outTs) return 0;
  const ms = Math.max(0, outTs - inTs);
  return ms / 3600000;
}

function MondayOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const res = new Date(date);
  res.setDate(date.getDate() + diff);
  res.setHours(0,0,0,0);
  return res;
}

export default function WorkforceManager({ employees, onAdd, onUpdate, onDelete, attendanceAll, evaluations, onAddEvaluation, onDeleteEvaluation, onConvertIntern, permissions }) {
  const [tab, setTab] = useState('employees');
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [evalInternId, setEvalInternId] = useState('');
  const [evalDate, setEvalDate] = useState(() => dateKeyFromDate(new Date()));
  const [scores, setScores] = useState({ discipline: 3, skill: 3, communication: 3, notes: '' });
  const [weekStart, setWeekStart] = useState(() => dateKeyFromDate(MondayOfWeek(new Date())));

  const existingEmails = useMemo(() => new Set(employees.map((e) => e.email?.trim().toLowerCase()).filter(Boolean)), [employees]);

  const isIntern = (e) => e.role === 'Intern';

  const dataSource = useMemo(() => {
    const filteredByTab = tab === 'interns' ? employees.filter(isIntern) : employees;
    const q = query.trim().toLowerCase();
    let data = filteredByTab.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q) || (tab==='interns' && ((e.school||'').toLowerCase().includes(q) || (e.mentor||'').toLowerCase().includes(q))));
    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      let valA, valB;
      if (tab === 'interns' && (sortBy === 'mentor' || sortBy === 'internshipStart')) {
        valA = sortBy === 'mentor' ? (a.mentor||'') : (a.internshipStart||'');
        valB = sortBy === 'mentor' ? (b.mentor||'') : (b.internshipStart||'');
      } else {
        valA = sortBy === 'startDate' ? a.startDate : (sortBy === 'role' ? a.role : a.name);
        valB = sortBy === 'startDate' ? b.startDate : (sortBy === 'role' ? b.role : b.name);
      }
      return valA.localeCompare(valB) * dir;
    });
    return data;
  }, [employees, tab, query, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(dataSource.length / pageSize));
  const pageData = dataSource.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const exportEmployeesCSV = () => {
    const rows = [["Nama","Email","Jabatan","Mulai","Target Jam/Hari"]];
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

  const exportInternsCSV = () => {
    const interns = employees.filter(isIntern);
    const rows = [["Nama","Email","Sekolah","Mentor","Mulai Magang","Selesai Magang","Status","Uang Saku","Target Jam/Hari","Tugas"]];
    interns.forEach((e) => rows.push([
      e.name, e.email, e.school||'', e.mentor||'', e.internshipStart||'', e.internshipEnd||'', e.status||'Aktif', e.stipend||'', String(e.targetHours||8), (e.tasks||[]).join(' | ')
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interns_hrkecil_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const internOptions = useMemo(() => employees.filter(isIntern), [employees]);

  const weeklyHoursForIntern = (internId, weekStartKey) => {
    if (!internId) return 0;
    const start = new Date(weekStartKey + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startKey = dateKeyFromDate(start);
    const endKey = dateKeyFromDate(end);
    let total = 0;
    Object.keys(attendanceAll || {}).forEach((k) => {
      if (k >= startKey && k <= endKey) {
        const day = attendanceAll[k] || {};
        const rec = day[internId];
        if (rec) total += (rec.in && rec.out) ? ( (rec.out - rec.in) / 3600000 ) : 0;
      }
    });
    return total;
  };

  const evalRecords = useMemo(() => (evalInternId ? (evaluations[evalInternId]?.records || []) : []), [evaluations, evalInternId]);

  const addEval = () => {
    if (!permissions.canManageInterns || !evalInternId) return;
    const record = {
      date: evalDate,
      discipline: Number(scores.discipline),
      skill: Number(scores.skill),
      communication: Number(scores.communication),
      notes: scores.notes?.trim() || ''
    };
    onAddEvaluation(evalInternId, record);
    setScores({ discipline: 3, skill: 3, communication: 3, notes: '' });
  };

  const exportEvalCSV = () => {
    if (!evalInternId) return;
    const intern = employees.find((e) => e.id === evalInternId);
    const rows = [["Nama","Tanggal","Disiplin","Keterampilan","Komunikasi","Catatan"]];
    (evalRecords || []).forEach((r) => rows.push([intern?.name || '', r.date, r.discipline, r.skill, r.communication, r.notes || '']));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluasi_${(intern?.name || 'intern').replace(/\s+/g,'_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canManageEmployees = Boolean(permissions?.canManageEmployees);
  const canManageInterns = Boolean(permissions?.canManageInterns);
  const canExport = Boolean(permissions?.canExport);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>{setTab('employees'); setEditing(null); setPage(1);}} className={`px-3 py-1.5 rounded-lg border ${tab==='employees' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}><Users size={14}/> Karyawan</button>
          <button onClick={()=>{setTab('interns'); setEditing(null); setPage(1);}} className={`px-3 py-1.5 rounded-lg border ${tab==='interns' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}><GraduationCap size={14}/> Magang</button>
        </div>
        {tab === 'interns' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SectionHeader title="Tambah/Edit Anak Magang" icon={GraduationCap} />
              <InternForm
                initial={editing?.role === 'Intern' ? editing : null}
                onCancel={() => setEditing(null)}
                onSubmit={(form) => {
                  if (!canManageInterns) return;
                  if (editing) {
                    onUpdate(editing.id, form);
                    setEditing(null);
                  } else {
                    onAdd(form);
                  }
                }}
                existingEmails={existingEmails}
                canEdit={canManageInterns}
              />
            </div>
            <div>
              <SectionHeader title="Evaluasi & Rekap Mingguan" icon={GraduationCap} />
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Pilih Magang</label>
                    <select value={evalInternId} onChange={(e)=>setEvalInternId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
                      <option value="">-- pilih --</option>
                      {internOptions.map((i)=>(<option key={i.id} value={i.id}>{i.name} — {i.school || i.mentor || 'Magang'}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Awal Minggu (Senin)</label>
                    <input type="date" value={weekStart} onChange={(e)=>setWeekStart(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" />
                    <div className="text-xs text-slate-500 mt-1">Total jam minggu ini: <b>{evalInternId ? weeklyHoursForIntern(evalInternId, weekStart).toFixed(2) : '0.00'}</b></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tanggal</label>
                    <input type="date" value={evalDate} onChange={(e)=>setEvalDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Disiplin</label>
                    <input type="number" min={1} max={5} value={scores.discipline} onChange={(e)=>setScores({...scores, discipline: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Keterampilan</label>
                    <input type="number" min={1} max={5} value={scores.skill} onChange={(e)=>setScores({...scores, skill: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Komunikasi</label>
                    <input type="number" min={1} max={5} value={scores.communication} onChange={(e)=>setScores({...scores, communication: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catatan</label>
                  <textarea value={scores.notes} onChange={(e)=>setScores({...scores, notes: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" rows={3} placeholder="Kesan, progress, rekomendasi..." />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addEval} disabled={!permissions.canManageInterns || !evalInternId} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">Simpan Evaluasi</button>
                  <button onClick={exportEvalCSV} disabled={!evalInternId || (evalRecords.length===0)} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Ekspor Evaluasi</button>
                </div>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left font-medium px-3 py-2">Tanggal</th>
                        <th className="text-left font-medium px-3 py-2">Disiplin</th>
                        <th className="text-left font-medium px-3 py-2">Skill</th>
                        <th className="text-left font-medium px-3 py-2">Komunikasi</th>
                        <th className="text-left font-medium px-3 py-2">Catatan</th>
                        <th className="text-right font-medium px-3 py-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evalRecords.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">Belum ada evaluasi.</td></tr>
                      ) : (
                        evalRecords.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2">{r.date}</td>
                            <td className="px-3 py-2">{r.discipline}</td>
                            <td className="px-3 py-2">{r.skill}</td>
                            <td className="px-3 py-2">{r.communication}</td>
                            <td className="px-3 py-2 max-w-[260px]"><div className="line-clamp-3">{r.notes || '-'}</div></td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={()=> permissions.canManageInterns && onDeleteEvaluation(evalInternId, idx)} disabled={!permissions.canManageInterns} className={`px-2 py-1 rounded-md border ${permissions.canManageInterns ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'}`}>Hapus</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <SectionHeader title="Tambah/Edit Karyawan" icon={Users} />
            <EmployeeForm
              initial={editing && editing.role !== 'Intern' ? editing : null}
              onCancel={() => setEditing(null)}
              onSubmit={(form) => {
                if (!canManageEmployees) return;
                if (editing) {
                  onUpdate(editing.id, form);
                  setEditing(null);
                } else {
                  onAdd(form);
                }
              }}
              existingEmails={existingEmails}
              canEdit={canManageEmployees}
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
              <input
                placeholder={tab==='interns' ? 'Cari nama/email/sekolah/mentor...' : 'Cari nama atau email...'}
                className="pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 w-[260px]"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            {tab === 'interns' ? (
              <>
                <button onClick={() => toggleSort('mentor')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Mentor</button>
                <button onClick={() => toggleSort('internshipStart')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Mulai Magang</button>
              </>
            ) : (
              <>
                <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Nama</button>
                <button onClick={() => toggleSort('role')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Jabatan</button>
                <button onClick={() => toggleSort('startDate')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Mulai</button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tab === 'interns' ? (
              <button onClick={exportInternsCSV} disabled={!canExport} className={`px-3 py-2 rounded-lg border inline-flex items-center gap-1 ${canExport ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'}`}><FileDown size={14}/>Ekspor Magang</button>
            ) : (
              <button onClick={exportEmployeesCSV} disabled={!canExport} className={`px-3 py-2 rounded-lg inline-flex items-center gap-1 ${canExport ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-white/80 cursor-not-allowed'}`}><FileDown size={14}/>Ekspor Karyawan</button>
            )}
            <span className="text-sm text-slate-500">Total: {dataSource.length}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
          {tab === 'interns' ? (
            <div>
              <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs uppercase tracking-wider text-slate-500">
                <div className="col-span-4">Nama</div>
                <div className="col-span-2">Mentor</div>
                <div className="col-span-2">Periode</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Aksi</div>
              </div>
              <div className="bg-white divide-y divide-slate-100">
                {pageData.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">Belum ada data magang.</div>
                ) : (
                  pageData.map((emp) => (
                    <InternRow key={emp.id} emp={emp} onEdit={setEditing} onDelete={onDelete} onConvert={onConvertIntern} canManage={canManageInterns} />
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
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
                    <EmployeeRow key={emp.id} emp={emp} onEdit={setEditing} onDelete={onDelete} canManage={canManageEmployees} />
                  ))
                )}
              </div>
            </div>
          )}
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
