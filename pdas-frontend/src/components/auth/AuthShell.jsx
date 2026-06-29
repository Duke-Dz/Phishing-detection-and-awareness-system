import { useEffect, useId } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
import AuthLogoHeader from "./AuthLogoHeader";
import CyberSenseLogo from "./CyberSenseLogo";
import { CardErrorToast } from "../ui/CardErrorToast";

export const AuthShell = ({
  heading,
  pageTitle,
  description,
  children,
  footer,
  layout = "immersive",
  showHeaderBrand = false,
  mobileCardMode = "standard",
  brandTitle,
  brandSubtitle,
  panelClassName = "",
  cardError = null,
  onClearCardError = () => {},
}) => {
  const headingId = useId();
  const isImmersive = layout === "immersive";
  const isCompactMobileCard = mobileCardMode === "full";

  useEffect(() => {
    if (typeof document !== "undefined") {
      const titleToUse = pageTitle || heading;
      if (titleToUse) {
        document.title = `${titleToUse} • CyberSense`;
      }
    }
  }, [heading, pageTitle]);

  const innerContent = (
    <>
      <header className="flex flex-col items-center text-center">
        <h1
          id={headingId}
          className="auth-heading font-bold tracking-tight text-slate-900 text-xl sm:text-2xl"
        >
          {heading}
        </h1>
        {description && (
          <p className="auth-description mt-2 leading-relaxed text-slate-600 text-xs sm:text-sm">
            {description}
          </p>
        )}
      </header>

      {/* FIX 1: removed flex-1, flex, flex-col, justify-center — was stretching this
               div to fill all remaining card height, creating fake whitespace */}
      <div className="mt-3.5 w-full min-w-0 sm:mt-4">{children}</div>

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
                <CardErrorToast message={cardError} onClose={onClearCardError} />
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
  return (
    <div className="auth-single-shell auth-immersive-bg">
      <main
        aria-labelledby={headingId}
        className={`auth-form-enter auth-single-panel auth-glass-card relative flex w-full flex-col justify-start overflow-visible p-6 sm:p-8 ${isCompactMobileCard ? "auth-single-panel--mobile-full" : ""} ${panelClassName}`}
        style={{ borderRadius: "var(--auth-card-radius)" }}
      >
        <CardErrorToast message={cardError} onClose={onClearCardError} />
        {showHeaderBrand && <AuthLogoHeader />}
        {innerContent}
      </main>
    </div>
  );
};
