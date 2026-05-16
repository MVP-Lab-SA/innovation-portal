'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
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

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/notifications', { signal });
      if (!res.ok) return;
      const d = await res.json();
      setItems(d.items || []);
      setUnread(d.unread || 0);
    } catch {
      /* ignore — best-effort */
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    const timer = setInterval(() => load(), 60_000);
    return () => { ctrl.abort(); clearInterval(timer); };
  }, [load]);

  const markAll = async () => {
    setItems(its => its.map(i => ({ ...i, read: true })));
    setUnread(0);
    await fetch('/api/notifications', { method: 'PATCH' }).catch(() => {});
  };

  const openItem = async (n: Notif) => {
    if (!n.read) {
      setItems(its => its.map(i => (i.id === n.id ? { ...i, read: true } : i)));
      setUnread(u => Math.max(0, u - 1));
      fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => {});
    }
    setOpen(false);
    if (n.entity && n.entityId) router.push(`/records/${n.entity}/${n.entityId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-ministry-green-soft text-text-secondary hover:text-ministry-green-deep transition-all"
        title="الإشعارات"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl border border-border shadow-strong z-50 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-ministry-green-soft border-b border-border">
              <span className="font-bold text-ministry-green-deep text-sm">الإشعارات</span>
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="text-xs text-ministry-green-deep hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  تحديد الكل كمقروء
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">لا توجد إشعارات</p>
              ) : (
                items.map(n => (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={cn(
                      'w-full text-right px-3 py-2.5 border-b border-border hover:bg-background-alt transition-colors block',
                      !n.read && 'bg-ministry-green-soft/40',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-ministry-green mt-1.5 flex-shrink-0" />}
                      <div className={cn('flex-1 min-w-0', n.read && 'pr-4')}>
                        <div className="text-sm font-medium text-text-primary truncate">{n.title}</div>
                        {n.body && <div className="text-xs text-text-secondary truncate mt-0.5">{n.body}</div>}
                        <div className="text-[11px] text-text-muted mt-1" suppressHydrationWarning>
                          {formatDate(n.createdAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-ministry-green-deep hover:underline py-2.5 border-t border-border"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
