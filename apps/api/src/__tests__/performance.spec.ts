import express from 'express';
import request from 'supertest';
import { gzipJsonMiddleware } from '../index';

describe('API Performance Optimizations', () => {
  describe('isDatabaseConnected TTL Cache & Deduplication', () => {
    it('deduplicates concurrent checks and caches connection result within TTL', async () => {
      jest.useFakeTimers();
      jest.resetModules();
      delete (global as { __prisma?: unknown }).__prisma;

      const queryRawMock = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({
          $queryRaw: queryRawMock,
        })),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { isDatabaseConnected } = require('../config/db');

      const concurrent = await Promise.all([
        isDatabaseConnected(),
        isDatabaseConnected(),
        isDatabaseConnected(),
      ]);

      expect(concurrent).toEqual([true, true, true]);
      expect(queryRawMock).toHaveBeenCalledTimes(1);

      const cachedResult = await isDatabaseConnected();
      expect(cachedResult).toBe(true);
      expect(queryRawMock).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(16_000);
      queryRawMock.mockRejectedValueOnce(new Error('DB offline'));

      const refreshedResult = await isDatabaseConnected();
      expect(refreshedResult).toBe(false);
      expect(queryRawMock).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('gzipJsonMiddleware', () => {
    const testApp = express();
    testApp.use(gzipJsonMiddleware);
    testApp.get('/small', (_req, res) => {
      res.json({ ok: true });
    });
    testApp.get('/large', (_req, res) => {
      res.json({ items: Array.from({ length: 60 }, (_, idx) => ({ id: idx, label: 'vocab-entry' })) });
    });

    it('skips compression for small JSON payloads under 1 KB', async () => {
      const res = await request(testApp)
        .get('/small')
        .set('Accept-Encoding', 'gzip');

      expect(res.status).toBe(200);
      expect(res.headers['content-encoding']).toBeUndefined();
      expect(res.headers['vary']).toContain('Accept-Encoding');
      expect(res.body).toEqual({ ok: true });
    });

    it('compresses large JSON payloads >= 1 KB when client accepts gzip', async () => {
      const res = await request(testApp)
        .get('/large')
        .set('Accept-Encoding', 'gzip');

      expect(res.status).toBe(200);
      expect(res.headers['content-encoding']).toBe('gzip');
      expect(res.headers['vary']).toContain('Accept-Encoding');
      expect(res.body.items).toHaveLength(60);
    });
  });
});
