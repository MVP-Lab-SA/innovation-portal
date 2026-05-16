'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { EntityForm } from '@/components/forms/EntityForm';
import { ENTITY_CONFIGS } from '@/lib/entityConfigs';
import { formatDate, formatCurrency } from '@/lib/utils';

type Row = Record<string, unknown>;

function isPlainObject(v: unknown): v is Row {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Pick a human label off a related record. */
function relLabel(r: Row): string {
  return String(
    r.title ?? r.name ?? r.fullName ?? r.partnerName ?? r.metricName ??
    r.criterionName ?? r.subject ?? r.code ?? r.id ?? '—',
  );
}

export function RecordDetail({ entity, id }: { entity: string; id: string }) {
  const router = useRouter();
  const config = ENTITY_CONFIGS[entity];
  const arabicName = config?.arabicName ?? entity;

  const [record, setRecord] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${entity}/${id}`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error === 'not_found' ? 'السجل غير موجود' : 'تعذّر تحميل السجل');
      }
      setRecord(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, [entity, id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/me').then(r => (r.ok ? r.json() : null)).then(p => p?.role && setRole(p.role)).catch(() => {});
  }, []);

  const canEdit = role === 'ADMIN' || role === 'EDITOR';
  const canDelete = role === 'ADMIN';

  const handleDelete = async () => {
    if (!confirm(`حذف ${String(record?.code ?? id)}؟`)) return;
    try {
      const res = await fetch(`/api/entities/${entity}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل الحذف');
      toast.success('تم الحذف');
      router.push(`/admin/data?entity=${entity}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل الحذف');
    }
  };

  if (!config) {
    return (
      <AppShell title="سجل غير معروف">
        <div className="card flex items-center gap-3 text-text-secondary">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>الكيان &quot;{entity}&quot; غير معرّف.</span>
        </div>
      </AppShell>
    );
  }

  const title = record
    ? `${arabicName}: ${String(record.code ?? relLabel(record))}`
    : arabicName;

  const fieldKeys = new Set(config.formFields.map(f => f.key));
  // Relation entries: array values, or object values that aren't form fields.
  const relations = record
    ? Object.entries(record).filter(([k, v]) =>
        !fieldKeys.has(k) && k !== 'id' && k !== 'createdAt' && k !== 'updatedAt' &&
        (Array.isArray(v) || isPlainObject(v)))
    : [];

  return (
    <AppShell
      title={title}
      subtitle={`عرض تفصيلي — ${id}`}
      showRefresh
      onRefresh={load}
      actions={
        <div className="flex items-center gap-2">
          <Link href={`/admin/data?entity=${entity}`} className="btn-secondary text-sm flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            <span>القائمة</span>
          </Link>
          {canEdit && record && (
            <button onClick={() => setEditing(true)} className="btn-primary text-sm flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              <span>تعديل</span>
            </button>
          )}
          {canDelete && record && (
            <button onClick={handleDelete} className="btn-secondary text-sm flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          )}
        </div>
      }
    >
      {loading && (
        <div className="card flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="card flex items-center gap-3 text-text-secondary">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {record && !loading && (
        <>
          <div className="card mb-6">
            <h3 className="text-base font-bold text-text-primary mb-4">البيانات الأساسية</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {record.code != null && (
                <div className="flex flex-col">
                  <dt className="text-xs text-text-muted">المعرّف</dt>
                  <dd className="text-sm font-medium text-text-primary">{String(record.code)}</dd>
                </div>
              )}
              {config.formFields.map(f => {
                const v = record[f.key];
                let display: string;
                if (v == null || v === '') display = '—';
                else if (f.type === 'date' || f.type === 'datetime') display = formatDate(v as string);
                else if (f.type === 'currency') display = formatCurrency(v as number);
                else display = String(v);
                return (
                  <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2 flex flex-col' : 'flex flex-col'}>
                    <dt className="text-xs text-text-muted">{f.label}</dt>
                    <dd className="text-sm font-medium text-text-primary whitespace-pre-wrap">{display}</dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {relations.map(([key, value]) => (
            <div key={key} className="card mb-6">
              <h3 className="text-base font-bold text-text-primary mb-4">
                {key} {Array.isArray(value) && <span className="text-text-muted font-normal">({value.length})</span>}
              </h3>
              {Array.isArray(value) ? (
                value.length === 0 ? (
                  <p className="text-sm text-text-muted">لا توجد سجلات مرتبطة</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {(value as Row[]).map((r, i) => (
                      <li key={String(r.id ?? i)} className="py-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-text-primary">{relLabel(r)}</span>
                        {r.status != null && <span className="badge badge-info">{String(r.status)}</span>}
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="text-sm text-text-primary">{relLabel(value as Row)}</p>
              )}
            </div>
          ))}
        </>
      )}

      {editing && record && (
        <EntityForm
          title={`تعديل: ${String(record.code ?? id)}`}
          entity={entity}
          fields={config.formFields}
          initial={record}
          isEdit
          onSuccess={load}
          onClose={() => setEditing(false)}
        />
      )}
    </AppShell>
  );
}
