import { ShieldAlert } from "lucide-react";

const number = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

const trendSeries = [
  { key: "safe", label: "Safe", color: "#16A34A" },
  { key: "phishing", label: "Phishing", color: "#E11D48" },
  { key: "suspicious", label: "Suspicious", color: "#F59E0B" },
];

const smoothPath = (points) => {
  if (points.length < 2) return "";
  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] || point;
    const next = points[index + 1];
    const afterNext = points[index + 2] || next;
    const controlOneX = point.x + (next.x - previous.x) / 6;
    const controlOneY = point.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (afterNext.x - point.x) / 6;
    const controlTwoY = next.y - (afterNext.y - point.y) / 6;
    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

function ThreatTrendChart({ activity = [] }) {
  const isPreview = activity.length === 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toLocaleDateString("en-CA"),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      fullLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      safe: 0,
      phishing: 0,
      suspicious: 0,
    };
  });
  const dayByKey = Object.fromEntries(days.map((day) => [day.key, day]));
  const previewValues = {
    safe: [2, 3, 2, 4, 3, 5, 4],
    phishing: [0, 1, 0, 1, 0, 1, 0],
    suspicious: [1, 0, 1, 0, 2, 1, 1],
  };
  if (isPreview) {
    days.forEach((day, index) => {
      trendSeries.forEach((series) => { day[series.key] = previewValues[series.key][index]; });
    });
  }
  activity.forEach((entry) => {
    const key = String(entry.date).slice(0, 10);
    if (dayByKey[key] && trendSeries.some((series) => series.key === entry.classification)) {
      dayByKey[key][entry.classification] = Number(entry.count || 0);
    }
  });
  const maximum = Math.max(1, ...days.flatMap((day) => trendSeries.map((series) => day[series.key])));
  const yMaximum = maximum <= 4 ? maximum : Math.ceil(maximum / 5) * 5;
  const left = 48;
  const right = 748;
  const top = 18;
  const bottom = 214;
  const x = (index) => left + (index / (days.length - 1)) * (right - left);
  const y = (value) => bottom - (value / yMaximum) * (bottom - top);
  const totals = Object.fromEntries(trendSeries.map((series) => [series.key, days.reduce((sum, day) => sum + day[series.key], 0)]));
  const hasData = Object.values(totals).some(Boolean);
  const description = hasData
    ? `${isPreview ? "Example preview. " : ""}Seven-day scan results: ${trendSeries.map((series) => `${series.label} ${totals[series.key]}`).join(", ")}.`
    : "No scans were recorded during the last seven days.";

  return (
    <figure className="mt-5" aria-label={description}>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 780 250" className="min-w-[640px] w-full" role="img" aria-label={description}>
          {[0, 0.5, 1].map((ratio) => {
            const value = Math.round(yMaximum * (1 - ratio));
            const gridY = top + ratio * (bottom - top);
            return <g key={ratio}><line x1={left} x2={right} y1={gridY} y2={gridY} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="4 5" /><text x="36" y={gridY + 4} textAnchor="end" fill="currentColor" className="text-slate-600 dark:text-slate-400" fontSize="11" fontWeight="600">{value}</text></g>;
          })}
          {days.map((day, index) => <text key={day.key} x={x(index)} y="239" textAnchor="middle" fill="currentColor" className="text-slate-600 dark:text-slate-400" fontSize="11" fontWeight="600">{day.label}</text>)}
          {hasData && trendSeries.map((series) => {
            const points = days.map((day, index) => ({ x: x(index), y: y(day[series.key]) }));
            return <g key={series.key}><path d={smoothPath(points)} fill="none" stroke={series.color} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />{days.map((day, index) => <circle key={day.key} cx={x(index)} cy={y(day[series.key])} r="3.5" stroke={series.color} strokeWidth="2.5" className="fill-white dark:fill-slate-800"><title>{`${day.fullLabel}: ${series.label} ${day[series.key]}`}</title></circle>)}</g>;
          })}
          {!hasData && <text x="398" y="121" textAnchor="middle" fill="#64748b" fontSize="14" fontWeight="600">No scan activity in the last 7 days</text>}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Chart legend">
        {trendSeries.map((series) => <div key={series.key} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} /><span className="font-bold text-slate-800 dark:text-slate-200">{series.label}</span><span className="font-semibold text-slate-600 dark:text-slate-400">{number(totals[series.key])}</span></div>)}
      </div>
      <p className="sr-only">{description}</p>
    </figure>
  );
}

function DonutChart({ title, value, segments }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segmentTotal = segments.reduce((sum, segment) => sum + segment.value, 0);
  const chartSegments = segments.filter((segment) => segment.value > 0);
  let offset = 0;
  const description = segmentTotal
    ? `${title}: ${segments.map((segment) => `${segment.label} ${segment.value}`).join(", ")}.`
    : `${title}: no scan data yet.`;

  return (
    <article className="rounded-[10px] border border-slate-300 bg-white px-4 py-3.5 dark:border-[#383c41] dark:bg-[#1b1e21]">
      <h2 className="text-center text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      <figure className="mt-2.5" aria-label={description}>
        <div className="relative mx-auto h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={description}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#cbd5e1" strokeWidth="12" />
            {chartSegments.map((segment) => {
              const fraction = segment.value / segmentTotal;
              const length = fraction * circumference;
              const gap = chartSegments.length > 1 ? Math.min(3, length * 0.18) : 0;
              const dashOffset = -offset;
              offset += length;
              return <circle key={segment.label} cx="50" cy="50" r={radius} fill="none" stroke={segment.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${Math.max(0, length - gap)} ${circumference}`} strokeDashoffset={dashOffset} />;
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-slate-950 dark:text-white">{number(value)}</span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">scans</span>
          </div>
        </div>
        <div className={`mt-3 grid gap-2 ${segments.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {segments.map((segment) => {
            const percent = segmentTotal ? Math.round((segment.value / segmentTotal) * 100) : 0;
            return <div key={segment.label} className="min-w-0 text-center"><span className="mx-auto block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} /><p className="mt-1.5 truncate text-xs font-bold text-slate-800 dark:text-slate-200">{segment.label}</p><p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{number(segment.value)} / {percent}%</p></div>;
          })}
        </div>
      </figure>
      <div className="sr-only">{description}</div>
    </article>
  );
}

function MetricCharts({ stats, safe, phishing, suspicious, total }) {
  const types = stats.scanTypeBreakdown || {};
  const unclassified = Math.max(0, total - safe - phishing - suspicious);
  const needsAttention = phishing + suspicious + unclassified;

  return (
    <section className="grid gap-3 lg:grid-cols-3" aria-label="Scan summary charts">
      <DonutChart title="Total scans" value={total} segments={[
        { label: "URL", value: Number(types.url || 0), color: "#087CF0" },
        { label: "Email", value: Number(types.email || 0), color: "#7C3AED" },
        { label: "SMS", value: Number(types.sms || 0), color: "#F59E0B" },
      ]} />
      <DonutChart title="Safe scans" value={safe} segments={[
        { label: "Safe", value: safe, color: "#16A34A" },
        { label: "Other results", value: needsAttention, color: "#64748B" },
      ]} />
      <DonutChart title="Threats detected" value={phishing + suspicious} segments={[
        { label: "Phishing", value: phishing, color: "#E11D48" },
        { label: "Suspicious", value: suspicious, color: "#F59E0B" },
      ]} />
    </section>
  );
}

function OverviewSkeleton() {
  return <div className="animate-pulse space-y-5" aria-label="Loading dashboard"><div className="h-10 w-56 rounded-lg bg-[#e8e8e8]" /><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-48 rounded-[10px] border border-[#e7e7e7] bg-white" />)}</div><div className="h-72 rounded-[10px] border border-[#e7e7e7] bg-white" /></div>;
}

export default function OverviewPanel({ stats, loading, error }) {
  const safe = Number(stats.safeScans || 0);
  const phishing = Number(stats.phishingScans || 0);
  const suspicious = Number(stats.suspiciousScans || 0);
  const total = Number(stats.totalScans || 0);

  if (loading) return <OverviewSkeleton />;
  if (error) return <section className="rounded-[10px] border border-[#f0d7d7] bg-white p-8 text-center"><ShieldAlert className="mx-auto text-[#cb6161]" size={30} /><h1 className="mt-3 text-xl font-semibold text-slate-950">Dashboard data is unavailable</h1><p className="mt-2 text-sm text-slate-600">Refresh the page or try again in a moment.</p></section>;

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4 text-[#202020] shadow-sm dark:border-[#34383d] dark:bg-[#17191c] dark:text-[#f1f3f5] sm:p-6">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-[-0.035em] text-slate-950 dark:text-white">Dashboard overview</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">A clear summary of your scans and detected risks.</p>
      </div>

      <MetricCharts stats={stats} safe={safe} phishing={phishing} suspicious={suspicious} total={total} />

      <section className="mt-4">
        <article className="rounded-[10px] border border-slate-300 bg-white p-5 dark:border-[#383c41] dark:bg-[#1b1e21] sm:p-6">
          <p className="text-base font-bold text-slate-950 dark:text-white">Threat detection breakdown</p>
          <p className="mt-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Daily safe and harmful scan results from the last seven days.</p>
          <ThreatTrendChart activity={stats.classificationActivity} />
        </article>
      </section>
    </div>
  );
}
