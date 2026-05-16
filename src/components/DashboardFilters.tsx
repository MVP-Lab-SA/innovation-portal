'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Filter, X, Link2 } from 'lucide-react';

export interface FilterFieldDef {
  key: string;
  label: string;
  type: 'select' | 'date';
  options?: string[]; // for select
  lookupCategory?: string; // resolved at runtime
}

interface DashboardFiltersProps {
  fields: FilterFieldDef[];
  /** Called with the current filter values whenever they change. */
  onChange: (values: Record<string, string>) => void;
  initial?: Record<string, string>;
}

/**
 * Reads/writes filter state to the URL query string via history.replaceState
 * (NOT useSearchParams — that forces a Suspense boundary / breaks static
 * prerender). This makes a filtered dashboard view a shareable link.
 */
export function DashboardFilters({ fields, onChange, initial = {} }: DashboardFiltersProps) {
  const fieldKeys = fields.map(f => f.key);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [lookups, setLookups] = useState<Record<string, string[]>>({});
  const seeded = useRef(false);

  // Seed from the URL once on mount, so a shared link restores its filters.
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const sp = new URLSearchParams(window.location.search);
    const fromUrl: Record<string, string> = {};
    for (const k of fieldKeys) {
      const v = sp.get(k);
      if (v) fromUrl[k] = v;
    }
    if (Object.keys(fromUrl).length > 0) {
      setValues(fromUrl);
      onChange(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const toFetch = fields.filter(f => f.lookupCategory);
    Promise.all(
      toFetch.map(async f => {
        const res = await fetch(`/api/lookups?category=${encodeURIComponent(f.lookupCategory!)}`, { signal: ctrl.signal });
        const data = await res.json();
        return [f.lookupCategory!, (data.values as string[]) ?? []] as const;
      }),
    )
      .then(pairs => setLookups(Object.fromEntries(pairs)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [fields]);

  // Reflect the current filters into the URL without a navigation.
  const syncUrl = (next: Record<string, string>) => {
    const sp = new URLSearchParams(window.location.search);
    for (const k of fieldKeys) sp.delete(k);
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
    const qs = sp.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  };

  const set = (k: string, v: string) => {
    const next = { ...values, [k]: v };
    if (!v) delete next[k];
    setValues(next);
    syncUrl(next);
    onChange(next);
  };

  const clear = () => {
    setValues({});
    syncUrl({});
    onChange({});
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ رابط العرض المُفلتر');
    } catch {
      toast.error('تعذّر نسخ الرابط');
    }
  };

  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="card mb-4 print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <Filter className="w-4 h-4 text-ministry-green-deep mb-2.5" />
        {fields.map(f => {
          const options = f.lookupCategory ? lookups[f.lookupCategory] ?? [] : f.options ?? [];
          return (
            <div key={f.key}>
              <label className="label-base">{f.label}</label>
              {f.type === 'date' ? (
                <input
                  type="date"
                  value={values[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  className="input-base"
                />
              ) : (
                <select
                  value={values[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  className="input-base"
                >
                  <option value="">الكل</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
          );
        })}
        {activeCount > 0 && (
          <button
            onClick={clear}
            className="btn-secondary text-xs flex items-center gap-1.5 mb-0.5"
            title="إزالة كل الفلاتر"
          >
            <X className="w-3 h-3" />
            <span>مسح ({activeCount})</span>
          </button>
        )}
        <button
          onClick={copyLink}
          className="btn-secondary text-xs flex items-center gap-1.5 mb-0.5"
          title="نسخ رابط هذا العرض"
        >
          <Link2 className="w-3 h-3" />
          <span>نسخ الرابط</span>
        </button>
      </div>
    </div>
  );
}
