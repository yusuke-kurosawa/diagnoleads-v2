/**
 * Assessment Repository
 *
 * 診断テンプレートのデータアクセスを抽象化
 * CMS実装に依存しないインターフェースを提供
 */

import type { AssessmentTemplate, Industry, ContentStatus } from '../core/types';
import type { CMSAdapter } from '../core/interfaces';
import { getCMSAdapter } from '../adapters/factory';

export interface FindAssessmentsOptions {
  organizationId?: string;
  industry?: Industry;
  status?: ContentStatus | 'all';
  limit?: number;
  offset?: number;
}

export interface AssessmentsResult {
  templates: AssessmentTemplate[];
  total: number;
}

export class AssessmentRepository {
  private adapter: CMSAdapter;

  constructor(adapter?: CMSAdapter) {
    this.adapter = adapter || getCMSAdapter();
  }

  /**
   * 診断テンプレート一覧を取得
   */
  async findAll(options: FindAssessmentsOptions = {}): Promise<AssessmentsResult> {
    const { organizationId, industry, status = 'published', limit = 50, offset = 0 } = options;

    const where: Record<string, unknown> = {};

    if (industry) {
      where.industry = { equals: industry };
    }

    const { data, meta } = await this.adapter.find<AssessmentTemplate>({
      collection: 'assessment-templates',
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      offset,
      sort: [{ field: 'name.ja', order: 'asc' }],
      organizationId,
      status: status === 'all' ? 'all' : status,
    });

    return {
      templates: data,
      total: meta?.total || 0,
    };
  }

  /**
   * スラッグで診断テンプレートを取得
   */
  async findBySlug(slug: string, organizationId?: string): Promise<AssessmentTemplate | null> {
    const { data } = await this.adapter.findBySlug<AssessmentTemplate>({
      collection: 'assessment-templates',
      slug,
      organizationId,
    });

    return data;
  }

  /**
   * IDで診断テンプレートを取得
   */
  async findById(id: string, organizationId?: string): Promise<AssessmentTemplate | null> {
    const { data } = await this.adapter.findById<AssessmentTemplate>({
      collection: 'assessment-templates',
      id,
      organizationId,
    });

    return data;
  }

  /**
   * 業界別の診断テンプレートを取得
   */
  async findByIndustry(industry: Industry, organizationId?: string): Promise<AssessmentTemplate[]> {
    const { templates } = await this.findAll({
      organizationId,
      industry,
      status: 'published',
    });

    return templates;
  }

  /**
   * 診断テンプレートを作成
   */
  async create(
    template: Omit<AssessmentTemplate, 'id' | 'publishedAt'>,
    organizationId?: string
  ): Promise<AssessmentTemplate> {
    const { data } = await this.adapter.create<AssessmentTemplate>({
      collection: 'assessment-templates',
      data: {
        ...template,
        publishedAt: template.status === 'published' ? new Date() : undefined,
      },
      organizationId,
    });

    return data;
  }

  /**
   * 診断テンプレートを更新
   */
  async update(
    id: string,
    updates: Partial<Omit<AssessmentTemplate, 'id'>>,
    organizationId?: string
  ): Promise<AssessmentTemplate> {
    const { data } = await this.adapter.update<AssessmentTemplate>({
      collection: 'assessment-templates',
      id,
      data: updates,
      organizationId,
    });

    return data;
  }

  /**
   * 診断テンプレートを削除
   */
  async delete(id: string, organizationId?: string): Promise<void> {
    await this.adapter.delete({
      collection: 'assessment-templates',
      id,
      organizationId,
    });
  }

  /**
   * 診断テンプレートを公開
   */
  async publish(id: string, organizationId?: string): Promise<AssessmentTemplate> {
    return this.update(
      id,
      {
        status: 'published',
        publishedAt: new Date(),
      },
      organizationId
    );
  }

  /**
   * 診断テンプレートを非公開
   */
  async unpublish(id: string, organizationId?: string): Promise<AssessmentTemplate> {
    return this.update(
      id,
      {
        status: 'draft',
      },
      organizationId
    );
  }

  /**
   * 診断テンプレートを複製
   */
  async duplicate(
    id: string,
    newName: { ja: string; en: string },
    organizationId?: string
  ): Promise<AssessmentTemplate> {
    const original = await this.findById(id, organizationId);
    if (!original) {
      throw new Error('Template not found');
    }

    const { id: _id, publishedAt: _publishedAt, ...rest } = original;

    return this.create(
      {
        ...rest,
        name: newName,
        slug: `${original.slug}-copy-${Date.now()}`,
        status: 'draft',
      },
      organizationId
    );
  }

  /**
   * 業界一覧を取得
   */
  async getIndustries(organizationId?: string): Promise<Industry[]> {
    const { templates } = await this.findAll({
      organizationId,
      status: 'published',
      limit: 1000,
    });

    const industries = new Set<Industry>();
    for (const template of templates) {
      industries.add(template.industry);
    }

    return Array.from(industries);
  }

  /**
   * 診断結果を計算
   */
  calculateScore(
    template: AssessmentTemplate,
    answers: Record<string, string | string[]>
  ): {
    totalScore: number;
    maxScore: number;
    percentage: number;
    result: AssessmentTemplate['resultMessages'][0] | null;
  } {
    let totalScore = 0;
    let maxScore = 0;

    for (const question of template.questions) {
      if (!question.options) continue;

      const answer = answers[question.id];
      if (!answer) continue;

      // 最大スコアを計算
      const optionScores = question.options.map((opt) => opt.score);
      maxScore += Math.max(...optionScores);

      // 回答のスコアを計算
      if (Array.isArray(answer)) {
        // 複数選択
        for (const value of answer) {
          const option = question.options.find((opt) => opt.value === value);
          if (option) {
            totalScore += option.score;
          }
        }
      } else {
        // 単一選択
        const option = question.options.find((opt) => opt.value === answer);
        if (option) {
          totalScore += option.score;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // 結果メッセージを取得
    const result =
      template.resultMessages.find(
        (msg) => percentage >= msg.scoreRange.min && percentage <= msg.scoreRange.max
      ) || null;

    return {
      totalScore,
      maxScore,
      percentage,
      result,
    };
  }
}
