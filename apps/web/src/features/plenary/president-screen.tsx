'use client';

import { Check, Gavel, LucideIcon, Menu, Play, Square, Vote, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { agenda, councilMembers, sessions, voteResult } from '@/features/shared/demo-data';
import { DataTable } from '@/features/shared/data-table';
import { PageHeader } from '@/features/shared/page-header';
import { SectionPanel } from '@/features/shared/section-panel';
import { StatusBadge } from '@/features/shared/status-badge';
import { useAuthenticatedData } from '@/features/shared/use-api-data';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export function PresidentScreen() {
  const { token, user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const { data: apiSessions = sessions } = useAuthenticatedData<any[]>('president-sessions', '/api/plenary-sessions', sessions, user?.role === 'PRESIDENTE' || user?.role === 'SECRETARIO');
  const activeSession = apiSessions.find((session) => session.status === 'VOTING' || session.status === 'OPENED') ?? apiSessions[0];
  const activeAgenda = activeSession?.agendaItems?.find((item: any) => item.matter?.status === 'VOTING') ?? activeSession?.agendaItems?.[0];
  const sessionId = activeSession?.id ?? 'ses-015';
  const matterId = activeAgenda?.matterId ?? activeAgenda?.matter?.id ?? 'mat-012';
  const matterTitle = activeAgenda?.matter?.title ?? 'Projeto de Lei n° 012/2026';

  async function startVoting() {
    setMessage(null);
    try {
      await apiRequest('/api/votes/start', {
        method: 'POST',
        token,
        body: JSON.stringify({ sessionId, matterId })
      });
      setMessage('Votacao iniciada no backend.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel iniciar votacao.');
    }
  }

  async function closeVoting() {
    setMessage(null);
    try {
      await apiRequest(`/api/votes/${sessionId}/${matterId}/close`, {
        method: 'PATCH',
        token
      });
      setMessage('Votacao encerrada e resultado calculado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel encerrar votacao.');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-smart bg-secondary p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-secondary">
              Sessao ordinaria 015/2026
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-normal">{matterTitle}</h1>
            <p className="mt-3 max-w-2xl text-white/75">Programa Municipal de Incentivo a Energia Solar. Votacao nominal em andamento com MFA obrigatorio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={startVoting}><Play className="h-4 w-4" /> Iniciar votacao</Button>
            <Button variant="warning" onClick={closeVoting}><Square className="h-4 w-4" /> Encerrar votacao</Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Sim', voteResult.YES, 'bg-approved'],
            ['Nao', voteResult.NO, 'bg-rejected'],
            ['Abstencao', voteResult.ABSTAIN, 'bg-pending']
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-smart border border-white/10 bg-white/8 p-4">
              <p className="text-sm text-white/65">{label as string}</p>
              <p className="mt-2 text-4xl font-bold">{value as number}</p>
              <div className="mt-4 h-2 rounded-full bg-white/15">
                <div className={cn('h-2 rounded-full', color as string)} style={{ width: `${Number(value) * 20}%` }} />
              </div>
            </div>
          ))}
        </div>
        {message && <p className="mt-5 rounded-smart border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white/85">{message}</p>}
      </section>

      <SectionPanel>
        <PageHeader title="Presenca e votos" description="Acompanhamento nominal durante a votacao." />
        <div className="mt-5 space-y-3">
          {councilMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-smart border border-slate-100 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{member.name.slice(0, 1)}</div>
                <div>
                  <p className="text-sm font-bold text-secondary">{member.name}</p>
                  <p className="text-xs text-text">{member.party}</p>
                </div>
              </div>
              <StatusBadge status={member.voteState === 'Voto confirmado' ? 'APPROVED' : member.voteState === 'Aguardando MFA' ? 'PENDING' : 'DRAFT'} />
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}

export function SecretaryScreen() {
  return (
    <SectionPanel>
      <PageHeader
        eyebrow="Tela do secretario"
        title="Controle da pauta"
        description="Organize a ordem da sessao, acompanhe chamada nominal e registre eventos."
        actions={<Button><Gavel className="h-4 w-4" /> Registrar ocorrencia</Button>}
      />
      <div className="mt-5">
        <DataTable
          columns={['Ordem', 'Materia', 'Autor', 'Status']}
          rows={agenda.map((item) => [
            item.order,
            `${item.matter.type} ${item.matter.number} - ${item.matter.title}`,
            item.matter.author,
            <StatusBadge key="status" status={item.status} />
          ])}
        />
      </div>
    </SectionPanel>
  );
}

export function VotingResultScreen() {
  const resultCards: Array<[string, number, string, LucideIcon]> = [
    ['Sim', voteResult.YES, 'APPROVED', Check],
    ['Nao', voteResult.NO, 'REJECTED', X],
    ['Abstencao', voteResult.ABSTAIN, 'PENDING', Menu],
    ['Ausentes', voteResult.ABSENT, 'DRAFT', Vote]
  ];

  return (
    <SectionPanel>
      <PageHeader
        eyebrow="Resultado"
        title="Votacao nominal encerrada"
        description="Resultado calculado automaticamente a partir dos votos confirmados com MFA."
      />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {resultCards.map(([label, value, status, Icon]) => (
          <div key={label as string} className="rounded-smart border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={status as string} />
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold text-secondary">{value as number}</p>
            <p className="text-sm text-text">{label as string}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-smart border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-bold text-secondary">Resultado: aprovado</p>
        <p className="mt-1 text-sm text-text">Hash publico da apuracao: {voteResult.publicHash}</p>
      </div>
    </SectionPanel>
  );
}

export function PlenaryFeature() {
  return (
    <div className="space-y-6">
      <PresidentScreen />
      <SecretaryScreen />
      <VotingResultScreen />
    </div>
  );
}
