/**
 * AI Features Entry Point
 *
 * Centralizes all AI-powered features for DiagnoLeads:
 * - Lead scoring with Claude AI
 * - Semantic search with OpenAI embeddings
 * - Chat assistant
 * - Lead insights and summaries
 */

// Export embeddings
export { generateEmbedding, generateEmbeddingsBatch, prepareLeadText } from './embeddings/openai';

// Export scoring
export { scoreLeadWithAI, scoreLeadsBatch, type LeadScore } from './scoring/claude';

// Export search
export {
  semanticSearch,
  findSimilarLeads,
  updateLeadEmbedding,
  type SemanticSearchResult,
} from './search/semantic';

// Export chat
export { generateChatResponse, generateLeadSummary, type ChatMessage } from './chat/assistant';
