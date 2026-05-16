import { prisma } from './prisma';

/**
 * In-app notifications. Generated automatically by CRUD events
 * (see emitForCrud, called from src/lib/crud.ts). All emission is
 * best-effort: failures are logged and never block the originating write.
 */

type CrudRecord = { id: string } & Record<string, unknown>;

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  entity?: string;
  entityId?: string;
}): Promise<void> {
  await prisma.notification.create({ data: input });
}

/**
 * Dispatch notifications for a create/update on a generic entity.
 * Rules are intentionally small and centralized — extend here.
 */
export async function emitForCrud(
  entity: string,
  action: 'CREATE' | 'UPDATE',
  record: CrudRecord,
  before?: CrudRecord | null,
): Promise<void> {
  try {
    // Task assigned (or re-assigned) → notify the matching User by email.
    if (entity === 'tasks') {
      const assigneeId = (record.assigneeId as string | null) ?? null;
      const prevAssignee = (before?.assigneeId as string | null | undefined) ?? null;
      const assignmentChanged = action === 'CREATE' || assigneeId !== prevAssignee;
      if (assigneeId && assignmentChanged) {
        const employee = await prisma.employee.findUnique({
          where: { id: assigneeId },
          select: { email: true },
        });
        if (employee?.email) {
          const user = await prisma.user.findUnique({
            where: { email: employee.email.toLowerCase() },
            select: { id: true },
          });
          if (user) {
            await createNotification({
              userId: user.id,
              type: 'TASK_ASSIGNED',
              title: 'مهمة جديدة مُسندة إليك',
              body: String(record.title ?? record.code ?? ''),
              entity: 'tasks',
              entityId: record.id,
            });
          }
        }
      }
      return;
    }

    // Idea / sandbox status change → notify all active admins.
    if (entity === 'ideas' || entity === 'sandbox-applications') {
      const statusKey = entity === 'ideas' ? 'status' : 'applicationStatus';
      const newStatus = record[statusKey];
      const oldStatus = before?.[statusKey];
      if (action === 'UPDATE' && newStatus && newStatus !== oldStatus) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', active: true },
          select: { id: true },
        });
        const label = entity === 'ideas' ? 'فكرة' : 'طلب ساندبوكس';
        await Promise.all(
          admins.map(a =>
            createNotification({
              userId: a.id,
              type: 'STATUS_CHANGED',
              title: `تغيّرت حالة ${label}`,
              body: `${String(record.code ?? '')} → ${String(newStatus)}`,
              entity,
              entityId: record.id,
            }),
          ),
        );
      }
    }
  } catch (err) {
    console.error('notification_emit_failed', { entity, action, err });
  }
}
