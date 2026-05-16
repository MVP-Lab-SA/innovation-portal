'use client';

import { useEffect, useState } from 'react';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import { authClient } from '@/lib/auth-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NeonAuthUIProvider 
      authClient={authClient}
      redirectTo="/"
      emailOTP
    >
      {children}
    </NeonAuthUIProvider>
  );
}
