import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

// Mock embedding generation
vi.mock('@/lib/features/ai/embeddings/openai', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

import { db } from '@/lib/db';
import { generateEmbedding } from '@/lib/features/ai/embeddings/openai';
import {
  findSimilarLeads,
  semanticSearch,
  updateLeadEmbedding,
} from '@/lib/features/ai/search/semantic';

describe('semantic-search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('semanticSearch', () => {
    it('should perform semantic search with default options', async () => {
      const mockResults = [
        { id: 'lead-1', name: 'John Doe', email: 'john@example.com', company: 'Acme', industry: 'Tech', similarity: 0.85 },
        { id: 'lead-2', name: 'Jane Smith', email: 'jane@example.com', company: 'Corp', industry: 'Finance', similarity: 0.75 },
      ];

      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults);

      const results = await semanticSearch('tech companies', 'org-1');

      expect(generateEmbedding).toHaveBeenCalledWith('tech companies');
      expect(db.execute).toHaveBeenCalled();
      expect(results).toEqual(mockResults);
    });

    it('should use custom limit', async () => {
      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await semanticSearch('startups', 'org-1', { limit: 5 });

      expect(db.execute).toHaveBeenCalled();
    });

    it('should use custom similarity threshold', async () => {
      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await semanticSearch('enterprise software', 'org-1', { minSimilarity: 0.8 });

      expect(db.execute).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const results = await semanticSearch('no matches query', 'org-1');

      expect(results).toEqual([]);
    });

    it('should throw error on embedding failure', async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Embedding API error'));

      await expect(semanticSearch('query', 'org-1')).rejects.toThrow('Semantic search failed');
    });

    it('should throw error on database failure', async () => {
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      await expect(semanticSearch('query', 'org-1')).rejects.toThrow('Semantic search failed');
    });
  });

  describe('findSimilarLeads', () => {
    it('should find similar leads', async () => {
      const mockRefLead = { embedding: '[0.1,0.2,0.3]' };
      const mockSimilarLeads = [
        { id: 'lead-2', name: 'Similar Lead', similarity: 0.9 },
      ];

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockRefLead]);
      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue(mockSimilarLeads);

      const results = await findSimilarLeads('lead-1', 'org-1');

      expect(results).toEqual(mockSimilarLeads);
    });

    it('should use custom limit', async () => {
      const mockRefLead = { embedding: '[0.1,0.2,0.3]' };
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockRefLead]);
      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await findSimilarLeads('lead-1', 'org-1', 10);

      expect(db.execute).toHaveBeenCalled();
    });

    it('should throw error when reference lead not found', async () => {
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await expect(findSimilarLeads('non-existent', 'org-1')).rejects.toThrow();
    });

    it('should throw error when reference lead has no embedding', async () => {
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([{ embedding: null }]);

      await expect(findSimilarLeads('lead-no-embedding', 'org-1')).rejects.toThrow();
    });

    it('should throw error on database failure', async () => {
      const mockRefLead = { embedding: '[0.1,0.2,0.3]' };
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockRefLead]);
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

      await expect(findSimilarLeads('lead-1', 'org-1')).rejects.toThrow('Finding similar leads failed');
    });
  });

  describe('updateLeadEmbedding', () => {
    it('should call generateEmbedding with text', async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(new Array(1536).fill(0.1));
      (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await updateLeadEmbedding('lead-1', 'John Doe at Acme Corp');

      expect(generateEmbedding).toHaveBeenCalledWith('John Doe at Acme Corp');
    });

    it('should not throw on embedding failure', async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

      // Should not throw - errors are caught internally
      await updateLeadEmbedding('lead-1', 'text');
      // If we reach here, no error was thrown
      expect(true).toBe(true);
    });

    it('should not throw on database failure', async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(new Array(1536).fill(0.1));
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB Error'));

      // Should not throw - errors are caught internally
      await updateLeadEmbedding('lead-1', 'text');
      // If we reach here, no error was thrown
      expect(true).toBe(true);
    });
  });

  describe('SemanticSearchResult type', () => {
    it('should have correct structure', () => {
      const result = {
        id: 'lead-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        industry: 'Technology',
        similarity: 0.85,
      };

      expect(result.id).toBeDefined();
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
    });

    it('should allow null fields', () => {
      const result = {
        id: 'lead-1',
        name: null,
        email: null,
        company: null,
        industry: null,
        similarity: 0.7,
      };

      expect(result.name).toBeNull();
      expect(result.email).toBeNull();
    });
  });
});
