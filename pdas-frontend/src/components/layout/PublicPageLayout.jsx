import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, FileText, Home, Moon, ShieldCheck, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CyberSenseLogo from "../auth/CyberSenseLogo";
import { PageTransition } from "../common/PageTransition";

export const LegalIntro = ({ children }) => (
  <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-[15px] leading-7 text-slate-600 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#c9d1d9]">
    {children}
  </div>
);

export const LegalSummary = ({ children }) => (
  <div className="my-6 flex gap-3 rounded-2xl border border-cyber-100 bg-cyber-50/70 p-4 text-sm leading-6 text-slate-700 dark:border-[#1f3a5f] dark:bg-[#0d1117] dark:text-[#c9d1d9]">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyber-600 text-white">
      <Check size={14} strokeWidth={3} />
    </span>
    <div><strong className="font-bold text-cyber-800 dark:text-[#58a6ff]">In brief: </strong>{children}</div>
  </div>
);

export const LegalList = ({ children }) => (
  <ul className="my-5 space-y-3">{children}</ul>
);

export const LegalListItem = ({ children }) => (
  <li className="flex gap-3 text-[15px] leading-7 text-slate-600 dark:text-[#c9d1d9]">
    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyber-500 dark:bg-[#58a6ff]" />
    <span>{children}</span>
  </li>
);

export const LegalNotice = ({ title, children }) => (
  <div className="my-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-[#bb8009]/40 dark:bg-[#1c1305]">
    <p className="font-bold text-amber-950 dark:text-amber-200">{title}</p>
    <div className="mt-2 text-sm leading-6 text-amber-900/80 dark:text-amber-200/70">{children}</div>
  </div>
);

export const LegalSection = ({ id, number, title, summary, children }) => (
  <section id={id} className="scroll-mt-28 border-t border-slate-200 py-10 first:border-t-0 first:pt-0 dark:border-[#30363d]">
    <div className="mb-5 flex items-start gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyber-600 text-sm font-extrabold text-white dark:bg-cyber-500">
        {number}
      </span>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl dark:text-[#f0f6fc]">{title}</h2>
        {summary && <p className="mt-1 text-sm text-slate-500 dark:text-[#8b949e]">{summary}</p>}
      </div>
    </div>
    <div className="space-y-4 text-[15px] leading-7 text-slate-600 dark:text-[#c9d1d9]">{children}</div>
  </section>
);

export const PublicPageLayout = ({
  title,
  children,
  tableOfContents = [],
  icon: Icon = FileText,
  subtitle,
  documentType = "Legal",
  effectiveDate = "1 July 2026",
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(tableOfContents[0]?.id || "");
  const [dark, setDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const goBack = () => window.history.length > 1 ? navigate(-1) : navigate("/");

  useEffect(() => {
    if (!tableOfContents.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    tableOfContents.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [tableOfContents]);

  return (
    <PageTransition>
      <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-[#f5f7fa] font-sans text-slate-700 selection:bg-cyber-100 selection:text-cyber-900 dark:bg-[#0d1117] dark:text-[#c9d1d9] print:bg-white" style={{ scrollBehavior: "smooth" }}>
        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl dark:border-[#30363d] dark:bg-[#010409]/80 print:static">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-80">
                <CyberSenseLogo variant="compact" iconSize="sm" />
              </Link>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button type="button" onClick={goBack} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-[#8b949e] dark:hover:bg-[#21262d] dark:hover:text-[#c9d1d9]" aria-label="Go back"><Home size={16} /></button>
              <button type="button" onClick={() => setDark((value) => !value)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-[#8b949e] dark:hover:bg-[#21262d] dark:hover:text-[#c9d1d9]" aria-label="Toggle color theme">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="ml-1 h-5 w-px bg-slate-200 dark:bg-[#30363d]" />
              <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-[#c9d1d9] dark:hover:bg-[#21262d]">Sign in</Link>
              <Link to="/register" className="flex items-center gap-1.5 rounded-lg bg-cyber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-cyber-700">
                Create account <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-[#30363d] dark:bg-[#161b22]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(13,81,140,0.08),transparent_32%),radial-gradient(circle_at_10%_85%,rgba(16,185,129,0.07),transparent_28%)] dark:bg-[radial-gradient(circle_at_80%_15%,rgba(88,166,255,0.08),transparent_32%),radial-gradient(circle_at_10%_85%,rgba(63,185,80,0.06),transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <button type="button" onClick={goBack} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-cyber-700 dark:text-[#8b949e] dark:hover:text-[#58a6ff]"><ArrowLeft size={16} /> Back</button>
            <div className="flex max-w-4xl items-start gap-5">
              <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyber-100 bg-cyber-50 text-cyber-700 shadow-sm sm:grid dark:border-[#1f3a5f] dark:bg-[#0d1117] dark:text-[#58a6ff]"><Icon size={26} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyber-600 dark:text-[#58a6ff]">{documentType}</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-[#f0f6fc] sm:text-5xl">{title}</h1>
                {subtitle && <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-[#8b949e] sm:text-lg">{subtitle}</p>}
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 dark:text-[#484f58]">
                  <span>Effective {effectiveDate}</span>
                  <span>Last updated {effectiveDate}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
          <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363d] dark:bg-[#161b22] sm:p-10 lg:p-12 print:border-0 print:p-0 print:shadow-none">
            {children}
          </article>

          {/* ── Sidebar ToC ── */}
          <aside className="order-first lg:order-last">
            {/* Mobile collapsible */}
            <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm open:pb-4 dark:border-[#30363d] dark:bg-[#161b22] lg:hidden">
              <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-[#8b949e]">On this page</summary>
              <nav className="mt-4 grid gap-1">{tableOfContents.map((item) => <a key={item.id} href={`#${item.id}`} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-[#8b949e] dark:hover:bg-[#21262d] dark:hover:text-[#f0f6fc]">{item.label}</a>)}</nav>
            </details>
            {/* Desktop sticky */}
            <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#30363d] dark:bg-[#161b22] lg:sticky lg:top-24 lg:block lg:p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-[#30363d]">
                <FileText size={17} className="text-cyber-600 dark:text-[#58a6ff]" />
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-[#8b949e]">On this page</p>
              </div>
              <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      activeSection === item.id
                        ? "bg-cyber-50 text-cyber-700 dark:bg-[#58a6ff]/10 dark:text-[#58a6ff]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-[#8b949e] dark:hover:bg-[#21262d] dark:hover:text-[#f0f6fc]"
                    }`}
                  >
                    <span>{item.label}</span><ChevronRight size={14} />
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 bg-white dark:border-[#30363d] dark:bg-[#161b22] print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-[#8b949e]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyber-50 text-cyber-600 dark:bg-[#0d1117] dark:text-[#58a6ff]"><ShieldCheck size={18} /></span>
              <span>© {new Date().getFullYear()} CyberSense. Security with clarity.</span>
            </div>
            <div className="flex gap-6 text-sm font-semibold">
              <Link to="/privacy" className="text-slate-500 hover:text-cyber-700 dark:text-[#8b949e] dark:hover:text-[#58a6ff]">Privacy Policy</Link>
              <Link to="/terms" className="text-slate-500 hover:text-cyber-700 dark:text-[#8b949e] dark:hover:text-[#58a6ff]">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div></div>
    </PageTransition>
  );
};
