import { Bell, Menu, Moon, RefreshCw, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import NotificationDropdown from "../../notifications/NotificationDropdown";
import ProfileMenu from "../profile/ProfileMenu";

export default function DashboardHeader({ user, avatarSrc, unread, refreshing, dark, onMenu, onRefresh, onTheme, onLogout, onUnreadChange }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:h-20 sm:px-7 lg:px-9">
      <div className="flex items-center gap-3"><button type="button" onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Open navigation"><Menu size={22} /></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">User dashboard</p><p className="hidden text-sm text-slate-500 sm:block">Your security command centre</p></div></div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onRefresh} className="hidden h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:grid" aria-label="Refresh dashboard"><RefreshCw size={19} className={refreshing ? "animate-spin" : ""} /></button>
        <button type="button" onClick={onTheme} className="hidden h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:grid" aria-label="Toggle theme">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
        <div className="relative"><button type="button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`${unread || 0} unread notifications`} aria-expanded={notificationsOpen}><Bell size={19} />{unread > 0 && <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{Math.min(unread, 99)}</span>}</button><NotificationDropdown open={notificationsOpen} onClose={closeNotifications} onUnreadChange={onUnreadChange} /></div>
        <div className="relative ml-1"><button type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-cyber-600 font-bold text-white ring-2 ring-white dark:ring-slate-900" aria-label="Open profile menu" aria-expanded={profileOpen}>{avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : user?.full_name?.[0] || "U"}</button><ProfileMenu open={profileOpen} onClose={closeProfile} user={user} avatarSrc={avatarSrc} onLogout={onLogout} /></div>
      </div>
    </header>
  );
}
