import { useEffect, useRef, useState } from "react";

const orbitItems = [
  {
    id: "url",
    label: "URL",
    angle: 270,
    color: "#3b82f6", // Blue
    bg: "#eff6ff",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="16"
        height="16"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email",
    angle: 0,
    color: "#8b5cf6", // Purple
    bg: "#f5f3ff",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="16"
        height="16"
      >
        <rect x="2" y="4" width="20" height="16" rx="2.5" />
        <path d="M2 8l10 7 10-7" />
      </svg>
    ),
  },
  {
    id: "sms",
    label: "SMS",
    angle: 90,
    color: "#06b6d4", // Cyan
    bg: "#ecfeff",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="16"
        height="16"
      >
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: "verified",
    label: "Verified",
    angle: 180,
    color: "#10b981", // Emerald
    bg: "#ecfdf5",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="16"
        height="16"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

const ORBIT_R = 95;
const CENTER = 130;
const ICON_R = 18;

function polarToCart(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export default function CyberSenseLogo() {
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (lastTimeRef.current == null) lastTimeRef.current = ts;
      const delta = ts - lastTimeRef.current;
      lastTimeRef.current = ts;
      // Smooth, slow premium rotation
      setRotation((r) => (r + delta * 0.015) % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      <h2 className="sr-only">CyberSense animated logo</h2>

      {/* Premium SVG Logo Wrapper */}
      <div className="relative w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]">
        <svg
          viewBox="0 0 260 260"
          width="100%"
          height="100%"
          className="overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Premium Gradients */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <linearGradient
              id="shieldGradInner"
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Premium Shadows & Glows */}
            <filter
              id="premiumDropShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="6"
                stdDeviation="8"
                floodColor="#3b82f6"
                floodOpacity="0.25"
              />
            </filter>

            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ambient Glow */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r="50"
            fill="#3b82f6"
            opacity="0.08"
            filter="url(#neonGlow)"
          />

          {/* Outer Rotating Track (Dashed) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_R}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />

          {/* Rotating Orbit Items */}
          <g transform={`rotate(${rotation}, ${CENTER}, ${CENTER})`}>
            {orbitItems.map((item) => {
              const pos = polarToCart(item.angle, ORBIT_R);
              return (
                <g
                  key={item.id}
                  transform={`translate(${pos.x}, ${pos.y}) rotate(${-rotation})`}
                >
                  {/* Glassmorphism Icon Background */}
                  <circle
                    r={ICON_R}
                    fill="#ffffff"
                    filter="url(#premiumDropShadow)"
                  />
                  <circle r={ICON_R} fill={item.bg} opacity="0.9" />
                  <circle
                    r={ICON_R}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="1.5"
                    opacity="0.4"
                  />

                  {/* Center the Lucide-style SVG */}
                  <foreignObject
                    x={-ICON_R}
                    y={-ICON_R}
                    width={ICON_R * 2}
                    height={ICON_R * 2}
                  >
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>

          {/* Inner Geometric Shield (Premium Redesign) */}
          <g filter="url(#premiumDropShadow)">
            {/* Outer Hex-Shield Layer */}
            <path
              d={`M ${CENTER} ${CENTER - 38} L ${CENTER + 32} ${CENTER - 18} L ${CENTER + 32} ${CENTER + 12} Q ${CENTER + 32} ${CENTER + 38} ${CENTER} ${CENTER + 52} Q ${CENTER - 32} ${CENTER + 38} ${CENTER - 32} ${CENTER + 12} L ${CENTER - 32} ${CENTER - 18} Z`}
              fill="url(#shieldGrad)"
            />
            {/* Inner Hex-Shield Layer */}
            <path
              d={`M ${CENTER} ${CENTER - 26} L ${CENTER + 22} ${CENTER - 12} L ${CENTER + 22} ${CENTER + 8} Q ${CENTER + 22} ${CENTER + 26} ${CENTER} ${CENTER + 36} Q ${CENTER - 22} ${CENTER + 26} ${CENTER - 22} ${CENTER + 8} L ${CENTER - 22} ${CENTER - 12} Z`}
              fill="url(#shieldGradInner)"
            />
            {/* Center Checkmark / Eye abstraction */}
            <path
              d={`M ${CENTER - 8} ${CENTER + 2} L ${CENTER - 2} ${CENTER + 8} L ${CENTER + 10} ${CENTER - 6}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Inline Wordmark */}
      <div className="flex flex-col justify-center">
        <span
          className="text-2xl sm:text-[1.7rem] font-extrabold tracking-tight text-slate-900 leading-none"
          style={{ letterSpacing: "-0.04em" }}
        >
          Cyber<span className="text-blue-600">Sense</span>
        </span>
      </div>
    </div>
  );
}
