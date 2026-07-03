import { X } from "lucide-react";
import { useEffect } from "react";

export default function ActionModal({ title, children, onClose, maxWidth = "max-w-2xl" }) {
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <section className={`max-h-[88vh] w-full ${maxWidth} overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900`} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
