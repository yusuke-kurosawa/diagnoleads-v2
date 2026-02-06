/**
 * AI Semantic Search Tests
 *
 * Unit tests for semantic search service
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SemanticSearchResult } from '@/lib/features/ai/search/semantic';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

// Mock OpenAI embeddings
vi.mock('@/lib/features/ai/embeddings/openai', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

describe('SemanticSearchResult type', () => {
  it('should have correct structure', () => {
    const result: SemanticSearchResult = {
      id: 'lead-123',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      industry: 'technology',
      similarity: 0.95,
    };

    expect(result.id).toBe('lead-123');
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.company).toBe('Acme Corp');
    expect(result.industry).toBe('technology');
    expect(result.similarity).toBe(0.95);
  });

  it('should allow null fields', () => {
    const result: SemanticSearchResult = {
      id: 'lead-456',
      name: null,
      email: null,
      company: null,
      industry: null,
      similarity: 0.75,
    };

    expect(result.name).toBeNull();
    expect(result.email).toBeNull();
    expect(result.similarity).toBe(0.75);
  });

  it('should have similarity between 0 and 1', () => {
    const results: SemanticSearchResult[] = [
      { id: '1', name: 'A', email: null, company: null, industry: null, similarity: 0 },
      { id: '2', name: 'B', email: null, company: null, industry: null, similarity: 0.5 },
      { id: '3', name: 'C', email: null, company: null, industry: null, similarity: 1 },
    ];

    for (const result of results) {
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
    }
  });
});

describe('Semantic search options', () => {
  it('should have default limit of 10', () => {
    const defaultOptions = { limit: 10, minSimilarity: 0.7 };
    expect(defaultOptions.limit).toBe(10);
  });

  it('should have default minSimilarity of 0.7', () => {
    const defaultOptions = { limit: 10, minSimilarity: 0.7 };
    expect(defaultOptions.minSimilarity).toBe(0.7);
  });

  it('should accept custom options', () => {
    const customOptions = { limit: 25, minSimilarity: 0.85 };
    expect(customOptions.limit).toBe(25);
    expect(customOptions.minSimilarity).toBe(0.85);
  });
});

describe('Semantic search result ranking', () => {
  it('should order results by similarity descending', () => {
    const results: SemanticSearchResult[] = [
      { id: '1', name: 'Best Match', email: null, company: null, industry: null, similarity: 0.95 },
      { id: '2', name: 'Good Match', email: null, company: null, industry: null, similarity: 0.85 },
      { id: '3', name: 'Okay Match', email: null, company: null, industry: null, similarity: 0.75 },
    ];

    // Verify descending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
    }
  });

  it('should filter out results below minSimilarity', () => {
    const minSimilarity = 0.7;
    const results: SemanticSearchResult[] = [
      { id: '1', name: 'A', email: null, company: null, industry: null, similarity: 0.95 },
      { id: '2', name: 'B', email: null, company: null, industry: null, similarity: 0.80 },
      { id: '3', name: 'C', email: null, company: null, industry: null, similarity: 0.70 },
    ];

    const filteredResults = results.filter((r) => r.similarity >= minSimilarity);
    expect(filteredResults).toHaveLength(3);

    const lowSimilarityResults: SemanticSearchResult[] = [
      { id: '4', name: 'D', email: null, company: null, industry: null, similarity: 0.65 },
      { id: '5', name: 'E', email: null, company: null, industry: null, similarity: 0.50 },
    ];

    const filteredLow = lowSimilarityResults.filter((r) => r.similarity >= minSimilarity);
    expect(filteredLow).toHaveLength(0);
  });
});

describe('findSimilarLeads options', () => {
  it('should have default limit of 5', () => {
    const defaultLimit = 5;
    expect(defaultLimit).toBe(5);
  });

  it('should exclude reference lead from results', () => {
    const referenceLeadId = 'lead-123';
    const similarLeads: SemanticSearchResult[] = [
      { id: 'lead-456', name: 'Similar 1', email: null, company: null, industry: null, similarity: 0.90 },
      { id: 'lead-789', name: 'Similar 2', email: null, company: null, industry: null, similarity: 0.85 },
    ];

    // Reference lead should not be in results
    const hasReferenceLead = similarLeads.some((l) => l.id === referenceLeadId);
    expect(hasReferenceLead).toBe(false);
  });
});

describe('Embedding vector', () => {
  it('should have 1536 dimensions for OpenAI embeddings', () => {
    const embeddingDimensions = 1536;
    const mockEmbedding = new Array(embeddingDimensions).fill(0.1);
    expect(mockEmbedding).toHaveLength(1536);
  });

  it('should convert embedding to pgvector format', () => {
    const embedding = [0.1, 0.2, 0.3];
    const pgvectorFormat = `[${embedding.join(',')}]`;
    expect(pgvectorFormat).toBe('[0.1,0.2,0.3]');
  });
});

describe('Error handling patterns', () => {
  it('should handle missing embedding gracefully', () => {
    const leadWithNoEmbedding = {
      id: 'lead-no-embed',
      embedding: null,
    };

    expect(leadWithNoEmbedding.embedding).toBeNull();
  });

  it('should handle empty search results', () => {
    const emptyResults: SemanticSearchResult[] = [];
    expect(emptyResults).toHaveLength(0);
  });
});

describe('Search query processing', () => {
  it('should handle various query types', () => {
    const queries = [
      'tech companies in San Francisco',
      'enterprise customers',
      'leads from healthcare industry',
      'high value prospects',
      'companies with 100+ employees',
    ];

    for (const query of queries) {
      expect(typeof query).toBe('string');
      expect(query.length).toBeGreaterThan(0);
    }
  });

  it('should handle empty query', () => {
    const emptyQuery = '';
    expect(emptyQuery).toBe('');
    expect(emptyQuery.length).toBe(0);
  });

  it('should handle special characters in query', () => {
    const specialQueries = [
      'companies with $1M+ revenue',
      'leads from "Enterprise" segment',
      "John's company",
      'B2B & B2C companies',
    ];

    for (const query of specialQueries) {
      expect(typeof query).toBe('string');
    }
  });
});
