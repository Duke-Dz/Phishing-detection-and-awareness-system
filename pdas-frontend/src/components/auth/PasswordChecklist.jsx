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

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
