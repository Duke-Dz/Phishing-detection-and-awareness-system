import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, UserPlus, AtSign, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { PasswordChecklist } from "../../components/auth/PasswordChecklist";
import { useAuth } from "../../hooks/useAuth";
import { evaluatePassword } from "../../utils/passwordPolicy";

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(50, "Username is too long.")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores."),
    email: z.string().trim().email("Enter a valid email address."),
    full_name: z.string().trim().min(2, "Enter your full name."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .superRefine((values, ctx) => {
    const state = evaluatePassword(values.password, values);
    if (!state.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password does not meet all requirements.",
      });
    }
  });

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, touchedFields, submitCount },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", full_name: "", password: "" },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const usernameValue = useWatch({ control, name: "username" });
  const emailValue    = useWatch({ control, name: "email" });
  const fullNameValue = useWatch({ control, name: "full_name" });

  const passwordState = useMemo(
    () => evaluatePassword(passwordValue, { username: usernameValue, email: emailValue, fullName: fullNameValue }),
    [emailValue, fullNameValue, passwordValue, usernameValue],
  );

  const showChecklist     = passwordValue.length > 0;
  const emphasizeChecklist = showChecklist && (Boolean(touchedFields.password) || submitCount > 0);

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await registerAccount({
        username:  values.username.trim().toLowerCase(),
        email:     values.email.trim(),
        full_name: values.full_name.trim(),
        password:  values.password,
      });
      navigate(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to create your account.");
    }
  };

  return (
    <AuthShell
      heading="Get started"
      description="Create your account to start detecting phishing threats. We'll send a verification code to your email."
      layout="single"
      showHeaderBrand
      footer={
        <>
          <p className="text-sm text-slate-500">Already have an account?</p>
          <Link to="/login" className="text-sm font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Sign in →
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username + Email row */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Username */}
          <div>
            <label className="auth-label" htmlFor="reg-username">Username</label>
            <div className="auth-field-wrap">
              <span className="auth-field-icon">
                <User size={15} />
              </span>
              <input
                id="reg-username"
                {...register("username")}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Choose a username"
                className={`auth-field auth-field-has-icon ${errors.username ? "auth-field-error" : ""}`}
              />
            </div>
            {errors.username && (
              <p className="mt-1.5 text-[0.8rem] font-medium text-rose-600">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <div className="auth-field-wrap">
              <span className="auth-field-icon">
                <AtSign size={15} />
              </span>
              <input
                id="reg-email"
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
        </div>

        {/* Full name */}
        <div>
          <label className="auth-label" htmlFor="reg-fullname">Full name</label>
          <div className="auth-field-wrap">
            <span className="auth-field-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="reg-fullname"
              {...register("full_name")}
              autoComplete="name"
              placeholder="Enter your full name"
              className={`auth-field auth-field-has-icon ${errors.full_name ? "auth-field-error" : ""}`}
            />
          </div>
          {errors.full_name && (
            <p className="mt-1.5 text-[0.8rem] font-medium text-rose-600">{errors.full_name.message}</p>
          )}
        </div>

        <AuthPasswordField
          label="Password"
          error={errors.password?.message}
          registration={register("password")}
          autoComplete="new-password"
          placeholder="Create a strong password"
        />

        <PasswordChecklist passwordState={passwordState} show={showChecklist} emphasizeInvalid={emphasizeChecklist} />

        <AnimatePresence mode="wait">
          {submitError && (
            <Motion.div
              key="register-error"
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
          <UserPlus size={16} />
          {isSubmitting ? "Creating account…" : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
