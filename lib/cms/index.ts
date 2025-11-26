/**
 * DiagnoLeads v2 CMS Abstraction Layer
 *
 * このモジュールを通じてCMSにアクセスすることで、
 * CMS実装の変更に柔軟に対応できます。
 *
 * @example
 * ```typescript
 * import { BlogRepository, FAQRepository } from '@/lib/cms';
 *
 * // リポジトリを使用（推奨）
 * const blogRepo = new BlogRepository();
 * const posts = await blogRepo.findAll({ status: 'published' });
 *
 * const faqRepo = new FAQRepository();
 * const faqs = await faqRepo.findByCategories();
 * ```
 */

// =============================================================================
// Type Exports (CMS-agnostic)
// =============================================================================

export type {
  // Localization
  LocalizedString,
  LocalizedRichText,
  RichTextContent,
  RichTextNode,
  TextNode,
  TextMark,
  // Content Types
  BlogPost,
  FAQ,
  AssessmentTemplate,
  AssessmentQuestion,
  AssessmentOption,
  ScoringRule,
  ResultMessage,
  LandingPage,
  StaticPage,
  EmailTemplate,
  // Metadata
  ContentStatus,
  SEOMetadata,
  Author,
  MediaAsset,
  Industry,
} from './core/types';

// =============================================================================
// Interface Exports
// =============================================================================

export type {
  CMSAdapter,
  CMSResponse,
  CMSResponseMeta,
  FindParams,
  FindByIdParams,
  FindBySlugParams,
  CreateParams,
  UpdateParams,
  DeleteParams,
  SearchParams,
  WhereCondition,
  WhereOperator,
  SortParams,
  ExportData,
  ImportResult,
  CollectionConfig,
  FieldConfig,
} from './core/interfaces';

// =============================================================================
// Error Exports
// =============================================================================

export {
  CMSError,
  CMSNotFoundError,
  CMSAccessDeniedError,
  CMSOrganizationMismatchError,
  CMSValidationError,
  CMSConnectionError,
  CMSConfigurationError,
  isCMSError,
  toCMSError,
} from './core/errors';

// =============================================================================
// Repository Exports (Recommended Usage)
// =============================================================================

export { BlogRepository } from './repositories/blog.repository';
export type { FindBlogPostsOptions, BlogPostsResult } from './repositories/blog.repository';

export { FAQRepository } from './repositories/faq.repository';
export type { FindFAQsOptions, FAQsResult, FAQsByCategory } from './repositories/faq.repository';

export { AssessmentRepository } from './repositories/assessment.repository';
export type { FindAssessmentsOptions, AssessmentsResult } from './repositories/assessment.repository';

// =============================================================================
// Adapter Factory (Advanced Usage)
// =============================================================================

export {
  getCMSAdapter,
  setCMSAdapter,
  resetCMSAdapter,
  initializeCMS,
  checkCMSHealth,
} from './adapters/factory';

// =============================================================================
// Adapters
// =============================================================================

export { MockCMSAdapter } from './adapters/mock/adapter';
export { PayloadCMSAdapter } from './adapters/payload/adapter';

// =============================================================================
// Helpers (Multi-tenant & Utilities)
// =============================================================================

export {
  getTenantContext,
  getBlogRepository,
  getFAQRepository,
  getAssessmentRepository,
  requireTenantContext,
  getPublicContentContext,
  type TenantContext,
} from './helpers';
