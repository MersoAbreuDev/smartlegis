'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MasterIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/master/dashboard');
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center bg-surface text-sm font-semibold text-text">Redirecionando...</div>;
}
