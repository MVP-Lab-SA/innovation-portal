'use client';

import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { AnnouncementsWidget } from '@/components/AnnouncementsWidget';
import { useDashboard } from '@/hooks/useData';
import { Lightbulb, Briefcase, FlaskConical, Users, AlertTriangle, Target, Trophy, TestTube } from 'lucide-react';

export default function ExecutiveDashboard() {
  const { data, loading, refresh } = useDashboard<any>('executive');
  const k = data?.kpis || {};
  const c = data?.charts || {};
  
  return (
    <AppShell title="اللوحة التنفيذية" subtitle="DASH-01 — نظرة شاملة على أداء مركز الابتكار" showRefresh onRefresh={refresh}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي الأفكار" value={k.ideasTotal || 0} icon={Lightbulb} variant="warning" loading={loading} />
        <KpiCard title="المبادرات النشطة" value={k.activeInitiatives || 0} icon={Briefcase} variant="default" loading={loading} description={`من ${k.initiativesTotal || 0}`} />
        <KpiCard title="التجارب" value={k.pilotsTotal || 0} icon={FlaskConical} variant="info" loading={loading} />
        <KpiCard title="التحديات" value={k.challengesTotal || 0} icon={Trophy} variant="info" loading={loading} />
        <KpiCard title="الشركاء النشطون" value={k.activePartners || 0} icon={Users} variant="success" loading={loading} description={`من ${k.partnersTotal || 0}`} />
        <KpiCard title="مخاطر حرجة" value={k.criticalRisks || 0} icon={AlertTriangle} variant="danger" loading={loading} />
        <KpiCard title="مؤشرات على المسار" value={k.onTrackMetrics || 0} icon={Target} variant="success" loading={loading} />
        <KpiCard title="طلبات الساندبوكس" value={k.sandboxApplications || 0} icon={TestTube} variant="info" loading={loading} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartContainer title="حالات المبادرات" description="التوزيع الحالي"><DonutChart data={c.initiativeStatus || []} /></ChartContainer>
          <ChartContainer title="مراحل الأفكار" description="مسار قمع الأفكار"><BarChartComponent data={c.ideasStage || []} horizontal /></ChartContainer>
          <ChartContainer title="أنواع الشركاء" description="توزيع الشراكات"><DonutChart data={c.partnersType || []} /></ChartContainer>
          <ChartContainer title="فئات التحديات" description="التصنيف الموضوعي"><BarChartComponent data={c.challengeCategory || []} /></ChartContainer>
        </div>
        <div className="lg:col-span-1">
          <AnnouncementsWidget />
        </div>
      </div>
    </AppShell>
  );
}
