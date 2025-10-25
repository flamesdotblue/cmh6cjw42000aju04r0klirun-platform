import { useEffect, useMemo, useState } from 'react';
import HeroCover from './components/HeroCover';
import DashboardStats from './components/DashboardStats';
import EmployeeManager from './components/EmployeeManager';
import AttendancePanel from './components/AttendancePanel';

function todayKey() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 10);
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});

  // Load from localStorage
  useEffect(() => {
    try {
      const emp = JSON.parse(localStorage.getItem('hrkecil_employees') || '[]');
      const att = JSON.parse(localStorage.getItem('hrkecil_attendance') || '{}');
      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendance(att && typeof att === 'object' ? att : {});
    } catch (e) {
      setEmployees([]);
      setAttendance({});
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('hrkecil_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('hrkecil_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const addEmployee = (emp) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setEmployees((prev) => [...prev, { ...emp, id }]);
  };

  const updateEmployee = (id, patch) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    // Optionally clean attendance records for this employee
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
  };

  const clockIn = (employeeId) => {
    const key = todayKey();
    const ts = Date.now();
    setAttendance((prev) => {
      const day = { ...(prev[key] || {}) };
      const rec = day[employeeId] || {};
      if (!rec.in) {
        rec.in = ts;
      }
      day[employeeId] = rec;
      return { ...prev, [key]: day };
    });
  };

  const clockOut = (employeeId) => {
    const key = todayKey();
    const ts = Date.now();
    setAttendance((prev) => {
      const day = { ...(prev[key] || {}) };
      const rec = day[employeeId] || {};
      if (rec.in && !rec.out) {
        rec.out = ts;
      }
      day[employeeId] = rec;
      return { ...prev, [key]: day };
    });
  };

  const stats = useMemo(() => {
    const key = todayKey();
    const day = attendance[key] || {};
    const present = Object.values(day).filter((r) => r.in).length;
    const clockedOut = Object.values(day).filter((r) => r.out).length;
    return {
      totalEmployees: employees.length,
      presentToday: present,
      clockedOutToday: clockedOut,
    };
  }, [attendance, employees]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <HeroCover />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 relative z-10">
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard Admin</h2>
            <span className="text-sm text-slate-500">HRKecil • UMKM</span>
          </div>
          <DashboardStats stats={stats} />
        </section>

        <section id="employees" className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Manajemen Karyawan</h3>
            <EmployeeManager
              employees={employees}
              onAdd={addEmployee}
              onUpdate={updateEmployee}
              onDelete={deleteEmployee}
            />
          </div>

          <div id="attendance" className="bg-white rounded-2xl shadow border border-slate-100 p-6 sm:p-7">
            <h3 className="text-xl font-semibold mb-4">Absensi Sederhana</h3>
            <AttendancePanel
              employees={employees}
              attendance={attendance[todayKey()] || {}}
              onClockIn={clockIn}
              onClockOut={clockOut}
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

export default App;
