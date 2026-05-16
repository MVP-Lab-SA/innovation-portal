'use client';

import { AppShell } from '@/components/AppShell';
import { KanbanBoard } from '@/components/KanbanBoard';

export default function TasksPage() {
  return (
    <AppShell
      title="لوحة المهام"
      subtitle="تتبّع المهام بالسحب بين الأعمدة"
      manageEntity="tasks"
    >
      <KanbanBoard />
    </AppShell>
  );
}
