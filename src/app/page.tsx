import { redirect } from 'next/navigation';
import { getSessionWithProfile } from '@/lib/auth';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { WelcomeModal } from '@/components/WelcomeModal';
import { DASHBOARDS } from '@/lib/navigation';
import { ENTITY_SLUGS } from '@/lib/entityConfigs';
import { LayoutDashboard, Sparkles, Layers, Database, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSessionWithProfile();
  if (!session?.profile) redirect('/login');
  
  const userName = session.profile.name?.split(' ')[0] || 'بك';
  const isAdmin = session.profile.role === 'ADMIN';
  
  return (
    <AppShell title="مركز الابتكار وحلول الأعمال" subtitle="منصة متكاملة لإدارة وتحليل مبادرات الابتكار">
      <WelcomeModal />
      <div className="card mb-6 relative overflow-hidden bg-gradient-to-l from-ministry-green via-ministry-green-deep to-ministry-green-deep text-white border-0 p-8">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <Sparkles className="absolute top-6 left-6 w-12 h-12 text-white/10" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium mb-3">
            <Sparkles className="w-3 h-3" />
            <span>بيانات محدّثة لحظياً</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            مرحباً، {userName} 👋
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            استكشف 19 لوحة تحليلية تفاعلية تغطّي الأفكار والتحديات والمبادرات والشراكات والمزيد.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboards/executive" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-ministry-green-deep font-semibold hover:bg-ministry-green-soft transition-all shadow-medium">
              <LayoutDashboard className="w-4 h-4" />
              <span>اللوحة التنفيذية</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {isAdmin && (
              <Link href="/admin/data" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/15 backdrop-blur-sm text-white font-medium hover:bg-white/25 transition-all border border-white/20">
                <Database className="w-4 h-4" />
                <span>إدارة البيانات</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'لوحة تحليلية', value: String(DASHBOARDS.length), icon: LayoutDashboard, color: 'text-ministry-green' },
          { label: 'جدول بيانات', value: '36', icon: Database, color: 'text-blue-600' },
          { label: 'كيان مُدار', value: String(ENTITY_SLUGS.length), icon: Layers, color: 'text-purple-600' },
          { label: 'تحديث', value: 'مباشر', icon: Sparkles, color: 'text-amber-600' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-background-alt flex items-center justify-center">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-text-primary">{stat.value}</div>
                <div className="text-xs text-text-secondary">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold text-text-primary">اللوحات التحليلية</h2>
        <p className="text-sm text-text-secondary mt-0.5">اختر لوحة لاستكشاف البيانات</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DASHBOARDS.map(dash => {
          const Icon = dash.icon;
          return (
            <Link key={dash.id} href={dash.href} className="card card-hover group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ministry-green/0 to-ministry-green/0 group-hover:from-ministry-green/5 group-hover:to-ministry-green/10 transition-all duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-background-alt flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3">
                    <Icon className={`w-6 h-6 ${dash.color}`} />
                  </div>
                  <span className="text-xs font-mono text-text-muted bg-background-alt px-2 py-1 rounded">{dash.id}</span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-ministry-green-deep transition-colors">{dash.title}</h3>
                <p className="text-sm text-text-secondary mb-3">{dash.description}</p>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-ministry-green group-hover:gap-2 transition-all">
                  <span>فتح اللوحة</span>
                  <ArrowLeft className="w-3 h-3" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
