import { useEffect, useMemo, useState } from 'react';
import TopBar from './components/TopBar';
import Landing from './components/Landing';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import * as DB from './components/FakeDB';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export default function App() {
  // Simple hash router: #/, #/login, #/dashboard
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/');

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [adminPin, setAdminPin] = useState('1234');

  // auth: { level: 'public' | 'admin' | 'employee', employeeId?: string }
  const [auth, setAuth] = useState({ level: 'public' });

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Router listener
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Initial load + seed demo database
  useEffect(() => {
    (async () => {
      await DB.seedDemoIfEmpty();
      const [emp, att, ev, pin] = await Promise.all([
        DB.getEmployees(),
        DB.getAttendance(),
        DB.getEvaluations(),
        DB.getAdminPin(),
      ]);
      setEmployees(emp);
      setAttendance(att);
      setEvaluations(ev);
      setAdminPin(pin);
    })();
  }, []);

  // Persist writes from UI actions
  const refreshFromDB = async () => {
    const [emp, att, ev, pin] = await Promise.all([
      DB.getEmployees(),
      DB.getAttendance(),
      DB.getEvaluations(),
      DB.getAdminPin(),
    ]);
    setEmployees(emp);
    setAttendance(att);
    setEvaluations(ev);
    setAdminPin(pin);
  };

  const findEmployee = (id) => employees.find((e) => e.id === id);

  const role = auth.level === 'employee' ? findEmployee(auth.employeeId)?.role : null;

  // Actions (DB-backed)
  const handleAdminLogin = async (pin) => {
    const ok = await DB.verifyAdminPin(pin);
    if (ok) {
      setAuth({ level: 'admin' });
      window.location.hash = '/dashboard';
    } else {
      alert('PIN Admin salah');
    }
  };

  const handleEmployeeLogin = async (employeeId, pin) => {
    const ok = await DB.verifyEmployeePin(employeeId, pin);
    if (!ok) return alert('PIN salah atau karyawan tidak ditemukan');
    setAuth({ level: 'employee', employeeId });
    window.location.hash = '/dashboard';
  };

  const handleLogout = () => {
    setAuth({ level: 'public' });
    window.location.hash = '/login';
  };

  const handleChangeAdminPin = async (newPin) => {
    await DB.setAdminPin(newPin);
    await refreshFromDB();
  };

  const addEmployee = async (emp) => {
    await DB.addEmployee(emp);
    await refreshFromDB();
  };

  const updateEmployee = async (id, patch) => {
    await DB.updateEmployee(id, patch);
    await refreshFromDB();
  };

  const deleteEmployee = async (id) => {
    await DB.deleteEmployee(id);
    if (auth.level === 'employee' && auth.employeeId === id) setAuth({ level: 'public' });
    await refreshFromDB();
  };

  const clockIn = async (employeeId, note, date) => {
    const key = dateKeyFromDate(date || selectedDate);
    await DB.clockIn(employeeId, key, note);
    await refreshFromDB();
  };

  const clockOut = async (employeeId, note, date) => {
    const key = dateKeyFromDate(date || selectedDate);
    await DB.clockOut(employeeId, key, note);
    await refreshFromDB();
  };

  const addEvaluation = async (internId, record) => {
    await DB.addEvaluation(internId, record);
    await refreshFromDB();
  };

  const deleteEvaluation = async (internId, idx) => {
    await DB.deleteEvaluation(internId, idx);
    await refreshFromDB();
  };

  const convertInternToEmployee = async (internId) => {
    await DB.convertInternToEmployee(internId);
    await refreshFromDB();
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

  const attendanceMap = attendance[dateKeyFromDate(selectedDate)] || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <TopBar
        auth={auth}
        role={role}
        onNavigate={(path) => (window.location.hash = path)}
        onLogout={handleLogout}
      />

      {route === '/' && (
        <Landing onGetStarted={() => (window.location.hash = '/login')} />
      )}

      {route === '/login' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <Login
            employees={employees}
            onAdminLogin={handleAdminLogin}
            onEmployeeLogin={handleEmployeeLogin}
            onBackHome={() => (window.location.hash = '/')}
            onChangeAdminPin={handleChangeAdminPin}
            isAdminLevel={auth.level === 'admin'}
          />
        </main>
      )}

      {route === '/dashboard' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Dashboard
            auth={auth}
            role={role}
            stats={stats}
            selectedDate={selectedDate}
            onChangeDate={(d) => setSelectedDate(d)}
            employees={employees}
            attendance={attendance}
            attendanceMap={attendanceMap}
            onAddEmployee={addEmployee}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
            onClockIn={clockIn}
            onClockOut={clockOut}
            evaluations={evaluations}
            onAddEvaluation={addEvaluation}
            onDeleteEvaluation={deleteEvaluation}
            onConvertIntern={convertInternToEmployee}
          />
        </main>
      )}
    </div>
  );
}
