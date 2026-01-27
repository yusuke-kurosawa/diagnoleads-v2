import type { CollectionConfig } from 'payload';

/**
 * Blog Posts Collection
 * Rich content blog posts with SEO and categorization
 * Includes AI-assisted content generation
 */
export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: {
    singular: { ja: 'ブログ記事', en: 'Blog Post' },
    plural: { ja: 'ブログ記事', en: 'Blog Posts' },
  },
  admin: {
    useAsTitle: 'title',
    group: { ja: 'コンテンツ', en: 'Content' },
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    description: {
      ja: 'AI支援によるコンテンツ生成機能付きブログ記事。AIボタンでタイトル、抜粋、SEOメタデータを生成できます。',
      en: 'Blog posts with AI-assisted content generation. Use the AI buttons to generate titles, excerpts, and SEO metadata.',
    },
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    // AI Generation Helper UI
    {
      name: 'aiGeneration',
      type: 'ui',
      admin: {
        components: {
          Field: '/cms/components/AIToolbar#AIToolbar',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Use AI Toolbar above to generate title ideas',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short summary for listings and SEO',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Lead Generation', value: 'lead-generation' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' },
        { label: 'Product Updates', value: 'product-updates' },
        { label: 'Case Studies', value: 'case-studies' },
        { label: 'Industry Insights', value: 'industry-insights' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'author',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'avatar',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'bio',
          type: 'textarea',
          localized: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Scheduled', value: 'scheduled' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        description: 'Estimated reading time in minutes',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            if (data?.content) {
              // Estimate reading time (200 words per minute)
              const wordCount = JSON.stringify(data.content).split(/\s+/).length;
              return Math.ceil(wordCount / 200);
            }
            return 0;
          },
        ],
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          localized: true,
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          localized: true,
          maxLength: 160,
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'blog-posts',
      hasMany: true,
      maxDepth: 1,
    },
  ],
};
