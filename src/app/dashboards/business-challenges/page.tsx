'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Puzzle, Flag, AlertTriangle, DoorOpen, Trophy } from 'lucide-react';

export default function BusinessChallengesDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('business-challenges', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell
      title="التحديات وفرص الأعمال"
      subtitle="DASH-20 — التحديات الاستراتيجية التي تُشتق منها الهاكاثونات والأفكار"
      showRefresh
      onRefresh={refresh}
      manageEntity="business-challenges"
    >
      <DashboardFilters
        fields={[
          { key: 'status', label: 'حالة التحدي', type: 'select', lookupCategory: 'BusinessChallengeStatus' },
          { key: 'category', label: 'المجال', type: 'select', lookupCategory: 'BusinessChallengeDomain' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="إجمالي التحديات" value={k.total || 0} icon={Puzzle} variant="default" loading={loading} />
        <KpiCard title="تحديات رئيسية" value={k.mainChallenges || 0} icon={Flag} variant="info" loading={loading} />
        <KpiCard title="أولوية عالية" value={k.highPriority || 0} icon={AlertTriangle} variant="warning" loading={loading} />
        <KpiCard title="مفتوحة / قيد المعالجة" value={k.open || 0} icon={DoorOpen} variant="success" loading={loading} />
        <KpiCard title="هاكاثونات مشتقة" value={k.derivedEvents || 0} icon={Trophy} variant="neutral" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="التحديات حسب المجال"><BarChartComponent data={c.byDomain || []} horizontal /></ChartContainer>
        <ChartContainer title="التحديات حسب الأولوية"><DonutChart data={c.byPriority || []} /></ChartContainer>
        <ChartContainer title="التحديات حسب الحالة"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="التحديات حسب النوع"><BarChartComponent data={c.byType || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة التحديات وفرص الأعمال"
        data={list}
        entitySlug="business-challenges"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'sequence', label: 'التسلسل', width: '90px', type: 'badge' },
          { key: 'title', label: 'التحدي' },
          { key: 'domain', label: 'المجال', type: 'badge' },
          { key: 'challengeType', label: 'النوع', type: 'badge' },
          { key: 'priority', label: 'الأولوية', type: 'badge' },
          { key: 'status', label: 'الحالة', type: 'status' },
        ]}
      />
    </AppShell>
  );
}
