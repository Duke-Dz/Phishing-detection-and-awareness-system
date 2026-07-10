import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyState from "../../components/dashboard/shared/EmptyState";
import { notificationService } from "../../services/notificationService";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { notificationService.list({ page: 1, page_size: 50 }).then((response) => setItems(response.data || [])).catch(() => toast.error("Could not load notifications.", { id: "notifications-load-error" })).finally(() => setLoading(false)); }, []);
  const allRead = async () => { await notificationService.markAllRead(); setItems((current) => current.map((item) => ({ ...item, is_read: true }))); };
  const read = async (item) => { if (item.is_read) return; await notificationService.markRead(item.notification_id); setItems((current) => current.map((entry) => entry.notification_id === item.notification_id ? { ...entry, is_read: true } : entry)); };
  return <section><div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold dark:text-white">Notifications</h1><p className="mt-2 text-slate-500">Security updates and account activity.</p></div><button type="button" onClick={allRead} className="min-h-10 rounded-xl px-4 text-sm font-bold text-cyber-600 hover:bg-cyber-50"><CheckCheck className="mr-2 inline" size={17} />Mark all read</button></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">{loading ? <div className="grid place-items-center py-16"><Loader2 className="animate-spin" /></div> : !items.length ? <EmptyState icon={Bell} title="No notifications yet." /> : items.map((item) => <button type="button" key={item.notification_id} onClick={() => read(item)} className="flex w-full gap-4 border-b border-slate-100 p-5 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${item.is_read ? "bg-slate-200" : "bg-cyber-500"}`} /><span><span className="font-bold dark:text-white">{item.title}</span><span className="mt-1 block text-sm text-slate-500">{item.message}</span><span className="mt-2 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</span></span></button>)}</div></section>;
}
