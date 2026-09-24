import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (connectionString) {
      // Direct URI connection (Supabase Pooler / Direct URI or Vercel Postgres)
      global._postgresPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 5,
        connectionTimeoutMillis: 10000,
      });
    } else {
      // Discrete variables connection
      const isSsl = process.env.SQL_SSL === 'true' || Boolean(process.env.SQL_HOST?.includes('supabase.co'));
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || '127.0.0.1',
        port: Number(process.env.SQL_PORT) || 5432,
        user: process.env.SQL_USER || 'postgres',
        password: process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DB_NAME || 'postgres',
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: 5,
        connectionTimeoutMillis: 10000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
