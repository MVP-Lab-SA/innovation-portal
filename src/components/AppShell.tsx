'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Printer } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  /**
   * When set, renders a "Manage" link in the header that opens the generic
   * admin/data page pre-selected to this entity slug. EDITOR/ADMIN-gated by
   * the destination page.
   */
  manageEntity?: string;
}

export function AppShell({ children, title, subtitle, showRefresh, onRefresh, actions, manageEntity }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  // Mobile drawer state. Resets to closed on navigation (AppShell is mounted
  // per-page), so links inside the sidebar need no explicit close handler.
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerActions = (
    <>
      {manageEntity && (
        <Link
          href={`/admin/data?entity=${encodeURIComponent(manageEntity)}`}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          <span>إدارة البيانات</span>
        </Link>
      )}
      {actions}
      <button
        onClick={() => window.print()}
        className="btn-secondary text-sm flex items-center gap-2"
        title="طباعة"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">طباعة</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main className={cn('transition-all duration-300', collapsed ? 'lg:mr-20' : 'lg:mr-72')}>
        <Header
          title={title}
          subtitle={subtitle}
          showRefresh={showRefresh}
          onRefresh={onRefresh}
          actions={headerActions}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
