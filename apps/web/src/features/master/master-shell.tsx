'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useTenantBranding } from '@/features/public/use-tenant-branding';
import { masterMenu } from '@/features/master/master-menu';
import { cn } from '@/lib/utils';

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const branding = useTenantBranding();
  const brand = branding.data;

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-secondary px-5 py-6 text-white lg:block">
        <Logo compact className="mb-6" imageUrl={brand?.logoSidenavUrl} alt={brand?.displayName ?? 'SmartLegis'} />
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.24em] text-white/60">Console Master</p>
        <nav className="space-y-1 overflow-y-auto pb-24">
          {masterMenu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.id === 'dashboard' && pathname === '/master');
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-smart px-3 py-2.5 text-sm font-semibold transition',
                  active ? 'bg-[#1447E6] text-white' : 'text-white/72 hover:bg-white/8'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-secondary">SmartLegis Platform</p>
              <p className="text-xs text-text">Administracao global multi tenant</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm md:block">
                <p className="font-semibold text-secondary">{user?.name}</p>
                <p className="text-xs text-text">{user?.role}</p>
              </div>
              <Button variant="ghost" className="h-10 w-10 px-0" title="Sair" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto bg-secondary px-5 py-3 lg:hidden">
            {masterMenu.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-smart px-3 py-2 text-sm font-semibold',
                    active ? 'bg-[#1447E6] text-white' : 'text-white/72'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
