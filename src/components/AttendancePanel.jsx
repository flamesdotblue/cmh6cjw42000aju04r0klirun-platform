import { useMemo, useState } from 'react';

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function diffHours(inTs, outTs) {
  if (!inTs || !outTs) return '-';
  const ms = Math.max(0, outTs - inTs);
  const h = ms / 3600000;
  return `${h.toFixed(2)} jam`;
}

function AttendancePanel({ employees, attendance, onClockIn, onClockOut }) {
  const [selected, setSelected] = useState(employees[0]?.id || '');

  const todayRows = useMemo(() => {
    const map = attendance || {};
    return employees.map((e) => ({
      id: e.id,
      name: e.name,
      in: map[e.id]?.in || null,
      out: map[e.id]?.out || null,
    }));
  }, [attendance, employees]);

  const selectedRec = attendance[selected] || {};

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Pilih Karyawan</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="" disabled>
                -- pilih --
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selected && onClockIn(selected)}
              disabled={!selected}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Clock-in
            </button>
            <button
              onClick={() => selected && onClockOut(selected)}
              disabled={!selected}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Clock-out
            </button>
          </div>
        </div>
        {selected ? (
          <div className="mt-3 text-sm text-slate-600">
            Status: masuk {formatTime(selectedRec.in)} • pulang {formatTime(selectedRec.out)}
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Rekap Hari Ini</h4>
          <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-medium px-4 py-2">Nama</th>
                <th className="text-left font-medium px-4 py-2">Masuk</th>
                <th className="text-left font-medium px-4 py-2">Pulang</th>
                <th className="text-left font-medium px-4 py-2">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500 text-center">
                    Tambahkan karyawan untuk mulai mencatat absensi.
                  </td>
                </tr>
              ) : (
                todayRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2">{formatTime(r.in)}</td>
                    <td className="px-4 py-2">{formatTime(r.out)}</td>
                    <td className="px-4 py-2">{diffHours(r.in, r.out)}</td>
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

export default AttendancePanel;
