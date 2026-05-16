'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, GripVertical, CalendarClock } from 'lucide-react';
import { useEntities, useLookup } from '@/hooks/useData';
import { formatDate, cn, getStatusVariant } from '@/lib/utils';

interface Task {
  id: string;
  code: string;
  title: string;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
  assigneeId: string | null;
}

const UNSET = 'غير محدد';

export function KanbanBoard() {
  const { data, loading, refresh } = useEntities<Task>('tasks', { pageSize: 200 });
  const { values: statuses } = useLookup('TaskStatus');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  useEffect(() => { setTasks(data); }, [data]);

  const columns = useMemo(() => {
    const known = statuses ?? [];
    const present = Array.from(new Set(tasks.map(t => t.status || UNSET)));
    const extra = present.filter(s => !known.includes(s));
    return [...known, ...extra];
  }, [statuses, tasks]);

  const move = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || (task.status || UNSET) === newStatus) return;
    const prev = tasks;
    const applied = newStatus === UNSET ? null : newStatus;
    setTasks(ts => ts.map(t => (t.id === taskId ? { ...t, status: applied } : t)));
    try {
      const res = await fetch(`/api/entities/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: applied }),
      });
      if (!res.ok) throw new Error('patch_failed');
      toast.success('تم نقل المهمة');
    } catch {
      setTasks(prev);
      toast.error('تعذّر نقل المهمة');
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="card flex items-center justify-center py-16 text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => {
        const colTasks = tasks.filter(t => (t.status || UNSET) === col);
        return (
          <div
            key={col}
            onDragOver={e => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol(c => (c === col ? null : c))}
            onDrop={() => { if (dragId) move(dragId, col); setDragId(null); setOverCol(null); }}
            className={cn(
              'flex-shrink-0 w-72 rounded-xl border border-border bg-background-alt p-3 transition-colors',
              overCol === col && 'bg-ministry-green-soft border-ministry-green/40',
            )}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-text-primary">{col}</h3>
              <span className="badge badge-neutral text-xs">{colTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-12">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  className={cn(
                    'bg-white rounded-lg border border-border p-3 shadow-soft cursor-grab active:cursor-grabbing',
                    dragId === task.id && 'opacity-50',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/records/tasks/${task.id}`}
                        className="text-sm font-medium text-text-primary hover:text-ministry-green-deep hover:underline block truncate"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center flex-wrap gap-1.5 mt-2">
                        <span className="badge badge-info text-xs">{task.code}</span>
                        {task.priority && (
                          <span className={`badge badge-${getStatusVariant(task.priority)} text-xs`}>
                            {task.priority}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                            <CalendarClock className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      {/* Touch fallback — HTML5 drag has no touch support */}
                      <select
                        value={col}
                        onChange={e => move(task.id, e.target.value)}
                        className="input-base text-xs py-1 mt-2 w-full"
                        aria-label="نقل المهمة"
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="text-xs text-text-muted text-center py-4">لا توجد مهام</p>
              )}
            </div>
          </div>
        );
      })}
      {columns.length === 0 && (
        <div className="card text-sm text-text-muted">
          لا توجد مهام. أضِفها من <Link href="/admin/data?entity=tasks" className="text-ministry-green-deep underline">إدارة البيانات</Link>.
          <button onClick={refresh} className="hidden" />
        </div>
      )}
    </div>
  );
}
