import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile, canEdit } from '@/lib/auth';
import { uploadFile, isBlobConfigured } from '@/lib/blob';
import { respondError } from '@/lib/apiError';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'text/plain', 'text/csv',
]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canEdit(session.profile.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const limited = checkRateLimit({ key: `upload:${session.profile.id}`, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: 'rate_limited', retryAfter: limited.retryAfter }, { status: 429 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json({ error: 'blob_not_configured' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'documents';

    if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'file_too_large', max: MAX_BYTES }, { status: 413 });
    }
    if (file.type && !ALLOWED_CONTENT_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'unsupported_content_type', received: file.type }, { status: 415 });
    }

    const blob = await uploadFile(file.name, file, {
      folder,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
      uploadedBy: session.profile?.email,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    return respondError(err, { code: 'upload_failed' });
  }
}
