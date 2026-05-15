# مركز الابتكار وحلول الأعمال

> منصة Vercel-native متكاملة بالكامل: **Neon Postgres + Neon Auth + Vercel Blob + Sanity CMS**

## 🏗️ المعمارية

| الطبقة | التقنية |
|---|---|
| **Frontend + API** | Next.js 14 (App Router) |
| **Database** | Vercel Postgres (Neon Serverless) |
| **Auth** | Neon Auth (Better Auth) — الإصدار الجديد |
| **File Storage** | Vercel Blob |
| **CMS** | Sanity (للمحتوى التحريري) |
| **ORM** | Prisma + Neon Adapter |
| **Hosting** | Vercel (Frankfurt) |

## ✨ مميزات Neon Auth

- 🌳 **Auth state يتفرع مع DB**: كل branch له auth منفصل
- 📧 **Email OTP مدمج**: بدون Resend خارجي
- 🔵 **Google OAuth مفعّل افتراضياً** (credentials اختبارية)
- 🗄️ **بيانات المستخدمين في DB**: في `neon_auth.users_sync`
- ⚡ **متغير واحد فقط**: `NEON_AUTH_BASE_URL` بدلاً من 6+

---

## 🔧 Environment Variables

### Auto-injected by Vercel integrations:
```bash
# Postgres
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
DATABASE_URL=...

# Neon Auth (Beta - Better Auth)
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...
```

### Required (manual):
```bash
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>
ADMIN_EMAIL=aj.alqahtani@momah.gov.sa
ALLOWED_DOMAINS=momah.gov.sa,gov.sa
```

### Optional - Sanity CMS:
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=vhq6bivv
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=...
SANITY_API_WRITE_TOKEN=...
```

---

## 🚀 الإعداد على Vercel

### 1️⃣ تفعيل Neon Auth (نقرة)

في Neon Console → Project → **Auth** → **Setup**

✅ يضيف `NEON_AUTH_BASE_URL` و `NEON_PROJECT_ID` لـ Vercel تلقائياً

### 2️⃣ إضافة Cookie Secret

في Vercel → Settings → Environment Variables:

```
NEON_AUTH_COOKIE_SECRET = <openssl rand -base64 32>
ADMIN_EMAIL = aj.alqahtani@momah.gov.sa
ALLOWED_DOMAINS = momah.gov.sa,gov.sa
```

### 3️⃣ Vercel Blob (نقرتان)

Vercel → Storage → Create Database → **Blob**

### 4️⃣ تعطيل Vercel Authentication

Settings → Deployment Protection → **Standard Protection** → "Only Preview"

### 5️⃣ Redeploy

Deployments → آخر deployment → Redeploy

---

## 🔐 نظام الصلاحيات (RBAC)

| الإجراء | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|
| عرض اللوحات | ✅ | ✅ | ✅ |
| تصدير Excel | ✅ | ✅ | ✅ |
| رفع ملفات | ✅ | ✅ | ❌ |
| إضافة/تعديل | ✅ | ✅ | ❌ |
| حذف | ✅ | ❌ | ❌ |
| إدارة المستخدمين | ✅ | ❌ | ❌ |

أول مستخدم بـ `ADMIN_EMAIL` يصبح Admin تلقائياً.

---

## 🩺 التشخيص

افتح `/api/health` لرؤية حالة كل الخدمات:
- Database (Neon)
- Blob storage
- Sanity CMS
- Neon Auth
- Schema migration
- عدد المستخدمين والقوائم

---

## 📊 اللوحات الـ 10

| الكود | اللوحة |
|---|---|
| DASH-01 | اللوحة التنفيذية |
| DASH-02 | قمع الأفكار |
| DASH-03 | التحديات والهاكاثونات |
| DASH-04 | طلبات الساندبوكس |
| DASH-05 | التجارب التشغيلية |
| DASH-06 | محفظة المبادرات |
| DASH-07 | الشركاء والرعايات |
| DASH-08 | سجل المخاطر |
| DASH-09 | المؤشرات والأثر |
| DASH-10 | التواصل والإعلام |

---

## 📂 بنية المشروع

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...path]/       # Neon Auth handler
│   │   ├── me/                   # Profile (role) endpoint
│   │   ├── entities/[entity]/    # Generic CRUD
│   │   ├── dashboards/[id]/      # Analytics
│   │   ├── lookups/              # Reference lists
│   │   ├── upload/               # Vercel Blob
│   │   ├── sanity/               # CMS content
│   │   └── health/               # Public diagnostics
│   ├── dashboards/               # 10 لوحات
│   ├── admin/                    # شاشات الإدارة
│   └── login/                    # AuthView من Neon Auth UI
├── components/
└── lib/
    ├── auth.ts                   # createNeonAuth (server)
    ├── auth-client.ts            # createAuthClient (client)
    ├── prisma.ts                 # Neon adapter
    ├── blob.ts                   # Vercel Blob
    ├── sanity.ts                 # Sanity CMS
    └── crud.ts                   # CRUD factory
```

---

## 📝 الترخيص

ملكية: وزارة البلديات والإسكان © 2026
