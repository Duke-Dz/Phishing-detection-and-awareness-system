import { useRef } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import SmsRoundedIcon from "@mui/icons-material/SmsRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";

// Static delay classes — listed explicitly so CSS is never purged
const PULSE_DELAY_CLASSES = [
  "orbit-pulse-delay-0",
  "orbit-pulse-delay-1",
  "orbit-pulse-delay-2",
  "orbit-pulse-delay-3",
];

// ─── Orbit configuration ─────────────────────────────────────────────────────
const ORBIT_R  = 96;
const CENTER   = 130;
const ICON_R   = 23;

const orbitItems = [
  {
    id: "url",
    label: "Web",
    angle: 270,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.45)",
    bg: "#eff6ff",
    borderColor: "#3b82f6",
    Icon: LanguageRoundedIcon,
  },
  {
    id: "email",
    label: "Email",
    angle: 0,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.45)",
    bg: "#f5f3ff",
    borderColor: "#8b5cf6",
    Icon: EmailRoundedIcon,
  },
  {
    id: "sms",
    label: "SMS",
    angle: 90,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.45)",
    bg: "#ecfeff",
    borderColor: "#06b6d4",
    Icon: SmsRoundedIcon,
  },
  {
    id: "verified",
    label: "Verified",
    angle: 180,
    color: "#10b981",
    glow: "rgba(16,185,129,0.45)",
    bg: "#ecfdf5",
    borderColor: "#10b981",
    Icon: VerifiedUserRoundedIcon,
  },
];

// Small accent dots at midpoints between icons on the orbit track
const ACCENT_DOT_ANGLES = [45, 135, 225, 315];

function polarToCart(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

// ─── Orbit ring ───────────────────────────────────────────────────────────────
function OrbitRing() {
  const groupRef    = useRef(null);
  const counterRefs = useRef(orbitItems.map(() => null));

  useAnimationFrame((t) => {
    // 45 s / revolution  →  comfortable, meditative pace
    const deg = (t / 45000) * 360;
    if (groupRef.current) {
      groupRef.current.setAttribute("transform", `rotate(${deg}, ${CENTER}, ${CENTER})`);
    }
    counterRefs.current.forEach((el) => {
      if (el) el.setAttribute("transform", `rotate(${-deg})`);
    });
  });

  return (
    <g ref={groupRef}>
      {orbitItems.map((item, i) => {
        const pos = polarToCart(item.angle, ORBIT_R);
        return (
          <g key={item.id} transform={`translate(${pos.x}, ${pos.y})`}>
            {/* Heartbeat pulse ring */}
            <circle
              r={ICON_R + 7}
              fill={item.glow}
              className={`orbit-pulse-ring ${PULSE_DELAY_CLASSES[i]}`}
            />

            {/* Drop shadow disc */}
            <circle r={ICON_R + 1} fill="rgba(0,0,0,0.06)" transform="translate(0,2)" />

            {/* White base */}
            <circle r={ICON_R} fill="white" />

            {/* Tinted background */}
            <circle r={ICON_R} fill={item.bg} opacity="0.92" />

            {/* Accent border — full opacity for crispness */}
            <circle
              r={ICON_R - 0.75}
              fill="none"
              stroke={item.borderColor}
              strokeWidth="1.5"
              opacity="0.7"
            />

            {/* Rim highlight at top-left — makes the bubble feel raised */}
            <circle
              r={ICON_R - 0.75}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="1"
              strokeDasharray={`${ICON_R * 0.9} ${ICON_R * 10}`}
              strokeDashoffset={`${-ICON_R * 0.05}`}
              opacity="0.8"
            />

            {/* MUI icon — counter-rotated to stay upright */}
            <g ref={(el) => (counterRefs.current[i] = el)}>
              <foreignObject
                x={-ICON_R}
                y={-ICON_R}
                width={ICON_R * 2}
                height={ICON_R * 2}
              >
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.color,
                  }}
                >
                  <item.Icon sx={{ fontSize: 17 }} />
                </div>
              </foreignObject>
            </g>
          </g>
        );
      })}
    </g>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CyberSenseLogo() {
  return (
    <div className="flex items-center justify-center gap-3.5">
      <h2 className="sr-only">CyberSense animated logo</h2>

      {/* ── SVG canvas — slightly larger for premium presence ── */}
      <div className="relative w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] flex-shrink-0">
        <svg
          viewBox="0 0 260 260"
          width="100%"
          height="100%"
          className="overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Outer shield — blue → indigo */}
            <linearGradient id="cs-shieldOuter" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="#60a5fa" />
              <stop offset="50%"  stopColor="#4361ee" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>

            {/* Inner shield — cyan → blue */}
            <linearGradient id="cs-shieldInner" x1="80%" y1="0%" x2="20%" y2="100%">
              <stop offset="0%"   stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#4361ee" />
            </linearGradient>

            {/* Orbit track gradient — fades around the ring */}
            <linearGradient id="cs-trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#94a3b8" stopOpacity="0.6" />
              <stop offset="50%"  stopColor="#c7d2fe" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
            </linearGradient>

            {/* Shield drop shadow */}
            <filter id="cs-shieldShadow" x="-35%" y="-35%" width="170%" height="170%">
              <feDropShadow dx="0" dy="5" stdDeviation="8"
                floodColor="#4361ee" floodOpacity="0.30" />
            </filter>

            {/* Shield inner glow */}
            <filter id="cs-shieldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Ambient halo behind shield */}
            <filter id="cs-ambientHalo" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          {/* ── Layered ambient halo ── */}
          <motion.circle
            cx={CENTER} cy={CENTER} r="44"
            fill="#4361ee"
            filter="url(#cs-ambientHalo)"
            animate={{ opacity: [0.09, 0.20, 0.09], scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          {/* ── Orbit track — gradient dashed ring ── */}
          <circle
            cx={CENTER} cy={CENTER}
            r={ORBIT_R}
            fill="none"
            stroke="url(#cs-trackGrad)"
            strokeWidth="1"
            strokeDasharray="2 8"
            opacity="1"
          />
          {/* Second solid hairline inside for depth */}
          <circle
            cx={CENTER} cy={CENTER}
            r={ORBIT_R - 3}
            fill="none"
            stroke="rgba(199,210,254,0.18)"
            strokeWidth="1"
          />

          {/* Accent dots at 45° midpoints between icons */}
          {ACCENT_DOT_ANGLES.map((angle) => {
            const p = polarToCart(angle, ORBIT_R);
            return (
              <circle
                key={angle}
                cx={p.x} cy={p.y}
                r="2.5"
                fill="#c7d2fe"
                opacity="0.55"
              />
            );
          })}

          {/* ── Rotating orbit icons ── */}
          <OrbitRing />

          {/* ── Shield outer ambient pulse ── */}
          <motion.circle
            cx={CENTER} cy={CENTER} r="46"
            fill="#4361ee" opacity={0}
            animate={{ opacity: [0.05, 0.13, 0.05], scale: [0.98, 1.06, 0.98] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          {/* ── Shield body ── */}
          <g filter="url(#cs-shieldShadow)">
            {/* Outer shield */}
            <path
              d={`
                M ${CENTER} ${CENTER - 42}
                L ${CENTER + 35} ${CENTER - 20}
                L ${CENTER + 35} ${CENTER + 13}
                Q ${CENTER + 35} ${CENTER + 42} ${CENTER} ${CENTER + 57}
                Q ${CENTER - 35} ${CENTER + 42} ${CENTER - 35} ${CENTER + 13}
                L ${CENTER - 35} ${CENTER - 20}
                Z
              `}
              fill="url(#cs-shieldOuter)"
            />
            {/* Rim highlight — top edge */}
            <path
              d={`M ${CENTER} ${CENTER - 42} L ${CENTER + 35} ${CENTER - 20}`}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${CENTER} ${CENTER - 42} L ${CENTER - 35} ${CENTER - 20}`}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Inner shield */}
            <path
              d={`
                M ${CENTER} ${CENTER - 29}
                L ${CENTER + 24} ${CENTER - 13}
                L ${CENTER + 24} ${CENTER + 9}
                Q ${CENTER + 24} ${CENTER + 29} ${CENTER} ${CENTER + 40}
                Q ${CENTER - 24} ${CENTER + 29} ${CENTER - 24} ${CENTER + 9}
                L ${CENTER - 24} ${CENTER - 13}
                Z
              `}
              fill="url(#cs-shieldInner)"
              opacity="0.88"
            />
          </g>

          {/* Shield surface highlight — frosted top strip */}
          <path
            d={`
              M ${CENTER - 30} ${CENTER - 17}
              L ${CENTER} ${CENTER - 39}
              L ${CENTER + 30} ${CENTER - 17}
              Q ${CENTER + 30} ${CENTER - 5} ${CENTER} ${CENTER - 2}
              Q ${CENTER - 30} ${CENTER - 5} ${CENTER - 30} ${CENTER - 17}
              Z
            `}
            fill="rgba(255,255,255,0.12)"
          />

          {/* Check mark — crisp native SVG (no foreignObject needed for a simple path) */}
          <path
            d={`M ${CENTER - 9} ${CENTER + 5} L ${CENTER - 2} ${CENTER + 13} L ${CENTER + 12} ${CENTER - 4}`}
            fill="none"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Wordmark ── */}
      <div className="flex flex-col justify-center gap-0.5">
        {/* Brand name */}
        <div
          className="leading-none font-extrabold"
          style={{ fontSize: "clamp(1.35rem, 4vw, 1.65rem)", letterSpacing: "-0.045em" }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Cyber
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #4361ee 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sense
          </span>
        </div>

        {/* Subtitle pill */}
        <span
          className="inline-flex items-center gap-1 w-fit"
          style={{
            fontSize: "0.58rem",
            fontWeight: 600,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          {/* Micro dot accent */}
          <span
            style={{
              width: "4px", height: "4px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4361ee, #8b5cf6)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Phishing Defense
        </span>
      </div>
    </div>
  );
}
