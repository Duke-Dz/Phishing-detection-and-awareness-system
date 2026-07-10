import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export const CardErrorToast = ({ message, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onCloseRef.current?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const toastContent = (
    <AnimatePresence>
      {message && (
        <div className="app-toast fixed left-1/2 top-4 z-[9999] w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 pointer-events-none">
          <motion.div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          className="app-toast-card flex max-w-[min(18rem,calc(100vw-1.5rem))] items-center gap-2 rounded-[10px] border-[1.5px] border-rose-400 bg-white px-2.5 py-2 text-[13px] leading-snug text-gray-900 shadow-[0_6px_18px_rgba(15,23,42,0.12)] pointer-events-auto"
        >
            <AlertCircle className="h-[17px] w-[17px] shrink-0 text-rose-600" strokeWidth={2.25} />
            <span className="app-toast-message min-w-0 break-words">{message}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(toastContent, document.body);
};
