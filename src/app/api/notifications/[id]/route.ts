import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Mark a single notification as read. The userId in the where-clause
 * scopes the update to the caller — a user cannot touch another user's
 * notifications (IDOR-safe).
 */
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const result = await prisma.notification.updateMany({
      where: { id: params.id, userId: session.profile.id },
      data: { read: true },
    });
    if (result.count === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return respondError(err, { code: 'notification_mark_failed' });
  }
}
