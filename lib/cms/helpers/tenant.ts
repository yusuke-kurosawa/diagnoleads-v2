/**
 * Multi-tenant CMS Helpers
 *
 * セッションからorganizationIdを取得してCMSリポジトリと連携
 * マルチテナント環境でのデータアクセスを簡潔に記述可能にする
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/config';
import { BlogRepository } from '../repositories/blog.repository';
import { FAQRepository } from '../repositories/faq.repository';
import { AssessmentRepository } from '../repositories/assessment.repository';

export interface TenantContext {
  userId: string | null;
  organizationId: string | null;
  isAuthenticated: boolean;
}

/**
 * サーバーサイドでテナントコンテキストを取得
 * Server Componentやtで使用
 */
export async function getTenantContext(): Promise<TenantContext> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        userId: null,
        organizationId: null,
        isAuthenticated: false,
      };
    }

    // activeOrganizationIdはセッションから取得
    // better-authのorganizationプラグインが管理
    const organizationId = (session.session as { activeOrganizationId?: string })?.activeOrganizationId || null;

    return {
      userId: session.user.id,
      organizationId,
      isAuthenticated: true,
    };
  } catch {
    return {
      userId: null,
      organizationId: null,
      isAuthenticated: false,
    };
  }
}

/**
 * テナント対応のBlogRepository取得
 */
export async function getBlogRepository(): Promise<{
  repo: BlogRepository;
  organizationId: string | null;
}> {
  const { organizationId } = await getTenantContext();
  return {
    repo: new BlogRepository(),
    organizationId,
  };
}

/**
 * テナント対応のFAQRepository取得
 */
export async function getFAQRepository(): Promise<{
  repo: FAQRepository;
  organizationId: string | null;
}> {
  const { organizationId } = await getTenantContext();
  return {
    repo: new FAQRepository(),
    organizationId,
  };
}

/**
 * テナント対応のAssessmentRepository取得
 */
export async function getAssessmentRepository(): Promise<{
  repo: AssessmentRepository;
  organizationId: string | null;
}> {
  const { organizationId } = await getTenantContext();
  return {
    repo: new AssessmentRepository(),
    organizationId,
  };
}

/**
 * organizationIdが必要な操作のガード
 * 認証済みかつアクティブ組織が選択されていることを確認
 */
export async function requireTenantContext(): Promise<{
  userId: string;
  organizationId: string;
}> {
  const context = await getTenantContext();

  if (!context.isAuthenticated || !context.userId) {
    throw new Error('Authentication required');
  }

  if (!context.organizationId) {
    throw new Error('Organization context required');
  }

  return {
    userId: context.userId,
    organizationId: context.organizationId,
  };
}

/**
 * パブリックコンテンツアクセス用
 * organizationIdはオプショナル（グローバルコンテンツもサポート）
 */
export async function getPublicContentContext(): Promise<{
  organizationId: string | null;
}> {
  const { organizationId } = await getTenantContext();
  return { organizationId };
}
