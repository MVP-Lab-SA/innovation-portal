import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aj.alqahtani@momah.gov.sa';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAuthAdmin() {
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!authBaseUrl) {
    console.warn('⚠️ NEON_AUTH_BASE_URL is not set; skipping auth account bootstrap.');
    return;
  }

  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const signUpUrl = `${authBaseUrl.replace(/\/$/, '')}/sign-up/email`;

  try {
    const response = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin,
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: 'المسؤول',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (/already exists|duplicate|already registered/i.test(body)) {
        console.log(`ℹ️ Auth account already exists for ${ADMIN_EMAIL}`);
        return;
      }
      throw new Error(`Auth signup failed (${response.status}): ${body}`);
    }

    console.log(`✅ Auth account created for ${ADMIN_EMAIL}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists|duplicate|already registered/i.test(message)) {
      console.log(`ℹ️ Auth account already exists for ${ADMIN_EMAIL}`);
      return;
    }
    throw error;
  }
}

async function markAuthAdminVerified() {
  const updated = await prisma.$executeRaw`
    UPDATE neon_auth."user"
    SET "emailVerified" = true
    WHERE lower(email) = lower(${ADMIN_EMAIL})
  `;
  if (updated > 0) {
    console.log(`✅ Auth account verified: ${ADMIN_EMAIL}`);
  } else {
    console.warn(`⚠️ Auth account not found to verify: ${ADMIN_EMAIL}`);
  }
}

const LOOKUPS: Record<string, string[]> = {
  Departments: ['الإدارة العليا', 'إدارة الابتكار', 'الإدارة المالية', 'الشؤون القانونية', 'الموارد البشرية', 'تقنية المعلومات', 'العلاقات العامة'],
  EmployeeStatus: ['نشط', 'إجازة', 'منتهي الخدمة'],
  InitiativeStatus: ['مقترحة', 'موافق عليها', 'قيد التنفيذ', 'مكتملة', 'متوقفة', 'ملغاة'],
  Priority: ['منخفضة', 'متوسطة', 'عالية', 'حرجة'],
  MilestoneStatus: ['مقررة', 'قيد التنفيذ', 'مكتملة', 'متأخرة', 'ملغاة'],
  TaskStatus: ['جديدة', 'قيد التنفيذ', 'بانتظار المراجعة', 'مكتملة', 'مؤجلة', 'ملغاة'],
  TaskPriority: ['منخفضة', 'متوسطة', 'عالية', 'عاجلة'],
  ExpertCategory: ['أكاديمي', 'تقني', 'استشاري', 'صناعي', 'حكومي', 'دولي'],
  ExpertStatus: ['نشط', 'غير نشط', 'متاح بطلب'],
  IdeaStage: ['جديدة', 'قيد المراجعة', 'تحت التقييم', 'موافق عليها', 'قيد التنفيذ', 'منفذة', 'مرفوضة'],
  IdeaCategory: ['البلديات', 'الإسكان', 'البيئة', 'الخدمات الرقمية', 'الاستدامة', 'الأمن والسلامة', 'التخطيط العمراني'],
  PilotStatus: ['مخطط لها', 'قيد التحضير', 'جارية', 'مكتملة', 'فاشلة', 'موقوفة'],
  SandboxStatus: ['قيد المراجعة الأولية', 'تحت التقييم الفني', 'بانتظار قرار اللجنة', 'موافق عليها', 'مرفوضة', 'سحب الطلب'],
  SandboxCategory: ['جديدة', 'متكررة'],
  SolutionDomain: ['الذكاء الاصطناعي', 'إنترنت الأشياء', 'البلوكتشين', 'الواقع المعزز/الافتراضي', 'الاتصالات', 'الحوسبة السحابية', 'الأمن السيبراني'],
  ProductMaturity: ['TRL 1-2 (فكرة/بحث)', 'TRL 3-4 (إثبات مفهوم)', 'TRL 5-6 (نموذج أولي)', 'TRL 7-8 (جاهز للسوق)', 'TRL 9 (مطبق تجارياً)'],
  Vision2030: ['اقتصاد مزدهر', 'مجتمع حيوي', 'وطن طموح', 'متعدد'],
  EvaluationStatus: ['جارية', 'مكتملة', 'معلقة', 'ملغاة'],
  EvaluationStage: ['تقييم أولي', 'تقييم فني', 'تقييم نهائي'],
  EventType: ['ورشة عمل', 'مؤتمر', 'هاكاثون', 'لقاء', 'ندوة', 'تدريب', 'معرض'],
  EventStatus: ['مخطط لها', 'قيد التحضير', 'جارية', 'منعقدة', 'ملغاة', 'مؤجلة'],
  ChallengeCategory: ['تقنية', 'بيئية', 'اجتماعية', 'اقتصادية', 'إدارية', 'استراتيجية'],
  ChallengeStatus: ['مخطط له', 'مفتوح', 'مغلق', 'تحت التقييم', 'منتهي', 'ملغى'],
  CemStatus: ['نشط', 'غير نشط', 'محجوب'],
  EducationLevel: ['ثانوي', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه'],
  PartnerType: ['حكومي', 'خاص', 'أكاديمي', 'غير ربحي', 'دولي'],
  PartnerCategory: ['استراتيجي', 'تشغيلي', 'محتمل', 'سابق'],
  PartnershipStatus: ['نشطة', 'موقوفة', 'منتهية', 'تحت التفاوض', 'ملغاة'],
  SponsorshipType: ['نقدية', 'عينية', 'خدمات', 'إعلامية'],
  SponsorshipTier: ['بلاتيني', 'ذهبي', 'فضي', 'برونزي', 'داعم'],
  SponsorshipStatus: ['نشطة', 'مكتملة', 'موقوفة', 'ملغاة'],
  InteractionType: ['اجتماع', 'مكالمة', 'بريد إلكتروني', 'زيارة ميدانية', 'تواصل اجتماعي'],
  PartnerRole: ['شريك ممول', 'شريك تقني', 'شريك تنفيذي', 'شريك معرفي', 'شريك إعلامي'],
  ExpertRole: ['مقيّم', 'محكّم', 'مستشار', 'موجه', 'متحدث'],
  AssignmentStatus: ['نشطة', 'مكتملة', 'ملغاة', 'معلقة'],
  ParticipationType: ['متحدث', 'حكم', 'مدرب', 'حضور', 'منظم'],
  DocumentType: ['سياسة', 'دليل إجراءات', 'تقرير', 'عرض تقديمي', 'دراسة', 'عقد/اتفاقية', 'محضر اجتماع', 'مذكرة'],
  DocumentStatus: ['نشطة', 'مؤرشفة', 'مسودة', 'تحت المراجعة'],
  RiskCategory: ['تقنية', 'مالية', 'بشرية', 'تنظيمية', 'استراتيجية', 'تشغيلية', 'قانونية', 'سمعة'],
  RiskLevel: ['حرج', 'عالٍ', 'متوسط', 'منخفض'],
  RiskStatus: ['مفتوحة', 'تحت المعالجة', 'مغلقة', 'مقبولة'],
  MetricCategory: ['كفاءة', 'فعالية', 'جودة', 'رضا', 'أثر', 'مالي'],
  MetricStatus: ['على المسار', 'في خطر', 'خارج المسار', 'تجاوز المستهدف'],
  MetricFrequency: ['يومي', 'أسبوعي', 'شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي'],
  CommunicationChannel: ['موقع إلكتروني', 'تويتر/X', 'لينكد إن', 'يوتيوب', 'البريد', 'الصحف', 'التلفزيون', 'الراديو'],
  CommunicationAudience: ['عامة', 'موظفون', 'شركاء', 'مستثمرون', 'إعلام', 'حكومي'],
  LinkRole: ['مرجع', 'دليل تنفيذ', 'إثبات', 'محضر', 'تقرير أداء', 'سياسة'],
  Country: ['السعودية', 'الإمارات', 'الكويت', 'البحرين', 'قطر', 'عمان', 'مصر', 'الأردن', 'أمريكا', 'بريطانيا', 'ألمانيا', 'سنغافورة', 'أخرى'],
  StrategicSourceType: ['رؤية وطنية', 'استراتيجية وزارية', 'تقرير دولي', 'دراسة بحثية', 'تحليل سوق'],
  StrategicRelevance: ['عالية جداً', 'عالية', 'متوسطة', 'منخفضة'],
};

async function seedRelationshipTables() {
  console.log('🌱 Seeding relationship & bridge tables...');

  // Get sample data from existing tables
  const ideas = await prisma.idea.findMany({ take: 10 });
  const experts = await prisma.expert.findMany({ take: 10 });
  const challenges = await prisma.challenge.findMany({ take: 5 });
  const events = await prisma.calendarEvent.findMany({ take: 5 });
  const employees = await prisma.employee.findMany({ take: 10 });
  const partners = await prisma.partner.findMany({ take: 8 });
  const initiatives = await prisma.initiative.findMany({ take: 10 });
  const documents = await prisma.document.findMany({ take: 10 });
  const risks = await prisma.risk.findMany({ take: 8 });
  const metrics = await prisma.outcomeMetric.findMany({ take: 10 });
  const communications = await prisma.communication.findMany({ take: 8 });

  // 1. EvalRubric - Create evaluation criteria
  const rubrics: Array<{ id: string; weight: number; criterionName: string }> = [];
  const rubricData = [
    { name: 'الجدوى الاقتصادية', weight: 25 },
    { name: 'التأثير الاجتماعي', weight: 20 },
    { name: 'الابتكار والتقنية', weight: 25 },
    { name: 'القابلية للتنفيذ', weight: 20 },
  ];

  for (const r of rubricData) {
    const createdRubric = await prisma.evalRubric.upsert({
      where: { code: `RUB-${rubrics.length + 1}` },
      update: {},
      create: {
        code: `RUB-${String(rubrics.length + 1).padStart(3, '0')}`,
        criterionName: r.name,
        criterionDesc: `معيار تقييم: ${r.name}`,
        weight: r.weight,
        scoreScale: '1-5',
        evaluationStage: 'تقييم أولي',
        active: true,
      },
    });
    rubrics.push({
      id: createdRubric.id,
      weight: Number(createdRubric.weight),
      criterionName: createdRubric.criterionName,
    });
  }
  console.log(`✅ Created ${rubrics.length} evaluation rubrics`);

  // 2. Evaluation + EvalScore - Link ideas to evaluations with rubric scores
  let evalCount = 0;
  for (let i = 0; i < Math.min(ideas.length, 5); i++) {
    const idea = ideas[i];
    const expert = experts[i % experts.length];
    const employee = employees[i % employees.length];

    const evaluation = await prisma.evaluation.upsert({
      where: { code: `EVL-${String(evalCount + 1).padStart(3, '0')}` },
      update: {},
      create: {
        code: `EVL-${String(evalCount + 1).padStart(3, '0')}`,
        ideaId: idea.id,
        expertId: expert?.id,
        leadEmployeeId: employee?.id,
        evaluationDate: new Date(Date.now() - Math.random() * 7776000000),
        overallScore: 3 + Math.random() * 2,
        status: 'مكتملة',
        recommendation: 'موصى به للتنفيذ',
        comments: `تقييم شامل للفكرة: ${idea.title}`,
      },
    });

    // Create scores for each rubric criterion
    for (const rubric of rubrics) {
      await prisma.evalScore.create({
        data: {
          evaluationId: evaluation.id,
          rubricId: rubric.id,
          rawScore: 3 + Math.random() * 2,
          weightedScore: (3 + Math.random() * 2) * (rubric.weight / 100),
          justification: `درجة قيمة للمعيار: ${rubric.criterionName}`,
        },
      });
    }
    evalCount++;
  }
  console.log(`✅ Created ${evalCount} evaluations with ${evalCount * rubrics.length} scores`);

  // 3. IdeaExpertAssignment - Link ideas to experts
  let ideaExpertCount = 0;
  for (let i = 0; i < Math.min(ideas.length, 8); i++) {
    const idea = ideas[i];
    for (let j = 0; j < 2 && j < experts.length; j++) {
      const expert = experts[(i * 2 + j) % experts.length];
      try {
        await prisma.ideaExpertAssignment.upsert({
          where: { ideaId_expertId: { ideaId: idea.id, expertId: expert.id } },
          update: {},
          create: {
            ideaId: idea.id,
            expertId: expert.id,
            assignmentRole: j === 0 ? 'مقيّم' : 'محكّم',
            status: 'نشطة',
            feedback: `ملاحظات حول الفكرة: ${idea.title.slice(0, 20)}...`,
          },
        });
        ideaExpertCount++;
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`✅ Created ${ideaExpertCount} idea-expert assignments`);

  // 4. ExpertChallengeAssignment - Link experts to challenges
  let expertChallengeCount = 0;
  for (let i = 0; i < challenges.length; i++) {
    const challenge = challenges[i];
    for (let j = 0; j < 2 && j < experts.length; j++) {
      const expert = experts[(i * 2 + j) % experts.length];
      try {
        await prisma.expertChallengeAssignment.upsert({
          where: { expertId_challengeId: { expertId: expert.id, challengeId: challenge.id } },
          update: {},
          create: {
            expertId: expert.id,
            challengeId: challenge.id,
            role: j === 0 ? 'حكم' : 'مستشار',
          },
        });
        expertChallengeCount++;
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`✅ Created ${expertChallengeCount} expert-challenge assignments`);

  // 5. ExpertEventParticipation - Link experts to events
  let expertEventCount = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    for (let j = 0; j < 3 && j < experts.length; j++) {
      const expert = experts[(i * 3 + j) % experts.length];
      try {
        await prisma.expertEventParticipation.upsert({
          where: { expertId_eventId: { expertId: expert.id, eventId: event.id } },
          update: {},
          create: {
            expertId: expert.id,
            eventId: event.id,
            participationType: j === 0 ? 'متحدث' : j === 1 ? 'حكم' : 'حضور',
          },
        });
        expertEventCount++;
      } catch (e) {
        // skip
      }
    }
  }
  console.log(`✅ Created ${expertEventCount} expert-event participations`);

  // 6. ExpertInitiativeContribution - Link experts to initiatives
  let expertInitCount = 0;
  for (let i = 0; i < Math.min(initiatives.length, 6); i++) {
    const initiative = initiatives[i];
    for (let j = 0; j < 2 && j < experts.length; j++) {
      const expert = experts[(i * 2 + j) % experts.length];
      try {
        await prisma.expertInitiativeContribution.upsert({
          where: { expertId_initiativeId: { expertId: expert.id, initiativeId: initiative.id } },
          update: {},
          create: {
            expertId: expert.id,
            initiativeId: initiative.id,
            contributionType: 'مستشار فني',
            startDate: new Date(Date.now() - 86400000 * 30),
          },
        });
        expertInitCount++;
      } catch (e) {
        // skip
      }
    }
  }
  console.log(`✅ Created ${expertInitCount} expert-initiative contributions`);

  // 7. EventEmployeeParticipation - Link employees to events
  let eventEmployeeCount = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    for (let j = 0; j < 3 && j < employees.length; j++) {
      const employee = employees[(i * 3 + j) % employees.length];
      try {
        await prisma.eventEmployeeParticipation.upsert({
          where: { eventId_employeeId: { eventId: event.id, employeeId: employee.id } },
          update: {},
          create: {
            eventId: event.id,
            employeeId: employee.id,
            role: j === 0 ? 'منظم' : 'حضور',
          },
        });
        eventEmployeeCount++;
      } catch (e) {
        // skip
      }
    }
  }
  console.log(`✅ Created ${eventEmployeeCount} event-employee participations`);

  // 8. InitiativePartner - Link initiatives to partners
  let initPartnerCount = 0;
  for (let i = 0; i < Math.min(initiatives.length, 8); i++) {
    const initiative = initiatives[i];
    for (let j = 0; j < 2 && j < partners.length; j++) {
      const partner = partners[(i * 2 + j) % partners.length];
      try {
        await prisma.initiativePartner.upsert({
          where: { initiativeId_partnerId: { initiativeId: initiative.id, partnerId: partner.id } },
          update: {},
          create: {
            initiativeId: initiative.id,
            partnerId: partner.id,
            role: j === 0 ? 'شريك ممول' : 'شريك تقني',
            contribution: 'دعم فني وتمويلي',
            startDate: new Date(Date.now() - 86400000 * 60),
          },
        });
        initPartnerCount++;
      } catch (e) {
        // skip
      }
    }
  }
  console.log(`✅ Created ${initPartnerCount} initiative-partner links`);

  // 9. DocumentLink - Link documents to initiatives/ideas
  let docLinkCount = 0;
  for (let i = 0; i < Math.min(documents.length, 8); i++) {
    const doc = documents[i];
    const initiative = initiatives[i % initiatives.length];
    try {
      await prisma.documentLink.create({
        data: {
          documentId: doc.id,
          linkedEntity: 'INITIATIVE',
          initiativeId: initiative.id,
          linkRole: 'دليل تنفيذ',
        },
      });
      docLinkCount++;
    } catch (e) {
      // skip
    }
  }
  console.log(`✅ Created ${docLinkCount} document links`);

  // 10. RiskLink - Link risks to initiatives
  let riskLinkCount = 0;
  for (let i = 0; i < Math.min(risks.length, 6); i++) {
    const risk = risks[i];
    const initiative = initiatives[i % initiatives.length];
    try {
      await prisma.riskLink.create({
        data: {
          riskId: risk.id,
          linkedEntity: 'INITIATIVE',
          initiativeId: initiative.id,
          linkRole: 'مخاطر مرتبطة',
        },
      });
      riskLinkCount++;
    } catch (e) {
      // skip
    }
  }
  console.log(`✅ Created ${riskLinkCount} risk links`);

  // 11. MetricLink - Link metrics to initiatives
  let metricLinkCount = 0;
  for (let i = 0; i < Math.min(metrics.length, 8); i++) {
    const metric = metrics[i];
    const initiative = initiatives[i % initiatives.length];
    try {
      await prisma.metricLink.create({
        data: {
          metricId: metric.id,
          linkedEntity: 'INITIATIVE',
          initiativeId: initiative.id,
          linkRole: 'مؤشر أداء',
        },
      });
      metricLinkCount++;
    } catch (e) {
      // skip
    }
  }
  console.log(`✅ Created ${metricLinkCount} metric links`);

  // 12. CommunicationLink - Link communications to initiatives
  let commLinkCount = 0;
  for (let i = 0; i < Math.min(communications.length, 8); i++) {
    const comm = communications[i];
    const initiative = initiatives[i % initiatives.length];
    try {
      await prisma.communicationLink.create({
        data: {
          communicationId: comm.id,
          linkedEntity: 'INITIATIVE',
          initiativeId: initiative.id,
          linkRole: 'إعلام وتواصل',
        },
      });
      commLinkCount++;
    } catch (e) {
      // skip
    }
  }
  console.log(`✅ Created ${commLinkCount} communication links`);

  // 13. PartnerInteraction - Create interaction records for partners
  let partnerInteractionCount = 0;
  for (let i = 0; i < Math.min(partners.length, 8); i++) {
    const partner = partners[i];
    const types = ['اجتماع', 'مكالمة', 'بريد إلكتروني', 'زيارة ميدانية'];
    try {
      await prisma.partnerInteraction.create({
        data: {
          code: `INT-${String(partnerInteractionCount + 1).padStart(3, '0')}`,
          partnerId: partner.id,
          interactionType: types[i % types.length],
          subject: `تفاعل مع الشريك: ${partner.partnerName}`,
          summary: `نقاش حول التعاون والفرص المستقبلية`,
          outcome: 'موافقة على خطة العمل',
          followUpDate: new Date(Date.now() + 86400000 * 7),
        },
      });
      partnerInteractionCount++;
    } catch (e) {
      // skip
    }
  }
  console.log(`✅ Created ${partnerInteractionCount} partner interactions`);
}

async function main() {
  console.log('🌱 Seeding lookups...');
  
  let total = 0;
  for (const [category, values] of Object.entries(LOOKUPS)) {
    for (let i = 0; i < values.length; i++) {
      await prisma.lookup.upsert({
        where: { category_value: { category, value: values[i] } },
        update: { displayOrder: i, active: true },
        create: { category, value: values[i], displayOrder: i, active: true },
      });
      total++;
    }
  }
  
  console.log(`✅ Seeded ${total} lookup values across ${Object.keys(LOOKUPS).length} categories`);

  await seedAuthAdmin();
  await markAuthAdminVerified();
  
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', active: true },
    create: {
      email: ADMIN_EMAIL,
      name: 'المسؤول',
      role: 'ADMIN',
      active: true,
    },
  });
  console.log(`✅ Admin user prepared: ${ADMIN_EMAIL}`);

  // Seed relationship tables with relevant data
  await seedRelationshipTables();
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
