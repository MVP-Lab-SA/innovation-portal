import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function getDatabaseUrl(): string | undefined {
  // In production runtime (not during the build phase) we REQUIRE the pooled
  // connection to avoid exhausting Postgres connections from serverless funcs.
  if (IS_PRODUCTION && !IS_BUILD) {
    const pooled = process.env.POSTGRES_PRISMA_URL;
    if (!pooled) {
      throw new Error('POSTGRES_PRISMA_URL must be set in production (pooled Neon connection).');
    }
    return pooled;
  }
  return process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return new PrismaClient();
  }
  if (process.env.VERCEL || IS_PRODUCTION) {
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: client construction (and the env-var enforcement throw) is
// deferred until first property access. Lets `next build` import this module
// without DB credentials present.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = getClient() as unknown as Record<PropertyKey, unknown>;
    const value = c[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
});
