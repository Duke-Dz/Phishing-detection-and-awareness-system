import { AlertCircle } from "lucide-react";
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
        <div className="fixed left-1/2 top-4 z-[9999] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 pointer-events-none">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex max-w-full items-center gap-2.5 rounded-xl border-[1.5px] border-red-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-[0_10px_30px_rgba(15,23,42,0.14)] pointer-events-auto"
          >
            <AlertCircle className="h-[18px] w-[18px] shrink-0 text-red-500" strokeWidth={2.25} />
            <span className="min-w-0 leading-snug">{message}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(toastContent, document.body);
};
