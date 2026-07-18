import { Bell, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import NotificationDropdown from "../../notifications/NotificationDropdown";
import ProfileMenu from "../profile/ProfileMenu";
import DashboardDateBar from "./DashboardDateBar";
import DashboardSearch from "./DashboardSearch";

export default function DashboardHeader({ user, avatarSrc, unread, dark, onMenu, onTheme, onLogout, onUnreadChange }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  return (
    <header className="dashboard-theme-surface sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2.5 border-b border-slate-200 bg-white/95 px-4 py-1.5 backdrop-blur-xl sm:px-5 lg:top-4 lg:min-h-0 lg:rounded-xl lg:border lg:px-4 lg:py-1.5 lg:shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button type="button" onClick={onMenu} className="dashboard-theme-hover grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={19} /></button>
        <DashboardSearch />
        <DashboardDateBar />
        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 sm:hidden">Dashboard</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={onTheme} className="dashboard-theme-hover hidden h-9 w-9 place-items-center rounded-lg border border-transparent text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-950 dark:text-slate-300 lg:grid" aria-label="Toggle theme">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        <div className="relative"><button type="button" data-notification-trigger="true" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} className="dashboard-theme-hover relative grid h-9 w-9 place-items-center rounded-lg text-slate-800 transition hover:bg-slate-200/70 dark:text-slate-100" aria-label={`${unread || 0} unread notifications`} aria-expanded={notificationsOpen} aria-haspopup="dialog"><Bell size={18} />{unread > 0 && <span className="absolute right-0 top-0 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white">{Math.min(unread, 99)}</span>}</button><NotificationDropdown open={notificationsOpen} onClose={closeNotifications} onUnreadChange={onUnreadChange} /></div>
        <div className="relative"><button type="button" data-profile-menu-trigger="true" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} className={`dashboard-theme-hover flex items-center gap-2 rounded-lg border px-1.5 py-1 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 ${profileOpen ? "dashboard-theme-control border-slate-300 bg-white shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-white dark:hover:border-[#3a4450]"}`} aria-label="Open profile menu" aria-expanded={profileOpen} aria-haspopup="menu"><span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-cyber-600 text-sm font-bold text-white ring-2 ring-white dark:ring-[#181c22]">{avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : user?.full_name?.[0] || "U"}</span><span className="hidden max-w-[165px] lg:block"><span className="block truncate text-[13px] font-bold leading-4 text-slate-900 dark:text-white">{user?.full_name || "User"}</span><span className="block truncate text-xs font-medium leading-4 text-slate-600 dark:text-slate-400">{user?.email}</span></span><ChevronDown size={16} strokeWidth={2.3} className={`text-slate-600 transition-transform duration-200 dark:text-slate-300 ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" /></button><ProfileMenu open={profileOpen} onClose={closeProfile} user={user} avatarSrc={avatarSrc} onLogout={onLogout} /></div>
      </div>
    </header>
  );
}
