'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Compass, Star, Layers } from 'lucide-react';

export default function StrategicSourcesDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('strategic-sources', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="المصادر الاستراتيجية" subtitle="DASH-15 — تحليل مصادر التحديات" showRefresh onRefresh={refresh} manageEntity="strategic-sources">
      <DashboardFilters
        fields={[
          { key: 'category', label: 'نوع المصدر', type: 'select', lookupCategory: 'StrategicSourceType' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي المصادر" value={k.total || 0} icon={Compass} variant="default" loading={loading} />
        <KpiCard title="عالية الأهمية" value={k.highRelevance || 0} icon={Star} variant="success" loading={loading} />
        <KpiCard title="عدد الأنواع" value={k.types || 0} icon={Layers} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="المصادر حسب النوع"><DonutChart data={c.byType || []} /></ChartContainer>
        <ChartContainer title="المصادر حسب الأهمية"><BarChartComponent data={c.byRelevance || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة المصادر"
        data={list}
        entitySlug="strategic-sources"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'sourceName', label: 'اسم المصدر' },
          { key: 'sourceType', label: 'النوع', type: 'badge' },
          { key: 'relevance', label: 'الأهمية' },
        ]}
      />
    </AppShell>
  );
}
