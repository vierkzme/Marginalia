import { PrismaClient } from '@prisma/client';
import { ENV } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: ENV.DATABASE_URL,
      },
    },
    log: ENV.NODE_ENV === 'test' ? [] : ['warn'],
  });

if (ENV.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

let hasLoggedStoreMode = false;
let cachedDbStatus: boolean | null = null;
let lastCheckTime = 0;
let pendingCheck: Promise<boolean> | null = null;
const DB_CHECK_TTL_MS = 15_000;

function logConnectionMode(connected: boolean): void {
  if (hasLoggedStoreMode) {
    return;
  }
  if (connected) {
    console.log('[Database] PostgreSQL connected successfully on port 5432.');
  } else {
    console.log(
      '[Store] PostgreSQL offline on localhost:5432 -> Running in Dual-Mode Local Seeded Vault.'
    );
  }
  hasLoggedStoreMode = true;
}

/**
 * Checks PostgreSQL availability with a short TTL cache and in-flight
 * deduplication so concurrent API requests avoid repeated `SELECT 1` probes.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  const now = Date.now();
  if (cachedDbStatus !== null && now - lastCheckTime < DB_CHECK_TTL_MS) {
    return cachedDbStatus;
  }

  if (pendingCheck) {
    return pendingCheck;
  }

  pendingCheck = (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      cachedDbStatus = true;
      logConnectionMode(true);
      return true;
    } catch {
      cachedDbStatus = false;
      logConnectionMode(false);
      return false;
    } finally {
      lastCheckTime = Date.now();
      pendingCheck = null;
    }
  })();

  return pendingCheck;
}
