import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-alt">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-ministry-green" />
        <span className="text-sm">جارٍ التحميل...</span>
      </div>
    </div>
  );
}
