import type { MetadataRoute } from 'next';

/**
 * Robots.txt Generation
 *
 * 検索エンジンのクローラー向け設定
 * - 公開ページのみインデックス許可
 * - 管理画面はインデックス禁止
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diagnoleads.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/ja/',
          '/en/',
          '/ja/landing',
          '/en/landing',
          '/ja/diagnostic',
          '/en/diagnostic',
        ],
        disallow: [
          '/api/',
          '/*/dashboard/',
          '/*/settings/',
          '/*/leads/',
          '/*/login',
          '/*/signup',
          '/*/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
