import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import NotificationDropdown from "../../notifications/NotificationDropdown";
import ProfileMenu from "../profile/ProfileMenu";

export default function DashboardHeader({ user, avatarSrc, unread, dark, onMenu, onTheme, onLogout, onUnreadChange }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[#ebebeb] bg-[#f7f7f7] px-4 py-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:px-6 lg:top-4 lg:min-h-0 lg:rounded-[24px] lg:border lg:px-5 lg:py-2 lg:shadow-[0_14px_32px_-26px_rgba(15,23,42,0.20)]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button type="button" onClick={onMenu} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Open navigation"><Menu size={22} /></button>
        <label className="hidden h-11 w-full max-w-[355px] items-center gap-3 rounded-[16px] bg-white px-4 text-slate-400 shadow-[0_4px_14px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 sm:flex">
          <Search size={22} strokeWidth={2.1} className="shrink-0 text-slate-900 dark:text-slate-100" />
          <input type="search" placeholder="Search task" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100" aria-label="Search tasks" />
        </label>
        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 sm:hidden">Dashboard</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button type="button" onClick={onTheme} className="hidden h-11 w-11 place-items-center rounded-full text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 lg:grid" aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <div className="relative"><button type="button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} className="relative grid h-11 w-11 place-items-center rounded-full text-slate-800 transition hover:bg-slate-200/70 dark:text-slate-100 dark:hover:bg-slate-800" aria-label={`${unread || 0} unread notifications`} aria-expanded={notificationsOpen}><Bell size={20} />{unread > 0 && <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{Math.min(unread, 99)}</span>}</button><NotificationDropdown open={notificationsOpen} onClose={closeNotifications} onUnreadChange={onUnreadChange} /></div>
        <div className="relative"><button type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} className="flex items-center gap-3 rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69d861]" aria-label="Open profile menu" aria-expanded={profileOpen}><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-cyber-600 font-bold text-white ring-2 ring-white dark:ring-slate-900">{avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : user?.full_name?.[0] || "U"}</span><span className="hidden max-w-[180px] lg:block"><span className="block truncate text-[15px] font-bold leading-5 text-slate-900 dark:text-white">{user?.full_name || "User"}</span><span className="block truncate text-sm leading-5 text-slate-500">{user?.email}</span></span></button><ProfileMenu open={profileOpen} onClose={closeProfile} user={user} avatarSrc={avatarSrc} onLogout={onLogout} /></div>
      </div>
    </header>
  );
}
