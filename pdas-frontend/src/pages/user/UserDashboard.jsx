import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Globe2,
  Mail,
  Menu,
  MessageSquareText,
  Moon,
  Play,
  RefreshCw,
  ScanLine,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import DashboardSidebar, { DASHBOARD_NAV_ITEMS } from "../../components/dashboard/DashboardSidebar";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import { useAuth } from "../../hooks/useAuth";
import { awarenessService } from "../../services/awarenessService";
import { dashboardService } from "../../services/dashboardService";
import { emailService } from "../../services/emailService";
import { reportService } from "../../services/reportService";
import { scanService } from "../../services/scanService";

const EMPTY_STATS = {
  totalScans: 0,
  safeScans: 0,
  suspiciousScans: 0,
  phishingScans: 0,
  recentScans: 0,
  totalReports: 0,
  unreadNotifications: 0,
};

const ACTIONS = [
  { type: "url", title: "Scan URL", helper: "Check a web address", Icon: Globe2, tone: "blue" },
  { type: "email", title: "Analyze Email", helper: "Inspect suspicious content", Icon: Mail, tone: "violet" },
  { type: "sms", title: "Scan SMS", helper: "Check a text message", Icon: MessageSquareText, tone: "amber" },
  { type: "report", title: "Report a Threat", helper: "Send content for review", Icon: ShieldAlert, tone: "rose" },
];

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

const getInitials = (name = "User") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const prefix = sameDay
    ? "Today"
    : date.toDateString() === yesterday.toDateString()
      ? "Yesterday"
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${prefix}, ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
};

const percent = (value, total) => (total ? `${((value / total) * 100).toFixed(1)}% of total` : "No scans yet");

function RiskRing({ score = 0 }) {
  const normalized = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const color = normalized >= 70 ? "#ef4444" : normalized >= 35 ? "#f59e0b" : "#10b981";
  return (
    <div
      className="grid h-11 w-11 place-items-center rounded-full text-xs font-bold"
      style={{ background: `conic-gradient(${color} ${normalized * 3.6}deg, #e2e8f0 0)` }}
      aria-label={`Risk score ${normalized}`}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-100">
        {normalized}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && (
        <button type="button" onClick={onAction} className="flex items-center gap-1 text-sm font-semibold text-cyber-600 hover:text-cyber-700 dark:text-cyber-300">
          {action}<ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function ActionModal({ action, onClose, onComplete }) {
  const [content, setContent] = useState("");
  const [reportType, setReportType] = useState("url");
  const [submitting, setSubmitting] = useState(false);
  const config = ACTIONS.find((item) => item.type === action);
  if (!config) return null;
  const { Icon } = config;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      let response;
      if (action === "url") response = await scanService.scanUrl(content.trim());
      if (action === "sms") response = await scanService.scanSms(content.trim());
      if (action === "email") response = await emailService.analyze(content.trim());
      if (action === "report") {
        response = await reportService.create({ report_type: reportType, content: content.trim() });
      }
      toast.success(action === "report" ? "Threat report submitted." : "Analysis complete.");
      onComplete(response?.data);
    } catch (error) {
      toast.error(error?.message || "We could not complete that request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClasses[config.tone]}`}><Icon size={20} /></span>
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">{config.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{config.helper}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          {action === "report" && (
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Content type
              <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyber-500 focus:ring-4 focus:ring-cyber-500/10 dark:border-slate-700 dark:bg-slate-950">
                <option value="url">URL</option><option value="email">Email</option><option value="sms">SMS</option>
              </select>
            </label>
          )}
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {action === "url" ? "Web address" : action === "email" ? "Email content" : action === "sms" ? "Message content" : "Suspicious content"}
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={action === "url" ? 3 : 7}
              placeholder={action === "url" ? "https://example.com" : "Paste the content you want CyberSense to inspect…"}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyber-500 focus:bg-white focus:ring-4 focus:ring-cyber-500/10 dark:border-slate-700 dark:bg-slate-950 dark:focus:bg-slate-950"
            />
          </label>
          <button disabled={submitting || !content.trim()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyber-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-cyber-600/20 transition hover:-translate-y-0.5 hover:bg-cyber-700 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            {submitting ? "Processing…" : action === "report" ? "Submit report" : "Run analysis"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [scans, setScans] = useState([]);
  const [reports, setReports] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("cybersense-sidebar-collapsed") === "true");
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [activeSection, setActiveSection] = useState("overview");
  const [dark, setDark] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showAllScans, setShowAllScans] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);

  const loadDashboard = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const [statsResponse, scansResponse, reportsResponse, lessonsResponse] = await Promise.all([
        dashboardService.getStats(),
        scanService.list({ page: 1, page_size: 10 }),
        reportService.list({ page: 1, page_size: 8 }),
        awarenessService.list({ page: 1, page_size: 8 }),
      ]);
      setStats({ ...EMPTY_STATS, ...(statsResponse.data || {}) });
      setScans(scansResponse.data || []);
      setReports(reportsResponse.data || []);
      setLessons(lessonsResponse.data || []);
    } catch (error) {
      toast.error(error?.message || "Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    localStorage.setItem("cybersense-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event) => {
      setIsDesktop(event.matches);
      if (event.matches) setSidebarOpen(false);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sidebarOpen]);

  useEffect(() => {
    let frame = null;
    const updateActiveSection = () => {
      const offset = 120;
      let current = DASHBOARD_NAV_ITEMS[0].id;
      DASHBOARD_NAV_ITEMS.forEach(({ id }) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= offset) current = id;
      });
      setActiveSection((value) => value === current ? value : current);
    };
    const schedule = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => { frame = null; updateActiveSection(); });
    };
    updateActiveSection();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const statCards = useMemo(() => [
    { label: "Total Scans", value: stats.totalScans, detail: `+${stats.recentScans} this week`, color: "blue", Icon: ScanLine },
    { label: "Safe", value: stats.safeScans, detail: percent(stats.safeScans, stats.totalScans), color: "emerald", Icon: CheckCircle2 },
    { label: "Suspicious", value: stats.suspiciousScans, detail: percent(stats.suspiciousScans, stats.totalScans), color: "amber", Icon: AlertTriangle },
    { label: "Phishing Found", value: stats.phishingScans, detail: percent(stats.phishingScans, stats.totalScans), color: "rose", Icon: ShieldAlert },
  ], [stats]);

  const visibleScans = showAllScans ? scans : scans.slice(0, 5);
  const visibleReports = showAllReports ? reports : reports.slice(0, 4);
  const displayUsername = user?.username || user?.full_name?.split(/\s+/)[0] || "there";

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const statTones = {
    blue: { line: "bg-cyber-600", icon: "bg-cyber-50 text-cyber-600 dark:bg-cyber-500/10 dark:text-cyber-300", detail: "text-cyber-600 dark:text-cyber-300" },
    emerald: { line: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300", detail: "text-emerald-600 dark:text-emerald-300" },
    amber: { line: "bg-amber-500", icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", detail: "text-amber-600 dark:text-amber-300" },
    rose: { line: "bg-rose-500", icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300", detail: "text-rose-600 dark:text-rose-300" },
  };
  const effectiveCollapsed = collapsed && isDesktop;

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-[#f5f8fc] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={effectiveCollapsed} onToggleCollapse={() => setCollapsed((value) => !value)} activeSection={activeSection} onSectionChange={scrollTo} onSignOut={handleLogout} />

        <div className={`transition-[padding] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${effectiveCollapsed ? "lg:pl-[84px]" : "lg:pl-64"}`}>
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 sm:px-7">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Open navigation"><Menu size={22} /></button>
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">User dashboard</p><p className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">Your personal security command centre</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadDashboard(true)} className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Refresh dashboard"><RefreshCw size={19} className={refreshing ? "animate-spin" : ""} /></button>
              <button onClick={() => setDark((value) => !value)} className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
              <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`${stats.unreadNotifications} unread notifications`}><Bell size={19} />{stats.unreadNotifications > 0 && <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{Math.min(stats.unreadNotifications, 99)}</span>}</button>
              <div className="ml-1 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyber-600 to-cyber-800 text-sm font-bold text-white shadow-lg shadow-cyber-700/20">{getInitials(user?.full_name)}</div>
            </div>
          </header>

          <main className="mx-auto max-w-[1500px] space-y-10 px-4 py-7 sm:px-7 lg:px-9">
            {loading ? <DashboardSkeleton /> : (
            <>
            <section id="overview" className="scroll-mt-28 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-cyber-900 to-cyber-700 p-6 text-white shadow-2xl shadow-cyber-950/15 sm:p-8">
              <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
                <div><p className="mb-2 text-sm font-semibold text-cyan-200">Welcome back</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, @{displayUsername}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Monitor your digital safety, inspect suspicious content, and stay ahead of emerging threats.</p></div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span><div><p className="text-sm font-bold">Scanning engine active</p><p className="text-xs text-slate-300">Protection services online</p></div></div>
              </div>
            </section>

            <section id="quick-actions" className="scroll-mt-28">
              <SectionHeader title="Quick Actions" subtitle="Run a security check or report suspicious content." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {ACTIONS.map(({ type, title, helper, Icon, tone }) => <button key={type} onClick={() => setActiveAction(type)} className="group rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-cyber-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyber-700"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${toneClasses[tone]}`}><Icon size={21} /></span><h3 className="mt-5 font-bold text-slate-950 dark:text-white">{title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p><span className="mt-5 flex items-center gap-1 text-xs font-bold text-cyber-600 dark:text-cyber-300">Open tool <ChevronRight size={14} className="transition group-hover:translate-x-1" /></span></button>)}
              </div>
            </section>

            <section>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">My security stats</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {statCards.map(({ label, value, detail, color, Icon }) => { const tone = statTones[color]; return <article key={label} className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className={`absolute inset-x-0 top-0 h-1 ${tone.line}`} /><div className="flex items-start justify-between"><div><p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{Number(value).toLocaleString()}</p><p className="mt-2 font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className={`mt-1.5 text-sm font-semibold ${tone.detail}`}>{detail}</p></div><span className={`grid h-14 w-14 place-items-center rounded-2xl ${tone.icon}`}><Icon size={24} /></span></div></article>; })}
              </div>
            </section>

            <section id="recent-scans" className="scroll-mt-28">
              <SectionHeader title="Recent scan activity" subtitle="Your latest security checks and their outcomes." action={scans.length > 5 ? (showAllScans ? "Show less" : "View all") : null} onAction={() => setShowAllScans((value) => !value)} />
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="hidden grid-cols-[minmax(280px,2fr)_120px_100px_130px_150px] border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 md:grid"><span>Target</span><span>Type</span><span>Risk</span><span>Result</span><span>Date</span></div>
                {loading ? <div className="grid place-items-center py-16"><RefreshCw className="animate-spin text-cyber-600" /></div> : visibleScans.length ? visibleScans.map((scan) => <div key={scan.scan_id} className="grid gap-4 border-b border-slate-100 px-5 py-5 last:border-0 dark:border-slate-800 md:grid-cols-[minmax(280px,2fr)_120px_100px_130px_150px] md:items-center md:px-6"><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{scan.target}</p><p className="mt-1 truncate text-xs font-medium uppercase tracking-wider text-slate-400">{scan.scan_id?.slice(0, 8)}</p></div><div className="flex items-center gap-2 text-sm font-semibold capitalize text-slate-500"><CircleUserRound size={16} />{scan.scan_type}</div><RiskRing score={scan.risk_score} /><span className={`text-sm font-bold capitalize ${scan.classification === "safe" ? "text-emerald-600" : scan.classification === "suspicious" ? "text-amber-600" : "text-rose-600"}`}>{scan.classification}</span><span className="text-sm text-slate-500">{formatDate(scan.analyzed_at)}</span></div>) : <div className="px-6 py-16 text-center"><ShieldCheck className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-semibold">No scans yet</p><button onClick={() => setActiveAction("url")} className="mt-2 text-sm font-bold text-cyber-600">Run your first scan</button></div>}
              </div>
            </section>

            <section id="reports" className="scroll-mt-28">
              <SectionHeader title="My Reports" subtitle={`${stats.totalReports} submitted threat ${stats.totalReports === 1 ? "report" : "reports"}.`} action={reports.length > 4 ? (showAllReports ? "Show less" : "View all") : null} onAction={() => setShowAllReports((value) => !value)} />
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {visibleReports.length ? visibleReports.map((report) => <div key={report.report_id} className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 last:border-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{report.content}</p><p className="mt-1.5 flex items-center gap-3 text-xs font-medium capitalize text-slate-500"><span>{report.report_type}</span><span>{formatDate(report.created_at)}</span></p></div><span className={`shrink-0 text-sm font-bold capitalize ${report.status === "confirmed" ? "text-rose-600" : report.status === "false_positive" ? "text-emerald-600" : report.status === "under_review" ? "text-blue-600" : "text-slate-500"}`}>{report.status?.replace("_", " ")}</span></div>) : <div className="px-6 py-14 text-center text-sm text-slate-500">You have not submitted any reports.</div>}
              </div>
            </section>

            <section id="training" className="scroll-mt-28 pb-8">
              <SectionHeader title="Awareness Training" subtitle="Short, practical lessons that strengthen your security instincts." />
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {lessons.length ? lessons.slice(0, 4).map((lesson) => <div key={lesson.content_id} className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 last:border-0 dark:border-slate-800 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"><BookOpen size={20} /></span><div className="min-w-0 flex-1"><p className="font-bold text-slate-900 dark:text-white">{lesson.title}</p><p className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold capitalize text-slate-500"><span>{lesson.category}</span><span>{lesson.difficulty}</span><span>{lesson.duration_minutes || 5} min</span></p></div><button onClick={() => setSelectedLesson(lesson)} className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"><Play size={14} /> Start</button></div>) : <div className="px-6 py-14 text-center text-sm text-slate-500">Training content will appear here when published.</div>}
              </div>
            </section>
            </>
            )}
          </main>
        </div>
      </div>
      {activeAction && <ActionModal action={activeAction} onClose={() => setActiveAction(null)} onComplete={() => { setActiveAction(null); loadDashboard(true); }} />}
      {selectedLesson && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedLesson(null)}><article className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">{selectedLesson.category} · {selectedLesson.duration_minutes || 5} min</p><h2 className="mt-2 text-2xl font-extrabold dark:text-white">{selectedLesson.title}</h2></div><button onClick={() => setSelectedLesson(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X /></button></div><p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">{selectedLesson.body || selectedLesson.description}</p></article></div>}
    </div>
  );
}
