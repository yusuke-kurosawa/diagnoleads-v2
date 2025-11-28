import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { OrganizationRole } from './schema';

type Database = NeonHttpDatabase<any> | PostgresJsDatabase<any>;

/**
 * RLS Context - session context for Row-Level Security
 */
export interface RLSContext {
  userId: string;
  organizationId?: string;
  role?: OrganizationRole;
}

/**
 * Row-Level Security (RLS) ヘルパー関数
 *
 * Phase 2.7: 階層的組織構造をサポート
 * - app.current_user_id: 現在のユーザーID
 * - app.current_org_id: 現在の組織ID（オプション）
 * - app.current_role: 現在のロール（オプション）
 */

/**
 * 現在のユーザーIDをセッションに設定
 * すべてのクエリ実行前に呼び出す必要があります
 */
export async function setCurrentUser(db: Database, userId: string | null) {
  if (!userId) {
    await db.execute(sql`SET LOCAL app.current_user_id = ''`);
    return;
  }

  await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
}

/**
 * 完全なRLSコンテキストを設定
 * 階層的アクセス制御に必要な全情報を設定
 */
export async function setRLSContext(db: Database, context: RLSContext | null) {
  if (!context) {
    await db.execute(sql`SELECT clear_rls_context()`);
    return;
  }

  await db.execute(sql`
    SELECT set_rls_context(
      ${context.userId}::UUID,
      ${context.organizationId || null}::UUID,
      ${context.role || null}::TEXT
    )
  `);
}

/**
 * RLSコンテキストをクリア
 */
export async function clearRLSContext(db: Database) {
  await db.execute(sql`SELECT clear_rls_context()`);
}

/**
 * RLSを適用したクエリを実行するヘルパー関数
 * トランザクション内で現在のユーザーを設定し、クエリを実行します
 */
export async function withRLS<T>(
  db: Database,
  userId: string | null,
  callback: (db: Database) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // ユーザーIDを設定
    await setCurrentUser(tx as unknown as Database, userId);

    // コールバックを実行
    return callback(tx as unknown as Database);
  });
}

/**
 * 階層対応のRLSを適用したクエリを実行
 * 完全なコンテキスト（ユーザー、組織、ロール）を設定
 */
export async function withHierarchicalRLS<T>(
  db: Database,
  context: RLSContext | null,
  callback: (db: Database) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // 完全なRLSコンテキストを設定
    await setRLSContext(tx as unknown as Database, context);

    try {
      // コールバックを実行
      return await callback(tx as unknown as Database);
    } finally {
      // コンテキストをクリア
      await clearRLSContext(tx as unknown as Database);
    }
  });
}

/**
 * 管理者権限でクエリを実行（RLS をバイパス）
 * 注意: セキュリティ上の理由から、慎重に使用してください
 */
export async function withoutRLS<T>(
  db: Database,
  callback: (db: Database) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // RLS を一時的に無効化
    await tx.execute(sql`SET LOCAL row_security = off`);

    try {
      return await callback(tx as unknown as Database);
    } finally {
      // RLS を再度有効化
      await tx.execute(sql`SET LOCAL row_security = on`);
    }
  });
}
