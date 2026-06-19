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

  // Split heading into first word + rest for gradient treatment
  const words = heading ? heading.split(" ") : [];
  const firstWord = words[0] ?? "";
  const restWords = words.slice(1).join(" ");

  const formCard = (
    <main
      aria-labelledby={headingId}
      className={
        isImmersive
          ? "auth-form-enter auth-glass-card relative w-full max-w-lg px-6 py-6 sm:px-8 sm:py-8"
          : "auth-form-enter auth-glass-card relative w-full px-5 py-6 sm:px-7 sm:py-8"
      }
    >
      {/* Logo — show inline if requested */}
      {showHeaderBrand && (
        <div className={`mb-6 ${isImmersive ? "lg:hidden flex justify-center" : "flex justify-center"}`}>
          <CyberSenseLogo />
        </div>
      )}

      <header className={(!isImmersive || showHeaderBrand) ? "text-center" : "text-center lg:text-left"}>
        <h1
          id={headingId}
          className="mt-1 text-[1.75rem] font-bold tracking-tight text-slate-950 sm:text-[1.9rem]"
          style={{ letterSpacing: "-0.025em", lineHeight: "1.1" }}
        >
          {restWords ? (
            <>
              <span className="auth-heading-gradient">{firstWord}</span>
              {" "}{restWords}
            </>
          ) : (
            <span className="auth-heading-gradient">{firstWord}</span>
          )}
        </h1>
        {description && (
          <p
            className={`mt-2.5 text-[0.93rem] leading-[1.7] text-slate-500 ${
              (!isImmersive || showHeaderBrand) ? "mx-auto max-w-[22rem]" : "max-w-xl"
            }`}
          >
            {description}
          </p>
        )}
      </header>

      <div className="mt-6">{children}</div>

      {footer && (
        <div className="mt-5 pt-4 border-t border-slate-200/60">
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
        {/* Ambient background blurs */}
        <div className="pointer-events-none absolute left-[7%] top-16 h-56 w-56 rounded-full bg-cyber-500/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 right-[6%] h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-3xl" />

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

      {/* Animated background orbs */}
      <div
        className="auth-bg-orb auth-bg-orb-1 pointer-events-none"
        style={{
          width: "420px", height: "420px",
          top: "-6%", left: "-8%",
          background: "radial-gradient(circle, rgba(67,97,238,0.13) 0%, transparent 70%)",
        }}
      />
      <div
        className="auth-bg-orb auth-bg-orb-2 pointer-events-none"
        style={{
          width: "360px", height: "360px",
          bottom: "-4%", right: "-6%",
          background: "radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)",
        }}
      />
      <div
        className="auth-bg-orb auth-bg-orb-3 pointer-events-none"
        style={{
          width: "280px", height: "280px",
          top: "40%", left: "60%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Card with glow halo */}
      <div className="relative z-10 w-full" style={{ maxWidth: "min(90vw, 31rem)" }}>
        {/* Under-card glow */}
        <div className="auth-card-glow" />
        {formCard}
      </div>
    </div>
  );
};
