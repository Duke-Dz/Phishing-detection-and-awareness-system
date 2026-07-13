import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { notificationService } from "../../services/notificationService";
import EmptyState from "../dashboard/shared/EmptyState";
import { presentNotification } from "../../utils/notificationPresentation";

const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function NotificationDropdown({ open, onClose, onUnreadChange }) {
  const panelRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setLoading(true);
    setError("");
    notificationService.list({ page: 1, page_size: 8 })
      .then((response) => setItems(response.data || []))
      .catch(() => setError("Could not load notifications."))
      .finally(() => setLoading(false));
    const dismiss = (event) => {
      if (event.key === "Escape") onClose();
      if (event.type === "mousedown" && !panelRef.current?.contains(event.target) && !event.target.closest?.('[data-notification-trigger="true"]')) onClose();
    };
    document.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [open, onClose]);

  const markRead = async (item) => {
    if (item.is_read) return;
    await notificationService.markRead(item.notification_id);
    setItems((current) => current.map((entry) => entry.notification_id === item.notification_id ? { ...entry, is_read: true } : entry));
    onUnreadChange?.(-1);
  };

  const markAll = async () => {
    await notificationService.markAllRead();
    const unread = items.filter((item) => !item.is_read).length;
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    onUnreadChange?.(-unread);
  };

  const clearRead = async () => {
    setClearing(true);
    try {
      await notificationService.clearRead();
      setItems((current) => current.filter((item) => !item.is_read));
    } finally {
      setClearing(false);
    }
  };

  if (!open) return null;
  return (
    <div ref={panelRef} className="fixed inset-x-4 top-[72px] z-[70] max-h-[75vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]" role="dialog" aria-label="Notifications">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div><h2 className="font-extrabold dark:text-white">Notifications</h2><p className="text-xs text-slate-500">Recent account activity</p></div>
        <div className="flex items-center gap-1"><button type="button" onClick={markAll} disabled={!items.some((item) => !item.is_read)} className="min-h-9 rounded-lg px-2 text-xs font-bold text-cyber-700 hover:bg-cyber-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:hover:bg-cyber-500/10"><CheckCheck className="mr-1 inline" size={15} />Mark all read</button><button type="button" onClick={clearRead} disabled={clearing || !items.some((item) => item.is_read)} className="min-h-9 rounded-lg px-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-800"><Trash2 className="mr-1 inline" size={14} />{clearing ? "Clearing…" : "Clear read"}</button></div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-cyber-600" /></div>
          : error ? <p className="p-8 text-center text-sm text-rose-600">{error}</p>
          : !items.length ? <EmptyState icon={Bell} title="No notifications yet." />
          : items.map((item) => {
            const presented = presentNotification(item);
            return (
            <button key={item.notification_id} type="button" onClick={() => markRead(item)} className="flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.is_read ? "bg-slate-200 dark:bg-slate-700" : "bg-cyber-500"}`} />
              <span className="min-w-0"><span className="block text-sm font-bold text-slate-900 dark:text-white">{presented.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-300">{presented.message}</span><span className="mt-2 block text-xs font-medium text-slate-400">{dateLabel(item.created_at)}</span></span>
            </button>
          );})}
      </div>
    </div>
  );
}
