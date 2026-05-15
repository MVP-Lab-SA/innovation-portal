'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Lock, AlertCircle, Mail, CheckCircle2, Loader2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const checkEmail = searchParams.get('check-email');
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await signIn('email', { email, callbackUrl, redirect: false });
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (checkEmail || sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card border-2 border-ministry-green/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ministry-green-soft mb-4">
              <CheckCircle2 className="w-8 h-8 text-ministry-green" />
            </div>
            <h2 className="text-2xl font-bold text-ministry-green-deep mb-2">تحقق من بريدك الإلكتروني</h2>
            <p className="text-text-secondary mb-6">
              أرسلنا رابط تسجيل الدخول إلى بريدك. اضغط الرابط لإكمال تسجيل الدخول.
            </p>
            <div className="p-4 bg-ministry-green-soft rounded-lg text-sm text-ministry-green-deep">
              💡 الرابط صالح لمدة 24 ساعة فقط ولاستخدام واحد
            </div>
            <a href="/login" className="inline-block mt-6 text-sm text-ministry-green hover:underline">
              ← العودة لشاشة تسجيل الدخول
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ministry-green to-ministry-green-deep shadow-strong mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-ministry-green-deep mb-2">مركز الابتكار وحلول الأعمال</h1>
          <p className="text-text-secondary">وزارة البلديات والإسكان</p>
        </div>
        
        <div className="card border-2 border-ministry-green/10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ministry-green-soft text-ministry-green-deep text-sm font-medium mb-4">
              <Lock className="w-4 h-4" />
              <span>منصة آمنة محمية</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-1">تسجيل الدخول</h2>
            <p className="text-sm text-text-secondary">أدخل بريدك الإلكتروني المُصرَّح به</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {error === 'AccessDenied' ? 'هذا البريد غير مصرّح له بالوصول.' : 
                 error === 'Verification' ? 'انتهت صلاحية الرابط أو تم استخدامه. اطلب رابطاً جديداً.' :
                 'حدث خطأ. حاول مرة أخرى.'}
              </div>
            </div>
          )}
          
          {/* Email Magic Link Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@momah.gov.sa"
                  className="input-base pr-9"
                  dir="ltr"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ministry-green text-white font-medium hover:bg-ministry-green-deep transition-all duration-200 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>{sending ? 'جارٍ الإرسال...' : 'إرسال رابط تسجيل الدخول'}</span>
            </button>
          </form>

          {/* Google OAuth (only if configured) */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-text-muted">أو</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          <button onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-border hover:border-ministry-green hover:bg-ministry-green-soft transition-all duration-200 font-medium">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>المتابعة باستخدام Google</span>
          </button>
          
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-text-muted">
              يجب أن يكون بريدك مُصرَّحاً به من قبل المسؤول
            </p>
          </div>
        </div>
        
        <p className="text-center text-xs text-text-muted mt-8">© 2026 مركز الابتكار وحلول الأعمال</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جارٍ التحميل...</div>}>
      <LoginContent />
    </Suspense>
  );
}
