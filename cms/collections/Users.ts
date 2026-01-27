import type { CollectionConfig } from 'payload';

/**
 * CMS Users Collection
 * Admin users for the CMS panel (separate from app users)
 */
export const Users: CollectionConfig = {
  slug: 'cms-users',
  labels: {
    singular: { ja: 'CMSユーザー', en: 'CMS User' },
    plural: { ja: 'CMSユーザー', en: 'CMS Users' },
  },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: { ja: '管理', en: 'Admin' },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { ja: '名前', en: 'Name' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: { ja: '役割', en: 'Role' },
      options: [
        { label: { ja: '管理者', en: 'Admin' }, value: 'admin' },
        { label: { ja: '編集者', en: 'Editor' }, value: 'editor' },
        { label: { ja: '閲覧者', en: 'Viewer' }, value: 'viewer' },
      ],
    },
  ],
};
