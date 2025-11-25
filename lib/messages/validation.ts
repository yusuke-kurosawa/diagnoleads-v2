/**
 * Zod Validation i18n Integration
 *
 * Zodバリデーションエラーメッセージの多言語化
 * locales/*/errors.jsonのvalidationセクションと連携
 */

import { z } from 'zod';

/**
 * フィールド名の翻訳マッピング
 */
export const fieldNameMap: Record<string, string> = {
  // Lead fields
  name: 'leads.name',
  email: 'leads.email',
  phone: 'leads.phone',
  company: 'leads.company',
  position: 'leads.position',
  source: 'leads.source',
  status: 'leads.status',
  score: 'leads.score',
  notes: 'leads.notes',

  // Organization fields
  organizationName: 'organization.name',
  organizationSlug: 'organization.slug',
  organizationDomain: 'organization.domain',

  // Member fields
  memberEmail: 'member.email',
  memberRole: 'member.role',

  // Common fields
  title: 'common.title',
  description: 'common.description',
  url: 'common.url',
  password: 'common.password',
};

/**
 * カスタムZodエラーメッセージの型定義
 */
export interface ZodErrorParams {
  field?: string;
  min?: number;
  max?: number;
  [key: string]: string | number | undefined;
}

/**
 * Zodエラーメッセージのマッピング
 * next-intlのuseTranslations('errors')フックと組み合わせて使用
 */
export function getZodErrorMessage(
  issue: z.ZodIssue,
  t: (key: string, params?: Record<string, string | number>) => string,
  tFields?: (key: string) => string
): string {
  const fieldName = tFields && issue.path.length > 0
    ? tFields(fieldNameMap[String(issue.path[0])] || String(issue.path[0]))
    : String(issue.path[0] || 'field');

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string' && issue.received === 'undefined') {
        return t('validation.required', { field: fieldName });
      }
      return t('validation.invalid', { field: fieldName });

    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return t('validation.min', {
          field: fieldName,
          min: issue.minimum,
        });
      }
      if (issue.type === 'number') {
        return t('validation.minNumber', {
          field: fieldName,
          min: issue.minimum,
        });
      }
      return t('validation.invalid', { field: fieldName });

    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return t('validation.max', {
          field: fieldName,
          max: issue.maximum,
        });
      }
      if (issue.type === 'number') {
        return t('validation.maxNumber', {
          field: fieldName,
          max: issue.maximum,
        });
      }
      return t('validation.invalid', { field: fieldName });

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return t('validation.email');
      }
      if (issue.validation === 'url') {
        return t('validation.url');
      }
      if (issue.validation === 'regex') {
        return t('validation.pattern', { field: fieldName });
      }
      return t('validation.invalid', { field: fieldName });

    case z.ZodIssueCode.custom:
      // カスタムエラーメッセージがある場合はそれを使用
      if (issue.message) {
        return issue.message;
      }
      return t('validation.invalid', { field: fieldName });

    default:
      return t('validation.invalid', { field: fieldName });
  }
}

/**
 * Zodスキーマのエラーマップを作成
 *
 * 使用例:
 * ```tsx
 * import { useTranslations } from 'next-intl';
 * import { createZodErrorMap } from '@/lib/messages/validation';
 *
 * function MyForm() {
 *   const tErrors = useTranslations('errors');
 *   const tFields = useTranslations();
 *
 *   const schema = z.object({
 *     email: z.string().email(),
 *     name: z.string().min(2).max(100),
 *   });
 *
 *   // Zodのエラーマップを設定
 *   z.setErrorMap(createZodErrorMap(tErrors, tFields));
 *
 *   const { errors } = useForm({ resolver: zodResolver(schema) });
 * }
 * ```
 */
export function createZodErrorMap(
  t: (key: string, params?: Record<string, string | number>) => string,
  tFields?: (key: string) => string
): z.ZodErrorMap {
  return (issue, ctx) => {
    // デフォルトメッセージを使用する場合
    if (issue.message) {
      return { message: issue.message };
    }

    // カスタムi18nメッセージを使用
    return {
      message: getZodErrorMessage(issue, t, tFields),
    };
  };
}

/**
 * React Hook FormとZodの統合用ヘルパー
 *
 * 使用例:
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { useTranslations } from 'next-intl';
 * import { useZodForm } from '@/lib/messages/validation';
 *
 * function MyForm() {
 *   const tErrors = useTranslations('errors');
 *   const schema = z.object({ email: z.string().email() });
 *
 *   const form = useZodForm(schema, tErrors);
 * }
 * ```
 */
export function formatZodErrors(
  errors: z.ZodError,
  t: (key: string, params?: Record<string, string | number>) => string,
  tFields?: (key: string) => string
): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  errors.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = getZodErrorMessage(issue, t, tFields);
    }
  });

  return formattedErrors;
}
