'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { LoginPage } from '@/features/auth/login-page';
import { roleHomePath } from '@/lib/api';

export default function Page() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && user) {
      router.replace(roleHomePath(user.role));
    }
  }, [isReady, user, router]);

  if (!isReady || user) {
    return <div className="flex min-h-screen items-center justify-center bg-surface text-sm font-semibold text-text">Carregando acesso...</div>;
  }

  return (
    <LoginPage
      onSuccess={(loggedUser) => {
        router.replace(roleHomePath(loggedUser.role));
      }}
    />
  );
}
