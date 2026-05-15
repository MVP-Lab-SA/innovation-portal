'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';

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

export function DashboardFilters({ fields, onChange, initial = {} }: DashboardFiltersProps) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [lookups, setLookups] = useState<Record<string, string[]>>({});

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

  const set = (k: string, v: string) => {
    const next = { ...values, [k]: v };
    if (!v) delete next[k];
    setValues(next);
    onChange(next);
  };

  const clear = () => {
    setValues({});
    onChange({});
  };

  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="card mb-4">
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
      </div>
    </div>
  );
}
