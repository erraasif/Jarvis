import React from "react";

/**
 * Futuristic JARVIS Cybernetic AI Core Logomark
 * =============================================
 * Features a glowing central AI core, cyber-hexagonal boundary,
 * scanning orbital rings, and dynamic signal nodes.
 *
 * @param {Object} props
 * @param {number} [props.size=36] - Dimension in pixels.
 * @param {string} [props.className=""] - Additional Tailwind utility classes.
 */
export default function Logo({ size = 36, className = "" }) {
  const id = React.useId().replace(/:/g, "");

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Cyber Dark Holographic Background */}
          <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="50%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>

          {/* Neon Purple/Cyan Core Gradient */}
          <linearGradient id={`core-${id}`} x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Holographic Glowing Ring */}
          <linearGradient id={`ring-${id}`} x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
          </linearGradient>

          {/* Core Bloom Blur Filter */}
          <filter id={`bloom-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Futuristic Hexagonal Base Frame */}
        <rect width="40" height="40" rx="10" fill={`url(#bg-${id})`} />
        <rect width="40" height="40" rx="10" stroke={`url(#ring-${id})`} strokeWidth="1" />

        {/* Cyber Orbit Ring 1 (Dashed Outer Tech Ring) */}
        <circle
          cx="20"
          cy="20"
          r="14"
          stroke="#818CF8"
          strokeWidth="1.2"
          strokeDasharray="4 2 1 2"
          strokeOpacity="0.4"
        />

        {/* Inner Precision Crosshairs */}
        <path d="M20 6V9 M20 31V34 M6 20H9 M31 20H34" stroke="#C084FC" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />

        {/* Center Triangular AI Core / Neural Node */}
        <path
          d="M20 11 L28 25 L12 25 Z"
          fill="none"
          stroke={`url(#core-${id})`}
          strokeWidth="2.2"
          strokeLinejoin="round"
          filter={`url(#bloom-${id})`}
        />

        {/* Inner Radiant Core Sphere */}
        <circle
          cx="20"
          cy="20.5"
          r="3"
          fill="#FFFFFF"
          filter={`url(#bloom-${id})`}
          className="animate-pulse origin-center"
        />

        {/* Dynamic Scanning Laser Dot (Top Apex Signal) */}
        <circle
          cx="20"
          cy="11"
          r="1.5"
          fill="#38BDF8"
          filter={`url(#bloom-${id})`}
        />
      </svg>
    </div>
  );
}