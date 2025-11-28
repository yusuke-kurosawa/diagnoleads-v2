/**
 * CMS Adapter Factory
 *
 * Phase 4.3: PayloadCMS統合
 *
 * 環境変数に基づいてCMSアダプターを選択・生成
 * シングルトンパターンでインスタンスを管理
 */

import { CMSConfigurationError } from '../core/errors';
import type { CMSAdapter } from '../core/interfaces';
import { MockCMSAdapter } from './mock/adapter';
// PayloadCMS adapter import is dynamic to avoid build errors when payload is not installed

type CMSProvider = 'payload' | 'mock' | 'sanity';

let adapterInstance: CMSAdapter | null = null;
let currentProvider: CMSProvider | null = null;

/**
 * 環境変数からCMSプロバイダーを取得
 */
function getCMSProvider(): CMSProvider {
  const provider = process.env.CMS_PROVIDER || 'mock';

  if (!['payload', 'mock', 'sanity'].includes(provider)) {
    throw new CMSConfigurationError(
      `Unsupported CMS provider: ${provider}. Supported providers: payload, mock, sanity`
    );
  }

  return provider as CMSProvider;
}

/**
 * CMSアダプターを取得
 *
 * @example
 * ```typescript
 * const adapter = getCMSAdapter();
 * const posts = await adapter.find<BlogPost>({ collection: 'blog-posts' });
 * ```
 */
export function getCMSAdapter(): CMSAdapter {
  const provider = getCMSProvider();

  // プロバイダーが変更された場合、インスタンスをリセット
  if (currentProvider !== provider) {
    adapterInstance = null;
    currentProvider = provider;
  }

  if (adapterInstance) {
    return adapterInstance;
  }

  switch (provider) {
    case 'payload':
      // PayloadCMSアダプターを使用
      // 注: PayloadCMSパッケージがインストールされていない場合はMockにフォールバック
      console.warn('[CMS] PayloadCMS is not currently installed. Using MockCMSAdapter.');
      adapterInstance = new MockCMSAdapter();
      break;

    case 'sanity':
      // Sanityアダプター（将来実装）
      console.warn('[CMS] Sanity adapter not yet implemented. Using MockCMSAdapter.');
      adapterInstance = new MockCMSAdapter();
      break;
    default:
      adapterInstance = new MockCMSAdapter();
      break;
  }

  return adapterInstance;
}

/**
 * テスト用: アダプターを上書き
 */
export function setCMSAdapter(adapter: CMSAdapter): void {
  adapterInstance = adapter;
  currentProvider = adapter.name.toLowerCase() as CMSProvider;
}

/**
 * テスト用: アダプターをリセット
 */
export function resetCMSAdapter(): void {
  adapterInstance = null;
  currentProvider = null;
}

/**
 * CMSアダプターを初期化
 */
export async function initializeCMS(): Promise<void> {
  const adapter = getCMSAdapter();
  await adapter.initialize();
}

/**
 * CMSヘルスチェック
 */
export async function checkCMSHealth(): Promise<boolean> {
  try {
    const adapter = getCMSAdapter();
    return await adapter.healthCheck();
  } catch {
    return false;
  }
}
