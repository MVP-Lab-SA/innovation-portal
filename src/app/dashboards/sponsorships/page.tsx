'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Gift, CheckCircle2, DollarSign } from 'lucide-react';

export default function SponsorshipsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('sponsorships', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="الرعايات" subtitle="DASH-16 — تحليل رعايات الشركاء" showRefresh onRefresh={refresh} manageEntity="sponsorships">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'SponsorshipStatus' },
          { key: 'category', label: 'نوع الرعاية', type: 'select', lookupCategory: 'SponsorshipType' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي الرعايات" value={k.total || 0} icon={Gift} variant="default" loading={loading} />
        <KpiCard title="نشطة" value={k.active || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="القيمة الإجمالية" value={k.totalValueSar || 0} icon={DollarSign} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="الرعايات حسب المستوى"><DonutChart data={c.byTier || []} /></ChartContainer>
        <ChartContainer title="الرعايات حسب الحالة"><BarChartComponent data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة الرعايات"
        data={list}
        entitySlug="sponsorships"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'sponsorshipTier', label: 'المستوى', type: 'badge' },
          { key: 'totalValueSar', label: 'القيمة', type: 'currency' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
