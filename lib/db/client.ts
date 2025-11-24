import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * PostgreSQL connection configuration
 */
const connectionString = env.DATABASE_URL;

/**
 * Create PostgreSQL client
 * - max: Maximum number of connections
 * - idle_timeout: Close idle connections after 20 seconds
 * - connect_timeout: Timeout for connecting to the database
 */
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Drizzle ORM database instance
 * Provides type-safe database queries with excellent performance
 */
export const db = drizzle(client, { schema });

/**
 * Export types for use throughout the application
 */
export type Database = typeof db;
