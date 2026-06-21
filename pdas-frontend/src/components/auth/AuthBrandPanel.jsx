import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import { Shield } from "lucide-react";

const features = [
  { Icon: ManageSearchRoundedIcon, label: "Real-time phishing URL detection" },
  { Icon: MarkEmailReadRoundedIcon, label: "AI-powered email threat analysis" },
  { Icon: PublicRoundedIcon, label: "Live security awareness training" },
  { Icon: GppGoodRoundedIcon, label: "Role-based secure access control" },
];

export const AuthBrandPanel = ({
  title = "Welcome to CyberSense",
  subtitle,
}) => {
  return (
    <div className="auth-brand-panel relative flex h-full flex-col justify-between overflow-hidden px-10 py-12 lg:px-12 lg:py-14">

      {/* ── layered mesh gradient orbs ── */}
      <div className="auth-bp-orb auth-bp-orb-1" />
      <div className="auth-bp-orb auth-bp-orb-2" />
      <div className="auth-bp-orb auth-bp-orb-3" />

      {/* dot-grid overlay */}
      <div className="auth-grid-overlay auth-grid-drift" />

      {/* noise texture */}
      <div className="auth-bp-noise" />

      {/* ── floating geometric accents ── */}
      <div className="auth-float-1 pointer-events-none absolute right-[9%] top-[8%]">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="opacity-[0.13]">
          <path d="M36 4L66 22V50L36 68L6 50V22L36 4Z" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="auth-float-2 pointer-events-none absolute bottom-[18%] right-[14%]" style={{ animationDelay: "-5s" }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="opacity-[0.10]">
          <rect x="22" y="2" width="26" height="26" rx="3" transform="rotate(45 22 2)" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="auth-float-3 pointer-events-none absolute left-[8%] top-[52%]" style={{ animationDelay: "-9s" }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="opacity-[0.09]">
          <circle cx="18" cy="18" r="16" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="auth-float-1 pointer-events-none absolute left-[18%] top-[22%]" style={{ animationDelay: "-3s" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-[0.15]">
          <polygon points="12,2 22,22 2,22" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>

      {/* pulsing glow behind heading */}
      <div className="auth-glow-pulse pointer-events-none absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyber-500/[0.18] blur-3xl" />

      {/* ── top: logo + brand name ── */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="auth-bp-logo-ring flex h-11 w-11 items-center justify-center rounded-2xl">
          <svg viewBox="0 0 16 18" width="18" height="20" aria-hidden="true">
            <path d="M8 1 L15 4 L15 9 Q15 14 8 17 Q1 14 1 9 L1 4 Z" fill="#059669" />
            <path d="M5 9 L7.2 11.2 L11 7" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">CyberSense</p>
        </div>
      </div>

      {/* ── centre: headline ── */}
      <div className="relative z-10 flex flex-col">
        <h2 className="auth-bp-headline">{title}</h2>
        <p className="mt-4 max-w-[300px] text-sm leading-[1.75] text-white/52">
          {subtitle || "The intelligent platform that detects phishing threats, analyzes suspicious content, and keeps your organization safe."}
        </p>

        {/* decorative separator */}
        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          <span className="text-[0.65rem] font-semibold uppercase text-white/25">Features</span>
          <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent" />
        </div>

        {/* feature list — MUI rounded icons */}
        <ul className="mt-6 space-y-3.5">
          {features.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="auth-bp-feature-icon">
                <Icon sx={{ fontSize: 13 }} />
              </span>
              <span className="text-[0.82rem] font-medium text-white/62">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── bottom: trust badge ── */}
      <div className="relative z-10">
        <div className="auth-bp-trust-badge">
          <Shield size={13} className="text-cyber-300/80" />
          <span>Secured · JWT auth · Role-based access</span>
        </div>
      </div>
    </div>
  );
};
