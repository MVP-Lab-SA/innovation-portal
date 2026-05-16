/**
 * Import initiatives + their milestones from the innovation-department
 * tracking workbook (the "المبادرات" sheet — one milestone per row, with
 * the initiative name carried forward across its group of rows).
 *
 * Usage:
 *   node scripts/import-initiatives.mjs ["path/to/file.xlsx"]
 *
 * Dedupe-by-name: an initiative whose name already exists is skipped, so
 * the script is safe to re-run and won't clash with seeded sample data.
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
  const f = fs.readdirSync(dir).find((n) => n.includes('متابعة') && n.includes('الابتكار') && n.endsWith('.xlsx'));
  if (!f) { console.error('✋ No tracking workbook found in Downloads — pass a path.'); process.exit(1); }
  filePath = path.join(dir, f);
}

const clean = (v) => {
  if (v == null) return null;
  const s = String(v).replace(/\r/g, '').trim();
  return s.length ? s : null;
};
// Excel serial date → JS Date (null if not a valid serial).
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
  console.log(`📄 Reading: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => n.trim() === 'المبادرات') || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
  // Row 0 = title, row 1 = header, data from row 2.
  const dataRows = rows.slice(2);

  // Group consecutive rows by the carried-forward initiative name (col 4).
  const groups = [];
  let cur = null;
  for (const r of dataRows) {
    const initName = clean(r[4]);
    if (initName) {
      cur = { name: initName, category: clean(r[2]), department: clean(r[9]),
              update1: clean(r[10]), update2: clean(r[11]), update3: clean(r[12]),
              notes: clean(r[14]), milestones: [] };
      groups.push(cur);
    }
    if (!cur) continue;
    const msName = clean(r[5]);
    if (msName) {
      cur.milestones.push({
        name: msName,
        dueDate: excelDate(r[6]),
        status: clean(r[7]),
        progress: Number.isFinite(Number(r[8])) ? Math.round(Number(r[8])) : null,
      });
    }
  }
  console.log(`   ${groups.length} initiatives, ${groups.reduce((s, g) => s + g.milestones.length, 0)} milestones`);

  let iniBase = await nextCodeBase('initiative', 'INI');
  let milBase = await nextCodeBase('milestone', 'MIL');
  let createdInit = 0, createdMs = 0, skipped = 0;

  for (const g of groups) {
    const existing = await prisma.initiative.findFirst({ where: { name: g.name } });
    if (existing) { skipped += 1; continue; }
    iniBase += 1;
    const initiative = await prisma.initiative.create({
      data: {
        code: `INI-${String(iniBase).padStart(3, '0')}`,
        name: g.name,
        category: g.category,
        department: g.department,
        status: 'قيد التنفيذ',
        update1: g.update1,
        update2: g.update2,
        update3: g.update3,
        notes: g.notes,
      },
    });
    createdInit += 1;
    for (const m of g.milestones) {
      milBase += 1;
      await prisma.milestone.create({
        data: {
          code: `MIL-${String(milBase).padStart(3, '0')}`,
          name: m.name,
          status: m.status,
          progress: m.progress,
          dueDate: m.dueDate,
          initiativeId: initiative.id,
        },
      });
      createdMs += 1;
    }
  }
  console.log(`✅ Created ${createdInit} initiatives, ${createdMs} milestones (${skipped} initiatives already existed, skipped)`);
}

main()
  .catch((e) => { console.error('❌ Import failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
