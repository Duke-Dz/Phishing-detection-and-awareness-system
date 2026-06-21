import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AtSign, Hash, Loader2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AuthFieldError } from "../../components/auth/AuthFieldError";
import { AuthPasswordField } from "../../components/auth/AuthPasswordField";
import { AuthShell } from "../../components/auth/AuthShell";
import { PasswordChecklist } from "../../components/auth/PasswordChecklist";
import { useAuth } from "../../hooks/useAuth";
import { PASSWORD_RULES } from "../../utils/constants";
import { evaluatePassword } from "../../utils/passwordPolicy";

const nameSchema = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(50, "Keep this under 50 characters.")
  .regex(/^[a-zA-Z\s'-]+$/, "Use letters, spaces, hyphens, or apostrophes.");

const registerSchema = z
  .object({
    first_name: nameSchema,
    last_name: nameSchema,
    username: z
      .string()
      .trim()
      .min(3, "At least 3 characters.")
      .max(50, "Username is too long.")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(PASSWORD_RULES.minLength, `At least ${PASSWORD_RULES.minLength} characters required.`)
      .max(PASSWORD_RULES.maxLength, `Password must be ${PASSWORD_RULES.maxLength} characters or fewer.`),
    terms: z.literal(true, { errorMap: () => ({ message: "Accept the terms to continue." }) }),
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
    formState: { errors, isSubmitting, touchedFields },
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

  const isValid = (field) => touchedFields[field] && !errors[field];

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

  const showChecklist = passwordValue.length > 0;

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await registerAccount({
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        full_name: `${values.first_name.trim()} ${values.last_name.trim()}`,
        password: values.password,
      });
      navigate(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to create your account.");
    }
  };

  return (
    <AuthShell
      heading="Create your account"
      layout="single"
      showHeaderBrand
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
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
                aria-invalid={Boolean(errors.first_name)}
                aria-describedby={errors.first_name ? "first_name-error" : undefined}
                className={`auth-field auth-field-has-icon pr-9 ${errors.first_name ? "auth-field-error" : isValid("first_name") ? "auth-field-success" : ""}`}
              />
            </div>
            <AuthFieldError id="first_name-error" message={errors.first_name?.message} />
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
                aria-invalid={Boolean(errors.last_name)}
                aria-describedby={errors.last_name ? "last_name-error" : undefined}
                className={`auth-field auth-field-has-icon pr-9 ${errors.last_name ? "auth-field-error" : isValid("last_name") ? "auth-field-success" : ""}`}
              />
            </div>
            <AuthFieldError id="last_name-error" message={errors.last_name?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? "username-error" : undefined}
                className={`auth-field auth-field-has-icon pr-9 ${errors.username ? "auth-field-error" : isValid("username") ? "auth-field-success" : ""}`}
              />
            </div>
            <AuthFieldError id="username-error" message={errors.username?.message} />
          </div>

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
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`auth-field auth-field-has-icon pr-9 ${errors.email ? "auth-field-error" : isValid("email") ? "auth-field-success" : ""}`}
                style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}
              />
            </div>
            <AuthFieldError id="email-error" message={errors.email?.message} />
          </div>
        </div>

        <div>
          <AuthPasswordField
            id="reg-password"
            label="Password"
            error={errors.password?.message}
            registration={register("password")}
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={PASSWORD_RULES.minLength}
            maxLength={PASSWORD_RULES.maxLength}
            valid={isValid("password")}
          />
        </div>

        <PasswordChecklist id="reg-password-checklist" passwordState={passwordState} show={showChecklist} />

        <div className="mt-2">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="reg-terms"
              {...register("terms")}
              className="mt-1"
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? "terms-error" : undefined}
            />
            <label htmlFor="reg-terms" className="text-sm leading-5 text-slate-600">
              I agree to the{" "}
              <Link to="/terms" style={{ color: "#1D4ED8", textDecoration: "underline", fontWeight: 500 }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" style={{ color: "#1D4ED8", textDecoration: "underline", fontWeight: 500 }}>
                Privacy Policy
              </Link>
            </label>
          </div>
          <AuthFieldError id="terms-error" message={errors.terms?.message} />
        </div>

        <AnimatePresence mode="wait">
          {submitError && (
            <Motion.div
              key="register-error"
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
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
          {isSubmitting ? "Creating account..." : "Create account"}
          {!isSubmitting && <ArrowRight size={16} />}
        </button>
      </form>
    </AuthShell>
  );
}
