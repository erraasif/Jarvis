import React from "react";

/**
 * Jarvis logomark: a flowing glyph (not a literal typographic "J") that
 * terminates in a small glowing node — the node stands in for the trailing
 * "." in "Jarvis." so it means something (an active agent / live signal)
 * instead of being decorative punctuation.
 */
export default function Logo({ size = 36 }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id={`glyph-${id}`} x1="10" y1="8" x2="26" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E4E0FF" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="40" height="40" rx="12" fill={`url(#bg-${id})`} />
        <rect width="40" height="40" rx="12" fill="white" fillOpacity="0.04" />

        {/* Flowing glyph: a hook shape reminiscent of a "J", drawn as one
            continuous stroke, terminating in the glowing node below */}
        <path
          d="M25 9 V21.5 C25 26.5 21.5 29 17.5 29 C14.7 29 12.3 27.7 11 25.6"
          stroke={`url(#glyph-${id})`}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* The node: stands in for the "." after "Jarvis" — an active signal */}
        <circle cx="11" cy="25.6" r="2.1" fill="white" filter={`url(#glow-${id})`} className="logo-node" />
      </svg>
    </div>
  );
}