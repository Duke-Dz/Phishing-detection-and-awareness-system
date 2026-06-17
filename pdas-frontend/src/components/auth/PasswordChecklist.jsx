import { AnimatePresence, motion } from "framer-motion";
import { Check, Circle } from "lucide-react";

export const PasswordChecklist = ({ passwordState, show, emphasizeInvalid }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-1.5 pt-1 overflow-hidden"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Password requirements
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
          {passwordState.checks.map((check) => (
            <div
              key={check.id}
              className="flex items-center gap-2"
            >
              {check.passed ? (
                <Check size={14} className="text-emerald-500" strokeWidth={3} />
              ) : (
                <Circle
                  size={14}
                  className={emphasizeInvalid ? "text-rose-400" : "text-slate-300"}
                  strokeWidth={2}
                />
              )}
              <span
                className={`text-[12px] font-medium ${
                  check.passed
                    ? "text-slate-700"
                    : emphasizeInvalid
                      ? "text-rose-500"
                      : "text-slate-500"
                }`}
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
