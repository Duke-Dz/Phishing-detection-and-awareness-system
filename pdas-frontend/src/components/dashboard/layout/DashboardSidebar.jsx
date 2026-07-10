import {
  BookOpenCheck,
  LayoutDashboard,
  Link2,
  LogOut,
  MailSearch,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CyberSenseLogo from "../../auth/CyberSenseLogo";

const navigationGroups = [
  {
    label: "Scanning",
    links: [
      ["#dashboard-overview", "Dashboard", LayoutDashboard],
      ["#email-scanning", "Email Scanning", MailSearch],
      ["#url-scanning", "URL Scanning", Link2],
      ["#sms-scanning", "SMS Scanning", MessageSquareText],
    ],
  },
  {
    label: "Awareness",
    links: [["#awareness-training", "Awareness Training", BookOpenCheck]],
  },
];

export default function DashboardSidebar({
  open,
  collapsed,
  onClose,
  onToggle,
  user,
  avatarSrc,
  onLogout,
}) {
  const showExpanded = !collapsed || open;
  const compactBrand = collapsed && !open;
  const location = useLocation();
  const displayName = user?.full_name || user?.username || "CyberSense user";
  const email = user?.email || "";

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-[width,transform] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:rounded-r-3xl lg:border-y lg:border-r lg:border-l-0 lg:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] ${
          collapsed ? "lg:w-20" : "lg:w-[264px]"
        } ${
          open
            ? "w-[min(88vw,280px)] translate-x-0"
            : "w-[min(88vw,280px)] -translate-x-full lg:translate-x-0"
        }`}
      >
        <div
          className={`flex h-20 shrink-0 items-center border-b border-slate-100 transition-all duration-300 ease-in-out dark:border-slate-800 ${
            showExpanded ? "px-5" : "lg:justify-center lg:px-0"
          }`}
        >
          <div
            className={compactBrand
              ? "[&_.auth-logo-container]:!gap-1 [&_.auth-logo-container>div:first-of-type]:!h-9 [&_.auth-logo-container>div:first-of-type]:!w-9 [&_.auth-logo-wordmark]:!text-[0.72rem]"
              : "[&_.auth-logo-container]:!flex-row [&_.auth-logo-container]:!flex-nowrap [&_.auth-logo-container]:!gap-2.5 [&_.auth-logo-container>div:first-of-type]:!h-9 [&_.auth-logo-container>div:first-of-type]:!w-9 [&_.auth-logo-wordmark]:!text-[1.3rem]"}
            title={compactBrand ? "CyberSense" : undefined}
          >
            <CyberSenseLogo
              variant="compact"
              iconSize="sm"
              stacked={compactBrand}
              showWordmark
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex ? "mt-7" : ""}>
              <p
                className={`mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 transition-opacity duration-200 dark:text-slate-300 ${
                  showExpanded ? "" : "lg:invisible"
                }`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map(([hash, label, Icon]) => {
                  const activeHash = location.hash || "#dashboard-overview";
                  const isActive =
                    (location.pathname === "/dashboard" && activeHash === hash) ||
                    (hash === "#email-scanning" && location.pathname === "/dashboard/email-scan") ||
                    (hash === "#url-scanning" && location.pathname === "/dashboard/url-scan") ||
                    (hash === "#sms-scanning" && location.pathname === "/dashboard/sms-scan") ||
                    (hash === "#awareness-training" && location.pathname === "/dashboard/training");

                  return (
                  <Link
                    key={hash}
                    to={`/dashboard${hash}`}
                    onClick={onClose}
                    title={collapsed && !open ? label : undefined}
                    className={`flex h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 ${
                      isActive
                        ? "bg-cyber-50 text-cyber-800 dark:bg-cyber-500/15 dark:text-cyber-200"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    } ${showExpanded ? "" : "lg:justify-center lg:px-0"}`}
                  >
                    <Icon size={19} className="shrink-0" aria-hidden="true" />
                    <span className={showExpanded ? "ml-3" : "ml-3 lg:hidden"}>
                      {label}
                    </span>
                  </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <footer className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          <div
            className={`flex min-h-12 items-center rounded-xl bg-slate-50 p-2 transition dark:bg-slate-800/70 ${
              showExpanded ? "gap-2.5" : "lg:justify-center lg:bg-transparent lg:p-0"
            }`}
            title={collapsed && !open ? `${displayName}${email ? ` — ${email}` : ""}` : undefined}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-cyber-600 text-sm font-bold text-white">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className={showExpanded ? "min-w-0" : "hidden lg:hidden"}>
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{displayName}</p>
              {email && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>}
            </div>
          </div>

          <div className="mt-2 grid gap-1">
            <button
              type="button"
              onClick={onToggle}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:flex ${
                collapsed ? "justify-center px-0" : ""
              }`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
              {!collapsed && <span className="ml-3">Collapse sidebar</span>}
            </button>
            <button
              type="button"
              onClick={onLogout}
              title={collapsed ? "Log out" : undefined}
              className={`flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-500/10 ${
                collapsed ? "justify-center px-0" : ""
              }`}
              aria-label="Log out"
            >
              <LogOut size={19} />
              {showExpanded && <span className="ml-3">Log out</span>}
            </button>
          </div>

        </footer>
      </aside>
    </>
  );
}
