/**
 * Diagnostic Form Repository
 *
 * 診断フォームのデータアクセスを抽象化
 * CMS実装に依存しないインターフェースを提供
 * キャッシュ機能付き
 */

import { unstable_cache } from 'next/cache';
import { getCMSAdapter } from '../adapters/factory';
import {
  CMS_CACHE_CONFIG,
  getCollectionTag,
  getDocumentTag,
  getSlugTag,
  invalidateBySlug,
  invalidateCollection,
  invalidateDocument,
} from '../core/cache';
import type {
  DiagnosticForm,
  DiagnosticSubmission,
  ScoreCalculationResult,
} from '../core/diagnostic-form.types';
import type { CMSAdapter, WhereCondition, WhereOperator } from '../core/interfaces';
import type { ContentStatus } from '../core/types';

export interface FindDiagnosticFormsOptions {
  status?: ContentStatus | 'all';
  limit?: number;
  offset?: number;
}

export interface DiagnosticFormsResult {
  forms: DiagnosticForm[];
  total: number;
}

const COLLECTION = 'diagnostic-forms';
const REVALIDATE = CMS_CACHE_CONFIG.collections[COLLECTION] || CMS_CACHE_CONFIG.defaultRevalidate;

export class DiagnosticFormRepository {
  private adapter: CMSAdapter;

  constructor(adapter?: CMSAdapter) {
    this.adapter = adapter || getCMSAdapter();
  }

  /**
   * 診断フォーム一覧を取得（キャッシュなし - 管理画面用）
   */
  async findAll(options: FindDiagnosticFormsOptions = {}): Promise<DiagnosticFormsResult> {
    const { status = 'published', limit = 50, offset = 0 } = options;

    const where: WhereCondition = {};

    if (status !== 'all') {
      where.status = { equals: status } as WhereOperator;
    }

    const { data, meta } = await this.adapter.find<DiagnosticForm>({
      collection: COLLECTION,
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      offset,
      sort: [{ field: 'updatedAt', order: 'desc' }],
      status: status === 'all' ? 'all' : status === 'archived' ? 'draft' : status,
    });

    return {
      forms: data,
      total: meta?.total || 0,
    };
  }

  /**
   * 診断フォーム一覧を取得（キャッシュ付き - 公開ページ用）
   */
  async findAllCached(options: FindDiagnosticFormsOptions = {}): Promise<DiagnosticFormsResult> {
    const cacheKey = `findAll:${JSON.stringify(options)}`;

    const cached = unstable_cache(
      async () => this.findAll(options),
      [`cms:${COLLECTION}:${cacheKey}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION)],
      }
    );

    return cached();
  }

  /**
   * スラッグで診断フォームを取得（キャッシュなし）
   */
  async findBySlug(slug: string): Promise<DiagnosticForm | null> {
    const { data } = await this.adapter.findBySlug<DiagnosticForm>({
      collection: COLLECTION,
      slug,
    });

    return data;
  }

  /**
   * スラッグで診断フォームを取得（キャッシュ付き - 公開ページ用）
   */
  async findBySlugCached(slug: string): Promise<DiagnosticForm | null> {
    const cached = unstable_cache(
      async () => this.findBySlug(slug),
      [`cms:${COLLECTION}:slug:${slug}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION), getSlugTag(COLLECTION, slug)],
      }
    );

    return cached();
  }

  /**
   * IDで診断フォームを取得（キャッシュなし）
   */
  async findById(id: string): Promise<DiagnosticForm | null> {
    const { data } = await this.adapter.findById<DiagnosticForm>({
      collection: COLLECTION,
      id,
    });

    return data;
  }

  /**
   * IDで診断フォームを取得（キャッシュ付き）
   */
  async findByIdCached(id: string): Promise<DiagnosticForm | null> {
    const cached = unstable_cache(async () => this.findById(id), [`cms:${COLLECTION}:id:${id}`], {
      revalidate: REVALIDATE,
      tags: [getCollectionTag(COLLECTION), getDocumentTag(COLLECTION, id)],
    });

    return cached();
  }

  /**
   * 公開中の診断フォームを取得（キャッシュ付き）
   */
  async findPublished(): Promise<DiagnosticForm[]> {
    const { forms } = await this.findAllCached({
      status: 'published',
      limit: 100,
    });

    return forms;
  }

  /**
   * 診断フォームを作成
   */
  async create(
    form: Omit<DiagnosticForm, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DiagnosticForm> {
    const { data } = await this.adapter.create<DiagnosticForm>({
      collection: COLLECTION,
      data: form,
    });

    // キャッシュを無効化
    await invalidateCollection(COLLECTION);

    return data;
  }

  /**
   * 診断フォームを更新
   */
  async update(
    id: string,
    updates: Partial<Omit<DiagnosticForm, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DiagnosticForm> {
    // 既存のスラッグを取得（キャッシュ無効化用）
    const existing = await this.findById(id);

    const { data } = await this.adapter.update<DiagnosticForm>({
      collection: COLLECTION,
      id,
      data: updates,
    });

    // キャッシュを無効化
    await invalidateDocument(COLLECTION, id);
    if (existing?.slug) {
      await invalidateBySlug(COLLECTION, existing.slug);
    }
    if (data.slug && data.slug !== existing?.slug) {
      await invalidateBySlug(COLLECTION, data.slug);
    }

    return data;
  }

  /**
   * 診断フォームを削除
   */
  async delete(id: string): Promise<void> {
    // 既存のスラッグを取得（キャッシュ無効化用）
    const existing = await this.findById(id);

    await this.adapter.delete({
      collection: COLLECTION,
      id,
    });

    // キャッシュを無効化
    await invalidateDocument(COLLECTION, id);
    if (existing?.slug) {
      await invalidateBySlug(COLLECTION, existing.slug);
    }
    await invalidateCollection(COLLECTION);
  }

  /**
   * 診断フォームを公開
   */
  async publish(id: string): Promise<DiagnosticForm> {
    return this.update(id, { status: 'published' });
  }

  /**
   * 診断フォームを非公開
   */
  async unpublish(id: string): Promise<DiagnosticForm> {
    return this.update(id, { status: 'draft' });
  }

  /**
   * 診断フォームを複製
   */
  async duplicate(id: string, newTitle: { ja: string; en: string }): Promise<DiagnosticForm> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Form not found');
    }

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = original;

    return this.create({
      ...rest,
      title: newTitle,
      slug: `${original.slug}-copy-${Date.now()}`,
      status: 'draft',
    });
  }

  /**
   * スコアを計算
   */
  calculateScore(
    form: DiagnosticForm,
    answers: Record<string, string | string[] | number>
  ): ScoreCalculationResult {
    if (!form.scoring.enabled) {
      return {
        totalScore: 0,
        maxScore: 0,
        percentage: 0,
        threshold: null,
      };
    }

    let totalScore = 0;
    let maxScore = 0;

    // 各ステップの各質問を処理
    for (const step of form.steps) {
      for (const question of step.questions) {
        // スコア対象は選択式のみ
        if (!question.options || question.options.length === 0) {
          continue;
        }

        const answer = answers[question.fieldName];
        if (answer === undefined || answer === null) {
          continue;
        }

        // 最大スコアを計算
        const optionScores = question.options.map((opt) => opt.score);
        if (question.questionType === 'multiple') {
          // 複数選択の場合は全オプションのスコア合計が最大
          maxScore += optionScores.reduce((sum, s) => sum + Math.max(0, s), 0);
        } else {
          // 単一選択の場合は最高スコアが最大
          maxScore += Math.max(...optionScores);
        }

        // 回答のスコアを計算
        if (Array.isArray(answer)) {
          // 複数選択
          for (const value of answer) {
            const option = question.options.find((opt) => opt.value === value);
            if (option) {
              totalScore += option.score;
            }
          }
        } else if (typeof answer === 'string') {
          // 単一選択
          const option = question.options.find((opt) => opt.value === answer);
          if (option) {
            totalScore += option.score;
          }
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // 該当するしきい値を取得
    const threshold =
      form.scoring.thresholds?.find((t) => percentage >= t.minScore && percentage <= t.maxScore) ||
      null;

    return {
      totalScore,
      maxScore,
      percentage,
      threshold,
    };
  }

  /**
   * 回答をバリデート
   */
  validateAnswers(
    form: DiagnosticForm,
    answers: Record<string, string | string[] | number>
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const step of form.steps) {
      for (const question of step.questions) {
        const answer = answers[question.fieldName];

        // 必須チェック
        if (question.required) {
          if (answer === undefined || answer === null || answer === '') {
            errors[question.fieldName] = 'required';
            continue;
          }
          if (Array.isArray(answer) && answer.length === 0) {
            errors[question.fieldName] = 'required';
            continue;
          }
        }

        // 型別バリデーション
        if (answer !== undefined && answer !== null && answer !== '') {
          switch (question.questionType) {
            case 'email':
              if (typeof answer === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
                errors[question.fieldName] = 'invalidEmail';
              }
              break;
            case 'phone':
              if (typeof answer === 'string' && !/^[\d\-+() ]+$/.test(answer)) {
                errors[question.fieldName] = 'invalidPhone';
              }
              break;
            case 'number':
              if (typeof answer === 'string' && Number.isNaN(Number(answer))) {
                errors[question.fieldName] = 'invalidNumber';
              }
              break;
            case 'scale': {
              const numValue = Number(answer);
              const min = question.scaleMin ?? 1;
              const max = question.scaleMax ?? 10;
              if (Number.isNaN(numValue) || numValue < min || numValue > max) {
                errors[question.fieldName] = 'invalidScale';
              }
              break;
            }
          }
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * 提出データを整形
   */
  formatSubmission(
    form: DiagnosticForm,
    answers: Record<string, string | string[] | number>,
    locale: string
  ): DiagnosticSubmission {
    const scoreResult = this.calculateScore(form, answers);

    return {
      formId: form.id,
      formSlug: form.slug,
      answers,
      score: scoreResult.totalScore,
      maxScore: scoreResult.maxScore,
      percentage: scoreResult.percentage,
      thresholdResult: scoreResult.threshold || undefined,
      locale,
      submittedAt: new Date(),
    };
  }
}
