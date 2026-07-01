import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  AtSign,
  Hash,
  Loader2,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { toast } from "sonner";

import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { useAuth } from "../../hooks/useAuth";
import { PASSWORD_RULES } from "../../utils/constants";
import { evaluatePassword } from "../../utils/passwordPolicy";
import { setVerificationCooldown } from "../../utils/verificationCooldown";

const registerSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "Enter your first name")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Use letters, spaces, hyphens, or apostrophes.",
      ),
    last_name: z
      .string()
      .trim()
      .min(1, "Enter your last name")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Use letters, spaces, hyphens, or apostrophes.",
      ),
    username: z
      .string()
      .trim()
      .min(3, "Choose a username with at least 3 characters")
      .max(50, "Username is too long")
      .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores"),
    email: z
      .string()
      .trim()
      .min(1, "Enter a valid email - example@domain.com")
      .email("Enter a valid email - example@domain.com"),
    password: z.string().min(1, "Create a password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Accept the terms to continue." }),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.password) {
      if (values.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password must be at least 8 characters",
        });
      } else if (!/[A-Z]/.test(values.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Add at least one uppercase letter (A-Z)",
        });
      } else if (!/[0-9]/.test(values.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Add at least one number (0-9)",
        });
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(values.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Add a special character (!@#$...)",
        });
      }
    }
  });

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [cardError, setCardError] = useState(null);

  // DO NOT CHANGE: empty fields validate on submit only
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      terms: false,
    },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const usernameValue = useWatch({ control, name: "username" });
  const emailValue = useWatch({ control, name: "email" });
  const firstNameValue = useWatch({ control, name: "first_name" });
  const lastNameValue = useWatch({ control, name: "last_name" });

  const passwordState = useMemo(
    () =>
      evaluatePassword(passwordValue, {
        username: usernameValue,
        email: emailValue,
        fullName: `${firstNameValue} ${lastNameValue}`,
      }),
    [emailValue, firstNameValue, lastNameValue, passwordValue, usernameValue],
  );

  const onSubmit = async (values) => {
    setCardError(null);
    try {
      const response = await registerAccount({
        username: values.username.trim().toLowerCase(),
        full_name: `${values.first_name.trim()} ${values.last_name.trim()}`,
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      const normalizedEmail = values.email.trim().toLowerCase();
      setVerificationCooldown(normalizedEmail, response.resend_available_in || 120);
      toast.success("Account created successfully.", {
        position: "top-center",
      });
      navigate(
        `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
        { replace: true },
      );
    } catch (error) {
      if (error.code === "NETWORK_ERROR") {
        setCardError(error.message);
      } else if (error.message?.toLowerCase().includes("username")) {
        setCardError("That username is already taken.");
      } else if (error.message?.toLowerCase().includes("email") || error.message?.toLowerCase().includes("exist")) {
        setCardError("Email already in use.");
      } else {
        setCardError(error.message);
      }
    }
  };

  return (
    <AuthShell
      heading="Create your account"
      layout="single"
      showHeaderBrand
      cardError={cardError}
      onClearCardError={() => setCardError(null)}
      footer={
        <>
          <p className="text-sm text-black">Already have an account?</p>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => navigate("/login")}
            className="auth-bottom-link"
          >
            Sign in -&gt;
          </button>
        </>
      }
    >
        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="auth-label" htmlFor="reg-firstname">
                First name
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="reg-firstname"
                  {...register("first_name")}
                  autoFocus
                  autoComplete="given-name"
                  placeholder="John"
                  required
                  className="auth-field auth-field-has-icon"
                />
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="reg-lastname">
                Last name
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="reg-lastname"
                  {...register("last_name")}
                  autoComplete="family-name"
                  placeholder="Doe"
                  required
                  className="auth-field auth-field-has-icon"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="auth-label" htmlFor="reg-username">
              Username
            </label>
            <div className="auth-field-wrap">
              <span className="auth-field-icon">
                <Hash size={15} aria-hidden="true" />
              </span>
              <input
                id="reg-username"
                {...register("username")}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="johndoe"
                minLength={3}
                maxLength={50}
                required
                className="auth-field auth-field-has-icon"
              />
            </div>
          </div>

          <div>
            <div>
              <label className="auth-label" htmlFor="reg-email">
                Email
              </label>
              <div className="auth-field-wrap">
                <span className="auth-field-icon">
                  <AtSign size={15} aria-hidden="true" />
                </span>
                <input
                  id="reg-email"
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
          </div>

          <div className="relative">
            <AuthPasswordField
              id="reg-password"
              label="Password"
              error={errors.password?.message}
              registration={register("password")}
              autoComplete="new-password"
              placeholder="Create a password"
              minLength={PASSWORD_RULES.minLength}
              maxLength={PASSWORD_RULES.maxLength}
              valid={false}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />

            <AnimatePresence>
              {isPasswordFocused && (
                <Motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="auth-pw-popover absolute z-50 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-[8px] p-[10px_14px] w-full max-w-[260px] bottom-full left-0 mb-2 sm:bottom-auto sm:top-0 sm:left-full sm:ml-3 sm:mb-0 sm:w-[220px]"
                >
                  <div className="absolute -bottom-[6px] left-[20px] w-0 h-0 border-t-[6px] border-t-white border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent sm:hidden" />
                  <div className="absolute top-[32px] -left-[6px] hidden sm:block w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-white border-b-[6px] border-b-transparent" />

                  <ul className="flex flex-col gap-1.5">
                    {passwordState.checks?.map((check) => (
                      <li
                        key={check.id}
                        className="flex items-start gap-2 text-[12px] leading-tight"
                      >
                        {check.passed ? (
                          <Check
                            size={14}
                            strokeWidth={3}
                            className="text-emerald-500 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <X
                            size={14}
                            strokeWidth={3}
                            className="text-slate-300 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={
                            check.passed ? "text-slate-800" : "text-slate-500"
                          }
                        >
                          {check.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-1.5">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="reg-terms"
                {...register("terms")}
                required
                className="mt-1"
              />
              <label
                htmlFor="reg-terms"
                className="text-[13px] leading-5 text-slate-600"
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              >
                I agree to the{" "}
                <Link to="/terms" style={{ color: "#0D818C", fontWeight: 500 }}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  style={{ color: "#0D818C", fontWeight: 500 }}
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-btn-primary"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <UserPlus size={16} />
            )}
            {isSubmitting ? "Creating account..." : "Create account"}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>
    </AuthShell>
  );
}
