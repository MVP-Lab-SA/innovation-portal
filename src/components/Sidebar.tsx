'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_ITEMS, DASHBOARDS } from '@/lib/navigation';
import {
  LayoutDashboard, Lightbulb, Trophy, TestTube, FlaskConical,
  Briefcase, Users, AlertTriangle, Target, Megaphone,
  ChevronLeft, Sparkles, Settings, Database, ChevronDown, History,
  KanbanSquare, Search, Bell, ClipboardCheck, HelpCircle, UserCircle,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
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
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}
      <aside className={cn(
        'fixed top-0 right-0 h-screen bg-white border-l border-border transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-20' : 'w-72',
        mobileOpen ? 'translate-x-0' : 'translate-x-full',
        'lg:translate-x-0',
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

      <div className="px-3 pt-4 space-y-1">
        <Link href="/" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )}>
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>الرئيسية</span>}
        </Link>
        <Link href="/my-work" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/my-work' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )} title={collapsed ? 'نشاطي' : undefined}>
          <UserCircle className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>نشاطي</span>}
        </Link>
        <Link href="/tasks" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/tasks' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )} title={collapsed ? 'لوحة المهام' : undefined}>
          <KanbanSquare className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>لوحة المهام</span>}
        </Link>
        <Link href="/search" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/search' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )} title={collapsed ? 'البحث الشامل' : undefined}>
          <Search className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>البحث الشامل</span>}
        </Link>
        <Link href="/notifications" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/notifications' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )} title={collapsed ? 'الإشعارات' : undefined}>
          <Bell className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>الإشعارات</span>}
        </Link>
        <Link href="/approvals" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/approvals' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )} title={collapsed ? 'طابور الاعتماد' : undefined}>
          <ClipboardCheck className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>طابور الاعتماد</span>}
        </Link>
        <Link href="/help" className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          pathname === '/help' ? 'bg-ministry-green text-white shadow-soft'
            : 'text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep'
        )} title={collapsed ? 'المساعدة' : undefined}>
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>المساعدة</span>}
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
        <div className="p-3 border-t border-border hidden lg:block">
          <button onClick={onToggle} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-ministry-green-soft hover:text-ministry-green-deep transition-all">
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-180')} />
            {!collapsed && <span>طيّ القائمة</span>}
          </button>
        </div>
      )}
      </aside>
    </>
  );
}
