import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { PasswordChecklist } from "../../components/auth/PasswordChecklist";
import { OtpCodeField } from "../../components/auth/OtpCodeField";
import { authService } from "../../services/authService";
import { evaluatePassword } from "../../utils/passwordPolicy";

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  })
  .superRefine((values, ctx) => {
    const state = evaluatePassword(values.new_password);
    if (!state.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_password"],
        message: "Password does not meet all requirements.",
      });
    }
  });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, touchedFields, submitCount },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const passwordValue = useWatch({ control, name: "new_password" });
  const passwordState = useMemo(() => evaluatePassword(passwordValue), [passwordValue]);

  const showChecklist = passwordValue.length > 0;
  const emphasizeChecklist = showChecklist && (Boolean(touchedFields.new_password) || submitCount > 0);

  const onSubmit = async (values) => {
    if (otpCode.length !== 6) {
      setOtpError("Enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    setSubmitError("");
    try {
      await authService.resetPassword({
        email,
        otp_code: otpCode,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      setSuccess(true);
    } catch (error) {
      setSubmitError(error.message || "Unable to reset the password.");
    }
  };

  if (!email) {
    return (
      <AuthShell
        heading="Missing information"
        description="We need your email to reset your password."
        layout="single"
        showHeaderBrand
        footer={
          <Link to="/forgot-password" className="text-sm font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Request a new reset code
          </Link>
        }
      >
        <div className="rounded-[1.05rem] border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-medium text-amber-800">
          No email address provided. Please request a new password reset.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading={success ? "Password updated" : "Reset your password"}
      description={
        success
          ? "Your password has been changed. Sign in with your new credentials."
          : "Enter the 6-digit code sent to your email and choose a new password."
      }
      layout="single"
      showHeaderBrand
      footer={
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Back to your account?</p>
          <Link to="/login" className="font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Sign in
          </Link>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {success ? (
          <Motion.div
            key="reset-success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/60 bg-emerald-50/80">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div className="rounded-[1.05rem] border border-emerald-200/70 bg-emerald-50/85 px-4 py-3 text-sm font-medium text-emerald-700">
              Your password has been reset successfully. All previous sessions have been revoked.
            </div>
            <Link to="/login" className="auth-btn-primary no-underline">
              <KeyRound size={16} />
              Sign in
            </Link>
          </Motion.div>
        ) : (
          <Motion.form
            key="reset-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <OtpCodeField
              label="Reset code"
              value={otpCode}
              onChange={(v) => { setOtpCode(v); setOtpError(""); }}
              length={6}
              error={otpError}
            />

            <AuthPasswordField
              label="New password"
              error={errors.new_password?.message}
              registration={register("new_password")}
              autoComplete="new-password"
              placeholder="Enter a new password"
            />

            <PasswordChecklist passwordState={passwordState} show={showChecklist} emphasizeInvalid={emphasizeChecklist} />

            <AuthPasswordField
              label="Confirm password"
              error={errors.confirm_password?.message}
              registration={register("confirm_password")}
              autoComplete="new-password"
              placeholder="Confirm your new password"
            />

            <AnimatePresence mode="wait">
              {submitError && (
                <Motion.div
                  key="reset-error"
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
              <CheckCircle2 size={16} />
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </Motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
