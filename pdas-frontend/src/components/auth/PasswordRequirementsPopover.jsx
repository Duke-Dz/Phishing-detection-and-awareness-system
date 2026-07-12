import { AnimatePresence, motion as Motion } from "framer-motion";
import { Check, X } from "lucide-react";

export const PasswordRequirementsPopover = ({ visible, passwordState }) => (
  <AnimatePresence>
    {visible && (
      <Motion.div
        initial={{ opacity: 0, y: 4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="auth-pw-popover absolute bottom-full left-0 z-50 mb-2 w-full max-w-[260px] rounded-[8px] bg-white p-[10px_14px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:bottom-auto sm:left-full sm:top-0 sm:mb-0 sm:ml-3 sm:w-[220px]"
        role="status"
        aria-live="polite"
      >
        <div className="absolute -bottom-[6px] left-[20px] h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white sm:hidden" />
        <div className="absolute -left-[6px] top-[32px] hidden h-0 w-0 border-b-[6px] border-r-[6px] border-t-[6px] border-b-transparent border-r-white border-t-transparent sm:block" />

        <ul className="flex flex-col gap-1.5">
          {passwordState.checks?.map((check) => (
            <li
              key={check.id}
              className="flex items-start gap-2 text-[12px] leading-tight"
            >
              {check.passed ? (
                <Check
                  size={14}
                  strokeWidth={3}
                  className="shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
              ) : (
                <X
                  size={14}
                  strokeWidth={3}
                  className="shrink-0 text-slate-300"
                  aria-hidden="true"
                />
              )}
              <span className={check.passed ? "text-slate-800" : "text-slate-500"}>
                {check.label}
              </span>
            </li>
          ))}
        </ul>
      </Motion.div>
    )}
  </AnimatePresence>
);
