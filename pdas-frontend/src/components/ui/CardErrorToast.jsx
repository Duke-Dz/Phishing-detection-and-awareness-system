import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const CardErrorToast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-[90%] md:left-auto md:-right-4 md:translate-x-0 md:w-max z-50 pointer-events-none">
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-3 bg-white border border-red-100 shadow-lg rounded-xl px-4 py-3 text-sm text-gray-800 pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 leading-snug">{message}</span>
            <button
              onClick={onClose}
              className="shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
