import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';
import { getSanityReadClient, SANITY_QUERIES, isSanityConfigured } from '@/lib/sanity';
import { respondError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['posts', 'announcements', 'post', 'page']);

export async function GET(request: NextRequest) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!isSanityConfigured()) {
    return NextResponse.json({ error: 'sanity_not_configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'posts';
  const slug = searchParams.get('slug');
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'unknown_type' }, { status: 400 });
  }

  try {
    const client = getSanityReadClient();
    let result: unknown;
    switch (type) {
      case 'posts':
        result = await client.fetch(SANITY_QUERIES.posts);
        break;
      case 'announcements':
        result = await client.fetch(SANITY_QUERIES.announcements);
        break;
      case 'post':
        if (!slug) return NextResponse.json({ error: 'slug_required' }, { status: 400 });
        result = await client.fetch(SANITY_QUERIES.postBySlug(slug));
        break;
      case 'page':
        if (!slug) return NextResponse.json({ error: 'slug_required' }, { status: 400 });
        result = await client.fetch(SANITY_QUERIES.pageBySlug(slug));
        break;
    }

    return NextResponse.json({
      type,
      slug: slug || null,
      data: result,
      count: Array.isArray(result) ? result.length : (result ? 1 : 0),
    });
  } catch (err) {
    return respondError(err, { code: 'sanity_fetch_failed' });
  }
}
