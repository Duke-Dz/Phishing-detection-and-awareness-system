import { motion, useReducedMotion } from "framer-motion";
import CyberSenseLogo from "../auth/CyberSenseLogo";

export const LoadingScreen = ({
  message = "Preparing your secure workspace",
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f7f9fc]"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyber-700 via-emerald-400 to-cyber-600" />

      <motion.div
        aria-hidden="true"
        className="absolute h-[460px] w-[460px] rounded-full bg-cyber-100/60 blur-3xl"
        animate={
          reduceMotion
            ? {}
            : { scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }
        }
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex w-full max-w-sm flex-col items-center px-8 text-center"
      >
        <div className="relative rounded-3xl border border-slate-200/80 bg-white px-8 py-5 shadow-xl shadow-slate-900/5">
          <motion.div
            className="absolute inset-0 rounded-3xl border border-cyber-200/70"
            animate={reduceMotion ? {} : { opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <CyberSenseLogo variant="compact" />
        </div>

        <p className="mt-7 text-base font-bold text-slate-900">{message}</p>
        <p className="mt-1.5 text-sm text-slate-500">
          Verifying your session and loading protected data.
        </p>

        <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full w-2/5 rounded-full bg-gradient-to-r from-cyber-600 to-emerald-400"
            animate={reduceMotion ? {} : { x: ["-110%", "260%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-medium text-slate-500">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            Session
          </span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            Threat data
          </span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            Dashboard
          </span>
        </div>

        <span className="sr-only">{message}</span>
      </motion.div>
    </div>
  );
};
