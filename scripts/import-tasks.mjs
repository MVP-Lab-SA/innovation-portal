/**
 * (1) Fill the missing initiative departments, and
 * (2) import the «المهام» sheet from the dept-tracking workbook into Task
 *     records, keyword-linked to the 6 initiatives where possible.
 *
 * Usage:
 *   node scripts/import-tasks.mjs ["path/to/file.xlsx"]
 *
 * The «المهام» sheet has no initiative FK column, so linking is a
 * best-effort keyword match on the task text; unmatched tasks are
 * created unlinked. Idempotent: a task whose title already exists is
 * skipped. Requires DB access (.env.local).
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

const PARENT_DEPARTMENT = 'الإدارة العامة للابتكار وحلول الأعمال';

const args = process.argv.slice(2);
let filePath = args.find((a) => !a.startsWith('--'));
if (!filePath) {
  const dir = path.join(os.homedir(), 'Downloads');
  const f = fs.readdirSync(dir).find((n) => n.includes('متابعة') && n.endsWith('.xlsx'));
  if (!f) { console.error('✋ No tracking workbook found in Downloads — pass a path.'); process.exit(1); }
  filePath = path.join(dir, f);
}

const clean = (v) => {
  if (v == null) return null;
  const s = String(v).replace(/\r/g, '').trim();
  return s.length ? s : null;
};
const excelDate = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null;
  return new Date(Date.UTC(1899, 11, 30) + n * 86400000);
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
  // --- 1. Fill missing initiative departments --------------------------
  const fixed = await prisma.initiative.updateMany({
    where: { OR: [{ department: null }, { department: '' }] },
    data: { department: PARENT_DEPARTMENT },
  });
  console.log(`🏛  Filled department on ${fixed.count} initiatives → «${PARENT_DEPARTMENT}»`);

  // --- 2. Import tasks from the «المهام» sheet -------------------------
  console.log(`📄 Reading: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.SheetNames.find((n) => n.trim() === 'المهام');
  if (!sheet) { console.error('✋ No «المهام» sheet found.'); process.exit(1); }
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' });
  // Header is on row 5; task detail lives in column 3.
  const dataRows = rows.slice(6).filter((r) => Number.isFinite(Number(r[0])) && clean(r[3]));
  console.log(`   ${dataRows.length} task rows`);

  // Keyword → initiative map (the sheet has no FK column).
  const inits = await prisma.initiative.findMany({ select: { id: true, name: true } });
  const byName = (sub) => inits.find((i) => i.name.includes(sub))?.id ?? null;
  const M = {
    hackathon: byName('هاكاثون'),
    sandbox: byName('SandBox'),
    fund: byName('صندوق'),
    research: byName('الشراكات البحثية'),
    platform: byName('منصة الابتكار'),
    thirdSector: byName('غير الربحية') || byName('الحلول الابتكارية'),
  };
  const classify = (t) => {
    if (/هاكاثون/.test(t)) return M.hackathon;
    if (/ساندبوكس|sandbox|بيئة تجريبية|البيئة التجريبية/i.test(t)) return M.sandbox;
    if (/صندوق/.test(t)) return M.fund;
    if (/غير ربحية|غير الربحية|القطاع الثالث|منظمات غير/.test(t)) return M.thirdSector;
    if (/بحثي|البحث والتطوير|جامعة/.test(t)) return M.research;
    if (/منصة|Matchmaker/i.test(t)) return M.platform;
    return null;
  };

  let base = await nextCodeBase('task', 'TSK');
  let created = 0, linked = 0, skipped = 0;

  for (const r of dataRows) {
    const title = clean(r[3]);
    const existing = await prisma.task.findFirst({ where: { title } });
    if (existing) { skipped += 1; continue; }
    const initiativeId = classify(title);
    if (initiativeId) linked += 1;
    base += 1;
    const note = [clean(r[8]), clean(r[9]), clean(r[10]), clean(r[12])].filter(Boolean).join(' | ');
    await prisma.task.create({
      data: {
        code: `TSK-${String(base).padStart(3, '0')}`,
        title,
        description: note || null,
        status: clean(r[5]) || 'جديدة',
        dueDate: excelDate(r[4]),
        initiativeId,
      },
    });
    created += 1;
  }
  console.log(`✅ Created ${created} tasks (${linked} linked to an initiative, ${created - linked} unlinked, ${skipped} already existed)`);
}

main()
  .catch((e) => { console.error('❌ Import failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
