import { AlertCircle } from "lucide-react";

export const AuthFieldError = ({ id, message }) => {
  if (!message) return null;

  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[0.76rem] leading-5 text-red-600">
      <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
};
