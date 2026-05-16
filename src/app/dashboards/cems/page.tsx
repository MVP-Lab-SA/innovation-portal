'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Sparkles, CheckCircle2, Layers } from 'lucide-react';

export default function CemsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('cems', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="المبتكرون" subtitle="DASH-14 — تحليل المبتكرين والأفراد" showRefresh onRefresh={refresh} manageEntity="cems">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'CemStatus' },
          { key: 'category', label: 'مجال الابتكار', type: 'select', lookupCategory: 'IdeaCategory' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي المبتكرين" value={k.total || 0} icon={Sparkles} variant="default" loading={loading} />
        <KpiCard title="نشطون" value={k.active || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="مجالات الابتكار" value={k.fields || 0} icon={Layers} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="المبتكرون حسب المجال"><DonutChart data={c.byField || []} /></ChartContainer>
        <ChartContainer title="المبتكرون حسب الحالة"><BarChartComponent data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة المبتكرين"
        data={list}
        entitySlug="cems"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'fullName', label: 'الاسم' },
          { key: 'jobTitle', label: 'المسمى' },
          { key: 'innovationField', label: 'مجال الابتكار', type: 'badge' },
          { key: 'status', label: 'الحالة', type: 'status' },
        ]}
      />
    </AppShell>
  );
}
