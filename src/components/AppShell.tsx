'use client';

import { useState } from 'react';
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
}

export function AppShell({ children, title, subtitle, showRefresh, onRefresh, actions }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={cn('transition-all duration-300', collapsed ? 'mr-20' : 'mr-72')}>
        <Header title={title} subtitle={subtitle} showRefresh={showRefresh} onRefresh={onRefresh} actions={actions} />
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
