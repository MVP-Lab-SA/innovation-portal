import { prisma } from './prisma';

/**
 * Lightweight workflow automation: post-write side-effects that advance the
 * innovation funnel. Best-effort — wrapped in try/catch so a failure never
 * blocks the originating write (same contract as writeAuditLog / emitForCrud).
 */

type Row = { id: string } & Record<string, unknown>;
type CrudAction = 'CREATE' | 'UPDATE' | 'DELETE';

async function nextCode(model: string, prefix: string): Promise<string> {
  const rows = await (prisma as unknown as Record<string, {
    findMany: (a: unknown) => Promise<Array<{ code: string | null }>>;
  }>)[model].findMany({ select: { code: true } });
  let max = 0;
  for (const r of rows) {
    const m = new RegExp(`^${prefix}-(\\d+)$`).exec(r.code || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export async function runWorkflow(
  slug: string,
  action: CrudAction,
  record: Row,
  before?: Row | null,
): Promise<void> {
  try {
    // 1. Sandbox application approved → spin up a Pilot and link it back.
    if (slug === 'sandbox-applications' && action === 'UPDATE') {
      const status = String(record.applicationStatus ?? '');
      const wasStatus = String(before?.applicationStatus ?? '');
      if (status.includes('موافق') && !wasStatus.includes('موافق') && !record.pilotId) {
        const pilot = await prisma.pilot.create({
          data: {
            code: await nextCode('pilot', 'PIL'),
            name: `تجربة: ${String(record.solutionName ?? '')}`.trim(),
            description: (record.solutionDescription as string | null) ?? null,
            status: 'مخطط لها',
            businessChallengeId: (record.businessChallengeId as string | null) ?? null,
          },
        });
        await prisma.sandboxApplication.update({
          where: { id: record.id },
          data: { pilotId: pilot.id },
        });
      }
    }

    // 2. Campaign ↔ BusinessChallenge link created → advance the challenge.
    if (slug === 'campaign-business-challenges' && action === 'CREATE') {
      const bcId = record.businessChallengeId as string | undefined;
      if (bcId) {
        const bc = await prisma.businessChallenge.findUnique({ where: { id: bcId } });
        if (bc && (bc.status == null || bc.status === 'مفتوح' || bc.status === 'قيد الدراسة')) {
          await prisma.businessChallenge.update({
            where: { id: bcId },
            data: { status: 'محوّل إلى حملة' },
          });
        }
      }
    }
  } catch (e) {
    console.error('[workflow] failed:', e);
  }
}
