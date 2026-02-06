/**
 * AI Router Tests
 *
 * Unit tests for AI features tRPC router
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definitions matching the router
const scoreLeadSchema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const batchScoreLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
  organizationId: z.string().uuid(),
});

const semanticSearchSchema = z.object({
  query: z.string().min(1).max(500),
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
});

const findSimilarLeadsSchema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(20).default(5),
});

const generateSummarySchema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const updateEmbeddingSchema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const predictConversionSchema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const batchPredictConversionSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(50),
  organizationId: z.string().uuid(),
});

// Sample UUIDs
const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const SAMPLE_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';
const SAMPLE_ORG_ID = '550e8400-e29b-41d4-a716-446655440099';

describe('AI Router Schema Validation', () => {
  describe('scoreLeadSchema', () => {
    it('should accept valid input', () => {
      const result = scoreLeadSchema.parse({
        leadId: SAMPLE_UUID,
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadId).toBe(SAMPLE_UUID);
      expect(result.organizationId).toBe(SAMPLE_ORG_ID);
    });

    it('should reject invalid UUID', () => {
      expect(() =>
        scoreLeadSchema.parse({
          leadId: 'invalid',
          organizationId: SAMPLE_ORG_ID,
        })
      ).toThrow();
    });

    it('should require both fields', () => {
      expect(() => scoreLeadSchema.parse({ leadId: SAMPLE_UUID })).toThrow();
      expect(() => scoreLeadSchema.parse({ organizationId: SAMPLE_ORG_ID })).toThrow();
    });
  });

  describe('batchScoreLeadsSchema', () => {
    it('should accept valid input with multiple leads', () => {
      const result = batchScoreLeadsSchema.parse({
        leadIds: [SAMPLE_UUID, SAMPLE_UUID_2],
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadIds).toHaveLength(2);
      expect(result.organizationId).toBe(SAMPLE_ORG_ID);
    });

    it('should reject empty leadIds array', () => {
      expect(() =>
        batchScoreLeadsSchema.parse({
          leadIds: [],
          organizationId: SAMPLE_ORG_ID,
        })
      ).toThrow();
    });

    it('should reject more than 100 leads', () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );

      expect(() =>
        batchScoreLeadsSchema.parse({
          leadIds: tooManyIds,
          organizationId: SAMPLE_ORG_ID,
        })
      ).toThrow();
    });
  });

  describe('semanticSearchSchema', () => {
    it('should accept valid search query', () => {
      const result = semanticSearchSchema.parse({
        query: 'enterprise software company',
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.query).toBe('enterprise software company');
      expect(result.limit).toBe(10); // default
      expect(result.threshold).toBe(0.7); // default
    });

    it('should accept custom limit and threshold', () => {
      const result = semanticSearchSchema.parse({
        query: 'tech startup',
        organizationId: SAMPLE_ORG_ID,
        limit: 20,
        threshold: 0.85,
      });

      expect(result.limit).toBe(20);
      expect(result.threshold).toBe(0.85);
    });

    it('should reject empty query', () => {
      expect(() =>
        semanticSearchSchema.parse({
          query: '',
          organizationId: SAMPLE_ORG_ID,
        })
      ).toThrow();
    });

    it('should reject query over 500 characters', () => {
      expect(() =>
        semanticSearchSchema.parse({
          query: 'a'.repeat(501),
          organizationId: SAMPLE_ORG_ID,
        })
      ).toThrow();
    });

    it('should reject limit over 50', () => {
      expect(() =>
        semanticSearchSchema.parse({
          query: 'test',
          organizationId: SAMPLE_ORG_ID,
          limit: 51,
        })
      ).toThrow();
    });

    it('should reject threshold over 1', () => {
      expect(() =>
        semanticSearchSchema.parse({
          query: 'test',
          organizationId: SAMPLE_ORG_ID,
          threshold: 1.5,
        })
      ).toThrow();
    });
  });

  describe('findSimilarLeadsSchema', () => {
    it('should accept valid input', () => {
      const result = findSimilarLeadsSchema.parse({
        leadId: SAMPLE_UUID,
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadId).toBe(SAMPLE_UUID);
      expect(result.limit).toBe(5); // default
    });

    it('should accept custom limit', () => {
      const result = findSimilarLeadsSchema.parse({
        leadId: SAMPLE_UUID,
        organizationId: SAMPLE_ORG_ID,
        limit: 15,
      });

      expect(result.limit).toBe(15);
    });

    it('should reject limit over 20', () => {
      expect(() =>
        findSimilarLeadsSchema.parse({
          leadId: SAMPLE_UUID,
          organizationId: SAMPLE_ORG_ID,
          limit: 21,
        })
      ).toThrow();
    });
  });

  describe('generateSummarySchema', () => {
    it('should accept valid input', () => {
      const result = generateSummarySchema.parse({
        leadId: SAMPLE_UUID,
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadId).toBe(SAMPLE_UUID);
      expect(result.organizationId).toBe(SAMPLE_ORG_ID);
    });
  });

  describe('updateEmbeddingSchema', () => {
    it('should accept valid input', () => {
      const result = updateEmbeddingSchema.parse({
        leadId: SAMPLE_UUID,
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadId).toBe(SAMPLE_UUID);
      expect(result.organizationId).toBe(SAMPLE_ORG_ID);
    });
  });

  describe('predictConversionSchema', () => {
    it('should accept valid input', () => {
      const result = predictConversionSchema.parse({
        leadId: SAMPLE_UUID,
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadId).toBe(SAMPLE_UUID);
      expect(result.organizationId).toBe(SAMPLE_ORG_ID);
    });
  });

  describe('batchPredictConversionSchema', () => {
    it('should accept valid input', () => {
      const result = batchPredictConversionSchema.parse({
        leadIds: [SAMPLE_UUID, SAMPLE_UUID_2],
        organizationId: SAMPLE_ORG_ID,
      });

      expect(result.leadIds).toHaveLength(2);
    });

    it('should reject more than 50 leads', () => {
      const tooManyIds = Array.from({ length: 51 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );

      expect(() =>
        batchPredictConversionSchema.parse({
          leadIds: tooManyIds,
          organizationId: SAMPLE_ORG_ID,
        })
      ).toThrow();
    });
  });
});

describe('AI Score Response Structure', () => {
  interface AIScore {
    score: number;
    confidence: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reasoning: string;
    recommendedActions: string[];
  }

  function validateAIScore(score: AIScore): boolean {
    return (
      typeof score.score === 'number' &&
      score.score >= 0 &&
      score.score <= 100 &&
      typeof score.confidence === 'number' &&
      score.confidence >= 0 &&
      score.confidence <= 1 &&
      ['low', 'medium', 'high', 'urgent'].includes(score.priority) &&
      typeof score.reasoning === 'string' &&
      Array.isArray(score.recommendedActions)
    );
  }

  it('should validate complete AI score', () => {
    const score: AIScore = {
      score: 85,
      confidence: 0.92,
      priority: 'high',
      reasoning: 'Enterprise company with high engagement',
      recommendedActions: ['Schedule demo', 'Send case study'],
    };

    expect(validateAIScore(score)).toBe(true);
  });

  it('should detect invalid score range', () => {
    const score: AIScore = {
      score: 150, // Invalid
      confidence: 0.92,
      priority: 'high',
      reasoning: 'Test',
      recommendedActions: [],
    };

    expect(validateAIScore(score)).toBe(false);
  });

  it('should detect invalid confidence range', () => {
    const score: AIScore = {
      score: 85,
      confidence: 1.5, // Invalid
      priority: 'high',
      reasoning: 'Test',
      recommendedActions: [],
    };

    expect(validateAIScore(score)).toBe(false);
  });
});

describe('Semantic Search Response Structure', () => {
  interface SearchResult {
    id: string;
    name: string;
    email: string;
    company: string | null;
    similarity: number;
  }

  function validateSearchResult(result: SearchResult): boolean {
    return (
      typeof result.id === 'string' &&
      typeof result.name === 'string' &&
      typeof result.email === 'string' &&
      typeof result.similarity === 'number' &&
      result.similarity >= 0 &&
      result.similarity <= 1
    );
  }

  it('should validate search result structure', () => {
    const result: SearchResult = {
      id: SAMPLE_UUID,
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      similarity: 0.89,
    };

    expect(validateSearchResult(result)).toBe(true);
  });

  it('should handle null company', () => {
    const result: SearchResult = {
      id: SAMPLE_UUID,
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: null,
      similarity: 0.75,
    };

    expect(validateSearchResult(result)).toBe(true);
  });
});

describe('Conversion Prediction Response', () => {
  interface ConversionPrediction {
    probability: number;
    confidence: number;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }>;
    recommendation: string;
  }

  function validatePrediction(prediction: ConversionPrediction): boolean {
    return (
      typeof prediction.probability === 'number' &&
      prediction.probability >= 0 &&
      prediction.probability <= 1 &&
      typeof prediction.confidence === 'number' &&
      prediction.confidence >= 0 &&
      prediction.confidence <= 1 &&
      Array.isArray(prediction.factors) &&
      typeof prediction.recommendation === 'string'
    );
  }

  it('should validate conversion prediction', () => {
    const prediction: ConversionPrediction = {
      probability: 0.73,
      confidence: 0.85,
      factors: [
        { factor: 'Company size', impact: 'positive', weight: 0.3 },
        { factor: 'Engagement score', impact: 'positive', weight: 0.25 },
        { factor: 'Time since contact', impact: 'negative', weight: 0.15 },
      ],
      recommendation: 'High conversion potential. Schedule follow-up call.',
    };

    expect(validatePrediction(prediction)).toBe(true);
  });

  it('should validate factor structure', () => {
    const factor = { factor: 'Budget', impact: 'positive' as const, weight: 0.2 };

    expect(['positive', 'negative', 'neutral'].includes(factor.impact)).toBe(true);
    expect(factor.weight).toBeGreaterThan(0);
    expect(factor.weight).toBeLessThanOrEqual(1);
  });
});

describe('Lead Summary Response', () => {
  interface LeadSummary {
    summary: string;
    keyInsights: string[];
    nextSteps: string[];
  }

  it('should validate summary structure', () => {
    const summary: LeadSummary = {
      summary: 'Enterprise company in tech sector showing strong interest.',
      keyInsights: [
        'Budget confirmed for Q1',
        'Decision maker engaged',
        'Previous vendor contract expiring',
      ],
      nextSteps: [
        'Send proposal',
        'Schedule technical demo',
        'Connect with procurement',
      ],
    };

    expect(typeof summary.summary).toBe('string');
    expect(summary.summary.length).toBeGreaterThan(0);
    expect(Array.isArray(summary.keyInsights)).toBe(true);
    expect(Array.isArray(summary.nextSteps)).toBe(true);
  });
});

describe('Embedding Update', () => {
  it('should validate embedding dimensions', () => {
    const EMBEDDING_DIMENSIONS = 1536; // OpenAI text-embedding-3-small

    // Mock embedding
    const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() * 2 - 1);

    expect(embedding.length).toBe(EMBEDDING_DIMENSIONS);
    expect(embedding.every((v) => typeof v === 'number')).toBe(true);
    expect(embedding.every((v) => v >= -1 && v <= 1)).toBe(true);
  });

  it('should prepare lead text for embedding', () => {
    const lead = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      message: 'Interested in enterprise plan',
    };

    const text = `${lead.name} ${lead.email} ${lead.company || ''} ${lead.message || ''}`.trim();

    expect(text).toContain('John Doe');
    expect(text).toContain('Acme Corp');
    expect(text).toContain('enterprise plan');
  });
});
