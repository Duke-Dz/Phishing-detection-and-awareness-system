import { ScanLine } from "lucide-react";
import EmptyState from "../dashboard/shared/EmptyState";
import RiskRing from "./RiskRing";

const date = (value) => value ? new Date(value).toLocaleString() : "—";
const resultTone = (value) => value === "safe" ? "text-emerald-600" : value === "suspicious" ? "text-amber-600" : "text-rose-600";

export default function RecentScans({ scans = [], loading, compact = false, onScan }) {
  const rows = compact ? scans.slice(0, 3) : scans;
  return (
    <section>
      {!compact && <div className="mb-5"><h1 className="text-3xl font-extrabold dark:text-white">Scan Activity</h1><p className="mt-2 text-slate-500">Review recent checks and risk outcomes.</p></div>}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden grid-cols-[minmax(180px,2fr)_100px_90px_120px_170px] border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 md:grid"><span>Target</span><span>Type</span><span>Risk</span><span>Result</span><span>Date</span></div>
        {loading ? <div className="animate-pulse space-y-3 p-6">{[1,2,3].map((item) => <div key={item} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          : !rows.length ? <EmptyState icon={ScanLine} title="No scans yet" description="Run a scan to begin building your security history." action="Run a scan" onAction={onScan} />
          : rows.map((scan) => <article key={scan.scan_id} className="border-b border-slate-100 p-5 last:border-0 dark:border-slate-800 md:grid md:grid-cols-[minmax(180px,2fr)_100px_90px_120px_170px] md:items-center md:px-6">
            <div className="min-w-0"><p className="truncate font-bold dark:text-white">{scan.target}</p><p className="mt-1 text-xs text-slate-400 md:hidden">Target</p></div>
            <dl className="mt-4 grid grid-cols-2 gap-4 md:contents"><div><dt className="text-xs text-slate-400 md:hidden">Type</dt><dd className="text-sm font-semibold capitalize text-slate-500">{scan.scan_type}</dd></div><div><dt className="text-xs text-slate-400 md:hidden">Risk score</dt><dd><RiskRing score={scan.risk_score} /></dd></div><div><dt className="text-xs text-slate-400 md:hidden">Classification</dt><dd className={`text-sm font-bold capitalize ${resultTone(scan.classification)}`}>{scan.classification}</dd></div><div><dt className="text-xs text-slate-400 md:hidden">Date</dt><dd className="text-sm text-slate-500">{date(scan.analyzed_at || scan.created_at)}</dd></div></dl>
          </article>)}
      </div>
    </section>
  );
}
