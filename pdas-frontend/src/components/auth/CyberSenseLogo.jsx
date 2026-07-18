import authLogo from "../../assets/branding/cybersense-auth.png";
import dashboardLogo from "../../assets/branding/cybersense-dashboard.png";
import brandMark from "../../assets/branding/cybersense-mark.png";

const markSizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

export function CyberSenseShield({ className = "" }) {
  return (
    <img
      src={brandMark}
      alt=""
      className={`block object-contain ${className}`}
      aria-hidden="true"
      draggable="false"
    />
  );
}

export default function CyberSenseLogo({
  variant = "default",
  stacked = false,
  showWordmark = true,
  iconSize = "md",
  darkModeBlend = false,
  className = "",
}) {
  if (!showWordmark) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${className}`}
        role="img"
        aria-label="CyberSense"
      >
        <img
          src={brandMark}
          alt=""
          className={`block object-contain ${markSizes[iconSize] || markSizes.md}`}
          aria-hidden="true"
          draggable="false"
        />
      </span>
    );
  }

  const useAuthLockup = stacked || variant === "auth";
  const blendWithDarkSurface = darkModeBlend && !useAuthLockup;
  return (
    <span
      className={`auth-logo-container inline-flex max-w-full items-center justify-center ${
        useAuthLockup ? "auth-logo-container--stacked" : "auth-logo-compact"
      } ${blendWithDarkSurface ? "dashboard-logo-lockup" : ""} ${className}`}
      role="img"
      aria-label="CyberSense — Security Intelligence"
    >
      <img
        src={useAuthLockup ? authLogo : dashboardLogo}
        alt=""
        className={useAuthLockup ? "auth-brand-logo auth-brand-logo--auth" : "auth-brand-logo auth-brand-logo--lockup"}
        aria-hidden="true"
        draggable="false"
      />
      {blendWithDarkSurface && (
        <>
          <img
            src={dashboardLogo}
            alt=""
            className="auth-brand-logo auth-brand-logo--lockup dashboard-logo-lockup__wordmark"
            aria-hidden="true"
            draggable="false"
          />
          <img
            src={dashboardLogo}
            alt=""
            className="auth-brand-logo auth-brand-logo--lockup dashboard-logo-lockup__tagline"
            aria-hidden="true"
            draggable="false"
          />
        </>
      )}
    </span>
  );
}
