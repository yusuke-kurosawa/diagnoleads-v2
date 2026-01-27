import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Globe,
  Search,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

/**
 * Landing Page Metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.landing' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

/**
 * Landing Page
 *
 * SEO最適化されたランディングページ
 * - ヒーローセクション
 * - 特徴紹介
 * - 機能一覧
 * - CTA
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('public.landing');

  const features = [
    {
      icon: Brain,
      title: t('features.aiScoring.title'),
      description: t('features.aiScoring.description'),
    },
    {
      icon: Search,
      title: t('features.semanticSearch.title'),
      description: t('features.semanticSearch.description'),
    },
    {
      icon: BarChart3,
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
    },
    {
      icon: Users,
      title: t('features.multiTenant.title'),
      description: t('features.multiTenant.description'),
    },
  ];

  const benefits = [
    t('benefits.item1'),
    t('benefits.item2'),
    t('benefits.item3'),
    t('benefits.item4'),
    t('benefits.item5'),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-2xl font-bold text-blue-600">
            DiagnoLeads
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t('nav.benefits')}
            </Link>
            <Link
              href={`/${locale}/diagnostic`}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {t('nav.diagnostic')}
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/login`}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('nav.signup')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              {t('hero.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{t('hero.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/diagnostic`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg shadow-blue-600/25"
              >
                {t('hero.cta.primary')}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-50 transition-colors font-medium text-lg border border-gray-200"
              >
                {t('hero.cta.secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('benefits.title')}
              </h2>
              <p className="text-xl text-gray-600">{t('benefits.subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100"
                >
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">{t('trust.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('trust.security.title')}</h3>
                <p className="text-gray-600 text-sm">{t('trust.security.description')}</p>
              </div>
              <div className="p-6">
                <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('trust.global.title')}</h3>
                <p className="text-gray-600 text-sm">{t('trust.global.description')}</p>
              </div>
              <div className="p-6">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('trust.performance.title')}</h3>
                <p className="text-gray-600 text-sm">{t('trust.performance.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
          <Link
            href={`/${locale}/diagnostic`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-lg"
          >
            {t('cta.button')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-bold text-white">DiagnoLeads</div>
            <div className="flex items-center gap-6 text-sm">
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                {t('footer.terms')}
              </Link>
              <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
                {t('footer.contact')}
              </Link>
            </div>
            <div className="text-sm">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
