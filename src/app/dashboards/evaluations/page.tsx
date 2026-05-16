'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { ClipboardCheck, CheckCircle2, Clock, Star } from 'lucide-react';

export default function EvaluationsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('evaluations', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="تقييمات الأفكار" subtitle="DASH-17 — تحليل التقييمات" showRefresh onRefresh={refresh} manageEntity="evaluations">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'EvaluationStatus' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي التقييمات" value={k.total || 0} icon={ClipboardCheck} variant="default" loading={loading} />
        <KpiCard title="مكتملة" value={k.completed || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="جارية" value={k.inProgress || 0} icon={Clock} variant="warning" loading={loading} />
        <KpiCard title="متوسط الدرجة" value={k.avgScore || 0} icon={Star} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="التقييمات حسب الحالة"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="التقييمات حسب التوصية"><BarChartComponent data={c.byRecommendation || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة التقييمات"
        data={list}
        entitySlug="evaluations"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'overallScore', label: 'الدرجة الكلية', type: 'number' },
          { key: 'recommendation', label: 'التوصية' },
          { key: 'evaluationDate', label: 'تاريخ التقييم', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
