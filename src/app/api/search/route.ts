import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile, canAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Entities exposed to global search: prisma model key, the slug used for
// /records/[entity]/[id], and the human-label field.
const TARGETS: { slug: string; model: string; label: string }[] = [
  { slug: 'ideas', model: 'idea', label: 'title' },
  { slug: 'initiatives', model: 'initiative', label: 'name' },
  { slug: 'challenges', model: 'challenge', label: 'title' },
  { slug: 'tasks', model: 'task', label: 'title' },
  { slug: 'milestones', model: 'milestone', label: 'name' },
  { slug: 'pilots', model: 'pilot', label: 'name' },
  { slug: 'risks', model: 'risk', label: 'title' },
  { slug: 'partners', model: 'partner', label: 'partnerName' },
  { slug: 'documents', model: 'document', label: 'title' },
  { slug: 'experts', model: 'expert', label: 'fullName' },
  { slug: 'employees', model: 'employee', label: 'fullName' },
  { slug: 'cems', model: 'cem', label: 'fullName' },
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
        const rows = await client[t.model].findMany({
          where: {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { [t.label]: { contains: q, mode: 'insensitive' } },
            ],
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
