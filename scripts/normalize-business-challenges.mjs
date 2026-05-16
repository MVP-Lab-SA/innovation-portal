/**
 * Clean up imported Business Challenge data.
 *
 * Usage:
 *   node scripts/normalize-business-challenges.mjs
 *
 * What it does (idempotent — safe to re-run):
 *  1. Normalises `priority` to the standard Priority lookup values:
 *     عالي / مرتفع → عالية,  متوسط → متوسطة,  منخفض → منخفضة.
 *  2. Seeds the BusinessChallengeStatus lifecycle lookup and the
 *     CampaignMethod lookup (هاكاثون عام / مغلق / تحدٍ مفتوح / …).
 *
 * Requires DB access — POSTGRES_PRISMA_URL is read from .env.local.
 */
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const PRIORITY_MAP = {
  'عالي': 'عالية',
  'مرتفع': 'عالية',
  'متوسط': 'متوسطة',
  'منخفض': 'منخفضة',
};

const LOOKUPS = {
  BusinessChallengeStatus: ['مفتوح', 'قيد الدراسة', 'محوّل إلى حملة', 'محوّل إلى فكرة', 'مغلق', 'مؤجل'],
  CampaignMethod: ['هاكاثون عام', 'هاكاثون مغلق', 'تحدٍ مفتوح', 'مسابقة', 'ورشة عمل', 'دعوة مباشرة'],
};

async function main() {
  // --- 1. Normalise priority ---------------------------------------------
  let priorityUpdates = 0;
  for (const [from, to] of Object.entries(PRIORITY_MAP)) {
    const res = await prisma.businessChallenge.updateMany({
      where: { priority: from },
      data: { priority: to },
    });
    if (res.count) {
      console.log(`   priority "${from}" → "${to}": ${res.count} rows`);
      priorityUpdates += res.count;
    }
  }
  console.log(`✅ Normalised priority on ${priorityUpdates} rows`);

  // --- 2. Seed lookups (status lifecycle + campaign methods) -------------
  for (const [category, values] of Object.entries(LOOKUPS)) {
    let added = 0;
    for (const value of values) {
      const exists = await prisma.lookup.findFirst({ where: { category, value } });
      if (!exists) {
        await prisma.lookup.create({ data: { category, value } });
        added += 1;
      }
    }
    console.log(`🏷  ${category} lookup: ${added} new value(s)`);
  }

  console.log('🎉 Normalisation complete.');
}

main()
  .catch((e) => {
    console.error('❌ Normalisation failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
