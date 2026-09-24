import express from 'express';
import { db, createPool } from '../src/db/index.ts';
import { authRouter } from '../src/server/routes/authRoutes.ts';
import { masterRouter } from '../src/server/routes/masterRoutes.ts';
import { targetRouter } from '../src/server/routes/targetRoutes.ts';
import { userRouter } from '../src/server/routes/userRoutes.ts';
import { importRouter } from '../src/server/routes/importRoutes.ts';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health & Diagnostic Check
app.get('/api/health', async (_req, res) => {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const hasSqlDiscrete = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);

  let dbConnectionStatus = 'not_tested';
  let dbError: string | null = null;

  try {
    const pool = createPool();
    const result = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    dbConnectionStatus = 'connected';
    return res.json({
      status: 'ok',
      service: 'BO-OPS Express Serverless on Vercel',
      timestamp: new Date().toISOString(),
      database: {
        status: dbConnectionStatus,
        current_time: result.rows[0]?.current_time,
        db_name: result.rows[0]?.db_name,
      },
      env: {
        has_database_url: hasDatabaseUrl,
        has_sql_host: Boolean(process.env.SQL_HOST),
        has_sql_db: Boolean(process.env.SQL_DB_NAME),
        database_configured: hasDatabaseUrl || hasSqlDiscrete,
      },
    });
  } catch (err: any) {
    dbConnectionStatus = 'failed';
    dbError = err.message;
    return res.status(500).json({
      status: 'error',
      service: 'BO-OPS Express Serverless on Vercel',
      timestamp: new Date().toISOString(),
      database: {
        status: dbConnectionStatus,
        error_message: dbError,
        hint: 'Periksa DATABASE_URL atau host/password di Environment Variables Vercel.',
      },
      env: {
        has_database_url: hasDatabaseUrl,
        has_sql_host: Boolean(process.env.SQL_HOST),
        has_sql_db: Boolean(process.env.SQL_DB_NAME),
        database_configured: hasDatabaseUrl || hasSqlDiscrete,
      },
    });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/master', masterRouter);
app.use('/api/target', targetRouter);
app.use('/api/users', userRouter);
app.use('/api/import', importRouter);

export default app;
