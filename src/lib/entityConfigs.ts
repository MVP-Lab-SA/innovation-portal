import { z } from 'zod';
import type { FieldConfig } from '@/components/forms/EntityForm';

export interface EntityConfig {
  slug: string;
  arabicName: string;
  description: string;
  icon?: string;
  listColumns: { key: string; label: string; type?: any }[];
  formFields: FieldConfig[];
}

export interface EntityValidation {
  writableFields: string[];
  sortableFields: string[];
  filterableFields: string[];
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  employees: {
    slug: 'employees',
    arabicName: 'الموظفون',
    description: 'إدارة بيانات الموظفين',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'fullName', label: 'الاسم الكامل' },
      { key: 'jobTitle', label: 'المسمى الوظيفي' },
      { key: 'department', label: 'الإدارة', type: 'badge' },
      { key: 'email', label: 'البريد الإلكتروني' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'fullName', label: 'الاسم الكامل', required: true },
      { key: 'jobTitle', label: 'المسمى الوظيفي' },
      { key: 'department', label: 'الإدارة', lookupCategory: 'Departments' },
      { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'phone', label: 'الجوال', type: 'tel' },
      { key: 'hireDate', label: 'تاريخ التعيين', type: 'date' },
      { key: 'status', label: 'الحالة', lookupCategory: 'EmployeeStatus' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },
  
  initiatives: {
    slug: 'initiatives',
    arabicName: 'المبادرات',
    description: 'إدارة المبادرات الاستراتيجية',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'name', label: 'اسم المبادرة' },
      { key: 'category', label: 'الفئة', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'priority', label: 'الأولوية', type: 'badge' },
      { key: 'progress', label: 'التقدم %' },
      { key: 'budgetSar', label: 'الميزانية', type: 'currency' },
    ],
    formFields: [
      { key: 'name', label: 'اسم المبادرة', required: true, cols: 2 },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'category', label: 'الفئة', lookupCategory: 'IdeaCategory' },
      { key: 'status', label: 'الحالة', lookupCategory: 'InitiativeStatus' },
      { key: 'priority', label: 'الأولوية', lookupCategory: 'Priority' },
      { key: 'progress', label: 'التقدم (0-100)', type: 'number' },
      { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
      { key: 'endDate', label: 'تاريخ الانتهاء', type: 'date' },
      { key: 'budgetSar', label: 'الميزانية (ر.س)', type: 'currency' },
      { key: 'actualSpendSar', label: 'الإنفاق الفعلي (ر.س)', type: 'currency' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },
  
  ideas: {
    slug: 'ideas',
    arabicName: 'الأفكار',
    description: 'إدارة الأفكار المقدّمة',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'الفكرة' },
      { key: 'category', label: 'القطاع', type: 'badge' },
      { key: 'stage', label: 'المرحلة', type: 'status' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'submissionDate', label: 'التاريخ', type: 'date' },
    ],
    formFields: [
      { key: 'title', label: 'عنوان الفكرة', required: true, cols: 2 },
      { key: 'description', label: 'وصف الفكرة', type: 'textarea', cols: 2 },
      { key: 'category', label: 'القطاع', lookupCategory: 'IdeaCategory' },
      { key: 'stage', label: 'المرحلة', lookupCategory: 'IdeaStage' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['جديدة', 'موافق عليها', 'مرفوضة'] },
      { key: 'submissionDate', label: 'تاريخ التقديم', type: 'date' },
      { key: 'reviewer', label: 'المراجع' },
      { key: 'impactExpected', label: 'الأثر المتوقع', type: 'textarea', cols: 2 },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },
  
  'sandbox-applications': {
    slug: 'sandbox-applications',
    arabicName: 'طلبات الساندبوكس',
    description: 'إدارة طلبات البيئة التجريبية',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'solutionName', label: 'اسم المشروع' },
      { key: 'entityName', label: 'الجهة' },
      { key: 'solutionDomain', label: 'المجال', type: 'badge' },
      { key: 'applicationStatus', label: 'الحالة', type: 'status' },
      { key: 'submissionDate', label: 'التقديم', type: 'date' },
    ],
    formFields: [
      { key: 'solutionName', label: 'اسم الحل/المشروع', required: true, cols: 2 },
      { key: 'entityName', label: 'اسم الجهة', required: true },
      { key: 'entityType', label: 'نوع الجهة', lookupCategory: 'PartnerType' },
      { key: 'responsibleName', label: 'اسم المسؤول' },
      { key: 'jobTitle', label: 'المسمى الوظيفي' },
      { key: 'contactEmail', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'contactPhone', label: 'الجوال', type: 'tel' },
      { key: 'solutionDescription', label: 'وصف الحل', type: 'textarea', cols: 2 },
      { key: 'problemStatement', label: 'بيان المشكلة', type: 'textarea', cols: 2 },
      { key: 'solutionDomain', label: 'مجال الحل', lookupCategory: 'SolutionDomain' },
      { key: 'productMaturity', label: 'مرحلة جاهزية المنتج', lookupCategory: 'ProductMaturity' },
      { key: 'vision2030Alignment', label: 'التوافق مع رؤية 2030', lookupCategory: 'Vision2030' },
      { key: 'applicationStatus', label: 'حالة الطلب', lookupCategory: 'SandboxStatus' },
      { key: 'applicationCategory', label: 'تصنيف الطلب', lookupCategory: 'SandboxCategory' },
      { key: 'submissionDate', label: 'تاريخ التقديم', type: 'date' },
      { key: 'scalingStrategy', label: 'استراتيجية التوسع', type: 'textarea', cols: 2 },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },
  
  pilots: {
    slug: 'pilots',
    arabicName: 'التجارب التشغيلية',
    description: 'إدارة التجارب الميدانية',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'name', label: 'اسم التجربة' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'startDate', label: 'البدء', type: 'date' },
      { key: 'budgetSar', label: 'الميزانية', type: 'currency' },
    ],
    formFields: [
      { key: 'name', label: 'اسم التجربة', required: true, cols: 2 },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'status', label: 'الحالة', lookupCategory: 'PilotStatus' },
      { key: 'budgetSar', label: 'الميزانية (ر.س)', type: 'currency' },
      { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
      { key: 'endDate', label: 'تاريخ الانتهاء', type: 'date' },
      { key: 'successCriteria', label: 'معايير النجاح', type: 'textarea', cols: 2 },
      { key: 'outcome', label: 'النتيجة', type: 'textarea', cols: 2 },
    ],
  },
  
  'business-challenges': {
    slug: 'business-challenges',
    arabicName: 'التحديات وفرص الأعمال',
    description: 'التحديات والفرص الاستراتيجية التي تُشتق منها الهاكاثونات والأفكار',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'sequence', label: 'التسلسل', type: 'badge' },
      { key: 'title', label: 'التحدي' },
      { key: 'domain', label: 'المجال', type: 'badge' },
      { key: 'priority', label: 'الأولوية', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'sequence', label: 'التسلسل', helperText: 'مثال: 1 أو 1.2' },
      { key: 'title', label: 'عنوان التحدي', required: true, cols: 2 },
      { key: 'owner', label: 'مالك التحدي' },
      { key: 'classification', label: 'تصنيف التحدي', type: 'select', options: ['رئيسي', 'فرعي'] },
      { key: 'parentId', label: 'التحدي الرئيسي', helperText: 'BCH-... للتحديات الفرعية' },
      { key: 'strategicSourceId', label: 'مصدر التحدي', helperText: 'STR-... أو معرّف المصدر الاستراتيجي' },
      { key: 'challengeType', label: 'نوع التحدي', helperText: 'مثال: تقني / بحثي' },
      { key: 'domain', label: 'مجال التحدي' },
      { key: 'subDomain', label: 'المجال الفرعي' },
      { key: 'service', label: 'الخدمة' },
      { key: 'priority', label: 'مستوى الأولوية', lookupCategory: 'Priority' },
      { key: 'status', label: 'حالة التحدي', lookupCategory: 'BusinessChallengeStatus' },
      { key: 'track', label: 'مسار التحدي' },
      { key: 'proposalType', label: 'تصنيف المقترحات' },
      { key: 'stakeholders', label: 'أصحاب المصلحة', type: 'textarea', cols: 2 },
      { key: 'definingElements', label: 'العناصر التعريفية', type: 'textarea', cols: 2 },
      { key: 'impact', label: 'أثر التحدي', type: 'textarea', cols: 2 },
      { key: 'focusQuestions', label: 'أسئلة تركيز الجهد', type: 'textarea', cols: 2 },
      { key: 'proposals', label: 'مقترحات تركيز الجهد', type: 'textarea', cols: 2 },
      { key: 'innovationOpportunity', label: 'الفرصة الابتكارية', type: 'textarea', cols: 2 },
      { key: 'presentationFile', label: 'ملف العرض', type: 'file', cols: 2 },
    ],
  },

  challenges: {
    slug: 'challenges',
    arabicName: 'الهاكاثونات والمسابقات',
    description: 'إدارة الهاكاثونات والمسابقات المشتقة من تحديات الأعمال',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'العنوان' },
      { key: 'category', label: 'الفئة', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'launchDate', label: 'الإطلاق', type: 'date' },
      { key: 'prizeAmount', label: 'الجائزة', type: 'currency' },
    ],
    formFields: [
      { key: 'title', label: 'العنوان', required: true, cols: 2 },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'businessChallengeId', label: 'تحدي الأعمال المرتبط', helperText: 'BCH-... التحدي الذي اشتُقت منه المسابقة' },
      { key: 'category', label: 'الفئة', lookupCategory: 'ChallengeCategory' },
      { key: 'status', label: 'الحالة', lookupCategory: 'ChallengeStatus' },
      { key: 'launchDate', label: 'تاريخ الإطلاق', type: 'date' },
      { key: 'closingDate', label: 'تاريخ الإغلاق', type: 'date' },
      { key: 'prizeAmount', label: 'قيمة الجائزة (ر.س)', type: 'currency' },
      { key: 'expectedOutcome', label: 'النتيجة المتوقعة', type: 'textarea', cols: 2 },
    ],
  },
  
  partners: {
    slug: 'partners',
    arabicName: 'الشركاء',
    description: 'إدارة الشركاء والجهات الخارجية',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'partnerName', label: 'الشريك' },
      { key: 'partnerType', label: 'النوع', type: 'badge' },
      { key: 'partnershipStatus', label: 'الحالة', type: 'status' },
      { key: 'contactEmail', label: 'البريد' },
    ],
    formFields: [
      { key: 'partnerName', label: 'اسم الشريك', required: true, cols: 2 },
      { key: 'partnerType', label: 'النوع', lookupCategory: 'PartnerType' },
      { key: 'partnerCategory', label: 'الفئة', lookupCategory: 'PartnerCategory' },
      { key: 'partnershipStatus', label: 'الحالة', lookupCategory: 'PartnershipStatus' },
      { key: 'contactName', label: 'اسم جهة الاتصال' },
      { key: 'contactEmail', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'contactPhone', label: 'الجوال', type: 'tel' },
      { key: 'country', label: 'الدولة', lookupCategory: 'Country' },
      { key: 'city', label: 'المدينة' },
      { key: 'website', label: 'الموقع الإلكتروني', type: 'url' },
      { key: 'agreementStartDate', label: 'بدء الاتفاقية', type: 'date' },
      { key: 'agreementEndDate', label: 'انتهاء الاتفاقية', type: 'date' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },
  
  experts: {
    slug: 'experts',
    arabicName: 'الخبراء',
    description: 'إدارة شبكة الخبراء',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'fullName', label: 'الاسم' },
      { key: 'category', label: 'الفئة', type: 'badge' },
      { key: 'specialization', label: 'التخصص' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'fullName', label: 'الاسم الكامل', required: true, cols: 2 },
      { key: 'category', label: 'فئة الخبير', lookupCategory: 'ExpertCategory' },
      { key: 'specialization', label: 'التخصص' },
      { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'phone', label: 'الجوال', type: 'tel' },
      { key: 'organization', label: 'المؤسسة' },
      { key: 'jobTitle', label: 'المسمى الوظيفي' },
      { key: 'country', label: 'الدولة', lookupCategory: 'Country' },
      { key: 'city', label: 'المدينة' },
      { key: 'cvUrl', label: 'السيرة الذاتية', type: 'file' },
      { key: 'linkedInUrl', label: 'LinkedIn', type: 'url' },
      { key: 'status', label: 'الحالة', lookupCategory: 'ExpertStatus' },
      { key: 'bio', label: 'نبذة', type: 'textarea', cols: 2 },
    ],
  },
  
  cems: {
    slug: 'cems',
    arabicName: 'المبتكرون',
    description: 'إدارة بيانات المبتكرين والأفراد',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'fullName', label: 'الاسم' },
      { key: 'jobTitle', label: 'المسمى' },
      { key: 'innovationField', label: 'مجال الابتكار', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'fullName', label: 'الاسم الكامل', required: true, cols: 2 },
      { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'phone', label: 'الجوال', type: 'tel' },
      { key: 'city', label: 'المدينة' },
      { key: 'educationLevel', label: 'المؤهل', lookupCategory: 'EducationLevel' },
      { key: 'jobTitle', label: 'المسمى الوظيفي' },
      { key: 'organization', label: 'المؤسسة' },
      { key: 'innovationField', label: 'مجال الابتكار', lookupCategory: 'IdeaCategory' },
      { key: 'status', label: 'الحالة', lookupCategory: 'CemStatus' },
    ],
  },
  
  risks: {
    slug: 'risks',
    arabicName: 'سجل المخاطر',
    description: 'إدارة وتتبع المخاطر',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'وصف المخاطرة' },
      { key: 'category', label: 'الفئة', type: 'badge' },
      { key: 'riskLevel', label: 'المستوى', type: 'status' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'title', label: 'وصف المخاطرة', required: true, cols: 2 },
      { key: 'description', label: 'تفاصيل', type: 'textarea', cols: 2 },
      { key: 'category', label: 'الفئة', lookupCategory: 'RiskCategory' },
      { key: 'likelihood', label: 'الاحتمالية (1-5)', type: 'number' },
      { key: 'impact', label: 'الأثر (1-5)', type: 'number' },
      { key: 'riskLevel', label: 'مستوى المخاطرة', lookupCategory: 'RiskLevel' },
      { key: 'status', label: 'الحالة', lookupCategory: 'RiskStatus' },
      { key: 'mitigationPlan', label: 'خطة المعالجة', type: 'textarea', cols: 2 },
      { key: 'identifiedDate', label: 'تاريخ الاكتشاف', type: 'date' },
      { key: 'reviewDate', label: 'تاريخ المراجعة', type: 'date' },
    ],
  },
  
  metrics: {
    slug: 'metrics',
    arabicName: 'المؤشرات',
    description: 'مؤشرات الأداء والنتائج',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'metricName', label: 'اسم المؤشر' },
      { key: 'category', label: 'الفئة', type: 'badge' },
      { key: 'targetValue', label: 'المستهدف' },
      { key: 'currentValue', label: 'الحالي' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'metricName', label: 'اسم المؤشر', required: true, cols: 2 },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'category', label: 'الفئة', lookupCategory: 'MetricCategory' },
      { key: 'unit', label: 'وحدة القياس' },
      { key: 'targetValue', label: 'القيمة المستهدفة', type: 'number' },
      { key: 'currentValue', label: 'القيمة الحالية', type: 'number' },
      { key: 'status', label: 'الحالة', lookupCategory: 'MetricStatus' },
      { key: 'frequency', label: 'التكرار', lookupCategory: 'MetricFrequency' },
      { key: 'measurementDate', label: 'تاريخ القياس', type: 'date' },
    ],
  },
  
  communications: {
    slug: 'communications',
    arabicName: 'التواصل والإعلام',
    description: 'إدارة الحملات الإعلامية',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'العنوان' },
      { key: 'channel', label: 'القناة', type: 'badge' },
      { key: 'publishDate', label: 'النشر', type: 'date' },
      { key: 'reach', label: 'الوصول' },
    ],
    formFields: [
      { key: 'title', label: 'عنوان الاتصال', required: true, cols: 2 },
      { key: 'channel', label: 'القناة', lookupCategory: 'CommunicationChannel' },
      { key: 'audience', label: 'الجمهور المستهدف', lookupCategory: 'CommunicationAudience' },
      { key: 'publishDate', label: 'تاريخ النشر', type: 'date' },
      { key: 'reach', label: 'الوصول', type: 'number' },
      { key: 'engagement', label: 'التفاعل', type: 'number' },
      { key: 'url', label: 'الرابط', type: 'url' },
      { key: 'content', label: 'المحتوى', type: 'textarea', cols: 2 },
    ],
  },
  
  documents: {
    slug: 'documents',
    arabicName: 'الوثائق',
    description: 'إدارة الوثائق والملفات',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'العنوان' },
      { key: 'documentType', label: 'النوع', type: 'badge' },
      { key: 'version', label: 'الإصدار' },
      { key: 'uploadDate', label: 'الرفع', type: 'date' },
    ],
    formFields: [
      { key: 'title', label: 'عنوان الوثيقة', required: true, cols: 2 },
      { key: 'documentType', label: 'النوع', lookupCategory: 'DocumentType' },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'fileUrl', label: 'الملف', type: 'file', cols: 2 },
      { key: 'version', label: 'الإصدار' },
      { key: 'status', label: 'الحالة', lookupCategory: 'DocumentStatus' },
    ],
  },

  milestones: {
    slug: 'milestones',
    arabicName: 'المراحل الرئيسية',
    description: 'مراحل تنفيذ المبادرات',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'name', label: 'الاسم' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'progress', label: 'التقدم %' },
      { key: 'dueDate', label: 'الاستحقاق', type: 'date' },
    ],
    formFields: [
      { key: 'initiativeId', label: 'معرّف المبادرة (INI-...)', required: true, helperText: 'الصق ID المبادرة المرتبطة' },
      { key: 'name', label: 'اسم المرحلة', required: true },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'status', label: 'الحالة', lookupCategory: 'MilestoneStatus' },
      { key: 'progress', label: 'التقدم (0-100)', type: 'number' },
      { key: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date' },
      { key: 'completedDate', label: 'تاريخ الإنجاز', type: 'date' },
    ],
  },

  tasks: {
    slug: 'tasks',
    arabicName: 'المهام',
    description: 'مهام المبادرات والفرق',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'العنوان' },
      { key: 'priority', label: 'الأولوية', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'dueDate', label: 'الاستحقاق', type: 'date' },
    ],
    formFields: [
      { key: 'title', label: 'عنوان المهمة', required: true, cols: 2 },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'initiativeId', label: 'معرّف المبادرة (اختياري)', helperText: 'INI-... إن كانت مرتبطة' },
      { key: 'assigneeId', label: 'معرّف المسؤول (اختياري)', helperText: 'EMP-... إن كان مسنداً' },
      { key: 'priority', label: 'الأولوية', lookupCategory: 'Priority' },
      { key: 'status', label: 'الحالة', lookupCategory: 'TaskStatus' },
      { key: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date' },
      { key: 'completedAt', label: 'تاريخ الإنجاز', type: 'date' },
    ],
  },

  evaluations: {
    slug: 'evaluations',
    arabicName: 'التقييمات',
    description: 'تقييمات الأفكار والمشاريع',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'overallScore', label: 'الدرجة' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'evaluationDate', label: 'التاريخ', type: 'date' },
    ],
    formFields: [
      { key: 'ideaId', label: 'معرّف الفكرة (اختياري)', helperText: 'IDE-... إن كان التقييم لفكرة' },
      { key: 'expertId', label: 'معرّف الخبير (اختياري)', helperText: 'SME-...' },
      { key: 'leadEmployeeId', label: 'معرّف القائد (اختياري)', helperText: 'EMP-...' },
      { key: 'evaluationDate', label: 'تاريخ التقييم', type: 'date' },
      { key: 'overallScore', label: 'الدرجة الكلية', type: 'number' },
      { key: 'status', label: 'الحالة', lookupCategory: 'EvaluationStatus' },
      { key: 'recommendation', label: 'التوصية', type: 'textarea', cols: 2 },
      { key: 'comments', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },

  'eval-rubrics': {
    slug: 'eval-rubrics',
    arabicName: 'معايير التقييم',
    description: 'تعريف معايير ودرجات التقييم',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'criterionName', label: 'المعيار' },
      { key: 'weight', label: 'الوزن' },
      { key: 'evaluationStage', label: 'المرحلة', type: 'badge' },
      { key: 'active', label: 'مفعّل' },
    ],
    formFields: [
      { key: 'criterionName', label: 'اسم المعيار', required: true, cols: 2 },
      { key: 'criterionDesc', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'weight', label: 'الوزن (0-1)', type: 'number', required: true },
      { key: 'scoreScale', label: 'مقياس الدرجات' },
      { key: 'evaluationStage', label: 'مرحلة التقييم', lookupCategory: 'EvaluationStage' },
    ],
  },

  sponsorships: {
    slug: 'sponsorships',
    arabicName: 'الرعايات',
    description: 'إدارة رعايات الشركاء',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'sponsorshipTier', label: 'المستوى', type: 'badge' },
      { key: 'totalValueSar', label: 'القيمة', type: 'currency' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'startDate', label: 'البدء', type: 'date' },
    ],
    formFields: [
      { key: 'partnerId', label: 'معرّف الشريك', required: true, helperText: 'PRT-...' },
      { key: 'sponsorshipType', label: 'نوع الرعاية', lookupCategory: 'SponsorshipType' },
      { key: 'sponsorshipTier', label: 'المستوى', lookupCategory: 'SponsorshipTier' },
      { key: 'cashValueSar', label: 'القيمة النقدية (ر.س)', type: 'currency' },
      { key: 'inKindValueSar', label: 'القيمة العينية (ر.س)', type: 'currency' },
      { key: 'servicesValueSar', label: 'قيمة الخدمات (ر.س)', type: 'currency' },
      { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
      { key: 'endDate', label: 'تاريخ الانتهاء', type: 'date' },
      { key: 'status', label: 'الحالة', lookupCategory: 'SponsorshipStatus' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },

  'partner-interactions': {
    slug: 'partner-interactions',
    arabicName: 'تفاعلات الشركاء',
    description: 'سجل اللقاءات والتواصل مع الشركاء',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'interactionType', label: 'النوع', type: 'badge' },
      { key: 'subject', label: 'الموضوع' },
      { key: 'interactionDate', label: 'التاريخ', type: 'date' },
    ],
    formFields: [
      { key: 'partnerId', label: 'معرّف الشريك', required: true, helperText: 'PRT-...' },
      { key: 'interactionType', label: 'نوع التفاعل', lookupCategory: 'InteractionType' },
      { key: 'interactionDate', label: 'تاريخ التفاعل', type: 'date', required: true },
      { key: 'subject', label: 'الموضوع', cols: 2 },
      { key: 'summary', label: 'الملخص', type: 'textarea', cols: 2 },
      { key: 'outcome', label: 'النتيجة', type: 'textarea', cols: 2 },
      { key: 'followUpDate', label: 'تاريخ المتابعة', type: 'date' },
    ],
  },

  'calendar-events': {
    slug: 'calendar-events',
    arabicName: 'الفعاليات',
    description: 'تقويم الفعاليات والاجتماعات',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'title', label: 'العنوان' },
      { key: 'eventType', label: 'النوع', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
      { key: 'startDate', label: 'التاريخ', type: 'date' },
    ],
    formFields: [
      { key: 'title', label: 'عنوان الفعالية', required: true, cols: 2 },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'eventType', label: 'نوع الفعالية', lookupCategory: 'EventType' },
      { key: 'startDate', label: 'البدء', type: 'date', required: true },
      { key: 'endDate', label: 'الانتهاء', type: 'date' },
      { key: 'location', label: 'الموقع' },
      { key: 'status', label: 'الحالة', lookupCategory: 'EventStatus' },
      { key: 'attendeeCount', label: 'عدد الحضور', type: 'number' },
      { key: 'outcomes', label: 'النتائج', type: 'textarea', cols: 2 },
    ],
  },

  'strategic-sources': {
    slug: 'strategic-sources',
    arabicName: 'المصادر الاستراتيجية',
    description: 'المصادر التي تُبنى عليها التحديات',
    listColumns: [
      { key: 'code', label: 'المعرّف', type: 'badge' },
      { key: 'sourceName', label: 'المصدر' },
      { key: 'sourceType', label: 'النوع', type: 'badge' },
      { key: 'relevance', label: 'الأهمية' },
    ],
    formFields: [
      { key: 'sourceName', label: 'اسم المصدر', required: true, cols: 2 },
      { key: 'sourceType', label: 'النوع', lookupCategory: 'StrategicSourceType' },
      { key: 'description', label: 'الوصف', type: 'textarea', cols: 2 },
      { key: 'url', label: 'الرابط', type: 'url', cols: 2 },
      { key: 'publicationDate', label: 'تاريخ النشر', type: 'date' },
      { key: 'relevance', label: 'الأهمية' },
    ],
  },

  'idea-expert-assignments': {
    slug: 'idea-expert-assignments',
    arabicName: 'إسناد الخبراء للأفكار',
    description: 'ربط الخبراء بالأفكار للتقييم',
    listColumns: [
      { key: 'ideaId', label: 'الفكرة' },
      { key: 'expertId', label: 'الخبير' },
      { key: 'assignmentRole', label: 'الدور', type: 'badge' },
      { key: 'status', label: 'الحالة', type: 'status' },
    ],
    formFields: [
      { key: 'ideaId', label: 'معرّف الفكرة', required: true, helperText: 'IDE-... أو معرّف السجل' },
      { key: 'expertId', label: 'معرّف الخبير', required: true, helperText: 'SME-... أو معرّف السجل' },
      { key: 'assignmentRole', label: 'الدور', lookupCategory: 'ExpertRole' },
      { key: 'status', label: 'الحالة', lookupCategory: 'AssignmentStatus' },
      { key: 'feedback', label: 'ملاحظات', type: 'textarea', cols: 2 },
    ],
  },

  'initiative-partners': {
    slug: 'initiative-partners',
    arabicName: 'شركاء المبادرات',
    description: 'ربط الشركاء بالمبادرات',
    listColumns: [
      { key: 'initiativeId', label: 'المبادرة' },
      { key: 'partnerId', label: 'الشريك' },
      { key: 'role', label: 'الدور', type: 'badge' },
    ],
    formFields: [
      { key: 'initiativeId', label: 'معرّف المبادرة', required: true, helperText: 'INI-... أو معرّف السجل' },
      { key: 'partnerId', label: 'معرّف الشريك', required: true, helperText: 'PRT-... أو معرّف السجل' },
      { key: 'role', label: 'الدور', lookupCategory: 'PartnerRole' },
      { key: 'contribution', label: 'المساهمة', type: 'textarea', cols: 2 },
      { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
      { key: 'endDate', label: 'تاريخ الانتهاء', type: 'date' },
    ],
  },

  'expert-challenge-assignments': {
    slug: 'expert-challenge-assignments',
    arabicName: 'إسناد الخبراء للتحديات',
    description: 'ربط الخبراء بالتحديات',
    listColumns: [
      { key: 'expertId', label: 'الخبير' },
      { key: 'challengeId', label: 'التحدي' },
      { key: 'role', label: 'الدور', type: 'badge' },
    ],
    formFields: [
      { key: 'expertId', label: 'معرّف الخبير', required: true, helperText: 'SME-... أو معرّف السجل' },
      { key: 'challengeId', label: 'معرّف التحدي', required: true, helperText: 'CHL-... أو معرّف السجل' },
      { key: 'role', label: 'الدور', lookupCategory: 'ExpertRole' },
    ],
  },
};

export const ENTITY_SLUGS = Object.keys(ENTITY_CONFIGS);

// ============================================================
// Validation: per-entity writable/sortable/filterable whitelists
// + permissive-by-shape Zod schemas (strict() rejects unknown keys,
// which is the mass-assignment defense).
// ============================================================

const SAFE_SYSTEM_SORT_FIELDS = ['id', 'code', 'createdAt', 'updatedAt'];

function buildValidation(config: EntityConfig): EntityValidation {
  const writable = config.formFields.map(f => f.key);
  const requiredKeys = config.formFields.filter(f => f.required).map(f => f.key);

  // Permissive value-shape: unknown values are accepted (the crud layer will
  // coerce dates/empty strings). Strict() ensures unknown KEYS are rejected.
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of config.formFields) shape[f.key] = z.unknown().optional();
  // 'code' is allowed (server may generate; harmless if client omits or supplies)
  shape['code'] = z.unknown().optional();

  const baseSchema = z.object(shape).strict();
  const createSchema = baseSchema.superRefine((data, ctx) => {
    for (const key of requiredKeys) {
      const v = (data as Record<string, unknown>)[key];
      if (v === undefined || v === null || v === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required` });
      }
    }
  });

  const listKeys = config.listColumns.map(c => c.key);
  return {
    writableFields: writable,
    sortableFields: Array.from(new Set([...SAFE_SYSTEM_SORT_FIELDS, ...listKeys])),
    filterableFields: Array.from(new Set([...listKeys, 'status', 'category', 'stage'])),
    createSchema,
    updateSchema: baseSchema,
  };
}

// Entities that are routed through generic CRUD but have no formFields
// (managed by their own admin pages). Define minimal writable schemas
// so writes go through validation rather than being open.
const VALIDATION_OVERRIDES: Record<string, EntityValidation> = {
  users: {
    writableFields: ['name', 'image', 'role', 'active'],
    sortableFields: ['id', 'email', 'name', 'role', 'createdAt', 'lastLoginAt'],
    filterableFields: ['role', 'active', 'email'],
    createSchema: z.object({
      email: z.string().email(),
      name: z.string().optional(),
      image: z.string().url().optional(),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
      active: z.boolean().optional(),
    }).strict(),
    updateSchema: z.object({
      name: z.string().optional(),
      image: z.string().url().nullable().optional(),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
      active: z.boolean().optional(),
    }).strict(),
  },
  lookups: {
    writableFields: ['category', 'value', 'displayOrder', 'active', 'metadata'],
    sortableFields: ['id', 'category', 'value', 'displayOrder'],
    filterableFields: ['category', 'active'],
    createSchema: z.object({
      category: z.string().min(1),
      value: z.string().min(1),
      displayOrder: z.coerce.number().int().optional(),
      active: z.boolean().optional(),
      metadata: z.unknown().optional(),
    }).strict(),
    updateSchema: z.object({
      category: z.string().min(1).optional(),
      value: z.string().min(1).optional(),
      displayOrder: z.coerce.number().int().optional(),
      active: z.boolean().optional(),
      metadata: z.unknown().optional(),
    }).strict(),
  },
  // Audit log: read-only at the API layer. Writes are emitted internally by
  // the CRUD layer. We define an unsatisfiable schema so any POST/PATCH fails.
  'audit-log': {
    writableFields: [],
    sortableFields: ['id', 'createdAt', 'entity', 'action', 'userId'],
    filterableFields: ['entity', 'action', 'userId'],
    createSchema: z.never(),
    updateSchema: z.never(),
  },
};

/**
 * Returns validation rules for an entity slug, or null when none defined.
 * Callers (crud.ts) treat a null result as "writes denied" and "no field
 * whitelist available — fall back to safe defaults for reads."
 */
export function getEntityValidation(slug: string): EntityValidation | null {
  if (VALIDATION_OVERRIDES[slug]) return VALIDATION_OVERRIDES[slug];
  const config = ENTITY_CONFIGS[slug];
  if (!config) return null;
  return buildValidation(config);
}

