import type { CollectionConfig } from 'payload';

/**
 * Media Collection
 * Handles file uploads for the CMS
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { ja: 'メディア', en: 'Media' },
    plural: { ja: 'メディア', en: 'Media' },
  },
  admin: {
    group: { ja: 'コンテンツ', en: 'Content' },
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { ja: '代替テキスト', en: 'Alt Text' },
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
      label: { ja: 'キャプション', en: 'Caption' },
    },
  ],
};
