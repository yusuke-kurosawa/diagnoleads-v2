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

// Diagnostic Form Types
export type {
  DiagnosticForm,
  DiagnosticStep,
  DiagnosticQuestion,
  DiagnosticQuestionOption,
  DiagnosticQuestionType,
  DiagnosticScoring,
  DiagnosticSettings,
  DiagnosticSEO,
  DiagnosticSubmission,
  ScoringThreshold,
  ThresholdColor,
  ThresholdPriority,
  ScoreCalculationResult,
} from './core/diagnostic-form.types';

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
export type {
  FindAssessmentsOptions,
  AssessmentsResult,
} from './repositories/assessment.repository';

export { DiagnosticFormRepository } from './repositories/diagnostic-form.repository';
export type {
  FindDiagnosticFormsOptions,
  DiagnosticFormsResult,
} from './repositories/diagnostic-form.repository';

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

// =============================================================================
// Cache Layer
// =============================================================================

export {
  CMS_CACHE_CONFIG,
  getCollectionTag,
  getDocumentTag,
  getSlugTag,
  getOrganizationTag,
  generateCacheKey,
  invalidateCollection,
  invalidateDocument,
  invalidateBySlug,
  invalidateOrganization,
  invalidateAllCMS,
  createCachedQuery,
  createCachedFindById,
  createCachedFindBySlug,
  getCacheStats,
  resetCacheStats,
} from './core/cache';

// =============================================================================
// AI Content Generation
// =============================================================================

export {
  AIContentGenerator,
  getAIContentGenerator,
  resetAIContentGenerator,
  type ContentGenerationRequest,
  type GeneratedBlogContent,
  type GeneratedFAQ,
  type GeneratedDiagnosticQuestion,
  type GeneratedSEO,
  type AIProvider,
} from './ai/content-generator';

// =============================================================================
// Figma Integration
// =============================================================================

export {
  registerComponentMapping,
  getComponentMapping,
  getAllComponentMappings,
  initializeDefaultMappings,
  registerDesignToken,
  getDesignToken,
  getAllDesignTokens,
  tokensToCSS,
  figmaClient,
  figmaSitesManager,
  type ComponentMapping,
  type FieldMapping,
  type DesignToken,
  type FigmaPage,
} from './integrations/figma';

// =============================================================================
// Real-time Subscriptions
// =============================================================================

export {
  cmsEventEmitter,
  sseConnectionManager,
  cmsSubscriptionManager,
  createCMSEvent,
  emitFromPayloadHook,
  type CMSEventType,
  type CMSEvent,
  type Subscription,
} from './core/realtime';
