import { Rocket, CheckCircle } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  return (
    <header className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-medium mb-4">
            <span>HRKecil</span>
            <span className="opacity-70">SaaS HR untuk UMKM</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">Kelola Karyawan, Magang, dan Absensi dengan Ringan</h1>
          <p className="mt-4 text-slate-700">Dashboard khusus per peran: Admin, Manager, Staff, dan Magang. Fitur disesuaikan untuk kebutuhan UMKM 5–50 karyawan.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onGetStarted} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800"><Rocket size={18}/> Mulai Sekarang</button>
            <a href="#fitur" className="px-5 py-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">Lihat Fitur</a>
          </div>
        </div>
        <section id="fitur" className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["Dashboard Per Peran","Manajemen Karyawan & Magang","Absensi Harian"].map((t,i)=> (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="inline-flex items-center gap-2 text-emerald-700 mb-2"><CheckCircle size={16}/>Fitur</div>
              <div className="text-lg font-semibold text-slate-900">{t}</div>
            </div>
          ))}
        </section>
      </div>
    </header>
  );
}
