import { AlertTriangle, Clock, ExternalLink, FileWarning, ShieldCheck } from "lucide-react";
import { useState } from "react";
import ActionModal from "../dashboard/shared/ActionModal";
import EmptyState from "../dashboard/shared/EmptyState";

const statusConfig = {
  pending: { label: "Pending", tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", Icon: Clock },
  in_review: { label: "In Review", tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300", Icon: Clock },
  resolved: { label: "Resolved", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", Icon: ShieldCheck },
  dismissed: { label: "Dismissed", tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", Icon: AlertTriangle },
};

const typeBadge = {
  phishing: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  spam: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  malware: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  suspicious: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function UserReports({ reports = [], loading, compact = false }) {
  const rows = compact ? reports.slice(0, 3) : reports;
  const [selected, setSelected] = useState(null);

  return (
    <section>
      {!compact && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Threat reports</p>
          <h1 className="mt-2 text-3xl font-extrabold dark:text-white">Reports</h1>
          <p className="mt-2 text-slate-500">Track threats you submitted for review.</p>
        </div>
      )}
      <div className="dashboard-theme-surface overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="animate-pulse space-y-3 p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 rounded-xl bg-slate-100 dark:bg-[#252c35]" />
            ))}
          </div>
        ) : !rows.length ? (
          <EmptyState icon={FileWarning} title="No reports yet" description="Threats you report will appear here." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((report) => {
              const status = statusConfig[report.status] || statusConfig.pending;
              const StatusIcon = status.Icon;
              const badgeTone = typeBadge[report.report_type] || typeBadge.other;

              return (
                <article
                  key={report.report_id}
                  className="dashboard-theme-hover flex cursor-pointer flex-col gap-3 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
                  onClick={() => setSelected(report)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-bold dark:text-white">{report.content}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${badgeTone}`}>
                        {report.report_type}
                      </span>
                      <span className="text-xs font-medium text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(report.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-bold ${status.tone}`}>
                    <StatusIcon size={13} />
                    {status.label}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {selected && (
        <ActionModal title="Report Details" onClose={() => setSelected(null)}>
          <div className="space-y-5 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${typeBadge[selected.report_type] || typeBadge.other}`}>
                {selected.report_type}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${(statusConfig[selected.status] || statusConfig.pending).tone}`}>
                {(statusConfig[selected.status] || statusConfig.pending).label}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reported content</p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-300">{selected.content}</p>
            </div>
            {selected.url && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">URL</p>
                <p className="mt-2 flex items-center gap-2 break-all text-sm font-medium text-cyber-600 dark:text-cyber-400">
                  <ExternalLink size={14} className="shrink-0" />
                  {selected.url}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted</p>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date(selected.created_at).toLocaleString()}</p>
            </div>
          </div>
        </ActionModal>
      )}
    </section>
  );
}
