export default function RiskRing({ score = 0 }) {
  const value = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const color = value >= 70 ? "#f43f5e" : value >= 35 ? "#f59e0b" : "#10b981";
  return (
    <div className="grid h-11 w-11 place-items-center rounded-full text-xs font-bold" style={{ background: `conic-gradient(${color} ${value * 3.6}deg, #e2e8f0 0)` }} aria-label={`Risk score ${value}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 dark:bg-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
