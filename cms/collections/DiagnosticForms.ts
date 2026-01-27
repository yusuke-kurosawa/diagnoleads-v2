import type { CollectionConfig } from 'payload';

/**
 * Diagnostic Forms Collection
 * Dynamic diagnostic questionnaires with scoring logic
 *
 * Features:
 * - Multi-step wizard forms
 * - Various question types (single/multiple choice, text, scale, etc.)
 * - Configurable scoring and result thresholds
 * - Localization (en/ja)
 * - SEO settings
 * - Integration settings (email, redirect)
 * - AI-assisted question generation
 */
export const DiagnosticForms: CollectionConfig = {
  slug: 'diagnostic-forms',
  labels: {
    singular: { ja: '診断フォーム', en: 'Diagnostic Form' },
    plural: { ja: '診断フォーム', en: 'Diagnostic Forms' },
  },
  admin: {
    useAsTitle: 'title',
    group: { ja: '診断', en: 'Diagnostics' },
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description: {
      ja: 'AI支援による質問生成機能付き診断アンケートの作成・管理',
      en: 'Create and manage diagnostic questionnaires with AI-assisted question generation',
    },
    listSearchableFields: ['title', 'slug', 'description'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  fields: [
    // AI Generation Helper UI at the top
    {
      name: 'aiGeneration',
      type: 'ui',
      admin: {
        components: {
          Field: '/cms/components/AIDiagnosticToolbar#AIDiagnosticToolbar',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        // Basic Info Tab
        {
          label: { ja: '基本情報', en: 'Basic Info' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  localized: true,
                  admin: {
                    width: '70%',
                  },
                },
                {
                  name: 'status',
                  type: 'select',
                  required: true,
                  defaultValue: 'draft',
                  options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                    { label: 'Archived', value: 'archived' },
                  ],
                  admin: {
                    width: '30%',
                  },
                },
              ],
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description:
                  'URL-friendly identifier (e.g., business-diagnostic). Used in /diagnostic/{slug}',
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (!value && data?.title) {
                      const title =
                        typeof data.title === 'string'
                          ? data.title
                          : data.title?.en || data.title?.ja || '';
                      return title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                    }
                    return value;
                  },
                ],
              },
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Brief description shown at the top of the form',
              },
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Optional cover image for the diagnostic form',
              },
            },
          ],
        },
        // Steps & Questions Tab
        {
          label: { ja: 'ステップ & 質問', en: 'Steps & Questions' },
          fields: [
            {
              name: 'steps',
              type: 'array',
              required: true,
              minRows: 1,
              labels: {
                singular: 'Step',
                plural: 'Steps',
              },
              admin: {
                description: 'Define the steps and questions for your diagnostic form',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  localized: true,
                  admin: {
                    description: 'Step title (e.g., "Company Information")',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Optional step description',
                  },
                },
                {
                  name: 'icon',
                  type: 'text',
                  admin: {
                    description:
                      'Icon name from Lucide icons (e.g., "building-2", "user", "target")',
                  },
                },
                {
                  name: 'questions',
                  type: 'array',
                  dbName: 'step_questions',
                  required: true,
                  minRows: 1,
                  labels: {
                    singular: 'Question',
                    plural: 'Questions',
                  },
                  fields: [
                    {
                      name: 'questionText',
                      type: 'text',
                      required: true,
                      localized: true,
                      admin: {
                        description: 'The question text shown to the user',
                      },
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'questionType',
                          type: 'select',
                          required: true,
                          options: [
                            { label: 'Single Choice', value: 'single' },
                            { label: 'Multiple Choice', value: 'multiple' },
                            { label: 'Text Input', value: 'text' },
                            { label: 'Email', value: 'email' },
                            { label: 'Phone', value: 'phone' },
                            { label: 'Number', value: 'number' },
                            { label: 'Scale (1-10)', value: 'scale' },
                            { label: 'Textarea', value: 'textarea' },
                          ],
                          admin: { width: '50%' },
                        },
                        {
                          name: 'fieldName',
                          type: 'text',
                          required: true,
                          admin: {
                            width: '50%',
                            description: 'Field identifier (e.g., companyName)',
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'required',
                          type: 'checkbox',
                          defaultValue: true,
                          admin: { width: '50%' },
                        },
                        {
                          name: 'showIcon',
                          type: 'checkbox',
                          defaultValue: false,
                          admin: { width: '50%' },
                        },
                      ],
                    },
                    {
                      name: 'placeholder',
                      type: 'text',
                      localized: true,
                      admin: {
                        description: 'Placeholder text for text inputs',
                        condition: (_, siblingData) =>
                          ['text', 'email', 'phone', 'number', 'textarea'].includes(
                            siblingData?.questionType
                          ),
                      },
                    },
                    {
                      name: 'options',
                      type: 'array',
                      dbName: 'q_options',
                      labels: {
                        singular: 'Option',
                        plural: 'Options',
                      },
                      admin: {
                        description: 'Answer options for choice questions',
                        condition: (_, siblingData) =>
                          siblingData?.questionType === 'single' ||
                          siblingData?.questionType === 'multiple',
                      },
                      fields: [
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'label',
                              type: 'text',
                              required: true,
                              localized: true,
                              admin: { width: '50%' },
                            },
                            {
                              name: 'value',
                              type: 'text',
                              required: true,
                              admin: { width: '25%' },
                            },
                            {
                              name: 'score',
                              type: 'number',
                              defaultValue: 0,
                              admin: {
                                width: '25%',
                                description: 'Points when selected',
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'scaleMin',
                      type: 'number',
                      defaultValue: 1,
                      admin: {
                        condition: (_, siblingData) => siblingData?.questionType === 'scale',
                      },
                    },
                    {
                      name: 'scaleMax',
                      type: 'number',
                      defaultValue: 10,
                      admin: {
                        condition: (_, siblingData) => siblingData?.questionType === 'scale',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        // Scoring Tab
        {
          label: { ja: 'スコアリング', en: 'Scoring' },
          fields: [
            {
              name: 'scoring',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable scoring calculation for this form',
                  },
                },
                {
                  name: 'maxScore',
                  type: 'number',
                  defaultValue: 100,
                  admin: {
                    description: 'Maximum possible score',
                    condition: (_, siblingData) => siblingData?.enabled,
                  },
                },
                {
                  name: 'thresholds',
                  type: 'array',
                  dbName: 'score_thresholds',
                  labels: {
                    singular: 'Threshold',
                    plural: 'Thresholds',
                  },
                  admin: {
                    description: 'Define score ranges and their corresponding result labels',
                    condition: (_, siblingData) => siblingData?.enabled,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'minScore',
                          type: 'number',
                          required: true,
                          admin: { width: '25%' },
                        },
                        {
                          name: 'maxScore',
                          type: 'number',
                          required: true,
                          admin: { width: '25%' },
                        },
                        {
                          name: 'color',
                          type: 'select',
                          options: [
                            { label: 'Red', value: 'red' },
                            { label: 'Orange', value: 'orange' },
                            { label: 'Yellow', value: 'yellow' },
                            { label: 'Green', value: 'green' },
                            { label: 'Blue', value: 'blue' },
                          ],
                          admin: { width: '25%' },
                        },
                        {
                          name: 'priority',
                          type: 'select',
                          options: [
                            { label: 'Low', value: 'low' },
                            { label: 'Medium', value: 'medium' },
                            { label: 'High', value: 'high' },
                            { label: 'Urgent', value: 'urgent' },
                          ],
                          admin: { width: '25%' },
                        },
                      ],
                    },
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      localized: true,
                      admin: {
                        description:
                          'Result label shown to user (e.g., "Excellent", "Needs Improvement")',
                      },
                    },
                    {
                      name: 'description',
                      type: 'textarea',
                      localized: true,
                      admin: {
                        description: 'Detailed description of the result',
                      },
                    },
                    {
                      name: 'recommendations',
                      type: 'array',
                      dbName: 'threshold_recs',
                      fields: [
                        {
                          name: 'text',
                          type: 'text',
                          required: true,
                          localized: true,
                        },
                      ],
                      admin: {
                        description: 'Action items or recommendations for this score range',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        // Settings Tab
        {
          label: { ja: '設定', en: 'Settings' },
          fields: [
            {
              name: 'settings',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'showProgressBar',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'allowSkip',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'sendEmailNotification',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'saveAsLead',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: {
                        width: '50%',
                        description: 'Automatically save submission as a lead',
                      },
                    },
                  ],
                },
                {
                  name: 'redirectUrl',
                  type: 'text',
                  admin: {
                    description: 'URL to redirect after form completion (optional)',
                  },
                },
                {
                  name: 'thankYouMessage',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Custom message shown after form submission',
                  },
                },
              ],
            },
          ],
        },
        // SEO Tab
        {
          label: { ja: 'SEO', en: 'SEO' },
          fields: [
            {
              name: 'seo',
              type: 'group',
              fields: [
                {
                  name: 'metaTitle',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'Page title for search engines',
                  },
                },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Page description for search engines',
                  },
                },
                {
                  name: 'ogImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Social media share image',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
