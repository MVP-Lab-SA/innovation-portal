'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useState } from 'react';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { FlaskConical, Play, CheckCircle2, Clock } from 'lucide-react';

export default function PilotsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('pilots', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="التجارب التشغيلية" subtitle="DASH-05 — إدارة التجارب الميدانية" showRefresh onRefresh={refresh} manageEntity="pilots">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'PilotStatus' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي التجارب" value={k.total || 0} icon={FlaskConical} variant="default" loading={loading} />
        <KpiCard title="جارية" value={k.running || 0} icon={Play} variant="info" loading={loading} />
        <KpiCard title="مكتملة" value={k.completed || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="مخطط لها" value={k.planned || 0} icon={Clock} variant="warning" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="توزيع حالات التجارب"><DonutChart data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة التجارب"
        entitySlug="pilots"
        data={list}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'name', label: 'اسم التجربة' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
          { key: 'endDate', label: 'تاريخ الانتهاء', type: 'date' },
          { key: 'budgetSar', label: 'الميزانية', type: 'currency' },
        ]}
      />
    </AppShell>
  );
}
