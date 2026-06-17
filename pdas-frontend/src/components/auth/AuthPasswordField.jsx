import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const AuthPasswordField = ({
  label,
  error,
  registration,
  autoComplete,
  placeholder,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative mt-2">
        <input
          {...registration}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`auth-field pr-11 ${error ? "auth-field-error" : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
      )}
    </label>
  );
};
