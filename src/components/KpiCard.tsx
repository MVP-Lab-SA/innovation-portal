'use client';

import { cn, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  description?: string;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  suffix?: string;
  loading?: boolean;
}

const variantStyles = {
  default: 'before:bg-ministry-green',
  success: 'before:bg-status-low',
  warning: 'before:bg-status-medium',
  danger: 'before:bg-status-critical',
  info: 'before:bg-status-info',
  neutral: 'before:bg-gray-400',
};

const iconColors = {
  default: 'text-ministry-green bg-ministry-green-soft',
  success: 'text-status-low bg-green-50',
  warning: 'text-status-medium bg-yellow-50',
  danger: 'text-status-critical bg-red-50',
  info: 'text-status-info bg-blue-50',
  neutral: 'text-gray-600 bg-gray-50',
};

export function KpiCard({ title, value, icon: Icon, description, trend, trendLabel, variant = 'default', suffix, loading = false }: KpiCardProps) {
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value;
  
  return (
    <div className={cn(
      'kpi-card relative overflow-hidden group before:content-[""] before:absolute before:top-0 before:right-0 before:w-1 before:h-full',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-secondary mb-1 truncate">{title}</div>
          {description && <div className="text-xs text-text-muted">{description}</div>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconColors[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          {loading ? (
            <div className="h-9 w-20 bg-background-alt rounded animate-pulse" />
          ) : (
            <>
              <span className="text-3xl font-extrabold text-text-primary tabular-nums">{formattedValue}</span>
              {suffix && <span className="text-sm text-text-secondary font-medium">{suffix}</span>}
            </>
          )}
        </div>
        
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
            trend > 0 && 'bg-green-50 text-green-700',
            trend < 0 && 'bg-red-50 text-red-700',
            trend === 0 && 'bg-gray-50 text-gray-700'
          )}>
            {trend > 0 && <TrendingUp className="w-3 h-3" />}
            {trend < 0 && <TrendingDown className="w-3 h-3" />}
            {trend === 0 && <Minus className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      {trendLabel && <div className="mt-2 text-xs text-text-muted">{trendLabel}</div>}
    </div>
  );
}
