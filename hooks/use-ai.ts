/**
 * React hooks for AI features
 *
 * Provides easy-to-use hooks for:
 * - Lead scoring with Claude 4.5 Sonnet
 * - Semantic search with pgvector
 * - Lead summaries and insights
 */

import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import type {
  ScoreLeadInput,
  SemanticSearchInput,
  FindSimilarLeadsInput,
  GenerateSummaryInput,
  UpdateEmbeddingInput,
  BatchScoreLeadsInput,
} from '@/lib/features/ai/types/schemas';

/**
 * Hook to score a single lead with AI
 */
export function useScoreLead() {
  const utils = trpc.useContext();

  return trpc.ai.scoreLead.useMutation({
    onMutate: async () => {
      toast.loading('AIでリードを評価中...', { id: 'score-lead' });
    },
    onSuccess: (data) => {
      // Invalidate the specific lead and the list
      utils.leads.get.invalidate({
        id: data.lead.id,
        organizationId: data.lead.organizationId,
      });
      utils.leads.list.invalidate();
      toast.success(`スコア: ${data.aiScore.score}/100 (${data.aiScore.priority}優先度)`, {
        id: 'score-lead',
      });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'score-lead' });
    },
  });
}

/**
 * Hook to batch score multiple leads
 */
export function useBatchScoreLeads() {
  const utils = trpc.useContext();

  return trpc.ai.batchScoreLeads.useMutation({
    onMutate: async (variables) => {
      toast.loading(`${variables.leadIds.length}件のリードを評価中...`, {
        id: 'batch-score',
      });
    },
    onSuccess: (data) => {
      utils.leads.list.invalidate();
      toast.success(`${data.leads.length}件のリードを評価しました`, {
        id: 'batch-score',
      });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'batch-score' });
    },
  });
}

/**
 * Hook for semantic search
 */
export function useSemanticSearch(input: SemanticSearchInput) {
  return trpc.ai.semanticSearch.useQuery(input, {
    // Only fetch when query is provided
    enabled: input.query.length > 0,
  });
}

/**
 * Hook to find similar leads
 */
export function useFindSimilarLeads(input: FindSimilarLeadsInput) {
  return trpc.ai.findSimilar.useQuery(input);
}

/**
 * Hook to generate lead summary
 */
export function useGenerateSummary(input: GenerateSummaryInput) {
  return trpc.ai.generateSummary.useQuery(input);
}

/**
 * Hook to update lead embedding
 */
export function useUpdateEmbedding() {
  const utils = trpc.useContext();

  return trpc.ai.updateEmbedding.useMutation({
    onMutate: async () => {
      toast.loading('埋め込みベクトルを更新中...', { id: 'update-embedding' });
    },
    onSuccess: (_, variables) => {
      utils.leads.get.invalidate({
        id: variables.leadId,
        organizationId: variables.organizationId,
      });
      toast.success('埋め込みベクトルを更新しました', { id: 'update-embedding' });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'update-embedding' });
    },
  });
}

/**
 * Composite hook for all AI operations
 * Useful when you need multiple AI features in a component
 */
export function useAI(organizationId: string) {
  const scoreLead = useScoreLead();
  const batchScoreLeads = useBatchScoreLeads();
  const updateEmbedding = useUpdateEmbedding();

  return {
    scoreLead,
    batchScoreLeads,
    updateEmbedding,
    // Helper methods for common operations
    score: (leadId: string) =>
      scoreLead.mutate({ leadId, organizationId }),
    batchScore: (leadIds: string[]) =>
      batchScoreLeads.mutate({ leadIds, organizationId }),
    updateLeadEmbedding: (leadId: string) =>
      updateEmbedding.mutate({ leadId, organizationId }),
  };
}
