'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import {
  Bell, LayoutDashboard, KanbanSquare, Search, ClipboardList, Loader2, ShieldCheck,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Notif {
  id: string;
  title: string;
  body: string | null;
  entity: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
}
interface Profile { name: string | null; email: string; role: string }

const ROLE_LABEL: Record<string, string> = { ADMIN: 'مسؤول', EDITOR: 'محرّر', VIEWER: 'مشاهد' };

const QUICK_LINKS = [
  { href: '/dashboards/executive', label: 'اللوحة التنفيذية', icon: LayoutDashboard },
  { href: '/tasks', label: 'لوحة المهام', icon: KanbanSquare },
  { href: '/approvals', label: 'طابور الاعتماد', icon: ClipboardList },
  { href: '/search', label: 'البحث الشامل', icon: Search },
];

export default function MyWorkPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, notifRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/notifications'),
      ]);
      if (meRes.ok) setProfile(await meRes.json());
      if (notifRes.ok) {
        const d = await notifRes.json();
        setItems(d.items || []);
        setUnread(d.unread || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openItem = (n: Notif) => {
    if (n.entity && n.entityId) router.push(`/records/${n.entity}/${n.entityId}`);
  };

  return (
    <AppShell title="نشاطي" subtitle="ملخّص عملك وإشعاراتك" showRefresh onRefresh={load}>
      {loading ? (
        <div className="card flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          {profile && (
            <div className="card mb-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-text-primary">{profile.name || profile.email}</span>
                <span className="inline-flex items-center gap-1 text-xs text-ministry-green-deep">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {ROLE_LABEL[profile.role] ?? profile.role}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard title="إشعارات غير مقروءة" value={unread} icon={Bell} variant={unread > 0 ? 'warning' : 'default'} />
            <KpiCard title="إجمالي الإشعارات" value={items.length} icon={Bell} variant="info" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h3 className="text-base font-bold text-text-primary mb-4">آخر الإشعارات</h3>
              {items.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">لا توجد إشعارات</p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.slice(0, 8).map(n => (
                    <li key={n.id}>
                      <button
                        onClick={() => openItem(n)}
                        className={cn(
                          'w-full text-right py-2.5 flex items-start gap-3 hover:bg-background-alt rounded-lg px-2 transition-colors',
                          !n.read && 'bg-ministry-green-soft/40',
                        )}
                      >
                        <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.read ? 'bg-transparent' : 'bg-ministry-green')} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-text-primary">{n.title}</span>
                          {n.body && <span className="block text-xs text-text-secondary truncate">{n.body}</span>}
                          <span className="block text-[11px] text-text-muted mt-0.5" suppressHydrationWarning>
                            {formatDate(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/notifications" className="block text-center text-xs text-ministry-green-deep hover:underline mt-3 pt-3 border-t border-border">
                عرض كل الإشعارات
              </Link>
            </div>

            <div className="card">
              <h3 className="text-base font-bold text-text-primary mb-4">روابط سريعة</h3>
              <div className="space-y-2">
                {QUICK_LINKS.map(l => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep transition-all"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{l.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
