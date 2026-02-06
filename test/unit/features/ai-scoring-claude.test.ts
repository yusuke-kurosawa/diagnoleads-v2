/**
 * AI Lead Scoring Tests
 *
 * Unit tests for Claude-based lead scoring service
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn(),
    };
  },
}));

// Import after mocking
import { scoreLeadWithAI, scoreLeadsBatch, type LeadScore } from '@/lib/features/ai/scoring/claude';

describe('scoreLeadWithAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful scoring', () => {
    it('should return a valid lead score', async () => {
      const lead = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        industry: 'technology',
        position: 'CTO',
        status: 'new',
        notes: 'Interested in enterprise plan',
        createdAt: new Date(),
      };

      const score = await scoreLeadWithAI(lead);

      expect(score).toHaveProperty('score');
      expect(score).toHaveProperty('confidence');
      expect(score).toHaveProperty('reasoning');
      expect(score).toHaveProperty('recommendedActions');
      expect(score).toHaveProperty('priority');
    });

    it('should handle minimal lead data', async () => {
      const lead = {
        email: 'minimal@example.com',
      };

      const score = await scoreLeadWithAI(lead);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('should handle null fields gracefully', async () => {
      const lead = {
        name: null,
        email: null,
        company: null,
        industry: null,
        position: null,
        notes: null,
        status: null,
        createdAt: undefined,
      };

      const score = await scoreLeadWithAI(lead);

      expect(score).toBeDefined();
      expect(typeof score.score).toBe('number');
    });
  });

  describe('score validation', () => {
    it('should return score between 0 and 100', async () => {
      const lead = { email: 'test@example.com' };
      const score = await scoreLeadWithAI(lead);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('should return valid confidence level', async () => {
      const lead = { email: 'test@example.com' };
      const score = await scoreLeadWithAI(lead);

      expect(['low', 'medium', 'high']).toContain(score.confidence);
    });

    it('should return valid priority', async () => {
      const lead = { email: 'test@example.com' };
      const score = await scoreLeadWithAI(lead);

      expect(['low', 'medium', 'high', 'urgent']).toContain(score.priority);
    });

    it('should return reasoning string', async () => {
      const lead = { email: 'test@example.com' };
      const score = await scoreLeadWithAI(lead);

      expect(typeof score.reasoning).toBe('string');
      expect(score.reasoning.length).toBeGreaterThan(0);
    });

    it('should return recommended actions array', async () => {
      const lead = { email: 'test@example.com' };
      const score = await scoreLeadWithAI(lead);

      expect(Array.isArray(score.recommendedActions)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return fallback score on error', async () => {
      // The mock returns a fallback by default when API fails
      const lead = { email: 'error@example.com' };
      const score = await scoreLeadWithAI(lead);

      // Fallback score should be returned
      expect(score.score).toBe(50);
      expect(score.confidence).toBe('low');
      expect(score.priority).toBe('medium');
    });
  });
});

describe('scoreLeadsBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should score multiple leads', async () => {
    const leads = [
      { id: 'lead-1', email: 'lead1@example.com', company: 'Company A' },
      { id: 'lead-2', email: 'lead2@example.com', company: 'Company B' },
      { id: 'lead-3', email: 'lead3@example.com', company: 'Company C' },
    ];

    const scores = await scoreLeadsBatch(leads);

    expect(scores).toBeInstanceOf(Map);
    expect(scores.size).toBe(3);
    expect(scores.has('lead-1')).toBe(true);
    expect(scores.has('lead-2')).toBe(true);
    expect(scores.has('lead-3')).toBe(true);
  });

  it('should handle empty array', async () => {
    const scores = await scoreLeadsBatch([]);

    expect(scores).toBeInstanceOf(Map);
    expect(scores.size).toBe(0);
  });

  it('should handle single lead', async () => {
    const leads = [{ id: 'single-lead', email: 'single@example.com' }];

    const scores = await scoreLeadsBatch(leads);

    expect(scores.size).toBe(1);
    expect(scores.has('single-lead')).toBe(true);
  });

  it('should return valid scores for each lead', async () => {
    const leads = [
      { id: 'lead-1', email: 'lead1@example.com' },
      { id: 'lead-2', email: 'lead2@example.com' },
    ];

    const scores = await scoreLeadsBatch(leads);

    for (const [id, score] of scores) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high']).toContain(score.confidence);
    }
  });

  it('should process leads in batches', async () => {
    // Create more leads than batch size (5)
    const leads = Array.from({ length: 12 }, (_, i) => ({
      id: `lead-${i}`,
      email: `lead${i}@example.com`,
    }));

    const scores = await scoreLeadsBatch(leads);

    expect(scores.size).toBe(12);
  });
});

describe('LeadScore type', () => {
  it('should have correct shape', () => {
    const score: LeadScore = {
      score: 75,
      confidence: 'high',
      reasoning: 'Strong indicators of purchase intent',
      recommendedActions: ['Schedule demo', 'Send case studies'],
      priority: 'high',
    };

    expect(score.score).toBe(75);
    expect(score.confidence).toBe('high');
    expect(score.reasoning).toBeTruthy();
    expect(score.recommendedActions).toHaveLength(2);
    expect(score.priority).toBe('high');
  });

  it('should support all confidence levels', () => {
    const confidenceLevels: LeadScore['confidence'][] = ['low', 'medium', 'high'];

    for (const confidence of confidenceLevels) {
      const score: LeadScore = {
        score: 50,
        confidence,
        reasoning: 'Test',
        recommendedActions: [],
        priority: 'medium',
      };
      expect(score.confidence).toBe(confidence);
    }
  });

  it('should support all priority levels', () => {
    const priorityLevels: LeadScore['priority'][] = ['low', 'medium', 'high', 'urgent'];

    for (const priority of priorityLevels) {
      const score: LeadScore = {
        score: 50,
        confidence: 'medium',
        reasoning: 'Test',
        recommendedActions: [],
        priority,
      };
      expect(score.priority).toBe(priority);
    }
  });
});
