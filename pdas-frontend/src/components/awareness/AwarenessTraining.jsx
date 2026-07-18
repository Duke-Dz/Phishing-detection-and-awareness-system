import { BookOpen, BookOpenText, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import ActionModal from "../dashboard/shared/ActionModal";
import EmptyState from "../dashboard/shared/EmptyState";

const categories = ["all", "email", "url", "sms", "social", "security", "advanced"];
const difficulties = ["all", "beginner", "intermediate", "advanced"];
const isNew = (value) => value && Date.now() - new Date(value).getTime() < 7 * 86400000;

export default function AwarenessTraining({ lessons = [], loading, compact = false }) {
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [selected, setSelected] = useState(null);
  const published = useMemo(() => lessons.filter((lesson) => lesson.is_published !== false), [lessons]);
  const filtered = published.filter((lesson) => (category === "all" || lesson.category === category) && (difficulty === "all" || lesson.difficulty === difficulty));
  const visible = compact ? published.slice(0, 1) : filtered;
  return (
    <section>
      {!compact && <><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Awareness academy</p><h1 className="mt-2 text-3xl font-extrabold dark:text-white">Training</h1><p className="mt-2 text-slate-500">Practical lessons for safer decisions online.</p></div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="flex gap-2 overflow-x-auto">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold capitalize ${category === item ? "bg-violet-600 text-white" : "dashboard-theme-control bg-white text-slate-500"}`}>{item}</button>)}</div><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="dashboard-theme-control min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold capitalize">{difficulties.map((item) => <option key={item}>{item}</option>)}</select></div></>}
      {loading ? <div className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-[#252c35]" />
        : !visible.length ? <div className="dashboard-theme-surface rounded-3xl border border-slate-200 bg-white"><EmptyState icon={BookOpen} title="No training content" description="Published lessons will appear here." /></div>
        : <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3"}`}>{visible.map((lesson, index) => <article key={lesson.content_id} className={`dashboard-theme-surface flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${index === 0 && !compact ? "md:col-span-2 xl:col-span-1" : ""}`}>
          <div className="flex items-center justify-between"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold capitalize text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{lesson.category}</span>{isNew(lesson.created_at) && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-700">New</span>}</div>
          <div className="flex-1">
            <h2 className="mt-4 text-lg font-extrabold dark:text-white">{lesson.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{lesson.description}</p>
          </div>
          <div className="mt-5 flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-bold capitalize text-slate-400"><Clock size={14} />{lesson.duration_minutes || 5} min · {lesson.difficulty}</p><button type="button" onClick={() => setSelected(lesson)} className="flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"><BookOpenText size={15} />Read</button></div>
        </article>)}</div>}
      {selected && <ActionModal title={selected.title} onClose={() => setSelected(null)}><article className="p-6 sm:p-8"><div className="flex flex-wrap gap-2 text-xs font-bold capitalize text-violet-600"><span>{selected.category}</span><span>·</span><span>{selected.difficulty}</span><span>·</span><span>{selected.duration_minutes || 5} min</span></div><p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-600 dark:text-slate-300">{selected.body || selected.description}</p></article></ActionModal>}
    </section>
  );
}
