'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { FileText, CheckCircle2, FileEdit } from 'lucide-react';

export default function DocumentsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('documents', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="مكتبة الوثائق" subtitle="DASH-12 — تحليل الوثائق والملفات" showRefresh onRefresh={refresh} manageEntity="documents">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'DocumentStatus' },
          { key: 'category', label: 'النوع', type: 'select', lookupCategory: 'DocumentType' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي الوثائق" value={k.total || 0} icon={FileText} variant="default" loading={loading} />
        <KpiCard title="معتمدة" value={k.approved || 0} icon={CheckCircle2} variant="success" loading={loading} />
        <KpiCard title="مسودات" value={k.draft || 0} icon={FileEdit} variant="warning" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="الوثائق حسب النوع"><DonutChart data={c.byType || []} /></ChartContainer>
        <ChartContainer title="الوثائق حسب الحالة"><BarChartComponent data={c.byStatus || []} /></ChartContainer>
      </div>

      <DataTable
        title="قائمة الوثائق"
        data={list}
        entitySlug="documents"
        columns={[
          { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
          { key: 'title', label: 'العنوان' },
          { key: 'documentType', label: 'النوع', type: 'badge' },
          { key: 'version', label: 'الإصدار' },
          { key: 'status', label: 'الحالة', type: 'status' },
          { key: 'uploadDate', label: 'تاريخ الرفع', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
