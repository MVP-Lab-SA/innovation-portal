'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalEvent {
  id: string;
  code?: string | null;
  title: string;
  startDate: string | null;
  eventType?: string | null;
  status?: string | null;
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const AR_DOW = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function EventsCalendar({ events }: { events: CalEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  // Bucket this month's events by day-of-month.
  const byDay = new Map<number, CalEvent[]>();
  for (const e of events) {
    if (!e.startDate) continue;
    const d = new Date(e.startDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const list = byDay.get(d.getDate()) ?? [];
      list.push(e);
      byDay.set(d.getDate(), list);
    }
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-2 rounded-lg hover:bg-background-alt text-text-secondary"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-text-primary" suppressHydrationWarning>
          {AR_MONTHS[month]} {year}
        </h3>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-2 rounded-lg hover:bg-background-alt text-text-secondary"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {AR_DOW.map(d => (
          <div key={d} className="text-center text-xs font-bold text-text-muted py-2">{d}</div>
        ))}
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - firstWeekday + 1;
          const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dayEvents = inMonth ? byDay.get(dayNum) ?? [] : [];
          return (
            <div
              key={i}
              className={cn(
                'min-h-24 rounded-lg border p-1.5',
                inMonth ? 'border-border bg-white' : 'border-transparent bg-background-alt/40',
                isToday(dayNum) && 'border-ministry-green ring-1 ring-ministry-green',
              )}
            >
              {inMonth && (
                <>
                  <div className={cn(
                    'text-xs font-medium mb-1',
                    isToday(dayNum) ? 'text-ministry-green-deep' : 'text-text-muted',
                  )}>
                    {dayNum}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <Link
                        key={e.id}
                        href={`/records/calendar-events/${e.id}`}
                        title={e.title}
                        className="block text-[11px] bg-ministry-green-soft text-ministry-green-deep rounded px-1 py-0.5 truncate hover:bg-ministry-green hover:text-white transition-colors"
                      >
                        {e.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-text-muted px-1">+{dayEvents.length - 3} أخرى</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
