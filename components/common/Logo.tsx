'use client';

import Link from 'next/link';

interface LogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
}

export function Logo({
  collapsed = false,
  size = 'md',
  showText = true,
  href = '/ja/dashboard',
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const LogoIcon = () => (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {/* 信頼感・親しみやすさを表現したティール系ロゴ */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* メイングラデーション - 信頼感のあるティール */}
          <linearGradient id="logoGradientTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4ab" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          {/* アクセントグラデーション - 柔らかいエメラルド */}
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          {/* パステル調の背景光 */}
          <radialGradient id="softGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5fe0c5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 背景の柔らかい光 */}
        <circle cx="20" cy="20" r="19" fill="url(#softGlow)" />

        {/* メイン円形背景 - 角丸でより親しみやすく */}
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#logoGradientTeal)" />

        {/* 内側のソフトな円 */}
        <circle
          cx="20"
          cy="20"
          r="11"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.25"
        />

        {/* 診断/チェックマークを組み合わせたシンボル */}
        {/* チェックマーク - 成功・安心を表現 */}
        <path
          d="M12 20 L17 25 L28 14"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* 小さなスパークル - 親しみやすさ */}
        <circle cx="30" cy="12" r="2" fill="white" opacity="0.6" />
        <circle cx="32" cy="16" r="1" fill="white" opacity="0.4" />
      </svg>
    </div>
  );

  const content = (
    <div className="flex items-center gap-3">
      <LogoIcon />
      {showText && !collapsed && (
        <div className="flex flex-col">
          <span
            className={`${textSizes[size]} font-bold bg-gradient-to-r from-brand-500 to-emerald-500 bg-clip-text text-transparent`}
          >
            DiagnoLeads
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 tracking-wider uppercase">
              スマート診断プラットフォーム
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <Logo collapsed showText={false} size={size} href={undefined} />;
}
