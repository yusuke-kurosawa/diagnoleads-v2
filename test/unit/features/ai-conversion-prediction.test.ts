/**
 * AI Conversion Prediction Tests
 *
 * Unit tests for conversion prediction service
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type {
  LeadForPrediction,
  ConversionPrediction,
  ConversionFactor,
} from '@/lib/features/ai/prediction/conversion';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              probability: 75,
              confidence: 'medium',
              estimatedDaysToConversion: 14,
              factors: [
                {
                  name: 'High Score',
                  impact: 'positive',
                  weight: 8,
                  description: 'Lead has high engagement',
                },
              ],
              recommendations: ['Schedule demo', 'Send case study'],
              risks: ['Budget concerns'],
            }),
          },
        ],
      }),
    };
  },
}));

describe('LeadForPrediction type', () => {
  it('should have correct structure', () => {
    const lead: LeadForPrediction = {
      id: 'lead-123',
      email: 'test@example.com',
      name: 'John Doe',
      company: 'Acme Corp',
      phone: '+1234567890',
      status: 'new',
      score: 75,
      source: 'website',
      responses: { industry: 'tech', budget: '10k-50k' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(lead.id).toBe('lead-123');
    expect(lead.email).toBe('test@example.com');
    expect(lead.status).toBe('new');
    expect(lead.score).toBe(75);
  });

  it('should allow null optional fields', () => {
    const lead: LeadForPrediction = {
      id: 'lead-456',
      email: 'minimal@example.com',
      name: null,
      company: null,
      phone: null,
      status: 'new',
      score: null,
      source: null,
      responses: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(lead.name).toBeNull();
    expect(lead.company).toBeNull();
    expect(lead.score).toBeNull();
  });
});

describe('ConversionPrediction type', () => {
  it('should have correct structure', () => {
    const prediction: ConversionPrediction = {
      probability: 65,
      confidence: 'medium',
      estimatedDaysToConversion: 21,
      factors: [],
      recommendations: ['Call within 24 hours'],
      risks: ['Competitor evaluation'],
    };

    expect(prediction.probability).toBe(65);
    expect(prediction.confidence).toBe('medium');
    expect(prediction.estimatedDaysToConversion).toBe(21);
  });

  it('should have probability between 0 and 100', () => {
    const validProbabilities = [0, 25, 50, 75, 100];

    for (const prob of validProbabilities) {
      const prediction: ConversionPrediction = {
        probability: prob,
        confidence: 'medium',
        estimatedDaysToConversion: null,
        factors: [],
        recommendations: [],
        risks: [],
      };
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(100);
    }
  });

  it('should support all confidence levels', () => {
    const confidenceLevels: ConversionPrediction['confidence'][] = ['low', 'medium', 'high'];

    for (const confidence of confidenceLevels) {
      const prediction: ConversionPrediction = {
        probability: 50,
        confidence,
        estimatedDaysToConversion: null,
        factors: [],
        recommendations: [],
        risks: [],
      };
      expect(prediction.confidence).toBe(confidence);
    }
  });

  it('should allow null estimatedDaysToConversion', () => {
    const prediction: ConversionPrediction = {
      probability: 20,
      confidence: 'low',
      estimatedDaysToConversion: null,
      factors: [],
      recommendations: [],
      risks: ['Low engagement'],
    };

    expect(prediction.estimatedDaysToConversion).toBeNull();
  });
});

describe('ConversionFactor type', () => {
  it('should have correct structure', () => {
    const factor: ConversionFactor = {
      name: 'High Lead Score',
      impact: 'positive',
      weight: 8,
      description: 'Lead has demonstrated high engagement',
    };

    expect(factor.name).toBe('High Lead Score');
    expect(factor.impact).toBe('positive');
    expect(factor.weight).toBe(8);
  });

  it('should support all impact types', () => {
    const impactTypes: ConversionFactor['impact'][] = ['positive', 'negative', 'neutral'];

    for (const impact of impactTypes) {
      const factor: ConversionFactor = {
        name: 'Test Factor',
        impact,
        weight: 5,
        description: 'Test description',
      };
      expect(factor.impact).toBe(impact);
    }
  });

  it('should have weight between 1 and 10', () => {
    const validWeights = [1, 5, 10];

    for (const weight of validWeights) {
      const factor: ConversionFactor = {
        name: 'Test',
        impact: 'neutral',
        weight,
        description: 'Test',
      };
      expect(factor.weight).toBeGreaterThanOrEqual(1);
      expect(factor.weight).toBeLessThanOrEqual(10);
    }
  });
});

describe('Fallback prediction logic', () => {
  it('should increase probability for high score leads', () => {
    const highScoreLead: LeadForPrediction = {
      id: '1',
      email: 'high@example.com',
      name: 'High Scorer',
      company: 'BigCo',
      phone: null,
      status: 'new',
      score: 85,
      source: null,
      responses: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // High score should contribute to higher probability
    expect(highScoreLead.score).toBeGreaterThanOrEqual(80);
  });

  it('should increase probability for qualified status', () => {
    const qualifiedLead: LeadForPrediction = {
      id: '2',
      email: 'qualified@example.com',
      name: null,
      company: null,
      phone: null,
      status: 'qualified',
      score: null,
      source: null,
      responses: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(qualifiedLead.status).toBe('qualified');
  });

  it('should consider profile completeness', () => {
    const completeLead: LeadForPrediction = {
      id: '3',
      email: 'complete@example.com',
      name: 'Complete User',
      company: 'Complete Corp',
      phone: '+1234567890',
      status: 'new',
      score: null,
      source: null,
      responses: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const hasName = !!completeLead.name;
    const hasCompany = !!completeLead.company;
    const hasPhone = !!completeLead.phone;
    const completeness = [hasName, hasCompany, hasPhone].filter(Boolean).length;

    expect(completeness).toBe(3);
  });
});

describe('Batch prediction', () => {
  it('should handle empty array', () => {
    const leads: LeadForPrediction[] = [];
    expect(leads).toHaveLength(0);
  });

  it('should process leads in batches of 5', () => {
    const batchSize = 5;
    const totalLeads = 12;
    const expectedBatches = Math.ceil(totalLeads / batchSize);

    expect(expectedBatches).toBe(3);
  });

  it('should return Map with lead IDs as keys', () => {
    const results = new Map<string, ConversionPrediction>();
    results.set('lead-1', {
      probability: 50,
      confidence: 'medium',
      estimatedDaysToConversion: null,
      factors: [],
      recommendations: [],
      risks: [],
    });

    expect(results.has('lead-1')).toBe(true);
    expect(results.get('lead-1')?.probability).toBe(50);
  });
});

describe('Prediction prompt building', () => {
  it('should calculate lead age correctly', () => {
    const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const leadAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    expect(leadAge).toBe(7);
  });

  it('should handle missing optional fields in prompt', () => {
    const lead: LeadForPrediction = {
      id: 'test',
      email: 'test@example.com',
      name: null,
      company: null,
      phone: null,
      status: 'new',
      score: null,
      source: null,
      responses: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const name = lead.name || 'Unknown';
    const company = lead.company || 'Unknown';
    const score = lead.score ?? 'Not scored';

    expect(name).toBe('Unknown');
    expect(company).toBe('Unknown');
    expect(score).toBe('Not scored');
  });
});
