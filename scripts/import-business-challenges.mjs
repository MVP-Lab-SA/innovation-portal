/**
 * Import "Business Challenges & Opportunities" from the ministry Excel sheet.
 *
 * Usage:
 *   node scripts/import-business-challenges.mjs ["path/to/file.xlsx"]
 *
 * What it does:
 *  1. Reads Sheet2 (20 columns, hierarchical via التسلسل: "1" -> "1.1"/"1.2").
 *  2. Upserts a StrategicSource per distinct «مصدر التحدي» value.
 *  3. Creates one BusinessChallenge per data row (codes BCH-001..).
 *  4. Wires the self-referential parent (sub-rows "1.x" -> main row "1").
 *  5. Seeds BusinessChallengeStatus / BusinessChallengeDomain lookups.
 *
 * Idempotency: aborts if BusinessChallenge rows already exist (pass --force
 * to override and append).
 *
 * Requires DB access — POSTGRES_PRISMA_URL is read from .env.local.
 */
import { loadEnvConfig } from '@next/env';
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const DEFAULT_FILE =
  'C:/Users/alqah/Downloads/قاعدة بيانات تحديات وكالة الوزارة للمشاريع والصحة العامة 12042026 v 1.0.xlsx';

const args = process.argv.slice(2);
const force = args.includes('--force');
const filePath = args.find((a) => !a.startsWith('--')) || DEFAULT_FILE;

const clean = (v) => {
  if (v == null) return null;
  const s = String(v).replace(/\r/g, '').trim();
  return s.length ? s : null;
};

async function nextCodeBase(model, prefix) {
  const rows = await prisma[model].findMany({ select: { code: true } });
  let max = 0;
  for (const r of rows) {
    const m = new RegExp(`^${prefix}-(\\d+)$`).exec(r.code || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

async function main() {
  console.log(`📄 Reading: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames.includes('Sheet2') ? 'Sheet2' : wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const dataRows = rows.slice(1).filter((r) => clean(r[3])); // must have a title
  console.log(`   ${dataRows.length} data rows`);

  const existing = await prisma.businessChallenge.count();
  if (existing > 0 && !force) {
    console.error(
      `✋ ${existing} BusinessChallenge rows already exist. Re-run with --force to append.`,
    );
    process.exit(1);
  }

  // --- 1. Strategic sources ---------------------------------------------
  let strBase = await nextCodeBase('strategicSource', 'STR');
  const sourceCache = new Map();
  async function resolveSource(name) {
    const n = clean(name);
    if (!n) return null;
    if (sourceCache.has(n)) return sourceCache.get(n);
    let s = await prisma.strategicSource.findFirst({ where: { sourceName: n } });
    if (!s) {
      strBase += 1;
      s = await prisma.strategicSource.create({
        data: {
          code: `STR-${String(strBase).padStart(3, '0')}`,
          sourceName: n,
          sourceType: 'استراتيجية وطنية',
          relevance: 'عالية',
        },
      });
      console.log(`   + StrategicSource ${s.code} — ${n.slice(0, 50)}`);
    }
    sourceCache.set(n, s.id);
    return s.id;
  }

  // --- 2. Business challenges (pass 1: create) --------------------------
  let bchBase = await nextCodeBase('businessChallenge', 'BCH');
  const bySequence = new Map(); // sequence string -> { id, parentSeq }
  const statuses = new Set();
  const domains = new Set();
  let created = 0;

  for (const r of dataRows) {
    const seq = clean(r[0]);
    const strategicSourceId = await resolveSource(r[1]);
    const status = clean(r[17]);
    const domain = clean(r[7]);
    if (status) statuses.add(status);
    if (domain) domains.add(domain);

    bchBase += 1;
    const code = `BCH-${String(bchBase).padStart(3, '0')}`;
    const rec = await prisma.businessChallenge.create({
      data: {
        code,
        sequence: seq,
        title: clean(r[3]),
        owner: clean(r[2]),
        classification: clean(r[4]),
        stakeholders: clean(r[5]),
        challengeType: clean(r[6]),
        domain,
        subDomain: clean(r[8]),
        service: clean(r[9]),
        definingElements: clean(r[10]),
        impact: clean(r[11]),
        priority: clean(r[12]),
        focusQuestions: clean(r[13]),
        proposals: clean(r[14]),
        proposalType: clean(r[15]),
        innovationOpportunity: clean(r[16]),
        status: status || 'مفتوح',
        track: clean(r[18]),
        presentationFile: clean(r[19]),
        strategicSourceId,
      },
    });
    created += 1;
    if (seq) {
      const parentSeq = seq.includes('.') ? seq.slice(0, seq.lastIndexOf('.')) : null;
      bySequence.set(seq, { id: rec.id, parentSeq });
    }
  }
  console.log(`✅ Created ${created} business challenges`);

  // --- 3. Wire parent hierarchy (pass 2) --------------------------------
  let linked = 0;
  for (const [seq, { id, parentSeq }] of bySequence) {
    if (!parentSeq) continue;
    const parent = bySequence.get(parentSeq);
    if (parent) {
      await prisma.businessChallenge.update({ where: { id }, data: { parentId: parent.id } });
      linked += 1;
    } else {
      console.warn(`   ⚠ no parent "${parentSeq}" for sequence "${seq}"`);
    }
  }
  console.log(`🔗 Linked ${linked} sub-challenges to parents`);

  // --- 4. Seed lookups --------------------------------------------------
  async function seedLookup(category, values) {
    for (const value of values) {
      const exists = await prisma.lookup.findFirst({ where: { category, value } });
      if (!exists) await prisma.lookup.create({ data: { category, value } });
    }
  }
  await seedLookup('BusinessChallengeStatus', [...statuses]);
  await seedLookup('BusinessChallengeDomain', [...domains]);
  console.log(
    `🏷  Lookups: ${statuses.size} statuses, ${domains.size} domains`,
  );

  console.log('🎉 Import complete.');
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
