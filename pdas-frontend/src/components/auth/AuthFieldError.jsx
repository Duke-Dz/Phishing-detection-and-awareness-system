import { AlertCircle, User, Hash, AtSign, Lock } from "lucide-react";

export const AuthFieldError = ({ id, message, icon }) => {
  if (!message) return null;
  
  let IconComponent = AlertCircle;
  if (icon === 'user') IconComponent = User;
  if (icon === 'hash') IconComponent = Hash;
  if (icon === 'email') IconComponent = AtSign;
  if (icon === 'lock') IconComponent = Lock;

  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[0.76rem] leading-5 text-red-600">
      <IconComponent size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
};
