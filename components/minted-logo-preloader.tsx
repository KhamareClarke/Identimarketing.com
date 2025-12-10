import React from "react";

export function MintedLogoPreloader({ size = 48, alt = "IdentiMarketing Logo" }) {
  return (
    <div
      aria-label={alt}
      role="img"
      style={{ width: size, height: size, display: "inline-block" }}
      className="minted-preloader"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="url(#minted-gradient)"
          strokeWidth="4"
          strokeDasharray="90 60"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 24 24"
            to="360 24 24"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </circle>
        <defs>
          <linearGradient id="minted-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="0.5" stopColor="#ec4899" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <image
          href="/logo.png"
          x="12"
          y="12"
          width="24"
          height="24"
          aria-label={alt}
        />
      </svg>
      <style jsx>{`
        .minted-preloader svg {
          display: block;
        }
      `}</style>
    </div>
  );
}
