import { useEffect, useMemo, useState } from 'react';
import TopNav from './components/TopNav';
import DashboardStats from './components/DashboardStats';
import WorkforceManager from './components/WorkforceManager';
import AttendancePanel from './components/AttendancePanel';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  // attendance: { [yyyy-mm-dd]: { [employeeId]: { in, out, inNote, outNote } } }
  const [attendance, setAttendance] = useState({});

  // evaluations: { [internId]: { records: [{ date, discipline, skill, communication, notes }] } }
  const [evaluations, setEvaluations] = useState({});

  // auth mode: { type: 'admin' } | { type: 'staff', employeeId }
  const [auth, setAuth] = useState({ type: 'admin' });

  // selected date for viewing/recording attendance
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    try {
      const emp = JSON.parse(localStorage.getItem('hrkecil_employees') || '[]');
      const att = JSON.parse(localStorage.getItem('hrkecil_attendance') || '{}');
      const ev = JSON.parse(localStorage.getItem('hrkecil_evaluations') || '{}');
      const authSaved = JSON.parse(localStorage.getItem('hrkecil_auth') || '{"type":"admin"}');
      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendance(att && typeof att === 'object' ? att : {});
      setEvaluations(ev && typeof ev === 'object' ? ev : {});
      setAuth(authSaved && typeof authSaved === 'object' ? authSaved : { type: 'admin' });
    } catch (e) {
      setEmployees([]);
      setAttendance({});
      setEvaluations({});
      setAuth({ type: 'admin' });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hrkecil_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('hrkecil_attendance', JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem('hrkecil_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);
  useEffect(() => {
    localStorage.setItem('hrkecil_auth', JSON.stringify(auth));
  }, [auth]);

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
    setEvaluations((prev) => {
      const cp = { ...prev };
      delete cp[id];
      return cp;
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

  const addEvaluation = (internId, record) => {
    setEvaluations((prev) => {
      const bag = prev[internId]?.records || [];
      return { ...prev, [internId]: { records: [...bag, record] } };
    });
  };

  const deleteEvaluation = (internId, idx) => {
    setEvaluations((prev) => {
      const bag = prev[internId]?.records || [];
      const next = bag.filter((_, i) => i !== idx);
      return { ...prev, [internId]: { records: next } };
    });
  };

  const convertInternToEmployee = (internId) => {
    setEmployees((prev) => prev.map((e) => {
      if (e.id !== internId) return e;
      const { school, mentor, internshipStart, internshipEnd, status, stipend, tasks, ...rest } = e;
      return { ...rest, role: 'Staff' };
    }));
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

  const currentDayAttendance = attendance[dateKeyFromDate(selectedDate)] || {};

  const getEmployeeById = (id) => employees.find((e) => e.id === id);

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
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard Admin</h2>
              <p className="text-sm text-slate-500">Mode: {auth.type === 'admin' ? 'Admin' : `Staff — ${getEmployeeById(auth.employeeId)?.name || ''}`}</p>
            </div>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 w-[200px]"
              value={dateKeyFromDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            />
          </div>
          <DashboardStats stats={stats} />
        </section>

        <section id="main" className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Manajemen Tenaga Kerja</h3>
            <WorkforceManager
              employees={employees}
              onAdd={addEmployee}
              onUpdate={updateEmployee}
              onDelete={deleteEmployee}
              isAdmin={auth.type === 'admin'}
              attendanceAll={attendance}
              evaluations={evaluations}
              onAddEvaluation={addEvaluation}
              onDeleteEvaluation={deleteEvaluation}
              onConvertIntern={convertInternToEmployee}
            />
          </div>

          <div id="attendance" className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
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

        <footer className="py-10 text-center text-slate-500">
          <p className="text-sm">© {new Date().getFullYear()} HRKecil. Dibuat untuk UMKM 5–50 karyawan.</p>
        </footer>
      </main>
    </div>
  );
}
