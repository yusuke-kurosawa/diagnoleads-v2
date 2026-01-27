import type { CollectionConfig } from 'payload';

/**
 * FAQs Collection
 * Frequently asked questions with categories
 * Includes AI-assisted FAQ generation
 */
export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: { ja: 'よくある質問', en: 'FAQ' },
    plural: { ja: 'よくある質問', en: 'FAQs' },
  },
  admin: {
    useAsTitle: 'question',
    group: { ja: 'コンテンツ', en: 'Content' },
    defaultColumns: ['question', 'category', 'order', 'status'],
    description: {
      ja: 'AI支援によるFAQ生成機能付き。AIツールバーでトピックに基づいたFAQを生成できます。',
      en: 'FAQs with AI-assisted generation. Use the AI toolbar to generate FAQs based on a topic.',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    // AI Generation Helper UI
    {
      name: 'aiGeneration',
      type: 'ui',
      admin: {
        components: {
          Field: '/cms/components/AIFAQToolbar#AIFAQToolbar',
        },
      },
    },
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Use AI Toolbar above to generate FAQ ideas',
      },
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'General', value: 'general' },
        { label: 'Features', value: 'features' },
        { label: 'Pricing', value: 'pricing' },
        { label: 'Technical', value: 'technical' },
        { label: 'Account', value: 'account' },
        { label: 'Security', value: 'security' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (lower numbers appear first)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show in featured FAQs section',
      },
    },
  ],
};
