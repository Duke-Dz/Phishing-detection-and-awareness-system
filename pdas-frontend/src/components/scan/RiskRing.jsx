export default function RiskRing({ score = 0, compact = false }) {
  const value = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const color = value >= 80 ? "#9f1239" : value >= 61 ? "#e11d48" : value >= 31 ? "#f59e0b" : "#10b981";
  return (
    <div className={`grid place-items-center rounded-full font-bold ${compact ? "h-9 w-9 text-[11px]" : "h-11 w-11 text-xs"}`} style={{ background: `conic-gradient(${color} ${value * 3.6}deg, #e2e8f0 0)` }} aria-label={`Risk score ${value}`}>
      <span className={`grid place-items-center rounded-full bg-white text-slate-700 dark:bg-slate-900 dark:text-white ${compact ? "h-7 w-7" : "h-8 w-8"}`}>{value}</span>
    </div>
  );
}
