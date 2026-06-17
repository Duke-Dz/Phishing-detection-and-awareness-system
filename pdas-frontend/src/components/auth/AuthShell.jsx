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
          ? "auth-form-enter auth-glass-card relative w-full max-w-lg px-6 py-6 sm:px-8 sm:py-8"
          : "auth-form-enter auth-glass-card relative mx-auto w-full max-w-[30rem] px-6 py-6 sm:px-10 sm:py-8"
      }
    >
      {/* Logo — show inline if requested. If single layout, ALWAYS show it. If immersive, only show on mobile. */}
      {showHeaderBrand && (
        <div className={`mb-5 ${isImmersive ? 'lg:hidden' : 'flex justify-center'}`}>
          <CyberSenseLogo />
        </div>
      )}

      <header className={(!isImmersive || showHeaderBrand) ? "text-center" : "text-center lg:text-left"}>
        <h1
          id={headingId}
          className="mt-1 text-[1.7rem] font-bold tracking-tight text-slate-950 sm:text-[1.85rem]"
          style={{ letterSpacing: "-0.02em", lineHeight: "1.12" }}
        >
          {heading}
        </h1>
        {description && (
          <p className={`mt-2 text-[0.95rem] leading-6 text-slate-600 max-w-xl ${(!isImmersive || showHeaderBrand) ? 'mx-auto' : ''}`}>
            {description}
          </p>
        )}
      </header>

      <div className="mt-5">{children}</div>

      {footer && (
        <div className="mt-5 border-t border-slate-200/80 pt-4">
          {footer}
        </div>
      )}
    </main>
  );

  if (isImmersive) {
    return (
      <div className="auth-immersive-bg relative min-h-screen text-slate-900">
        {/* ambient background blurs */}
        <div className="pointer-events-none absolute left-[7%] top-16 h-56 w-56 rounded-full bg-cyber-500/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 right-[6%] h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
            {/* brand panel — hidden on mobile, left on desktop */}
            <div className="auth-brand-enter hidden min-h-[520px] lg:block">
              <AuthBrandPanel
                title={brandTitle}
                subtitle={brandSubtitle}
              />
            </div>

            {/* form card */}
            <div className="flex justify-center lg:justify-start">
              {formCard}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single-column layout
  return (
    <div className="auth-immersive-bg relative min-h-screen text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="pointer-events-none absolute left-[7%] top-16 h-72 w-72 rounded-full bg-cyber-500/[0.12] blur-[80px]" />
      <div className="pointer-events-none absolute bottom-12 right-[6%] h-80 w-80 rounded-full bg-emerald-400/[0.10] blur-[80px]" />
      
      {/* Decorative center glow for single layout */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/[0.4] blur-[100px]" />

      <div className="relative z-10 w-full max-w-[30rem]">
        {formCard}
      </div>
    </div>
  );
};
