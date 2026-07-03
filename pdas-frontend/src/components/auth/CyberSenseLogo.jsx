import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import SmsRoundedIcon from "@mui/icons-material/SmsRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import { motion, useAnimationFrame } from "framer-motion";
import { useRef } from "react";

const PULSE_DELAY_CLASSES = [
  "orbit-pulse-delay-0",
  "orbit-pulse-delay-1",
  "orbit-pulse-delay-2",
  "orbit-pulse-delay-3",
];

const ORBIT_R = 98;
const CENTER = 130;
const ICON_R = 25;

const orbitItems = [
  {
    id: "url",
    label: "Web",
    angle: 270,
    color: "#020617",
    glow: "rgba(2,6,23,0.22)",
    bg: "#f8fafc",
    borderColor: "#020617",
    Icon: LanguageRoundedIcon,
  },
  {
    id: "email",
    label: "Email",
    angle: 0,
    color: "#0D518C",
    glow: "rgba(13,81,140,0.32)",
    bg: "#eef6fc",
    borderColor: "#0D518C",
    Icon: EmailRoundedIcon,
  },
  {
    id: "sms",
    label: "SMS",
    angle: 90,
    color: "#0a477a",
    glow: "rgba(13,81,140,0.28)",
    bg: "#f4f9fd",
    borderColor: "#176da3",
    Icon: SmsRoundedIcon,
  },
  {
    id: "verified",
    label: "Verified",
    angle: 180,
    color: "#0D518C",
    glow: "rgba(13,81,140,0.45)",
    bg: "#eef6fc",
    borderColor: "#0D518C",
    Icon: VerifiedUserRoundedIcon,
  },
];

const ACCENT_DOT_ANGLES = [45, 135, 225, 315];

function polarToCart(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function OrbitRing() {
  const groupRef = useRef(null);
  const counterRefs = useRef(orbitItems.map(() => null));

  useAnimationFrame((time) => {
    const deg = (time / 45000) * 360;

    if (groupRef.current) {
      groupRef.current.setAttribute("transform", `rotate(${deg}, ${CENTER}, ${CENTER})`);
    }

    counterRefs.current.forEach((element) => {
      if (element) element.setAttribute("transform", `rotate(${-deg})`);
    });
  });

  return (
    <g ref={groupRef}>
      {orbitItems.map((item, index) => {
        const pos = polarToCart(item.angle, ORBIT_R);

        return (
          <g key={item.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle
              r={ICON_R + 7}
              fill={item.glow}
              className={`orbit-pulse-ring ${PULSE_DELAY_CLASSES[index]}`}
            />
            <circle r={ICON_R + 1} fill="rgba(0,0,0,0.06)" transform="translate(0,2)" />
            <circle r={ICON_R} fill="white" />
            <circle r={ICON_R} fill={item.bg} opacity="0.92" />
            <circle
              r={ICON_R - 0.75}
              fill="none"
              stroke={item.borderColor}
              strokeWidth="1.5"
              opacity="0.7"
            />
            <circle
              r={ICON_R - 0.75}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="1"
              strokeDasharray={`${ICON_R * 0.9} ${ICON_R * 10}`}
              strokeDashoffset={`${-ICON_R * 0.05}`}
              opacity="0.8"
            />
            <g ref={(element) => (counterRefs.current[index] = element)}>
              <foreignObject x={-ICON_R} y={-ICON_R} width={ICON_R * 2} height={ICON_R * 2}>
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
                  <item.Icon sx={{ fontSize: 19 }} />
                </div>
              </foreignObject>
            </g>
          </g>
        );
      })}
    </g>
  );
}

export default function CyberSenseLogo({
  variant = "default",
  stacked = false,
  showWordmark = true,
  iconSize,
}) {
  const isCompact = variant === "compact";
  const iconSizeClasses = { sm: "h-10 w-10", md: "h-11 w-11", lg: "h-14 w-14" };
  const canvasClass = iconSize
    ? `relative flex-shrink-0 ${iconSizeClasses[iconSize] || iconSizeClasses.md}`
    : isCompact
    ? "relative h-[40px] w-[40px] flex-shrink-0 sm:h-[48px] sm:w-[48px]"
    : "relative h-[96px] w-[96px] flex-shrink-0 sm:h-[104px] sm:w-[104px]";
  const wordmarkSize = isCompact
    ? "0.9375rem"
    : "clamp(1.45rem, 4vw, 1.8rem)";

  const containerClass = stacked
    ? "auth-logo-container flex flex-col items-center justify-center gap-2"
    : `auth-logo-container flex items-center justify-center ${
        isCompact ? "auth-logo-compact gap-2.5" : "gap-3.5"
      }`;

  return (
    <div className={containerClass}>
      <h2 className="sr-only">CyberSense animated logo</h2>

      <div className={canvasClass}>
        <svg
          viewBox="0 0 260 260"
          className="h-full w-full overflow-visible scale-[1.3]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cs-shieldOuter" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="52%" stopColor="#047857" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="cs-shieldInner" x1="80%" y1="0%" x2="20%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="cs-trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#0D518C" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
            </linearGradient>

            <filter id="cs-shieldShadow" x="-35%" y="-35%" width="170%" height="170%">
              <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#059669" floodOpacity="0.34" />
            </filter>

            <filter id="cs-ambientHalo" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r="44"
            fill="#059669"
            filter="url(#cs-ambientHalo)"
            animate={{ opacity: [0.09, 0.2, 0.09], scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_R}
            fill="none"
            stroke="url(#cs-trackGrad)"
            strokeWidth="1"
            strokeDasharray="2 8"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_R - 3}
            fill="none"
            stroke="rgba(13,81,140,0.20)"
            strokeWidth="1"
          />

          {ACCENT_DOT_ANGLES.map((angle) => {
            const point = polarToCart(angle, ORBIT_R);
            return (
              <circle
                key={angle}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#0D518C"
                opacity="0.65"
              />
            );
          })}

          <OrbitRing />

          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r="46"
            fill="#059669"
            opacity={0}
            animate={{ opacity: [0.05, 0.13, 0.05], scale: [0.98, 1.06, 0.98] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          <g filter="url(#cs-shieldShadow)">
            <path
              d={`
                M ${CENTER} ${CENTER - 55}
                L ${CENTER + 39} ${CENTER - 31}
                L ${CENTER + 39} ${CENTER + 6}
                Q ${CENTER + 39} ${CENTER + 37} ${CENTER} ${CENTER + 55}
                Q ${CENTER - 39} ${CENTER + 37} ${CENTER - 39} ${CENTER + 6}
                L ${CENTER - 39} ${CENTER - 31}
                Z
              `}
              fill="url(#cs-shieldOuter)"
            />
            <path
              d={`M ${CENTER} ${CENTER - 55} L ${CENTER + 39} ${CENTER - 31}`}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${CENTER} ${CENTER - 55} L ${CENTER - 39} ${CENTER - 31}`}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`
                M ${CENTER} ${CENTER - 40}
                L ${CENTER + 27} ${CENTER - 23}
                L ${CENTER + 27} ${CENTER + 2}
                Q ${CENTER + 27} ${CENTER + 25} ${CENTER} ${CENTER + 37}
                Q ${CENTER - 27} ${CENTER + 25} ${CENTER - 27} ${CENTER + 2}
                L ${CENTER - 27} ${CENTER - 23}
                Z
              `}
              fill="url(#cs-shieldInner)"
              opacity="0.88"
            />
          </g>

          <path
            d={`
              M ${CENTER - 33} ${CENTER - 28}
              L ${CENTER} ${CENTER - 51}
              L ${CENTER + 33} ${CENTER - 28}
              Q ${CENTER + 33} ${CENTER - 15} ${CENTER} ${CENTER - 11}
              Q ${CENTER - 33} ${CENTER - 15} ${CENTER - 33} ${CENTER - 28}
              Z
            `}
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d={`M ${CENTER - 9} ${CENTER - 3} L ${CENTER - 2} ${CENTER + 5} L ${CENTER + 12} ${CENTER - 12}`}
            fill="none"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showWordmark && <div className="flex flex-col justify-center gap-0.5">
        <div className="auth-logo-wordmark font-extrabold leading-none" style={{ fontSize: wordmarkSize, letterSpacing: 0 }}>
          <span
            style={{
              background: "linear-gradient(135deg, #000000 0%, #020617 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Cyber
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #0D518C 0%, #176da3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sense
          </span>
        </div>
      </div>}
    </div>
  );
}
