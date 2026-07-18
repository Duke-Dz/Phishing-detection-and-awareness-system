import { CircleHelp, FileClock, Link2, Mail, MailSearch, MessageSquareText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const helpLinks = [
  ["/dashboard#url-scanning", "Scan a suspicious link", Link2],
  ["/dashboard#email-scanning", "Check a suspicious email", MailSearch],
  ["/dashboard#sms-scanning", "Check a suspicious SMS", MessageSquareText],
  ["/dashboard#scan-history", "Review previous scan results", FileClock],
];

export default function FloatingHelp() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.type === "mousedown" && !panelRef.current?.contains(event.target) && !event.target.closest?.('[data-help-trigger="true"]')) setOpen(false);
    };
    document.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && <section ref={panelRef} className="dashboard-theme-popover absolute bottom-14 right-0 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.22)]" role="dialog" aria-label="CyberSense help">
        <div className="dashboard-theme-divider flex items-start justify-between border-b border-slate-200 px-4 py-3.5"><div><h2 className="font-bold text-slate-950 dark:text-white">How can we help?</h2><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Choose a task or contact support.</p></div><button type="button" onClick={() => setOpen(false)} className="dashboard-theme-hover grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Close help"><X size={17} /></button></div>
        <nav className="p-2" aria-label="Help shortcuts">{helpLinks.map(([to, label, Icon]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="dashboard-theme-hover flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"><Icon size={17} className="text-cyber-700 dark:text-cyber-300" />{label}</Link>)}</nav>
        <div className="dashboard-theme-divider border-t border-slate-200 p-3"><a href="mailto:support@cybersense.io" className="dashboard-theme-control dashboard-theme-hover flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 transition hover:border-cyber-400 hover:bg-cyber-50 hover:text-cyber-800 dark:text-slate-200"><Mail size={16} />Contact support</a></div>
      </section>}
      <button type="button" data-help-trigger="true" onClick={() => setOpen((value) => !value)} className={`dashboard-theme-control flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold shadow-[0_8px_24px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f1115] ${open ? "dashboard-help-trigger-open border-cyber-300 bg-cyber-50 text-cyber-800" : "border-slate-300 bg-white text-slate-800 hover:border-cyber-300 hover:text-cyber-800"}`} aria-expanded={open} aria-haspopup="dialog"><CircleHelp size={19} strokeWidth={2.2} />Help</button>
    </div>
  );
}
