'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

export function useDashboard<T = unknown>(
  dashboardId: string,
  params: Record<string, string> = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
      const query = qs.toString();
      const url = `/api/dashboards/${dashboardId}${query ? `?${query}` : ''}`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed');
      }
      const result = await res.json();
      if (!ctrl.signal.aborted) setData(result);
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'AbortError') return;
      setError(errMessage(e));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId, paramsKey]);

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useEntities<T = unknown>(entity: string, params: Record<string, unknown> = {}) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
      const res = await fetch(`/api/entities/${entity}?${qs}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      if (ctrl.signal.aborted) return;
      setData(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'AbortError') return;
      setError(errMessage(e));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, paramsKey]);

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  return { data, pagination, loading, error, refresh: fetchData };
}

export function useLookup(category: string) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/lookups?category=${encodeURIComponent(category)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { if (!ctrl.signal.aborted) setValues(data.values || []); })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name !== 'AbortError') setValues([]);
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [category]);

  return { values, loading };
}
