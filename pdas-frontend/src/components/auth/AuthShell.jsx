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

  const BrandHeader = () => {
    if (!showHeaderBrand) return null;
    return (
      <div
        className={`mb-6 flex w-full flex-col items-center justify-center sm:mb-8 ${isImmersive ? "lg:hidden" : ""}`}
      >
        <CyberSenseLogo
          variant="compact"
          className="h-12 w-auto scale-110 transition-transform sm:h-14 sm:scale-125"
        />
      </div>
    );
  };

  const formCard = (
    <main
      aria-labelledby={headingId}
      className={
        isImmersive
          ? "auth-form-enter auth-glass-card relative h-auto w-full max-w-[26rem] px-6 py-8 sm:p-8"
          : "auth-form-enter relative mx-auto flex w-full max-w-[28rem] flex-col px-4 py-6 sm:auth-glass-card sm:px-10 sm:py-10"
      }
      style={{
        borderRadius: isImmersive ? "var(--auth-card-radius)" : undefined,
      }}
    >
      {isImmersive && <BrandHeader />}

      <header className="flex flex-col items-center text-center sm:items-start sm:text-left">
        <h1
          id={headingId}
          className="auth-heading w-full font-extrabold tracking-tight text-slate-900 text-[clamp(1.5rem,6vw,2rem)]"
          style={{ lineHeight: "1.15" }}
        >
          {heading}
        </h1>
        {description && (
          <p className="mt-2.5 w-full max-w-sm leading-relaxed text-slate-600 text-[clamp(0.9rem,3vw,1rem)]">
            {description}
          </p>
        )}
      </header>

      <div className="mt-6 w-full flex-1 sm:mt-8">{children}</div>

      {footer && (
        <div className="mt-8 w-full border-t border-slate-200/60 pt-5">
          <div className="auth-footer-pill flex w-full justify-center text-sm">
            {footer}
          </div>
        </div>
      )}
    </main>
  );

  if (isImmersive) {
    return (
      <div className="auth-immersive-bg relative min-h-[100dvh] text-slate-900">
        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="auth-brand-enter hidden min-h-[520px] lg:block">
              <AuthBrandPanel title={brandTitle} subtitle={brandSubtitle} />
            </div>
            <div className="flex w-full justify-center lg:justify-start">
              {formCard}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-immersive-bg auth-single-shell relative flex min-h-[100dvh] flex-col justify-center overflow-x-hidden overflow-y-auto px-2 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="relative z-10 my-auto flex w-full flex-col items-center">
        {!isImmersive && <BrandHeader />}
        {formCard}
      </div>
    </div>
  );
};
