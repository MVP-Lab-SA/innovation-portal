'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { Target, TrendingUp, TrendingDown, AlertCircle, Award } from 'lucide-react';

export default function MetricsDashboard() {
  const { data, loading, refresh } = useDashboard<any>('metrics');
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="المؤشرات والأثر" subtitle="DASH-09 — قياس الأداء والإنجاز" showRefresh onRefresh={refresh} manageEntity="metrics">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="إجمالي المؤشرات" value={k.total || 0} icon={Target} variant="default" loading={loading} />
        <KpiCard title="على المسار" value={k.onTrack || 0} icon={TrendingUp} variant="success" loading={loading} />
        <KpiCard title="تجاوز المستهدف" value={k.exceeded || 0} icon={Award} variant="info" loading={loading} />
        <KpiCard title="في خطر" value={k.atRisk || 0} icon={AlertCircle} variant="warning" loading={loading} />
        <KpiCard title="خارج المسار" value={k.offTrack || 0} icon={TrendingDown} variant="danger" loading={loading} />
      </div>
      
      <div className="card mb-6 bg-gradient-to-l from-ministry-green-soft to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">متوسط الإنجاز العام</h3>
            <p className="text-sm text-text-secondary">عبر جميع المؤشرات</p>
          </div>
          <div className="text-5xl font-extrabold text-ministry-green-deep tabular-nums">
            {k.avgAchievement || 0}<span className="text-2xl">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="توزيع حالات المؤشرات"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="فئات المؤشرات"><BarChartComponent data={c.byCategory || []} horizontal /></ChartContainer>
      </div>

      <DataTable
        title="قائمة المؤشرات"
        data={list}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'metricName', label: 'اسم المؤشر' },
          { key: 'category', label: 'الفئة', type: 'badge' },
          { key: 'targetValue', label: 'المستهدف', type: 'number' },
          { key: 'currentValue', label: 'الحالي', type: 'number' },
          { key: 'achievementPct', label: 'الإنجاز %', type: 'number' },
          { key: 'status', label: 'الحالة', type: 'status' },
        ]}
      />
    </AppShell>
  );
}
