import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export const CardErrorToast = ({ message, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const toastContent = (
    <AnimatePresence>
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[9999] pointer-events-none">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center gap-3 bg-white border border-red-100 shadow-xl rounded-xl px-4 py-3 text-sm text-gray-800 pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 leading-snug">{message}</span>
            <button
              onClick={onClose}
              className="shrink-0 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(toastContent, document.body);
};
