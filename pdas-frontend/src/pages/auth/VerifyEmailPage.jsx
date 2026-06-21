import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { CheckCircle2, RotateCw } from "lucide-react";
import { AuthShell } from "../../components/auth/AuthShell";
import { OtpCodeField } from "../../components/auth/OtpCodeField";
import { authService } from "../../services/authService";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otpCode, setOtpCode]           = useState("");
  const [submitError, setSubmitError]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [resending, setResending]       = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess]           = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async () => {
    if (otpCode.length !== 6) {
      setSubmitError("Enter the complete 6-digit code.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      await authService.verifyEmail({ email, otp_code: otpCode });
      setSuccess(true);
    } catch (error) {
      setSubmitError(error.message || "Unable to verify the code.");
    } finally {
      setSubmitting(false);
    }
  }, [email, otpCode]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setSubmitError("");
    setResending(true);
    try {
      await authService.resendVerification(email);
      setResendCooldown(60);
    } catch (error) {
      setSubmitError(error.message || "Unable to resend the code.");
    } finally {
      setResending(false);
    }
  }, [email, resendCooldown]);

  useEffect(() => {
    if (otpCode.length === 6 && !submitting) {
      handleVerify();
    }
  }, [otpCode, submitting, handleVerify]);

  if (!email) {
    return (
      <AuthShell
        heading="Missing email"
        description="We need your email address to verify your account."
        layout="single"
        showHeaderBrand
        footer={
          <Link to="/register" className="text-sm font-semibold text-black no-underline hover:text-cyber-700">
            Back to registration
          </Link>
        }
      >
        <div className="auth-alert auth-alert-warning">
          No email address provided. Please register first or check your link.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading={success ? "Email verified!" : "Verify your email"}
      description={
        success
          ? "Your account is now active. You can sign in."
          : `We sent a 6-digit code to ${email}. Enter it below.`
      }
      layout="single"
      showHeaderBrand
      footer={
        !success && (
          <>
            <p className="text-sm text-black">Wrong email?</p>
            <Link to="/register" className="text-sm font-semibold text-black no-underline hover:text-cyber-700">
              Start over →
            </Link>
          </>
        )
      }
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
        ) : (
          <Motion.div
            key="verify-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Email badge */}
            <div className="auth-alert auth-alert-info">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
              </svg>
              <span className="text-[0.85rem]">{email}</span>
            </div>

            <OtpCodeField
              label="Verification code"
              value={otpCode}
              onChange={setOtpCode}
              length={6}
              error={submitError}
            />

            <button
              type="button"
              onClick={handleVerify}
              disabled={submitting || otpCode.length !== 6}
              className="auth-btn-primary"
            >
              <CheckCircle2 size={16} />
              {submitting ? "Verifying…" : "Verify email"}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-[0.83rem] font-medium text-black transition hover:text-cyber-700 focus:outline-none disabled:opacity-50"
              >
                <RotateCw size={13} className={resending ? "animate-spin" : ""} />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : resending
                  ? "Sending…"
                  : "Resend code"}
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
