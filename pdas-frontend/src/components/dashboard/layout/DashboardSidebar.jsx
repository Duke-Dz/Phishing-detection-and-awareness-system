import { BarChart3, Bell, BookOpen, FileWarning, LayoutDashboard, ScanLine, Settings, UserRound, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import CyberSenseLogo from "../../auth/CyberSenseLogo";

const links = [
  ["/dashboard", "Overview", LayoutDashboard, true],
  ["/dashboard/scans", "Scan Center", ScanLine],
  ["/dashboard/activity", "Scan Activity", BarChart3],
  ["/dashboard/reports", "Reports", FileWarning],
  ["/dashboard/training", "Training", BookOpen],
  ["/dashboard/notifications", "Notifications", Bell],
  ["/dashboard/profile", "Profile", UserRound],
  ["/dashboard/settings", "Settings", Settings],
];

export default function DashboardSidebar({ open, collapsed, onClose, onToggle }) {
  return (
    <>
      {open && <button type="button" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${collapsed ? "lg:w-[88px]" : "lg:w-[252px]"} ${open ? "w-[270px] translate-x-0" : "w-[270px] -translate-x-full lg:translate-x-0"}`}>
        <div className={`flex h-20 items-center border-b border-slate-100 dark:border-slate-800 ${collapsed ? "lg:justify-center lg:px-0" : "px-5"}`}>
          <CyberSenseLogo variant="compact" iconSize="md" showWordmark={!collapsed || open} />
          <button type="button" onClick={onClose} className="ml-auto grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
          {links.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold transition ${isActive ? "bg-cyber-50 text-cyber-700 dark:bg-cyber-500/10 dark:text-cyber-300" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white"} ${collapsed ? "lg:justify-center" : ""}`}>
              <Icon size={20} className="shrink-0" /><span className={`ml-3 ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={onToggle} className="m-3 hidden min-h-10 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:block">{collapsed ? "Expand" : "Collapse sidebar"}</button>
      </aside>
    </>
  );
}
