import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, RotateCw } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import api from "../services/api";
import { AuthShell } from "../components/auth/AuthShell";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid or missing unsubscribe link parameters.");
      return;
    }

    const unsubscribeUser = async () => {
      try {
        const { data } = await api.post("/users/unsubscribe", {
          email,
          token,
        });
        
        if (data.success) {
          setStatus("success");
          setMessage("You have successfully unsubscribed from email notifications.");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to unsubscribe. Please try again later.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err?.response?.data?.message || err.message || "An unexpected error occurred while unsubscribing.");
      }
    };

    unsubscribeUser();
  }, [email, token]);

  return (
    <AuthShell
      heading={status === "success" ? "Unsubscribed" : status === "error" ? "Unsubscribe Failed" : "Processing..."}
      description={
        status === "success"
          ? "You will no longer receive non-critical alerts."
          : status === "error"
          ? "We could not process your request."
          : "Please wait while we update your preferences."
      }
      layout="single"
      showHeaderBrand
    >
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <Motion.div
            key="unsub-success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 text-center"
          >
            <div className="auth-success-icon flex justify-center mb-2">
              <CheckCircle2 size={26} className="text-cyber-600" />
            </div>
            <div className="auth-alert auth-alert-success text-left">
              {message}
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-4">
              You can re-enable notifications at any time from your account settings.
            </p>
            <Link to="/login" className="auth-btn-primary no-underline text-center flex justify-center">
              Return to Login
            </Link>
          </Motion.div>
        ) : status === "error" ? (
          <Motion.div
            key="unsub-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 text-center"
          >
            <div className="auth-alert auth-alert-error text-left">{message}</div>
            <Link to="/login" className="auth-btn-secondary no-underline text-center flex justify-center">
              Return to Login
            </Link>
          </Motion.div>
        ) : (
          <Motion.div
            key="unsub-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <RotateCw className="w-10 h-10 text-cyber-500 animate-spin" />
          </Motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
