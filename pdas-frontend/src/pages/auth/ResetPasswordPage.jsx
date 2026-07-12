import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { PasswordRequirementsPopover } from "../../components/auth/PasswordRequirementsPopover";
import { getErrorMessage } from "../../services/api";
import { authService } from "../../services/authService";
import { PASSWORD_RULES } from "../../utils/constants";
import { evaluatePassword } from "../../utils/passwordPolicy";
import { readFragmentParamOnce, setNoReferrerPolicy } from "../../utils/sensitiveUrl";

const escapeHtmlPattern = (value = "") =>
  String(value).replace(/[\\^$.*+?()[\]{}|/\-]/g, "\\$&");

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
  const [token] = useState(() => readFragmentParamOnce("token"));

  const [success, setSuccess] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => setNoReferrerPolicy(), []);

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
  const onSubmit = async (values) => {
    setCardError(null);
    try {
      await authService.resetPassword({
        token,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      setSuccess(true);
      toast.success("Password updated.", { id: "password-updated" });
    } catch (error) {
      setCardError(
        getErrorMessage(
          error,
          "We could not reset your password. Please request a new link.",
        ),
      );
    }
  };

  if (!token) {
    return (
      <AuthShell
        heading="Invalid reset link"
        description="Request a new reset link to choose a new password."
        layout="single"
        showHeaderBrand
        panelClassName="auth-reset-panel"
        footer={
          <Link
            to="/login"
            className="text-sm font-semibold text-black no-underline hover:text-cyber-700"
          >
            Back to sign in -&gt;
          </Link>
        }
      >
        <div
          className="auth-alert auth-alert-warning auth-alert-no-accent"
          role="alert"
        >
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
      headerAccessory={success ? (
        <div
          className="mt-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"
          aria-hidden="true"
        >
          <CheckCircle2 size={24} strokeWidth={2.25} />
        </div>
      ) : null}
      description={
        success
          ? "Your password is secure and all active sessions have been signed out."
          : "Choose a new password for your account."
      }
      layout="single"
      showHeaderBrand
      panelClassName="auth-reset-panel"
      cardError={cardError}
      onClearCardError={() => setCardError(null)}
      mobileCardMode="full"
      footer={success ? null : (
        <>
          <p className="text-sm text-black">Back to your account?</p>
          <Link
            to="/login"
            className="text-sm font-semibold text-black no-underline hover:text-cyber-700"
          >
            Back to sign in -&gt;
          </Link>
        </>
      )}
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
            <Link to="/login" className="auth-btn-primary no-underline">
              <KeyRound size={16} />
              Continue to sign in
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
            <div className="space-y-3">
              <div className="relative">
                <AuthPasswordField
                  id="reset-new-password"
                  label="New password"
                  error={errors.new_password?.message}
                  registration={register("new_password")}
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  minLength={PASSWORD_RULES.minLength}
                  maxLength={PASSWORD_RULES.maxLength}
                  pattern={'(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*\\(\\),.?":\\{\\}\\|<>]).{8,128}'}
                  title="Use 8–128 characters with uppercase, lowercase, a number, and a special character."
                  onInput={(event) => event.currentTarget.setCustomValidity("")}
                  onInvalid={(event) => {
                    if (event.currentTarget.validity.patternMismatch) {
                      event.currentTarget.setCustomValidity(
                        "Please meet all password creation requirements.",
                      );
                    }
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                />
                <PasswordRequirementsPopover
                  visible={isPasswordFocused}
                  passwordState={passwordState}
                />
              </div>
              <AuthPasswordField
                id="reset-confirm-password"
                label="Confirm new password"
                error={errors.confirm_password?.message}
                registration={register("confirm_password")}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                minLength={PASSWORD_RULES.minLength}
                maxLength={PASSWORD_RULES.maxLength}
                pattern={escapeHtmlPattern(passwordValue)}
                title="Enter the same password in both fields."
                onInput={(event) => event.currentTarget.setCustomValidity("")}
                onInvalid={(event) => {
                  if (event.currentTarget.validity.patternMismatch) {
                    event.currentTarget.setCustomValidity(
                      "Passwords do not match.",
                    );
                  }
                }}
                required
              />
            </div>

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
