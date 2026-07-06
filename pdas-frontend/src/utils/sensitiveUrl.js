export const PENDING_VERIFICATION_EMAIL_KEY = "cybersense_pending_verification_email";

export const readFragmentParamOnce = (name) => {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  const value = new URLSearchParams(hash).get(name) || "";
  if (value) {
    window.history.replaceState(null, document.title, window.location.pathname);
  }
  return value;
};

export const setNoReferrerPolicy = () => {
  if (typeof document === "undefined") return () => {};
  const previous = document.querySelector('meta[name="referrer"]');
  const created = !previous;
  const meta = previous || document.createElement("meta");
  const previousContent = meta.getAttribute("content");
  meta.setAttribute("name", "referrer");
  meta.setAttribute("content", "no-referrer");
  if (created) document.head.appendChild(meta);

  return () => {
    if (created) {
      meta.remove();
    } else if (previousContent) {
      meta.setAttribute("content", previousContent);
    }
  };
};

export const storePendingVerificationEmail = (email) => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
};

export const getPendingVerificationEmail = () => {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || "";
};

export const clearPendingVerificationEmail = () => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
};
