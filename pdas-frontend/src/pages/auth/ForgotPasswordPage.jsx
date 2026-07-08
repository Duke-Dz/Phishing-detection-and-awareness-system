import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AtSign, Loader2, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "../../components/auth/AuthShell";
import { authService } from "../../services/authService";
import { formatCooldown } from "../../utils/verificationCooldown";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Enter a valid email - example@domain.com"),
});

const maskEmail = (email) => {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  const visibleLength =
    localPart.length <= 2 ? 1 : Math.min(4, localPart.length - 1);
  return `${localPart.slice(0, visibleLength)}****@${domain}`;
};

const formatResetError = (error) => {
  if (error.code === "RATE_LIMITED" && error.retryAfter > 0) {
    return `Too many reset email requests. Try again in ${formatCooldown(error.retryAfter)}.`;
  }
  return (
    error.message ||
    "We could not send the reset email right now. Please try again shortly."
  );
};

export default function ForgotPasswordPage() {
  const location = useLocation();
  const defaultEmail = location.state?.email || "";

  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(defaultEmail);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [cardError, setCardError] = useState(null);

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
    setCardError(null);
    const email = values.email.trim().toLowerCase();

    try {
      const response = await authService.forgotPassword(email);
      setSubmittedEmail(email);
      setSent(true);
      setResendCountdown(response.resend_available_in || 60);
      toast.success("Check your email for a reset link.");
      setCardError(null);
      return true;
    } catch (error) {
      setCardError(formatResetError(error));
      return false;
    }
  };

  const handleResend = handleSubmit(async (values) => {
    if (resendCountdown > 0) return;
    await onSubmit(values);
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
      heading={sent ? undefined : "Reset password"}
      pageTitle={sent ? "Check your inbox" : "Reset password"}
      description={
        sent
          ? undefined
          : "Enter your email and we will send reset instructions if the account exists. Check your spam folder if the email does not arrive within 2 minutes."
      }
      layout="single"
      showHeaderBrand
      mobileCardMode="standard"
      panelClassName="auth-forgot-panel"
      cardError={cardError}
      onClearCardError={() => setCardError(null)}
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
        <div
          className="auth-forgot-success space-y-3 text-center"
          role="status"
          aria-live="polite"
        >
          <h1 className="auth-heading font-bold tracking-tight text-slate-900 text-xl sm:text-2xl">
            Check your inbox
          </h1>

          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyber-100 bg-cyber-50">
              <Mail className="h-7 w-7 text-cyber-600" aria-hidden="true" />
            </div>
          </div>

          <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600">
            If an account exists for{" "}
            <span className="font-semibold text-slate-900">
              {maskEmail(submittedEmail)}
            </span>
            , we&apos;ve sent a reset link. It expires in 60 minutes.
          </p>

          <div className="flex min-h-11 items-center justify-center pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCountdown > 0}
              className="auth-btn-secondary min-h-11"
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : "Resend the verification link"}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-4 sm:gap-5"
        >
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
      )}
    </AuthShell>
  );
}
