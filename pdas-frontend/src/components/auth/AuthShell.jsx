import { useEffect, useId } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";
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
          : "auth-form-enter auth-glass-card relative h-auto w-full px-5 py-5 sm:px-8 sm:py-7"
      }
      style={{ borderRadius: "var(--auth-card-radius)" }}
    >
      {showHeaderBrand && (
        <div
          className={`auth-header-logo mb-3 ${isImmersive ? "lg:hidden flex justify-center" : "flex justify-center"}`}
        >
          <CyberSenseLogo variant="compact" />
        </div>
      )}

      <header
        className={
          !isImmersive || showHeaderBrand
            ? "text-center"
            : "text-center lg:text-left"
        }
      >
        <h1
          id={headingId}
          className="auth-heading text-2xl font-bold text-black sm:text-[1.75rem] lg:text-[1.9rem]"
          style={{ lineHeight: "1.1" }}
        >
          {heading}
        </h1>
        {description && (
          <p
            className={`mt-2 text-[0.93rem] leading-[1.7] text-black ${
              !isImmersive || showHeaderBrand
                ? "mx-auto max-w-[22rem]"
                : "max-w-xl"
            }`}
          >
            {description}
          </p>
        )}
      </header>

      <div className="mt-4 sm:mt-5">{children}</div>

      {footer && (
        <div className="mt-4 border-t border-slate-200/60 pt-3">
          <div className="auth-footer-pill">{footer}</div>
        </div>
      )}
    </main>
  );

  if (isImmersive) {
    return (
      <div className="auth-immersive-bg relative min-h-[100dvh] text-slate-900">
        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="auth-brand-enter hidden min-h-[520px] lg:block">
              <AuthBrandPanel title={brandTitle} subtitle={brandSubtitle} />
            </div>

            <div className="flex justify-center lg:justify-start">
              {formCard}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-immersive-bg auth-single-shell relative grid min-h-[100svh] overflow-x-hidden overflow-y-auto px-4 py-8 text-slate-900 sm:p-6 lg:p-8">
      <div className="auth-single-panel relative z-10 w-full max-w-[26rem] mx-auto">
        {formCard}
      </div>
    </div>
  );
};
