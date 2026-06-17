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
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>New to CyberSense?</p>
          <Link to="/register" className="font-semibold text-cyber-600 no-underline hover:text-cyber-700">
            Create an account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email or Username</span>
          <input
            {...register("identifier")}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Enter your email or username"
            className={`auth-field mt-2 ${errors.identifier ? "auth-field-error" : ""}`}
          />
          {errors.identifier && (
            <p className="mt-2 text-sm font-medium text-rose-600">{errors.identifier.message}</p>
          )}
        </label>

        <AuthPasswordField
          label="Password"
          error={errors.password?.message}
          registration={register("password")}
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-slate-500">Use the details assigned to your account.</p>
          <Link to="/forgot-password" className="font-semibold text-cyber-600 no-underline hover:text-cyber-700 whitespace-nowrap">
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
              className="rounded-[1.05rem] border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {submitError}
            </Motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          <KeyRound size={16} />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
