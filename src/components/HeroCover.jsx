import Spline from '@splinetool/react-spline';

function HeroCover() {
  return (
    <header className="relative w-full" style={{ height: '60vh' }}>
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/WCoEDSwacOpKBjaC/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white pointer-events-none" />

      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center">
        <div className="w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-medium mb-4">
            <span>HRKecil</span>
            <span className="opacity-70">SaaS HR untuk UMKM</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-slate-900">
            Kelola Karyawan & Absensi dengan Mudah
          </h1>
          <p className="mt-3 sm:mt-4 text-slate-700 max-w-2xl">
            Solusi ringan untuk bisnis kecil: tambah/edit data karyawan, pantau kehadiran harian, semua dalam satu dashboard sederhana.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#employees" className="px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition">Tambah Karyawan</a>
            <a href="#attendance" className="px-5 py-2.5 rounded-lg bg-white/80 backdrop-blur border border-slate-200 hover:bg-white transition">Kelola Absensi</a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeroCover;
