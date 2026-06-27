import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { PasswordChecklist } from "../../components/auth/PasswordChecklist";
import { authService } from "../../services/authService";
import { PASSWORD_RULES } from "../../utils/constants";
import { evaluatePassword } from "../../utils/passwordPolicy";

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(
        PASSWORD_RULES.minLength,
        `Password must be at least ${PASSWORD_RULES.minLength} characters.`,
      )
      .max(
        PASSWORD_RULES.maxLength,
        `Password must be ${PASSWORD_RULES.maxLength} characters or fewer.`,
      ),
    confirm_password: z.string().min(1, "Please confirm your password."),
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
  const token = searchParams.get("token") || "";
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const passwordValue = useWatch({ control, name: "new_password" });
  const passwordState = useMemo(
    () => evaluatePassword(passwordValue),
    [passwordValue],
  );
  const showChecklist = passwordValue.length > 0;

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await authService.resetPassword({
        token,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      setSuccess(true);
    } catch (error) {
      setSubmitError(error.message || "Unable to reset the password.");
    }
  };

  if (!token) {
    return (
      <AuthShell
        heading="Invalid reset link"
        description="Request a new reset link to choose a new password."
        layout="single"
        showHeaderBrand
        footer={
          <Link
            to="/login"
            className="text-sm font-semibold text-black no-underline hover:text-cyber-700"
          >
            Back to sign in -&gt;
          </Link>
        }
      >
        <div className="auth-alert auth-alert-warning" role="alert">
          This reset link is missing or invalid. Please request a new password
          reset.
        </div>
        <Link
          to="/forgot-password"
          className="auth-btn-primary mt-4 no-underline"
        >
          <KeyRound size={16} />
          Request reset link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading={success ? "Password updated" : "Reset your password"}
      description={
        success
          ? "Your password has been changed. Sign in with your new credentials."
          : "Choose a new password for your account."
      }
      layout="single"
      showHeaderBrand
      mobileCardMode="full"
      footer={
        <>
          <p className="text-sm text-black">Back to your account?</p>
          <Link
            to="/login"
            className="text-sm font-semibold text-black no-underline hover:text-cyber-700"
          >
            Back to sign in -&gt;
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {success ? (
          <Motion.div
            key="reset-success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
            role="status"
            aria-live="polite"
          >
            <div className="auth-success-icon">
              <CheckCircle2
                size={26}
                className="text-cyber-600"
                aria-hidden="true"
              />
            </div>
            <div className="auth-alert auth-alert-success">
              Your password has been reset successfully. All previous sessions
              have been revoked.
            </div>
            <Link to="/login" className="auth-btn-primary no-underline">
              <KeyRound size={16} />
              Back to sign in
            </Link>
          </Motion.div>
        ) : (
          <Motion.form
            key="reset-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <AuthPasswordField
                id="reset-new-password"
                label="New password"
                error={errors.new_password?.message}
                registration={register("new_password")}
                autoComplete="new-password"
                placeholder="Create a password"
                minLength={PASSWORD_RULES.minLength}
                maxLength={PASSWORD_RULES.maxLength}
                required
              />
              <AuthPasswordField
                id="reset-confirm-password"
                label="Confirm password"
                error={errors.confirm_password?.message}
                registration={register("confirm_password")}
                autoComplete="new-password"
                placeholder="Repeat password"
                minLength={PASSWORD_RULES.minLength}
                maxLength={PASSWORD_RULES.maxLength}
                required
              />
            </div>

            <PasswordChecklist
              id="reset-password-checklist"
              passwordState={passwordState}
              show={showChecklist}
            />

            <AnimatePresence mode="wait">
              {submitError && (
                <Motion.div
                  key="reset-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="auth-alert auth-alert-error"
                  role="alert"
                >
                  {submitError}
                </Motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-btn-primary"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </Motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
