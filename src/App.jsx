import { useEffect, useMemo, useState } from 'react';
import TopNav from './components/TopNav';
import EmployeeManager from './components/EmployeeManager';
import AttendancePanel from './components/AttendancePanel';
import InternPanel from './components/InternPanel';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function weekStartMonday(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  // attendance: { [yyyy-mm-dd]: { [employeeId]: { in, out, inNote, outNote } } }
  const [attendance, setAttendance] = useState({});
  // auth mode: { type: 'admin' } | { type: 'staff', employeeId }
  const [auth, setAuth] = useState({ type: 'admin' });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // leaves: array
  const [leaves, setLeaves] = useState([]);
  // learning logs: array
  const [learningLogs, setLearningLogs] = useState([]);
  // timesheet approvals: { [employeeId_weekStartKey]: { status, submittedAt, approvedBy, approvedAt } }
  const [timesheetApprovals, setTimesheetApprovals] = useState({});

  useEffect(() => {
    try {
      const emp = JSON.parse(localStorage.getItem('hrkecil_employees') || '[]');
      const att = JSON.parse(localStorage.getItem('hrkecil_attendance') || '{}');
      const authSaved = JSON.parse(localStorage.getItem('hrkecil_auth') || '{"type":"admin"}');
      const lv = JSON.parse(localStorage.getItem('hrkecil_leaves') || '[]');
      const logs = JSON.parse(localStorage.getItem('hrkecil_learning_logs') || '[]');
      const ts = JSON.parse(localStorage.getItem('hrkecil_timesheet_approvals') || '{}');
      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendance(att && typeof att === 'object' ? att : {});
      setAuth(authSaved && typeof authSaved === 'object' ? authSaved : { type: 'admin' });
      setLeaves(Array.isArray(lv) ? lv : []);
      setLearningLogs(Array.isArray(logs) ? logs : []);
      setTimesheetApprovals(ts && typeof ts === 'object' ? ts : {});
    } catch (e) {
      setEmployees([]);
      setAttendance({});
      setAuth({ type: 'admin' });
      setLeaves([]);
      setLearningLogs([]);
      setTimesheetApprovals({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hrkecil_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('hrkecil_attendance', JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem('hrkecil_auth', JSON.stringify(auth));
  }, [auth]);
  useEffect(() => {
    localStorage.setItem('hrkecil_leaves', JSON.stringify(leaves));
  }, [leaves]);
  useEffect(() => {
    localStorage.setItem('hrkecil_learning_logs', JSON.stringify(learningLogs));
  }, [learningLogs]);
  useEffect(() => {
    localStorage.setItem('hrkecil_timesheet_approvals', JSON.stringify(timesheetApprovals));
  }, [timesheetApprovals]);

  const addEmployee = (emp) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setEmployees((prev) => [...prev, { ...emp, id }]);
  };

  const updateEmployee = (id, patch) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setAttendance((prev) => {
      const copy = { ...prev };
      for (const day of Object.keys(copy)) {
        if (copy[day] && copy[day][id]) {
          const { [id]: _, ...rest } = copy[day];
          copy[day] = rest;
        }
      }
      return copy;
    });
    setLeaves((prev) => prev.filter((l) => l.employeeId !== id));
    setLearningLogs((prev) => prev.filter((l) => l.employeeId !== id));
    setTimesheetApprovals((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        if (k.startsWith(id + '_')) delete copy[k];
      });
      return copy;
    });
    if (auth.type === 'staff' && auth.employeeId === id) {
      setAuth({ type: 'admin' });
    }
  };

  const clockIn = (employeeId, note, date) => {
    const key = dateKeyFromDate(date || selectedDate);
    const ts = Date.now();
    setAttendance((prev) => {
      const day = { ...(prev[key] || {}) };
      const rec = day[employeeId] || {};
      if (!rec.in) {
        rec.in = ts;
        if (note) rec.inNote = note;
      }
      day[employeeId] = rec;
      return { ...prev, [key]: day };
    });
  };

  const clockOut = (employeeId, note, date) => {
    const key = dateKeyFromDate(date || selectedDate);
    const ts = Date.now();
    setAttendance((prev) => {
      const day = { ...(prev[key] || {}) };
      const rec = day[employeeId] || {};
      if (rec.in && !rec.out) {
        rec.out = ts;
        if (note) rec.outNote = note;
      }
      day[employeeId] = rec;
      return { ...prev, [key]: day };
    });
  };

  // Leaves
  const createLeave = (payload) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setLeaves((prev) => [
      ...prev,
      {
        id,
        employeeId: payload.employeeId,
        type: payload.type,
        dateFrom: payload.dateFrom,
        dateTo: payload.dateTo,
        reason: payload.reason || '',
        status: 'Pending',
        createdAt: Date.now(),
      },
    ]);
  };
  const reviewLeave = (leaveId, action, reviewerName) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? { ...l, status: action === 'approve' ? 'Approved' : 'Rejected', reviewedBy: reviewerName, reviewedAt: Date.now() }
          : l
      )
    );
  };

  // Learning logs
  const addLearningLog = (employeeId, date, content) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setLearningLogs((prev) => [...prev, { id, employeeId, date: dateKeyFromDate(date), content, createdAt: Date.now() }]);
  };
  const commentLearningLog = (logId, comment, reviewerName) => {
    setLearningLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, comment, reviewedBy: reviewerName, reviewedAt: Date.now() } : l)));
  };

  // Timesheet approvals
  const timesheetKey = (employeeId, weekStartDate) => `${employeeId}_${dateKeyFromDate(weekStartDate)}`;
  const submitTimesheet = (employeeId, weekStartDate) => {
    const key = timesheetKey(employeeId, weekStartDate);
    setTimesheetApprovals((prev) => ({ ...prev, [key]: { status: 'Pending', submittedAt: Date.now() } }));
  };
  const approveTimesheet = (employeeId, weekStartDate, reviewerName, approve = true) => {
    const key = timesheetKey(employeeId, weekStartDate);
    setTimesheetApprovals((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), status: approve ? 'Approved' : 'Rejected', approvedBy: reviewerName, approvedAt: Date.now() } }));
  };

  const stats = useMemo(() => {
    const key = dateKeyFromDate(selectedDate);
    const day = attendance[key] || {};
    const present = Object.values(day).filter((r) => r.in).length;
    const clockedOut = Object.values(day).filter((r) => r.out).length;
    return {
      totalEmployees: employees.length,
      presentToday: present,
      clockedOutToday: clockedOut,
    };
  }, [attendance, employees, selectedDate]);

  const reviewerName = useMemo(() => {
    if (auth.type === 'admin') return 'Admin';
    const emp = employees.find((e) => e.id === auth.employeeId);
    return emp ? emp.name : 'Staff';
  }, [auth, employees]);

  const currentDayAttendance = attendance[dateKeyFromDate(selectedDate)] || {};

  const exportWeekCSV = (employeeId, weekStart) => {
    const start = weekStartMonday(weekStart);
    const rows = [['Tanggal', 'Masuk', 'Pulang', 'Durasi (jam)']];
    const emp = employees.find((e) => e.id === employeeId);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dateKeyFromDate(d);
      const rec = (attendance[key] || {})[employeeId] || {};
      const inTs = rec.in;
      const outTs = rec.out;
      const ms = inTs && outTs ? Math.max(0, outTs - inTs) : 0;
      const h = (ms / 3600000).toFixed(2);
      rows.push([
        key,
        inTs ? new Date(inTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        outTs ? new Date(outTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        ms ? h : '0',
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${emp?.name || employeeId}_${dateKeyFromDate(start)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAdmin = auth.type === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <TopNav
        auth={auth}
        onLoginStaff={(employeeId) => setAuth({ type: 'staff', employeeId })}
        onLogout={() => setAuth({ type: 'admin' })}
        listEmployees={employees}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h2>
              <p className="text-sm text-slate-500">Mode: {isAdmin ? 'Admin' : 'Staff'}{!isAdmin ? ` — ${employees.find(e=>e.id===auth.employeeId)?.name || ''}` : ''}</p>
            </div>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 w-[200px]"
              value={dateKeyFromDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="text-sm text-slate-500">Total Karyawan</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">{stats.totalEmployees}</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="text-sm text-slate-500">Hadir (Tanggal Dipilih)</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">{stats.presentToday}</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="text-sm text-slate-500">Sudah Clock-out</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">{stats.clockedOutToday}</div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Manajemen Karyawan</h3>
            <EmployeeManager
              employees={employees}
              onAdd={addEmployee}
              onUpdate={updateEmployee}
              onDelete={deleteEmployee}
              isAdmin={isAdmin}
            />
          </div>

          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Absensi</h3>
            <AttendancePanel
              mode={auth}
              employees={employees}
              date={selectedDate}
              attendanceMap={currentDayAttendance}
              onClockIn={clockIn}
              onClockOut={clockOut}
              allAttendance={attendance}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Panel Intern</h3>
            <InternPanel
              mode={auth}
              employees={employees}
              attendance={attendance}
              date={selectedDate}
              leaves={leaves}
              onCreateLeave={createLeave}
              onApproveLeave={(leaveId) => reviewLeave(leaveId, 'approve', reviewerName)}
              onRejectLeave={(leaveId) => reviewLeave(leaveId, 'reject', reviewerName)}
              learningLogs={learningLogs}
              onAddLearningLog={addLearningLog}
              onCommentLearningLog={(logId, comment) => commentLearningLog(logId, comment, reviewerName)}
              timesheetApprovals={timesheetApprovals}
              onSubmitTimesheet={submitTimesheet}
              onApproveTimesheet={(employeeId, weekStart, approve) => approveTimesheet(employeeId, weekStart, reviewerName, approve)}
              exportWeekCSV={exportWeekCSV}
            />
          </div>
        </section>

        <footer className="py-10 text-center text-slate-500">
          <p className="text-sm">© {new Date().getFullYear()} HRKecil. Dibuat untuk UMKM 5–50 karyawan.</p>
        </footer>
      </main>
    </div>
  );
}
