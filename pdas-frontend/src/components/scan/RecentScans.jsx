import { useState, useEffect, useMemo } from "react";
import { Link2, Mail, MessageSquareText, ScanLine, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import EmptyState from "../dashboard/shared/EmptyState";
import RiskRing from "./RiskRing";
import RiskScoreKey from "./RiskScoreKey";

const ROWS_PER_PAGE = 8;

const formatDate = (value) => {
  if (!value) return { date: "Not available", time: "" };
  const parsed = new Date(value);
  return {
    date: parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
};

const typeMeta = {
  url: { label: "URL", Icon: Link2, tone: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30" },
  email: { label: "Email", Icon: Mail, tone: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30" },
  sms: { label: "SMS", Icon: MessageSquareText, tone: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30" },
};

const resultTone = {
  safe: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  suspicious: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  phishing: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
};

const contentPreview = (target, scanType) => {
  const value = String(target || "No content available").replace(/\s+/g, " ").trim();
  if (scanType === "url") {
    try {
      const parsed = new URL(value);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.hostname}${path}`.slice(0, 52);
    } catch {
      return value.slice(0, 52);
    }
  }
  return value.length > 48 ? `${value.slice(0, 48)}…` : value;
};

/** Build an array of page numbers with ellipsis gaps for large page counts */
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (currentPage > 3) pages.push("…l");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("…r");
  pages.push(totalPages);
  return pages;
}

export default function RecentScans({ scans = [], loading, compact = false, onScan }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when the scan list changes (new scan added, etc.)
  useEffect(() => { setCurrentPage(1); }, [scans.length]);

  const allRows = compact ? scans.slice(0, 3) : scans;
  const totalPages = compact ? 1 : Math.max(1, Math.ceil(allRows.length / ROWS_PER_PAGE));

  // Clamp current page if scans shrink
  const safePage = Math.min(currentPage, totalPages);

  const rows = useMemo(() => {
    if (compact) return allRows;
    const start = (safePage - 1) * ROWS_PER_PAGE;
    return allRows.slice(start, start + ROWS_PER_PAGE);
  }, [allRows, safePage, compact]);

  const showPagination = !compact && allRows.length > ROWS_PER_PAGE;
  const rangeStart = (safePage - 1) * ROWS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * ROWS_PER_PAGE, allRows.length);

  return (
    <section className="dashboard-theme-surface overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      {!compact && <div className="dashboard-theme-divider grid gap-4 border-b border-slate-300 px-5 py-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:items-center"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Scan history</h1><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">View your previous scans, results, and detection dates.</p></div><RiskScoreKey compact /></div>}
      {loading ? <div className="animate-pulse space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-lg bg-slate-100 dark:bg-[#252c35]" />)}</div>
        : !allRows.length ? <EmptyState icon={ScanLine} title="No scans yet" description="Run a scan to begin building your security history." action="Run a scan" onAction={onScan} />
        : <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] table-fixed border-collapse text-left">
              <caption className="sr-only">Your scan history, including target, scanner type, risk score, result, and scan date.</caption>
              <colgroup><col className="w-[34%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[17%]" /><col className="w-[21%]" /></colgroup>
              <thead className="bg-slate-100 dark:bg-[#15191e]">
                <tr className="border-b border-slate-300 dark:border-slate-700">
                  <th scope="col" className="border-r border-slate-300 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Scanned content</th>
                  <th scope="col" className="border-r border-slate-300 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Scanner</th>
                  <th scope="col" className="border-r border-slate-300 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Risk score</th>
                  <th scope="col" className="border-r border-slate-300 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700 dark:text-slate-300">Result</th>
                  <th scope="col" className="px-6 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:text-slate-300">Scanned on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                {rows.map((scan) => {
                  const type = typeMeta[scan.scan_type] || { label: scan.scan_type || "Other", Icon: ScanLine, tone: "bg-slate-100 text-slate-700 ring-slate-200" };
                  const TypeIcon = type.Icon;
                  const scannedAt = formatDate(scan.analyzed_at || scan.created_at);
                  return <tr key={scan.scan_id} className="dashboard-theme-hover transition-colors hover:bg-slate-50/80">
                    <td className="border-r border-slate-300 px-6 py-2.5 dark:border-slate-700"><p className="block truncate text-sm font-semibold text-slate-950 dark:text-white" title={scan.target}>{contentPreview(scan.target, scan.scan_type)}</p><p className="mt-0.5 text-xs font-medium text-slate-600">Scan #{String(scan.scan_id).slice(0, 8)}</p></td>
                    <td className="border-r border-slate-300 px-4 py-2.5 dark:border-slate-700"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${type.tone}`}><TypeIcon size={13} strokeWidth={2.2} />{type.label}</span></td>
                    <td className="border-r border-slate-300 px-4 py-2.5 dark:border-slate-700"><div className="flex justify-center"><RiskRing score={scan.risk_score} compact /></div></td>
                    <td className="border-r border-slate-300 px-4 py-2.5 dark:border-slate-700"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${resultTone[scan.classification] || "bg-slate-100 text-slate-700 ring-slate-300"}`}>{scan.classification || "Unknown"}</span></td>
                    <td className="whitespace-nowrap px-6 py-2.5"><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{scannedAt.date}</p><p className="mt-0.5 text-xs text-slate-500">{scannedAt.time}</p></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination bar ── */}
          {showPagination && (
            <div className="flex flex-col items-center gap-3 border-t border-slate-300 px-5 py-3 dark:border-slate-700 sm:flex-row sm:justify-between sm:px-6">
              {/* Results summary */}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{rangeStart}–{rangeEnd}</span> of{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{allRows.length}</span> results
              </p>

              {/* Page controls */}
              <nav aria-label="Scan history pagination" className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  aria-label="First page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous page */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {getPageNumbers(safePage, totalPages).map((page) =>
                  typeof page === "string" ? (
                    <span key={page} className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safePage ? "page" : undefined}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                        page === safePage
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next page */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Last page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  aria-label="Last page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronsRight size={16} />
                </button>
              </nav>
            </div>
          )}
        </>}
    </section>
  );
}
