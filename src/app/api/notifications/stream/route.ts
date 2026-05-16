import { getSessionWithProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Server-Sent Events stream for the caller's notifications.
 *
 * The stream emits an initial snapshot, then re-checks every 10s and pushes
 * an update. It closes itself after ~50s (under maxDuration); the browser's
 * EventSource then reconnects automatically — so the client never polls
 * manually and sees changes within ~10s.
 */
export async function GET() {
  const session = await getSessionWithProfile();
  if (!session?.profile) return new Response('unauthorized', { status: 401 });
  const userId = session.profile.id;

  let cancelled = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          cancelled = true;
        }
      };

      const tick = async () => {
        try {
          const [items, unread] = await Promise.all([
            prisma.notification.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
              take: 50,
            }),
            prisma.notification.count({ where: { userId, read: false } }),
          ]);
          send({ items, unread });
        } catch {
          /* transient query error — skip this tick */
        }
      };

      await tick();
      const deadline = Date.now() + 50_000;
      while (!cancelled && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 10_000));
        if (cancelled) break;
        await tick();
      }
      try { controller.close(); } catch { /* already closed */ }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
