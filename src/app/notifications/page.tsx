'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entity: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    setItems(its => its.map(i => ({ ...i, read: true })));
    await fetch('/api/notifications', { method: 'PATCH' }).catch(() => {});
  };

  const openItem = async (n: Notif) => {
    if (!n.read) {
      setItems(its => its.map(i => (i.id === n.id ? { ...i, read: true } : i)));
      fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => {});
    }
    if (n.entity && n.entityId) router.push(`/records/${n.entity}/${n.entityId}`);
  };

  const unread = items.filter(i => !i.read).length;

  return (
    <AppShell
      title="الإشعارات"
      subtitle={`${items.length} إشعار${unread ? ` — ${unread} غير مقروء` : ''}`}
      showRefresh
      onRefresh={load}
      actions={
        unread > 0 ? (
          <button onClick={markAll} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" />
            <span>تحديد الكل كمقروء</span>
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="card flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-text-muted">
          <Bell className="w-14 h-14 opacity-20 mb-3" />
          <p className="text-sm font-medium">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {items.map(n => (
            <button
              key={n.id}
              onClick={() => openItem(n)}
              className={cn(
                'w-full text-right py-3 px-2 flex items-start gap-3 hover:bg-background-alt transition-colors',
                !n.read && 'bg-ministry-green-soft/40',
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  n.read ? 'bg-transparent' : 'bg-ministry-green',
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{n.title}</div>
                {n.body && <div className="text-xs text-text-secondary mt-0.5">{n.body}</div>}
                <div className="text-[11px] text-text-muted mt-1" suppressHydrationWarning>
                  {formatDate(n.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
