'use client';

import { useEffect, useState, useCallback } from 'react';

export function useDashboard<T = any>(dashboardId: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboards/${dashboardId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      const result = await res.json();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dashboardId]);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  return { data, loading, error, refresh: fetchData };
}

export function useEntities<T = any>(entity: string, params: Record<string, any> = {}) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
      const res = await fetch(`/api/entities/${entity}?${qs}`);
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      setData(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entity, JSON.stringify(params)]);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  return { data, pagination, loading, error, refresh: fetchData };
}

export function useLookup(category: string) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/lookups?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(data => setValues(data.values || []))
      .catch(() => setValues([]))
      .finally(() => setLoading(false));
  }, [category]);
  
  return { values, loading };
}
