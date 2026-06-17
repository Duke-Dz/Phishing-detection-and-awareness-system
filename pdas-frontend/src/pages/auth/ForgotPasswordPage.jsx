import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
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
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Remember your password?</p>
          <Link to="/login" className="font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email address</span>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            className={`auth-field mt-2 ${errors.email ? "auth-field-error" : ""}`}
          />
          {errors.email && <p className="mt-2 text-sm font-medium text-rose-600">{errors.email.message}</p>}
        </label>

        <AnimatePresence mode="wait">
          {submitError && (
            <Motion.div
              key="forgot-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="rounded-[1.05rem] border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {submitError}
            </Motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          <Mail size={16} />
          {isSubmitting ? "Sending code..." : "Send reset code"}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
