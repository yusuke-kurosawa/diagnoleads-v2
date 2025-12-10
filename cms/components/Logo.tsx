import React from 'react';

/**
 * Custom Logo Component for PayloadCMS Admin
 * Matches DiagnoLeads branding with teal gradient
 */
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '40px', height: '40px', position: 'relative' }}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="cmsLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4ab" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <radialGradient id="cmsSoftGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5fe0c5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="20" cy="20" r="19" fill="url(#cmsSoftGlow)" />
          <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#cmsLogoGradient)" />
          <circle
            cx="20"
            cy="20"
            r="11"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.25"
          />
          <path
            d="M12 20 L17 25 L28 14"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="30" cy="12" r="2" fill="white" opacity="0.6" />
          <circle cx="32" cy="16" r="1" fill="white" opacity="0.4" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            background: 'linear-gradient(to right, #14b8a6, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          DiagnoLeads
        </span>
        <span
          style={{
            fontSize: '10px',
            color: '#667085',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          CMS
        </span>
      </div>
    </div>
  );
}

export default Logo;
