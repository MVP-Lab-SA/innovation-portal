'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useState } from 'react';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { AlertTriangle, AlertOctagon, AlertCircle, ShieldCheck } from 'lucide-react';

export default function RisksDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('risks', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="سجل المخاطر" subtitle="DASH-08 — متابعة وإدارة المخاطر" showRefresh onRefresh={refresh} manageEntity="risks">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'RiskStatus' },
          { key: 'category', label: 'الفئة', type: 'select', lookupCategory: 'RiskCategory' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="إجمالي المخاطر" value={k.total || 0} icon={AlertTriangle} variant="default" loading={loading} />
        <KpiCard title="حرجة" value={k.critical || 0} icon={AlertOctagon} variant="danger" loading={loading} />
        <KpiCard title="عالية" value={k.high || 0} icon={AlertCircle} variant="warning" loading={loading} />
        <KpiCard title="مفتوحة" value={k.open || 0} icon={AlertTriangle} variant="info" loading={loading} />
        <KpiCard title="مغلقة" value={k.mitigated || 0} icon={ShieldCheck} variant="success" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartContainer title="مستويات الخطورة"><DonutChart data={c.byLevel || []} /></ChartContainer>
        <ChartContainer title="فئات المخاطر"><BarChartComponent data={c.byCategory || []} /></ChartContainer>
        <ChartContainer title="حالات المخاطر"><DonutChart data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="سجل المخاطر التفصيلي"
        data={list}
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'title', label: 'وصف المخاطرة' },
          { key: 'category', label: 'الفئة', type: 'badge' },
          { key: 'riskLevel', label: 'المستوى', type: 'status' },
          { key: 'riskScore', label: 'الدرجة', type: 'number' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'identifiedDate', label: 'تاريخ الاكتشاف', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
