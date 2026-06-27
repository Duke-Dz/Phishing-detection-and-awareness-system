import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AtSign, CheckCircle2, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { z } from "zod";
import { Toast } from "../../components/common/Toast";
import { AuthShell } from "../../components/auth/AuthShell";
import { authService } from "../../services/authService";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Enter a valid email - example@domain.com"),
});

export default function ForgotPasswordPage() {
  const location = useLocation();
  const defaultEmail = location.state?.email || "";

  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(defaultEmail);
  const [resendCountdown, setResendCountdown] = useState(0);

  // DO NOT CHANGE: empty fields validate on submit only
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = async (values) => {
    setSubmitError("");
    const email = values.email.trim().toLowerCase();

    try {
      await authService.forgotPassword(email);
      setSubmittedEmail(email);
      setSent(true);
      return true;
    } catch (error) {
      setSubmitError(
        "We could not send a reset link right now. Please try again in a moment.",
      );
      return false;
    }
  };

  const handleResend = handleSubmit(async (values) => {
    if (resendCountdown > 0) return;
    const ok = await onSubmit(values);
    if (ok) setResendCountdown(60);
  });

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown((count) => count - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  return (
    <AuthShell
      heading={sent ? "Email sent" : "Forgot password?"}
      description={
        sent
          ? undefined
          : "Enter your email and we will send reset instructions if the account exists. Check your spam folder if the email does not arrive within 2 minutes."
      }
      layout="single"
      showHeaderBrand
      mobileCardMode="full"
      footer={
        <>
          <p className="text-sm text-black">Remember your password?</p>
          <Link to="/login" className="auth-bottom-link">
            Back to sign in -&gt;
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-5 text-center" role="status" aria-live="polite">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2
              size={28}
              className="text-emerald-600"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Check your inbox
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              If an account exists for{" "}
              <span className="font-medium text-slate-900">
                {submittedEmail}
              </span>
              , a reset link has been sent. It expires in 60 minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCountdown > 0}
            className="mt-2 text-[13px] font-semibold text-[#0D518C] hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendCountdown > 0
              ? `Resend in ${resendCountdown}s...`
              : "Resend link ->"}
          </button>
        </div>
      ) : (
        <>
          {submitError && (
            <Toast message={submitError} onClose={() => setSubmitError("")} />
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <div>
              <label className="auth-label" htmlFor="forgot-email">
                Email address
              </label>
              <div className="auth-field-wrap">
                <span className="auth-field-icon">
                  <AtSign size={15} aria-hidden="true" />
                </span>
                <input
                  id="forgot-email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                  required
                  className="auth-field auth-field-has-icon"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-btn-primary"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              {isSubmitting ? "Sending link..." : "Send reset link"}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
