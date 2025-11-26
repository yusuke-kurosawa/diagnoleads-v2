/**
 * Authors Collection
 *
 * Phase 4.3: PayloadCMS統合
 *
 * @see https://payloadcms.com/docs/configuration/collections
 */

import type { CollectionConfig } from 'payload';

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: 'Author',
    plural: 'Authors',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'createdAt'],
    group: 'Settings',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: '著者名',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'メールアドレス',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'プロフィール画像',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      admin: {
        description: '自己紹介',
      },
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        {
          name: 'twitter',
          type: 'text',
        },
        {
          name: 'linkedin',
          type: 'text',
        },
        {
          name: 'github',
          type: 'text',
        },
      ],
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
