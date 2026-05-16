'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { GraduationCap, CheckCircle2, Layers } from 'lucide-react';

export default function ExpertsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('experts', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="شبكة الخبراء" subtitle="DASH-11 — تحليل شبكة الخبراء" showRefresh onRefresh={refresh} manageEntity="experts">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'ExpertStatus' },
          { key: 'category', label: 'الفئة', type: 'select', lookupCategory: 'ExpertCategory' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي الخبراء" value={k.total || 0} icon={GraduationCap} variant="default" loading={loading} />
        <KpiCard title="نشطون" value={k.active || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="عدد الفئات" value={k.categories || 0} icon={Layers} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="الخبراء حسب الفئة"><DonutChart data={c.byCategory || []} /></ChartContainer>
        <ChartContainer title="الخبراء حسب الحالة"><BarChartComponent data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة الخبراء"
        data={list}
        entitySlug="experts"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'fullName', label: 'الاسم' },
          { key: 'category', label: 'الفئة', type: 'badge' },
          { key: 'specialization', label: 'التخصص' },
          { key: 'status', label: 'الحالة', type: 'status' },
        ]}
      />
    </AppShell>
  );
}
