'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';

const AuthView = dynamic(
  () => import('@neondatabase/auth-ui').then((m) => m.AuthView),
  { ssr: false },
);

function AuthForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || '/';
  return <AuthView pathname="sign-in" redirectTo={redirectTo} />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ministry-green-soft text-ministry-green-deep text-sm font-medium mb-2">
              <Lock className="w-4 h-4" />
              <span>منصة آمنة - مدعومة بـ Neon Auth</span>
            </div>
          </div>
          
          {/* Suspense required by Next.js 14 App Router for useSearchParams */}
          <Suspense fallback={<div className="h-64" />}>
            <AuthForm />
          </Suspense>
          
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
