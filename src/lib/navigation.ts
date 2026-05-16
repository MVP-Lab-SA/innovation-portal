import {
  LayoutDashboard,
  Lightbulb,
  Trophy,
  TestTube,
  FlaskConical,
  Briefcase,
  Users,
  AlertTriangle,
  Target,
  Megaphone,
  Settings,
  Database,
  History,
  GraduationCap,
  FileText,
  CalendarDays,
  Sparkles,
  Compass,
  Gift,
  ClipboardCheck,
  Flag,
} from 'lucide-react';

export interface NavItem {
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
  { id: 'DASH-11', title: 'شبكة الخبراء', description: 'تحليل الخبراء', href: '/dashboards/experts', icon: GraduationCap, color: 'text-indigo-600' },
  { id: 'DASH-12', title: 'مكتبة الوثائق', description: 'الوثائق والملفات', href: '/dashboards/documents', icon: FileText, color: 'text-slate-600' },
  { id: 'DASH-13', title: 'الفعاليات والتقويم', description: 'تحليل الفعاليات', href: '/dashboards/events', icon: CalendarDays, color: 'text-rose-600' },
  { id: 'DASH-14', title: 'المبتكرون', description: 'المبتكرون والأفراد', href: '/dashboards/cems', icon: Sparkles, color: 'text-amber-600' },
  { id: 'DASH-15', title: 'المصادر الاستراتيجية', description: 'مصادر التحديات', href: '/dashboards/strategic-sources', icon: Compass, color: 'text-teal-600' },
  { id: 'DASH-16', title: 'الرعايات', description: 'رعايات الشركاء', href: '/dashboards/sponsorships', icon: Gift, color: 'text-fuchsia-600' },
  { id: 'DASH-17', title: 'تقييمات الأفكار', description: 'تحليل التقييمات', href: '/dashboards/evaluations', icon: ClipboardCheck, color: 'text-lime-600' },
  { id: 'DASH-18', title: 'المراحل الرئيسية', description: 'متابعة المراحل', href: '/dashboards/milestones', icon: Flag, color: 'text-sky-600' },
];

export const ADMIN_ITEMS: NavItem[] = [
  { id: 'data', title: 'إدارة البيانات', href: '/admin/data', icon: Database },
  { id: 'users', title: 'إدارة المستخدمين', href: '/admin/users', icon: Users },
  { id: 'lookups', title: 'القوائم المرجعية', href: '/admin/lookups', icon: Settings },
  { id: 'audit-log', title: 'سجل التغييرات', href: '/admin/audit-log', icon: History },
];