import { AnimatePresence, motion } from "framer-motion";
import { Check, XCircle } from "lucide-react";

export const PasswordChecklist = ({ passwordState, show, emphasizeInvalid }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.22 }}
        className="overflow-hidden"
      >
        <div className="auth-checklist-card">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-2.5">
            Password requirements
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {passwordState.checks.map((check) =>
              check.passed ? (
                <span key={check.id} className="auth-checklist-pill-pass">
                  <Check size={10} strokeWidth={3} />
                  {check.label}
                </span>
              ) : (
                <span
                  key={check.id}
                  className={`auth-checklist-pill-fail ${
                    emphasizeInvalid ? "text-rose-500" : "text-slate-400"
                  }`}
                >
                  <XCircle
                    size={11}
                    className={emphasizeInvalid ? "text-rose-400" : "text-slate-300"}
                  />
                  {check.label}
                </span>
              )
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
