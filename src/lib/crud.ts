import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile, canAccess } from './auth';
import { prisma } from './prisma';
import { getEntityValidation } from './entityConfigs';
import { respondError } from './apiError';
import { emitForCrud } from './notifications';

interface CrudOptions {
  searchFields?: string[];
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, unknown>;
  /**
   * Richer include applied ONLY to the single-record GET (detail pages).
   * Kept separate from `include` so list endpoints stay lightweight.
   */
  detailInclude?: Record<string, unknown>;
  codePrefix?: string;
}

interface EntityRegistryEntry {
  model: string; // prisma model key (camelCase)
  options: CrudOptions;
  arabicName: string;
}

type PrismaModel = {
  findFirst: (args: unknown) => Promise<{ code: string | null } | null>;
  findMany: (args: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  count: (args: unknown) => Promise<number>;
  create: (args: unknown) => Promise<{ id: string } & Record<string, unknown>>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

function getModel(modelName: string): PrismaModel {
  // Single typed cast at the boundary — Prisma's client doesn't expose a
  // generic dynamic-model accessor, so this is intentional.
  const client = prisma as unknown as Record<string, PrismaModel>;
  return client[modelName];
}

async function generateNextCode(model: PrismaModel, prefix: string): Promise<string> {
  const last = await model.findFirst({
    where: { code: { startsWith: `${prefix}-` } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  if (!last?.code) return `${prefix}-001`;
  const num = parseInt(last.code.split('-')[1] || '0', 10) + 1;
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

function coerceBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    let value: unknown = v;
    if (value === '') value = null;
    if (typeof value === 'string' && k.toLowerCase().includes('date') && value) {
      value = new Date(value);
    }
    out[k] = value;
  }
  return out;
}

async function writeAuditLog(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  changes: unknown,
  ipAddress: string | null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes: changes === null || changes === undefined ? undefined : (changes as object),
        ipAddress: ipAddress ?? undefined,
      },
    });
  } catch (err) {
    console.error('audit_log_failed', { entity, action, entityId, err });
  }
}

function ipFromRequest(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip');
}

export function createListHandler(slug: string, modelName: string, options: CrudOptions = {}) {
  return async function GET(request: NextRequest) {
    const session = await getSessionWithProfile();
    if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!canAccess(session.profile.role, slug, 'read')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const validation = getEntityValidation(slug);
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 200);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy');
    const sortDir = (searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const where: Record<string, unknown> = {};
    if (search && options.searchFields?.length) {
      where.OR = options.searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    searchParams.forEach((value, key) => {
      if (!key.startsWith('filter_')) return;
      const field = key.slice('filter_'.length);
      if (validation && !validation.filterableFields.includes(field)) return; // silently drop unsafe filter
      where[field] = value;
    });

    let orderBy: Record<string, 'asc' | 'desc'> | undefined = options.defaultOrderBy || { createdAt: 'desc' };
    if (sortBy) {
      if (!validation || validation.sortableFields.includes(sortBy)) {
        orderBy = { [sortBy]: sortDir };
      } else {
        return NextResponse.json({ error: 'invalid_sort_field', field: sortBy }, { status: 400 });
      }
    }

    try {
      const model = getModel(modelName);
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy,
          include: options.include,
        }),
        model.count({ where }),
      ]);
      return NextResponse.json({
        data,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      return respondError(err, { code: 'list_failed' });
    }
  };
}

export function createCreateHandler(slug: string, modelName: string, options: CrudOptions = {}) {
  return async function POST(request: NextRequest) {
    const session = await getSessionWithProfile();
    if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!canAccess(session.profile.role, slug, 'create')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const validation = getEntityValidation(slug);
    if (!validation) {
      return NextResponse.json({ error: 'entity_not_writable' }, { status: 403 });
    }

    try {
      const rawBody = await request.json();
      // Strip system/protected fields BEFORE schema parse so a request can't
      // even attempt to set them.
      const sanitized = { ...rawBody };
      for (const k of ['id', 'createdAt', 'updatedAt', 'neonAuthId']) delete sanitized[k];
      const parsed = validation.createSchema.parse(sanitized);
      const data = coerceBody(parsed as Record<string, unknown>);

      const model = getModel(modelName);
      if (options.codePrefix && !data.code) {
        data.code = await generateNextCode(model, options.codePrefix);
      }

      const created = await model.create({ data, include: options.include });
      await writeAuditLog(session.profile.id, 'CREATE', slug, created.id, data, ipFromRequest(request));
      await emitForCrud(slug, 'CREATE', created);
      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      return respondError(err, { code: 'create_failed' });
    }
  };
}

export function createRecordHandlers(slug: string, modelName: string, options: CrudOptions = {}) {
  return {
    async GET(request: NextRequest, { params }: { params: { id: string } }) {
      const session = await getSessionWithProfile();
      if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      if (!canAccess(session.profile.role, slug, 'read')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      try {
        const model = getModel(modelName);
        const record = await model.findUnique({
          where: { id: params.id },
          include: options.detailInclude ?? options.include,
        });
        if (!record) return NextResponse.json({ error: 'not_found' }, { status: 404 });
        return NextResponse.json(record);
      } catch (err) {
        return respondError(err, { code: 'read_failed' });
      }
    },

    async PATCH(request: NextRequest, { params }: { params: { id: string } }) {
      const session = await getSessionWithProfile();
      if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      if (!canAccess(session.profile.role, slug, 'update')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const validation = getEntityValidation(slug);
      if (!validation) return NextResponse.json({ error: 'entity_not_writable' }, { status: 403 });

      try {
        const rawBody = await request.json();
        const sanitized = { ...rawBody };
        for (const k of ['id', 'code', 'createdAt', 'updatedAt', 'neonAuthId']) delete sanitized[k];
        const parsed = validation.updateSchema.parse(sanitized);
        const data = coerceBody(parsed as Record<string, unknown>);

        const model = getModel(modelName);
        const before = (await model.findUnique({ where: { id: params.id } })) as
          ({ id: string } & Record<string, unknown>) | null;
        const updated = await model.update({
          where: { id: params.id },
          data,
          include: options.include,
        });
        await writeAuditLog(session.profile.id, 'UPDATE', slug, params.id, data, ipFromRequest(request));
        await emitForCrud(slug, 'UPDATE', updated as { id: string } & Record<string, unknown>, before);
        return NextResponse.json(updated);
      } catch (err) {
        return respondError(err, { code: 'update_failed' });
      }
    },

    async DELETE(request: NextRequest, { params }: { params: { id: string } }) {
      const session = await getSessionWithProfile();
      if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      if (!canAccess(session.profile.role, slug, 'delete')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      try {
        const model = getModel(modelName);
        await model.delete({ where: { id: params.id } });
        await writeAuditLog(session.profile.id, 'DELETE', slug, params.id, null, ipFromRequest(request));
        return NextResponse.json({ success: true });
      } catch (err) {
        return respondError(err, { code: 'delete_failed' });
      }
    },
  };
}

export const MODEL_REGISTRY: Record<string, EntityRegistryEntry> = {
  'employees': { model: 'employee', options: { codePrefix: 'EMP', searchFields: ['code', 'fullName', 'email', 'department'] }, arabicName: 'الموظفون' },
  'initiatives': {
    model: 'initiative',
    options: {
      codePrefix: 'INI',
      searchFields: ['code', 'name', 'description'],
      detailInclude: {
        owner: { select: { code: true, fullName: true } },
        milestones: { select: { id: true, code: true, name: true, status: true, progress: true } },
        tasks: { select: { id: true, code: true, title: true, status: true, priority: true } },
        partners: { include: { partner: { select: { code: true, partnerName: true } } } },
      },
    },
    arabicName: 'المبادرات',
  },
  'milestones': { model: 'milestone', options: { codePrefix: 'MIL', searchFields: ['code', 'name'] }, arabicName: 'المراحل الرئيسية' },
  'tasks': { model: 'task', options: { codePrefix: 'TSK', searchFields: ['code', 'title'] }, arabicName: 'المهام' },
  'experts': {
    model: 'expert',
    options: {
      codePrefix: 'SME',
      searchFields: ['code', 'fullName', 'email', 'specialization'],
      detailInclude: {
        ideaAssignments: { include: { idea: { select: { code: true, title: true } } } },
        evaluations: { select: { id: true, code: true, status: true, overallScore: true } },
      },
    },
    arabicName: 'الخبراء',
  },
  'ideas': {
    model: 'idea',
    options: {
      codePrefix: 'IDE',
      searchFields: ['code', 'title', 'description'],
      detailInclude: {
        submitterCem: { select: { code: true, fullName: true } },
        relatedChallenge: { select: { code: true, title: true } },
        evaluations: { select: { id: true, code: true, status: true, overallScore: true } },
        expertAssignments: { include: { expert: { select: { code: true, fullName: true } } } },
      },
    },
    arabicName: 'الأفكار',
  },
  'pilots': { model: 'pilot', options: { codePrefix: 'PIL', searchFields: ['code', 'name'] }, arabicName: 'التجارب التشغيلية' },
  'sandbox-applications': { model: 'sandboxApplication', options: { codePrefix: 'SBX', searchFields: ['code', 'solutionName', 'entityName'] }, arabicName: 'طلبات الساندبوكس' },
  'evaluations': { model: 'evaluation', options: { codePrefix: 'EVL', searchFields: ['code'] }, arabicName: 'التقييمات' },
  'eval-rubrics': { model: 'evalRubric', options: { codePrefix: 'RUB', searchFields: ['code', 'criterionName'] }, arabicName: 'معايير التقييم' },
  'calendar-events': { model: 'calendarEvent', options: { codePrefix: 'EVT', searchFields: ['code', 'title'] }, arabicName: 'الفعاليات' },
  'strategic-sources': { model: 'strategicSource', options: { codePrefix: 'STR', searchFields: ['code', 'sourceName'] }, arabicName: 'المصادر الاستراتيجية' },
  'business-challenges': {
    model: 'businessChallenge',
    options: {
      codePrefix: 'BCH',
      searchFields: ['code', 'title', 'domain', 'service'],
      detailInclude: {
        strategicSource: { select: { code: true, sourceName: true } },
        parent: { select: { id: true, code: true, title: true } },
        children: { select: { id: true, code: true, title: true, status: true } },
        challenges: { select: { id: true, code: true, title: true, status: true } },
      },
    },
    arabicName: 'التحديات وفرص الأعمال',
  },
  'challenges': {
    model: 'challenge',
    options: {
      codePrefix: 'CHL',
      searchFields: ['code', 'title', 'description'],
      detailInclude: {
        businessChallenge: { select: { code: true, title: true } },
        ideas: { select: { id: true, code: true, title: true, status: true } },
        expertAssignments: { include: { expert: { select: { code: true, fullName: true } } } },
      },
    },
    arabicName: 'الهاكاثونات والمسابقات',
  },
  'cems': { model: 'cem', options: { codePrefix: 'INV', searchFields: ['code', 'fullName', 'email'] }, arabicName: 'المبتكرون' },
  'partners': {
    model: 'partner',
    options: {
      codePrefix: 'PRT',
      searchFields: ['code', 'partnerName'],
      detailInclude: {
        sponsorships: { select: { id: true, code: true, sponsorshipTier: true, totalValueSar: true, status: true } },
        interactions: { select: { id: true, code: true, interactionType: true, subject: true, interactionDate: true } },
      },
    },
    arabicName: 'الشركاء',
  },
  'sponsorships': { model: 'sponsorship', options: { codePrefix: 'SPN', searchFields: ['code'] }, arabicName: 'الرعايات' },
  'partner-interactions': { model: 'partnerInteraction', options: { codePrefix: 'INT', searchFields: ['code', 'subject'] }, arabicName: 'تفاعلات الشركاء' },
  'documents': { model: 'document', options: { codePrefix: 'DOC', searchFields: ['code', 'title'] }, arabicName: 'الوثائق' },
  'risks': { model: 'risk', options: { codePrefix: 'RSK', searchFields: ['code', 'title', 'description'] }, arabicName: 'سجل المخاطر' },
  'metrics': { model: 'outcomeMetric', options: { codePrefix: 'MET', searchFields: ['code', 'metricName'] }, arabicName: 'مؤشرات النتائج' },
  'communications': { model: 'communication', options: { codePrefix: 'COM', searchFields: ['code', 'title'] }, arabicName: 'التواصل والإعلام' },
  'lookups': { model: 'lookup', options: { searchFields: ['category', 'value'] }, arabicName: 'القوائم المرجعية' },
  'users': { model: 'user', options: { searchFields: ['email', 'name'] }, arabicName: 'المستخدمون' },
  'audit-log': {
    model: 'auditLog',
    options: {
      defaultOrderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    },
    arabicName: 'سجل التغييرات',
  },
  // Junction entities — enable relationship management.
  'idea-expert-assignments': {
    model: 'ideaExpertAssignment',
    options: { searchFields: ['assignmentRole', 'status'] },
    arabicName: 'إسناد الخبراء للأفكار',
  },
  'initiative-partners': {
    model: 'initiativePartner',
    options: { searchFields: ['role'] },
    arabicName: 'شركاء المبادرات',
  },
  'expert-challenge-assignments': {
    model: 'expertChallengeAssignment',
    options: { searchFields: ['role'] },
    arabicName: 'إسناد الخبراء للتحديات',
  },
};
