import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Resolves the database URL from Vercel's auto-injected variables.
 * Vercel Postgres (Neon) integration provides multiple variants:
 *   - POSTGRES_PRISMA_URL (pooled, recommended for Prisma)
 *   - POSTGRES_URL_NON_POOLING (direct, for migrations)
 *   - DATABASE_URL (generic, may or may not be pooled)
 */
function getDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL
  );
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    // Defer errors to runtime when DB is actually used
    // This allows builds to succeed even without DB configured yet
    console.warn('⚠️  No DATABASE_URL configured. Database features will fail at runtime.');
    return new PrismaClient();
  }

  // Use Neon adapter in production for serverless compatibility
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaNeon(pool);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('Failed to initialize Neon adapter, falling back to default Prisma:', e);
      return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    }
  }

  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
