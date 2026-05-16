'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useState } from 'react';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Lightbulb, Eye, CheckCircle2, Rocket, AlertCircle } from 'lucide-react';

export default function IdeasDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('ideas', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const recent = data?.recent || [];

  return (
    <AppShell title="قمع الأفكار" subtitle="DASH-02 — تتبع الأفكار من التقديم للتنفيذ" showRefresh onRefresh={refresh} manageEntity="ideas">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', options: ['جديدة', 'موافق عليها', 'مرفوضة'] },
          { key: 'stage', label: 'المرحلة', type: 'select', lookupCategory: 'IdeaStage' },
          { key: 'category', label: 'القطاع', type: 'select', lookupCategory: 'IdeaCategory' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="إجمالي الأفكار" value={k.total || 0} icon={Lightbulb} variant="warning" loading={loading} />
        <KpiCard title="أفكار جديدة" value={k.new || 0} icon={Lightbulb} variant="info" loading={loading} />
        <KpiCard title="تحت التقييم" value={k.underReview || 0} icon={Eye} variant="warning" loading={loading} />
        <KpiCard title="موافق عليها" value={k.approved || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="منفّذة" value={k.implemented || 0} icon={Rocket} variant="success" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="مراحل الأفكار" description="حالة قمع الأفكار"><BarChartComponent data={c.byStage || []} horizontal /></ChartContainer>
        <ChartContainer title="القطاعات" description="توزيع الأفكار حسب القطاع"><DonutChart data={c.byCategory || []} /></ChartContainer>
        <ChartContainer title="الحالات العامة" description="توزيع حالات الأفكار"><DonutChart data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="أحدث الأفكار"
        data={recent}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'title', label: 'الفكرة' },
          { key: 'category', label: 'القطاع', type: 'badge' },
          { key: 'stage', label: 'المرحلة', type: 'status' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'submissionDate', label: 'تاريخ التقديم', type: 'date' },
        ]}
        emptyMessage="لا توجد أفكار بعد. أضف من 'إدارة البيانات > الأفكار'"
      />

      {!loading && k.total === 0 && (
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">قاعدة البيانات فارغة. ابدأ بإضافة أفكار من شاشة الإدارة.</div>
        </div>
      )}
    </AppShell>
  );
}
