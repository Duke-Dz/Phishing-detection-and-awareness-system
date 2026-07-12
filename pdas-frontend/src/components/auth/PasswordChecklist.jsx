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
  const completion = passwordState.score / totalChecks;
  const level = passwordState.valid
    ? STRENGTH_LEVELS[2]
    : completion >= 0.5
      ? STRENGTH_LEVELS[1]
      : STRENGTH_LEVELS[0];

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
        <div
          className="auth-checklist-card flex flex-col gap-2.5"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Password requirements
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: level.color,
                lineHeight: 1,
              }}
            >
              {level.label}
            </span>
          </div>

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

          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {checks.map((check) => (
              <li
                key={check.id}
                className={`flex items-center gap-2 text-xs ${
                  check.passed ? "text-emerald-700" : "text-slate-600"
                }`}
              >
                {check.passed ? (
                  <CheckCircle2
                    size={14}
                    className="shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    size={14}
                    className="shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
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
