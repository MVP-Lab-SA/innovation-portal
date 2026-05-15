'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import { CHART_COLORS, cn, formatNumber } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export function ChartContainer({ title, description, children, className, action }: { title: string; description?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={cn('chart-container', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface ChartData { name: string; value: number; }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-medium border border-border">
      <div className="text-sm font-bold text-text-primary">{data.name || data.payload?.name}</div>
      <div className="text-sm text-ministry-green-deep mt-0.5">{formatNumber(data.value)}</div>
    </div>
  );
}

export function DonutChart({ data, height = 280, innerRadius = 60, outerRadius = 100, showLegend = true, colors = CHART_COLORS }: { data: ChartData[]; height?: number; innerRadius?: number; outerRadius?: number; showLegend?: boolean; colors?: string[]; }) {
  if (!data || data.length === 0) return <EmptyState height={height} />;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
          {data.map((entry, index) => (
            <Cell key={entry.name ?? index} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', direction: 'rtl' }} />}
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarChartComponent({ data, height = 280, horizontal = false, color = '#006C67', showGrid = true }: { data: ChartData[]; height?: number; horizontal?: boolean; color?: string; showGrid?: boolean; }) {
  if (!data || data.length === 0) return <EmptyState height={height} />;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DA" />}
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#5F5F5C' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#2C2C2A' }} width={120} orientation="right" />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#2C2C2A' }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: '#5F5F5C' }} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,108,103,0.05)' }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComponent({ data, height = 280, lines, showGrid = true }: { data: any[]; height?: number; lines: { key: string; name: string; color: string }[]; showGrid?: boolean; }) {
  if (!data || data.length === 0) return <EmptyState height={height} />;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          {lines.map(line => (
            <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={line.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DA" />}
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5F5F5C' }} />
        <YAxis tick={{ fontSize: 11, fill: '#5F5F5C' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', direction: 'rtl' }} />
        {lines.map(line => (
          <Area key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} fill={`url(#grad-${line.key})`} strokeWidth={2.5} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ height }: { height: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-text-muted bg-background-alt rounded-lg" style={{ height }}>
      <Inbox className="w-12 h-12 opacity-30 mb-2" />
      <p className="text-sm">لا توجد بيانات لعرضها</p>
      <p className="text-xs mt-1">أضف بيانات لرؤية المخطط</p>
    </div>
  );
}
