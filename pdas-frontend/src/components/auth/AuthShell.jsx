import { useEffect, useId } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
import AuthLogoHeader from "./AuthLogoHeader";
import CyberSenseLogo from "./CyberSenseLogo";

/**
 * Auth page shell with an optional brand panel.
 *
 * layout = "immersive" (default): side-by-side brand panel + form
 * layout = "single": centered form card, no brand panel
 */
export const AuthShell = ({
  heading,
  description,
  children,
  footer,
  layout = "immersive",
  showHeaderBrand = false,
  mobileCardMode = "standard",
  brandTitle,
  brandSubtitle,
}) => {
  const headingId = useId();
  const isImmersive = layout === "immersive";
  const isCompactMobileCard = mobileCardMode === "full";

  useEffect(() => {
    if (typeof document !== "undefined" && heading) {
      document.title = `${heading} | CyberSense`;
    }
  }, [heading]);

  // Unified inner content to prevent code duplication
  const innerContent = (
    <>
      <header className="flex flex-col items-center text-center">
        <h1
          id={headingId}
          className="auth-heading font-bold tracking-tight text-slate-900"
        >
          {heading}
        </h1>
        {description && (
          <p className="auth-description mt-1 leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </header>

      <div className="mt-3.5 w-full min-w-0 sm:mt-4 flex-1">{children}</div>
      {footer && (
        <div className="w-full border-t border-slate-200/60 pt-3 mt-4">
          <div className="auth-footer-pill w-full flex items-center justify-center text-sm">
            {footer}
          </div>
        </div>
      )}
    </>
  );

  if (isImmersive) {
    return (
      <div className="auth-immersive-bg relative min-h-[100dvh] text-slate-900">
        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="auth-brand-enter hidden min-h-[520px] lg:block">
              <AuthBrandPanel title={brandTitle} subtitle={brandSubtitle} />
            </div>
            <div className="flex w-full justify-center lg:justify-start">
              <main
                aria-labelledby={headingId}
                className="auth-form-enter auth-glass-card relative w-full max-w-[24rem] px-5 py-5 sm:max-w-[26rem] sm:px-7 sm:py-7"
                style={{ borderRadius: "var(--auth-card-radius)" }}
              >
                {showHeaderBrand && (
                  <div className="mb-4 flex w-full justify-center lg:hidden">
                    <CyberSenseLogo variant="compact" className="h-10 w-auto" />
                  </div>
                )}
                {innerContent}
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Layout (Login, Register, Forgot Password, Reset Password, Verify Email)
  return (
    <div className="auth-immersive-bg auth-single-shell">
      <main
        aria-labelledby={headingId}
        className={`auth-form-enter auth-single-panel auth-glass-card relative flex w-full flex-col ${isCompactMobileCard ? "justify-between" : "justify-center"} overflow-visible px-5 py-5 sm:px-7 sm:py-7 ${isCompactMobileCard ? "auth-single-panel--mobile-full" : ""}`}
        style={{ borderRadius: "var(--auth-card-radius)" }}
      >
        {/* Stacked logo header inside the card */}
        {showHeaderBrand && <AuthLogoHeader />}
        {innerContent}
      </main>
    </div>
  );
};
