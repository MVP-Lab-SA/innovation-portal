import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile, canEdit, canAdmin } from './auth';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

type ModelName = Prisma.ModelName;

interface CrudOptions {
  searchFields?: string[];
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, any>;
  codePrefix?: string;
}

async function generateNextCode(model: any, prefix: string): Promise<string> {
  const last = await model.findFirst({
    where: { code: { startsWith: `${prefix}-` } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  if (!last) return `${prefix}-001`;
  const num = parseInt(last.code.split('-')[1] || '0', 10) + 1;
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

export function createListHandler(modelName: keyof typeof prisma, options: CrudOptions = {}) {
  return async function GET(request: NextRequest) {
    const session = await getSessionWithProfile();
    if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 200);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy');
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';
    
    const where: any = {};
    if (search && options.searchFields) {
      where.OR = options.searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }
    
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const field = key.replace('filter_', '');
        where[field] = value;
      }
    });
    
    try {
      const model = (prisma as any)[modelName];
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: sortBy ? { [sortBy]: sortDir } : (options.defaultOrderBy || { createdAt: 'desc' }),
          include: options.include,
        }),
        model.count({ where }),
      ]);
      
      return NextResponse.json({
        data,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error: any) {
      console.error(`Error listing ${String(modelName)}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  };
}

export function createCreateHandler(modelName: keyof typeof prisma, options: CrudOptions = {}) {
  return async function POST(request: NextRequest) {
    const session = await getSessionWithProfile();
    if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canEdit(session.profile.role)) {
      return NextResponse.json({ error: 'Forbidden - editor role required' }, { status: 403 });
    }
    
    try {
      const body = await request.json();
      const model = (prisma as any)[modelName];
      
      if (options.codePrefix && !body.code) {
        body.code = await generateNextCode(model, options.codePrefix);
      }
      
      Object.keys(body).forEach(key => {
        if (body[key] === '') body[key] = null;
        if (key.toLowerCase().includes('date') && typeof body[key] === 'string' && body[key]) {
          body[key] = new Date(body[key]);
        }
      });
      
      const created = await model.create({ data: body, include: options.include });
      
      await prisma.auditLog.create({
        data: {
          userId: session.profile.id,
          action: 'CREATE',
          entity: String(modelName),
          entityId: created.id,
          changes: body,
        },
      }).catch(() => {});
      
      return NextResponse.json(created, { status: 201 });
    } catch (error: any) {
      console.error(`Error creating ${String(modelName)}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  };
}

export function createRecordHandlers(modelName: keyof typeof prisma, options: CrudOptions = {}) {
  return {
    async GET(_request: NextRequest, { params }: { params: { id: string } }) {
      const session = await getSessionWithProfile();
      if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      try {
        const model = (prisma as any)[modelName];
        const record = await model.findUnique({
          where: { id: params.id },
          include: options.include,
        });
        if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(record);
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    },
    
    async PATCH(request: NextRequest, { params }: { params: { id: string } }) {
      const session = await getSessionWithProfile();
      if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!canEdit(session.profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      try {
        const body = await request.json();
        const model = (prisma as any)[modelName];
        
        Object.keys(body).forEach(key => {
          if (body[key] === '') body[key] = null;
          if (key.toLowerCase().includes('date') && typeof body[key] === 'string' && body[key]) {
            body[key] = new Date(body[key]);
          }
        });
        
        delete body.id;
        delete body.code;
        
        const updated = await model.update({
          where: { id: params.id },
          data: body,
          include: options.include,
        });
        
        await prisma.auditLog.create({
          data: {
            userId: session.profile.id,
            action: 'UPDATE',
            entity: String(modelName),
            entityId: params.id,
            changes: body,
          },
        }).catch(() => {});
        
        return NextResponse.json(updated);
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    },
    
    async DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
      const session = await getSessionWithProfile();
      if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!canAdmin(session.profile.role)) {
        return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
      }
      
      try {
        const model = (prisma as any)[modelName];
        await model.delete({ where: { id: params.id } });
        
        await prisma.auditLog.create({
          data: {
            userId: session.profile.id,
            action: 'DELETE',
            entity: String(modelName),
            entityId: params.id,
          },
        }).catch(() => {});
        
        return NextResponse.json({ success: true });
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    },
  };
}

export const MODEL_REGISTRY: Record<string, { model: keyof typeof prisma; options: CrudOptions; arabicName: string }> = {
  'employees': { model: 'employee', options: { codePrefix: 'EMP', searchFields: ['code', 'fullName', 'email', 'department'] }, arabicName: 'الموظفون' },
  'initiatives': { model: 'initiative', options: { codePrefix: 'INI', searchFields: ['code', 'name', 'description'] }, arabicName: 'المبادرات' },
  'milestones': { model: 'milestone', options: { codePrefix: 'MIL', searchFields: ['code', 'name'] }, arabicName: 'المراحل الرئيسية' },
  'tasks': { model: 'task', options: { codePrefix: 'TSK', searchFields: ['code', 'title'] }, arabicName: 'المهام' },
  'experts': { model: 'expert', options: { codePrefix: 'SME', searchFields: ['code', 'fullName', 'email', 'specialization'] }, arabicName: 'الخبراء' },
  'ideas': { model: 'idea', options: { codePrefix: 'IDE', searchFields: ['code', 'title', 'description'] }, arabicName: 'الأفكار' },
  'pilots': { model: 'pilot', options: { codePrefix: 'PIL', searchFields: ['code', 'name'] }, arabicName: 'التجارب التشغيلية' },
  'sandbox-applications': { model: 'sandboxApplication', options: { codePrefix: 'SBX', searchFields: ['code', 'solutionName', 'entityName'] }, arabicName: 'طلبات الساندبوكس' },
  'evaluations': { model: 'evaluation', options: { codePrefix: 'EVL', searchFields: ['code'] }, arabicName: 'التقييمات' },
  'eval-rubrics': { model: 'evalRubric', options: { codePrefix: 'RUB', searchFields: ['code', 'criterionName'] }, arabicName: 'معايير التقييم' },
  'calendar-events': { model: 'calendarEvent', options: { codePrefix: 'EVT', searchFields: ['code', 'title'] }, arabicName: 'الفعاليات' },
  'strategic-sources': { model: 'strategicSource', options: { codePrefix: 'STR', searchFields: ['code', 'sourceName'] }, arabicName: 'المصادر الاستراتيجية' },
  'challenges': { model: 'challenge', options: { codePrefix: 'CHL', searchFields: ['code', 'title', 'description'] }, arabicName: 'التحديات' },
  'cems': { model: 'cem', options: { codePrefix: 'INV', searchFields: ['code', 'fullName', 'email'] }, arabicName: 'المبتكرون' },
  'partners': { model: 'partner', options: { codePrefix: 'PRT', searchFields: ['code', 'partnerName'] }, arabicName: 'الشركاء' },
  'sponsorships': { model: 'sponsorship', options: { codePrefix: 'SPN', searchFields: ['code'] }, arabicName: 'الرعايات' },
  'partner-interactions': { model: 'partnerInteraction', options: { codePrefix: 'INT', searchFields: ['code', 'subject'] }, arabicName: 'تفاعلات الشركاء' },
  'documents': { model: 'document', options: { codePrefix: 'DOC', searchFields: ['code', 'title'] }, arabicName: 'الوثائق' },
  'risks': { model: 'risk', options: { codePrefix: 'RSK', searchFields: ['code', 'title', 'description'] }, arabicName: 'سجل المخاطر' },
  'metrics': { model: 'outcomeMetric', options: { codePrefix: 'MET', searchFields: ['code', 'metricName'] }, arabicName: 'مؤشرات النتائج' },
  'communications': { model: 'communication', options: { codePrefix: 'COM', searchFields: ['code', 'title'] }, arabicName: 'التواصل والإعلام' },
  'lookups': { model: 'lookup', options: { searchFields: ['category', 'value'] }, arabicName: 'القوائم المرجعية' },
  'users': { model: 'user', options: { searchFields: ['email', 'name'] }, arabicName: 'المستخدمون' },
};
