import { useEffect, useId } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
import CyberSenseLogo from "./CyberSenseLogo";

/**
 * Auth page shell — immersive layout with glassmorphism form card
 * and premium brand panel with floating animations.
 *
 * layout = "immersive" (default): side-by-side brand panel + form
 * layout = "single": centred form card, no brand panel
 */
export const AuthShell = ({
  heading,
  description,
  children,
  footer,
  layout = "immersive",
  showHeaderBrand = false,
  brandTitle,
  brandSubtitle,
}) => {
  const headingId = useId();
  const isImmersive = layout === "immersive";

  useEffect(() => {
    if (typeof document !== "undefined" && heading) {
      document.title = `${heading} | CyberSense`;
    }
  }, [heading]);

  const formCard = (
    <main
      aria-labelledby={headingId}
      className={
        isImmersive
          ? "auth-form-enter auth-glass-card relative h-auto w-full max-w-[26rem] px-6 py-5 sm:p-8"
          : "auth-form-enter auth-glass-card relative h-auto w-full px-6 py-5 sm:p-8"
      }
      style={{ borderRadius: "var(--auth-card-radius)" }}
    >
      {/* Logo — show inline if requested */}
      {showHeaderBrand && (
        <div className={`mb-2 sm:mb-3 ${isImmersive ? "lg:hidden flex justify-center" : "flex justify-center"}`}>
          <CyberSenseLogo />
        </div>
      )}

      <header className={(!isImmersive || showHeaderBrand) ? "text-center" : "text-center lg:text-left"}>
        <h1
          id={headingId}
          className="text-[1.75rem] font-bold text-black sm:text-[1.9rem]"
          style={{ lineHeight: "1.1" }}
        >
          {heading}
        </h1>
        {description && (
          <p
            className={`mt-2 text-[0.93rem] leading-[1.7] text-black ${
              (!isImmersive || showHeaderBrand) ? "mx-auto max-w-[22rem]" : "max-w-xl"
            }`}
          >
            {description}
          </p>
        )}
      </header>

      <div className="mt-4">{children}</div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-200/60">
          <div className="auth-footer-pill">
            {footer}
          </div>
        </div>
      )}
    </main>
  );

  if (isImmersive) {
    return (
      <div className="auth-immersive-bg relative min-h-screen text-slate-900">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Brand panel — hidden on mobile */}
            <div className="auth-brand-enter hidden min-h-[520px] lg:block">
              <AuthBrandPanel title={brandTitle} subtitle={brandSubtitle} />
            </div>

            {/* Form card */}
            <div className="flex justify-center lg:justify-start">
              {formCard}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Single-column layout ────────────────────────────────────────────────────
  return (
    <div className="auth-immersive-bg relative min-h-screen text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="relative z-10 w-full" style={{ maxWidth: "min(100%, 26rem)" }}>
        {formCard}
      </div>
    </div>
  );
};
