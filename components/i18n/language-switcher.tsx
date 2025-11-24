'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { Globe } from 'lucide-react';

/**
 * Language Switcher Component
 *
 * 言語切り替えコンポーネント
 * - ドロップダウン形式
 * - 現在のロケール表示
 * - Cookie更新とページ遷移
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // 現在のロケールをパスから取得
  const currentLocale = pathname.split('/')[1] as Locale;

  /**
   * 言語を切り替える
   */
  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Cookie を更新
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // パスのロケールを置き換え
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    // ページ遷移（トランジション付き）
    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value as Locale)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        aria-label="言語を選択"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

/**
 * Language Switcher Button (Alternative Design)
 *
 * ボタン形式の言語切り替え（ドロップダウンメニュー付き）
 */
export function LanguageSwitcherButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = pathname.split('/')[1] as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });

    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        aria-label="言語を選択"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4" />
        <span>{localeNames[currentLocale]}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                    locale === currentLocale
                      ? 'bg-gray-50 font-semibold text-blue-600'
                      : 'text-gray-700'
                  }`}
                  role="menuitem"
                >
                  {localeNames[locale]}
                  {locale === currentLocale && (
                    <span className="ml-2 text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
