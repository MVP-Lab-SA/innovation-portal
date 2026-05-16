'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil, Trash2, Loader2, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, XCircle, Plus, Compass, Trophy, TestTube, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { EntityForm } from '@/components/forms/EntityForm';
import { ENTITY_CONFIGS } from '@/lib/entityConfigs';
import { formatDate, formatCurrency } from '@/lib/utils';

type Row = Record<string, unknown>;

function isPlainObject(v: unknown): v is Row {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Lightweight approval flows: entities where the detail page offers
 * approve/reject buttons that set a status field. Setting the status
 * also triggers a STATUS_CHANGED notification (see emitForCrud).
 */
const APPROVAL_FLOWS: Record<string, { field: string; approve: string; reject: string }> = {
  ideas: { field: 'status', approve: 'موافق عليها', reject: 'مرفوضة' },
};

/**
 * Add-relation map: for a parent entity, which related-record sections can
 * have a new junction row added inline, and which junction entity + parent
 * FK field to seed the form with.
 */
const ADD_RELATION: Record<string, Record<string, { entity: string; parentField: string }>> = {
  ideas: { expertAssignments: { entity: 'idea-expert-assignments', parentField: 'ideaId' } },
  initiatives: { partners: { entity: 'initiative-partners', parentField: 'initiativeId' } },
  campaigns: {
    expertAssignments: { entity: 'expert-challenge-assignments', parentField: 'challengeId' },
    businessChallengeLinks: { entity: 'campaign-business-challenges', parentField: 'campaignId' },
    sandboxApplications: { entity: 'sandbox-applications', parentField: 'campaignId' },
  },
  'business-challenges': {
    children: { entity: 'business-challenges', parentField: 'parentId' },
    campaignLinks: { entity: 'campaign-business-challenges', parentField: 'businessChallengeId' },
    pilots: { entity: 'pilots', parentField: 'businessChallengeId' },
    sandboxApplications: { entity: 'sandbox-applications', parentField: 'businessChallengeId' },
  },
};

/** Arabic labels for relation section keys (avoids showing raw field names). */
const RELATION_LABELS: Record<string, string> = {
  submitterCem: 'مقدّم الفكرة',
  relatedChallenge: 'الحملة المرتبطة',
  evaluations: 'التقييمات',
  expertAssignments: 'الخبراء المعيّنون',
  ideaAssignments: 'الأفكار المُسندة',
  owner: 'المالك',
  milestones: 'المراحل الرئيسية',
  tasks: 'المهام',
  partners: 'الشركاء',
  ideas: 'الأفكار',
  sponsorships: 'الرعايات',
  interactions: 'التفاعلات',
  strategicSource: 'المصدر الاستراتيجي',
  user: 'المستخدم',
  parent: 'التحدي الرئيسي',
  children: 'التحديات الفرعية',
  campaignLinks: 'الحملات المرتبطة',
  businessChallengeLinks: 'تحديات الأعمال المشمولة',
  pilots: 'التجارب المرتبطة',
  businessChallenge: 'تحدي الأعمال المرتبط',
  campaign: 'الحملة',
  sandboxApplications: 'طلبات الساندبوكس',
  pilot: 'التجربة الناتجة',
  idea: 'الفكرة',
  partner: 'الشريك',
};

/** Pick a human label off a related record — never falls back to a raw ID. */
function relLabel(r: Row): string {
  const direct =
    r.title ?? r.name ?? r.fullName ?? r.partnerName ?? r.metricName ??
    r.criterionName ?? r.subject ?? r.sourceName ?? r.solutionName;
  if (direct) return String(direct);
  // Dig into a nested relation object (e.g. junction rows carry `expert`/`partner`).
  for (const nk of ['expert', 'partner', 'idea', 'challenge', 'campaign', 'businessChallenge', 'initiative', 'submitterCem']) {
    const nested = r[nk];
    if (nested && typeof nested === 'object') {
      const n = nested as Row;
      const nl = n.fullName ?? n.partnerName ?? n.title ?? n.name ?? n.code;
      if (nl) return String(nl);
    }
  }
  return String(r.code ?? '—');
}

/**
 * Innovation-funnel strip for a business challenge: strategic source →
 * campaigns → sandbox applications → pilots. Counts come from the
 * relations included on the detail record.
 */
function FunnelStrip({ record }: { record: Row }) {
  const count = (k: string) => (Array.isArray(record[k]) ? (record[k] as unknown[]).length : 0);
  const stages = [
    {
      label: 'المصدر الاستراتيجي',
      value: isPlainObject(record.strategicSource) ? relLabel(record.strategicSource) : '—',
      icon: Compass,
    },
    { label: 'الحملات', value: count('campaignLinks'), icon: Trophy },
    { label: 'طلبات الساندبوكس', value: count('sandboxApplications'), icon: TestTube },
    { label: 'التجارب التشغيلية', value: count('pilots'), icon: FlaskConical },
  ];
  return (
    <div className="card mb-6">
      <h3 className="text-base font-bold text-text-primary mb-4">مسار التحدي في منظومة الابتكار</h3>
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {stages.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-ministry-green-soft min-w-32">
                <Icon className="w-5 h-5 text-ministry-green-deep" />
                <div className="text-lg font-extrabold text-ministry-green-deep">{s.value}</div>
                <div className="text-xs text-text-secondary text-center">{s.label}</div>
              </div>
              {i < stages.length - 1 && <ArrowLeft className="w-4 h-4 text-text-muted flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
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
  const [addRel, setAddRel] = useState<{ entity: string; parentField: string } | null>(null);

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

  const flow = APPROVAL_FLOWS[entity];
  const applyDecision = async (decision: 'approve' | 'reject') => {
    if (!flow) return;
    const value = decision === 'approve' ? flow.approve : flow.reject;
    if (!confirm(decision === 'approve' ? 'اعتماد هذا السجل؟' : 'رفض هذا السجل؟')) return;
    try {
      const res = await fetch(`/api/entities/${entity}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [flow.field]: value }),
      });
      if (!res.ok) throw new Error('فشل تحديث الحالة');
      toast.success(decision === 'approve' ? 'تم الاعتماد' : 'تم الرفض');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل التحديث');
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
  // Singular relations behind a `reference` form field (e.g. `campaign`
  // for `campaignId`) — already shown resolved in the basic grid, so they
  // are excluded from the relation-card section to avoid duplication.
  const refRelKeys = new Set(
    config.formFields.filter(f => f.type === 'reference').map(f => f.key.replace(/Id$/, '')),
  );
  // Relation entries: array values, or object values that aren't form fields.
  const relations = record
    ? Object.entries(record).filter(([k, v]) =>
        !fieldKeys.has(k) && !refRelKeys.has(k) &&
        k !== 'id' && k !== 'createdAt' && k !== 'updatedAt' &&
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
          {canEdit && record && flow && (
            <>
              <button
                onClick={() => applyDecision('approve')}
                className="btn-secondary text-sm flex items-center gap-2 text-ministry-green-deep"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد</span>
              </button>
              <button
                onClick={() => applyDecision('reject')}
                className="btn-secondary text-sm flex items-center gap-2 text-red-600"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض</span>
              </button>
            </>
          )}
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
                else if (f.type === 'reference') {
                  // Show the linked record's label, not the raw id.
                  const rel = record[f.key.replace(/Id$/, '')];
                  display = isPlainObject(rel) ? relLabel(rel) : String(v);
                }
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

          {entity === 'business-challenges' && <FunnelStrip record={record} />}

          {relations.map(([key, value]) => {
            const addCfg = ADD_RELATION[entity]?.[key];
            return (
            <div key={key} className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-primary">
                  {RELATION_LABELS[key] ?? key}
                  {Array.isArray(value) && <span className="text-text-muted font-normal"> ({value.length})</span>}
                </h3>
                {addCfg && canEdit && (
                  <button
                    onClick={() => setAddRel(addCfg)}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </button>
                )}
              </div>
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
            );
          })}
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

      {addRel && ENTITY_CONFIGS[addRel.entity] && (
        <EntityForm
          title={`إضافة: ${ENTITY_CONFIGS[addRel.entity].arabicName}`}
          entity={addRel.entity}
          fields={ENTITY_CONFIGS[addRel.entity].formFields}
          initial={{ [addRel.parentField]: id }}
          onSuccess={load}
          onClose={() => setAddRel(null)}
        />
      )}
    </AppShell>
  );
}
