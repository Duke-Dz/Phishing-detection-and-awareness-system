import { useReducedMotion } from "framer-motion";

const Block = ({ className = "" }) => (
  <div className={`rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`} />
);

export default function DashboardSkeleton() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={`space-y-10 ${reduceMotion ? "" : "animate-pulse"}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading dashboard content"
    >
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Block className="h-4 w-28" />
        <Block className="mt-4 h-9 w-full max-w-xl" />
        <Block className="mt-4 h-4 w-full max-w-2xl" />
        <Block className="mt-2 h-4 w-3/5 max-w-lg" />
      </section>

      <section>
        <Block className="mb-4 h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Block className="h-12 w-12 rounded-2xl" />
              <Block className="mt-5 h-5 w-2/3" />
              <Block className="mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Block className="mb-4 h-4 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Block className="h-8 w-24" />
              <Block className="mt-4 h-4 w-32" />
              <Block className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800"><Block className="h-5 w-44" /></div>
        {[0, 1, 2].map((item) => (
          <div key={item} className="grid gap-3 border-b border-slate-100 p-6 last:border-0 dark:border-slate-800 sm:grid-cols-[2fr_1fr_1fr]">
            <Block className="h-4 w-full" /><Block className="h-4 w-24" /><Block className="h-4 w-20" />
          </div>
        ))}
      </section>
      <span className="sr-only">Loading dashboard content</span>
    </div>
  );
}
