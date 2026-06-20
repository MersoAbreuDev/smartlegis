'use client';

import { BadgeCheck, Check, Menu, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import { sessions, traceabilityItems, VoteValue } from '@/features/shared/demo-data';
import { PageHeader } from '@/features/shared/page-header';
import { SectionPanel } from '@/features/shared/section-panel';
import { useAuthenticatedData } from '@/features/shared/use-api-data';
import { apiRequest } from '@/lib/api';

export function CouncilMemberVoteScreen() {
  const [confirmed, setConfirmed] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteValue>('YES');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { token } = useAuth();
  const { data: apiSessions = sessions } = useAuthenticatedData<any[]>('vote-sessions', '/api/plenary-sessions', sessions);
  const receipt = useMemo(() => `VOTE-${Math.random().toString(16).slice(2, 10).toUpperCase()}`, [confirmed]);
  const activeSession = apiSessions.find((session) => session.status === 'VOTING' || session.status === 'OPENED') ?? apiSessions[0];
  const activeAgenda = activeSession?.agendaItems?.find((item: any) => item.matter?.status === 'VOTING') ?? activeSession?.agendaItems?.[0];
  const sessionId = activeSession?.id ?? 'ses-015';
  const matterId = activeAgenda?.matterId ?? activeAgenda?.matter?.id ?? 'mat-012';
  const matterTitle = activeAgenda?.matter?.title ?? 'Projeto de Lei n° 012/2026';

  async function requestMfa(vote: VoteValue) {
    setSelectedVote(vote);
    setMessage(null);
    try {
      const response = await apiRequest<{ challengeId: string; demoCode?: string }>('/api/votes/mfa', {
        method: 'POST',
        token,
        body: JSON.stringify({ sessionId, matterId, vote })
      });
      setChallengeId(response.challengeId);
      setMessage(`MFA enviado. Na demo, use ${response.demoCode ?? '123456'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel solicitar MFA.');
    }
  }

  async function confirmVote() {
    setMessage(null);
    if (!challengeId) {
      setMessage('Solicite o MFA antes de confirmar o voto.');
      return;
    }

    try {
      await apiRequest('/api/votes/confirm', {
        method: 'POST',
        token,
        body: JSON.stringify({ sessionId, matterId, vote: selectedVote, challengeId, code: mfaCode })
      });
      setConfirmed(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel confirmar voto.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <PageHeader
            eyebrow="Votacao em andamento"
            title={matterTitle}
            description="Dispoe sobre incentivo municipal a energia solar. Confirme sua escolha com MFA para registrar voto nominal."
          />
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Button className="h-20 text-lg" variant="success" onClick={() => requestMfa('YES')}><Check className="h-7 w-7" /> Sim</Button>
          <Button className="h-20 text-lg" variant="danger" onClick={() => requestMfa('NO')}><X className="h-7 w-7" /> Nao</Button>
          <Button className="h-20 text-lg" variant="warning" onClick={() => requestMfa('ABSTAIN')}><Menu className="h-7 w-7" /> Abstencao</Button>
        </div>
        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <Input placeholder="Codigo MFA recebido por e-mail" inputMode="numeric" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
          <Button className="h-11 md:w-56" onClick={confirmVote}>
            <BadgeCheck className="h-5 w-5" />
            Confirmar voto
          </Button>
        </div>
        {message && <p className="mt-4 rounded-smart border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-text">{message}</p>}
      </SectionPanel>

      {confirmed && (
        <section className="rounded-smart border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-approved p-3 text-white"><Check className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-secondary">Voto registrado com sucesso</h2>
              <p className="mt-2 text-sm leading-6 text-text">Comprovante {receipt}. O voto foi confirmado com MFA, hash individual e trilha de auditoria.</p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {traceabilityItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-smart border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-bold text-secondary">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text">{item.description}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
