'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarDays, ClipboardList, FileSignature, FileText, Gavel, Plus, Save, Users } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import { DataTable } from '@/features/shared/data-table';
import { MetricCard } from '@/features/shared/metric-card';
import { PageHeader } from '@/features/shared/page-header';
import { SectionPanel } from '@/features/shared/section-panel';
import { StatusBadge } from '@/features/shared/status-badge';
import { apiRequest } from '@/lib/api';
import { maskCpf, maskPhone } from '@/lib/masks';

type SecretarySection = 'dashboard' | 'protocols' | 'matters' | 'sessions' | 'agenda' | 'attendance' | 'minutes' | 'documents';
type Protocol = { id: string; protocolNumber: number; year: number; documentType: string; subject: string; authorName: string; authorDocument?: string | null; authorEmail?: string | null; authorPhone?: string | null; status: string; receivedAt: string; receiptHash: string; matterId?: string | null };
type Matter = { id: string; type: string; number: number; year: number; title: string; summary: string; status: string; authorId: string; author?: { name: string } };
type Session = { id: string; type: string; number: number; date: string; status: string; agendaItems?: Array<{ id: string; order: number; status: string; matter: Matter; matterId: string }> };
type CouncilMember = { id: string; name: string; party: string; status: string };
type Minute = { id: string; sessionId: string; status: string; content: string; session?: Session };

const sections: Array<{ id: SecretarySection; label: string; icon: typeof ClipboardList }> = [
  { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
  { id: 'protocols', label: 'Protocolos', icon: FileSignature },
  { id: 'matters', label: 'Materias', icon: BookOpen },
  { id: 'sessions', label: 'Sessoes', icon: CalendarDays },
  { id: 'agenda', label: 'Pauta', icon: Gavel },
  { id: 'attendance', label: 'Presenca', icon: Users },
  { id: 'minutes', label: 'Atas', icon: FileText },
  { id: 'documents', label: 'Documentos', icon: FileText }
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-secondary">{label}<div className="mt-2">{children}</div></label>;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select className="h-11 w-full rounded-smart border border-slate-200 bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4">
      <div className="my-6 w-full max-w-4xl rounded-smart bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold text-secondary">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 p-5">{footer}</div>}
      </div>
    </div>
  );
}

function useSecretaryQuery<T>(key: string, path: string) {
  const { token } = useAuth();
  return useQuery({ queryKey: ['secretaria', key, path, token], queryFn: () => apiRequest<T>(path, { token }), enabled: Boolean(token) });
}

function clean(body: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== '' && value !== undefined));
}

export function SecretaryDashboard() {
  const [section, setSection] = useState<SecretarySection>('dashboard');
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Secretaria Legislativa" title="Operacao legislativa" description="Protocolos, materias, sessoes, pauta, presenca, atas e documentos." />
      <nav className="flex flex-wrap gap-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <Button key={id} variant={section === id ? 'primary' : 'outline'} onClick={() => setSection(id)}>
            <Icon className="h-4 w-4" /> {label}
          </Button>
        ))}
      </nav>
      {section === 'dashboard' && <SecretaryHome setSection={setSection} />}
      {section === 'protocols' && <ProtocolsPanel />}
      {section === 'matters' && <MattersPanel />}
      {section === 'sessions' && <SessionsPanel />}
      {section === 'agenda' && <AgendaPanel />}
      {section === 'attendance' && <AttendancePanel />}
      {section === 'minutes' && <MinutesPanel />}
      {section === 'documents' && <DocumentsPanel />}
    </div>
  );
}

function SecretaryHome({ setSection }: { setSection: (section: SecretarySection) => void }) {
  const protocols = useSecretaryQuery<Protocol[]>('protocols-dashboard', '/api/protocols');
  const matters = useSecretaryQuery<Matter[]>('matters-dashboard', '/api/legislative-matters');
  const sessions = useSecretaryQuery<Session[]>('sessions-dashboard', '/api/plenary-sessions');
  const minutes = useSecretaryQuery<Minute[]>('minutes-dashboard', '/api/session-minutes');
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Protocolos recebidos" value={String(protocols.data?.filter((item) => item.status === 'RECEIVED').length ?? 0)} icon={FileSignature} />
        <MetricCard title="Materias em tramitacao" value={String(matters.data?.filter((item) => !['APPROVED', 'REJECTED', 'ARCHIVED'].includes(item.status)).length ?? 0)} icon={BookOpen} />
        <MetricCard title="Sessoes agendadas" value={String(sessions.data?.filter((item) => item.status === 'SCHEDULED').length ?? 0)} icon={CalendarDays} />
        <MetricCard title="Sessoes abertas" value={String(sessions.data?.filter((item) => item.status === 'OPENED' || item.status === 'VOTING').length ?? 0)} icon={Gavel} />
        <MetricCard title="Atas pendentes" value={String(minutes.data?.filter((item) => item.status !== 'PUBLISHED').length ?? 0)} icon={FileText} />
        <MetricCard title="Votacoes encerradas" value={String(matters.data?.filter((item) => item.status === 'APPROVED' || item.status === 'REJECTED').length ?? 0)} icon={ClipboardList} />
      </section>
      <SectionPanel>
        <PageHeader title="Acoes rapidas" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setSection('protocols')}><Plus className="h-4 w-4" /> Novo Protocolo</Button>
          <Button onClick={() => setSection('matters')}><Plus className="h-4 w-4" /> Nova Materia</Button>
          <Button onClick={() => setSection('sessions')}><Plus className="h-4 w-4" /> Nova Sessao</Button>
          <Button onClick={() => setSection('minutes')}><FileText className="h-4 w-4" /> Gerar Ata</Button>
        </div>
      </SectionPanel>
    </div>
  );
}

function ProtocolsPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', year: '', documentType: '', search: '' });
  const query = new URLSearchParams(clean(filters) as Record<string, string>).toString();
  const protocols = useSecretaryQuery<Protocol[]>('protocols', `/api/protocols${query ? `?${query}` : ''}`);
  const matters = useSecretaryQuery<Matter[]>('matters-for-protocol', '/api/legislative-matters');
  const [modal, setModal] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [link, setLink] = useState({ protocolId: '', matterId: '' });
  const [form, setForm] = useState({ documentType: 'Oficio', subject: '', description: '', authorName: '', authorDocument: '', authorEmail: '', authorPhone: '', documentUrl: '' });
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => {
      setModal(false);
      queryClient.invalidateQueries({ queryKey: ['secretaria'] });
    }
  });
  async function loadReceipt(id: string) {
    setReceipt(await apiRequest(`/api/protocols/${id}/receipt`, { token }));
  }
  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Protocolos" description="Controle de recebimento e comprovante." actions={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Novo Protocolo</Button>} />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Field label="Status"><Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option>{['RECEIVED', 'FORWARDED_TO_SECRETARY', 'ATTACHED_TO_MATTER', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}</Select></Field>
          <Field label="Ano"><Input value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} /></Field>
          <Field label="Tipo"><Input value={filters.documentType} onChange={(e) => setFilters({ ...filters, documentType: e.target.value })} /></Field>
          <Field label="Busca"><Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></Field>
        </div>
      </SectionPanel>
      <DataTable columns={['Numero', 'Tipo', 'Assunto', 'Autor', 'Status', 'Acoes']} rows={(protocols.data ?? []).map((item) => [
        `${item.protocolNumber}/${item.year}`,
        item.documentType,
        item.subject,
        item.authorName,
        <StatusBadge key={item.id} status={item.status} />,
        <div key={`${item.id}-actions`} className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => loadReceipt(item.id)}>Comprovante</Button>
          <Button variant="outline" onClick={() => mutate.mutate({ path: `/api/protocols/${item.id}/status`, method: 'PATCH', body: { status: 'FORWARDED_TO_SECRETARY' } })}>Encaminhar</Button>
          <Button variant="outline" onClick={() => setLink({ protocolId: item.id, matterId: item.matterId ?? '' })}>Vincular</Button>
        </div>
      ])} />
      {receipt && <SectionPanel><PageHeader title="Comprovante do protocolo" /><pre className="mt-5 overflow-auto rounded-smart bg-slate-950 p-4 text-xs text-white">{JSON.stringify(receipt, null, 2)}</pre></SectionPanel>}
      {link.protocolId && (
        <SectionPanel>
          <PageHeader title="Vincular protocolo a materia" />
          <div className="mt-5 flex gap-3">
            <Select value={link.matterId} onChange={(matterId) => setLink({ ...link, matterId })}><option value="">Selecione</option>{(matters.data ?? []).map((matter) => <option key={matter.id} value={matter.id}>{matter.type} {matter.number}/{matter.year} - {matter.title}</option>)}</Select>
            <Button disabled={!link.matterId} onClick={() => mutate.mutate({ path: `/api/protocols/${link.protocolId}/link-matter`, method: 'PATCH', body: { matterId: link.matterId } })}>Vincular</Button>
          </div>
        </SectionPanel>
      )}
      <Modal open={modal} title="Novo Protocolo" onClose={() => setModal(false)} footer={<><Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => mutate.mutate({ path: '/api/protocols', body: clean(form) })}><Save className="h-4 w-4" /> Salvar</Button></>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tipo de documento"><Input value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} /></Field>
          <Field label="Assunto"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Autor"><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} /></Field>
          <Field label="Documento do autor"><Input value={form.authorDocument} onChange={(e) => setForm({ ...form, authorDocument: maskCpf(e.target.value) })} /></Field>
          <Field label="E-mail"><Input value={form.authorEmail} onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={form.authorPhone} onChange={(e) => setForm({ ...form, authorPhone: maskPhone(e.target.value) })} /></Field>
          <Field label="URL/anexo"><Input value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} /></Field>
          <Field label="Descricao"><textarea className="min-h-28 w-full rounded-smart border border-slate-200 p-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function MattersPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const matters = useSecretaryQuery<Matter[]>('matters', '/api/legislative-matters');
  const members = useSecretaryQuery<CouncilMember[]>('members-for-matters', '/api/council-members');
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ type: 'Projeto de Lei', number: 1, year: new Date().getFullYear(), title: '', summary: '', authorId: '', documentUrl: '' });
  const filtered = (matters.data ?? []).filter((matter) => `${matter.type} ${matter.number} ${matter.year} ${matter.title} ${matter.status}`.toLowerCase().includes(filter.toLowerCase()));
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => {
      setModal(false);
      queryClient.invalidateQueries({ queryKey: ['secretaria'] });
    }
  });
  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Materias Legislativas" actions={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Nova Materia</Button>} />
        <Field label="Filtros por tipo, ano, status, autor e busca"><Input className="mt-5" value={filter} onChange={(e) => setFilter(e.target.value)} /></Field>
      </SectionPanel>
      <DataTable columns={['Materia', 'Titulo', 'Autor', 'Status', 'Acoes']} rows={filtered.map((matter) => [
        `${matter.type} ${matter.number}/${matter.year}`,
        matter.title,
        matter.author?.name ?? '-',
        <StatusBadge key={matter.id} status={matter.status} />,
        <div key={`${matter.id}-actions`} className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => mutate.mutate({ path: `/api/legislative-matters/${matter.id}/protocol`, method: 'POST' })}>Protocolar</Button>
          <Button variant="outline" onClick={() => mutate.mutate({ path: `/api/legislative-matters/${matter.id}/send-to-agenda`, method: 'POST' })}>Enviar para pauta</Button>
        </div>
      ])} />
      <Modal open={modal} title="Nova Materia" onClose={() => setModal(false)} footer={<><Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => mutate.mutate({ path: '/api/legislative-matters', body: form })}>Salvar</Button></>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tipo"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>
          <Field label="Numero"><Input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} /></Field>
          <Field label="Ano"><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></Field>
          <Field label="Autor"><Select value={form.authorId} onChange={(authorId) => setForm({ ...form, authorId })}><option value="">Selecione</option>{(members.data ?? []).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></Field>
          <Field label="Titulo"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Documento URL"><Input value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} /></Field>
          <Field label="Resumo"><textarea className="min-h-28 w-full rounded-smart border border-slate-200 p-3 text-sm" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function SessionsPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const sessions = useSecretaryQuery<Session[]>('sessions', '/api/plenary-sessions');
  const members = useSecretaryQuery<CouncilMember[]>('members-for-sessions', '/api/council-members');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: 'Ordinaria', number: 1, date: new Date().toISOString().slice(0, 10), presidentId: '', secretaryId: '' });
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => {
      setModal(false);
      queryClient.invalidateQueries({ queryKey: ['secretaria'] });
    }
  });
  return (
    <div className="space-y-6">
      <SectionPanel><PageHeader title="Sessoes" actions={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Nova Sessao</Button>} /></SectionPanel>
      <DataTable columns={['Sessao', 'Data', 'Status', 'Itens', 'Acoes']} rows={(sessions.data ?? []).map((session) => [
        `${session.type} ${session.number}`,
        new Date(session.date).toLocaleString('pt-BR'),
        <StatusBadge key={session.id} status={session.status} />,
        String(session.agendaItems?.length ?? 0),
        <Button key={`${session.id}-cancel`} variant="warning" onClick={() => mutate.mutate({ path: `/api/plenary-sessions/${session.id}/cancel`, method: 'PATCH' })}>Cancelar</Button>
      ])} />
      <Modal open={modal} title="Nova Sessao" onClose={() => setModal(false)} footer={<><Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => mutate.mutate({ path: '/api/plenary-sessions', body: form })}>Salvar</Button></>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tipo"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>
          <Field label="Numero"><Input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} /></Field>
          <Field label="Data"><Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Presidente"><Select value={form.presidentId} onChange={(presidentId) => setForm({ ...form, presidentId })}><option value="">Selecione</option>{(members.data ?? []).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></Field>
          <Field label="Secretario"><Select value={form.secretaryId} onChange={(secretaryId) => setForm({ ...form, secretaryId })}><option value="">Selecione</option>{(members.data ?? []).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></Field>
        </div>
      </Modal>
    </div>
  );
}

function AgendaPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const sessions = useSecretaryQuery<Session[]>('sessions-for-agenda', '/api/plenary-sessions');
  const matters = useSecretaryQuery<Matter[]>('matters-for-agenda', '/api/legislative-matters');
  const [sessionId, setSessionId] = useState('');
  const [matterId, setMatterId] = useState('');
  const session = (sessions.data ?? []).find((item) => item.id === sessionId) ?? sessions.data?.[0];
  const activeSessionId = sessionId || session?.id || '';
  const agenda = useSecretaryQuery<any[]>('agenda', activeSessionId ? `/api/session-agenda/${activeSessionId}` : '/api/session-agenda/none');
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secretaria'] })
  });
  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Pauta" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Sessao"><Select value={activeSessionId} onChange={setSessionId}>{(sessions.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.type} {item.number}</option>)}</Select></Field>
          <Field label="Materia"><Select value={matterId} onChange={setMatterId}><option value="">Selecione</option>{(matters.data ?? []).map((matter) => <option key={matter.id} value={matter.id}>{matter.type} {matter.number}/{matter.year} - {matter.title}</option>)}</Select></Field>
          <div className="flex items-end"><Button disabled={!activeSessionId || !matterId} onClick={() => mutate.mutate({ path: '/api/session-agenda', body: { sessionId: activeSessionId, matterId, order: (agenda.data?.length ?? 0) + 1 } })}>Adicionar</Button></div>
        </div>
      </SectionPanel>
      <DataTable columns={['Ordem', 'Materia', 'Status', 'Acoes']} rows={(agenda.data ?? []).map((item) => [
        item.order,
        `${item.matter.type} ${item.matter.number}/${item.matter.year} - ${item.matter.title}`,
        <StatusBadge key={item.id} status={item.status} />,
        <div key={`${item.id}-actions`} className="flex gap-2"><Button variant="outline" onClick={() => mutate.mutate({ path: `/api/session-agenda/${item.id}/status`, method: 'PATCH', body: { status: 'IN_DISCUSSION' } })}>Discutir</Button><Button variant="warning" onClick={() => mutate.mutate({ path: `/api/session-agenda/${item.id}/remove`, method: 'PATCH' })}>Retirar</Button></div>
      ])} />
    </div>
  );
}

function AttendancePanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const sessions = useSecretaryQuery<Session[]>('sessions-for-attendance', '/api/plenary-sessions');
  const members = useSecretaryQuery<CouncilMember[]>('members-for-attendance', '/api/council-members');
  const [sessionId, setSessionId] = useState('');
  const activeSessionId = sessionId || sessions.data?.[0]?.id || '';
  const attendance = useSecretaryQuery<any[]>('attendance', activeSessionId ? `/api/session-attendance/${activeSessionId}` : '/api/session-attendance/none');
  const mutate = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: string }) => apiRequest(`/api/session-attendance/${activeSessionId}/${memberId}`, { token, method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secretaria'] })
  });
  const statusByMember = new Map((attendance.data ?? []).map((item) => [item.councilMemberId, item.status]));
  const present = (attendance.data ?? []).filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length;
  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Presenca" description={`Quorum: ${present}/${members.data?.length ?? 0}`} />
        <Field label="Sessao"><Select value={activeSessionId} onChange={setSessionId}>{(sessions.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.type} {item.number}</option>)}</Select></Field>
      </SectionPanel>
      <DataTable columns={['Vereador', 'Partido', 'Status', 'Acoes']} rows={(members.data ?? []).map((member) => [
        member.name,
        member.party,
        statusByMember.get(member.id) ?? 'Nao registrado',
        <div key={`${member.id}-actions`} className="flex flex-wrap gap-2">{['PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE'].map((status) => <Button key={status} variant="outline" onClick={() => mutate.mutate({ memberId: member.id, status })}>{status}</Button>)}</div>
      ])} />
    </div>
  );
}

function MinutesPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const sessions = useSecretaryQuery<Session[]>('sessions-for-minutes', '/api/plenary-sessions');
  const minutes = useSecretaryQuery<Minute[]>('minutes', '/api/session-minutes');
  const [sessionId, setSessionId] = useState('');
  const [content, setContent] = useState('');
  const mutate = useMutation({
    mutationFn: ({ path, method = 'PATCH', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secretaria'] })
  });
  const activeSessionId = sessionId || sessions.data?.[0]?.id || '';
  async function generate() {
    const minute = await apiRequest<Minute>(`/api/session-minutes/${activeSessionId}/generate`, { token, method: 'POST', body: JSON.stringify({}) });
    setContent(minute.content);
    queryClient.invalidateQueries({ queryKey: ['secretaria'] });
  }
  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Atas" actions={<Button disabled={!activeSessionId} onClick={generate}>Gerar Ata</Button>} />
        <Field label="Sessao"><Select value={activeSessionId} onChange={setSessionId}>{(sessions.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.type} {item.number}</option>)}</Select></Field>
        <Field label="Editor"><textarea className="mt-4 min-h-64 w-full rounded-smart border border-slate-200 p-3 text-sm" value={content} onChange={(e) => setContent(e.target.value)} /></Field>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!activeSessionId || !content} onClick={() => mutate.mutate({ path: `/api/session-minutes/${activeSessionId}`, body: { content } })}>Salvar</Button>
          <Button variant="outline" disabled={!activeSessionId} onClick={() => mutate.mutate({ path: `/api/session-minutes/${activeSessionId}/send-review` })}>Enviar revisao</Button>
          <Button variant="success" disabled={!activeSessionId} onClick={() => mutate.mutate({ path: `/api/session-minutes/${activeSessionId}/publish` })}>Publicar</Button>
        </div>
      </SectionPanel>
      <DataTable columns={['Sessao', 'Status', 'Atualizada']} rows={(minutes.data ?? []).map((minute: any) => [minute.session ? `${minute.session.type} ${minute.session.number}` : minute.sessionId, <StatusBadge key={minute.id} status={minute.status} />, new Date(minute.updatedAt).toLocaleString('pt-BR')])} />
    </div>
  );
}

function DocumentsPanel() {
  return (
    <SectionPanel>
      <PageHeader title="Documentos" description="No MVP, documentos ficam vinculados a protocolos, materias e atas por URL/anexo." />
    </SectionPanel>
  );
}
