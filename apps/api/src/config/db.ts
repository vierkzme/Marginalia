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

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (!hasLoggedStoreMode) {
      console.log('[Database] PostgreSQL connected successfully on port 5432.');
      hasLoggedStoreMode = true;
    }
    return true;
  } catch {
    if (!hasLoggedStoreMode) {
      console.log(
        '[Store] PostgreSQL offline on localhost:5432 -> Running in Dual-Mode Local Seeded Vault.'
      );
      hasLoggedStoreMode = true;
    }
    return false;
  }
}
