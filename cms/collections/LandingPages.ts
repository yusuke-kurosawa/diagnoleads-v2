import type { CollectionConfig } from 'payload';

/**
 * Landing Pages Collection
 * Flexible page builder with reusable blocks
 */
export const LandingPages: CollectionConfig = {
  slug: 'landing-pages',
  labels: {
    singular: { ja: 'ランディングページ', en: 'Landing Page' },
    plural: { ja: 'ランディングページ', en: 'Landing Pages' },
  },
  admin: {
    useAsTitle: 'title',
    group: { ja: 'ページ', en: 'Pages' },
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'badge',
          type: 'text',
          localized: true,
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'subheading',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'primaryCTA',
          type: 'group',
          fields: [
            { name: 'text', type: 'text', localized: true },
            { name: 'link', type: 'text' },
          ],
        },
        {
          name: 'secondaryCTA',
          type: 'group',
          fields: [
            { name: 'text', type: 'text', localized: true },
            { name: 'link', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: [
        {
          slug: 'features',
          labels: {
            singular: 'Features Section',
            plural: 'Features Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
            },
            {
              name: 'subheading',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'icon', type: 'text' },
                { name: 'title', type: 'text', required: true, localized: true },
                { name: 'description', type: 'textarea', localized: true },
              ],
            },
          ],
        },
        {
          slug: 'benefits',
          labels: {
            singular: 'Benefits Section',
            plural: 'Benefits Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
            },
            {
              name: 'subheading',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'items',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true, localized: true }],
            },
          ],
        },
        {
          slug: 'testimonials',
          labels: {
            singular: 'Testimonials Section',
            plural: 'Testimonials Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
            },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'quote', type: 'textarea', required: true, localized: true },
                { name: 'author', type: 'text', required: true },
                { name: 'company', type: 'text' },
                { name: 'avatar', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          slug: 'cta',
          labels: {
            singular: 'CTA Section',
            plural: 'CTA Sections',
          },
          fields: [
            { name: 'heading', type: 'text', required: true, localized: true },
            { name: 'subheading', type: 'textarea', localized: true },
            { name: 'buttonText', type: 'text', localized: true },
            { name: 'buttonLink', type: 'text' },
            { name: 'backgroundColor', type: 'text', defaultValue: 'primary' },
          ],
        },
        {
          slug: 'richContent',
          labels: {
            singular: 'Rich Content',
            plural: 'Rich Content Blocks',
          },
          fields: [
            {
              name: 'content',
              type: 'richText',
              localized: true,
            },
          ],
        },
        {
          slug: 'imageText',
          labels: {
            singular: 'Image + Text',
            plural: 'Image + Text Blocks',
          },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media' },
            { name: 'heading', type: 'text', localized: true },
            { name: 'content', type: 'richText', localized: true },
            {
              name: 'imagePosition',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true, maxLength: 160 },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
        { name: 'noIndex', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
};
