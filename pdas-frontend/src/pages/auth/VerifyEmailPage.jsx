import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  readFragmentParamOnce,
  setNoReferrerPolicy,
} from "../../utils/sensitiveUrl";

const maskEmail = (value) => {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) return value;
  const visibleLength =
    localPart.length <= 2 ? 1 : Math.min(4, localPart.length - 1);
  return `${localPart.slice(0, visibleLength)}****@${domain}`;
};

const formatRetryMessage = (error) => {
  if (error.code !== "RATE_LIMITED" || !error.retryAfter) {
    return error.message;
  }
  return `Too many verification email requests. Try again in ${formatCooldown(error.retryAfter)}.`;
};

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => getPendingVerificationEmail());
  const [token] = useState(() => readFragmentParamOnce("token"));

  const [hasError, setHasError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(() =>
    getVerificationCooldown(email),
  );
  const [success, setSuccess] = useState(false);
  const [cardError, setCardError] = useState(null);

  useEffect(() => setNoReferrerPolicy(), []);

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      toast.success("Account created. Check your email for the verification link.", {
        id: "registration-success",
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!email) {
      setEmail(getPendingVerificationEmail());
    }
  }, [email]);

  useEffect(() => {
    if (!email || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown(getVerificationCooldown(email));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [email, resendCooldown]);

  const handleVerify = useCallback(
    async (verificationToken) => {
      setHasError(false);
      setCardError(null);
      setSubmitting(true);
      try {
        await authService.verifyEmail({ token: verificationToken });
        clearVerificationCooldown(email);
        clearPendingVerificationEmail();
        setSuccess(true);
        toast.success("Email verified.");
        // Auto redirects to login after 3 seconds
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      } catch (error) {
        setCardError(
          error.code === "NETWORK_ERROR"
            ? error.message
            : error.message ||
                "This verification link is invalid or has expired.",
        );
        setHasError(true);
      } finally {
        setSubmitting(false);
      }
    },
    [email, navigate],
  );

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
      toast.success("A new verification link has been sent to your registered email address.");
    } catch (error) {
      if (
        error.code === "VERIFICATION_RESEND_COOLDOWN" &&
        error.retryAfter > 0
      ) {
        setVerificationCooldown(email, error.retryAfter);
        setResendCooldown(error.retryAfter);
      }
      setCardError(formatRetryMessage(error));
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
        panelClassName="auth-verify-panel"
        cardError={cardError}
        onClearCardError={() => setCardError(null)}
        footer={
          <Link
            to="/register"
            onClick={clearPendingVerificationEmail}
            className="text-sm font-semibold text-black no-underline hover:text-cyber-700"
          >
            Back to registration
          </Link>
        }
      >
        <div className="auth-alert auth-alert-warning">
          No email address or token provided. Please register first or check
          your link.
        </div>
      </AuthShell>
    );
  }

  // State 1: Verifying token from magic link
  if (token) {
    return (
      <AuthShell
        heading={
          success
            ? "Email verified!"
            : hasError
              ? "Verification failed"
              : "Verifying email..."
        }
        description={
          success
            ? "Your account is now active. Redirecting you to sign in page..."
            : hasError
              ? "The link may be invalid or expired."
              : "Please wait while we verify your secure link."
        }
        layout="single"
        showHeaderBrand
        cardError={cardError}
        panelClassName="auth-verify-panel"
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
              <div className="auth-alert auth-alert-error">
                The link may be invalid or expired.
              </div>
              <Link
                to="/register"
                className="auth-btn-secondary no-underline text-center flex justify-center"
              >
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
      pageTitle="Check your email"
      layout="single"
      showHeaderBrand
      panelClassName="auth-verify-panel"
      cardError={cardError}
      onClearCardError={() => setCardError(null)}
      footer={
        <>
          <p className="text-sm text-black">Not your email?</p>
          <Link
            to="/register"
            onClick={clearPendingVerificationEmail}
            className="auth-bottom-link"
          >
            Use a different address -&gt;
          </Link>
        </>
      }
    >
      <div
        className="auth-verify-check space-y-3 text-center"
        role="status"
        aria-live="polite"
      >
        <h1 className="auth-heading font-bold tracking-tight text-slate-900 text-xl sm:text-2xl">
          Check your email
        </h1>

        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyber-100 bg-cyber-50">
            <Mail className="h-7 w-7 text-cyber-600" aria-hidden="true" />
          </div>
        </div>

        <p className="mx-auto max-w-sm text-center text-sm leading-6 text-slate-600">
          We sent a verification link to{" "}
          <span className="font-semibold text-slate-900">
            {maskEmail(email)}
          </span>
          . Open it to activate your account. If it does not arrive, check your
          spam folder.
        </p>

        <div className="flex min-h-11 items-center justify-center pt-1">
          {resendCooldown > 0 && !resending ? (
            <p
              className="text-center text-sm font-semibold text-slate-500"
              aria-live="polite"
            >
              Resend available in{" "}
              <span className="tabular-nums text-cyber-700">
                {formatCooldown(resendCooldown)}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="auth-btn-secondary min-h-11"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <RotateCw size={16} className="animate-spin" />
                  Sending...
                </span>
              ) : (
                "Resend verification email"
              )}
            </button>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
