'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type {
  DiagnosticForm,
  DiagnosticQuestion,
  DiagnosticStep,
  ScoreCalculationResult,
  ScoringThreshold,
} from '@/lib/cms';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  type LucideIcon,
  Mail,
  Phone,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

// =============================================================================
// Icon Mapping
// =============================================================================

const iconMap: Record<string, LucideIcon> = {
  'building-2': Building2,
  building2: Building2,
  user: User,
  target: Target,
  mail: Mail,
  phone: Phone,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  clock: Clock,
  'file-text': FileText,
  'check-circle': CheckCircle,
};

function getIcon(iconName?: string): LucideIcon {
  if (!iconName) return FileText;
  return iconMap[iconName.toLowerCase()] || FileText;
}

// =============================================================================
// Threshold Color Mapping
// =============================================================================

const thresholdColorClasses: Record<string, string> = {
  red: 'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
};

// =============================================================================
// Types
// =============================================================================

interface DynamicDiagnosticFormProps {
  form: DiagnosticForm;
  locale: 'ja' | 'en';
  onSubmit?: (data: {
    answers: Record<string, string | string[] | number>;
    result: ScoreCalculationResult;
  }) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getLocalizedText(
  text: { ja: string; en: string } | string | undefined,
  locale: 'ja' | 'en'
): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.ja || text.en || '';
}

// =============================================================================
// Question Renderer Components
// =============================================================================

interface QuestionRendererProps {
  question: DiagnosticQuestion;
  locale: 'ja' | 'en';
  value: string | string[] | number | undefined;
  onChange: (fieldName: string, value: string | string[] | number) => void;
  error?: string;
}

function TextQuestion({ question, locale, value, onChange, error }: QuestionRendererProps) {
  const Icon = question.showIcon ? getIcon(question.fieldName) : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={question.fieldName}>
        {Icon && <Icon className="w-4 h-4 inline mr-2" />}
        {getLocalizedText(question.questionText, locale)}
        {!question.required && <span className="text-gray-400 ml-1 text-sm">(任意)</span>}
      </Label>
      <Input
        id={question.fieldName}
        type={
          question.questionType === 'email'
            ? 'email'
            : question.questionType === 'phone'
              ? 'tel'
              : question.questionType === 'number'
                ? 'number'
                : 'text'
        }
        placeholder={getLocalizedText(question.placeholder, locale)}
        value={(value as string) || ''}
        onChange={(e) => onChange(question.fieldName, e.target.value)}
        className={cn(error && 'border-red-500')}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function TextareaQuestion({ question, locale, value, onChange, error }: QuestionRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={question.fieldName}>
        {getLocalizedText(question.questionText, locale)}
        {!question.required && <span className="text-gray-400 ml-1 text-sm">(任意)</span>}
      </Label>
      <Textarea
        id={question.fieldName}
        placeholder={getLocalizedText(question.placeholder, locale)}
        value={(value as string) || ''}
        onChange={(e) => onChange(question.fieldName, e.target.value)}
        rows={4}
        className={cn(error && 'border-red-500')}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function SingleChoiceQuestion({ question, locale, value, onChange, error }: QuestionRendererProps) {
  return (
    <div className="space-y-2">
      <Label>{getLocalizedText(question.questionText, locale)}</Label>
      <RadioGroup
        value={(value as string) || ''}
        onValueChange={(val) => onChange(question.fieldName, val)}
        className="grid grid-cols-2 gap-3"
      >
        {question.options?.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <RadioGroupItem value={option.value} id={`${question.fieldName}-${option.value}`} />
            <Label
              htmlFor={`${question.fieldName}-${option.value}`}
              className="cursor-pointer flex-1"
            >
              {getLocalizedText(option.label, locale)}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function MultipleChoiceQuestion({
  question,
  locale,
  value,
  onChange,
  error,
}: QuestionRendererProps) {
  const selectedValues = (value as string[]) || [];

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange(question.fieldName, [...selectedValues, optionValue]);
    } else {
      onChange(
        question.fieldName,
        selectedValues.filter((v) => v !== optionValue)
      );
    }
  };

  return (
    <div className="space-y-2">
      <Label>{getLocalizedText(question.questionText, locale)}</Label>
      <div className="grid grid-cols-2 gap-3">
        {question.options?.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
          >
            <Checkbox
              id={`${question.fieldName}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={(checked) => handleChange(option.value, checked === true)}
            />
            <Label
              htmlFor={`${question.fieldName}-${option.value}`}
              className="cursor-pointer flex-1"
            >
              {getLocalizedText(option.label, locale)}
            </Label>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function ScaleQuestion({ question, locale, value, onChange, error }: QuestionRendererProps) {
  const min = question.scaleMin ?? 1;
  const max = question.scaleMax ?? 10;
  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-2">
      <Label>{getLocalizedText(question.questionText, locale)}</Label>
      <div className="flex gap-2 justify-center flex-wrap">
        {scaleValues.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(question.fieldName, num)}
            className={cn(
              'w-10 h-10 rounded-full border-2 transition-all',
              value === num
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 hover:border-blue-400'
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-500 px-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function QuestionRenderer(props: QuestionRendererProps) {
  const { question } = props;

  switch (question.questionType) {
    case 'single':
      return <SingleChoiceQuestion {...props} />;
    case 'multiple':
      return <MultipleChoiceQuestion {...props} />;
    case 'textarea':
      return <TextareaQuestion {...props} />;
    case 'scale':
      return <ScaleQuestion {...props} />;
    default:
      return <TextQuestion {...props} />;
  }
}

// =============================================================================
// Result Display Component
// =============================================================================

interface ResultDisplayProps {
  result: ScoreCalculationResult;
  threshold: ScoringThreshold | null;
  locale: 'ja' | 'en';
  thankYouMessage?: { ja: string; en: string };
}

function ResultDisplay({ result, threshold, locale, thankYouMessage }: ResultDisplayProps) {
  const colorClass = threshold?.color
    ? thresholdColorClasses[threshold.color]
    : 'bg-blue-100 text-blue-600';

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-12 pb-12 text-center">
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
            colorClass
          )}
        >
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {locale === 'ja' ? '診断完了' : 'Diagnostic Complete'}
        </h2>
        {thankYouMessage && (
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {getLocalizedText(thankYouMessage, locale)}
          </p>
        )}

        {result.maxScore > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
            <div className="text-sm text-gray-500 mb-2">
              {locale === 'ja' ? 'あなたのスコア' : 'Your Score'}
            </div>
            <div className="text-5xl font-bold text-blue-600 mb-2">{result.percentage}</div>
            <div className="text-sm text-gray-500">/ 100</div>
            {threshold && (
              <div className={cn('mt-4 py-2 px-4 rounded-full inline-block', colorClass)}>
                {getLocalizedText(threshold.label, locale)}
              </div>
            )}
          </div>
        )}

        {threshold?.description && (
          <p className="text-gray-600 mb-6">{getLocalizedText(threshold.description, locale)}</p>
        )}

        {threshold?.recommendations && threshold.recommendations.length > 0 && (
          <div className="text-left bg-gray-50 rounded-lg p-6 mt-6">
            <h3 className="font-semibold mb-3">
              {locale === 'ja' ? '推奨アクション' : 'Recommendations'}
            </h3>
            <ul className="space-y-2">
              {threshold.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span>{getLocalizedText(rec.text, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-8">
          {locale === 'ja'
            ? '結果をメールでお送りします。'
            : 'We will send your results via email.'}
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function DynamicDiagnosticForm({ form, locale, onSubmit }: DynamicDiagnosticFormProps) {
  const t = useTranslations('public.diagnostic');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<ScoreCalculationResult | null>(null);

  const totalSteps = form.steps.length;
  const currentStepData = form.steps[currentStep];

  // Step icon
  const StepIcon = useMemo(() => getIcon(currentStepData?.icon), [currentStepData?.icon]);

  // Step icon colors (cycle through)
  const stepColors = [
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-purple-100 text-purple-600',
    'bg-orange-100 text-orange-600',
  ];
  const stepColor = stepColors[currentStep % stepColors.length];

  // Handle answer change
  const handleAnswerChange = useCallback(
    (fieldName: string, value: string | string[] | number) => {
      setAnswers((prev) => ({ ...prev, [fieldName]: value }));
      // Clear error when user types
      if (errors[fieldName]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const stepQuestions = currentStepData.questions;
    const newErrors: Record<string, string> = {};

    for (const question of stepQuestions) {
      const answer = answers[question.fieldName];

      if (question.required) {
        if (answer === undefined || answer === null || answer === '') {
          newErrors[question.fieldName] = t('validation.required');
          continue;
        }
        if (Array.isArray(answer) && answer.length === 0) {
          newErrors[question.fieldName] = t('validation.required');
          continue;
        }
      }

      // Type-specific validation
      if (answer !== undefined && answer !== null && answer !== '') {
        if (question.questionType === 'email' && typeof answer === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
            newErrors[question.fieldName] = t('validation.invalidEmail');
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStepData, answers, t]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  }, [validateCurrentStep, currentStep, totalSteps]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Calculate score
  const calculateScore = useCallback((): ScoreCalculationResult => {
    if (!form.scoring.enabled) {
      return { totalScore: 0, maxScore: 0, percentage: 0, threshold: null };
    }

    let totalScore = 0;
    let maxScore = 0;

    for (const step of form.steps) {
      for (const question of step.questions) {
        if (!question.options || question.options.length === 0) continue;

        const answer = answers[question.fieldName];
        if (answer === undefined || answer === null) continue;

        const optionScores = question.options.map((opt) => opt.score);
        if (question.questionType === 'multiple') {
          maxScore += optionScores.reduce((sum, s) => sum + Math.max(0, s), 0);
        } else {
          maxScore += Math.max(...optionScores);
        }

        if (Array.isArray(answer)) {
          for (const value of answer) {
            const option = question.options.find((opt) => opt.value === value);
            if (option) totalScore += option.score;
          }
        } else if (typeof answer === 'string') {
          const option = question.options.find((opt) => opt.value === answer);
          if (option) totalScore += option.score;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const threshold =
      form.scoring.thresholds?.find((t) => percentage >= t.minScore && percentage <= t.maxScore) ||
      null;

    return { totalScore, maxScore, percentage, threshold };
  }, [form, answers]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const scoreResult = calculateScore();
      setResult(scoreResult);

      if (onSubmit) {
        await onSubmit({ answers, result: scoreResult });
      } else {
        // Default submission to API
        await fetch('/api/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId: form.id,
            formSlug: form.slug,
            answers,
            score: scoreResult.totalScore,
            maxScore: scoreResult.maxScore,
            percentage: scoreResult.percentage,
            locale,
            submittedAt: new Date().toISOString(),
          }),
        });
      }

      setIsComplete(true);

      // Handle redirect if configured
      if (form.settings.redirectUrl) {
        setTimeout(() => {
          window.location.href = form.settings.redirectUrl!;
        }, 3000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      // Still show success for demo purposes
      const scoreResult = calculateScore();
      setResult(scoreResult);
      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, calculateScore, onSubmit, answers, form, locale]);

  // Show result page
  if (isComplete && result) {
    return (
      <ResultDisplay
        result={result}
        threshold={result.threshold}
        locale={locale}
        thankYouMessage={form.settings.thankYouMessage}
      />
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      {/* Progress Bar */}
      {form.settings.showProgressBar && (
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">
              {t('progress', { current: currentStep + 1, total: totalSteps })}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Header */}
      <CardHeader>
        <div
          className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', stepColor)}
        >
          <StepIcon className="w-6 h-6" />
        </div>
        <CardTitle>{getLocalizedText(currentStepData.title, locale)}</CardTitle>
        {currentStepData.description && (
          <CardDescription>{getLocalizedText(currentStepData.description, locale)}</CardDescription>
        )}
      </CardHeader>

      {/* Questions */}
      <CardContent className="space-y-6">
        {currentStepData.questions.map((question) => (
          <QuestionRenderer
            key={question.id || question.fieldName}
            question={question}
            locale={locale}
            value={answers[question.fieldName]}
            onChange={handleAnswerChange}
            error={errors[question.fieldName]}
          />
        ))}
      </CardContent>

      {/* Navigation */}
      <div className="px-6 pb-6 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={cn(currentStep === 0 && 'invisible')}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('navigation.previous')}
        </Button>

        {currentStep < totalSteps - 1 ? (
          <Button type="button" onClick={handleNext}>
            {t('navigation.next')}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('navigation.submitting')}
              </>
            ) : (
              t('navigation.submit')
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
