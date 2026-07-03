const tones = {
  blue: "bg-cyber-50 text-cyber-700 dark:bg-cyber-500/10 dark:text-cyber-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export default function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div><p className="text-2xl font-extrabold text-slate-950 dark:text-white">{Number(value || 0).toLocaleString()}</p><p className="mt-1 text-sm font-semibold text-slate-500">{label}</p></div>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon size={20} /></span>
    </article>
  );
}
