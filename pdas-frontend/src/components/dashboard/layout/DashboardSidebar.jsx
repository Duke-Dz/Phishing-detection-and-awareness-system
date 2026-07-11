import {
  BarChart3, BookOpenCheck, CircleHelp, FileClock, LayoutDashboard, Link2,
  LogOut, MailSearch, MessageSquareText, Radio, Settings, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CyberSenseShield } from "../../auth/CyberSenseLogo";

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
    <div className="relative grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[18px] border-2 border-[#08664f] bg-gradient-to-br from-[#159a72] via-[#08785b] to-[#034638] shadow-[0_7px_15px_-7px_rgba(3,70,56,0.72)] ring-1 ring-[#0b8061]/25" aria-label="CyberSense security shield">
      <span className="absolute inset-[3px] rounded-[14px] border border-white/20 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]" aria-hidden="true" />
      <span className="absolute h-11 w-11 rounded-full bg-[#8af0c8]/18 blur-[6px]" aria-hidden="true" />
      <CyberSenseShield className="relative h-[49px] w-[49px] drop-shadow-[0_3px_3px_rgba(1,37,29,0.38)]" />
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
          <BrandMark />
          <div className={expanded ? "min-w-0" : "hidden lg:hidden"}>
            <p className="truncate text-[18px] font-extrabold leading-5 tracking-[-0.04em] text-slate-950 dark:text-white"><span>Cyber</span><span className="text-[#0d518c]">Sense</span></p>
            <p className="mt-1 truncate text-[10px] font-semibold tracking-[0.14em] text-slate-500 dark:text-slate-400">USER PORTAL</p>
          </div>
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
