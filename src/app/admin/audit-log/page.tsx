'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { useEntities } from '@/hooks/useData';

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

export default function AuditLogPage() {
  const [action, setAction] = useState<(typeof ACTIONS)[number]>('ALL');
  const [entity, setEntity] = useState('');

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
              {ACTIONS.map(a => <option key={a} value={a}>{a === 'ALL' ? 'الكل' : a}</option>)}
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
          { key: 'action', label: 'الإجراء', type: 'badge' },
          { key: 'entity', label: 'الكيان' },
          { key: 'entityId', label: 'معرّف السجل' },
          {
            key: 'userId',
            label: 'المستخدم',
            render: (_v, row) => row.user?.email ?? row.user?.name ?? row.userId,
          },
          { key: 'ipAddress', label: 'IP' },
        ]}
        emptyMessage={loading ? 'جارٍ التحميل...' : 'لا توجد أحداث مطابقة'}
      />
    </AppShell>
  );
}
