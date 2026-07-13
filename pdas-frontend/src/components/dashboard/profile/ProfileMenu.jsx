import { Bell, LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ open, onClose, user, avatarSrc, onLogout }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (event.key === "Escape") onClose();
      if (event.type === "mousedown" && !ref.current?.contains(event.target) && !event.target.closest?.('[data-profile-menu-trigger="true"]')) onClose();
    };
    document.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", dismiss);
    return () => { document.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", dismiss); };
  }, [open, onClose]);
  if (!open) return null;
  const go = (path) => { onClose(); navigate(path); };
  const items = [
    ["View profile", UserRound, "/dashboard/profile"],
    ["Settings", Settings, "/dashboard/settings"],
    ["Notifications", Bell, "/dashboard/notifications"],
  ];
  return (
    <div ref={ref} className="absolute right-0 top-12 z-[70] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="menu">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">{avatarSrc ? <img src={avatarSrc} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-cyber-600 font-bold text-white">{user?.full_name?.[0] || "U"}</span>}<div className="min-w-0"><p className="truncate text-sm font-bold dark:text-white">{user?.full_name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div></div>
      </div>
      <div className="p-2">{items.map(([label, Icon, path]) => <button key={path} type="button" onClick={() => go(path)} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800" role="menuitem"><Icon size={17} />{label}</button>)}
        <button type="button" onClick={onLogout} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10" role="menuitem"><LogOut size={17} />Sign out</button>
      </div>
    </div>
  );
}
