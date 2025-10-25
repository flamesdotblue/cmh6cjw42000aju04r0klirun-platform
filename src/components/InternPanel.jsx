import { useMemo, useState } from 'react';
import { Check, X, Download, FileText, Calendar } from 'lucide-react';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}
function weekStartMonday(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}
function diffHours(inTs, outTs) {
  if (!inTs || !outTs) return 0;
  const ms = Math.max(0, outTs - inTs);
  return ms / 3600000;
}

export default function InternPanel({
  mode,
  employees,
  attendance,
  date,
  leaves,
  onCreateLeave,
  onApproveLeave,
  onRejectLeave,
  learningLogs,
  onAddLearningLog,
  onCommentLearningLog,
  timesheetApprovals,
  onSubmitTimesheet,
  onApproveTimesheet,
  exportWeekCSV,
}) {
  const interns = useMemo(() => employees.filter((e) => e.role === 'Intern'), [employees]);
  const isAdmin = mode.type === 'admin';
  const [selectedIntern, setSelectedIntern] = useState(() => (isAdmin ? interns[0]?.id || '' : mode.employeeId));

  const activeInternId = isAdmin ? selectedIntern : mode.employeeId;
  const activeIntern = employees.find((e) => e.id === activeInternId);

  // Week view
  const [weekAnchor, setWeekAnchor] = useState(weekStartMonday(date));
  const weekDays = useMemo(() => {
    const start = weekStartMonday(weekAnchor);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekAnchor]);
  const weeklyHours = useMemo(() => {
    if (!activeInternId) return 0;
    return weekDays.reduce((sum, d) => {
      const rec = (attendance[dateKeyFromDate(d)] || {})[activeInternId] || {};
      return sum + diffHours(rec.in, rec.out);
    }, 0);
  }, [attendance, weekDays, activeInternId]);
  const weekKey = activeInternId ? `${activeInternId}_${dateKeyFromDate(weekStartMonday(weekAnchor))}` : '';
  const tsStatus = timesheetApprovals[weekKey]?.status || 'Draft';

  // Leave data
  const leavesForIntern = useMemo(() => leaves.filter((l) => l.employeeId === activeInternId).sort((a,b)=>b.createdAt-a.createdAt), [leaves, activeInternId]);
  const [leaveForm, setLeaveForm] = useState({ type: 'Sakit', dateFrom: dateKeyFromDate(date), dateTo: dateKeyFromDate(date), reason: '' });

  // Learning logs
  const logsForIntern = useMemo(() => learningLogs.filter((l) => l.employeeId === activeInternId).sort((a,b)=>b.createdAt-a.createdAt), [learningLogs, activeInternId]);
  const [logText, setLogText] = useState('');

  const canManage = isAdmin; // supervisor logic can be extended to allow supervisor names to approve

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Intern</label>
              {isAdmin ? (
                <select
                  value={selectedIntern}
                  onChange={(e) => setSelectedIntern(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="" disabled>-- pilih --</option>
                  {interns.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} — {e.supervisor ? `Supervisor: ${e.supervisor}` : 'Tanpa supervisor'}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm">{activeIntern?.name}</div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setWeekAnchor(new Date(weekStartMonday(weekAnchor).getTime() - 7*24*3600*1000))}
                className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
              >Sebelumnya</button>
              <button
                onClick={() => setWeekAnchor(new Date(weekStartMonday(weekAnchor).getTime() + 7*24*3600*1000))}
                className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
              >Berikutnya</button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Tanggal</th>
                  <th className="text-left font-medium px-4 py-2">Masuk</th>
                  <th className="text-left font-medium px-4 py-2">Pulang</th>
                  <th className="text-left font-medium px-4 py-2">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weekDays.map((d) => {
                  const key = dateKeyFromDate(d);
                  const rec = (attendance[key] || {})[activeInternId] || {};
                  const hours = diffHours(rec.in, rec.out);
                  return (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{d.toLocaleDateString()} ({['Sen','Sel','Rab','Kam','Jum','Sab','Min'][(d.getDay()+6)%7]})</td>
                      <td className="px-4 py-2">{rec.in ? new Date(rec.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="px-4 py-2">{rec.out ? new Date(rec.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="px-4 py-2">{rec.out ? `${hours.toFixed(2)} jam` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">Total Mingguan: <span className="font-semibold">{weeklyHours.toFixed(2)} jam</span></div>
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">Target: <span className="font-semibold">{Number(activeIntern?.weeklyTargetHours || 0)} jam</span></div>
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">Status Timesheet: <span className="font-semibold">{tsStatus}</span></div>
            <button onClick={() => activeInternId && exportWeekCSV(activeInternId, weekAnchor)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><Download size={16}/>Ekspor Timesheet</button>
            {activeInternId ? (
              tsStatus === 'Draft' ? (
                <button onClick={() => onSubmitTimesheet(activeInternId, weekStartMonday(weekAnchor))} className="px-3 py-2 rounded-lg bg-slate-900 text-white">Ajukan Timesheet</button>
              ) : canManage ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => onApproveTimesheet(activeInternId, weekStartMonday(weekAnchor), true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white"><Check size={16}/>Setujui</button>
                  <button onClick={() => onApproveTimesheet(activeInternId, weekStartMonday(weekAnchor), false)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-600 text-white"><X size={16}/>Tolak</button>
                </div>
              ) : null
            ) : null}
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-2 text-slate-700"><Calendar size={16}/> Izin/Cuti</div>
            <div className="grid grid-cols-1 gap-2">
              <select value={leaveForm.type} onChange={(e)=>setLeaveForm({...leaveForm,type:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white">
                <option>Sakit</option>
                <option>Izin</option>
                <option>Kampus</option>
              </select>
              <div className="flex gap-2">
                <input type="date" value={leaveForm.dateFrom} onChange={(e)=>setLeaveForm({...leaveForm,dateFrom:e.target.value})} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white"/>
                <input type="date" value={leaveForm.dateTo} onChange={(e)=>setLeaveForm({...leaveForm,dateTo:e.target.value})} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white"/>
              </div>
              <input placeholder="Alasan (opsional)" value={leaveForm.reason} onChange={(e)=>setLeaveForm({...leaveForm,reason:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2 bg-white"/>
              <button onClick={()=> activeInternId && onCreateLeave({ employeeId: activeInternId, ...leaveForm })} disabled={!activeInternId} className="px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">Ajukan</button>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 max-h-[360px] overflow-auto">
            <div className="font-medium mb-2">Pengajuan Terakhir</div>
            <div className="space-y-2">
              {leavesForIntern.length === 0 ? (
                <div className="text-sm text-slate-500">Belum ada pengajuan.</div>
              ) : leavesForIntern.map((l) => (
                <div key={l.id} className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{l.type} • {l.dateFrom} → {l.dateTo}</div>
                    <div className={`text-xs px-2 py-1 rounded ${l.status==='Approved'?'bg-emerald-100 text-emerald-700':l.status==='Rejected'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700'}`}>{l.status}</div>
                  </div>
                  {l.reason ? <div className="text-xs text-slate-600 mt-1">Alasan: {l.reason}</div> : null}
                  {canManage && l.status==='Pending' ? (
                    <div className="mt-2 flex gap-2">
                      <button onClick={()=>onApproveLeave(l.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 text-white text-xs"><Check size={14}/>Setujui</button>
                      <button onClick={()=>onRejectLeave(l.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-600 text-white text-xs"><X size={14}/>Tolak</button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2 mb-3 text-slate-700"><FileText size={16}/> Learning Log</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            <textarea value={logText} onChange={(e)=>setLogText(e.target.value)} placeholder="Apa yang dipelajari / dikerjakan hari ini..." className="w-full h-28 rounded-lg border border-slate-300 px-3 py-2 bg-white"/>
            <button onClick={()=> activeInternId && logText.trim() && onAddLearningLog(activeInternId, new Date(), logText.trim()) && setLogText('')} disabled={!activeInternId || !logText.trim()} className="px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">Tambah Log</button>
          </div>
          <div className="md:col-span-2">
            <div className="max-h-[260px] overflow-auto space-y-2">
              {logsForIntern.length === 0 ? (
                <div className="text-sm text-slate-500">Belum ada learning log.</div>
              ) : logsForIntern.map((lg) => (
                <div key={lg.id} className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs text-slate-500">{lg.date}</div>
                  <div className="text-sm mt-1 whitespace-pre-wrap">{lg.content}</div>
                  {lg.comment ? <div className="mt-2 text-xs text-emerald-700">Komentar: {lg.comment}</div> : null}
                  {canManage ? (
                    <div className="mt-2">
                      <input placeholder="Tulis komentar..." onKeyDown={(e)=>{ if(e.key==='Enter'){ onCommentLearningLog(lg.id, e.currentTarget.value); e.currentTarget.value='';}}} className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"/>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
