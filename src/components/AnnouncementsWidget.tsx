'use client';

import { useEffect, useState } from 'react';
import { Megaphone, ExternalLink, AlertCircle } from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  body?: string;
  publishedAt?: string;
  severity?: 'info' | 'warning' | 'critical' | string;
  link?: string;
}

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'unconfigured' | 'error';
  items: Announcement[];
}

export function AnnouncementsWidget() {
  const [state, setState] = useState<FetchState>({ status: 'loading', items: [] });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/sanity?type=announcements', { signal: ctrl.signal })
      .then(async r => {
        if (r.status === 503) return { unconfigured: true };
        if (!r.ok) throw new Error(`http ${r.status}`);
        return r.json();
      })
      .then((res: { unconfigured?: boolean; data?: Announcement[] }) => {
        if (res.unconfigured) {
          setState({ status: 'unconfigured', items: [] });
          return;
        }
        setState({ status: 'ok', items: res.data ?? [] });
      })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === 'AbortError') return;
        setState({ status: 'error', items: [] });
      });
    return () => ctrl.abort();
  }, []);

  if (state.status === 'unconfigured') return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-ministry-green-deep" />
        <h3 className="text-base font-bold text-text-primary">إعلانات</h3>
      </div>

      {state.status === 'loading' && (
        <div className="space-y-2">
          <div className="h-12 rounded bg-background-alt animate-pulse" />
          <div className="h-12 rounded bg-background-alt animate-pulse" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <AlertCircle className="w-4 h-4" />
          <span>تعذّر تحميل الإعلانات</span>
        </div>
      )}

      {state.status === 'ok' && state.items.length === 0 && (
        <p className="text-sm text-text-muted">لا توجد إعلانات حالياً</p>
      )}

      {state.status === 'ok' && state.items.length > 0 && (
        <ul className="space-y-3">
          {state.items.map(a => (
            <li key={a._id} className="border-r-2 border-ministry-green pr-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary truncate">{a.title}</div>
                  {a.body && <div className="text-xs text-text-secondary line-clamp-2 mt-0.5">{a.body}</div>}
                  {a.publishedAt && (
                    <div className="text-xs text-text-muted mt-1">
                      {new Date(a.publishedAt).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </div>
                {a.link && (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-ministry-green-deep hover:bg-ministry-green-soft rounded"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
