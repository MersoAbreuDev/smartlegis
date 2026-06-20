'use client';

import { Activity, Bell, Crown, FileText, Gavel, Home, Landmark, Lock, LogOut, ShieldCheck, UserCog, Users, Vote } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useTenantBranding } from '@/features/public/use-tenant-branding';
import { canAccessView, viewFromPath } from '@/lib/api';
import { cn } from '@/lib/utils';

const nav = [
  { id: 'master', label: 'Master', href: '/master', icon: Crown },
  { id: 'admin', label: 'Admin', href: '/admin', icon: Home },
  { id: 'plenario', label: 'Plenario', href: '/plenario', icon: Gavel },
  { id: 'vereador', label: 'Vereador', href: '/vereador', icon: Vote },
  { id: 'publico', label: 'Portal publico', href: '/publico', icon: Landmark, external: true }
];

const adminNav = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin?section=dashboard', icon: Home },
  { id: 'users', label: 'Usuarios', href: '/admin?section=users', icon: Users },
  { id: 'council', label: 'Vereadores', href: '/admin?section=council', icon: UserCog },
  { id: 'roles', label: 'Perfis', href: '/admin?section=roles', icon: ShieldCheck },
  { id: 'portal', label: 'Portal Publico', href: '/admin?section=portal', icon: FileText },
  { id: 'audit', label: 'Auditoria', href: '/admin?section=audit', icon: Activity }
];

function NavLinks({ active, className }: { active: string; className?: string }) {
  const { user } = useAuth();
  const visibleNav = nav.filter((item) => item.id === 'publico' || (user && canAccessView(user.role, item.id)));

  return (
    <>
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const linkClassName = cn(
          'flex items-center gap-3 rounded-smart px-3 py-3 text-sm font-semibold transition',
          active === item.id ? 'bg-[#1447E6] text-white' : 'text-white/72 hover:bg-white/8',
          className
        );

        if ('external' in item && item.external) {
          return (
            <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.id} href={item.href} className={linkClassName}>
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function AdminNavLinks({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section') ?? 'dashboard';

  return (
    <>
      {adminNav.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-smart px-3 py-2.5 text-sm font-semibold transition',
              activeSection === item.id ? 'bg-white text-secondary' : 'text-white/62 hover:bg-white/8',
              className
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({
  children,
  active
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const branding = useTenantBranding();
  const brand = branding.data;
  const currentView = active ?? viewFromPath(pathname);

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-secondary px-5 py-6 text-white lg:block">
        <Logo compact className="mb-8" imageUrl={brand?.logoSidenavUrl} alt={brand?.displayName ?? 'Logo da Camara'} />
        <nav className="space-y-2">
          <NavLinks active={currentView} className="w-full" />
          {currentView === 'admin' && user?.role === 'ADMIN_CAMARA' && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-white/40">Admin Camara</p>
              <AdminNavLinks className="w-full" />
            </div>
          )}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-smart border border-white/10 p-4 text-sm text-white/72">
          <Lock className="mb-3 h-5 w-5 text-accent" />
          {user?.role === 'MASTER'
            ? 'Master administra plataforma, licencas, seguranca e auditoria global.'
            : 'Votos confirmados sao imutaveis e auditados por cadeia de hash.'}
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-secondary">{brand?.displayName ?? 'Camara Municipal de Santa Aurora'}</p>
              <p className="text-xs text-text">Ambiente multi tenant ativo</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-10 w-10 px-0" title="Notificacoes">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden text-right text-sm md:block">
                <p className="font-semibold text-secondary">{user?.name ?? 'Visitante'}</p>
                <p className="text-xs text-text">{user?.role ?? 'Portal publico'}</p>
              </div>
              {user && (
                <Button variant="ghost" className="h-10 w-10 px-0" title="Sair" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto bg-secondary px-5 py-3 lg:hidden">
            <NavLinks active={currentView} className="shrink-0 whitespace-nowrap" />
            {currentView === 'admin' && user?.role === 'ADMIN_CAMARA' && <AdminNavLinks className="shrink-0 whitespace-nowrap" />}
          </nav>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
