import { Link2, Mail, MessageSquareText, ScanLine } from "lucide-react";
import EmptyState from "../dashboard/shared/EmptyState";
import RiskRing from "./RiskRing";
import RiskScoreKey from "./RiskScoreKey";

const formatDate = (value) => {
  if (!value) return { date: "Not available", time: "" };
  const parsed = new Date(value);
  return {
    date: parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
};

const typeMeta = {
  url: { label: "URL", Icon: Link2, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
  email: { label: "Email", Icon: Mail, tone: "bg-violet-50 text-violet-700 ring-violet-200" },
  sms: { label: "SMS", Icon: MessageSquareText, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
};

const resultTone = {
  safe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  suspicious: "bg-amber-50 text-amber-700 ring-amber-200",
  phishing: "bg-rose-50 text-rose-700 ring-rose-200",
};

const contentPreview = (target, scanType) => {
  const value = String(target || "No content available").replace(/\s+/g, " ").trim();
  if (scanType === "url") {
    try {
      const parsed = new URL(value);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.hostname}${path}`.slice(0, 52);
    } catch {
      return value.slice(0, 52);
    }
  }
  return value.length > 48 ? `${value.slice(0, 48)}…` : value;
};

export default function RecentScans({ scans = [], loading, compact = false, onScan }) {
  const rows = compact ? scans.slice(0, 3) : scans;
  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-[#34383d] dark:bg-[#17191c]">
      {!compact && <div className="grid gap-4 border-b border-slate-300 px-5 py-4 dark:border-slate-700 sm:px-6 lg:grid-cols-[1fr_360px] lg:items-center"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Scan history</h1><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">View your previous scans, results, and detection dates.</p></div><RiskScoreKey compact /></div>}
      {loading ? <div className="animate-pulse space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>
        : !rows.length ? <EmptyState icon={ScanLine} title="No scans yet" description="Run a scan to begin building your security history." action="Run a scan" onAction={onScan} />
        : <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] table-fixed border-collapse text-left">
            <caption className="sr-only">Your scan history, including target, scanner type, risk score, result, and scan date.</caption>
            <colgroup><col className="w-[34%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[17%]" /><col className="w-[21%]" /></colgroup>
            <thead className="bg-slate-100 dark:bg-slate-950/70">
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <th scope="col" className="border-r border-slate-300 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Scanned content</th>
                <th scope="col" className="border-r border-slate-300 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Scanner</th>
                <th scope="col" className="border-r border-slate-300 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Risk score</th>
                <th scope="col" className="border-r border-slate-300 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Result</th>
                <th scope="col" className="px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:text-slate-300">Scanned on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {rows.map((scan) => {
                const type = typeMeta[scan.scan_type] || { label: scan.scan_type || "Other", Icon: ScanLine, tone: "bg-slate-100 text-slate-700 ring-slate-200" };
                const TypeIcon = type.Icon;
                const scannedAt = formatDate(scan.analyzed_at || scan.created_at);
                return <tr key={scan.scan_id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="border-r border-slate-300 px-6 py-2.5 dark:border-slate-700"><p className="block truncate text-sm font-semibold text-slate-950 dark:text-white" title={scan.target}>{contentPreview(scan.target, scan.scan_type)}</p><p className="mt-0.5 text-xs font-medium text-slate-600">Scan #{String(scan.scan_id).slice(0, 8)}</p></td>
                  <td className="border-r border-slate-300 px-4 py-2.5 dark:border-slate-700"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${type.tone}`}><TypeIcon size={13} strokeWidth={2.2} />{type.label}</span></td>
                  <td className="border-r border-slate-300 px-4 py-2.5 dark:border-slate-700"><div className="flex justify-center"><RiskRing score={scan.risk_score} compact /></div></td>
                  <td className="border-r border-slate-300 px-4 py-2.5 dark:border-slate-700"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${resultTone[scan.classification] || "bg-slate-100 text-slate-700 ring-slate-300"}`}>{scan.classification || "Unknown"}</span></td>
                  <td className="whitespace-nowrap px-6 py-2.5"><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{scannedAt.date}</p><p className="mt-0.5 text-xs text-slate-500">{scannedAt.time}</p></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
    </section>
  );
}
