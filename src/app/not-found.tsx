import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background-alt">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-ministry-green-soft flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-ministry-green-deep" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm text-text-secondary mb-6">
          تعذّر العثور على الصفحة المطلوبة. ربما تم نقلها أو حذفها.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
