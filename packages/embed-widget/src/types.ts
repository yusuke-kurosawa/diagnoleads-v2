/**
 * Widget configuration options
 */
export interface DiagnoLeadsWidgetConfig {
  apiKey: string;
  apiUrl?: string;
  templateId?: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  containerId?: string;
  onLoad?: () => void;
  onSubmit?: (data: LeadSubmissionData) => void;
  onError?: (error: WidgetError) => void;
  onComplete?: (result: DiagnosticResult) => void;
}

/**
 * Diagnostic template structure from API
 */
export interface DiagnosticTemplate {
  id: string;
  title: string;
  description?: string;
  steps: DiagnosticStep[];
  theme?: ThemeConfig;
  csrfToken: string;
}

export interface DiagnosticStep {
  id: string;
  title: string;
  description?: string;
  questions: DiagnosticQuestion[];
  order: number;
}

export interface DiagnosticQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  order: number;
}

export type QuestionType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
}

/**
 * Lead submission data
 */
export interface LeadSubmissionData {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  responses: Record<string, unknown>;
  csrfToken: string;
}

/**
 * Diagnostic result
 */
export interface DiagnosticResult {
  success: boolean;
  message: string;
  leadId?: string;
  score?: number;
}

/**
 * Widget error
 */
export interface WidgetError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Widget state
 */
export type WidgetState = 'loading' | 'ready' | 'submitting' | 'complete' | 'error';
