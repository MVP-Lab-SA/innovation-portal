# مركز الابتكار وحلول الأعمال

> منصة Vercel-native متكاملة: **Postgres + Blob + Auth** — كلها من Vercel.

## ✨ المعمارية

- **Frontend + API**: Next.js 14 (App Router) على Vercel
- **Database**: Vercel Postgres (Neon) - مدمج، مجاني
- **File Storage**: Vercel Blob - مدمج، مجاني
- **Authentication**: Email Magic Links (Resend) + Google OAuth اختياري
- **ORM**: Prisma مع Neon Serverless Adapter

---

## 🚀 الإعداد على Vercel (10 دقائق)

### ✅ الخطوة 1: قاعدة البيانات (نقرتان)

افتح المشروع في Vercel ثم:

1. اذهب إلى تبويب **Storage**
2. اضغط **Create Database** → **Neon - Serverless Postgres**
3. **Region**: `Frankfurt (eu-central-1)` (الأقرب)
4. اضغط **Create**

✅ سيتم حقن المتغيرات التالية تلقائياً:
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

### ✅ الخطوة 2: تخزين الملفات (نقرتان)

نفس تبويب **Storage**:

1. اضغط **Create Database** → **Blob**
2. اختر اسم: `innovation-files`
3. اضغط **Create**

✅ سيتم حقن: `BLOB_READ_WRITE_TOKEN`

### ✅ الخطوة 3: البريد الإلكتروني (نقرتان)

نفس تبويب **Storage** → **Integrations Marketplace**:

1. ابحث عن **Resend**
2. اضغط **Add Integration**
3. أنشئ مشروع Resend جديد
4. اربطه بمشروع Vercel

✅ سيتم حقن: `RESEND_API_KEY`

### ✅ الخطوة 4: متغيرات Auth (يدوي - مرة واحدة)

اذهب إلى **Settings → Environment Variables** وأضف:

| Key | Value |
|---|---|
| `NEXTAUTH_URL` | `https://innovation-portal-ajalqahtani-momahgovsas-projects.vercel.app` |
| `NEXTAUTH_SECRET` | شغّل `openssl rand -base64 32` ثم الصق |
| `ADMIN_EMAIL` | `aj.alqahtani@momah.gov.sa` |
| `ALLOWED_DOMAINS` | `momah.gov.sa,gov.sa` |
| `EMAIL_FROM` | `onboarding@resend.dev` (مؤقت) |

### ✅ الخطوة 5: إعادة النشر

في Vercel: **Deployments** → آخر deployment → ⋯ → **Redeploy**

### ✅ الخطوة 6: تهيئة قاعدة البيانات

في المتصفح: افتح `/api/health` لترى الحالة. إذا كان `schema_migrated: false`:

```bash
# على جهازك المحلي:
git clone https://github.com/MVP-Lab-SA/innovation-portal.git
cd innovation-portal
npm install

# انسخ POSTGRES_PRISMA_URL و POSTGRES_URL_NON_POOLING من Vercel
echo 'POSTGRES_PRISMA_URL="..."' > .env
echo 'POSTGRES_URL_NON_POOLING="..."' >> .env

npm run db:setup   # ينشئ الجداول + يملأ القوائم
```

---

## 🔐 نظام الأمان

### كيف يعمل تسجيل الدخول؟

1. المستخدم يدخل بريده الإلكتروني
2. النظام يتحقق من الـ allowlist (`ALLOWED_DOMAINS` أو `ALLOWED_EMAILS`)
3. إذا مُصرَّح به → يرسل رابطاً سحرياً للبريد عبر Resend
4. المستخدم يضغط الرابط → يُسجّل دخوله فوراً

### الأدوار

| الإجراء | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|
| عرض اللوحات | ✅ | ✅ | ✅ |
| تصدير Excel | ✅ | ✅ | ✅ |
| رفع ملفات | ✅ | ✅ | ❌ |
| إضافة/تعديل | ✅ | ✅ | ❌ |
| حذف | ✅ | ❌ | ❌ |
| إدارة المستخدمين | ✅ | ❌ | ❌ |

أول مستخدم يدخل بـ `ADMIN_EMAIL` يصبح Admin تلقائياً.

---

## 🩺 التشخيص

افتح `/api/health` لرؤية:
- هل قاعدة البيانات متصلة؟
- هل Blob مفعّل؟
- هل البريد يعمل؟
- كم مستخدم في النظام؟

---

## 📂 بنية المشروع

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── entities/[entity]/     # CRUD generic
│   │   ├── dashboards/[id]/       # Analytics APIs
│   │   ├── lookups/               # Reference lists
│   │   ├── upload/                # Vercel Blob upload
│   │   └── health/                # Status check
│   ├── dashboards/                # 10 لوحات تحليلية
│   ├── admin/                     # شاشات الإدارة
│   └── login/                     # تسجيل الدخول
├── components/                    # UI Components
├── hooks/                         # React Hooks
└── lib/
    ├── prisma.ts                  # Neon adapter
    ├── auth.ts                    # NextAuth + Resend
    ├── blob.ts                    # Vercel Blob helpers
    ├── crud.ts                    # CRUD factory
    └── entityConfigs.ts           # Form definitions
```

---

## 📊 اللوحات الـ 10

| الكود | اللوحة | المسار |
|---|---|---|
| DASH-01 | اللوحة التنفيذية | `/dashboards/executive` |
| DASH-02 | قمع الأفكار | `/dashboards/ideas` |
| DASH-03 | التحديات | `/dashboards/challenges` |
| DASH-04 | طلبات الساندبوكس | `/dashboards/sandbox` |
| DASH-05 | التجارب التشغيلية | `/dashboards/pilots` |
| DASH-06 | محفظة المبادرات | `/dashboards/initiatives` |
| DASH-07 | الشركاء والرعايات | `/dashboards/partners` |
| DASH-08 | سجل المخاطر | `/dashboards/risks` |
| DASH-09 | المؤشرات والأثر | `/dashboards/metrics` |
| DASH-10 | التواصل والإعلام | `/dashboards/communications` |

---

## 📝 الترخيص

ملكية: وزارة البلديات والإسكان © 2026
