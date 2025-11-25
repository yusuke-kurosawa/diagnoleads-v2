/**
 * OpenAI Embeddings Service
 *
 * Generates vector embeddings for text using OpenAI's text-embedding-3-small model.
 * Used for semantic search and similarity matching of leads.
 */

import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding vector for text
 * @param text - The text to generate embedding for
 * @returns Vector embedding (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of vector embeddings
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings batch:', error);
    throw new Error('Failed to generate embeddings batch');
  }
}

/**
 * Prepare lead text for embedding
 * Combines relevant lead fields into a searchable text
 */
export function prepareLeadText(lead: {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  notes?: string | null;
  industry?: string | null;
  position?: string | null;
}): string {
  const parts = [
    lead.name,
    lead.email,
    lead.company,
    lead.industry,
    lead.position,
    lead.notes,
  ].filter(Boolean);

  return parts.join(' ');
}
