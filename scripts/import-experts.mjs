/**
 * Import the experts list — and, where the row carries rubric scores,
 * the matching ExpertOpinion evaluation.
 *
 * Usage:
 *   node scripts/import-experts.mjs ["path/to/file.xlsx"]
 *
 * If no path is given the script looks for a file containing "خبراء"
 * in the user's Downloads folder. Idempotent: aborts if Expert rows
 * already exist (pass --force). Requires DB access (.env.local).
 */
import nextEnv from '@next/env';
import XLSX from 'xlsx';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const force = args.includes('--force');
let filePath = args.find((a) => !a.startsWith('--'));
if (!filePath) {
  const dir = path.join(os.homedir(), 'Downloads');
  const f = fs.readdirSync(dir).find((n) => n.includes('خبراء') && n.endsWith('.xlsx'));
  if (!f) { console.error('✋ No experts .xlsx found in Downloads — pass a path.'); process.exit(1); }
  filePath = path.join(dir, f);
}

const clean = (v) => {
  if (v == null) return null;
  const s = String(v).replace(/\r/g, '').replace(/\n/g, ' ').trim();
  return s.length ? s : null;
};
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
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

// Rubric weights (sum = 1) — relevance / depth / applicability / neutrality / consistency.
const WEIGHTS = [0.3, 0.25, 0.2, 0.15, 0.1];

async function main() {
  console.log(`📄 Reading: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames.includes('List') ? 'List' : wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const dataRows = rows.slice(1).filter((r) => clean(r[1]));
  console.log(`   ${dataRows.length} expert rows`);

  const existing = await prisma.expert.count();
  if (existing > 0 && !force) {
    console.error(`✋ ${existing} Expert rows already exist. Re-run with --force to append.`);
    process.exit(1);
  }

  let smeBase = await nextCodeBase('expert', 'SME');
  let exoBase = await nextCodeBase('expertOpinion', 'EXO');
  let experts = 0;
  let opinions = 0;

  for (const r of dataRows) {
    smeBase += 1;
    const expert = await prisma.expert.create({
      data: {
        code: `SME-${String(smeBase).padStart(3, '0')}`,
        fullName: clean(r[1]) || 'غير محدد',
        jobTitle: clean(r[2]),
        organization: clean(r[3]),
        agency: clean(r[4]),
        department: clean(r[5]),
        specialization: clean(r[6]),
        bio: clean(r[7]),
        yearsExperience: num(r[8]) ? Math.round(num(r[8])) : null,
        linkedInUrl: clean(r[9]),
        category: clean(r[10]),
        email: clean(r[12]),
        phone: r[13] != null && String(r[13]).trim() ? String(r[13]).trim() : null,
        status: 'نشط',
      },
    });
    experts += 1;

    // Rubric scores (cols 14-18). If any are filled, record an ExpertOpinion.
    const scores = [r[14], r[15], r[16], r[17], r[18]].map(num);
    if (scores.some((s) => s != null)) {
      const finalScore =
        scores.reduce((sum, s, i) => sum + (s || 0) * WEIGHTS[i], 0);
      exoBase += 1;
      await prisma.expertOpinion.create({
        data: {
          code: `EXO-${String(exoBase).padStart(3, '0')}`,
          expertId: expert.id,
          subject: 'تقييم مرئيات الخبير',
          relevanceScore: scores[0],
          depthScore: scores[1],
          applicabilityScore: scores[2],
          neutralityScore: scores[3],
          consistencyScore: scores[4],
          finalScore: Math.round(finalScore * 100) / 100,
          recommendation: clean(r[19]),
          visualizationGrade: clean(r[20]),
        },
      });
      opinions += 1;
    }
  }
  console.log(`✅ Created ${experts} experts, ${opinions} expert opinions`);
}

main()
  .catch((e) => { console.error('❌ Import failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
