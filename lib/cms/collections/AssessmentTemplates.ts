/**
 * AssessmentTemplates Collection
 *
 * Phase 4.3: PayloadCMS統合
 *
 * @see https://payloadcms.com/docs/configuration/collections
 */

import type { CollectionConfig } from '../types/payload-stubs';

export const AssessmentTemplates: CollectionConfig = {
  slug: 'assessment-templates',
  labels: {
    singular: 'Assessment Template',
    plural: 'Assessment Templates',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'industry', 'status', 'updatedAt'],
    group: 'Assessments',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        _status: {
          equals: 'published',
        },
      };
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    // =============================================================================
    // Name (Localized)
    // =============================================================================
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: '診断テンプレート名',
      },
    },

    // =============================================================================
    // Slug
    // =============================================================================
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL用スラッグ',
      },
    },

    // =============================================================================
    // Description (Localized)
    // =============================================================================
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: '診断の説明',
      },
    },

    // =============================================================================
    // Industry
    // =============================================================================
    {
      name: 'industry',
      type: 'select',
      required: true,
      options: [
        { label: 'IT・テクノロジー', value: 'technology' },
        { label: '金融・保険', value: 'finance' },
        { label: '医療・ヘルスケア', value: 'healthcare' },
        { label: '製造業', value: 'manufacturing' },
        { label: '小売・EC', value: 'retail' },
        { label: 'その他', value: 'other' },
      ],
      admin: {
        description: '対象業界',
      },
    },

    // =============================================================================
    // Questions
    // =============================================================================
    {
      name: 'questions',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: '質問文',
          },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'ラジオボタン（単一選択）', value: 'radio' },
            { label: 'チェックボックス（複数選択）', value: 'checkbox' },
            { label: 'スケール（1-5）', value: 'scale' },
            { label: 'テキスト入力', value: 'text' },
          ],
          defaultValue: 'radio',
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            condition: (data, siblingData) =>
              siblingData?.type === 'radio' || siblingData?.type === 'checkbox',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
            {
              name: 'score',
              type: 'number',
              required: true,
              defaultValue: 0,
              admin: {
                description: 'この選択肢のスコア',
              },
            },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
      ],
      admin: {
        description: '診断質問',
      },
    },

    // =============================================================================
    // Scoring Rules
    // =============================================================================
    {
      name: 'scoringRules',
      type: 'array',
      fields: [
        {
          name: 'minScore',
          type: 'number',
          required: true,
        },
        {
          name: 'maxScore',
          type: 'number',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'スコアラベル（例: 優秀、良好、要改善）',
          },
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          options: [
            { label: '低', value: 'low' },
            { label: '中', value: 'medium' },
            { label: '高', value: 'high' },
            { label: '緊急', value: 'urgent' },
          ],
        },
      ],
      admin: {
        description: 'スコア判定ルール',
      },
    },

    // =============================================================================
    // Result Messages
    // =============================================================================
    {
      name: 'resultMessages',
      type: 'array',
      fields: [
        {
          name: 'scoreMin',
          type: 'number',
          required: true,
        },
        {
          name: 'scoreMax',
          type: 'number',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'message',
          type: 'textarea',
          required: true,
          localized: true,
        },
        {
          name: 'recommendations',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
      ],
      admin: {
        description: '結果メッセージ',
      },
    },

    // =============================================================================
    // Organization ID (Multi-tenant support)
    // =============================================================================
    {
      name: 'organizationId',
      type: 'text',
      index: true,
      admin: {
        description: '組織ID',
        condition: () => false,
      },
    },

    // =============================================================================
    // Published At
    // =============================================================================
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true,
  versions: {
    drafts: true,
  },
};
