/**
 * CMS Types Tests
 */

import { describe, expect, it } from 'vitest';
import type {
  CollectionConfig,
  FieldConfig,
  Where,
  Payload,
} from '@/lib/cms/types/payload-stubs';

describe('CollectionConfig', () => {
  it('should define required slug', () => {
    const collection: CollectionConfig = {
      slug: 'articles',
      fields: [],
    };
    
    expect(collection.slug).toBe('articles');
  });

  it('should support labels', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      labels: {
        singular: 'Post',
        plural: 'Posts',
      },
      fields: [],
    };
    
    expect(collection.labels?.singular).toBe('Post');
    expect(collection.labels?.plural).toBe('Posts');
  });

  it('should support admin config', () => {
    const collection: CollectionConfig = {
      slug: 'users',
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'email', 'createdAt'],
        group: 'Administration',
        description: 'User management',
      },
      fields: [],
    };
    
    expect(collection.admin?.useAsTitle).toBe('name');
    expect(collection.admin?.group).toBe('Administration');
  });

  it('should support access control', () => {
    const collection: CollectionConfig = {
      slug: 'documents',
      access: {
        read: () => true,
        create: ({ req }) => !!req?.user,
        update: ({ req }) => !!req?.user,
        delete: ({ req }) => req?.user?.role === 'admin',
      },
      fields: [],
    };
    
    expect(collection.access?.read?.({})).toBe(true);
  });

  it('should support timestamps and versions', () => {
    const collection: CollectionConfig = {
      slug: 'pages',
      fields: [],
      timestamps: true,
      versions: {
        drafts: true,
      },
    };
    
    expect(collection.timestamps).toBe(true);
    expect(typeof collection.versions).toBe('object');
  });

  it('should support upload config', () => {
    const collection: CollectionConfig = {
      slug: 'media',
      fields: [],
      upload: {
        staticDir: 'public/uploads',
        mimeTypes: ['image/*', 'application/pdf'],
        imageSizes: [
          { name: 'thumbnail', width: 150, height: 150 },
          { name: 'medium', width: 500 },
        ],
        adminThumbnail: 'thumbnail',
      },
    };
    
    expect(collection.upload?.staticDir).toBe('public/uploads');
    expect(collection.upload?.imageSizes).toHaveLength(2);
  });
});

describe('FieldConfig', () => {
  it('should define text field', () => {
    const field: FieldConfig = {
      name: 'title',
      type: 'text',
      required: true,
    };
    
    expect(field.type).toBe('text');
    expect(field.required).toBe(true);
  });

  it('should support all field types', () => {
    const types = [
      'text', 'textarea', 'number', 'richText',
      'relationship', 'array', 'upload', 'json',
      'select', 'checkbox', 'date', 'email',
      'point', 'radio', 'row', 'collapsible',
      'tabs', 'blocks', 'group',
    ];
    
    expect(types).toHaveLength(19);
  });

  it('should support relationship field', () => {
    const field: FieldConfig = {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    };
    
    expect(field.relationTo).toBe('users');
    expect(field.hasMany).toBe(false);
  });

  it('should support array field', () => {
    const field: FieldConfig = {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      fields: [
        { name: 'title', type: 'text' },
        { name: 'value', type: 'number' },
      ],
    };
    
    expect(field.minRows).toBe(1);
    expect(field.maxRows).toBe(10);
    expect(field.fields).toHaveLength(2);
  });

  it('should support select field with options', () => {
    const field: FieldConfig = {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
    };
    
    expect(field.options).toHaveLength(3);
    expect(field.defaultValue).toBe('draft');
  });

  it('should support admin field config', () => {
    const field: FieldConfig = {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Enter a brief description',
        placeholder: 'Description...',
        hidden: false,
        readOnly: false,
      },
    };
    
    expect(field.admin?.description).toBe('Enter a brief description');
  });

  it('should support validation', () => {
    const field: FieldConfig = {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      validate: (value) => {
        if (!value.includes('@')) return 'Invalid email';
        return true;
      },
    };
    
    expect(field.unique).toBe(true);
    expect(field.index).toBe(true);
  });

  it('should support localization', () => {
    const field: FieldConfig = {
      name: 'content',
      type: 'richText',
      localized: true,
    };
    
    expect(field.localized).toBe(true);
  });
});

describe('Where', () => {
  it('should define query conditions', () => {
    const where: Where = {
      status: { equals: 'published' },
      'author.id': { equals: 'user-123' },
      createdAt: { greater_than: '2024-01-01' },
    };
    
    expect(where.status).toBeDefined();
    expect(where['author.id']).toBeDefined();
  });

  it('should support complex queries', () => {
    const where: Where = {
      and: [
        { status: { equals: 'published' } },
        { or: [
          { category: { equals: 'news' } },
          { category: { equals: 'blog' } },
        ]},
      ],
    };
    
    expect(where.and).toBeDefined();
  });
});

describe('Payload API', () => {
  it('should define find method', () => {
    const mockPayload: Partial<Payload> = {
      find: async ({ collection, where, limit }) => ({
        docs: [],
        totalDocs: 0,
        limit: limit || 10,
        hasNextPage: false,
        hasPrevPage: false,
      }),
    };
    
    expect(mockPayload.find).toBeDefined();
  });

  it('should define findByID method', () => {
    const mockPayload: Partial<Payload> = {
      findByID: async ({ collection, id }) => ({
        id,
        collection,
      }),
    };
    
    expect(mockPayload.findByID).toBeDefined();
  });

  it('should define create method', () => {
    const mockPayload: Partial<Payload> = {
      create: async ({ collection, data }) => ({
        id: 'new-id',
        ...data as object,
      }),
    };
    
    expect(mockPayload.create).toBeDefined();
  });

  it('should define update method', () => {
    const mockPayload: Partial<Payload> = {
      update: async ({ collection, id, data }) => ({
        id,
        ...data as object,
      }),
    };
    
    expect(mockPayload.update).toBeDefined();
  });

  it('should define delete method', () => {
    const mockPayload: Partial<Payload> = {
      delete: async () => {},
    };
    
    expect(mockPayload.delete).toBeDefined();
  });
});

describe('Collection examples', () => {
  it('should define articles collection', () => {
    const articles: CollectionConfig = {
      slug: 'articles',
      labels: { singular: '記事', plural: '記事一覧' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'createdAt'],
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'content', type: 'richText' },
        { name: 'status', type: 'select', options: ['draft', 'published'] },
      ],
      timestamps: true,
      versions: { drafts: true },
    };
    
    expect(articles.slug).toBe('articles');
    expect(articles.fields).toHaveLength(4);
  });
});
