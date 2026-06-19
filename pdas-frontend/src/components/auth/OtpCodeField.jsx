import { useCallback, useEffect, useRef } from "react";

export const OtpCodeField = ({ value = "", onChange, length = 6, error, label }) => {
  const inputs = useRef([]);

  const focusInput = (index) => {
    if (inputs.current[index]) {
      inputs.current[index].focus();
      inputs.current[index].select();
    }
  };

  const handleChange = useCallback(
    (index, e) => {
      const char = e.target.value.replace(/\D/g, "").slice(-1);
      const chars = value.split("");
      chars[index] = char;
      const newValue = chars.join("").slice(0, length);
      onChange(newValue);
      if (char && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, length],
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        focusInput(index - 1);
      }
      if (e.key === "ArrowLeft" && index > 0) {
        focusInput(index - 1);
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, length],
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      focusInput(nextIndex);
    },
    [onChange, length],
  );

  useEffect(() => {
    if (value.length === 0) {
      focusInput(0);
    }
  }, [value.length]);

  return (
    <div>
      {label && (
        <p className="auth-label mb-3">{label}</p>
      )}

      <div className="flex justify-center gap-2 sm:gap-2.5">
        {Array.from({ length }).map((_, i) => {
          const isFilled = Boolean(value[i]);
          const cellClass = [
            "auth-otp-cell",
            error
              ? "auth-otp-cell-error"
              : isFilled
              ? "auth-otp-cell-filled"
              : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value[i] || ""}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              autoComplete="one-time-code"
              className={cellClass}
            />
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-center text-[0.82rem] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
};
