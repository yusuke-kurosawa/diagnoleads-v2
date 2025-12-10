/**
 * Diagnostic Form Types
 *
 * CMSから取得する診断フォームのアプリケーション側型定義
 * PayloadCMSのdiagnostic-formsコレクションに対応
 */

import type { LocalizedString, MediaAsset, ContentStatus } from './types';

// =============================================================================
// Question Types
// =============================================================================

export type DiagnosticQuestionType =
  | 'single'
  | 'multiple'
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'scale'
  | 'textarea';

export interface DiagnosticQuestionOption {
  label: LocalizedString;
  value: string;
  score: number;
}

export interface DiagnosticQuestion {
  id: string;
  questionText: LocalizedString;
  questionType: DiagnosticQuestionType;
  fieldName: string;
  required: boolean;
  showIcon?: boolean;
  placeholder?: LocalizedString;
  options?: DiagnosticQuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
}

// =============================================================================
// Step Types
// =============================================================================

export interface DiagnosticStep {
  id: string;
  title: LocalizedString;
  description?: LocalizedString;
  icon?: string;
  questions: DiagnosticQuestion[];
}

// =============================================================================
// Scoring Types
// =============================================================================

export type ThresholdColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue';
export type ThresholdPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ScoringThreshold {
  minScore: number;
  maxScore: number;
  color?: ThresholdColor;
  priority?: ThresholdPriority;
  label: LocalizedString;
  description?: LocalizedString;
  recommendations?: { text: LocalizedString }[];
}

export interface DiagnosticScoring {
  enabled: boolean;
  maxScore?: number;
  thresholds?: ScoringThreshold[];
}

// =============================================================================
// Settings Types
// =============================================================================

export interface DiagnosticSettings {
  showProgressBar: boolean;
  allowSkip: boolean;
  sendEmailNotification: boolean;
  saveAsLead: boolean;
  redirectUrl?: string;
  thankYouMessage?: LocalizedString;
}

// =============================================================================
// SEO Types
// =============================================================================

export interface DiagnosticSEO {
  metaTitle?: LocalizedString;
  metaDescription?: LocalizedString;
  ogImage?: MediaAsset;
}

// =============================================================================
// Main Diagnostic Form Type
// =============================================================================

export interface DiagnosticForm {
  id: string;
  title: LocalizedString;
  slug: string;
  description?: LocalizedString;
  coverImage?: MediaAsset;
  status: ContentStatus;
  steps: DiagnosticStep[];
  scoring: DiagnosticScoring;
  settings: DiagnosticSettings;
  seo: DiagnosticSEO;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Submission Types
// =============================================================================

export interface DiagnosticSubmission {
  formId: string;
  formSlug: string;
  answers: Record<string, string | string[] | number>;
  score?: number;
  maxScore?: number;
  percentage?: number;
  thresholdResult?: ScoringThreshold;
  locale: string;
  submittedAt: Date;
}

// =============================================================================
// Score Calculation Result
// =============================================================================

export interface ScoreCalculationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  threshold: ScoringThreshold | null;
}
