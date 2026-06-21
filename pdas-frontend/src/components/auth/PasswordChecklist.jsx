import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

const STRENGTH_LEVELS = [
  { label: "Weak", color: "#ef4444", width: "33%" },
  { label: "Fair", color: "#f97316", width: "66%" },
  { label: "Strong", color: "#22c55e", width: "100%" },
];

export const PasswordChecklist = ({ passwordState, show, id }) => {
  if (!show) return null;

  const checks = passwordState.checks || [];
  const totalChecks = Math.max(checks.length, 1);
  const scoreToLevel = Math.max(1, Math.min(Math.ceil((passwordState.score / totalChecks) * 3), 3));
  const level = STRENGTH_LEVELS[scoreToLevel - 1];

  return (
    <AnimatePresence>
      <motion.div
        id={id}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.18 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-2 pt-1" role="status" aria-live="polite">
          <div
            style={{
              width: "100%",
              height: "5px",
              borderRadius: "999px",
              background: "#e2e8f0",
              overflow: "hidden",
            }}
            aria-hidden="true"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: level.width }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: "999px",
                background: level.color,
              }}
            />
          </div>

          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: level.color,
              lineHeight: 1,
            }}
          >
            {level.label}
          </span>

          <ul className="grid gap-1 text-[0.76rem] leading-5 text-slate-600 sm:grid-cols-2">
            {checks.map((check) => (
              <li
                key={check.id}
                className={check.passed ? "flex items-center gap-1.5 text-emerald-700" : "flex items-center gap-1.5"}
              >
                {check.passed ? (
                  <CheckCircle2 size={13} className="shrink-0" aria-hidden="true" />
                ) : (
                  <Circle size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                )}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
