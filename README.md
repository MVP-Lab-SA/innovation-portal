# مركز الابتكار وحلول الأعمال

> منصة متكاملة لإدارة وتحليل مبادرات الابتكار - وزارة البلديات والإسكان

تطبيق Full-Stack مبني بـ **Next.js 14** + **Prisma** + **Neon Postgres** ومستضاف على **Vercel**.

## ✨ المزايا

- 🔐 **تسجيل دخول آمن** عبر Google OAuth مع allowlist
- 👥 **3 أدوار**: مسؤول (Admin) / محرر (Editor) / مشاهد (Viewer)
- 📊 **10 لوحات تحليلية** تفاعلية بـ RTL عربي
- 🗄️ **32 جدول بيانات** مع علاقات كاملة
- ✏️ **CRUD كامل** لكل الجداول من واجهة المستخدم
- 📥 **تصدير Excel** لأي جدول
- 📜 **سجل تدقيق** (Audit Log) لكل تعديل
- 🎨 **تصميم وزاري** بالألوان الرسمية (#006C67)
- 📱 **متجاوب** على الموبايل والتابلت

---

## 🚀 خطوات النشر على Vercel + Neon (15 دقيقة)

### الخطوة 1: رفع المشروع على GitHub

```bash
cd innovation-portal
git init
git add .
git commit -m "Initial commit"
gh repo create innovation-portal --private --source=. --push
# أو يدوياً: أنشئ مستودعاً على github.com ثم:
# git remote add origin https://github.com/YOUR-USERNAME/innovation-portal.git
# git push -u origin main
```

### الخطوة 2: ربط المشروع بـ Vercel

1. اذهب إلى https://vercel.com/new
2. اختر مشروعك من GitHub
3. **مهم**: اختر مشروع `ajalqahtani-momahgovsas-projects`
4. اضغط **Deploy** (لا تقلق سيفشل أول مرة - هذا متوقع)

### الخطوة 3: إضافة Neon Postgres

1. في لوحة Vercel للمشروع → **Storage** → **Create Database**
2. اختر **Neon Postgres**
3. اختر منطقة قريبة (مثلاً `Frankfurt`)
4. اضغط **Create** → سيتم إضافة `DATABASE_URL` و `DIRECT_URL` تلقائياً

### الخطوة 4: إعداد Google OAuth

1. اذهب إلى https://console.cloud.google.com/apis/credentials
2. **CREATE CREDENTIALS** → **OAuth client ID**
3. النوع: **Web application**
4. **Authorized redirect URIs**: أضف
   ```
   https://YOUR-PROJECT.vercel.app/api/auth/callback/google
   https://YOUR-CUSTOM-DOMAIN.com/api/auth/callback/google
   ```
5. انسخ **Client ID** و **Client Secret**

### الخطوة 5: متغيرات البيئة في Vercel

في Vercel → Settings → Environment Variables، أضف:

| المتغير | القيمة |
|---|---|
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` |
| `NEXTAUTH_SECRET` | شغّل: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | من الخطوة 4 |
| `GOOGLE_CLIENT_SECRET` | من الخطوة 4 |
| `ADMIN_EMAIL` | `qahtani1979@gmail.com` |
| `ALLOWED_DOMAINS` | `momah.gov.sa,gov.sa` |
| `ALLOWED_EMAILS` | بريدك (للتجربة الأولى) |

### الخطوة 6: إنشاء الجداول في Neon

افتح Terminal محلي:

```bash
cd innovation-portal
npm install
# انسخ DATABASE_URL من Vercel وضعه في .env
echo 'DATABASE_URL="postgresql://..."' > .env
echo 'DIRECT_URL="postgresql://..."' >> .env

# أنشئ الجداول
npx prisma db push

# املأ القوائم المرجعية (76 فئة بـ 400+ قيمة)
npm run db:seed
```

### الخطوة 7: إعادة النشر

في Vercel → Deployments → اضغط **Redeploy** على آخر deployment.

✅ **تم!** افتح الموقع وسجل دخول بـ Google.

---

## 🧪 التشغيل محلياً

```bash
# 1. تثبيت الاعتماديات
npm install

# 2. إنشاء .env من الـ template
cp .env.example .env
# عدّل القيم في .env

# 3. إنشاء الجداول
npm run db:push
npm run db:seed

# 4. تشغيل التطبيق
npm run dev
```

افتح http://localhost:3000

---

## 📂 بنية المشروع

```
innovation-portal/
├── prisma/
│   ├── schema.prisma         # 32 جدول مع العلاقات
│   └── seed.ts               # 400+ قيمة مرجعية
├── src/
│   ├── app/
│   │   ├── (root)/           # الصفحات الرئيسية
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth
│   │   │   ├── entities/     # CRUD لكل الجداول
│   │   │   ├── dashboards/   # APIs اللوحات
│   │   │   └── lookups/      # القوائم المرجعية
│   │   ├── login/
│   │   ├── admin/
│   │   │   ├── data/         # إدارة كل الجداول
│   │   │   ├── users/        # إدارة المستخدمين
│   │   │   └── lookups/      # إدارة القوائم
│   │   └── dashboards/       # 10 لوحات تحليلية
│   ├── components/
│   │   ├── Sidebar.tsx       # الشريط الجانبي
│   │   ├── Header.tsx
│   │   ├── AppShell.tsx
│   │   ├── KpiCard.tsx
│   │   ├── Charts.tsx
│   │   ├── DataTable.tsx
│   │   └── forms/
│   │       └── EntityForm.tsx
│   ├── hooks/
│   │   └── useData.ts
│   └── lib/
│       ├── prisma.ts         # عميل Neon
│       ├── auth.ts           # NextAuth + RBAC
│       ├── crud.ts           # CRUD generic factory
│       ├── entityConfigs.ts  # إعدادات النماذج
│       └── utils.ts
└── package.json
```

---

## 🔐 نظام الصلاحيات

| الإجراء | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|
| عرض اللوحات | ✅ | ✅ | ✅ |
| تصدير Excel | ✅ | ✅ | ✅ |
| إضافة سجلات | ✅ | ✅ | ❌ |
| تعديل سجلات | ✅ | ✅ | ❌ |
| حذف سجلات | ✅ | ❌ | ❌ |
| إدارة المستخدمين | ✅ | ❌ | ❌ |
| إدارة القوائم | ✅ | ❌ | ❌ |

**كيف يصبح المستخدم Admin؟**
- المستخدم في `ADMIN_EMAIL` يصبح Admin تلقائياً عند أول دخول
- يمكن للـ Admin ترقية الآخرين من `/admin/users`

---

## 📊 اللوحات التحليلية

| الكود | اسم اللوحة | المسار |
|---|---|---|
| DASH-01 | اللوحة التنفيذية | `/dashboards/executive` |
| DASH-02 | قمع الأفكار | `/dashboards/ideas` |
| DASH-03 | التحديات والهاكاثونات | `/dashboards/challenges` |
| DASH-04 | طلبات الساندبوكس | `/dashboards/sandbox` |
| DASH-05 | التجارب التشغيلية | `/dashboards/pilots` |
| DASH-06 | محفظة المبادرات | `/dashboards/initiatives` |
| DASH-07 | الشركاء والرعايات | `/dashboards/partners` |
| DASH-08 | سجل المخاطر | `/dashboards/risks` |
| DASH-09 | المؤشرات والأثر | `/dashboards/metrics` |
| DASH-10 | التواصل والإعلام | `/dashboards/communications` |

---

## 🛠️ التطوير

```bash
# فتح Prisma Studio (واجهة قاعدة البيانات)
npm run db:studio

# تعديل Schema
nano prisma/schema.prisma
npm run db:push

# Migration للإنتاج
npm run db:migrate
```

---

## 🆘 استكشاف الأخطاء

**`PrismaClient is not generated`** → شغّل `npx prisma generate`

**`Database connection error`** → تأكد من `DATABASE_URL` في `.env`

**تسجيل الدخول لا يعمل** → تأكد من:
- `NEXTAUTH_URL` يطابق الـ domain
- `redirect URI` مضاف في Google Cloud
- بريدك مذكور في `ALLOWED_EMAILS` أو دومينك في `ALLOWED_DOMAINS`

---

## 📝 الترخيص

ملكية: وزارة البلديات والإسكان © 2026
