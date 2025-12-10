import React from 'react';

/**
 * Custom Icon Component for PayloadCMS Admin
 * Used in collapsed sidebar and favicon
 */
export function Icon() {
  return (
    <div style={{ width: '28px', height: '28px' }}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="cmsIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4ab" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#cmsIconGradient)" />
        <path
          d="M12 20 L17 25 L28 14"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export default Icon;
