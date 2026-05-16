import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile, canAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Entities exposed to global search: prisma model key, the slug used for
// /records/[entity]/[id], the human-label field, and `extra` free-text
// fields (descriptions/bodies) also matched against the query.
const TARGETS: { slug: string; model: string; label: string; extra?: string[] }[] = [
  { slug: 'ideas', model: 'idea', label: 'title', extra: ['description', 'impactExpected'] },
  { slug: 'initiatives', model: 'initiative', label: 'name', extra: ['description'] },
  { slug: 'challenges', model: 'challenge', label: 'title', extra: ['description'] },
  { slug: 'tasks', model: 'task', label: 'title', extra: ['description'] },
  { slug: 'milestones', model: 'milestone', label: 'name', extra: ['description'] },
  { slug: 'pilots', model: 'pilot', label: 'name', extra: ['description'] },
  { slug: 'risks', model: 'risk', label: 'title', extra: ['description'] },
  { slug: 'partners', model: 'partner', label: 'partnerName' },
  { slug: 'documents', model: 'document', label: 'title', extra: ['description'] },
  { slug: 'experts', model: 'expert', label: 'fullName', extra: ['specialization', 'organization'] },
  { slug: 'employees', model: 'employee', label: 'fullName', extra: ['jobTitle', 'department'] },
  { slug: 'cems', model: 'cem', label: 'fullName', extra: ['organization'] },
  { slug: 'sandbox-applications', model: 'sandboxApplication', label: 'solutionName', extra: ['solutionDescription', 'entityName'] },
  { slug: 'communications', model: 'communication', label: 'title', extra: ['content'] },
  { slug: 'metrics', model: 'outcomeMetric', label: 'metricName', extra: ['description'] },
  { slug: 'calendar-events', model: 'calendarEvent', label: 'title', extra: ['description'] },
  { slug: 'strategic-sources', model: 'strategicSource', label: 'sourceName', extra: ['description'] },
];

type SearchModel = { findMany: (args: unknown) => Promise<Array<Record<string, unknown>>> };

export async function GET(request: NextRequest) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ query: q, groups: [] });

  try {
    const role = session.profile.role;
    const client = prisma as unknown as Record<string, SearchModel>;
    // Only search entities the caller may read (PII entities gated).
    const allowed = TARGETS.filter(t => canAccess(role, t.slug, 'read'));

    const results = await Promise.all(
      allowed.map(async t => {
        const fields = ['code', t.label, ...(t.extra ?? [])];
        const rows = await client[t.model].findMany({
          where: {
            OR: fields.map(f => ({ [f]: { contains: q, mode: 'insensitive' } })),
          },
          take: 6,
          orderBy: { code: 'asc' },
        });
        return {
          entity: t.slug,
          items: rows.map(r => ({ id: r.id, code: r.code, label: r[t.label] })),
        };
      }),
    );

    return NextResponse.json({ query: q, groups: results.filter(g => g.items.length > 0) });
  } catch (err) {
    return respondError(err, { code: 'search_failed' });
  }
}
