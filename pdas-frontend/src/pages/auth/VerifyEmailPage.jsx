import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { CheckCircle2, RotateCw, Mail } from "lucide-react";
import { AuthShell } from "../../components/auth/AuthShell";
import { authService } from "../../services/authService";
import { toast } from "sonner";
import {
  clearVerificationCooldown,
  formatCooldown,
  getVerificationCooldown,
  setVerificationCooldown,
} from "../../utils/verificationCooldown";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [hasError, setHasError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(() => getVerificationCooldown(email));
  const [success, setSuccess] = useState(false);
  const [cardError, setCardError] = useState(null);

  useEffect(() => {
    if (!email || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown(getVerificationCooldown(email));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [email, resendCooldown]);

  const handleVerify = useCallback(async (verificationToken) => {
    setHasError(false);
    setCardError(null);
    setSubmitting(true);
    try {
      await authService.verifyEmail({ token: verificationToken });
      clearVerificationCooldown(email);
      setSuccess(true);
      toast.success("Email verified. You can sign in.");
      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (error) {
      setCardError(error.code === "NETWORK_ERROR"
        ? error.message
        : error.message || "This verification link is invalid or has expired.");
      setHasError(true);
    } finally {
      setSubmitting(false);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (token && !submitting && !success && !hasError) {
      handleVerify(token);
    }
  }, [token, submitting, success, hasError, handleVerify]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || !email) return;
    setResending(true);
    setCardError(null);
    try {
      const response = await authService.resendVerification(email);
      const seconds = response.resend_available_in || 120;
      setVerificationCooldown(email, seconds);
      setResendCooldown(seconds);
      toast.success("A new verification link has been sent.", { position: "top-center" });
    } catch (error) {
      if (error.code === "VERIFICATION_RESEND_COOLDOWN" && error.retryAfter > 0) {
        setVerificationCooldown(email, error.retryAfter);
        setResendCooldown(error.retryAfter);
      }
      setCardError(error.message);
    } finally {
      setResending(false);
    }
  }, [email, resendCooldown]);

  if (!email && !token) {
    return (
      <AuthShell
        heading="Missing information"
        description="We need an email address or a verification token to proceed."
        layout="single"
        showHeaderBrand
        cardError={cardError}
        onClearCardError={() => setCardError(null)}
        footer={
          <Link to="/register" className="text-sm font-semibold text-black no-underline hover:text-cyber-700">
            Back to registration
          </Link>
        }
      >
        <div className="auth-alert auth-alert-warning">
          No email address or token provided. Please register first or check your link.
        </div>
      </AuthShell>
    );
  }

  // State 1: Verifying token from magic link
  if (token) {
    return (
      <AuthShell
        heading={success ? "Email verified!" : hasError ? "Verification failed" : "Verifying email..."}
        description={
          success
            ? "Your account is now active. Redirecting you to sign in..."
            : hasError
            ? "The link may be invalid or expired."
            : "Please wait while we verify your secure link."
        }
        layout="single"
        showHeaderBrand
        cardError={cardError}
        onClearCardError={() => setCardError(null)}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <Motion.div
              key="verify-success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="auth-success-icon">
                <CheckCircle2 size={26} className="text-cyber-600" />
              </div>
              <div className="auth-alert auth-alert-success">
                Your email has been verified successfully.
              </div>
              <Link to="/login" className="auth-btn-primary no-underline">
                Sign in to your account
              </Link>
            </Motion.div>
          ) : hasError ? (
            <Motion.div
              key="verify-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="auth-alert auth-alert-error">The link may be invalid or expired.</div>
              <Link to="/register" className="auth-btn-secondary no-underline text-center flex justify-center">
                Register again
              </Link>
            </Motion.div>
          ) : (
            <Motion.div
              key="verify-loading"
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

  // State 2: Check your email (arrived from registration)
  return (
    <AuthShell
      heading="Check your email"
      description={`We sent a secure verification link to ${email}.`}
      layout="single"
      showHeaderBrand
      cardError={cardError}
      onClearCardError={() => setCardError(null)}
      footer={
        <>
          <p className="text-sm text-black">Wrong email?</p>
          <Link to="/register" className="auth-bottom-link">
            Start over -&gt;
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center pt-2">
          <div className="w-16 h-16 rounded-full bg-cyber-50 flex items-center justify-center border-2 border-cyber-100 shadow-inner">
            <Mail className="w-8 h-8 text-cyber-600" />
          </div>
        </div>
        
        <p className="text-[14px] text-gray-600 text-center leading-relaxed">
          Click the link in the email to activate your account. If you don't see it, check your spam folder.
        </p>



        <div className="pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="auth-btn-secondary"
          >
            {resending ? (
              <span className="flex items-center justify-center gap-2">
                <RotateCw size={16} className="animate-spin" />
                Sending...
              </span>
            ) : resendCooldown > 0 ? (
              `Resend available in ${formatCooldown(resendCooldown)}`
            ) : (
              "Resend verification link"
            )}
          </button>
        </div>
        {resendCooldown > 0 && (
          <p className="text-center text-xs font-medium text-slate-500">
            For account security, another link can be requested after the timer ends.
          </p>
        )}
      </div>
    </AuthShell>
  );
}
