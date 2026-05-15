import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string | undefined | null, locale = 'ar-SA'): string {
  if (num === null || num === undefined || num === '') return '—';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat(locale).format(n);
}

export function formatPercent(num: number | string | undefined | null): string {
  if (num === null || num === undefined || num === '') return '—';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

export function formatDate(date: string | Date | undefined | null, locale = 'ar-SA'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  } catch {
    return String(date);
  }
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M ر.س`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K ر.س`;
  return `${formatNumber(n)} ر.س`;
}

export function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const s = (status || '').trim();
  if (['حرج', 'مرفوض', 'متوقف', 'فشل', 'خارج المسار', 'ملغاة', 'ملغى'].some(k => s.includes(k))) return 'danger';
  if (['عالٍ', 'عالي', 'في خطر', 'قيد المراجعة', 'معلّق', 'بانتظار', 'مؤجلة'].some(k => s.includes(k))) return 'warning';
  if (['متوسط', 'قيد التنفيذ', 'نشط', 'جارٍ', 'جاري', 'جارية', 'مفتوح'].some(k => s.includes(k))) return 'info';
  if (['منخفض', 'مكتمل', 'مقبول', 'موافق', 'على المسار', 'منجز', 'ناجح', 'منعقدة'].some(k => s.includes(k))) return 'success';
  if (['تجاوز', 'متجاوز', 'ممتاز'].some(k => s.includes(k))) return 'info';
  return 'neutral';
}

export function groupBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : String(item[key] || 'غير محدد');
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function countBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Array<{ name: string; value: number }> {
  const grouped = groupBy(arr, key);
  return Object.entries(grouped).map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => {
    const v = item[key];
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
}

export const CHART_COLORS = ['#006C67', '#8B7942', '#1976D2', '#F57C00', '#7B1FA2', '#0097A7', '#5D4037', '#388E3C', '#D32F2F', '#FBC02D'];
