'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronDown, X, Search } from 'lucide-react';

type Row = Record<string, unknown>;

/** Human label for a related record — never a raw id. */
function recordLabel(r: Row): string {
  return String(
    r.title ?? r.name ?? r.fullName ?? r.partnerName ?? r.solutionName ??
    r.sourceName ?? r.metricName ?? r.subject ?? r.code ?? r.id ?? '—',
  );
}

/**
 * Searchable picker for a foreign-key field: the user chooses a record by
 * its title/code; the field stores the record id.
 */
export function RelationField({
  entity,
  value,
  onChange,
  placeholder,
}: {
  entity: string;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Resolve a label for an already-set value (e.g. when editing a record).
  useEffect(() => {
    if (!value) {
      setSelectedLabel(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/entities/${entity}/${value}`)
      .then(r => (r.ok ? r.json() : null))
      .then(rec => { if (!cancelled && rec) setSelectedLabel(recordLabel(rec)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [entity, value]);

  // Search while the dropdown is open (debounced).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/entities/${entity}?pageSize=20&search=${encodeURIComponent(query)}`)
        .then(r => (r.ok ? r.json() : { data: [] }))
        .then(d => { if (!cancelled) setResults(d.data || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [entity, query, open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-base flex items-center justify-between gap-2 w-full"
      >
        <span className={selectedLabel ? 'text-text-primary truncate' : 'text-text-muted'}>
          {selectedLabel || placeholder || '-- اختر --'}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <X
              className="w-4 h-4 text-text-muted hover:text-red-500"
              onClick={e => { e.stopPropagation(); onChange(''); setSelectedLabel(null); }}
            />
          )}
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-strong max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="بحث..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-4">لا توجد نتائج</div>
            ) : (
              results.map(r => (
                <button
                  type="button"
                  key={String(r.id)}
                  onClick={() => {
                    onChange(String(r.id));
                    setSelectedLabel(recordLabel(r));
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-ministry-green-soft flex items-center justify-between gap-2"
                >
                  <span className="truncate">{recordLabel(r)}</span>
                  {r.code != null && (
                    <span className="text-xs text-text-muted font-mono flex-shrink-0">{String(r.code)}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
