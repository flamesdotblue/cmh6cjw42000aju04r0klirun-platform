import { useMemo, useState } from 'react';
import { FileDown, ArrowUpDown, Search } from 'lucide-react';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function StatCard({ label, value, accent }) {
  return (
    <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      {accent ? <div className="mt-3 h-1.5 rounded-full" style={{ background: accent }} /> : null}
    </div>
  );
}

function StatsHeader({ stats, selectedDate, onChangeDate, title }) {
  return (
    <section className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500">Tanggal: {new Date(selectedDate).toLocaleDateString()}</p>
        </div>
        <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 w-[200px]" value={dateKeyFromDate(selectedDate)} onChange={(e) => onChangeDate(new Date(e.target.value + 'T00:00:00'))} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Karyawan" value={stats.totalEmployees || 0} accent="linear-gradient(90deg,#6366f1,#22d3ee)" />
        <StatCard label="Hadir (Tanggal Dipilih)" value={stats.presentToday || 0} accent="linear-gradient(90deg,#22c55e,#a3e635)" />
        <StatCard label="Sudah Clock-out" value={stats.clockedOutToday || 0} accent="linear-gradient(90deg,#f59e0b,#f97316)" />
      </div>
    </section>
  );
}

function diffHours(inTs, outTs) {
  if (!inTs || !outTs) return 0;
  const ms = Math.max(0, outTs - inTs);
  return ms / 3600000;
}
function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AttendancePanel({ mode, employees, date, attendanceMap, onClockIn, onClockOut, allAttendance, restrictToSelf }) {
  const [selected, setSelected] = useState(employees[0]?.id || '');
  const [note, setNote] = useState('');

  const activeEmployeeId = restrictToSelf ? mode.employeeId : selected;

  const rows = useMemo(() => {
    const map = attendanceMap || {};
    return employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      targetHours: Number(e.targetHours || 8),
      in: map[e.id]?.in || null,
      out: map[e.id]?.out || null,
      inNote: map[e.id]?.inNote || '',
      outNote: map[e.id]?.outNote || '',
    }));
  }, [attendanceMap, employees]);

  const rowsWithDur = rows.map((r) => ({ ...r, hours: diffHours(r.in, r.out) }));

  const exportAttendanceCSV = (fromKey, toKey) => {
    const keys = Object.keys(allAttendance || {}).filter((k) => k >= fromKey && k <= toKey).sort();
    const empMap = new Map(employees.map((e) => [e.id, e]));
    const out = [["Tanggal","Nama","Email","Jabatan","Masuk","Pulang","Durasi (jam)"]];
    keys.forEach((k) => {
      const day = allAttendance[k] || {};
      Object.entries(day).forEach(([empId, rec]) => {
        const emp = empMap.get(empId);
        if (!emp) return;
        const hours = diffHours(rec.in, rec.out);
        out.push([
          k,
          emp.name,
          emp.email,
          emp.role,
          rec.in ? new Date(rec.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          rec.out ? new Date(rec.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          hours ? hours.toFixed(2) : '0',
        ]);
      });
    });
    const csv = out.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${fromKey}_${toKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [rangeFrom, setRangeFrom] = useState(dateKeyFromDate(date));
  const [rangeTo, setRangeTo] = useState(dateKeyFromDate(date));

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">{restrictToSelf ? 'Karyawan' : 'Pilih Karyawan'}</label>
            {restrictToSelf ? (
              <div className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm">{employees.find((e) => e.id === mode.employeeId)?.name || '-'}</div>
            ) : (
              <select value={selected} onChange={(e)=>setSelected(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="">-- pilih --</option>
                {employees.map((e)=> (<option key={e.id} value={e.id}>{e.name} — {e.role}</option>))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Catatan (opsional)" className="hidden sm:block flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
            <button onClick={() => activeEmployeeId && onClockIn(activeEmployeeId, note, date)} disabled={!activeEmployeeId} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">Clock-in</button>
            <button onClick={() => activeEmployeeId && onClockOut(activeEmployeeId, note, date)} disabled={!activeEmployeeId} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white disabled:opacity-50">Clock-out</button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Rekap {new Date(date).toLocaleDateString()}</h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <span>Dari</span>
              <input type="date" value={rangeFrom} onChange={(e)=>setRangeFrom(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" />
              <span>Sampai</span>
              <input type="date" value={rangeTo} onChange={(e)=>setRangeTo(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" />
            </div>
            <button onClick={() => exportAttendanceCSV(rangeFrom, rangeTo)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><FileDown size={16}/>Ekspor</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-medium px-4 py-2">Nama</th>
                <th className="text-left font-medium px-4 py-2">Jabatan</th>
                <th className="text-left font-medium px-4 py-2">Masuk</th>
                <th className="text-left font-medium px-4 py-2">Pulang</th>
                <th className="text-left font-medium px-4 py-2">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rowsWithDur.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-center">Tambahkan karyawan untuk mulai mencatat absensi.</td></tr>
              ) : (
                rowsWithDur.map((r)=> (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2">{r.role}</td>
                    <td className="px-4 py-2">{formatTime(r.in)}</td>
                    <td className="px-4 py-2">{formatTime(r.out)}</td>
                    <td className="px-4 py-2">{r.out ? `${r.hours.toFixed(2)} jam` : '-'}</td>
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

function EmployeeManager({ employees, onAdd, onUpdate, onDelete, canEdit, internsMode }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    const data = employees.filter((e) => internsMode ? e.role === 'Intern' : e.role !== 'Intern');
    const q = query.trim().toLowerCase();
    const f = data.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.email||'').toLowerCase().includes(q) || (internsMode && ((e.school||'').toLowerCase().includes(q) || (e.mentor||'').toLowerCase().includes(q))));
    f.sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const va = sortBy === 'startDate' ? (a.startDate||'') : (a[sortBy] || '');
      const vb = sortBy === 'startDate' ? (b.startDate||'') : (b[sortBy] || '');
      return va.localeCompare(vb) * dir;
    });
    return f;
  }, [employees, internsMode, query, sortBy, sortDir]);

  const [form, setForm] = useState({ name: '', email: '', role: internsMode ? 'Intern' : 'Staff', startDate: new Date().toISOString().slice(0,10), pin: '', targetHours: 8, school: '', mentor: '', internshipStart: new Date().toISOString().slice(0,10), internshipEnd: '', status: 'Aktif' });

  const isValid = () => form.name.trim().length>1 && /.+@.+\..+/.test(form.email) && String(form.pin||'').length>=4;

  const submit = () => {
    if (!isValid() || !canEdit) return;
    if (editing) {
      onUpdate(editing.id, form);
      setEditing(null);
    } else {
      onAdd(form);
    }
    setForm({ name: '', email: '', role: internsMode ? 'Intern' : 'Staff', startDate: new Date().toISOString().slice(0,10), pin: '', targetHours: 8, school: '', mentor: '', internshipStart: new Date().toISOString().slice(0,10), internshipEnd: '', status: 'Aktif' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{editing ? 'Edit Data' : `Tambah ${internsMode ? 'Magang' : 'Karyawan'}`}</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
            <input placeholder={internsMode ? 'Cari nama/email/sekolah/mentor...' : 'Cari nama atau email...'} value={query} onChange={(e)=>setQuery(e.target.value)} className="pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 w-[240px]" />
          </div>
          <button onClick={() => setSortBy('name')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Nama</button>
          <button onClick={() => setSortBy('startDate')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ArrowUpDown size={14}/>Mulai</button>
          <button onClick={() => setSortDir((d) => d==='asc'?'desc':'asc')} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">{sortDir==='asc'?'Asc':'Desc'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input disabled={!canEdit} value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="Nama" className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
        <input disabled={!canEdit} type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
        <select disabled={!canEdit} value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-50">
          {internsMode ? (<option>Intern</option>) : (<><option>Staff</option><option>Supervisor</option><option>Manager</option></>)}
        </select>
        <input disabled={!canEdit} type="date" value={form.startDate} onChange={(e)=>setForm({...form, startDate: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
        {internsMode ? (
          <>
            <input disabled={!canEdit} value={form.school} onChange={(e)=>setForm({...form, school: e.target.value})} placeholder="Sekolah/Universitas" className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
            <input disabled={!canEdit} value={form.mentor} onChange={(e)=>setForm({...form, mentor: e.target.value})} placeholder="Mentor" className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
            <div className="grid grid-cols-2 gap-2">
              <input disabled={!canEdit} type="date" value={form.internshipStart} onChange={(e)=>setForm({...form, internshipStart: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
              <input disabled={!canEdit} type="date" value={form.internshipEnd} onChange={(e)=>setForm({...form, internshipEnd: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
            </div>
          </>
        ) : null}
        <input disabled={!canEdit} inputMode="numeric" pattern="[0-9]*" placeholder="PIN (4-6 digit)" value={form.pin} onChange={(e)=>setForm({...form, pin: e.target.value.replace(/\D/g,'').slice(0,6)})} className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
        <input disabled={!canEdit} type="number" min={1} step={0.5} placeholder="Target Jam/Hari" value={form.targetHours} onChange={(e)=>setForm({...form, targetHours: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
        <button onClick={submit} disabled={!canEdit || !isValid()} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">{editing ? 'Simpan Perubahan' : 'Tambah'}</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-4 py-2">Nama</th>
              <th className="text-left font-medium px-4 py-2">Email</th>
              <th className="text-left font-medium px-4 py-2">Jabatan</th>
              <th className="text-left font-medium px-4 py-2">Mulai</th>
              {internsMode ? (<th className="text-left font-medium px-4 py-2">Mentor</th>) : (<th className="text-left font-medium px-4 py-2">Target</th>)}
              <th className="text-right font-medium px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">Belum ada data.</td></tr>
            ) : (
              filtered.map((e)=> (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2">{e.email}</td>
                  <td className="px-4 py-2">{e.role}</td>
                  <td className="px-4 py-2">{e.startDate}</td>
                  {internsMode ? (<td className="px-4 py-2">{e.mentor || '-'}</td>) : (<td className="px-4 py-2">{Number(e.targetHours||8)} jam</td>)}
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={()=>{setEditing(e); setForm({ ...e });}} disabled={!canEdit} className={`px-3 py-1.5 rounded-md border ${canEdit ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'}`}>Edit</button>
                    <button onClick={()=> canEdit && onDelete(e.id)} disabled={!canEdit} className={`px-3 py-1.5 rounded-md ${canEdit ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-rose-200 text-white/70 cursor-not-allowed'}`}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvaluasiIntern({ interns, evaluations, onAdd, onDelete, canEdit }) {
  const [internId, setInternId] = useState('');
  const [record, setRecord] = useState({ date: new Date().toISOString().slice(0,10), discipline: 3, skill: 3, communication: 3, notes: '' });
  const list = interns.length ? (evaluations[internId]?.records || []) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Pilih Magang</label>
          <select value={internId} onChange={(e)=>setInternId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
            <option value="">-- pilih --</option>
            {interns.map((i)=> (<option key={i.id} value={i.id}>{i.name} — {i.school || i.mentor || 'Magang'}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={record.date} onChange={(e)=>setRecord({...record, date: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white" />
          <input type="number" min={1} max={5} value={record.discipline} onChange={(e)=>setRecord({...record, discipline: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white" placeholder="Disiplin" />
          <input type="number" min={1} max={5} value={record.skill} onChange={(e)=>setRecord({...record, skill: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white" placeholder="Skill" />
          <input type="number" min={1} max={5} value={record.communication} onChange={(e)=>setRecord({...record, communication: e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white" placeholder="Komunikasi" />
        </div>
      </div>
      <textarea rows={3} value={record.notes} onChange={(e)=>setRecord({...record, notes: e.target.value})} placeholder="Catatan" className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white" />
      <div>
        <button onClick={()=> internId && canEdit && onAdd(internId, { ...record, discipline: Number(record.discipline), skill: Number(record.skill), communication: Number(record.communication) })} disabled={!canEdit || !internId} className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">Simpan Evaluasi</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
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
            {(!internId || list.length === 0) ? (
              <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">{internId ? 'Belum ada evaluasi.' : 'Pilih intern terlebih dahulu.'}</td></tr>
            ) : (
              list.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.discipline}</td>
                  <td className="px-3 py-2">{r.skill}</td>
                  <td className="px-3 py-2">{r.communication}</td>
                  <td className="px-3 py-2 max-w-[260px]"><div className="line-clamp-3">{r.notes || '-'}</div></td>
                  <td className="px-3 py-2 text-right"><button onClick={()=> canEdit && onDelete(internId, idx)} disabled={!canEdit} className={`px-2 py-1 rounded-md border ${canEdit ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-200 text-slate-400 cursor-not-allowed'}`}>Hapus</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard({ auth, role, stats, selectedDate, onChangeDate, employees, attendance, attendanceMap, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onClockIn, onClockOut, evaluations, onAddEvaluation, onDeleteEvaluation, onConvertIntern }) {
  const isAdmin = auth.level === 'admin';
  const isManager = auth.level === 'employee' && (role === 'Manager' || role === 'Supervisor');
  const isStaff = auth.level === 'employee' && role === 'Staff';
  const isIntern = auth.level === 'employee' && role === 'Intern';

  if (auth.level === 'public') {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-2xl font-semibold">Silakan login untuk mengakses dashboard</div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="space-y-10">
        <StatsHeader stats={stats} selectedDate={selectedDate} onChangeDate={onChangeDate} title="Dashboard Admin" />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Manajemen Karyawan</h3>
            <EmployeeManager employees={employees} onAdd={onAddEmployee} onUpdate={onUpdateEmployee} onDelete={onDeleteEmployee} canEdit internsMode={false} />
          </div>
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Manajemen Magang</h3>
            <EmployeeManager employees={employees} onAdd={onAddEmployee} onUpdate={onUpdateEmployee} onDelete={onDeleteEmployee} canEdit internsMode />
            <div className="mt-8">
              <h4 className="font-semibold mb-3">Evaluasi Magang</h4>
              <EvaluasiIntern interns={employees.filter(e=>e.role==='Intern')} evaluations={evaluations} onAdd={onAddEvaluation} onDelete={onDeleteEvaluation} canEdit />
            </div>
          </div>
        </section>
        <section className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
          <h3 className="text-xl font-semibold mb-4">Absensi Semua</h3>
          <AttendancePanel mode={auth} employees={employees} date={selectedDate} attendanceMap={attendanceMap} onClockIn={onClockIn} onClockOut={onClockOut} allAttendance={attendance} restrictToSelf={false} />
        </section>
      </div>
    );
  }

  if (isManager) {
    return (
      <div className="space-y-10">
        <StatsHeader stats={stats} selectedDate={selectedDate} onChangeDate={onChangeDate} title={`Dashboard ${role}`} />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Kelola Karyawan</h3>
            <EmployeeManager employees={employees} onAdd={onAddEmployee} onUpdate={onUpdateEmployee} onDelete={onDeleteEmployee} canEdit internsMode={false} />
          </div>
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Kelola Magang & Evaluasi</h3>
            <EmployeeManager employees={employees} onAdd={onAddEmployee} onUpdate={onUpdateEmployee} onDelete={onDeleteEmployee} canEdit internsMode />
            <div className="mt-8">
              <h4 className="font-semibold mb-3">Evaluasi Magang</h4>
              <EvaluasiIntern interns={employees.filter(e=>e.role==='Intern')} evaluations={evaluations} onAdd={onAddEvaluation} onDelete={onDeleteEvaluation} canEdit />
            </div>
          </div>
        </section>
        <section className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
          <h3 className="text-xl font-semibold mb-4">Absensi Tim</h3>
          <AttendancePanel mode={auth} employees={employees} date={selectedDate} attendanceMap={attendanceMap} onClockIn={onClockIn} onClockOut={onClockOut} allAttendance={attendance} restrictToSelf={false} />
        </section>
      </div>
    );
  }

  if (isStaff) {
    return (
      <div className="space-y-10">
        <StatsHeader stats={stats} selectedDate={selectedDate} onChangeDate={onChangeDate} title="Dashboard Staff" />
        <section className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
          <h3 className="text-xl font-semibold mb-4">Absensi Saya</h3>
          <AttendancePanel mode={auth} employees={employees} date={selectedDate} attendanceMap={attendanceMap} onClockIn={onClockIn} onClockOut={onClockOut} allAttendance={attendance} restrictToSelf />
        </section>
      </div>
    );
  }

  if (isIntern) {
    return (
      <div className="space-y-10">
        <StatsHeader stats={stats} selectedDate={selectedDate} onChangeDate={onChangeDate} title="Dashboard Magang" />
        <section className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
          <h3 className="text-xl font-semibold mb-4">Absensi Saya</h3>
          <AttendancePanel mode={auth} employees={employees} date={selectedDate} attendanceMap={attendanceMap} onClockIn={onClockIn} onClockOut={onClockOut} allAttendance={attendance} restrictToSelf />
        </section>
        <section className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
          <h3 className="text-xl font-semibold mb-4">Tugas & Evaluasi</h3>
          <div className="text-sm text-slate-600">Hubungi mentor Anda untuk melihat atau memperbarui rencana pembelajaran. Evaluasi dapat dilihat melalui bagian HR.</div>
        </section>
      </div>
    );
  }

  return null;
}
