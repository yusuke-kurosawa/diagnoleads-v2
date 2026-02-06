/**
 * Diagnostic Scoring Tests
 *
 * Unit tests for lead scoring logic used in diagnostic form submissions
 */

import { describe, expect, it } from 'vitest';

// Score calculation logic extracted from app/api/diagnostic/route.ts
function calculateScore(data: {
  industry: string;
  employeeCount: string;
  timeline: string;
  budget: string;
  phone?: string;
  position?: string;
  additionalInfo?: string;
}): number {
  let score = 50; // Base score

  // Industry scoring
  const industryScores: Record<string, number> = {
    technology: 15,
    finance: 12,
    healthcare: 10,
    manufacturing: 8,
    retail: 8,
    other: 5,
  };
  score += industryScores[data.industry] || 5;

  // Employee count scoring
  const employeeScores: Record<string, number> = {
    '1-10': 5,
    '11-50': 8,
    '51-200': 12,
    '201-500': 15,
    '501-1000': 18,
    '1000+': 20,
  };
  score += employeeScores[data.employeeCount] || 5;

  // Timeline scoring (urgency)
  const timelineScores: Record<string, number> = {
    immediate: 15,
    '1-3months': 12,
    '3-6months': 8,
    '6months+': 5,
  };
  score += timelineScores[data.timeline] || 5;

  // Budget scoring
  const budgetScores: Record<string, number> = {
    under10k: 5,
    '10k-50k': 10,
    '50k-100k': 15,
    '100k+': 20,
  };
  score += budgetScores[data.budget] || 5;

  // Bonus for complete profile
  if (data.phone) score += 2;
  if (data.position) score += 2;
  if (data.additionalInfo && data.additionalInfo.length > 50) score += 3;

  // Cap at 100
  return Math.min(score, 100);
}

describe('calculateScore', () => {
  describe('base score', () => {
    it('should start with base score of 50', () => {
      const score = calculateScore({
        industry: 'unknown',
        employeeCount: 'unknown',
        timeline: 'unknown',
        budget: 'unknown',
      });
      // 50 base + 5 (industry default) + 5 (employee default) + 5 (timeline default) + 5 (budget default) = 70
      expect(score).toBe(70);
    });
  });

  describe('industry scoring', () => {
    it('should give highest score to technology', () => {
      const techScore = calculateScore({
        industry: 'technology',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      const otherScore = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(techScore).toBeGreaterThan(otherScore);
      expect(techScore - otherScore).toBe(10); // 15 - 5
    });

    it('should score finance second highest', () => {
      const financeScore = calculateScore({
        industry: 'finance',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(financeScore).toBe(50 + 12 + 5 + 5 + 5); // 77
    });

    it('should handle unknown industry with default', () => {
      const score = calculateScore({
        industry: 'unknown_industry',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(score).toBe(50 + 5 + 5 + 5 + 5); // 70
    });
  });

  describe('employee count scoring', () => {
    it('should give highest score to largest companies', () => {
      const largeScore = calculateScore({
        industry: 'other',
        employeeCount: '1000+',
        timeline: '6months+',
        budget: 'under10k',
      });
      const smallScore = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(largeScore).toBeGreaterThan(smallScore);
      expect(largeScore - smallScore).toBe(15); // 20 - 5
    });

    it('should scale progressively with company size', () => {
      const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
      const scores = sizes.map((size) =>
        calculateScore({
          industry: 'other',
          employeeCount: size,
          timeline: '6months+',
          budget: 'under10k',
        })
      );

      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1]);
      }
    });
  });

  describe('timeline scoring', () => {
    it('should give highest score to immediate needs', () => {
      const immediateScore = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: 'immediate',
        budget: 'under10k',
      });
      const laterScore = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(immediateScore).toBeGreaterThan(laterScore);
      expect(immediateScore - laterScore).toBe(10); // 15 - 5
    });

    it('should reflect urgency levels', () => {
      const timelines = ['6months+', '3-6months', '1-3months', 'immediate'];
      const scores = timelines.map((timeline) =>
        calculateScore({
          industry: 'other',
          employeeCount: '1-10',
          timeline,
          budget: 'under10k',
        })
      );

      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1]);
      }
    });
  });

  describe('budget scoring', () => {
    it('should give highest score to largest budgets', () => {
      const highBudgetScore = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: '100k+',
      });
      const lowBudgetScore = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(highBudgetScore).toBeGreaterThan(lowBudgetScore);
      expect(highBudgetScore - lowBudgetScore).toBe(15); // 20 - 5
    });
  });

  describe('profile completeness bonus', () => {
    it('should add bonus for phone number', () => {
      const withPhone = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
        phone: '03-1234-5678',
      });
      const withoutPhone = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(withPhone - withoutPhone).toBe(2);
    });

    it('should add bonus for position', () => {
      const withPosition = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
        position: 'CEO',
      });
      const withoutPosition = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(withPosition - withoutPosition).toBe(2);
    });

    it('should add bonus for detailed additional info', () => {
      const withDetails = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
        additionalInfo: 'a'.repeat(51),
      });
      const shortDetails = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
        additionalInfo: 'short',
      });
      expect(withDetails - shortDetails).toBe(3);
    });

    it('should not add bonus for short additional info', () => {
      const shortDetails = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
        additionalInfo: 'a'.repeat(50),
      });
      const noDetails = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      expect(shortDetails).toBe(noDetails);
    });
  });

  describe('score cap', () => {
    it('should cap score at 100', () => {
      const maxScore = calculateScore({
        industry: 'technology',
        employeeCount: '1000+',
        timeline: 'immediate',
        budget: '100k+',
        phone: '123',
        position: 'CEO',
        additionalInfo: 'a'.repeat(100),
      });
      expect(maxScore).toBe(100);
    });

    it('should calculate uncapped theoretical max', () => {
      // 50 + 15 + 20 + 15 + 20 + 2 + 2 + 3 = 127 (uncapped)
      // But should return 100
      const score = calculateScore({
        industry: 'technology',
        employeeCount: '1000+',
        timeline: 'immediate',
        budget: '100k+',
        phone: '123',
        position: 'CEO',
        additionalInfo: 'a'.repeat(100),
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('real-world scenarios', () => {
    it('should score enterprise tech lead highly', () => {
      const score = calculateScore({
        industry: 'technology',
        employeeCount: '501-1000',
        timeline: '1-3months',
        budget: '50k-100k',
        phone: '03-1234-5678',
        position: 'CTO',
        additionalInfo:
          'We are looking to modernize our lead management system and integrate with our existing CRM.',
      });
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it('should score small business lead moderately', () => {
      const score = calculateScore({
        industry: 'retail',
        employeeCount: '11-50',
        timeline: '3-6months',
        budget: '10k-50k',
      });
      // 50 + 8 + 8 + 8 + 10 = 84
      expect(score).toBe(84);
    });

    it('should score tire kicker low', () => {
      const score = calculateScore({
        industry: 'other',
        employeeCount: '1-10',
        timeline: '6months+',
        budget: 'under10k',
      });
      // 50 + 5 + 5 + 5 + 5 = 70
      expect(score).toBe(70);
    });
  });
});
