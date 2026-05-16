'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useState } from 'react';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { TestTube, CheckCircle2, Clock, RefreshCw, TrendingUp, FlaskConical } from 'lucide-react';

export default function SandboxDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('sandbox', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const apps = data?.applications || [];

  return (
    <AppShell title="لوحة طلبات البيئة التجريبية" subtitle="DASH-04 — متابعة طلبات الساندبوكس" showRefresh onRefresh={refresh} manageEntity="sandbox-applications">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'SandboxStatus' },
          { key: 'category', label: 'التصنيف', type: 'select', lookupCategory: 'SandboxCategory' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <KpiCard title="إجمالي الطلبات" value={k.total || 0} icon={TestTube} variant="default" loading={loading} />
        <KpiCard title="نسبة الاستجابة" value={k.responseRate || 0} suffix="%" icon={TrendingUp} variant="success" loading={loading} />
        <KpiCard title="طلبات متكررة" value={k.duplicates || 0} icon={RefreshCw} variant="warning" loading={loading} />
        <KpiCard title="قيد المراجعة" value={k.pending || 0} icon={Clock} variant="info" loading={loading} />
        <KpiCard title="مقبولة" value={k.approved || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="تحوّلت إلى تجارب" value={k.convertedToPilot || 0} icon={FlaskConical} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="توزيع الحالات"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="المجالات المستهدفة"><BarChartComponent data={c.byDomain || []} horizontal /></ChartContainer>
        <ChartContainer title="مرحلة جاهزية المنتج (TRL)"><DonutChart data={c.byMaturity || []} /></ChartContainer>
        <ChartContainer title="التوافق مع رؤية 2030"><BarChartComponent data={c.byVision || []} /></ChartContainer>
      </div>

      <DataTable
        title="الطلبات النشطة"
        entitySlug="sandbox-applications"
        data={apps}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'solutionName', label: 'اسم المشروع' },
          { key: 'entityName', label: 'الجهة' },
          { key: 'solutionDomain', label: 'المجال', type: 'badge' },
          { key: 'applicationStatus', label: 'الحالة', type: 'status' },
          { key: 'submissionDate', label: 'تاريخ التقديم', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
