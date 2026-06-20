'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, KeyRound, Landmark, LogIn, ShieldCheck, Vote } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantBranding } from '@/features/public/use-tenant-branding';
import { AuthUser } from '@/lib/api';
import { useAuth } from './auth-context';

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail valido'),
  password: z.string().min(6, 'Senha minima de 6 caracteres')
});

export function LoginPage({
  onSuccess,
  onEnter
}: {
  onSuccess?: (user: AuthUser) => void;
  onEnter?: () => void;
}) {
  const auth = useAuth();
  const branding = useTenantBranding();
  const brand = branding.data;
  const [mfa, setMfa] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState('123456');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'presidente@santaaurora.leg.br', password: 'Smart@123' }
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section
          className="relative flex min-h-[540px] flex-col justify-between overflow-hidden bg-secondary px-8 py-8 text-white md:px-14"
          style={{ backgroundColor: brand?.primaryColor ?? undefined }}
        >
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,71,230,0.38),transparent_28%),linear-gradient(135deg,#0B1D3A_0%,#12263A_58%,#0B3C6D_100%)]"
            style={brand?.primaryColor ? { background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.accentColor} 100%)` } : undefined}
          />
          <div className="relative z-10 flex items-center justify-between">
            <Logo className="text-white" imageUrl={brand?.logoLoginUrl} alt={brand?.displayName ?? 'Logo da Camara'} />
            <Badge tone="yellow">MVP seguro</Badge>
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Multi tenant, MFA e auditoria encadeada
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-normal md:text-6xl">
              Gestao legislativa simples para Camaras pequenas.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">
              Pauta, sessoes, votacao nominal e portal publico em uma experiencia institucional, rastreavel e preparada para evoluir.
            </p>
          </div>
          <div className="relative z-10 grid gap-4 text-sm text-white/80 md:grid-cols-3">
            {[
              ['Votacao segura', Vote],
              ['Transparencia publica', Landmark],
              ['Historico auditavel', Activity]
            ].map(([label, Icon]) => (
              <div key={String(label)} className="flex items-center gap-3 border-t border-white/15 pt-4">
                <Icon className="h-5 w-5 text-accent" />
                <span>{String(label)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-10">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-accent">Acesso institucional</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-secondary">Entrar no SmartLegis</h2>
              <p className="mt-3 text-sm leading-6 text-text">Use as credenciais de teste e confirme o MFA para acessar o painel de demonstracao.</p>
            </div>

            {!mfa ? (
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit(async (values) => {
                  setLoading(true);
                  setError(null);
                  try {
                    const response = await auth.login(values.email, values.password);
                    setChallengeId(response.challengeId);
                    setDemoCode(response.demoCode ?? '123456');
                    setMfa(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Nao foi possivel iniciar sessao.');
                  } finally {
                    setLoading(false);
                  }
                })}
              >
                <label className="block text-sm font-semibold text-secondary">
                  E-mail
                  <Input className="mt-2" {...form.register('email')} />
                </label>
                <label className="block text-sm font-semibold text-secondary">
                  Senha
                  <Input className="mt-2" type="password" {...form.register('password')} />
                </label>
                {error && <p className="rounded-smart border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-rejected">{error}</p>}
                <Button className="h-12 w-full text-base" type="submit" disabled={loading}>
                  <LogIn className="h-5 w-5" />
                  {loading ? 'Verificando...' : 'Entrar com seguranca'}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-smart border border-accent/30 bg-white p-4">
                  <KeyRound className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <p className="font-semibold text-secondary">MFA obrigatorio</p>
                    <p className="mt-1 text-sm leading-6 text-text">Codigo enviado para o e-mail institucional. Na demo, use {demoCode}.</p>
                  </div>
                </div>
                <Input placeholder={demoCode} inputMode="numeric" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
                {error && <p className="rounded-smart border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-rejected">{error}</p>}
                <Button
                  className="h-12 w-full text-base"
                  disabled={loading || !challengeId}
                  onClick={async () => {
                    if (!challengeId) return;
                    setLoading(true);
                    setError(null);
                    try {
                      const loggedUser = await auth.confirmMfa(challengeId, mfaCode);
                      onSuccess?.(loggedUser);
                      onEnter?.();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Codigo MFA invalido.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <ShieldCheck className="h-5 w-5" />
                  {loading ? 'Confirmando...' : 'Confirmar MFA'}
                </Button>
              </div>
            )}

            <div className="mt-10 grid grid-cols-4 gap-3">
              {['#0B3C6D', '#12263A', '#D4AF37', '#F4F6F8'].map((color) => (
                <div key={color}>
                  <div className="h-10 rounded-smart border border-slate-200" style={{ backgroundColor: color }} />
                  <p className="mt-2 text-[11px] font-semibold text-text">{color}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
