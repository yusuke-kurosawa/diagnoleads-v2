import { z } from 'zod';

/**
 * Score lead with AI schema
 */
export const scoreLeadSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
});
export type ScoreLeadInput = z.infer<typeof scoreLeadSchema>;

/**
 * Semantic search schema
 */
export const semanticSearchSchema = z.object({
  organizationId: z.string().uuid(),
  query: z.string().min(1, '検索クエリを入力してください'),
  limit: z.number().int().min(1).max(50).default(10),
  minSimilarity: z.number().min(0).max(1).default(0.7),
});
export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;

/**
 * Find similar leads schema
 */
export const findSimilarLeadsSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  limit: z.number().int().min(1).max(20).default(5),
});
export type FindSimilarLeadsInput = z.infer<typeof findSimilarLeadsSchema>;

/**
 * Generate lead summary schema
 */
export const generateSummarySchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
});
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;

/**
 * Update lead embedding schema
 */
export const updateEmbeddingSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
});
export type UpdateEmbeddingInput = z.infer<typeof updateEmbeddingSchema>;

/**
 * Batch score leads schema
 */
export const batchScoreLeadsSchema = z.object({
  organizationId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()).min(1).max(50),
});
export type BatchScoreLeadsInput = z.infer<typeof batchScoreLeadsSchema>;
