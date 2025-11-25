/**
 * Semantic Search Service
 *
 * Provides natural language search capabilities for leads using vector embeddings.
 * Allows users to search using phrases like "tech companies in San Francisco"
 * instead of exact keyword matches.
 */

import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { generateEmbedding } from '../embeddings/openai';

export interface SemanticSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  industry: string | null;
  similarity: number;
}

/**
 * Perform semantic search on leads
 * @param query - Natural language search query
 * @param organizationId - Organization to search within
 * @param limit - Maximum number of results
 * @param minSimilarity - Minimum cosine similarity threshold (0-1)
 * @returns Array of matching leads with similarity scores
 */
export async function semanticSearch(
  query: string,
  organizationId: string,
  options: {
    limit?: number;
    minSimilarity?: number;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { limit = 10, minSimilarity = 0.7 } = options;

  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Convert embedding array to pgvector format string
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Perform vector similarity search using cosine distance
    // Note: We use 1 - cosine_distance to get similarity (higher is better)
    const results = await db.execute(sql`
      SELECT
        id,
        name,
        email,
        company,
        industry,
        1 - (embedding <=> ${embeddingString}::vector) as similarity
      FROM ${leads}
      WHERE
        organization_id = ${organizationId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embeddingString}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `);

    return results.rows as SemanticSearchResult[];
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw new Error('Semantic search failed');
  }
}

/**
 * Find similar leads based on a reference lead
 * @param leadId - Reference lead ID
 * @param organizationId - Organization to search within
 * @param limit - Maximum number of results
 * @returns Array of similar leads
 */
export async function findSimilarLeads(
  leadId: string,
  organizationId: string,
  limit: number = 5
): Promise<SemanticSearchResult[]> {
  try {
    // Get the reference lead's embedding
    const [refLead] = await db
      .select({ embedding: leads.embedding })
      .from(leads)
      .where(sql`${leads.id} = ${leadId}`);

    if (!refLead || !refLead.embedding) {
      throw new Error('Reference lead not found or has no embedding');
    }

    const embeddingString = refLead.embedding;

    // Find similar leads (excluding the reference lead)
    const results = await db.execute(sql`
      SELECT
        id,
        name,
        email,
        company,
        industry,
        1 - (embedding <=> ${embeddingString}::vector) as similarity
      FROM ${leads}
      WHERE
        organization_id = ${organizationId}
        AND embedding IS NOT NULL
        AND id != ${leadId}
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `);

    return results.rows as SemanticSearchResult[];
  } catch (error) {
    console.error('Error finding similar leads:', error);
    throw new Error('Finding similar leads failed');
  }
}

/**
 * Update lead embedding
 * Used when a lead is created or updated
 */
export async function updateLeadEmbedding(
  leadId: string,
  text: string
): Promise<void> {
  try {
    const embedding = await generateEmbedding(text);
    const embeddingString = `[${embedding.join(',')}]`;

    await db.execute(sql`
      UPDATE ${leads}
      SET embedding = ${embeddingString}::vector
      WHERE id = ${leadId}
    `);
  } catch (error) {
    console.error('Error updating lead embedding:', error);
    // Don't throw - embedding update failures shouldn't block lead operations
  }
}
