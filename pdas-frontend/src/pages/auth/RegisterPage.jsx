import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, UserPlus } from "lucide-react";
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
  const emailValue = useWatch({ control, name: "email" });
  const fullNameValue = useWatch({ control, name: "full_name" });

  const passwordState = useMemo(
    () => evaluatePassword(passwordValue, { username: usernameValue, email: emailValue, fullName: fullNameValue }),
    [emailValue, fullNameValue, passwordValue, usernameValue],
  );

  const showChecklist = passwordValue.length > 0;
  const emphasizeChecklist = showChecklist && (Boolean(touchedFields.password) || submitCount > 0);

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await registerAccount({
        username: values.username.trim().toLowerCase(),
        email: values.email.trim(),
        full_name: values.full_name.trim(),
        password: values.password,
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
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Already have an account?</p>
          <Link to="/login" className="font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              {...register("username")}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Choose a username"
              className={`auth-field mt-2 ${errors.username ? "auth-field-error" : ""}`}
            />
            {errors.username && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.username.message}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              className={`auth-field mt-2 ${errors.email ? "auth-field-error" : ""}`}
            />
            {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email.message}</p>}
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            {...register("full_name")}
            autoComplete="name"
            placeholder="Enter your full name"
            className={`auth-field mt-2 ${errors.full_name ? "auth-field-error" : ""}`}
          />
          {errors.full_name && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.full_name.message}</p>}
        </label>

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
              className="rounded-[1.05rem] border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {submitError}
            </Motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          <UserPlus size={16} />
          {isSubmitting ? "Creating account..." : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
