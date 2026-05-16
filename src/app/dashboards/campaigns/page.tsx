'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useState } from 'react';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Trophy, DoorOpen, DoorClosed, Send, Puzzle } from 'lucide-react';

export default function CampaignsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('campaigns', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="الحملات" subtitle="DASH-03 — موجات إطلاق تحديات الأعمال ضمن أطر زمنية ومسارات" showRefresh onRefresh={refresh} manageEntity="campaigns">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'ChallengeStatus' },
          { key: 'category', label: 'الفئة', type: 'select', lookupCategory: 'ChallengeCategory' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="إجمالي الحملات" value={k.total || 0} icon={Trophy} variant="default" loading={loading} />
        <KpiCard title="تحديات مشمولة" value={k.challengesCovered || 0} icon={Puzzle} variant="info" loading={loading} />
        <KpiCard title="مفتوحة" value={k.open || 0} icon={DoorOpen} variant="success" loading={loading} />
        <KpiCard title="مغلقة" value={k.closed || 0} icon={DoorClosed} variant="neutral" loading={loading} />
        <KpiCard title="إجمالي المقدّمات" value={k.totalSubmissions || 0} icon={Send} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartContainer title="طرق التنفيذ"><BarChartComponent data={c.byMethod || []} horizontal /></ChartContainer>
        <ChartContainer title="الحالات"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="المسارات"><DonutChart data={c.byTrack || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة الحملات"
        entitySlug="campaigns"
        data={list}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'title', label: 'العنوان' },
          { key: 'track', label: 'المسار', type: 'badge' },
          { key: 'deliveryMethod', label: 'طريقة التنفيذ', type: 'badge' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'launchDate', label: 'تاريخ الإطلاق', type: 'date' },
          { key: 'closingDate', label: 'تاريخ الإغلاق', type: 'date' },
          { key: 'prizeAmount', label: 'الجائزة', type: 'currency' },
        ]}
      />
    </AppShell>
  );
}
