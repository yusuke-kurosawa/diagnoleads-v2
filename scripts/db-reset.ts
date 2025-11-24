#!/usr/bin/env tsx
/**
 * Reset database (DROP ALL TABLES and re-migrate)
 * ⚠️ WARNING: This will delete all data!
 * Usage: npm run db:reset
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { env } from '@/lib/env';

async function resetDatabase() {
  console.log('⚠️  WARNING: This will delete all data!');
  console.log('🔄 Resetting database...');

  if (env.NODE_ENV === 'production') {
    console.error('❌ Cannot reset production database!');
    process.exit(1);
  }

  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    // Drop all tables
    await db.execute(sql`DROP SCHEMA public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);

    console.log('✅ Database reset successfully');
    console.log('🔄 Run migrations next: npm run db:migrate');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
