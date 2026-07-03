import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, FileText, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CyberSenseLogo from "../auth/CyberSenseLogo";
import { PageTransition } from "../common/PageTransition";

export const LegalSummary = ({ children }) => (
  <div className="my-6 flex gap-3 rounded-2xl border border-cyber-100 bg-cyber-50/70 p-4 text-sm leading-6 text-slate-700">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyber-600 text-white">
      <Check size={14} strokeWidth={3} />
    </span>
    <div><strong className="font-bold text-cyber-800">In brief: </strong>{children}</div>
  </div>
);

export const LegalList = ({ children }) => (
  <ul className="my-5 space-y-3">{children}</ul>
);

export const LegalListItem = ({ children }) => (
  <li className="flex gap-3 text-[15px] leading-7 text-slate-600">
    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyber-500" />
    <span>{children}</span>
  </li>
);

export const LegalNotice = ({ title, children }) => (
  <div className="my-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <p className="font-bold text-amber-950">{title}</p>
    <div className="mt-2 text-sm leading-6 text-amber-900/80">{children}</div>
  </div>
);

export const LegalSection = ({ id, number, title, summary, children }) => (
  <section id={id} className="scroll-mt-28 border-t border-slate-200 py-10 first:border-t-0 first:pt-0">
    <div className="mb-5 flex items-start gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-extrabold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
        {summary && <p className="mt-1 text-sm text-slate-500">{summary}</p>}
      </div>
    </div>
    <div className="space-y-4 text-[15px] leading-7 text-slate-600">{children}</div>
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
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

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
      <div className="min-h-screen bg-white font-sans text-slate-700 selection:bg-cyber-100 selection:text-cyber-900">
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl print:static">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link to="/" aria-label="CyberSense home"><CyberSenseLogo variant="compact" iconSize="sm" /></Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100">Sign in</Link>
              <Link to="/register" className="flex items-center gap-2 rounded-xl bg-cyber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyber-700/15 transition hover:bg-cyber-700">
                Create account <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-300 to-transparent" />
          <div className="absolute right-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-cyber-50/70 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <button type="button" onClick={goBack} className="mb-9 inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-slate-500 transition hover:text-cyber-700"><ArrowLeft size={16} /> Back</button>
            <div className="flex max-w-4xl items-start gap-5">
              <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyber-100 bg-cyber-50 text-cyber-700 shadow-sm sm:grid"><Icon size={26} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyber-600">{documentType}</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-5xl">{title}</h1>
                {subtitle && <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{subtitle}</p>}
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
                  <span>Effective {effectiveDate}</span>
                  <span>Last updated {effectiveDate}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_272px] lg:px-8">
          <article className="min-w-0 bg-white sm:pr-4 lg:pr-10 print:pr-0">
            {children}
          </article>

          <aside className="order-first print:hidden lg:order-last">
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold text-slate-700">
                On this page <ChevronDown size={17} className="transition group-open:rotate-180" />
              </summary>
              <nav className="grid gap-1 border-t border-slate-100 p-3">
                {tableOfContents.map((item) => <a key={item.id} href={`#${item.id}`} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-cyber-50 hover:text-cyber-700">{item.label}</a>)}
              </nav>
            </details>
            <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] lg:sticky lg:top-24 lg:block">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
                <FileText size={17} className="text-cyber-600" />
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">On this page</p>
              </div>
              <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      activeSection === item.id
                        ? "bg-cyber-50 text-cyber-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.label}</span><ChevronRight size={14} />
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </main>

        <footer className="border-t border-slate-200 bg-slate-50/60 print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyber-50 text-cyber-600"><ShieldCheck size={18} /></span>
              <span>© {new Date().getFullYear()} CyberSense. Security with clarity.</span>
            </div>
            <div className="flex gap-6 text-sm font-semibold">
              <Link to="/privacy" className="text-slate-500 hover:text-cyber-700">Privacy Policy</Link>
              <Link to="/terms" className="text-slate-500 hover:text-cyber-700">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};
