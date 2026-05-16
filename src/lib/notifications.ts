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

/** Fan a notification out to every active admin. */
async function notifyAdmins(input: {
  type: string;
  title: string;
  body?: string;
  entity?: string;
  entityId?: string;
}): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', active: true },
    select: { id: true },
  });
  await Promise.all(admins.map(a => createNotification({ userId: a.id, ...input })));
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

    // Status change on a tracked entity → notify all active admins.
    const STATUS_ENTITIES: Record<string, { key: string; label: string }> = {
      'ideas': { key: 'status', label: 'فكرة' },
      'sandbox-applications': { key: 'applicationStatus', label: 'طلب ساندبوكس' },
      'challenges': { key: 'status', label: 'تحدٍّ' },
      'initiatives': { key: 'status', label: 'مبادرة' },
    };
    if (STATUS_ENTITIES[entity] && action === 'UPDATE') {
      const { key, label } = STATUS_ENTITIES[entity];
      const newStatus = record[key];
      const oldStatus = before?.[key];
      if (newStatus && newStatus !== oldStatus) {
        await notifyAdmins({
          type: 'STATUS_CHANGED',
          title: `تغيّرت حالة ${label}`,
          body: `${String(record.code ?? '')} → ${String(newStatus)}`,
          entity,
          entityId: record.id,
        });
      }
    }

    // Risk escalation → notify admins when a risk rises to critical/high.
    if (entity === 'risks' && action === 'UPDATE') {
      const newLevel = record.riskLevel;
      const oldLevel = before?.riskLevel;
      const CRITICAL = ['حرج', 'عالٍ'];
      if (newLevel && newLevel !== oldLevel && CRITICAL.includes(String(newLevel))) {
        await notifyAdmins({
          type: 'RISK_ESCALATED',
          title: 'تصعيد مخاطرة',
          body: `${String(record.code ?? '')} — ${String(record.title ?? '')} → ${String(newLevel)}`,
          entity: 'risks',
          entityId: record.id,
        });
      }
    }

    // Evaluation completed → notify admins.
    if (entity === 'evaluations' && action === 'UPDATE') {
      if (record.status === 'مكتملة' && before?.status !== 'مكتملة') {
        await notifyAdmins({
          type: 'EVALUATION_COMPLETED',
          title: 'اكتمل تقييم',
          body: String(record.code ?? ''),
          entity: 'evaluations',
          entityId: record.id,
        });
      }
    }
  } catch (err) {
    console.error('notification_emit_failed', { entity, action, err });
  }
}
