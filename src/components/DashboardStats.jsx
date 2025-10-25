function StatCard({ label, value, accent }) {
  return (
    <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      {accent ? <div className="mt-3 h-1.5 rounded-full" style={{ background: accent }} /> : null}
    </div>
  );
}

export default function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Total Karyawan" value={stats.totalEmployees || 0} accent="linear-gradient(90deg,#6366f1,#22d3ee)" />
      <StatCard label="Hadir (Tanggal Dipilih)" value={stats.presentToday || 0} accent="linear-gradient(90deg,#22c55e,#a3e635)" />
      <StatCard label="Sudah Clock-out" value={stats.clockedOutToday || 0} accent="linear-gradient(90deg,#f59e0b,#f97316)" />
    </div>
  );
}
