'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('page_error', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background-alt">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-text-secondary mb-6">
          تعذّر عرض هذه الصفحة. يمكنك إعادة المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.
        </p>
        <button onClick={reset} className="btn-primary inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
        {error.digest && (
          <p className="mt-4 text-xs text-text-muted">رمز الخطأ: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
