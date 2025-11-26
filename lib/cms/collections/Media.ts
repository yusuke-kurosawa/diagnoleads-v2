/**
 * Media Collection
 *
 * Phase 4.3: PayloadCMS統合
 *
 * @see https://payloadcms.com/docs/upload/overview
 */

import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'createdAt'],
    group: 'Assets',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        position: 'centre',
      },
      {
        name: 'card',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        description: '画像の代替テキスト（アクセシビリティ用）',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      admin: {
        description: 'キャプション',
      },
    },
    {
      name: 'organizationId',
      type: 'text',
      index: true,
      admin: {
        condition: () => false,
      },
    },
  ],
  timestamps: true,
};
