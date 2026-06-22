import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthFieldError } from "./AuthFieldError";

const LockIcon = ({ size = 15, unlocked = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transition: "color 0.2s ease" }}
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path
      d={
        unlocked
          ? "M7 11V7a5 5 0 0 1 9.9-1"
          : "M7 11V7a5 5 0 0 1 10 0v4"
      }
    />
  </svg>
);

export const AuthPasswordField = ({
  label,
  error,
  registration,
  autoComplete,
  placeholder,
  id,
  labelAction,
  valid,
  onFocus,
  onBlur,
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="auth-label-row">
        <label className="auth-label" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>

      <div className="auth-field-wrap">
        <span
          className="auth-field-icon"
          style={{ color: visible ? "#0D518C" : undefined, transition: "color 0.2s ease" }}
        >
          <LockIcon size={15} unlocked={visible} />
        </span>

        <input
          id={id}
          {...registration}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`auth-field auth-field-has-icon pr-11 ${valid ? "auth-field-success" : ""}`}
          onFocus={(e) => {
            if (onFocus) onFocus(e);
            if (registration?.onFocus) registration.onFocus(e);
          }}
          onBlur={(e) => {
            if (onBlur) onBlur(e);
            if (registration?.onBlur) registration.onBlur(e);
          }}
          style={{ backgroundColor: "rgba(255,255,255,0.94)" }}
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="auth-pw-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          style={{ color: visible ? "#0D518C" : undefined, transition: "color 0.2s ease" }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
};
