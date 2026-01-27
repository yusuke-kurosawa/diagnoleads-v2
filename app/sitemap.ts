import type { MetadataRoute } from 'next';

/**
 * Sitemap Generation
 *
 * 検索エンジン向けサイトマップを生成
 * - 公開ページのURLを含む
 * - 多言語対応
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diagnoleads.com';
  const locales = ['ja', 'en'];
  const lastModified = new Date();

  // Public pages
  const publicPages = ['', '/landing', '/diagnostic'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale
  locales.forEach((locale) => {
    publicPages.forEach((page) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified,
        changeFrequency: page === '' || page === '/landing' ? 'weekly' : 'monthly',
        priority: page === '' || page === '/landing' ? 1.0 : 0.8,
      });
    });
  });

  return sitemapEntries;
}
