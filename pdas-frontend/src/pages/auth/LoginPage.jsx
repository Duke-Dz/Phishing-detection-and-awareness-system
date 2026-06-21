import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthFieldError } from "../../components/auth/AuthFieldError";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DESTINATIONS } from "../../utils/constants";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or username is required."),
  password: z.string().min(1, "Password is required."),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
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
      setSubmitError("Incorrect email, username, or password. Please try again.");
    }
  };

  return (
    <AuthShell
      heading="Welcome back"
      layout="single"
      showHeaderBrand
      footer={
        <>
          <p className="text-sm text-black">New to CyberSense?</p>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => navigate("/register")}
            className="auth-bottom-link"
          >
            Create an account -&gt;
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="auth-label" htmlFor="login-identifier">
            Email or username
          </label>
          <div className="auth-field-wrap">
            <span className="auth-field-icon">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </span>
            <input
              id="login-identifier"
              {...register("identifier")}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              className={`auth-field auth-field-has-icon ${errors.identifier ? "auth-field-error" : ""}`}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
            />
          </div>
          <AuthFieldError id="login-identifier-error" message={errors.identifier?.message} />
        </div>

        <AuthPasswordField
          id="login-password"
          label="Password"
          error={errors.password?.message}
          registration={register("password")}
          autoComplete="current-password"
          placeholder="Enter your password"
          labelAction={
            <Link
              to="/forgot-password"
              state={{ email: getValues("identifier") }}
              className="text-[13px] font-normal text-[#6B7280] no-underline hover:text-[#0D518C]"
            >
              Forgot password?
            </Link>
          }
        />

        <AnimatePresence mode="wait">
          {submitError && (
            <Motion.div
              key="login-error"
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

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary">
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
