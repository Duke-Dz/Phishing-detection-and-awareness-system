import { useEffect, useState } from "react";
import { X, XCircle } from "lucide-react";

export const Toast = ({ message, onClose, duration = 4000 }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0 && message) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, message, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  if (!message) return null;

  return (
    <div
      className={`app-toast ${isClosing ? "app-toast-closing" : "app-toast-opening"}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="app-toast-card">
        <XCircle className="app-toast-icon" size={20} aria-hidden="true" />
        <span className="app-toast-message">{message}</span>
        <button
          type="button"
          onClick={handleClose}
          className="app-toast-close"
          aria-label="Close notification"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
