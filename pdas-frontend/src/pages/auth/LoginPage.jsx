import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DESTINATIONS } from "../../utils/constants";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember_me: z.boolean().optional(),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cardError, setCardError] = useState(null);

  // DO NOT CHANGE: empty fields validate on submit only
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "", remember_me: false },
  });

  const onSubmit = async (values) => {
    setCardError(null);
    try {
      const response = await login({
        identifier: values.email.trim(),
        password: values.password,
        remember_me: values.remember_me,
      });
      toast.success("Signed in successfully.");
      const destination =
        location.state?.from?.pathname ||
        ROLE_DESTINATIONS[response.data.role] ||
        "/dashboard";
      navigate(destination, { replace: true });
    } catch (error) {
      if (error.message === "Network Error") {
        setCardError("No connection. Please try again.");
      } else {
        setCardError("Invalid email or password.");
      }
    }
  };

  return (
    <AuthShell
      heading="Welcome back"
      description="Sign in to access your dashboard"
      layout="single"
      showHeaderBrand
      mobileCardMode="full"
      cardError={cardError}
      onClearCardError={() => setCardError(null)}
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
      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4 sm:gap-5">
        <div>
          <label className="auth-label" htmlFor="login-email">
            Email address
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
              id="login-email"
              {...register("email")}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              required
              className="auth-field auth-field-has-icon"
            />
          </div>
        </div>

        <AuthPasswordField
          id="login-password"
          label="Password"
          error={errors.password?.message}
          registration={register("password")}
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          labelAction={
            <Link
              to="/forgot-password"
              state={{ email: getValues("email") }}
              className="text-[13px] font-normal text-[#6B7280] no-underline hover:text-[#0D518C]"
            >
              Forgot password?
            </Link>
          }
        />

        <div className="flex items-center">
          <input
            id="login-remember"
            type="checkbox"
            {...register("remember_me")}
            className="h-4 w-4 rounded border-gray-300 text-cyber-600 focus:ring-cyber-500"
          />
          <label
            htmlFor="login-remember"
            className="ml-2 text-[13px] text-[#6B7280]"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-btn-primary"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <KeyRound size={16} />
          )}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
