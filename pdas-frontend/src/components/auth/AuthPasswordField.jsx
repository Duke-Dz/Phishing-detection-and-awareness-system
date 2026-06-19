import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export const AuthPasswordField = ({
  label,
  error,
  registration,
  autoComplete,
  placeholder,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="auth-label">{label}</label>
      <div className="auth-field-wrap">
        {/* Left icon */}
        <span className="auth-field-icon">
          <Lock size={15} />
        </span>

        <input
          {...registration}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`auth-field auth-field-has-icon pr-11 ${error ? "auth-field-error" : ""}`}
        />

        {/* Show/hide toggle */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="auth-pw-toggle"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-[0.8rem] font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
};
