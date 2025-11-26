/**
 * CMS Adapter Factory
 *
 * 環境変数に基づいてCMSアダプターを選択・生成
 * シングルトンパターンでインスタンスを管理
 */

import type { CMSAdapter } from '../core/interfaces';
import { CMSConfigurationError } from '../core/errors';
import { MockCMSAdapter } from './mock/adapter';

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
      // PayloadCMSアダプターを動的にインポート
      // 注: PayloadCMSがインストールされていない場合はMockにフォールバック
      try {
        // 実際のPayloadCMSアダプターは後で実装
        // const { PayloadCMSAdapter } = require('./payload/adapter');
        // adapterInstance = new PayloadCMSAdapter();
        console.warn(
          '[CMS] PayloadCMS adapter not yet implemented. Using MockCMSAdapter.'
        );
        adapterInstance = new MockCMSAdapter();
      } catch {
        console.warn(
          '[CMS] PayloadCMS not available. Falling back to MockCMSAdapter.'
        );
        adapterInstance = new MockCMSAdapter();
      }
      break;

    case 'sanity':
      // Sanityアダプター（将来実装）
      console.warn(
        '[CMS] Sanity adapter not yet implemented. Using MockCMSAdapter.'
      );
      adapterInstance = new MockCMSAdapter();
      break;

    case 'mock':
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
