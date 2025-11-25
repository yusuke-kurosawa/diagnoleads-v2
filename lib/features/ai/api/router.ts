/**
 * AI Features tRPC Router
 *
 * Provides AI-powered functionality for lead management:
 * - Lead scoring with Claude 4.5 Sonnet
 * - Semantic search with pgvector
 * - Lead summaries and insights
 */

import { TRPCError } from '@trpc/server';
import { eq, and, sql } from 'drizzle-orm';
import { router, organizationProcedure } from '@/lib/trpc/init';
import { leads } from '@/lib/db/schema';
import {
  scoreLeadSchema,
  semanticSearchSchema,
  findSimilarLeadsSchema,
  generateSummarySchema,
  updateEmbeddingSchema,
  batchScoreLeadsSchema,
} from '../types/schemas';
import {
  scoreLeadWithAI,
  scoreLeadsBatch,
} from '../scoring/claude';
import {
  semanticSearch,
  findSimilarLeads,
  updateLeadEmbedding,
} from '../search/semantic';
import { generateLeadSummary } from '../chat/assistant';
import { prepareLeadText } from '../embeddings/openai';

/**
 * AI features tRPC router
 */
export const aiRouter = router({
  /**
   * Score a single lead using AI
   */
  scoreLead: organizationProcedure
    .input(scoreLeadSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードをスコアリングする権限がありません',
        });
      }

      // Get lead
      const lead = await ctx.db.query.leads.findFirst({
        where: and(
          eq(leads.id, input.leadId),
          eq(leads.organizationId, input.organizationId)
        ),
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      // Score the lead
      const aiScore = await scoreLeadWithAI(lead);

      // Update lead with AI score
      const [updated] = await ctx.db
        .update(leads)
        .set({
          score: aiScore.score,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leads.id, input.leadId),
            eq(leads.organizationId, input.organizationId)
          )
        )
        .returning();

      return {
        lead: updated,
        aiScore,
      };
    }),

  /**
   * Batch score multiple leads
   */
  batchScoreLeads: organizationProcedure
    .input(batchScoreLeadsSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードをスコアリングする権限がありません',
        });
      }

      // Get all leads
      const leadsToScore = await ctx.db.query.leads.findMany({
        where: and(
          eq(leads.organizationId, input.organizationId),
          sql`${leads.id} = ANY(${input.leadIds})`
        ),
      });

      if (leadsToScore.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      // Batch score leads
      const scoresMap = await scoreLeadsBatch(leadsToScore);

      // Update all leads with scores
      const updatePromises = leadsToScore.map((lead) => {
        const aiScore = scoresMap.get(lead.id);
        if (!aiScore) {
          throw new Error(`Score not found for lead ${lead.id}`);
        }
        return ctx.db
          .update(leads)
          .set({
            score: aiScore.score,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(leads.id, lead.id),
              eq(leads.organizationId, input.organizationId)
            )
          )
          .returning();
      });

      const updatedLeads = await Promise.all(updatePromises);

      return {
        leads: updatedLeads.map(([lead]) => lead),
        scores: Array.from(scoresMap.entries()).map(([id, score]) => ({
          leadId: id,
          ...score,
        })),
      };
    }),

  /**
   * Semantic search for leads
   */
  semanticSearch: organizationProcedure
    .input(semanticSearchSchema)
    .query(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを検索する権限がありません',
        });
      }

      const results = await semanticSearch(input.query, input.organizationId, {
        limit: input.limit,
        minSimilarity: input.minSimilarity,
      });

      return results;
    }),

  /**
   * Find similar leads
   */
  findSimilar: organizationProcedure
    .input(findSimilarLeadsSchema)
    .query(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを閲覧する権限がありません',
        });
      }

      // Verify lead exists
      const lead = await ctx.db.query.leads.findFirst({
        where: and(
          eq(leads.id, input.leadId),
          eq(leads.organizationId, input.organizationId)
        ),
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      const similar = await findSimilarLeads(
        input.leadId,
        input.organizationId,
        input.limit
      );

      return similar;
    }),

  /**
   * Generate lead summary
   */
  generateSummary: organizationProcedure
    .input(generateSummarySchema)
    .query(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを閲覧する権限がありません',
        });
      }

      // Get lead
      const lead = await ctx.db.query.leads.findFirst({
        where: and(
          eq(leads.id, input.leadId),
          eq(leads.organizationId, input.organizationId)
        ),
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      const summary = await generateLeadSummary(lead);

      return { summary };
    }),

  /**
   * Update lead embedding
   */
  updateEmbedding: organizationProcedure
    .input(updateEmbeddingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを更新する権限がありません',
        });
      }

      // Verify lead exists
      const lead = await ctx.db.query.leads.findFirst({
        where: and(
          eq(leads.id, input.leadId),
          eq(leads.organizationId, input.organizationId)
        ),
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      // Prepare text from lead data
      const text = prepareLeadText(lead);
      await updateLeadEmbedding(input.leadId, text);

      return { success: true };
    }),
});
