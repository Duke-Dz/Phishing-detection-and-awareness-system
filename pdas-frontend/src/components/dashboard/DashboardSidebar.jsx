import {
  BarChart3,
  BookOpen,
  FileWarning,
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  X,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import CyberSenseLogo from "../auth/CyberSenseLogo";

export const DASHBOARD_NAV_ITEMS = [
  { id: "overview", label: "Overview", helper: "Security snapshot", Icon: LayoutDashboard },
  { id: "quick-actions", label: "Quick actions", helper: "Scan and report", Icon: ScanLine },
  { id: "recent-scans", label: "Scan history", helper: "Previous results", Icon: BarChart3 },
  { id: "reports", label: "My reports", helper: "Track submissions", Icon: FileWarning },
  { id: "training", label: "Training", helper: "Build awareness", Icon: BookOpen },
];

function NavItem({ item, collapsed, active, onSelect }) {
  const { Icon } = item;
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        title={collapsed ? item.label : undefined}
        className={`cyber-sidebar-nav-item ${active ? "cyber-sidebar-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : "px-3"}`}
      >
        <span className="cyber-sidebar-nav-icon"><Icon size={18} /></span>
        {!collapsed && <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold">{item.label}</span><span className="block truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">{item.helper}</span></span>}
      </button>
      {collapsed && <span className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{item.label}</span>}
    </div>
  );
}

export default function DashboardSidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  activeSection,
  onSectionChange,
  onSignOut,
}) {
  const touchStartRef = useRef(null);
  const handleTouchStart = (event) => { touchStartRef.current = event.touches[0].clientX; };
  const handleTouchEnd = (event) => {
    if (touchStartRef.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartRef.current;
    touchStartRef.current = null;
    if (delta < -60) onClose();
  };

  return (
    <>
      {isOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside
        data-collapsed={collapsed}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`cyber-dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(90vw,256px)] flex-col overflow-hidden ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "lg:w-[84px]" : "lg:w-64"}`}
      >
        <div className={`flex min-h-20 items-center border-b border-slate-200/60 py-3 dark:border-slate-700/60 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <Link to="/" aria-label="CyberSense home"><CyberSenseLogo variant="compact" iconSize="md" showWordmark={!collapsed} /></Link>
          {!collapsed && <div className="flex items-center gap-2"><Link to="/" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 hover:text-[#0D518C] dark:border-slate-700 dark:bg-slate-900 lg:flex" aria-label="Go to home"><Home size={17} /></Link><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation"><X size={19} /></button></div>}
        </div>
        {collapsed && <div className="hidden px-2 pb-2 pt-3 lg:block"><Link to="/" className="cyber-sidebar-nav-item justify-center px-0" title="Home"><span className="cyber-sidebar-nav-icon"><Home size={18} /></span></Link></div>}
        <nav className={`min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-4 pt-4 ${collapsed ? "px-2" : "px-3"}`} aria-label="Dashboard navigation">
          {!collapsed && <p className="px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Workspace</p>}
          {DASHBOARD_NAV_ITEMS.map((item) => <NavItem key={item.id} item={item} collapsed={collapsed} active={activeSection === item.id} onSelect={onSectionChange} />)}
        </nav>
        <div className={`border-t border-slate-200/70 pt-3 dark:border-slate-700/60 ${collapsed ? "px-2 pb-3" : "px-3 pb-3"}`}>
          <button type="button" onClick={onSignOut} title={collapsed ? "Sign out" : undefined} className={`cyber-sidebar-nav-item cyber-sidebar-nav-danger ${collapsed ? "justify-center px-0" : "px-3"}`}><span className="cyber-sidebar-nav-icon"><LogOut size={18} /></span>{!collapsed && <span className="text-sm font-semibold">Sign out</span>}</button>
          <button type="button" onClick={onToggleCollapse} className={`cyber-sidebar-nav-item mt-2 hidden lg:flex ${collapsed ? "justify-center px-0" : "px-3"}`} title={collapsed ? "Expand sidebar" : undefined}><span className="cyber-sidebar-nav-icon">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</span>{!collapsed && <span className="text-sm font-semibold">Collapse</span>}</button>
        </div>
      </aside>
    </>
  );
}
