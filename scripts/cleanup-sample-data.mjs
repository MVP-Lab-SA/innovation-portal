/**
 * One-shot cleanup: remove the older sample/duplicate rows that predate
 * the template imports, keeping only the freshly imported real data.
 *
 *   Keeps the newest 47 sandbox applications, 51 experts, 6 initiatives.
 *   Deletes everything older (45 sandbox, 30 experts, 35 initiatives).
 *
 * Usage:
 *   node scripts/cleanup-sample-data.mjs --confirm
 *
 * Destructive — requires the explicit --confirm flag. Requires DB access.
 */
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const confirmed = process.argv.includes('--confirm');

// Newest N rows to KEEP per entity (the real imported data).
const KEEP = { sandboxApplication: 47, expert: 51, initiative: 6 };

async function oldestIds(model, keep) {
  const all = await prisma[model].findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return all.slice(0, Math.max(0, all.length - keep)).map((r) => r.id);
}

async function main() {
  const sandboxIds = await oldestIds('sandboxApplication', KEEP.sandboxApplication);
  const expertIds = await oldestIds('expert', KEEP.expert);
  const initiativeIds = await oldestIds('initiative', KEEP.initiative);

  console.log('Will delete:');
  console.log(`  sandbox applications: ${sandboxIds.length}`);
  console.log(`  experts: ${expertIds.length} (+ their assignments & opinions)`);
  console.log(`  initiatives: ${initiativeIds.length} (+ their milestones, cascade)`);

  if (!confirmed) {
    console.log('\n⚠  Dry run. Re-run with --confirm to actually delete.');
    return;
  }

  // Sandbox — leaf table, nothing references it.
  const sb = await prisma.sandboxApplication.deleteMany({ where: { id: { in: sandboxIds } } });
  console.log(`🗑  Deleted ${sb.count} sandbox applications`);

  // Experts — required-FK bridge rows must go first (no cascade).
  if (expertIds.length) {
    const w = { where: { expertId: { in: expertIds } } };
    await prisma.expertOpinion.deleteMany(w);
    await prisma.ideaExpertAssignment.deleteMany(w);
    await prisma.expertChallengeAssignment.deleteMany(w);
    await prisma.expertEventParticipation.deleteMany(w);
    await prisma.expertInitiativeContribution.deleteMany(w);
  }
  const ex = await prisma.expert.deleteMany({ where: { id: { in: expertIds } } });
  console.log(`🗑  Deleted ${ex.count} experts`);

  // Initiatives — milestones & partners cascade; tasks/links set null.
  const ini = await prisma.initiative.deleteMany({ where: { id: { in: initiativeIds } } });
  console.log(`🗑  Deleted ${ini.count} initiatives`);

  console.log('\n✅ Cleanup complete. The DB now holds only the imported real data.');
}

main()
  .catch((e) => { console.error('❌ Cleanup failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
