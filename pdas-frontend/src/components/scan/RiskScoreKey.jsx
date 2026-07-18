const bands = [
  { range: "0–30", label: "Low", color: "bg-emerald-500", text: "text-emerald-800" },
  { range: "31–60", label: "Suspicious", color: "bg-amber-500", text: "text-amber-800" },
  { range: "61–79", label: "High", color: "bg-rose-500", text: "text-rose-800" },
  { range: "80–100", label: "Critical", color: "bg-rose-800", text: "text-rose-950" },
];

export default function RiskScoreKey({ compact = false }) {
  return (
    <div className={compact ? "" : "dashboard-theme-card rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5"} aria-label="Risk score guide">
      {!compact && <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Risk score guide</p><p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Higher score means more warning evidence</p></div>}
      <div className="mt-2 grid grid-cols-4 gap-1">
        {bands.map((band) => <div key={band.range} className="min-w-0"><span className={`block h-1.5 rounded-full ${band.color}`} /><p className={`mt-1 text-[10px] font-bold ${band.text} dark:text-slate-200`}>{band.range}</p><p className="truncate text-[10px] font-semibold text-slate-600 dark:text-slate-400">{band.label}</p></div>)}
      </div>
      {!compact && <p className="mt-2 text-[10px] leading-4 text-slate-600 dark:text-slate-400">Evidence-based score, not a percentage guarantee of safety.</p>}
    </div>
  );
}
