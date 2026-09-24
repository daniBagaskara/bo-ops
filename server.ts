import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './src/server/routes/authRoutes.ts';
import { masterRouter } from './src/server/routes/masterRoutes.ts';
import { targetRouter } from './src/server/routes/targetRoutes.ts';
import { userRouter } from './src/server/routes/userRoutes.ts';
import { importRouter } from './src/server/routes/importRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/master', masterRouter);
  app.use('/api/target', targetRouter);
  app.use('/api/users', userRouter);
  app.use('/api/import', importRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'BO-OPS Cloud SQL Full-Stack API', timestamp: new Date().toISOString() });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BO-OPS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BO-OPS] Fatal error starting server:', err);
  process.exit(1);
});
