'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Lightbulb, Trophy, TestTube, FlaskConical,
  Briefcase, Users, AlertTriangle, Target, Megaphone,
  ChevronLeft, Sparkles, Settings, Database, ChevronDown, History,
} from 'lucide-react';

interface NavItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: any;
  color?: string;
  adminOnly?: boolean;
}

export const DASHBOARDS: NavItem[] = [
  { id: 'DASH-01', title: 'اللوحة التنفيذية', description: 'نظرة شاملة', href: '/dashboards/executive', icon: LayoutDashboard, color: 'text-ministry-green' },
  { id: 'DASH-02', title: 'قمع الأفكار', description: 'الأفكار من التقديم للتنفيذ', href: '/dashboards/ideas', icon: Lightbulb, color: 'text-amber-600' },
  { id: 'DASH-03', title: 'التحديات والهاكاثونات', description: 'التحديات والمبتكرين', href: '/dashboards/challenges', icon: Trophy, color: 'text-purple-600' },
  { id: 'DASH-04', title: 'طلبات الساندبوكس', description: 'البيئة التجريبية', href: '/dashboards/sandbox', icon: TestTube, color: 'text-cyan-600' },
  { id: 'DASH-05', title: 'التجارب التشغيلية', description: 'التجارب الميدانية', href: '/dashboards/pilots', icon: FlaskConical, color: 'text-orange-600' },
  { id: 'DASH-06', title: 'محفظة المبادرات', description: 'متابعة المبادرات', href: '/dashboards/initiatives', icon: Briefcase, color: 'text-blue-600' },
  { id: 'DASH-07', title: 'الشركاء والرعايات', description: 'إدارة العلاقات', href: '/dashboards/partners', icon: Users, color: 'text-teal-600' },
  { id: 'DASH-08', title: 'سجل المخاطر', description: 'متابعة المخاطر', href: '/dashboards/risks', icon: AlertTriangle, color: 'text-red-600' },
  { id: 'DASH-09', title: 'المؤشرات والأثر', description: 'KPIs وقياس الأداء', href: '/dashboards/metrics', icon: Target, color: 'text-emerald-600' },
  { id: 'DASH-10', title: 'التواصل والإعلام', description: 'الحملات والظهور', href: '/dashboards/communications', icon: Megaphone, color: 'text-pink-600' },
];

export const ADMIN_ITEMS: NavItem[] = [
  { id: 'data', title: 'إدارة البيانات', href: '/admin/data', icon: Database },
  { id: 'users', title: 'إدارة المستخدمين', href: '/admin/users', icon: Users },
  { id: 'lookups', title: 'القوائم المرجعية', href: '/admin/lookups', icon: Settings },
  { id: 'audit-log', title: 'سجل التغييرات', href: '/admin/audit-log', icon: History },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const isAdmin = userRole === 'ADMIN';
  const [adminOpen, setAdminOpen] = useState(pathname?.startsWith('/admin'));
  
  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(p => {
      if (p?.role) setUserRole(p.role);
    }).catch(() => {});
  }, []);

  return (
    <aside className={cn(
      'fixed top-0 right-0 h-screen bg-white border-l border-border transition-all duration-300 z-40 flex flex-col',
      collapsed ? 'w-20' : 'w-72'
    )}>
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ministry-green to-ministry-green-deep flex items-center justify-center shadow-soft flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-extrabold text-ministry-green-deep text-sm leading-tight">مركز الابتكار</div>
              <div className="text-xs text-text-muted">وحلول الأعمال</div>
            </div>
          )}
        </Link>
      </div>

      <div className="px-3 pt-4">
        <Link href="/" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )}>
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>الرئيسية</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4">
        {!collapsed && (
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-3">اللوحات التحليلية</div>
        )}
        <nav className="space-y-1">
          {DASHBOARDS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.id} href={item.href} className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active ? 'bg-ministry-green text-white shadow-soft'
                  : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
              )} title={collapsed ? item.title : undefined}>
                <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-white' : item.color)} />
                {!collapsed && (
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{item.title}</div>
                    {item.description && (
                      <div className={cn('text-xs truncate', active ? 'text-white/80' : 'text-text-muted')}>{item.description}</div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-3 mt-6">الإدارة</div>
            )}
            <button onClick={() => setAdminOpen(!adminOpen)} className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
              'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
            )}>
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-medium flex-1 text-right">الإدارة</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', adminOpen && 'rotate-180')} />
                </>
              )}
            </button>
            {adminOpen && !collapsed && (
              <div className="mt-1 mr-4 space-y-1">
                {ADMIN_ITEMS.map(item => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.id} href={item.href} className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                      active ? 'bg-ministry-green text-white' : 'text-text-secondary hover:bg-ministry-green-soft'
                    )}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {onToggle && (
        <div className="p-3 border-t border-border">
          <button onClick={onToggle} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep transition-all">
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-180')} />
            {!collapsed && <span>طيّ القائمة</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
