import { useEffect, useState } from "react";
import { XCircle, X } from "lucide-react";

export const Toast = ({ message, onClose, duration = 4000 }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0 && message) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(onClose, 300); // wait for exit animation
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
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        animation: isClosing 
          ? "slideUp 300ms ease forwards" 
          : "slideDown 300ms ease forwards",
      }}
    >
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translate(-50%, -20px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              transform: translate(-50%, 0);
              opacity: 1;
            }
            to {
              transform: translate(-50%, -20px);
              opacity: 0;
            }
          }
        `}
      </style>
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          padding: "12px 20px",
          borderTop: "3px solid #DC2626",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: "300px",
          maxWidth: "90vw",
        }}
      >
        <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
        <span
          style={{
            color: "#111827",
            fontSize: "14px",
            fontWeight: 500,
            flexGrow: 1,
          }}
        >
          {message}
        </span>
        <button
          type="button"
          onClick={handleClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6B7280",
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
