import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function diffHours(inTs, outTs) {
  if (!inTs || !outTs) return 0;
  const ms = Math.max(0, outTs - inTs);
  return ms / 3600000;
}

export default function AttendancePanel({ mode, employees, date, attendanceMap, onClockIn, onClockOut, allAttendance }) {
  const [selected, setSelected] = useState(employees[0]?.id || '');
  const [note, setNote] = useState('');
  const [internOnly, setInternOnly] = useState(false);

  const isAdmin = mode.type === 'admin';
  const activeEmployeeId = isAdmin ? selected : mode.employeeId;

  const filteredEmployees = useMemo(() => {
    return internOnly ? employees.filter((e) => e.role === 'Intern') : employees;
  }, [employees, internOnly]);

  const todayRows = useMemo(() => {
    const map = attendanceMap || {};
    const source = filteredEmployees;
    return source.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      targetHours: Number(e.targetHours || 8),
      in: map[e.id]?.in || null,
      out: map[e.id]?.out || null,
      inNote: map[e.id]?.inNote || '',
      outNote: map[e.id]?.outNote || '',
    }));
  }, [attendanceMap, filteredEmployees]);

  const selectedRec = attendanceMap[activeEmployeeId] || {};

  const rowsWithOvertime = todayRows.map((r) => {
    const hours = diffHours(r.in, r.out);
    const overtime = r.out ? Math.max(0, hours - r.targetHours) : 0;
    return { ...r, hours, overtime };
  });

  const exportAttendanceCSV = (fromDate, toDate) => {
    const fromKey = dateKeyFromDate(fromDate);
    const toKey = dateKeyFromDate(toDate);
    const keys = Object.keys(allAttendance || {}).filter((k) => k >= fromKey && k <= toKey).sort();
    const rows = [["Tanggal","Nama","Email","Jabatan","Masuk","Pulang","Durasi (jam)","Catatan Masuk","Catatan Pulang"]];
    const empMap = new Map(employees.map((e) => [e.id, e]));
    keys.forEach((k) => {
      const day = allAttendance[k] || {};
      Object.entries(day).forEach(([empId, rec]) => {
        const emp = empMap.get(empId);
        if (!emp) return;
        if (internOnly && emp.role !== 'Intern') return;
        const hours = diffHours(rec.in, rec.out);
        rows.push([
          k,
          emp.name,
          emp.email,
          emp.role,
          rec.in ? new Date(rec.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          rec.out ? new Date(rec.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          hours ? hours.toFixed(2) : '0',
          rec.inNote || '',
          rec.outNote || '',
        ]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${internOnly ? 'interns_' : ''}${fromKey}_${toKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [rangeFrom, setRangeFrom] = useState(dateKeyFromDate(date));
  const [rangeTo, setRangeTo] = useState(dateKeyFromDate(date));

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">{isAdmin ? 'Pilih Karyawan' : 'Karyawan'}</label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={internOnly} onChange={(e)=>setInternOnly(e.target.checked)} />
                Hanya Magang
              </label>
            </div>
            {isAdmin ? (
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="" disabled>-- pilih --</option>
                {filteredEmployees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm">{employees.find((e) => e.id === mode.employeeId)?.name}</div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional)"
              className="hidden sm:block flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              onClick={() => activeEmployeeId && onClockIn(activeEmployeeId, note, date)}
              disabled={!activeEmployeeId}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Clock-in
            </button>
            <button
              onClick={() => activeEmployeeId && onClockOut(activeEmployeeId, note, date)}
              disabled={!activeEmployeeId}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Clock-out
            </button>
          </div>
        </div>
        <div className="sm:hidden mt-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        {activeEmployeeId ? (
          <div className="mt-3 text-sm text-slate-600">
            Status: masuk {formatTime(attendanceMap[activeEmployeeId]?.in)} • pulang {formatTime(attendanceMap[activeEmployeeId]?.out)}
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
          <h4 className="font-semibold">Rekap {new Date(date).toLocaleDateString()}</h4>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <span>Dari</span>
              <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" />
              <span>Sampai</span>
              <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" />
            </div>
            <button onClick={() => exportAttendanceCSV(rangeFrom, rangeTo)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><Download size={16}/>Ekspor Absensi</button>
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
                <th className="text-left font-medium px-4 py-2">Target</th>
                <th className="text-left font-medium px-4 py-2">Lembur</th>
                <th className="text-left font-medium px-4 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rowsWithOvertime.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500 text-center">
                    Tambahkan karyawan untuk mulai mencatat absensi.
                  </td>
                </tr>
              ) : (
                rowsWithOvertime.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2">{r.role}</td>
                    <td className="px-4 py-2">{formatTime(r.in)}</td>
                    <td className="px-4 py-2">{formatTime(r.out)}</td>
                    <td className="px-4 py-2">{r.out ? `${r.hours.toFixed(2)} jam` : '-'}</td>
                    <td className="px-4 py-2">{r.targetHours.toFixed(2)} jam</td>
                    <td className="px-4 py-2">{r.out ? `${r.overtime.toFixed(2)} jam` : '-'}</td>
                    <td className="px-4 py-2 max-w-[280px]">
                      <div className="text-xs text-slate-600">In: {r.inNote || '-'}</div>
                      <div className="text-xs text-slate-600">Out: {r.outNote || '-'}</div>
                    </td>
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
