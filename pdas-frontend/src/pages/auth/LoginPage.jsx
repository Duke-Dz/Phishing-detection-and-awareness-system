import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DESTINATIONS } from "../../utils/constants";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      const response = await login({
        identifier: values.identifier.trim(),
        password: values.password,
      });
      const destination =
        location.state?.from?.pathname ||
        ROLE_DESTINATIONS[response.data.role] ||
        "/dashboard";
      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to sign in.");
    }
  };

  return (
    <AuthShell
      heading="Welcome back"
      description="Sign in with your email or username and password to continue."
      layout="single"
      showHeaderBrand
      footer={
        <>
          <p className="text-sm text-slate-500">New to CyberSense?</p>
          <Link to="/register" className="text-sm font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Create an account →
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email / username field */}
        <div>
          <label className="auth-label" htmlFor="login-identifier">Email or Username</label>
          <div className="auth-field-wrap">
            <span className="auth-field-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </span>
            <input
              id="login-identifier"
              {...register("identifier")}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter your email or username"
              className={`auth-field auth-field-has-icon ${errors.identifier ? "auth-field-error" : ""}`}
            />
          </div>
          {errors.identifier && (
            <p className="mt-1.5 text-[0.8rem] font-medium text-rose-600">{errors.identifier.message}</p>
          )}
        </div>

        <AuthPasswordField
          label="Password"
          error={errors.password?.message}
          registration={register("password")}
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-slate-500 text-[0.83rem]">Use the details assigned to your account.</p>
          <Link to="/forgot-password" className="text-[0.83rem] font-semibold text-cyber-600 no-underline hover:text-cyber-700 whitespace-nowrap">
            Forgot password?
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {submitError && (
            <Motion.div
              key="login-error"
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
          <KeyRound size={16} />
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
