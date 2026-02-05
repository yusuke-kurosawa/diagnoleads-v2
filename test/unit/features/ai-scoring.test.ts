/**
 * AI Scoring Tests
 *
 * Unit tests for AI lead scoring logic
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Define LeadScore schema matching the actual implementation
const LeadScoreSchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  reasoning: z.string(),
  recommendedActions: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type LeadScore = z.infer<typeof LeadScoreSchema>;

// Helper to parse AI response
function parseAIResponse(text: string): LeadScore {
  // Parse JSON response (Claude might wrap it in markdown code blocks)
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Could not extract JSON from response');
  }

  const jsonText = jsonMatch[1] || jsonMatch[0];
  const parsed = JSON.parse(jsonText);

  return LeadScoreSchema.parse(parsed);
}

// Helper to calculate base score from lead data
function calculateBaseScore(lead: {
  company?: string | null;
  industry?: string | null;
  position?: string | null;
  notes?: string | null;
}): number {
  let score = 50; // Base score

  // Company presence
  if (lead.company) score += 10;

  // Industry scoring
  const techIndustries = ['technology', 'software', 'saas', 'fintech'];
  if (lead.industry && techIndustries.includes(lead.industry.toLowerCase())) {
    score += 15;
  } else if (lead.industry) {
    score += 5;
  }

  // Position scoring (decision makers)
  const decisionMakers = ['cto', 'ceo', 'cfo', 'vp', 'director', 'head'];
  if (
    lead.position &&
    decisionMakers.some((dm) => lead.position!.toLowerCase().includes(dm))
  ) {
    score += 20;
  } else if (lead.position) {
    score += 5;
  }

  // Notes presence
  if (lead.notes && lead.notes.length > 50) {
    score += 10;
  }

  return Math.min(score, 100);
}

describe('AI Score Response Parsing', () => {
  describe('parseAIResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        score: 85,
        confidence: 'high',
        reasoning: 'Good lead',
        recommendedActions: ['Follow up'],
        priority: 'high',
      });

      const result = parseAIResponse(response);

      expect(result.score).toBe(85);
      expect(result.confidence).toBe('high');
    });

    it('should parse JSON wrapped in code blocks', () => {
      const response = '```json\n' + JSON.stringify({
        score: 75,
        confidence: 'medium',
        reasoning: 'Test',
        recommendedActions: ['Action'],
        priority: 'medium',
      }) + '\n```';

      const result = parseAIResponse(response);

      expect(result.score).toBe(75);
    });

    it('should reject invalid score range', () => {
      const response = JSON.stringify({
        score: 150, // Invalid
        confidence: 'high',
        reasoning: 'Test',
        recommendedActions: ['Test'],
        priority: 'high',
      });

      expect(() => parseAIResponse(response)).toThrow();
    });

    it('should reject invalid confidence value', () => {
      const response = JSON.stringify({
        score: 50,
        confidence: 'super-high', // Invalid
        reasoning: 'Test',
        recommendedActions: ['Test'],
        priority: 'high',
      });

      expect(() => parseAIResponse(response)).toThrow();
    });

    it('should reject invalid priority value', () => {
      const response = JSON.stringify({
        score: 50,
        confidence: 'high',
        reasoning: 'Test',
        recommendedActions: ['Test'],
        priority: 'critical', // Invalid
      });

      expect(() => parseAIResponse(response)).toThrow();
    });

    it('should throw for non-JSON response', () => {
      const response = 'This is not JSON at all';

      expect(() => parseAIResponse(response)).toThrow();
    });

    it('should throw for partial JSON', () => {
      const response = '{ "score": 50, "confidence":';

      expect(() => parseAIResponse(response)).toThrow();
    });
  });
});

describe('Base Score Calculation', () => {
  describe('calculateBaseScore', () => {
    it('should return base score of 50 for empty lead', () => {
      const score = calculateBaseScore({});

      expect(score).toBe(50);
    });

    it('should add points for company presence', () => {
      const score = calculateBaseScore({ company: 'TechCorp' });

      expect(score).toBe(60); // 50 base + 10 company
    });

    it('should add higher points for tech industry', () => {
      const techScore = calculateBaseScore({ industry: 'technology' });
      const otherScore = calculateBaseScore({ industry: 'retail' });

      expect(techScore).toBeGreaterThan(otherScore);
      expect(techScore).toBe(65); // 50 + 15
      expect(otherScore).toBe(55); // 50 + 5
    });

    it('should add higher points for decision makers', () => {
      const ctoScore = calculateBaseScore({ position: 'CTO' });
      const devScore = calculateBaseScore({ position: 'Developer' });

      expect(ctoScore).toBeGreaterThan(devScore);
      expect(ctoScore).toBe(70); // 50 + 20
      expect(devScore).toBe(55); // 50 + 5
    });

    it('should add points for detailed notes', () => {
      const withNotes = calculateBaseScore({
        notes: 'This is a very detailed note about the lead that exceeds 50 characters',
      });
      const withoutNotes = calculateBaseScore({});

      expect(withNotes).toBeGreaterThan(withoutNotes);
      expect(withNotes).toBe(60); // 50 + 10
    });

    it('should cap score at 100', () => {
      const score = calculateBaseScore({
        company: 'TechCorp',
        industry: 'technology',
        position: 'CEO',
        notes: 'Very long detailed notes about this hot lead and their requirements',
      });

      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle null values', () => {
      const score = calculateBaseScore({
        company: null,
        industry: null,
        position: null,
        notes: null,
      });

      expect(score).toBe(50);
    });
  });
});

describe('LeadScore Schema', () => {
  describe('validation', () => {
    it('should accept valid score object', () => {
      const validScore = {
        score: 75,
        confidence: 'medium' as const,
        reasoning: 'Good potential lead',
        recommendedActions: ['Action 1', 'Action 2'],
        priority: 'medium' as const,
      };

      expect(() => LeadScoreSchema.parse(validScore)).not.toThrow();
    });

    it('should reject score below 0', () => {
      const invalidScore = {
        score: -10,
        confidence: 'low',
        reasoning: 'Test',
        recommendedActions: [],
        priority: 'low',
      };

      expect(() => LeadScoreSchema.parse(invalidScore)).toThrow();
    });

    it('should reject score above 100', () => {
      const invalidScore = {
        score: 150,
        confidence: 'high',
        reasoning: 'Test',
        recommendedActions: [],
        priority: 'high',
      };

      expect(() => LeadScoreSchema.parse(invalidScore)).toThrow();
    });

    it('should require all fields', () => {
      const missingFields = {
        score: 50,
      };

      expect(() => LeadScoreSchema.parse(missingFields)).toThrow();
    });

    it('should accept empty recommendedActions array', () => {
      const score = {
        score: 50,
        confidence: 'low' as const,
        reasoning: 'No actions needed',
        recommendedActions: [],
        priority: 'low' as const,
      };

      expect(() => LeadScoreSchema.parse(score)).not.toThrow();
    });
  });

  describe('confidence levels', () => {
    it.each(['low', 'medium', 'high'])('should accept %s confidence', (conf) => {
      const score = {
        score: 50,
        confidence: conf,
        reasoning: 'Test',
        recommendedActions: [],
        priority: 'low',
      };

      expect(() => LeadScoreSchema.parse(score)).not.toThrow();
    });
  });

  describe('priority levels', () => {
    it.each(['low', 'medium', 'high', 'urgent'])('should accept %s priority', (priority) => {
      const score = {
        score: 50,
        confidence: 'medium',
        reasoning: 'Test',
        recommendedActions: [],
        priority,
      };

      expect(() => LeadScoreSchema.parse(score)).not.toThrow();
    });
  });
});

describe('Score Business Logic', () => {
  it('should give high score to enterprise tech company with CTO', () => {
    const score = calculateBaseScore({
      company: 'Enterprise Tech Inc',
      industry: 'technology',
      position: 'CTO',
      notes: 'Very interested in our enterprise solution. Budget approved for Q1.',
    });

    expect(score).toBeGreaterThan(80);
  });

  it('should give medium score to mid-market company', () => {
    const score = calculateBaseScore({
      company: 'MidSize Corp',
      industry: 'manufacturing',
      position: 'Manager',
    });

    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(80);
  });

  it('should give lower score to incomplete leads', () => {
    const incompleteScore = calculateBaseScore({});
    const completeScore = calculateBaseScore({
      company: 'Tech',
      industry: 'technology',
      position: 'CTO',
      notes: 'Long detailed notes about the lead and their requirements',
    });

    expect(incompleteScore).toBeLessThan(completeScore);
  });
});
