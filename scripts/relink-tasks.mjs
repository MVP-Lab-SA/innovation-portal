/**
 * Re-link already-imported tasks to their initiative using the «المهام»
 * sheet's group structure: a row with a marker in column 1 is a group
 * header; rows under it (blank marker) inherit the header's theme.
 *
 *   link = classify(task's own text)  ||  classify(its group header)
 *
 * Usage:
 *   node scripts/relink-tasks.mjs ["path/to/file.xlsx"]
 *
 * Idempotent — only updates Task.initiativeId; safe to re-run.
 * Requires DB access (.env.local).
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

async function main() {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.SheetNames.find((n) => n.trim() === 'المهام');
  if (!sheet) { console.error('✋ No «المهام» sheet found.'); process.exit(1); }
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' });

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
    if (!t) return null;
    if (/هاكاثون|هاكثون/.test(t)) return M.hackathon;
    if (/ساندبوكس|sandbox|بيئة تجريبية|البيئة التجريبية/i.test(t)) return M.sandbox;
    if (/صندوق/.test(t)) return M.fund;
    if (/القطاع الثالث|غير ربحية|غير الربحية|منظمات غير/.test(t)) return M.thirdSector;
    if (/بحثي|البحث والتطوير|جامعة|مذكرة التفاهم|R&D/i.test(t)) return M.research;
    if (/منصة|matchmak/i.test(t)) return M.platform;
    return null;
  };

  // Walk the sheet: header rows (marker in col 1) set the current group.
  let group = null;
  let updated = 0, linked = 0, cleared = 0;
  for (const r of rows.slice(6)) {
    if (!Number.isFinite(Number(r[0]))) continue;
    const title = clean(r[3]);
    if (!title) continue;
    const isHeader = !!clean(r[1]);
    const own = classify(title);
    if (isHeader) group = own; // a new group starts (theme may be null)
    const initiativeId = own || group;

    const res = await prisma.task.updateMany({ where: { title }, data: { initiativeId } });
    if (res.count) {
      updated += res.count;
      if (initiativeId) linked += res.count; else cleared += res.count;
    }
  }
  console.log(`✅ Re-linked ${updated} tasks — ${linked} attached to an initiative, ${cleared} left unlinked.`);
}

main()
  .catch((e) => { console.error('❌ Re-link failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
