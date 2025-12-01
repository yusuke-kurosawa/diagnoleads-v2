import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Globe,
  LineChart,
  Lock,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

/**
 * ランディングページ
 *
 * DiagnoLeadsのブランドイメージ（信頼・親しみやすさ・ティール/エメラルド）を
 * 反映したモダンなトップページ
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('public.landing');

  const isJa = locale === 'ja';

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ロゴ */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                DiagnoLeads
              </span>
            </div>

            {/* ナビリンク */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm font-medium"
              >
                {t('nav.features')}
              </a>
              <a
                href="#benefits"
                className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm font-medium"
              >
                {t('nav.benefits')}
              </a>
              <Link
                href={`/${locale}/diagnostic`}
                className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm font-medium"
              >
                {t('nav.diagnostic')}
              </Link>
            </div>

            {/* CTAボタン */}
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/login`}
                className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm font-medium"
              >
                {t('nav.login')}
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
              >
                {t('nav.signup')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />

        {/* 装飾的な背景要素 */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-teal-100/20 to-emerald-100/20 dark:from-teal-900/10 dark:to-emerald-900/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* バッジ */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                {t('hero.badge')}
              </span>
            </div>

            {/* メインタイトル */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {t('hero.title')}
              </span>
            </h1>

            {/* サブタイトル */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10">
              {t('hero.subtitle')}
            </p>

            {/* CTAボタン */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${locale}/diagnostic`}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl transition-all text-base font-semibold shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 flex items-center justify-center gap-2"
              >
                {t('hero.cta.primary')}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 rounded-xl transition-all text-base font-semibold flex items-center justify-center gap-2"
              >
                {t('hero.cta.secondary')}
              </Link>
            </div>

            {/* 信頼指標 */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-500" />
                <span>{isJa ? 'セキュアな環境' : 'Secure Environment'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-500" />
                <span>{isJa ? '即時セットアップ' : 'Instant Setup'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-500" />
                <span>{isJa ? '日本語/英語対応' : 'Japanese/English'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* AI リードスコアリング */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('features.aiScoring.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('features.aiScoring.description')}
              </p>
            </div>

            {/* セマンティック検索 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('features.semanticSearch.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('features.semanticSearch.description')}
              </p>
            </div>

            {/* 高度な分析 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('features.analytics.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('features.analytics.description')}
              </p>
            </div>

            {/* マルチテナント */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('features.multiTenant.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('features.multiTenant.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* メリットセクション */}
      <section id="benefits" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左側：テキスト */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t('benefits.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">
                {t('benefits.subtitle')}
              </p>

              <div className="space-y-5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{t(`benefits.item${num}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 右側：統計カード */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl border border-teal-100 dark:border-teal-800">
                <TrendingUp className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-4" />
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">40%</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {isJa ? 'リード獲得数の向上' : 'Increase in Lead Generation'}
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <Target className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-4" />
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">2x</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {isJa ? '営業チームの生産性' : 'Sales Team Productivity'}
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-2xl border border-cyan-100 dark:border-cyan-800">
                <Zap className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-4" />
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">75%</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {isJa ? 'リード対応時間の短縮' : 'Reduction in Response Time'}
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl border border-teal-100 dark:border-teal-800">
                <LineChart className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-4" />
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">25%</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {isJa ? '成約率の改善' : 'Improvement in Conversion Rate'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 信頼性セクション */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('trust.title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* セキュリティ */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{t('trust.security.title')}</h3>
              <p className="text-gray-400">{t('trust.security.description')}</p>
            </div>

            {/* グローバル対応 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{t('trust.global.title')}</h3>
              <p className="text-gray-400">{t('trust.global.description')}</p>
            </div>

            {/* 高速・高可用性 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {t('trust.performance.title')}
              </h3>
              <p className="text-gray-400">{t('trust.performance.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl shadow-2xl shadow-teal-500/25">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('cta.title')}</h2>
            <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              {t('cta.button')}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* ロゴ */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                DiagnoLeads
              </span>
            </div>

            {/* リンク */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <a
                href="#"
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t('footer.privacy')}
              </a>
              <a
                href="#"
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t('footer.terms')}
              </a>
              <a
                href="#"
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t('footer.contact')}
              </a>
            </div>

            {/* コピーライト */}
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
