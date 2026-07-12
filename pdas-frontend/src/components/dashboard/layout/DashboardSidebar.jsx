import {
  BarChart3, BookOpenCheck, CircleHelp, FileClock, LayoutDashboard, Link2,
  LogOut, MailSearch, MessageSquareText, Radio, Settings, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CyberSenseLogo, { CyberSenseShield } from "../../auth/CyberSenseLogo";

const primaryLinks = [
  ["#dashboard-overview", "Dashboard", LayoutDashboard],
  ["#url-scanning", "URL Scanner", Link2],
  ["#email-scanning", "Email Scanner", MailSearch],
  ["#sms-scanning", "SMS Scanner", MessageSquareText],
  ["#scan-history", "Scan History", FileClock],
];
const programmeLinks = [
  ["/dashboard/training", "Awareness Training", BookOpenCheck],
  ["/dashboard/reports", "Reports", BarChart3],
  ["/dashboard/activity", "Security News", Radio],
];
const supportLinks = [
  ["/dashboard#dashboard-overview", "Help", CircleHelp],
  ["/dashboard/settings", "Settings", Settings],
];

function BrandMark() {
  return (
    <div className="grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_7px_18px_-10px_rgba(13,81,140,0.55)] dark:border-slate-700 dark:bg-slate-950" aria-label="CyberSense">
      <CyberSenseShield className="h-[48px] w-[48px]" />
    </div>
  );
}

export default function DashboardSidebar({ open, collapsed, onClose, onLogout }) {
  const location = useLocation();
  const [activeHash, setActiveHash] = useState(() => window.location.hash || "#dashboard-overview");
  useEffect(() => {
    setActiveHash(location.hash || "#dashboard-overview");
  }, [location.hash]);
  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || "#dashboard-overview");
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);
  const expanded = !collapsed || open;
  const compactBrand = collapsed && !open;
  const isActive = (destination) => {
    if (destination.startsWith("/")) return location.pathname === destination;
    return (location.pathname === "/dashboard" && activeHash === destination)
      || (destination === "#email-scanning" && location.pathname === "/dashboard/email-scan")
      || (destination === "#url-scanning" && location.pathname === "/dashboard/url-scan")
      || (destination === "#sms-scanning" && location.pathname === "/dashboard/sms-scan")
      || (destination === "#awareness-training" && location.pathname === "/dashboard/training");
  };
  const to = (destination) => destination.startsWith("/") ? destination : `/dashboard${destination}`;
  const linkClass = (active) => `flex h-12 items-center rounded-[18px] px-4 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69d861] ${active ? "bg-[#eeeeee] text-[#2b2b2b] dark:bg-slate-800 dark:text-white" : "text-[#777] hover:bg-[#f7f7f7] hover:text-[#2b2b2b] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"} ${expanded ? "" : "lg:justify-center lg:px-0"}`;
  const renderLinks = (links) => links.map(([destination, label, Icon]) => (
    <Link key={`${destination}-${label}`} to={to(destination)} onClick={onClose} title={collapsed && !open ? label : undefined} className={linkClass(isActive(destination))}>
      <Icon size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      <span className={expanded ? "ml-3" : "ml-3 lg:hidden"}>{label}</span>
    </Link>
  ));

  return <>
    {open && <button type="button" className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden" onClick={onClose} aria-label="Close navigation" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-[width,transform] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:shadow-none ${collapsed ? "lg:w-20" : "lg:w-[266px]"} ${open ? "w-[min(88vw,280px)] translate-x-0" : "w-[min(88vw,280px)] -translate-x-full lg:translate-x-0"}`}>
      <div className={`flex h-[76px] shrink-0 items-center border-b border-dashed border-slate-200 dark:border-slate-800 ${expanded ? "px-4" : "lg:justify-center lg:px-0"}`}>
        <div className="flex min-w-0 items-center gap-3.5" title={compactBrand ? "CyberSense User Portal" : undefined}>
          {expanded ? (
            <CyberSenseLogo variant="compact" />
          ) : (
            <BrandMark />
          )}
        </div>
        <button type="button" onClick={onClose} className="ml-auto grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69d861] lg:hidden" aria-label="Close navigation"><X size={20} /></button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-label="Dashboard navigation">
        <div className="space-y-0.5">{renderLinks(primaryLinks)}</div>
        <div className="mt-5 space-y-0.5 border-t border-dashed border-slate-200 pt-5 dark:border-slate-700">{renderLinks(programmeLinks)}</div>
      </nav>
      <footer className="shrink-0 px-4 pb-4" aria-label="Support navigation">
        <div className="space-y-0.5">{renderLinks(supportLinks)}</div>
        <button type="button" onClick={onLogout} className={`mt-1 flex h-10 items-center rounded-[18px] px-4 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${expanded ? "" : "lg:justify-center lg:px-0"}`} aria-label="Log out" title={collapsed ? "Log out" : undefined}><LogOut size={18} /><span className={expanded ? "ml-3" : "ml-3 lg:hidden"}>Log out</span></button>
      </footer>
    </aside>
  </>;
}
