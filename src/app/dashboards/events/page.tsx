'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { ChartContainer, DonutChart, BarChartComponent } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { useDashboard } from '@/hooks/useData';
import { DashboardFilters } from '@/components/DashboardFilters';
import { EventsCalendar } from '@/components/EventsCalendar';
import { CalendarDays, CalendarClock, Users, Table2, CalendarRange } from 'lucide-react';

export default function EventsDashboard() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<'table' | 'calendar'>('calendar');
  const { data, loading, refresh } = useDashboard<any>('events', filters);
  const k = data?.kpis || {};
  const c = data?.charts || {};
  const list = data?.list || [];

  return (
    <AppShell title="الفعاليات والتقويم" subtitle="DASH-13 — تحليل الفعاليات" showRefresh onRefresh={refresh} manageEntity="calendar-events">
      <DashboardFilters
        fields={[
          { key: 'status', label: 'الحالة', type: 'select', lookupCategory: 'EventStatus' },
          { key: 'category', label: 'النوع', type: 'select', lookupCategory: 'EventType' },
        ]}
        onChange={setFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي الفعاليات" value={k.total || 0} icon={CalendarDays} variant="default" loading={loading} />
        <KpiCard title="قادمة" value={k.upcoming || 0} icon={CalendarClock} variant="info" loading={loading} />
        <KpiCard title="إجمالي الحضور" value={k.attendees || 0} icon={Users} variant="success" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="الفعاليات حسب النوع"><DonutChart data={c.byType || []} /></ChartContainer>
        <ChartContainer title="الفعاليات حسب الحالة"><BarChartComponent data={c.byStatus || []} /></ChartContainer>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('calendar')}
          className={view === 'calendar' ? 'btn-primary text-sm flex items-center gap-2' : 'btn-secondary text-sm flex items-center gap-2'}
        >
          <CalendarRange className="w-4 h-4" />
          <span>تقويم</span>
        </button>
        <button
          onClick={() => setView('table')}
          className={view === 'table' ? 'btn-primary text-sm flex items-center gap-2' : 'btn-secondary text-sm flex items-center gap-2'}
        >
          <Table2 className="w-4 h-4" />
          <span>جدول</span>
        </button>
      </div>

      {view === 'calendar' ? (
        <EventsCalendar events={list} />
      ) : (
        <DataTable
          title="قائمة الفعاليات"
          data={list}
          entitySlug="calendar-events"
          columns={[
            { key: 'code', label: 'المعرّف', width: '100px', type: 'badge' },
            { key: 'title', label: 'العنوان' },
            { key: 'eventType', label: 'النوع', type: 'badge' },
            { key: 'status', label: 'الحالة', type: 'status' },
            { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
            { key: 'attendeeCount', label: 'الحضور', type: 'number' },
          ]}
        />
      )}
    </AppShell>
  );
}
