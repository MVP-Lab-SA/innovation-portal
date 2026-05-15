'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { Megaphone, Eye, Heart, BarChart3 } from 'lucide-react';

export default function CommunicationsDashboard() {
  const { data, loading, refresh } = useDashboard<any>('communications');
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="التواصل والإعلام" subtitle="DASH-10 — الحملات والظهور الإعلامي" showRefresh onRefresh={refresh} manageEntity="communications">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي الحملات" value={k.total || 0} icon={Megaphone} variant="default" loading={loading} />
        <KpiCard title="إجمالي الوصول" value={k.totalReach || 0} icon={Eye} variant="info" loading={loading} />
        <KpiCard title="إجمالي التفاعل" value={k.totalEngagement || 0} icon={Heart} variant="success" loading={loading} />
        <KpiCard title="معدل التفاعل" value={k.avgEngagementRate || 0} suffix="%" icon={BarChart3} variant="warning" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="القنوات"><DonutChart data={c.byChannel || []} /></ChartContainer>
        <ChartContainer title="الجمهور المستهدف"><DonutChart data={c.byAudience || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة الحملات الإعلامية"
        data={list}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'title', label: 'العنوان' },
          { key: 'channel', label: 'القناة', type: 'badge' },
          { key: 'audience', label: 'الجمهور', type: 'badge' },
          { key: 'publishDate', label: 'تاريخ النشر', type: 'date' },
          { key: 'reach', label: 'الوصول', type: 'number' },
          { key: 'engagement', label: 'التفاعل', type: 'number' },
        ]}
      />
    </AppShell>
  );
}
