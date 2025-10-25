// Simple Promise-based localStorage-backed fake database
const EMP_KEY = 'hrkecil_employees';
const ATT_KEY = 'hrkecil_attendance';
const EVAL_KEY = 'hrkecil_evaluations';
const ADMIN_PIN_KEY = 'hrkecil_admin_pin';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function seedDemoIfEmpty() {
  const empRaw = localStorage.getItem(EMP_KEY);
  const attRaw = localStorage.getItem(ATT_KEY);
  const evalRaw = localStorage.getItem(EVAL_KEY);
  const pinRaw = localStorage.getItem(ADMIN_PIN_KEY);
  if (empRaw && attRaw && evalRaw && pinRaw) return;

  const now = Date.now();
  const dateKey = new Date().toISOString().slice(0,10);
  const seedEmployees = [
    { id: `e_${now}_1`, name: 'Ayu Pratama', email: 'manager@demo.local', role: 'Manager', startDate: dateKey, pin: '1111', targetHours: 8 },
    { id: `e_${now}_2`, name: 'Budi Santoso', email: 'supervisor@demo.local', role: 'Supervisor', startDate: dateKey, pin: '2222', targetHours: 8 },
    { id: `e_${now}_3`, name: 'Cici Lestari', email: 'staff@demo.local', role: 'Staff', startDate: dateKey, pin: '3333', targetHours: 8 },
    { id: `e_${now}_4`, name: 'Deni Ramadhan', email: 'intern@demo.local', role: 'Intern', startDate: dateKey, pin: '4444', targetHours: 6, school: 'Politeknik XYZ', mentor: 'Ayu Pratama', internshipStart: dateKey, internshipEnd: '', status: 'Aktif', tasks: ['Belajar POS', 'Input stok'] },
  ];
  const seedAttendance = {
    [dateKey]: {
      [seedEmployees[0].id]: { in: Date.now() - 7*3600000, out: Date.now() - 1*3600000, inNote: 'Datang awal', outNote: 'Pulang' },
      [seedEmployees[2].id]: { in: Date.now() - 6*3600000 },
    }
  };
  const seedEvaluations = {
    [seedEmployees[3].id]: {
      records: [
        { date: dateKey, discipline: 4, skill: 3, communication: 4, notes: 'Progres baik minggu ini.' },
      ],
    },
  };
  localStorage.setItem(EMP_KEY, JSON.stringify(seedEmployees));
  localStorage.setItem(ATT_KEY, JSON.stringify(seedAttendance));
  localStorage.setItem(EVAL_KEY, JSON.stringify(seedEvaluations));
  localStorage.setItem(ADMIN_PIN_KEY, '1234');
}

export async function getEmployees() {
  await delay(50);
  return JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
}
export async function setEmployees(list) {
  await delay(20);
  localStorage.setItem(EMP_KEY, JSON.stringify(list));
}

export async function getAttendance() {
  await delay(50);
  return JSON.parse(localStorage.getItem(ATT_KEY) || '{}');
}
export async function setAttendance(map) {
  await delay(20);
  localStorage.setItem(ATT_KEY, JSON.stringify(map));
}

export async function getEvaluations() {
  await delay(50);
  return JSON.parse(localStorage.getItem(EVAL_KEY) || '{}');
}
export async function setEvaluations(map) {
  await delay(20);
  localStorage.setItem(EVAL_KEY, JSON.stringify(map));
}

export async function getAdminPin() {
  await delay(10);
  return localStorage.getItem(ADMIN_PIN_KEY) || '1234';
}
export async function setAdminPin(pin) {
  await delay(10);
  localStorage.setItem(ADMIN_PIN_KEY, String(pin));
}

export async function verifyAdminPin(pin) {
  const saved = await getAdminPin();
  return String(saved) === String(pin);
}
export async function verifyEmployeePin(employeeId, pin) {
  const list = await getEmployees();
  const e = list.find((x) => x.id === employeeId);
  if (!e) return false;
  return String(e.pin || '') === String(pin);
}

export async function addEmployee(emp) {
  const list = await getEmployees();
  const id = emp.id || `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const newEmp = { ...emp, id };
  list.push(newEmp);
  await setEmployees(list);
  return newEmp;
}

export async function updateEmployee(id, patch) {
  const list = await getEmployees();
  const next = list.map((e) => (e.id === id ? { ...e, ...patch } : e));
  await setEmployees(next);
}

export async function deleteEmployee(id) {
  const list = await getEmployees();
  const next = list.filter((e) => e.id !== id);
  await setEmployees(next);
  const att = await getAttendance();
  const copy = { ...att };
  Object.keys(copy).forEach((day) => {
    if (!copy[day]) return;
    if (copy[day][id]) {
      const { [id]: _, ...rest } = copy[day];
      copy[day] = rest;
    }
  });
  await setAttendance(copy);
  const ev = await getEvaluations();
  delete ev[id];
  await setEvaluations(ev);
}

export async function clockIn(employeeId, dateKey, note) {
  const att = await getAttendance();
  const day = { ...(att[dateKey] || {}) };
  const rec = day[employeeId] || {};
  if (!rec.in) {
    rec.in = Date.now();
    if (note) rec.inNote = note;
  }
  day[employeeId] = rec;
  const next = { ...att, [dateKey]: day };
  await setAttendance(next);
}

export async function clockOut(employeeId, dateKey, note) {
  const att = await getAttendance();
  const day = { ...(att[dateKey] || {}) };
  const rec = day[employeeId] || {};
  if (rec.in && !rec.out) {
    rec.out = Date.now();
    if (note) rec.outNote = note;
  }
  day[employeeId] = rec;
  const next = { ...att, [dateKey]: day };
  await setAttendance(next);
}

export async function addEvaluation(internId, record) {
  const ev = await getEvaluations();
  const bag = ev[internId]?.records || [];
  ev[internId] = { records: [...bag, record] };
  await setEvaluations(ev);
}

export async function deleteEvaluation(internId, idx) {
  const ev = await getEvaluations();
  const bag = ev[internId]?.records || [];
  ev[internId] = { records: bag.filter((_, i) => i !== idx) };
  await setEvaluations(ev);
}

export async function convertInternToEmployee(internId) {
  const list = await getEmployees();
  const next = list.map((e) => {
    if (e.id !== internId) return e;
    const { school, mentor, internshipStart, internshipEnd, status, tasks, ...rest } = e;
    return { ...rest, role: 'Staff' };
  });
  await setEmployees(next);
}
