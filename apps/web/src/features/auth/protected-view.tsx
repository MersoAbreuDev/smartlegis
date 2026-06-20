'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginPage } from '@/features/auth/login-page';
import { useAuth } from '@/features/auth/auth-context';
import { roleHomePath, UserRole } from '@/lib/api';

export function ProtectedView({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { user, isReady, logout } = useAuth();

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center bg-surface text-sm font-semibold text-text">Carregando acesso...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-6">
        <section className="max-w-lg rounded-smart border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold text-secondary">Acesso nao permitido</h1>
          <p className="mt-3 text-sm leading-6 text-text">
            Seu perfil atual e {user.role}. Esta area exige outro perfil do sistema.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={roleHomePath(user.role)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-smart bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082f57]"
            >
              Ir para minha area
            </Link>
            <Button variant="outline" onClick={logout}>Trocar usuario</Button>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
