 'use client';

import dynamic from 'next/dynamic';

const AuthView = dynamic(
  () => import('@neondatabase/auth-ui').then((m) => m.AuthView),
  { ssr: false },
);

export default function AuthPage({
  params,
}: {
  params: { path: string };
}) {
  const path = params?.path || 'sign-in';

  return (
    <main className="container flex grow flex-col items-center justify-center p-4">
      <AuthView pathname={path} />
    </main>
  );
}
