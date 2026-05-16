'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { LogOut, RefreshCw, User, Calendar, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, showRefresh = false, onRefresh, actions }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    // Get Neon Auth session
    authClient.getSession().then((res: any) => {
      if (res?.data?.user) setUser(res.data.user);
    }).catch(() => {});

    // Get our profile (with role) from API
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(p => {
      if (p) setProfile(p);
    }).catch(() => {});

    // Locale-dependent date: render only on the client to avoid SSR/hydration
    // calendar/time mismatches.
    setToday(new Date().toLocaleDateString('ar-SA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }));
  }, []);

  const role = profile?.role;
  
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try { await onRefresh(); } finally { setTimeout(() => setRefreshing(false), 800); }
  };
  
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
    }
  };
  
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {title && <h1 className="text-xl md:text-2xl font-extrabold text-ministry-green-deep truncate">{title}</h1>}
          {subtitle && <p className="text-sm text-text-secondary mt-0.5 truncate">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          
          {today && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-ministry-green-soft text-ministry-green-deep text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>{today}</span>
            </div>
          )}
          
          {showRefresh && (
            <button onClick={handleRefresh} disabled={refreshing}
              className="p-2 rounded-lg hover:bg-ministry-green-soft text-text-secondary hover:text-ministry-green-deep transition-all disabled:opacity-50"
              title="تحديث">
              <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
            </button>
          )}

          {user && <NotificationBell />}

          {user && (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ministry-green-soft transition-all">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || ''} className="w-8 h-8 rounded-full border-2 border-ministry-green/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ministry-green text-white flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-text-primary truncate max-w-32">{user.name || user.email}</div>
                  <div className="text-xs text-text-muted truncate max-w-32 flex items-center gap-1">
                    {role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-ministry-green" />}
                    <span>{role === 'ADMIN' ? 'مسؤول' : role === 'EDITOR' ? 'محرر' : 'مشاهد'}</span>
                  </div>
                </div>
              </button>
              
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl border border-border shadow-strong z-50 animate-fade-in overflow-hidden">
                    <div className="p-4 bg-ministry-green-soft border-b border-border">
                      <div className="font-bold text-ministry-green-deep">{user.name || 'مستخدم'}</div>
                      <div className="text-xs text-text-secondary truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-ministry-green-deep font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        <span>الدور: {role === 'ADMIN' ? 'مسؤول' : role === 'EDITOR' ? 'محرر' : 'مشاهد'}</span>
                      </div>
                    </div>
                    <div className="p-2">
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all">
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
