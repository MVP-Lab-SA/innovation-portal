import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';
import { getSanityReadClient, SANITY_QUERIES, isSanityConfigured } from '@/lib/sanity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSanityConfigured()) {
    return NextResponse.json({ 
      error: 'Sanity CMS not configured',
      hint: 'Set NEXT_PUBLIC_SANITY_PROJECT_ID env var'
    }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'posts';
  const slug = searchParams.get('slug');

  try {
    const client = getSanityReadClient();
    let result;
    switch (type) {
      case 'posts':
        result = await client.fetch(SANITY_QUERIES.posts);
        break;
      case 'announcements':
        result = await client.fetch(SANITY_QUERIES.announcements);
        break;
      case 'post':
        if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
        result = await client.fetch(SANITY_QUERIES.postBySlug(slug));
        break;
      case 'page':
        if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
        result = await client.fetch(SANITY_QUERIES.pageBySlug(slug));
        break;
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({
      type, slug: slug || null,
      data: result,
      count: Array.isArray(result) ? result.length : (result ? 1 : 0),
    });
  } catch (error: any) {
    console.error('Sanity fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
