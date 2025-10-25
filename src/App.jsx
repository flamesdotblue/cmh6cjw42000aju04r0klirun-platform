import { useEffect, useMemo, useState } from 'react';
import Landing from './components/Landing';
import TopBar from './components/TopBar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function dateKeyFromDate(d) {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export default function App() {
  // appView: 'home' | 'login' | 'dashboard'
  const [appView, setAppView] = useState('home');

  const [employees, setEmployees] = useState([]);
  // attendance: { [yyyy-mm-dd]: { [employeeId]: { in, out, inNote, outNote } } }
  const [attendance, setAttendance] = useState({});
  // evaluations: { [internId]: { records: [{ date, discipline, skill, communication, notes }] } }
  const [evaluations, setEvaluations] = useState({});

  // auth: { level: 'public' | 'admin' | 'employee', employeeId?: string }
  const [auth, setAuth] = useState({ level: 'public' });
  const [adminPin, setAdminPin] = useState('1234');

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    try {
      const emp = JSON.parse(localStorage.getItem('hrkecil_employees') || '[]');
      const att = JSON.parse(localStorage.getItem('hrkecil_attendance') || '{}');
      const ev = JSON.parse(localStorage.getItem('hrkecil_evaluations') || '{}');
      const authSaved = JSON.parse(localStorage.getItem('hrkecil_auth') || '{"level":"public"}');
      const pinSaved = localStorage.getItem('hrkecil_admin_pin') || '1234';
      const viewSaved = localStorage.getItem('hrkecil_view') || 'home';
      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendance(att && typeof att === 'object' ? att : {});
      setEvaluations(ev && typeof ev === 'object' ? ev : {});
      setAuth(authSaved && typeof authSaved === 'object' ? authSaved : { level: 'public' });
      setAdminPin(pinSaved);
      setAppView(viewSaved);
    } catch (e) {
      setEmployees([]);
      setAttendance({});
      setEvaluations({});
      setAuth({ level: 'public' });
      setAdminPin('1234');
      setAppView('home');
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
  useEffect(() => {
    localStorage.setItem('hrkecil_admin_pin', adminPin);
  }, [adminPin]);
  useEffect(() => {
    localStorage.setItem('hrkecil_view', appView);
  }, [appView]);

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
    if (auth.level === 'employee' && auth.employeeId === id) {
      setAuth({ level: 'public' });
      setAppView('login');
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

  const findEmployee = (id) => employees.find((e) => e.id === id);

  const handleAdminLogin = (pin) => {
    if (pin === adminPin) {
      setAuth({ level: 'admin' });
      setAppView('dashboard');
    } else {
      alert('PIN Admin salah');
    }
  };

  const handleEmployeeLogin = (employeeId, pin) => {
    const emp = findEmployee(employeeId);
    if (!emp) return alert('Karyawan tidak ditemukan');
    if (String(emp.pin || '') === String(pin)) {
      setAuth({ level: 'employee', employeeId });
      setAppView('dashboard');
    } else {
      alert('PIN salah');
    }
  };

  const handleLogout = () => {
    setAuth({ level: 'public' });
    setAppView('login');
  };

  const role = auth.level === 'employee' ? findEmployee(auth.employeeId)?.role : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <TopBar
        auth={auth}
        role={role}
        onNavigate={(view) => setAppView(view)}
        onLogout={handleLogout}
      />

      {appView === 'home' && (
        <Landing onGetStarted={() => setAppView('login')} />
      )}

      {appView === 'login' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <Login
            employees={employees}
            onAdminLogin={handleAdminLogin}
            onEmployeeLogin={handleEmployeeLogin}
            onBackHome={() => setAppView('home')}
            onChangeAdminPin={(newPin) => setAdminPin(newPin)}
            isAdminLevel={auth.level === 'admin'}
          />
        </main>
      )}

      {appView === 'dashboard' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Dashboard
            auth={auth}
            role={role}
            stats={stats}
            selectedDate={selectedDate}
            onChangeDate={(d) => setSelectedDate(d)}
            employees={employees}
            attendance={attendance}
            attendanceMap={currentDayAttendance}
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
