import React from 'react';

/**
 * Original Grocery Choice Logo
 * Combines a clean modern grocery shopping bag / basket silhouette with
 * an integrated 'G' / 'GC' monogram and fresh organic leaf sprout.
 */
export default function Logo({ size = 'medium', variant = 'full', className = '' }) {
  const isIconOnly = variant === 'icon';

  const iconSizes = {
    small: 32,
    medium: 40,
    large: 52,
  };

  const currentSize = iconSizes[size] || 40;

  return (
    <div className={`grocery-choice-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
      <svg
        width={currentSize}
        height={currentSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="gcMainGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="gcLeafGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="gcShadow" x="-2" y="0" width="52" height="52" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" floodColor="#047857" />
          </filter>
        </defs>

        {/* Bag Handle */}
        <path
          d="M16 16 V11 C16 6.58 19.58 3 24 3 C28.42 3 32 6.58 32 11 V16"
          stroke="#059669"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Bag Body with subtle shadow */}
        <rect
          x="5"
          y="14"
          width="38"
          height="30"
          rx="8"
          fill="url(#gcMainGrad)"
          filter="url(#gcShadow)"
        />

        {/* Dynamic Stylized 'G' / 'C' Monogram */}
        <path
          d="M28.5 24 C27.2 22.2 25.1 21 22.5 21 C18.36 21 15 24.36 15 28.5 C15 32.64 18.36 36 22.5 36 C26.2 36 29.3 33.3 29.8 29.6 H23"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Fresh Leaf Sprout Accent */}
        <path
          d="M31 6.5 C31 6.5 37.5 7.5 37.5 13.5 C32.5 13.5 31 6.5 31 6.5 Z"
          fill="url(#gcLeafGrad)"
        />
      </svg>

      {!isIconOnly && (
        <div className="logo-brand-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontSize: size === 'small' ? '1.15rem' : size === 'large' ? '1.65rem' : '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            fontFamily: 'inherit'
          }}>
            Grocery<span style={{ color: '#059669', marginLeft: '0.15rem' }}>Choice</span>
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b'
          }}>
            Fresh &amp; Daily Market
          </span>
        </div>
      )}
    </div>
  );
}
