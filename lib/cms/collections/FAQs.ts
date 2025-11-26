/**
 * FAQs Collection
 *
 * Phase 4.3: PayloadCMS統合
 *
 * @see https://payloadcms.com/docs/configuration/collections
 */

import type { CollectionConfig } from 'payload';

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: 'FAQ',
    plural: 'FAQs',
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'order', 'updatedAt'],
    group: 'Content',
  },
  access: {
    // 公開FAQは誰でも読める
    read: () => true,
    // 作成・更新・削除は認証ユーザーのみ
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    // =============================================================================
    // Question (Localized)
    // =============================================================================
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'FAQ質問文',
      },
    },

    // =============================================================================
    // Answer (Rich Text, Localized)
    // =============================================================================
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'FAQ回答文（リッチテキスト）',
      },
    },

    // =============================================================================
    // Category
    // =============================================================================
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: '一般', value: 'general' },
        { label: '診断について', value: 'diagnostic' },
        { label: '料金・プラン', value: 'pricing' },
        { label: 'アカウント', value: 'account' },
        { label: 'セキュリティ', value: 'security' },
        { label: 'テクニカル', value: 'technical' },
      ],
      defaultValue: 'general',
      admin: {
        description: 'FAQカテゴリ',
      },
    },

    // =============================================================================
    // Order
    // =============================================================================
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: '表示順序（昇順）',
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
        description: '組織ID（組織固有FAQの場合）',
        condition: () => false, // Admin UIでは非表示
      },
    },

    // =============================================================================
    // Published At
    // =============================================================================
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
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
