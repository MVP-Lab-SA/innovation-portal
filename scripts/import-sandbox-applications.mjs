/**
 * Import sandbox-environment join requests from the ministry Excel sheet.
 *
 * Usage:
 *   node scripts/import-sandbox-applications.mjs ["path/to/file.xlsx"]
 *
 * Idempotent: aborts if SandboxApplication rows already exist (pass
 * --force to append). Requires DB access — POSTGRES_PRISMA_URL from .env.local.
 */
import nextEnv from '@next/env';
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const DEFAULT_FILE =
  'C:/Users/alqah/Downloads/طلبات الانضمام إلى البيئة التجريبية 13052026 v 2.0.xlsx';

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
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // Row 0 is the header; a data row must carry an entity name + solution name.
  const dataRows = rows.slice(1).filter((r) => clean(r[1]) && clean(r[13]));
  console.log(`   ${dataRows.length} data rows`);

  const existing = await prisma.sandboxApplication.count();
  if (existing > 0 && !force) {
    console.error(`✋ ${existing} SandboxApplication rows already exist. Re-run with --force to append.`);
    process.exit(1);
  }

  let base = await nextCodeBase('sandboxApplication', 'SBX');
  let created = 0;

  for (const r of dataRows) {
    base += 1;
    await prisma.sandboxApplication.create({
      data: {
        code: `SBX-${String(base).padStart(3, '0')}`,
        entityName: clean(r[1]) || 'غير محدد',
        commercialRegistration: clean(r[2]),
        city: clean(r[3]),
        websites: clean(r[4]),
        country: clean(r[6]) || clean(r[5]),
        entityType: clean(r[7]),
        responsibleName: clean(r[8]),
        jobTitle: clean(r[9]),
        contactEmail: clean(r[10]),
        contactPhone: clean(r[11]),
        requestNature: clean(r[12]),
        solutionName: clean(r[13]) || 'غير محدد',
        solutionDescription: clean(r[14]),
        problemStatement: clean(r[15]),
        productMaturity: clean(r[16]),
        solutionDomain: clean(r[17]),
        otherSector: clean(r[18]),
        isRegulated: clean(r[19]),
        hasConflictingRegulations: clean(r[20]),
        conflictingRegulationDetails: clean(r[21]),
        overlapsGovEntities: clean(r[22]),
        businessPlanFile: clean(r[23]),
        scalingStrategy: clean(r[24]),
        expectedOutcomes: clean(r[25]),
        successKpis: clean(r[26]),
        postTrialLicensesNeeded: clean(r[27]),
        proposedTrialLocation: clean(r[28]),
        useCases: clean(r[29]),
        targetCustomers: clean(r[30]),
        proposedTimeline: clean(r[31]),
        identifiedRisks: clean(r[32]),
        needsData: clean(r[33]),
        needsIntegration: clean(r[34]),
        needsRegulatoryException: clean(r[35]),
        expectedImpact: [clean(r[36]), clean(r[37])].filter(Boolean).join(' — ') || null,
        vision2030Alignment: [clean(r[38]), clean(r[39])].filter(Boolean).join(' — ') || null,
        update1: clean(r[40]),
        update2: clean(r[41]),
        applicationStatus: clean(r[40]) ? 'تم الرد عليها' : 'قيد المراجعة الأولية',
      },
    });
    created += 1;
  }
  console.log(`✅ Created ${created} sandbox applications`);
}

main()
  .catch((e) => { console.error('❌ Import failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
