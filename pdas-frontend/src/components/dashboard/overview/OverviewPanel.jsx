import { AlertTriangle, ArrowRight, FileWarning, ScanLine, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AwarenessTraining from "../../awareness/AwarenessTraining";
import RecentScans from "../../scan/RecentScans";
import StatCard from "./StatCard";

export default function OverviewPanel({ user, stats, scans, reports, lessons, loading }) {
  const navigate = useNavigate();
  const threats = Number(stats.phishingScans || 0) + Number(stats.suspiciousScans || 0);
  const pending = reports.filter((report) => ["pending", "under_review"].includes(report.status)).length;
  const latest = scans[0];
  return (
    <div className="space-y-7">
      <section className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><p className="text-sm font-bold text-cyber-600">Welcome back, {user?.full_name?.split(" ")[0] || user?.username}</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight dark:text-white">Your security looks {threats ? "like it needs attention" : "on track"}.</h1><p className="mt-3 max-w-2xl text-slate-500">{latest ? `Your latest ${latest.scan_type} scan was classified as ${latest.classification}.` : "Run your first scan to establish a safety baseline."}</p></div>
        <div className="flex items-center gap-4"><span className={`grid h-16 w-16 place-items-center rounded-2xl ${threats ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{threats ? <AlertTriangle size={30} /> : <ShieldCheck size={30} />}</span><button type="button" onClick={() => navigate("/dashboard/url-scan")} className="flex min-h-11 items-center gap-2 rounded-xl bg-cyber-600 px-5 font-bold text-white hover:bg-cyber-700">Run a scan <ArrowRight size={17} /></button></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3"><StatCard label="Total scans" value={stats.totalScans} icon={ScanLine} /><StatCard label="Threats found" value={threats} icon={AlertTriangle} tone={threats ? "rose" : "blue"} /><StatCard label="Pending reports" value={pending} icon={FileWarning} tone={pending ? "amber" : "blue"} /></section>
      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-extrabold dark:text-white">Recent activity</h2><p className="text-sm text-slate-500">Your latest three checks.</p></div><button type="button" onClick={() => navigate("/dashboard/activity")} className="text-sm font-bold text-cyber-600">View all</button></div><RecentScans scans={scans} loading={loading} compact onScan={() => navigate("/dashboard/url-scan")} /></section>
      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-extrabold dark:text-white">Recommended training</h2><p className="text-sm text-slate-500">One useful lesson for your next step.</p></div><button type="button" onClick={() => navigate("/dashboard/training")} className="text-sm font-bold text-violet-600">Browse training</button></div><AwarenessTraining lessons={lessons} loading={loading} compact /></section>
    </div>
  );
}
