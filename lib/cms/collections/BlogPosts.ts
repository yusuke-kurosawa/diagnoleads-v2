/**
 * BlogPosts Collection
 *
 * Phase 4.3: PayloadCMS統合
 *
 * @see https://payloadcms.com/docs/configuration/collections
 */

import type { CollectionConfig } from '../types/payload-stubs';

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'author', 'publishedAt'],
    group: 'Content',
  },
  access: {
    // 公開記事は誰でも読める
    read: ({ req: { user } }) => {
      if (user) return true;
      // 未認証ユーザーは公開記事のみ
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
    // Title (Localized)
    // =============================================================================
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: '記事タイトル',
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
        description: 'URL用スラッグ（英数字とハイフン）',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Slug is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Slug must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    },

    // =============================================================================
    // Content (Rich Text, Localized)
    // =============================================================================
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: '記事本文',
      },
    },

    // =============================================================================
    // Excerpt (Localized)
    // =============================================================================
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: '記事の概要（一覧表示用）',
      },
    },

    // =============================================================================
    // Author
    // =============================================================================
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      admin: {
        description: '記事の著者',
      },
    },

    // =============================================================================
    // Cover Image
    // =============================================================================
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'カバー画像',
      },
    },

    // =============================================================================
    // Category
    // =============================================================================
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: '記事カテゴリ',
      },
    },

    // =============================================================================
    // Tags
    // =============================================================================
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: {
        description: 'タグ（複数可）',
      },
    },

    // =============================================================================
    // SEO
    // =============================================================================
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          localized: true,
          admin: {
            description: 'メタタイトル（省略時は記事タイトル）',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'メタディスクリプション',
          },
        },
        {
          name: 'keywords',
          type: 'array',
          fields: [
            {
              name: 'keyword',
              type: 'text',
            },
          ],
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'OGP画像（省略時はカバー画像）',
          },
        },
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: '検索エンジンにインデックスさせない',
          },
        },
      ],
    },

    // =============================================================================
    // Organization ID (Multi-tenant support)
    // =============================================================================
    {
      name: 'organizationId',
      type: 'text',
      index: true,
      admin: {
        description: '組織ID（組織固有記事の場合）',
        condition: () => false,
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
        description: '公開日時',
      },
    },
  ],
  timestamps: true,
  versions: {
    drafts: true,
  },
};
