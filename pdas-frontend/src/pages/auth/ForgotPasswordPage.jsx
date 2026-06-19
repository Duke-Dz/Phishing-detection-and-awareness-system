import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AtSign } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthShell } from "../../components/auth/AuthShell";
import { authService } from "../../services/authService";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await authService.forgotPassword(values.email.trim());
      navigate(`/reset-password?email=${encodeURIComponent(values.email.trim().toLowerCase())}`, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to send reset code.");
    }
  };

  return (
    <AuthShell
      heading="Forgot password?"
      description="Enter the email address associated with your account and we'll send you a 6-digit code to reset your password."
      layout="single"
      showHeaderBrand
      footer={
        <>
          <p className="text-sm text-slate-500">Remember your password?</p>
          <Link to="/login" className="text-sm font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Sign in →
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="auth-label" htmlFor="forgot-email">Email address</label>
          <div className="auth-field-wrap">
            <span className="auth-field-icon">
              <AtSign size={15} />
            </span>
            <input
              id="forgot-email"
              {...register("email")}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              className={`auth-field auth-field-has-icon ${errors.email ? "auth-field-error" : ""}`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-[0.8rem] font-medium text-rose-600">{errors.email.message}</p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {submitError && (
            <Motion.div
              key="forgot-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="auth-alert auth-alert-error"
            >
              {submitError}
            </Motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          <AtSign size={16} />
          {isSubmitting ? "Sending code…" : "Send reset code"}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
