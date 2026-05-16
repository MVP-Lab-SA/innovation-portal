'use client';

import { useState, useMemo } from 'react';
import { X, Eye } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { useEntities } from '@/hooks/useData';
import { formatDate } from '@/lib/utils';
import { ENTITY_CONFIGS } from '@/lib/entityConfigs';

interface AuditRow {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
  user?: { email?: string; name?: string };
}

const ACTIONS = ['ALL', 'CREATE', 'UPDATE', 'DELETE'] as const;
const ACTION_LABEL: Record<string, string> = {
  ALL: 'الكل', CREATE: 'إنشاء', UPDATE: 'تعديل', DELETE: 'حذف',
};
const entityLabel = (slug: string) => ENTITY_CONFIGS[slug]?.arabicName ?? slug;

export default function AuditLogPage() {
  const [action, setAction] = useState<(typeof ACTIONS)[number]>('ALL');
  const [entity, setEntity] = useState('');
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string> = { pageSize: '100', sortBy: 'createdAt', sortDir: 'desc' };
    if (action !== 'ALL') p.filter_action = action;
    if (entity) p.filter_entity = entity;
    return p;
  }, [action, entity]);

  const { data, loading, refresh, pagination } = useEntities<AuditRow>('audit-log', params);

  return (
    <AppShell
      title="سجل التغييرات"
      subtitle={`${pagination.total} حدث`}
      showRefresh
      onRefresh={refresh}
    >
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label-base">الإجراء</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value as (typeof ACTIONS)[number])}
              className="input-base"
            >
              {ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">الكيان</label>
            <input
              type="text"
              value={entity}
              onChange={e => setEntity(e.target.value)}
              placeholder="مثال: ideas"
              className="input-base w-48"
            />
          </div>
        </div>
      </div>

      <DataTable
        data={data}
        title="الأحداث"
        columns={[
          { key: 'createdAt', label: 'التاريخ', type: 'date' },
          {
            key: 'action',
            label: 'الإجراء',
            render: (v) => <span className="badge badge-info">{ACTION_LABEL[String(v)] ?? String(v)}</span>,
          },
          { key: 'entity', label: 'الكيان', render: (v) => entityLabel(String(v)) },
          {
            key: 'entityId',
            label: 'السجل',
            render: (v) => v ? <span className="font-mono text-xs text-text-muted">{String(v).slice(0, 10)}…</span> : '—',
          },
          {
            key: 'userId',
            label: 'المستخدم',
            render: (_v, row) => row.user?.email ?? row.user?.name ?? row.userId,
          },
          { key: 'ipAddress', label: 'IP' },
          {
            key: 'changes',
            label: 'التفاصيل',
            render: (_v, row) => (
              <button
                onClick={() => setDetail(row)}
                className="p-1.5 rounded hover:bg-ministry-green-soft text-ministry-green-deep transition-colors"
                title="عرض التغييرات"
              >
                <Eye className="w-4 h-4" />
              </button>
            ),
          },
        ]}
        emptyMessage={loading ? 'جارٍ التحميل...' : 'لا توجد أحداث مطابقة'}
      />

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-xl shadow-strong w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  {ACTION_LABEL[detail.action] ?? detail.action} — {entityLabel(detail.entity)}
                </h2>
                <p className="text-xs text-text-muted mt-0.5" suppressHydrationWarning>
                  {formatDate(detail.createdAt)} · {detail.user?.email ?? detail.userId}
                  {detail.entityId ? ` · ${detail.entityId}` : ''}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-background-alt">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {detail.changes && typeof detail.changes === 'object' ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(detail.changes as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="flex flex-col border-b border-border/50 py-1.5">
                      <dt className="text-xs text-text-muted">{k}</dt>
                      <dd className="text-sm text-text-primary break-words whitespace-pre-wrap">
                        {v === null || v === undefined || v === '' ? '—' : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-text-muted">لا توجد تفاصيل تغييرات لهذا الحدث.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
