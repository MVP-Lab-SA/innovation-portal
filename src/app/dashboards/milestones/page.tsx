'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Flag, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';

export default function MilestonesDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('milestones', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="المراحل الرئيسية" subtitle="DASH-18 — متابعة مراحل المبادرات" showRefresh onRefresh={refresh} manageEntity="milestones">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'MilestoneStatus' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي المراحل" value={k.total || 0} icon={Flag} variant="default" loading={loading} />
        <KpiCard title="مكتملة" value={k.completed || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="متأخرة" value={k.overdue || 0} icon={AlertTriangle} variant="danger" loading={loading} />
        <KpiCard title="متوسط التقدم %" value={k.avgProgress || 0} icon={TrendingUp} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="المراحل حسب الحالة"><DonutChart data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة المراحل"
        data={list}
        entitySlug="milestones"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'name', label: 'اسم المرحلة' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'progress', label: 'التقدم %', type: 'number' },
          { key: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
