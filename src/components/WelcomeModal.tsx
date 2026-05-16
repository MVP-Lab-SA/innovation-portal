'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, LayoutDashboard, KanbanSquare, Search, Database, X } from 'lucide-react';

const STORAGE_KEY = 'ip_welcome_dismissed_v1';

const STEPS = [
  { icon: LayoutDashboard, title: 'لوحات تحليلية', body: '19 لوحة تغطّي الأفكار والمبادرات والشركاء والمخاطر والمزيد — مع فلاتر فورية.' },
  { icon: KanbanSquare, title: 'لوحة المهام', body: 'تتبّع المهام بالسحب والإفلات بين الأعمدة حسب الحالة.' },
  { icon: Search, title: 'البحث الشامل', body: 'ابحث عن أي سجل عبر كل الكيانات من شريط واحد.' },
  { icon: Database, title: 'إدارة البيانات', body: 'أضِف وعدّل واحذف السجلات من شاشة الإدارة (للمسؤولين والمحررين).' },
];

export function WelcomeModal() {
  // Visibility is localStorage-driven (client-only). Start hidden on both
  // SSR and first client render to avoid a hydration mismatch, then reveal.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      /* localStorage unavailable — skip */
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-strong w-full max-w-lg overflow-hidden">
        <div className="relative bg-gradient-to-l from-ministry-green to-ministry-green-deep text-white p-6">
          <button
            onClick={dismiss}
            className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-white/15 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">مرحباً بك في مركز الابتكار</h2>
              <p className="text-sm text-white/80">جولة سريعة في أهم الأقسام</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {STEPS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-ministry-green-soft flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-ministry-green-deep" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary">{s.title}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{s.body}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <Link
            href="/dashboards/executive"
            onClick={dismiss}
            className="btn-secondary text-sm"
          >
            افتح اللوحة التنفيذية
          </Link>
          <button onClick={dismiss} className="btn-primary text-sm">
            فهمت، لنبدأ
          </button>
        </div>
      </div>
    </div>
  );
}
