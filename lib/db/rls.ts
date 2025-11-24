import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type Database = NeonHttpDatabase<any> | PostgresJsDatabase<any>;

/**
 * Row-Level Security (RLS) ヘルパー関数
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
    await setCurrentUser(tx, userId);

    // コールバックを実行
    return callback(tx);
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
      return await callback(tx);
    } finally {
      // RLS を再度有効化
      await tx.execute(sql`SET LOCAL row_security = on`);
    }
  });
}
