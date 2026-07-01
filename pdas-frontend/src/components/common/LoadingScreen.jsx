import { motion } from "framer-motion";
import CyberSenseLogo from "../auth/CyberSenseLogo";

export const LoadingScreen = ({ message = "Preparing your secure workspace" }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f7f9fc]"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyber-700 via-emerald-400 to-cyber-600" />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyber-100/45 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative flex w-full max-w-sm flex-col items-center px-8 text-center"
      >
        <div className="rounded-3xl border border-slate-200/80 bg-white px-8 py-5 shadow-xl shadow-slate-900/5">
          <CyberSenseLogo variant="compact" />
        </div>
        <p className="mt-7 text-base font-bold text-slate-900">{message}</p>
        <p className="mt-1.5 text-sm text-slate-500">Verifying your session and loading protected data.</p>
        <div className="mt-6 h-1.5 w-52 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full w-2/5 rounded-full bg-gradient-to-r from-cyber-600 to-emerald-400"
            animate={{ x: ["-110%", "260%"] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <span className="sr-only">{message}</span>
      </motion.div>
    </div>
  );
};
