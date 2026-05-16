'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { ENTITY_CONFIGS } from '@/lib/entityConfigs';

interface SearchItem { id: string; code: string | null; label: string | null }
interface SearchGroup { entity: string; items: SearchItem[] }

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setGroups([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          const d = await res.json();
          setGroups(d.groups || []);
          setSearched(true);
        }
      } catch (e: unknown) {
        if ((e as { name?: string })?.name !== 'AbortError') setGroups([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const totalHits = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <AppShell title="البحث الشامل" subtitle="ابحث عبر كل سجلات المنصة">
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="اكتب معرّفاً أو اسماً (حرفان على الأقل)..."
            className="input-base pr-11 text-base"
            autoFocus
          />
        </div>
      </div>

      {loading && (
        <div className="card flex items-center justify-center py-10 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!loading && searched && totalHits === 0 && (
        <div className="card text-sm text-text-muted text-center py-10">
          لا توجد نتائج مطابقة لـ &quot;{q.trim()}&quot;
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="space-y-6">
          {groups.map(g => (
            <div key={g.entity} className="card">
              <h3 className="text-base font-bold text-text-primary mb-3">
                {ENTITY_CONFIGS[g.entity]?.arabicName ?? g.entity}
                <span className="text-text-muted font-normal"> ({g.items.length})</span>
              </h3>
              <ul className="divide-y divide-border">
                {g.items.map(item => (
                  <li key={item.id}>
                    <Link
                      href={`/records/${g.entity}/${item.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-background-alt rounded-lg px-2 transition-colors"
                    >
                      {item.code && <span className="badge badge-info text-xs">{item.code}</span>}
                      <span className="text-sm text-text-primary">{item.label ?? '—'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
