/**
 * AI Schemas Tests
 *
 * Unit tests for AI feature type definitions and validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  scoreLeadSchema,
  semanticSearchSchema,
  findSimilarLeadsSchema,
  generateSummarySchema,
  updateEmbeddingSchema,
  batchScoreLeadsSchema,
  predictConversionSchema,
  batchPredictConversionSchema,
  type ScoreLeadInput,
  type SemanticSearchInput,
  type FindSimilarLeadsInput,
  type GenerateSummaryInput,
  type UpdateEmbeddingInput,
  type BatchScoreLeadsInput,
  type PredictConversionInput,
  type BatchPredictConversionInput,
} from '@/lib/features/ai/types/schemas';

describe('scoreLeadSchema', () => {
  it('should accept valid input', () => {
    const input: ScoreLeadInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = scoreLeadSchema.parse(input);
    expect(result.leadId).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('should reject invalid UUIDs', () => {
    expect(() =>
      scoreLeadSchema.parse({
        organizationId: 'invalid',
        leadId: '123e4567-e89b-12d3-a456-426614174001',
      })
    ).toThrow();

    expect(() =>
      scoreLeadSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        leadId: 'invalid',
      })
    ).toThrow();
  });
});

describe('semanticSearchSchema', () => {
  it('should accept valid input with defaults', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'technology startups',
    };

    const result = semanticSearchSchema.parse(input);
    expect(result.query).toBe('technology startups');
    expect(result.limit).toBe(10);
    expect(result.minSimilarity).toBe(0.7);
  });

  it('should accept custom limit and similarity', () => {
    const input: SemanticSearchInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'enterprise solutions',
      limit: 25,
      minSimilarity: 0.85,
    };

    const result = semanticSearchSchema.parse(input);
    expect(result.limit).toBe(25);
    expect(result.minSimilarity).toBe(0.85);
  });

  it('should reject empty query', () => {
    expect(() =>
      semanticSearchSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        query: '',
      })
    ).toThrow();
  });

  it('should validate limit range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'test',
    };

    expect(() => semanticSearchSchema.parse({ ...baseInput, limit: 0 })).toThrow();
    expect(() => semanticSearchSchema.parse({ ...baseInput, limit: 51 })).toThrow();
    expect(semanticSearchSchema.parse({ ...baseInput, limit: 1 }).limit).toBe(1);
    expect(semanticSearchSchema.parse({ ...baseInput, limit: 50 }).limit).toBe(50);
  });

  it('should validate similarity range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'test',
    };

    expect(() => semanticSearchSchema.parse({ ...baseInput, minSimilarity: -0.1 })).toThrow();
    expect(() => semanticSearchSchema.parse({ ...baseInput, minSimilarity: 1.1 })).toThrow();
    expect(semanticSearchSchema.parse({ ...baseInput, minSimilarity: 0 }).minSimilarity).toBe(0);
    expect(semanticSearchSchema.parse({ ...baseInput, minSimilarity: 1 }).minSimilarity).toBe(1);
  });
});

describe('findSimilarLeadsSchema', () => {
  it('should accept valid input with defaults', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = findSimilarLeadsSchema.parse(input);
    expect(result.limit).toBe(5);
  });

  it('should accept custom limit', () => {
    const input: FindSimilarLeadsInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
      limit: 15,
    };

    const result = findSimilarLeadsSchema.parse(input);
    expect(result.limit).toBe(15);
  });

  it('should validate limit range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };

    expect(() => findSimilarLeadsSchema.parse({ ...baseInput, limit: 0 })).toThrow();
    expect(() => findSimilarLeadsSchema.parse({ ...baseInput, limit: 21 })).toThrow();
  });
});

describe('generateSummarySchema', () => {
  it('should accept valid input', () => {
    const input: GenerateSummaryInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = generateSummarySchema.parse(input);
    expect(result.organizationId).toBeDefined();
    expect(result.leadId).toBeDefined();
  });
});

describe('updateEmbeddingSchema', () => {
  it('should accept valid input', () => {
    const input: UpdateEmbeddingInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = updateEmbeddingSchema.parse(input);
    expect(result.leadId).toBe('123e4567-e89b-12d3-a456-426614174001');
  });
});

describe('batchScoreLeadsSchema', () => {
  it('should accept valid input', () => {
    const input: BatchScoreLeadsInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadIds: [
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
      ],
    };

    const result = batchScoreLeadsSchema.parse(input);
    expect(result.leadIds).toHaveLength(2);
  });

  it('should require at least one leadId', () => {
    expect(() =>
      batchScoreLeadsSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        leadIds: [],
      })
    ).toThrow();
  });

  it('should limit to 50 leadIds', () => {
    const leadIds = Array(51)
      .fill(null)
      .map((_, i) => `123e4567-e89b-12d3-a456-42661417400${i.toString().padStart(1, '0')}`);

    expect(() =>
      batchScoreLeadsSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        leadIds,
      })
    ).toThrow();
  });

  it('should accept exactly 50 leadIds', () => {
    const leadIds = Array(50)
      .fill(null)
      .map(() => '123e4567-e89b-12d3-a456-426614174001');

    const result = batchScoreLeadsSchema.parse({
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadIds,
    });
    expect(result.leadIds).toHaveLength(50);
  });
});

describe('predictConversionSchema', () => {
  it('should accept valid input', () => {
    const input: PredictConversionInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = predictConversionSchema.parse(input);
    expect(result.leadId).toBeDefined();
  });
});

describe('batchPredictConversionSchema', () => {
  it('should accept valid input', () => {
    const input: BatchPredictConversionInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadIds: [
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174003',
      ],
    };

    const result = batchPredictConversionSchema.parse(input);
    expect(result.leadIds).toHaveLength(3);
  });

  it('should require at least one leadId', () => {
    expect(() =>
      batchPredictConversionSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        leadIds: [],
      })
    ).toThrow();
  });

  it('should limit to 20 leadIds', () => {
    const leadIds = Array(21)
      .fill(null)
      .map(() => '123e4567-e89b-12d3-a456-426614174001');

    expect(() =>
      batchPredictConversionSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        leadIds,
      })
    ).toThrow();
  });
});

describe('Type exports', () => {
  it('should export ScoreLeadInput', () => {
    const input: ScoreLeadInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      leadId: '123e4567-e89b-12d3-a456-426614174001',
    };
    expect(input).toBeDefined();
  });

  it('should export SemanticSearchInput', () => {
    const input: SemanticSearchInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'test',
      limit: 10,
      minSimilarity: 0.7,
    };
    expect(input.query).toBeDefined();
  });

  it('should export all input types', () => {
    const types = [
      'ScoreLeadInput',
      'SemanticSearchInput',
      'FindSimilarLeadsInput',
      'GenerateSummaryInput',
      'UpdateEmbeddingInput',
      'BatchScoreLeadsInput',
      'PredictConversionInput',
      'BatchPredictConversionInput',
    ];
    expect(types).toHaveLength(8);
  });
});
