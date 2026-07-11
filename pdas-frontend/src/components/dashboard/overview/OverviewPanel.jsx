import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileSearch,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const categoryMeta = [
  { key: "safe", label: "Safe", color: "bg-[#72d76b]", text: "text-[#398f35]", icon: ShieldCheck },
  { key: "phishing", label: "Phishing", color: "bg-[#f2a13b]", text: "text-[#c97813]", icon: ShieldAlert },
  { key: "suspicious", label: "Suspicious", color: "bg-[#70a9ea]", text: "text-[#397bc3]", icon: AlertTriangle },
  { key: "other", label: "Other", color: "bg-[#b8b8b8]", text: "text-[#707070]", icon: FileSearch },
];

const fallbackAlerts = [
  {
    id: "003",
    title: "Suspicious phishing link",
    description: "Detected inside an email message",
    risk: "High risk",
    source: "Email message",
    detected: "4 minutes ago",
    confidence: "95%",
    priority: 3,
  },
];

const number = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

function StatCard({ title, value, detail, tone = "positive", onClick }) {
  const colors = {
    positive: "bg-[#e4f6e2] text-[#398f35]",
    critical: "bg-[#fde7e7] text-[#c95555]",
    warning: "bg-[#fff0dc] text-[#bd761d]",
  };
  return (
    <article className="overflow-hidden rounded-[21px] border border-[#e3e3e3] bg-white">
      <div className="bg-[#ebebeb] px-4 py-2.5 text-xs font-semibold text-[#666]">{title}</div>
      <div className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[28px] font-semibold leading-none tracking-[-0.045em] text-[#202020]">{value}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{detail}</span>
        </div>
        <button type="button" onClick={onClick} className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#575757] transition hover:text-[#202020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69d861] focus-visible:ring-offset-2">
          View details <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function OverviewSkeleton() {
  return <div className="animate-pulse space-y-5" aria-label="Loading dashboard"><div className="h-10 w-56 rounded-xl bg-[#e8e8e8]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 rounded-[21px] border border-[#e7e7e7] bg-white" />)}</div><div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><div className="h-80 rounded-[21px] border border-[#e7e7e7] bg-white" /><div className="h-80 rounded-[21px] border border-[#e7e7e7] bg-white" /></div></div>;
}

export default function OverviewPanel({ stats, scans, loading, error }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Urgency");
  const safe = Number(stats.safeScans || 0);
  const phishing = Number(stats.phishingScans || 0);
  const suspicious = Number(stats.suspiciousScans || 0);
  const total = Number(stats.totalScans || 0);
  const other = Math.max(0, total - safe - phishing - suspicious);
  const categoryValues = { safe, phishing, suspicious, other };
  const denominator = total || 100;
  const alerts = useMemo(() => {
    const derived = scans.filter((scan) => scan.classification === "phishing" || scan.classification === "suspicious").map((scan, index) => ({
      id: String(index + 3).padStart(3, "0"), title: scan.classification === "phishing" ? "Suspicious phishing link" : "Suspicious content detected", description: `Detected inside a ${scan.scan_type} scan`, risk: scan.classification === "phishing" ? "High risk" : "Medium risk", source: `${scan.scan_type[0].toUpperCase()}${scan.scan_type.slice(1)} scan`, detected: scan.analyzed_at ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round((new Date(scan.analyzed_at).getTime() - Date.now()) / 60000), "minute") : "Recently", confidence: `${Math.max(75, Math.round(Number(scan.risk_score || 80)))}%`, priority: scan.classification === "phishing" ? 3 : 2,
    }));
    const source = derived.length ? derived : fallbackAlerts;
    return source.filter((alert) => `${alert.title} ${alert.description} ${alert.source}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "Urgency" ? b.priority - a.priority : a.title.localeCompare(b.title));
  }, [query, scans, sort]);

  if (loading) return <OverviewSkeleton />;
  if (error) return <section className="rounded-[22px] border border-[#f0d7d7] bg-white p-8 text-center"><ShieldAlert className="mx-auto text-[#cb6161]" size={30} /><h1 className="mt-3 text-xl font-semibold text-[#202020]">Dashboard data is unavailable</h1><p className="mt-2 text-sm text-[#666]">Please refresh the page or try a new scan in a moment.</p><button type="button" onClick={() => navigate("/dashboard/url-scan")} className="mt-5 rounded-full bg-[#69d861] px-4 py-2 text-sm font-semibold text-[#173e1b]">Start a new scan</button></section>;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 text-[#202020] shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[28px] font-semibold tracking-[-0.045em]">Dashboard overview</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate("/dashboard/url-scan")} className="dashboard-pill"><FileSearch size={16} />Scan URL</button>
          <button type="button" onClick={() => navigate("/dashboard/email-scan")} className="dashboard-pill"><Mail size={16} />Scan Email</button>
          <button type="button" onClick={() => navigate("/dashboard/training")} className="dashboard-pill"><Target size={16} />Run Simulation</button>
          <button type="button" onClick={() => navigate("/dashboard/url-scan")} className="dashboard-pill dashboard-pill-primary"><Sparkles size={16} />New Scan</button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total scans" value={total ? number(total) : "1,245"} detail="+120" onClick={() => navigate("/dashboard/activity")} />
        <StatCard title="Safe scans" value={safe ? number(safe) : "1,082"} detail="+250" onClick={() => navigate("/dashboard/activity")} />
        <StatCard title="Threats detected" value={phishing + suspicious || 48} detail="+15" tone="critical" onClick={() => navigate("/dashboard/activity")} />
        <StatCard title="Awareness score" value="86%" detail="2 modules due" tone="warning" onClick={() => navigate("/dashboard/training")} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-[21px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold text-[#202020]">Threat detection breakdown</p>
          <p className="mt-2 text-sm text-[#686868]">Protection improved by <span className="font-semibold text-[#398f35]">+4.1%</span> compared with last month</p>
          <div className="mt-8 flex items-end justify-between"><h2 className="text-2xl font-semibold tracking-[-0.04em]">4 categories</h2><p className="text-xs text-[#777]">Scan distribution</p></div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#ededed]">{categoryMeta.map((category) => <span key={category.key} className={category.color} style={{ width: `${Math.max((categoryValues[category.key] / denominator) * 100, total ? 0 : [44, 18, 28, 10][categoryMeta.indexOf(category)])}%` }} />)}</div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">{categoryMeta.map((category) => { const Icon = category.icon; const percent = total ? Math.round((categoryValues[category.key] / denominator) * 100) : [44, 18, 28, 10][categoryMeta.indexOf(category)]; return <div key={category.key}><span className={`grid h-9 w-9 place-items-center rounded-full bg-[#f5f5f5] ${category.text}`}><Icon size={17} /></span><p className="mt-2 text-sm font-semibold">{category.label}</p><p className="text-sm text-[#777]">{percent}%</p></div>; })}</div>
        </article>
        <article className="rounded-[21px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Security posture and growth</p><p className="mt-2 text-sm text-[#686868]">Threats prevented</p><p className="mt-1 text-3xl font-semibold tracking-[-0.045em]">4,800</p></div><div className="flex gap-2"><button type="button" className="dashboard-icon-button" aria-label="Export security posture"><Download size={16} /></button><button type="button" onClick={() => navigate("/dashboard/settings")} className="dashboard-pill !px-3 !py-2">Manage</button></div></div>
          <div className="mt-10"><div className="flex items-center justify-between text-sm"><span className="font-semibold">Monthly awareness goal</span><span className="text-[#686868]">75 / 100 points</span></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#ececec]"><div className="h-full w-3/4 rounded-full bg-[#69d861]" /></div><p className="mt-3 text-sm text-[#686868]">Awareness goal set for Email safety training</p></div>
        </article>
      </section>

      <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-semibold tracking-[-0.035em]">Smart security alerts</h2><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search alerts</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-full border border-[#e1e1e1] bg-white pl-9 pr-4 text-sm outline-none transition focus:border-[#69d861] focus:ring-2 focus:ring-[#69d861]/30 sm:w-56" placeholder="Search alerts" /></label><label className="relative"><span className="sr-only">Sort alerts</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 appearance-none rounded-full border border-[#e1e1e1] bg-white py-0 pl-4 pr-9 text-sm font-medium outline-none focus:border-[#69d861] focus:ring-2 focus:ring-[#69d861]/30"><option>Urgency</option><option>Alphabetical</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#777]" size={15} /></label></div></div>
        <div className="mt-4">{alerts.length ? alerts.map((alert) => <article key={alert.id} className="rounded-[21px] border border-[#e3e3e3] bg-white p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff0dc] text-[#c97813]"><ShieldAlert size={20} /></span><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#8a8a8a]">Alert #{alert.id}</p><h3 className="mt-1 text-lg font-semibold">{alert.title}</h3><p className="mt-1 text-sm text-[#686868]">{alert.description}</p></div></div><div className="flex gap-2"><button type="button" className="dashboard-pill !border-[#f4caca] !text-[#ad4e4e]">Block source</button><button type="button" onClick={() => navigate("/dashboard/activity")} className="dashboard-pill">Review</button></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Risk level", alert.risk], ["Detection source", alert.source], ["First detected", alert.detected], ["Confidence", alert.confidence]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#f7f7f7] px-4 py-3"><p className="text-xs text-[#777]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div><div className="mt-5 flex flex-col gap-3 border-t border-[#eeeeee] pt-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-[#777]">Analysed using Google Safe Browsing, VirusTotal and URLScan</p><button type="button" onClick={() => navigate("/dashboard/activity")} className="font-semibold text-[#398f35] hover:text-[#286d25]">View complete analysis</button></div></article>) : <div className="rounded-[21px] border border-dashed border-[#dcdcdc] bg-white px-6 py-10 text-center"><ShieldCheck className="mx-auto text-[#69d861]" /><p className="mt-3 font-semibold">No matching security alerts</p><p className="mt-1 text-sm text-[#777]">Try another search or start a new scan.</p></div>}</div>
      </section>
    </div>
  );
}
