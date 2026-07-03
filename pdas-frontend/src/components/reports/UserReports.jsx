import { FileWarning } from "lucide-react";
import EmptyState from "../dashboard/shared/EmptyState";

export default function UserReports({ reports = [], loading, compact = false }) {
  const rows = compact ? reports.slice(0, 3) : reports;
  return (
    <section>
      {!compact && <div className="mb-5"><h1 className="text-3xl font-extrabold dark:text-white">Reports</h1><p className="mt-2 text-slate-500">Track threats you submitted for review.</p></div>}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? <div className="animate-pulse space-y-3 p-6">{[1,2,3].map((item) => <div key={item} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          : !rows.length ? <EmptyState icon={FileWarning} title="No reports yet" description="Threats you report will appear here." />
          : rows.map((report) => <article key={report.report_id} className="border-b border-slate-100 p-5 last:border-0 dark:border-slate-800 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
            <div className="min-w-0"><p className="line-clamp-2 font-bold dark:text-white">{report.content}</p><p className="mt-2 text-xs font-semibold capitalize text-slate-500">{report.report_type} · {new Date(report.created_at).toLocaleString()}</p></div><span className="mt-3 inline-block shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:mt-0">{report.status?.replace("_", " ")}</span>
          </article>)}
      </div>
    </section>
  );
}
