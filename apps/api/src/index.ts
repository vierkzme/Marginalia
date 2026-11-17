import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { gzipSync } from 'zlib';
import { ENV } from './config/env';
import { isDatabaseConnected } from './config/db';
import { memoryStore } from './config/store';
import authRouter from './modules/auth/auth.router';
import articlesRouter from './modules/articles/articles.router';
import vocabRouter from './modules/vocab/vocab.router';
import reviewsRouter from './modules/reviews/reviews.router';
import analyticsRouter from './modules/analytics/analytics.router';

const GZIP_THRESHOLD_BYTES = 1024;

/**
 * Compresses large JSON responses with gzip when supported by the client
 * without requiring external Express compression dependencies.
 */
export function gzipJsonMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    res.vary('Accept-Encoding');

    const shouldSkip =
      req.method === 'HEAD' ||
      res.headersSent ||
      res.statusCode === 204 ||
      res.statusCode === 304 ||
      Boolean(res.getHeader('Content-Encoding')) ||
      req.acceptsEncodings('gzip') !== 'gzip';

    if (shouldSkip) {
      return originalJson(body);
    }

    try {
      const jsonText = JSON.stringify(body);
      if (!jsonText) {
        return originalJson(body);
      }

      const rawBuffer = Buffer.from(jsonText, 'utf8');
      if (rawBuffer.byteLength < GZIP_THRESHOLD_BYTES) {
        return originalJson(body);
      }

      const compressed = gzipSync(rawBuffer);
      if (compressed.byteLength >= rawBuffer.byteLength) {
        return originalJson(body);
      }

      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.setHeader('Content-Encoding', 'gzip');
      res.removeHeader('Content-Length');
      return res.send(compressed);
    } catch {
      return originalJson(body);
    }
  }) as Response['json'];

  next();
}

const app = express();

app.use(cors());
app.use(gzipJsonMiddleware);
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
    console.log(`Marginalia API listening on port ${ENV.PORT}`);
  });
}

export default app;
