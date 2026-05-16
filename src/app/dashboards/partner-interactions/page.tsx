'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { MessageCircle, CalendarClock, CalendarCheck } from 'lucide-react';

export default function PartnerInteractionsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('partner-interactions', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="تفاعلات الشركاء" subtitle="DASH-19 — سجل التواصل مع الشركاء" showRefresh onRefresh={refresh} manageEntity="partner-interactions">
      <DashboardFilters
        fields={[
          { key: 'category', label: 'نوع التفاعل', type: 'select', lookupCategory: 'InteractionType' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي التفاعلات" value={k.total || 0} icon={MessageCircle} variant="default" loading={loading} />
        <KpiCard title="هذا الشهر" value={k.thisMonth || 0} icon={CalendarCheck} variant="success" loading={loading} />
        <KpiCard title="متابعات قادمة" value={k.upcomingFollowUps || 0} icon={CalendarClock} variant="warning" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="التفاعلات حسب النوع"><DonutChart data={c.byType || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة التفاعلات"
        data={list}
        entitySlug="partner-interactions"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'interactionType', label: 'النوع', type: 'badge' },
          { key: 'subject', label: 'الموضوع' },
          { key: 'interactionDate', label: 'التاريخ', type: 'date' },
          { key: 'followUpDate', label: 'تاريخ المتابعة', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
