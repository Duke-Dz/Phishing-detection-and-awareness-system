import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TIME_ZONE = "Africa/Nairobi";

export default function DashboardDateBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const date = useMemo(() => ({
    day: new Intl.DateTimeFormat("en-KE", {
      weekday: "long",
      timeZone: TIME_ZONE,
    }).format(now),
    full: new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(now),
  }), [now]);

  return (
    <div
      className="ml-2 hidden shrink-0 items-center gap-2.5 border-l border-slate-200 pl-4 dark:border-slate-700 md:flex lg:ml-3 lg:pl-5"
      aria-label={`Today is ${date.day}, ${date.full}`}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyber-50 text-cyber-700 ring-1 ring-cyber-100 dark:bg-cyber-950/60 dark:text-cyber-300 dark:ring-cyber-900">
        <CalendarDays size={17} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">
          {date.day}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {date.full}
        </p>
      </div>
    </div>
  );
}
