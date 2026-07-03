import { useReducedMotion } from "framer-motion";

export const LoadingScreen = ({ message = "Loading…" }) => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-white text-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col items-center gap-3 px-6">
        <span
          className={`h-7 w-7 rounded-full border-[3px] border-slate-200 border-t-[#0D518C] ${reduceMotion ? "" : "animate-spin"}`}
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
};
