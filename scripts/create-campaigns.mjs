/**
 * Create the 4 recommended campaigns and link them to their business
 * challenges (the 15 main challenges, M:N via CampaignBusinessChallenge).
 *
 * Usage:
 *   node scripts/create-campaigns.mjs
 *
 * Idempotent: a campaign whose title already exists is skipped. Linking a
 * challenge also advances its status to «محوّل إلى حملة» (the same rule
 * runWorkflow applies for in-app links). Requires DB access (.env.local).
 */
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const CAMPAIGNS = [
  {
    title: 'البحث والتطوير — مواد ونمذجة تصريف مياه الأمطار',
    description: 'موجة بحث وتطوير بالشراكة مع الجامعات ومراكز البحث لمعالجة تحديات المواد والنماذج الهيدرولوجية وقدرات الفحص لشبكات تصريف مياه الأمطار.',
    track: 'بحث وتطوير',
    deliveryMethod: 'دعوة مباشرة',
    category: 'بيئية',
    challenges: ['BCH-001', 'BCH-006', 'BCH-026', 'BCH-041', 'BCH-021'],
  },
  {
    title: 'هاكاثون الرصد والإنذار المبكر للسيول',
    description: 'هاكاثون عام لحلول الاستشعار ولوحات الرقابة الذكية وأنظمة الإنذار المبكر وإعادة استخدام مياه الأمطار.',
    track: 'ابتكار',
    deliveryMethod: 'هاكاثون عام',
    category: 'تقنية',
    challenges: ['BCH-016', 'BCH-031', 'BCH-011', 'BCH-036'],
  },
  {
    title: 'الطرق الذكية والتحول الرقمي',
    description: 'موجة ابتكار لمنظومات الطرق الذكية وربطها بمركز موحد لإدارة الحركة المرورية وحماية أصول الطرق.',
    track: 'ابتكار',
    deliveryMethod: 'هاكاثون عام',
    category: 'تقنية',
    challenges: ['BCH-046', 'BCH-071', 'BCH-061'],
  },
  {
    title: 'السلامة المرورية وجودة الطرق',
    description: 'تحدٍ مفتوح لمعالجة سلامة الطرق وجودة موادها وكفاءة الفحوصات المخبرية.',
    track: 'ابتكار',
    deliveryMethod: 'تحدٍ مفتوح',
    category: 'إدارية',
    challenges: ['BCH-051', 'BCH-056', 'BCH-066'],
  },
];

// Planning-stub campaigns for sectors not yet covered by business
// challenges. Created as «مخطط له» with no links — they fill once that
// sector's challenges are imported. Not dummy data: real roadmap items.
const FUTURE_CAMPAIGNS = [
  {
    title: 'حملة ابتكار قطاع الإسكان',
    description: 'حملة مخطط لها لقطاع الإسكان — بانتظار حصر وتعريف تحديات الأعمال الخاصة بالقطاع وربطها.',
    category: 'اجتماعية',
  },
  {
    title: 'حملة الخدمات البلدية الذكية',
    description: 'حملة مخطط لها للخدمات البلدية — بانتظار حصر وتعريف تحديات الأعمال الخاصة بالقطاع وربطها.',
    category: 'إدارية',
  },
  {
    title: 'حملة الاستدامة البيئية والمدن الخضراء',
    description: 'حملة مخطط لها للاستدامة البيئية — بانتظار حصر وتعريف تحديات الأعمال الخاصة بالقطاع وربطها.',
    category: 'بيئية',
  },
];

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
  let base = await nextCodeBase('campaign', 'CHL');
  let created = 0, links = 0, advanced = 0;

  for (const c of CAMPAIGNS) {
    const existing = await prisma.campaign.findFirst({ where: { title: c.title } });
    if (existing) { console.log(`• skip (already exists): ${c.title}`); continue; }

    base += 1;
    const campaign = await prisma.campaign.create({
      data: {
        code: `CHL-${String(base).padStart(3, '0')}`,
        title: c.title,
        description: c.description,
        track: c.track,
        deliveryMethod: c.deliveryMethod,
        category: c.category,
        status: 'مخطط له',
      },
    });
    created += 1;
    console.log(`+ ${campaign.code} — ${c.title}`);

    for (const bcCode of c.challenges) {
      const bc = await prisma.businessChallenge.findUnique({ where: { code: bcCode } });
      if (!bc) { console.warn(`  ⚠ business challenge not found: ${bcCode}`); continue; }
      await prisma.campaignBusinessChallenge.create({
        data: { campaignId: campaign.id, businessChallengeId: bc.id },
      });
      links += 1;
      if (bc.status == null || bc.status === 'مفتوح' || bc.status === 'قيد الدراسة') {
        await prisma.businessChallenge.update({
          where: { id: bc.id },
          data: { status: 'محوّل إلى حملة' },
        });
        advanced += 1;
      }
    }
  }

  // Planning-stub campaigns for future sectors (no links yet).
  let futures = 0;
  for (const c of FUTURE_CAMPAIGNS) {
    const existing = await prisma.campaign.findFirst({ where: { title: c.title } });
    if (existing) { console.log(`• skip (already exists): ${c.title}`); continue; }
    base += 1;
    const campaign = await prisma.campaign.create({
      data: {
        code: `CHL-${String(base).padStart(3, '0')}`,
        title: c.title,
        description: c.description,
        category: c.category,
        status: 'مخطط له',
      },
    });
    futures += 1;
    console.log(`+ ${campaign.code} — ${c.title}  (planning stub)`);
  }

  console.log(`\n✅ ${created} campaigns created, ${links} challenge links, ${advanced} challenges advanced to «محوّل إلى حملة».`);
  console.log(`   ${futures} planning-stub campaigns created for future sectors (no links yet).`);
  console.log('   Set launch/closing dates and prize amounts in the app.');
}

main()
  .catch((e) => { console.error('❌ Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
