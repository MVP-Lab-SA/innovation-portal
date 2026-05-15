import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  
  // Create first admin user (will need to log in via Google first)
  const adminEmail = process.env.ADMIN_EMAIL || 'qahtani1979@gmail.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', active: true },
    create: {
      email: adminEmail,
      name: 'المسؤول',
      role: 'ADMIN',
      active: true,
    },
  });
  console.log(`✅ Admin user prepared: ${adminEmail}`);
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
