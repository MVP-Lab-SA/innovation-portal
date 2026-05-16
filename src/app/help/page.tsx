'use client';

import { AppShell } from '@/components/AppShell';
import {
  LayoutDashboard, KanbanSquare, Search, Bell, Database, ClipboardList,
  FileText, ShieldCheck, Filter,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: LayoutDashboard,
    title: 'اللوحات التحليلية',
    body: 'تضم المنصة 19 لوحة تحليلية تغطّي الأفكار والمبادرات والتحديات والشركاء والمخاطر والمؤشرات وغيرها. كل لوحة تعرض مؤشرات أداء ورسوماً بيانية وجدولاً بالسجلات، مع إمكانية التصفية.',
  },
  {
    icon: Filter,
    title: 'التصفية والعروض المحفوظة',
    body: 'استخدم شريط الفلاتر أعلى كل لوحة لتضييق البيانات. يمكنك حفظ مجموعة فلاتر كـ"عرض" للرجوع إليها، أو نسخ رابط العرض المُفلتر ومشاركته.',
  },
  {
    icon: ClipboardList,
    title: 'طابور الاعتماد',
    body: 'صفحة "طابور الاعتماد" تجمع الأفكار بانتظار القرار. يمكن للمسؤول أو المحرّر اعتماد الفكرة أو رفضها مباشرةً.',
  },
  {
    icon: KanbanSquare,
    title: 'لوحة المهام',
    body: 'تتبّع المهام بنظام الأعمدة (Kanban). اسحب البطاقة بين الأعمدة لتغيير حالتها، أو استخدم القائمة المنسدلة على الأجهزة اللمسية.',
  },
  {
    icon: Search,
    title: 'البحث الشامل',
    body: 'ابحث عن أي سجل عبر كل الكيانات من صفحة البحث — بالمعرّف أو الاسم أو الوصف.',
  },
  {
    icon: Bell,
    title: 'الإشعارات',
    body: 'تصلك إشعارات فورية عند إسناد مهمة إليك، أو تغيّر حالة فكرة، أو تصعيد مخاطرة. تظهر في الجرس أعلى الصفحة وفي صفحة الإشعارات.',
  },
  {
    icon: Database,
    title: 'إدارة البيانات',
    body: 'من شاشة "إدارة البيانات" يمكن للمسؤولين والمحررين إضافة وتعديل وحذف السجلات، والاستيراد من ملف CSV، والتصدير إلى Excel أو CSV.',
  },
  {
    icon: FileText,
    title: 'صفحات التفاصيل',
    body: 'انقر على معرّف أي سجل لفتح صفحة تفاصيله — تعرض كل الحقول والسجلات المرتبطة، مع إمكانية التعديل وإضافة العلاقات.',
  },
  {
    icon: ShieldCheck,
    title: 'الصلاحيات',
    body: 'هناك ثلاثة أدوار: مسؤول (صلاحيات كاملة)، محرّر (إضافة وتعديل)، مشاهد (عرض فقط). تُمنح الصلاحيات من شاشة إدارة المستخدمين.',
  },
];

export default function HelpPage() {
  return (
    <AppShell title="المساعدة" subtitle="دليل استخدام المنصة">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-ministry-green-soft flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-ministry-green-deep" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{s.title}</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{s.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 text-center text-xs text-text-muted">
        للدعم الفني تواصل مع الإدارة العامة للابتكار وحلول الأعمال · وزارة البلديات والإسكان
      </div>
    </AppShell>
  );
}
