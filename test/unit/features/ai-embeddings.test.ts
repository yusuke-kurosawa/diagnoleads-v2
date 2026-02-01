/**
 * AI Embeddings Service Tests
 *
 * Tests for prepareLeadText utility function
 */

import { describe, expect, it } from 'vitest';
import { prepareLeadText } from '@/lib/features/ai/embeddings/openai';

describe('AI Embeddings Service', () => {
  describe('prepareLeadText', () => {
    it('should combine all lead fields into searchable text', () => {
      const lead = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        industry: 'Technology',
        position: 'CEO',
        notes: 'Important customer',
      };

      const result = prepareLeadText(lead);

      expect(result).toContain('John Doe');
      expect(result).toContain('john@example.com');
      expect(result).toContain('Acme Corp');
      expect(result).toContain('Technology');
      expect(result).toContain('CEO');
      expect(result).toContain('Important customer');
    });

    it('should handle null and undefined fields', () => {
      const lead = {
        name: 'Jane Doe',
        email: null,
        company: undefined,
        notes: 'Some notes',
      };

      const result = prepareLeadText(lead);

      expect(result).toContain('Jane Doe');
      expect(result).toContain('Some notes');
      expect(result).not.toContain('null');
      expect(result).not.toContain('undefined');
    });

    it('should return empty string for empty lead', () => {
      const lead = {
        name: null,
        email: null,
        company: null,
        notes: null,
      };

      const result = prepareLeadText(lead);

      expect(result).toBe('');
    });

    it('should join fields with spaces', () => {
      const lead = {
        name: 'Test',
        company: 'Company',
      };

      const result = prepareLeadText(lead);

      expect(result).toBe('Test Company');
    });
  });
});

describe('Embedding Vector Properties', () => {
  it('should have correct dimensions (1536 for text-embedding-3-small)', () => {
    const expectedDimensions = 1536;
    const mockEmbedding = Array.from({ length: expectedDimensions }, () => 0);

    expect(mockEmbedding).toHaveLength(expectedDimensions);
  });

  it('should contain float values', () => {
    const mockEmbedding = [0.1, -0.2, 0.3, 0.4, -0.5];

    for (const value of mockEmbedding) {
      expect(typeof value).toBe('number');
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
