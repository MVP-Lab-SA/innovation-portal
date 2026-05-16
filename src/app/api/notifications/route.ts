import { NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** List the caller's own notifications (newest first) + unread count. */
export async function GET() {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.profile.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: session.profile.id, read: false } }),
    ]);
    return NextResponse.json({ items, unread });
  } catch (err) {
    return respondError(err, { code: 'notifications_list_failed' });
  }
}

/** Mark all of the caller's notifications as read. */
export async function PATCH() {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await prisma.notification.updateMany({
      where: { userId: session.profile.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return respondError(err, { code: 'notifications_mark_failed' });
  }
}
