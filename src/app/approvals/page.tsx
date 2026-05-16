'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { CheckCircle2, XCircle, Loader2, ClipboardList } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Idea {
  id: string;
  code: string | null;
  title: string;
  category: string | null;
  submissionDate: string | null;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entities/ideas?filter_status=' + encodeURIComponent('جديدة') + '&pageSize=100');
      if (res.ok) {
        const d = await res.json();
        setItems(d.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/me').then(r => (r.ok ? r.json() : null)).then(p => p?.role && setRole(p.role)).catch(() => {});
  }, []);

  const canDecide = role === 'ADMIN' || role === 'EDITOR';

  const decide = async (idea: Idea, decision: 'approve' | 'reject') => {
    const status = decision === 'approve' ? 'موافق عليها' : 'مرفوضة';
    setBusyId(idea.id);
    try {
      const res = await fetch(`/api/entities/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      toast.success(decision === 'approve' ? 'تم اعتماد الفكرة' : 'تم رفض الفكرة');
      setItems(its => its.filter(i => i.id !== idea.id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل التحديث');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell
      title="طابور الاعتماد"
      subtitle={`${items.length} فكرة بانتظار القرار`}
      showRefresh
      onRefresh={load}
    >
      {loading ? (
        <div className="card flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-text-muted">
          <ClipboardList className="w-14 h-14 opacity-20 mb-3" />
          <p className="text-sm font-medium">لا توجد أفكار بانتظار الاعتماد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(idea => (
            <div key={idea.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {idea.code && <span className="badge badge-info text-xs">{idea.code}</span>}
                  {idea.category && <span className="badge badge-neutral text-xs">{idea.category}</span>}
                </div>
                <Link
                  href={`/records/ideas/${idea.id}`}
                  className="block text-sm font-bold text-text-primary hover:text-ministry-green-deep hover:underline mt-1.5"
                >
                  {idea.title}
                </Link>
                {idea.submissionDate && (
                  <div className="text-xs text-text-muted mt-0.5" suppressHydrationWarning>
                    قُدّمت في {formatDate(idea.submissionDate)}
                  </div>
                )}
              </div>
              {canDecide && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decide(idea, 'approve')}
                    disabled={busyId === idea.id}
                    className="btn-secondary text-sm flex items-center gap-2 text-ministry-green-deep disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد</span>
                  </button>
                  <button
                    onClick={() => decide(idea, 'reject')}
                    disabled={busyId === idea.id}
                    className="btn-secondary text-sm flex items-center gap-2 text-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>رفض</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
