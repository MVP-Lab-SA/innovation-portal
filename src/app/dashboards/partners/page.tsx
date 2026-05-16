'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useState } from 'react';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { Users, Handshake, DollarSign, MessageCircle } from 'lucide-react';

export default function PartnersDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, loading, refresh } = useDashboard<any>('partners', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const partners = data?.partners || [];
  const interactions = data?.recentInteractions || [];

  return (
    <AppShell title="الشركاء والرعايات" subtitle="DASH-07 — إدارة العلاقات والرعايات" showRefresh onRefresh={refresh} manageEntity="partners">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'حالة الشراكة', type: 'select', lookupCategory: 'PartnershipStatus' },
          { key: 'category', label: 'نوع الشريك', type: 'select', lookupCategory: 'PartnerType' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="إجمالي الشركاء" value={k.total || 0} icon={Users} variant="default" loading={loading} />
        <KpiCard title="شراكات نشطة" value={k.active || 0} icon={Handshake} variant="success" loading={loading} />
        <KpiCard title="عدد الرعايات" value={k.sponsorships || 0} icon={DollarSign} variant="info" loading={loading} />
        <KpiCard title="قيمة الرعايات" value={(k.totalSponsorshipValue / 1000000 || 0).toFixed(1)} suffix="M ر.س" icon={DollarSign} variant="warning" loading={loading} />
        <KpiCard title="تفاعلات الشهر" value={k.interactionsThisMonth || 0} icon={MessageCircle} variant="info" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartContainer title="أنواع الشركاء"><DonutChart data={c.byType || []} /></ChartContainer>
        <ChartContainer title="حالات الشراكة"><DonutChart data={c.byStatus || []} /></ChartContainer>
        <ChartContainer title="مستويات الرعاية"><DonutChart data={c.sponsorshipsByTier || []} /></ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="قائمة الشركاء"
          entitySlug="partners"
          data={partners}
          pageSize={8}
          columns={[
            { key: 'code', label: 'المعرّف', width: '90px', type: 'badge' },
            { key: 'partnerName', label: 'الشريك' },
            { key: 'partnerType', label: 'النوع', type: 'badge' },
            { key: 'partnershipStatus', label: 'الحالة', type: 'status' },
          ]}
        />
        <DataTable
          title="آخر التفاعلات"
          entitySlug="partner-interactions"
          data={interactions}
          pageSize={8}
          columns={[
            { key: 'interactionDate', label: 'التاريخ', type: 'date' },
            { key: 'interactionType', label: 'النوع', type: 'badge' },
            { key: 'subject', label: 'الموضوع' },
          ]}
        />
      </div>
    </AppShell>
  );
}
