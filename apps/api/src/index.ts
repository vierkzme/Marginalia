import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { isDatabaseConnected } from './config/db';
import { memoryStore } from './config/store';
import authRouter from './modules/auth/auth.router';
import articlesRouter from './modules/articles/articles.router';
import vocabRouter from './modules/vocab/vocab.router';
import reviewsRouter from './modules/reviews/reviews.router';
import analyticsRouter from './modules/analytics/analytics.router';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/articles', articlesRouter);
app.use('/api/v1/vocab', vocabRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/analytics', analyticsRouter);

app.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await isDatabaseConnected();
  res.json({
    status: 'ok',
    service: 'core-api',
    database: dbConnected ? 'postgresql-prisma' : 'local-memory-store',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', async (_req: Request, res: Response) => {
  const dbConnected = await isDatabaseConnected();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      database: dbConnected ? 'postgresql-prisma' : 'local-memory-store',
      demoUserAvailable: memoryStore.getData().users.length > 0,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(ENV.PORT, () => {
    console.log(`Contextual Reading & Idiom Vault API listening on port ${ENV.PORT}`);
  });
}

export default app;
