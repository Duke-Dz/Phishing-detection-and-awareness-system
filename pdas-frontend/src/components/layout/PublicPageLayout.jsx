import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  FileCheck2,
  FileText,
  Moon,
  ShieldCheck,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CyberSenseLogo from "../auth/CyberSenseLogo";

export const LegalIntro = ({ children }) => (
  <aside aria-label="Document overview" className="mb-12 border-l-2 border-cyber-500 py-0.5 pl-5 sm:pl-6 dark:border-sky-400">
    <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyber-700 dark:text-sky-400">
      <FileCheck2 size={14} strokeWidth={2.2} aria-hidden="true" />
      Document overview
    </div>
    <p className="mt-3 text-base font-medium leading-7 text-slate-700 dark:text-slate-300">{children}</p>
  </aside>
);

export const LegalSummary = ({ children }) => (
  <aside aria-label="Section summary" className="my-6 flex gap-3.5 border-l-2 border-cyber-400 bg-cyber-50/60 px-4 py-3.5 text-sm leading-6 text-slate-700 dark:border-sky-500 dark:bg-sky-950/20 dark:text-slate-300">
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyber-600 text-white dark:bg-sky-400 dark:text-slate-950">
      <Check size={12} strokeWidth={3} aria-hidden="true" />
    </span>
    <div>
      <strong className="font-extrabold text-cyber-900 dark:text-sky-300">In brief: </strong>
      {children}
    </div>
  </aside>
);

export const LegalList = ({ children }) => (
  <ul className="my-5 space-y-3.5">{children}</ul>
);

export const LegalListItem = ({ children }) => (
  <li className="flex gap-3.5 text-base leading-7 text-slate-600 dark:text-slate-300">
    <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyber-500 dark:bg-sky-400" />
    <span>{children}</span>
  </li>
);

export const LegalNotice = ({ title, children }) => (
  <aside aria-label={title} className="my-7 border-l-2 border-amber-500 bg-amber-50/70 px-4 py-4 dark:border-amber-400 dark:bg-amber-950/20">
    <div className="flex items-start gap-3">
      <TriangleAlert size={18} strokeWidth={2.3} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
      <div>
        <p className="font-extrabold leading-6 text-amber-950 dark:text-amber-200">{title}</p>
        <div className="mt-1.5 text-sm leading-6 text-amber-950/75 dark:text-amber-100/75">{children}</div>
      </div>
    </div>
  </aside>
);

export const LegalSection = ({ id, number, title, summary, children }) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 border-t border-slate-200 py-11 first:border-t-0 first:pt-0 dark:border-slate-800">
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3.5">
      <span aria-hidden="true" className="mt-1 font-mono text-[11px] font-bold tracking-[0.12em] text-cyber-600 dark:text-sky-400">
        {String(number).padStart(2, "0")}
      </span>
      <div>
        <h2 id={`${id}-heading`} className="text-[1.35rem] font-extrabold leading-tight tracking-[-0.025em] text-slate-950 sm:text-2xl dark:text-white">{title}</h2>
        {summary && <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{summary}</p>}
      </div>
    </div>
    <div className="mt-5 space-y-4 text-base leading-7 text-slate-600 sm:pl-[3.375rem] dark:text-slate-300">{children}</div>
  </section>
);

const DocumentNavigation = ({ activeSection, items, title, onNavigate, mobile = false }) => (
  <nav className={mobile ? "mt-4 grid gap-0.5 border-t border-slate-200 pt-4 sm:grid-cols-2 dark:border-slate-800" : "mt-4 space-y-0.5"} aria-label={`${title} sections`}>
    {items.map((item) => {
      const active = activeSection === item.id;
      return (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={() => onNavigate(item.id)}
          aria-current={active ? "location" : undefined}
          className={`relative flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-semibold leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 ${
            active
              ? "bg-cyber-50 text-cyber-800 dark:bg-sky-950/30 dark:text-sky-300"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
          }`}
        >
          {!mobile && active && <span aria-hidden="true" className="absolute -left-[33px] top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-cyber-600 dark:bg-sky-400" />}
          {item.label}
        </a>
      );
    })}
  </nav>
);

export const PublicPageLayout = ({
  title,
  children,
  tableOfContents = [],
  icon: Icon = FileText,
  subtitle,
  documentType = "Legal",
  effectiveDate = "1 July 2026",
  effectiveDateISO = "2026-07-01",
}) => {
  const { pathname } = useLocation();
  const [activeSection, setActiveSection] = useState(tableOfContents[0]?.id || "");
  const [dark, setDark] = useState(() => {
    const savedTheme = window.localStorage.getItem("dashboard_theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  });
  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      window.localStorage.setItem("dashboard_theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = previousScrollBehavior; };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!tableOfContents.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -66% 0px", threshold: 0 },
    );
    tableOfContents.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [tableOfContents]);

  useEffect(() => {
    if (!tableOfContents.length) return undefined;
    const selectLastSectionAtPageEnd = () => {
      const reachedPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
      if (reachedPageEnd) setActiveSection(tableOfContents[tableOfContents.length - 1].id);
    };
    window.addEventListener("scroll", selectLastSectionAtPageEnd, { passive: true });
    return () => window.removeEventListener("scroll", selectLastSectionAtPageEnd);
  }, [tableOfContents]);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="legal-document-page min-h-screen bg-white font-sans text-slate-700 selection:bg-cyber-100 selection:text-cyber-950 dark:bg-[#0a0f16] dark:text-slate-300">
        <a href="#legal-document-content" className="sr-only fixed left-4 top-3 z-[60] rounded-lg bg-white px-4 py-2 text-sm font-bold text-cyber-800 shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-cyber-500 dark:bg-slate-900 dark:text-sky-300">
          Skip to document
        </a>
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0a0f16]/90">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <Link to="/" className="shrink-0 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500" aria-label="CyberSense home">
                <CyberSenseLogo variant="compact" iconSize="sm" darkModeBlend />
              </Link>
              <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-800 md:block" />
              <span className="hidden whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400 md:block">Trust Center</span>
            </div>
            <nav className="flex shrink-0 items-center gap-1.5" aria-label="Account and display controls">
              <button
                type="button"
                onClick={toggleTheme}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={dark ? "Use light theme" : "Use dark theme"}
                aria-pressed={dark}
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">Sign in</Link>
              <Link to="/register" className="hidden min-h-9 items-center gap-1.5 rounded-lg bg-cyber-600 px-3.5 text-sm font-bold text-white transition hover:bg-cyber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 focus-visible:ring-offset-2 sm:flex dark:ring-offset-[#0a0f16]">
                Create account <ArrowRight size={14} />
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-[#0c121a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(14,116,144,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.07),transparent_34%)]" />
            <div className="relative mx-auto max-w-[1180px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-cyber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:text-slate-400 dark:hover:text-sky-400">
                <ArrowLeft size={16} /> Back to CyberSense
              </Link>
              <div className="mt-9 flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyber-200 bg-white text-cyber-700 dark:border-sky-900 dark:bg-slate-950/50 dark:text-sky-400">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.19em] text-cyber-700 dark:text-sky-400">{documentType}</p>
              </div>
              <h1 id="legal-document-title" className="mt-5 max-w-3xl text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl dark:text-white">{title}</h1>
              {subtitle && <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">{subtitle}</p>}
              <dl className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <dt className="sr-only">Status</dt><dd>Current version</dd>
                </div>
                <div className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} aria-hidden="true" />
                  <dt>Effective</dt><dd><time dateTime={effectiveDateISO}>{effectiveDate}</time></dd>
                </div>
                <div className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" />
                <div><dt className="sr-only">Length</dt><dd>{tableOfContents.length} sections</dd></div>
              </dl>
            </div>
          </section>

          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <details className="group my-7 border-y border-slate-200 py-4 dark:border-slate-800 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-extrabold uppercase tracking-[0.16em] text-slate-600 marker:hidden dark:text-slate-300">
                On this page <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <DocumentNavigation activeSection={activeSection} items={tableOfContents} title={title} onNavigate={setActiveSection} mobile />
            </details>

            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,760px)_240px] lg:justify-center lg:gap-20">
              <article id="legal-document-content" aria-labelledby="legal-document-title" className="min-w-0 scroll-mt-24 py-10 sm:py-14 lg:py-16">
                {children}
              </article>

              <aside className="hidden border-l border-slate-200 pl-8 dark:border-slate-800 lg:sticky lg:top-24 lg:my-16 lg:block">
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <FileText size={15} className="text-cyber-600 dark:text-sky-400" aria-hidden="true" />
                  On this page
                </div>
                <DocumentNavigation activeSection={activeSection} items={tableOfContents} title={title} onNavigate={setActiveSection} />
              </aside>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-[#0c121a]">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-cyber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-400"><ShieldCheck size={16} aria-hidden="true" /></span>
              <span>© {new Date().getFullYear()} CyberSense. Security with clarity.</span>
            </div>
            <nav className="flex gap-6 text-sm font-bold" aria-label="Legal documents">
              <Link to="/privacy" className="text-slate-500 transition hover:text-cyber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:text-slate-400 dark:hover:text-sky-400">Privacy Policy</Link>
              <Link to="/terms" className="text-slate-500 transition hover:text-cyber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:text-slate-400 dark:hover:text-sky-400">Terms of Service</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
};
