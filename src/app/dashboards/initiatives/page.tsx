'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { Briefcase, Play, CheckCircle2, TrendingUp, DollarSign, PiggyBank } from 'lucide-react';

export default function InitiativesDashboard() {
  const { data, loading, refresh } = useDashboard<any>('initiatives');
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="محفظة المبادرات" subtitle="DASH-06 — متابعة المبادرات النشطة" showRefresh onRefresh={refresh} manageEntity="initiatives">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي المبادرات" value={k.total || 0} icon={Briefcase} variant="default" loading={loading} />
        <KpiCard title="قيد التنفيذ" value={k.active || 0} icon={Play} variant="info" loading={loading} />
        <KpiCard title="مكتملة" value={k.completed || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="متوسط الإنجاز" value={k.avgProgress || 0} suffix="%" icon={TrendingUp} variant="warning" loading={loading} />
        <KpiCard title="إجمالي الميزانية" value={(k.budgetTotal / 1000000 || 0).toFixed(1)} suffix="M ر.س" icon={PiggyBank} variant="default" loading={loading} />
        <KpiCard title="الإنفاق الفعلي" value={(k.actualTotal / 1000000 || 0).toFixed(1)} suffix="M ر.س" icon={DollarSign} variant="info" loading={loading} />
        <KpiCard title="نسبة الاستخدام" value={k.utilizationPct || 0} suffix="%" icon={TrendingUp} variant="warning" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartContainer title="حالات المبادرات"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="فئات المبادرات"><DonutChart data={c.byCategory || []} /></ChartContainer>
        <ChartContainer title="الأولويات"><DonutChart data={c.byPriority || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة المبادرات"
        data={list}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'name', label: 'اسم المبادرة' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'priority', label: 'الأولوية', type: 'badge' },
          { key: 'progress', label: 'التقدم %', type: 'number' },
          { key: 'budgetSar', label: 'الميزانية', type: 'currency' },
          { key: 'startDate', label: 'البدء', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
