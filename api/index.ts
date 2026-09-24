import express from 'express';
import { authRouter } from '../src/server/routes/authRoutes.ts';
import { masterRouter } from '../src/server/routes/masterRoutes.ts';
import { targetRouter } from '../src/server/routes/targetRoutes.ts';
import { userRouter } from '../src/server/routes/userRoutes.ts';
import { importRouter } from '../src/server/routes/importRoutes.ts';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const hasSqlDiscrete = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);

  res.json({
    status: 'ok',
    service: 'BO-OPS Express Serverless on Vercel',
    timestamp: new Date().toISOString(),
    env: {
      has_database_url: hasDatabaseUrl,
      has_sql_host: Boolean(process.env.SQL_HOST),
      has_sql_db: Boolean(process.env.SQL_DB_NAME),
      database_configured: hasDatabaseUrl || hasSqlDiscrete,
    },
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/master', masterRouter);
app.use('/api/target', targetRouter);
app.use('/api/users', userRouter);
app.use('/api/import', importRouter);

export default app;
