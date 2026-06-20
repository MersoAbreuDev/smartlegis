'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, Plus, Save, UserCog, Users, X } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import { DataTable } from '@/features/shared/data-table';
import { MetricCard } from '@/features/shared/metric-card';
import { PageHeader } from '@/features/shared/page-header';
import { SectionPanel } from '@/features/shared/section-panel';
import { StatusBadge } from '@/features/shared/status-badge';
import { apiRequest, UserRole } from '@/lib/api';
import { maskCep, maskCnpj, maskCpf, maskPhone } from '@/lib/masks';

type AdminSection = 'dashboard' | 'users' | 'council' | 'roles' | 'portal' | 'audit';
type AdminProfile = { id: string; name: string; description: string | null; modules: string[]; active: boolean; _count?: { users: number } };
type UserRow = { id: string; name: string; email: string; role: UserRole; status: string; mfaRequired: boolean; adminProfileId?: string | null; adminProfile?: AdminProfile | null };
type CouncilMemberRow = CouncilForm & { id: string; status: string; user?: { email: string; status: string } | null };
type RoleRow = { role: UserRole; permissions: string[] };
type AuditRow = { id: string; action: string; entity: string; entityId: string; hash: string; previousHash: string | null; createdAt: string; actor?: { email: string; name: string } | null };
type PortalDashboard = { activeUsers: number; activeCouncilMembers: number; publishedContents: number; latestAuditLogs: AuditRow[] };
type PortalPage = { id: string; slug: string; title: string; summary: string | null; content: string; status: string; updatedAt: string };
type PortalBanner = { id: string; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; sortOrder: number; active: boolean; status: string };
type PortalMenuItem = { id: string; label: string; url: string; sortOrder: number; active: boolean };

type CouncilForm = {
  userId: string;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  occupation: string;
  email: string;
  phone: string;
  mobile: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  businessDocument: string;
  businessName: string;
  businessTradeName: string;
  businessEmail: string;
  businessPhone: string;
  businessZipCode: string;
  businessStreet: string;
  businessNumber: string;
  businessComplement: string;
  businessNeighborhood: string;
  businessCity: string;
  businessState: string;
  party: string;
  photoUrl: string;
  legislativePeriod: string;
  legislativeRole: string;
  isPresident: boolean;
  isSecretary: boolean;
  termStart: string;
  termEnd: string;
};

const sectionTitles: Record<AdminSection, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Resumo administrativo da Camara.' },
  users: { title: 'Usuarios', description: 'Listagem, filtros, paginacao, criacao e edicao em modal.' },
  council: { title: 'Vereadores', description: 'Cadastro completo de pessoa, empresa, contato, endereco e mandato.' },
  roles: { title: 'Perfis', description: 'Perfis administrativos com modulos de acesso.' },
  portal: { title: 'Portal Publico', description: 'Conteudo institucional do portal, sem branding, logo ou dominio.' },
  audit: { title: 'Auditoria', description: 'Consulta somente leitura dos logs da Camara.' }
};

const moduleLabels: Record<string, string> = {
  DASHBOARD: 'Dashboard',
  USERS: 'Usuarios',
  COUNCIL_MEMBERS: 'Vereadores',
  ROLES: 'Perfis',
  PORTAL_PAGES: 'Portal - Paginas',
  PORTAL_BANNERS: 'Portal - Banners',
  PORTAL_MENU: 'Portal - Menu',
  PORTAL_PREVIEW: 'Portal - Preview',
  AUDIT: 'Auditoria'
};

const emptyCouncilForm: CouncilForm = {
  userId: '',
  name: '',
  cpf: '',
  rg: '',
  birthDate: '',
  occupation: '',
  email: '',
  phone: '',
  mobile: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  businessDocument: '',
  businessName: '',
  businessTradeName: '',
  businessEmail: '',
  businessPhone: '',
  businessZipCode: '',
  businessStreet: '',
  businessNumber: '',
  businessComplement: '',
  businessNeighborhood: '',
  businessCity: '',
  businessState: '',
  party: '',
  photoUrl: '',
  legislativePeriod: '',
  legislativeRole: 'Vereador',
  isPresident: false,
  isSecretary: false,
  termStart: '2025-01-01',
  termEnd: '2028-12-31'
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-secondary">{label}<div className="mt-2">{children}</div></label>;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select className="h-11 w-full rounded-smart border border-slate-200 bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex min-h-11 items-center gap-2 rounded-smart border border-slate-200 bg-white px-3 text-sm font-semibold text-secondary"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

function Modal({ title, description, open, onClose, children, footer }: { title: string; description?: string; open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4">
      <div className="my-6 w-full max-w-5xl rounded-smart bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-secondary">{title}</h2>
            {description && <p className="mt-1 text-sm text-text">{description}</p>}
          </div>
          <Button variant="ghost" className="h-10 w-10 px-0" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 p-5">{footer}</div>}
      </div>
    </div>
  );
}

function cleanBody<T extends Record<string, unknown>>(body: T) {
  return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, value === '' ? undefined : value]).filter(([, value]) => value !== undefined));
}

function useAdminQuery<T>(key: string, path: string) {
  const { token } = useAuth();
  return useQuery({ queryKey: ['admin', key, path, token], queryFn: () => apiRequest<T>(path, { token }), enabled: Boolean(token) });
}

function usePagedRows<T>(rows: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { page: safePage, totalPages, visibleRows, setPage };
}

function PaginatedTable<T>({ columns, rows, renderRow, pageSize = 10 }: { columns: string[]; rows: T[]; renderRow: (row: T) => ReactNode[]; pageSize?: number }) {
  const { page, totalPages, visibleRows, setPage } = usePagedRows(rows, pageSize);
  return (
    <div className="space-y-3">
      <DataTable columns={columns} rows={visibleRows.map(renderRow)} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text">
        <span>{rows.length} registro(s). Pagina {page} de {totalPages}.</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Proxima</Button>
        </div>
      </div>
    </div>
  );
}

export function AdminFeature() {
  const searchParams = useSearchParams();
  const section = ((searchParams.get('section') ?? 'dashboard') as AdminSection);
  const current = sectionTitles[section] ? section : 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Painel administrativo" title={sectionTitles[current].title} description={sectionTitles[current].description} />
      {current === 'dashboard' && <AdminDashboard />}
      {current === 'users' && <AdminUsersPanel />}
      {current === 'council' && <AdminCouncilMembersPanel />}
      {current === 'roles' && <AdminRolesPanel />}
      {current === 'portal' && <AdminPortalPanel />}
      {current === 'audit' && <AdminAuditPanel />}
    </div>
  );
}

function AdminDashboard() {
  const dashboard = useAdminQuery<PortalDashboard>('portal-dashboard', '/api/portal-content/dashboard');
  const data = dashboard.data;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Usuarios ativos" value={String(data?.activeUsers ?? 0)} footer="Tenant atual" icon={Users} />
        <MetricCard title="Vereadores ativos" value={String(data?.activeCouncilMembers ?? 0)} footer="Mandatos ativos" icon={UserCog} />
        <MetricCard title="Conteudos publicados" value={String(data?.publishedContents ?? 0)} footer="Portal institucional" icon={FileText} />
      </section>
      <SectionPanel>
        <PageHeader title="Ultimas acoes de auditoria" />
        <div className="mt-5">
          <DataTable columns={['Data', 'Acao', 'Entidade', 'Usuario']} rows={(data?.latestAuditLogs ?? []).map((log) => [
            new Date(log.createdAt).toLocaleString('pt-BR'),
            log.action,
            log.entity,
            log.actor?.email ?? '-'
          ])} />
        </div>
      </SectionPanel>
    </div>
  );
}

function AdminUsersPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const users = useAdminQuery<UserRow[]>('users', '/api/users');
  const profiles = useAdminQuery<AdminProfile[]>('admin-profiles-for-users', '/api/roles/profiles');
  const [filters, setFilters] = useState({ search: '', role: '', status: '', profile: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ id: '', name: '', email: '', password: 'Smart@123', role: 'SECRETARIO' as UserRole, adminProfileId: '' });
  const selected = users.data?.find((item) => item.id === selectedId);
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    }
  });

  const filtered = useMemo(() => (users.data ?? []).filter((user) => {
    const search = filters.search.toLowerCase();
    return (!search || `${user.name} ${user.email}`.toLowerCase().includes(search))
      && (!filters.role || user.role === filters.role)
      && (!filters.status || user.status === filters.status)
      && (!filters.profile || user.adminProfileId === filters.profile);
  }), [users.data, filters]);

  function openNew() {
    setSelectedId('');
    setForm({ id: '', name: '', email: '', password: 'Smart@123', role: 'SECRETARIO', adminProfileId: '' });
    setModalOpen(true);
  }

  function openEdit(user: UserRow) {
    setSelectedId(user.id);
    setForm({ id: user.id, name: user.name, email: user.email, password: '', role: user.role, adminProfileId: user.adminProfileId ?? '' });
    setModalOpen(true);
  }

  function save() {
    const body = cleanBody({ name: form.name, email: form.email, password: form.password, role: form.role, adminProfileId: form.adminProfileId });
    mutate.mutate({ path: form.id ? `/api/users/${form.id}` : '/api/users', method: form.id ? 'PATCH' : 'POST', body });
  }

  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Listagem de usuarios" description="Use filtros antes de criar ou editar." actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Criar usuario</Button>} />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Field label="Buscar"><Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Nome ou e-mail" /></Field>
          <Field label="Role"><Select value={filters.role} onChange={(value) => setFilters({ ...filters, role: value })}><option value="">Todos</option>{['ADMIN_CAMARA', 'SECRETARIO', 'PRESIDENTE', 'VEREADOR'].map((role) => <option key={role}>{role}</option>)}</Select></Field>
          <Field label="Status"><Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></Select></Field>
          <Field label="Perfil"><Select value={filters.profile} onChange={(value) => setFilters({ ...filters, profile: value })}><option value="">Todos</option>{(profiles.data ?? []).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</Select></Field>
        </div>
      </SectionPanel>

      <PaginatedTable columns={['Nome', 'E-mail', 'Role', 'Perfil', 'MFA', 'Status', 'Acoes']} rows={filtered} renderRow={(item) => [
        item.name,
        item.email,
        item.role,
        item.adminProfile?.name ?? '-',
        item.mfaRequired ? 'Ativo' : 'Inativo',
        <StatusBadge key={item.id} status={item.status} />,
        <div key={`${item.id}-actions`} className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openEdit(item)}>Editar</Button>
          <Button variant="outline" onClick={() => mutate.mutate({ path: `/api/users/${item.id}`, method: 'PATCH', body: { mfaRequired: !item.mfaRequired } })}>MFA</Button>
          <Button variant={item.status === 'ACTIVE' ? 'warning' : 'success'} onClick={() => mutate.mutate({ path: `/api/users/${item.id}/${item.status === 'ACTIVE' ? 'block' : 'reactivate'}`, method: 'PATCH' })}>{item.status === 'ACTIVE' ? 'Bloquear' : 'Reativar'}</Button>
        </div>
      ]} />

      <Modal title={form.id ? 'Editar usuario' : 'Criar usuario'} description="Preencha os dados do usuario e atribua o perfil de acesso." open={modalOpen} onClose={() => setModalOpen(false)} footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={save}><Save className="h-4 w-4" /> Salvar</Button></>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Senha"><Input value={form.password} placeholder={form.id ? 'Preencha para resetar' : 'Senha inicial'} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role base"><Select value={form.role} onChange={(value) => setForm({ ...form, role: value as UserRole })}>{['ADMIN_CAMARA', 'SECRETARIO', 'PRESIDENTE', 'VEREADOR'].map((role) => <option key={role} value={role}>{role}</option>)}</Select></Field>
          <Field label="Perfil administrativo"><Select value={form.adminProfileId} onChange={(value) => setForm({ ...form, adminProfileId: value })}><option value="">Sem perfil customizado</option>{(profiles.data ?? []).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</Select></Field>
        </div>
      </Modal>
    </div>
  );
}

function AdminCouncilMembersPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const council = useAdminQuery<CouncilMemberRow[]>('council-members', '/api/council-members');
  const users = useAdminQuery<UserRow[]>('users-for-council', '/api/users');
  const vereadorUsers = (users.data ?? []).filter((user) => user.role === 'VEREADOR');
  const [filters, setFilters] = useState({ search: '', status: '', role: '', party: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState<CouncilForm>(emptyCouncilForm);
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    }
  });

  const filtered = useMemo(() => (council.data ?? []).filter((member) => {
    const search = filters.search.toLowerCase();
    return (!search || `${member.name} ${member.cpf} ${member.email}`.toLowerCase().includes(search))
      && (!filters.status || member.status === filters.status)
      && (!filters.role || member.legislativeRole === filters.role)
      && (!filters.party || member.party.toLowerCase().includes(filters.party.toLowerCase()));
  }), [council.data, filters]);

  async function fillAddress(zipCode: string, prefix: '' | 'business') {
    const value = maskCep(zipCode);
    setForm((current) => ({ ...current, [prefix ? 'businessZipCode' : 'zipCode']: value }));
    if (value.replace(/\D/g, '').length !== 8) return;
    const data = await apiRequest<{ street: string; neighborhood: string; city: string; state: string }>(`/api/address/cep/${value.replace(/\D/g, '')}`, { token });
    if (prefix) {
      setForm((current) => ({ ...current, businessStreet: data.street, businessNeighborhood: data.neighborhood, businessCity: data.city, businessState: data.state }));
    } else {
      setForm((current) => ({ ...current, street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state }));
    }
  }

  function openNew() {
    setEditingId('');
    setForm(emptyCouncilForm);
    setModalOpen(true);
  }

  function openEdit(member: CouncilMemberRow) {
    setEditingId(member.id);
    setForm({ ...emptyCouncilForm, ...member, userId: member.userId ?? '', birthDate: member.birthDate ? String(member.birthDate).slice(0, 10) : '', termStart: String(member.termStart).slice(0, 10), termEnd: String(member.termEnd).slice(0, 10) });
    setModalOpen(true);
  }

  function save() {
    mutate.mutate({ path: editingId ? `/api/council-members/${editingId}` : '/api/council-members', method: editingId ? 'PATCH' : 'POST', body: cleanBody(form) });
  }

  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Listagem de vereadores" description="Filtros, paginacao e cadastro em modal." actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Criar vereador</Button>} />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Field label="Buscar"><Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Nome, CPF ou e-mail" /></Field>
          <Field label="Status"><Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></Select></Field>
          <Field label="Funcao"><Input value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} placeholder="Presidente, Secretario..." /></Field>
          <Field label="Partido"><Input value={filters.party} onChange={(e) => setFilters({ ...filters, party: e.target.value })} /></Field>
        </div>
      </SectionPanel>

      <PaginatedTable columns={['Nome', 'CPF', 'Partido', 'Funcao', 'Periodo', 'Usuario', 'Status', 'Acoes']} rows={filtered} renderRow={(member) => [
        member.name,
        member.cpf ?? '-',
        member.party,
        member.legislativeRole ?? '-',
        member.legislativePeriod ?? '-',
        member.user?.email ?? 'Sem vinculo',
        <StatusBadge key={member.id} status={member.status} />,
        <div key={`${member.id}-actions`} className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openEdit(member)}>Editar</Button>
          <Button variant={member.status === 'ACTIVE' ? 'warning' : 'success'} onClick={() => mutate.mutate({ path: `/api/council-members/${member.id}/${member.status === 'ACTIVE' ? 'inactivate' : 'activate'}`, method: 'PATCH' })}>{member.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}</Button>
          <Button variant="outline" onClick={() => mutate.mutate({ path: `/api/council-members/${member.id}/unlink-user`, method: 'PATCH' })}>Desvincular</Button>
        </div>
      ]} />

      <Modal title={editingId ? 'Editar vereador' : 'Criar vereador'} description="Cadastro completo do vereador como pessoa vinculada a Camara." open={modalOpen} onClose={() => setModalOpen(false)} footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={save}><Save className="h-4 w-4" /> Salvar</Button></>}>
        <div className="space-y-6">
          <div>
            <p className="mb-3 font-bold text-secondary">Dados basicos</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Usuario vinculado"><Select value={form.userId} onChange={(value) => setForm({ ...form, userId: value })}><option value="">Sem vinculo</option>{vereadorUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</Select></Field>
              <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="CPF"><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} /></Field>
              <Field label="RG"><Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} /></Field>
              <Field label="Nascimento"><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></Field>
              <Field label="Ocupacao"><Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></Field>
              <Field label="Foto URL"><Input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 font-bold text-secondary">Contato</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Celular"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: maskPhone(e.target.value) })} /></Field>
              <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 font-bold text-secondary">Endereco pessoal</p>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="CEP"><Input value={form.zipCode} onChange={(e) => void fillAddress(e.target.value, '')} /></Field>
              <Field label="Rua"><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Field>
              <Field label="Numero"><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
              <Field label="Complemento"><Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></Field>
              <Field label="Bairro"><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></Field>
              <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="UF"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 font-bold text-secondary">Dados empresariais</p>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="CNPJ"><Input value={form.businessDocument} onChange={(e) => setForm({ ...form, businessDocument: maskCnpj(e.target.value) })} /></Field>
              <Field label="Razao social"><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></Field>
              <Field label="Nome fantasia"><Input value={form.businessTradeName} onChange={(e) => setForm({ ...form, businessTradeName: e.target.value })} /></Field>
              <Field label="E-mail empresa"><Input value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} /></Field>
              <Field label="Telefone empresa"><Input value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: maskPhone(e.target.value) })} /></Field>
              <Field label="CEP empresa"><Input value={form.businessZipCode} onChange={(e) => void fillAddress(e.target.value, 'business')} /></Field>
              <Field label="Rua empresa"><Input value={form.businessStreet} onChange={(e) => setForm({ ...form, businessStreet: e.target.value })} /></Field>
              <Field label="Numero empresa"><Input value={form.businessNumber} onChange={(e) => setForm({ ...form, businessNumber: e.target.value })} /></Field>
              <Field label="Complemento empresa"><Input value={form.businessComplement} onChange={(e) => setForm({ ...form, businessComplement: e.target.value })} /></Field>
              <Field label="Bairro empresa"><Input value={form.businessNeighborhood} onChange={(e) => setForm({ ...form, businessNeighborhood: e.target.value })} /></Field>
              <Field label="Cidade empresa"><Input value={form.businessCity} onChange={(e) => setForm({ ...form, businessCity: e.target.value })} /></Field>
              <Field label="UF empresa"><Input value={form.businessState} onChange={(e) => setForm({ ...form, businessState: e.target.value.toUpperCase().slice(0, 2) })} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 font-bold text-secondary">Periodo legislativo</p>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Partido"><Input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} /></Field>
              <Field label="Periodo"><Input value={form.legislativePeriod} placeholder="2025-2028" onChange={(e) => setForm({ ...form, legislativePeriod: e.target.value })} /></Field>
              <Field label="Funcao"><Input value={form.legislativeRole} onChange={(e) => setForm({ ...form, legislativeRole: e.target.value })} /></Field>
              <Field label="Inicio mandato"><Input type="date" value={form.termStart} onChange={(e) => setForm({ ...form, termStart: e.target.value })} /></Field>
              <Field label="Fim mandato"><Input type="date" value={form.termEnd} onChange={(e) => setForm({ ...form, termEnd: e.target.value })} /></Field>
              <Checkbox label="Presidente" checked={form.isPresident} onChange={(checked) => setForm({ ...form, isPresident: checked })} />
              <Checkbox label="Secretario" checked={form.isSecretary} onChange={(checked) => setForm({ ...form, isSecretary: checked })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AdminRolesPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const systemRoles = useAdminQuery<RoleRow[]>('system-roles', '/api/roles');
  const modules = useAdminQuery<string[]>('role-modules', '/api/roles/modules');
  const profiles = useAdminQuery<AdminProfile[]>('admin-profiles', '/api/roles/profiles');
  const [filters, setFilters] = useState({ search: '', module: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', description: '', modules: [] as string[], active: true });
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    }
  });

  const filtered = useMemo(() => (profiles.data ?? []).filter((profile) => {
    const search = filters.search.toLowerCase();
    return (!search || `${profile.name} ${profile.description ?? ''}`.toLowerCase().includes(search))
      && (!filters.module || profile.modules.includes(filters.module))
      && (!filters.status || String(profile.active) === filters.status);
  }), [profiles.data, filters]);

  function toggleModule(module: string) {
    setForm((current) => ({ ...current, modules: current.modules.includes(module) ? current.modules.filter((item) => item !== module) : [...current.modules, module] }));
  }

  function openNew() {
    setForm({ id: '', name: '', description: '', modules: [], active: true });
    setModalOpen(true);
  }

  function openEdit(profile: AdminProfile) {
    setForm({ id: profile.id, name: profile.name, description: profile.description ?? '', modules: profile.modules, active: profile.active });
    setModalOpen(true);
  }

  function save() {
    mutate.mutate({ path: form.id ? `/api/roles/profiles/${form.id}` : '/api/roles/profiles', method: form.id ? 'PATCH' : 'POST', body: { name: form.name, description: form.description, modules: form.modules, active: form.active } });
  }

  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Listagem de perfis" description="Filtre os perfis e crie novos em modal com selecao de modulos." actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Criar perfil</Button>} />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Buscar"><Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Nome ou descricao" /></Field>
          <Field label="Modulo"><Select value={filters.module} onChange={(value) => setFilters({ ...filters, module: value })}><option value="">Todos</option>{(modules.data ?? []).map((module) => <option key={module} value={module}>{moduleLabels[module] ?? module}</option>)}</Select></Field>
          <Field label="Status"><Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option><option value="true">Ativo</option><option value="false">Inativo</option></Select></Field>
        </div>
      </SectionPanel>

      <PaginatedTable columns={['Perfil', 'Descricao', 'Modulos', 'Usuarios', 'Status', 'Acoes']} rows={filtered} renderRow={(profile) => [
        profile.name,
        profile.description ?? '-',
        profile.modules.map((module) => moduleLabels[module] ?? module).join(', '),
        String(profile._count?.users ?? 0),
        profile.active ? 'Ativo' : 'Inativo',
        <div key={`${profile.id}-actions`} className="flex gap-2">
          <Button variant="outline" onClick={() => openEdit(profile)}>Editar</Button>
          <Button variant="warning" onClick={() => mutate.mutate({ path: `/api/roles/profiles/${profile.id}`, method: 'PATCH', body: { active: !profile.active } })}>Ativar/desativar</Button>
        </div>
      ]} />

      <SectionPanel>
        <PageHeader title="Roles base do sistema" description="RBAC estrutural usado pelos guards existentes." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(systemRoles.data ?? []).map((role) => (
            <div key={role.role} className="rounded-smart border border-slate-200 bg-white p-4">
              <p className="font-bold text-secondary">{role.role}</p>
              <div className="mt-3 flex flex-wrap gap-2">{role.permissions.map((permission) => <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-text">{permission}</span>)}</div>
            </div>
          ))}
        </div>
      </SectionPanel>

      <Modal title={form.id ? 'Editar perfil' : 'Criar perfil'} description="Selecione os modulos que este perfil podera acessar." open={modalOpen} onClose={() => setModalOpen(false)} footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={save}><Save className="h-4 w-4" /> Salvar</Button></>}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Descricao"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
          <div>
            <p className="mb-3 font-bold text-secondary">Modulos de acesso</p>
            <div className="grid gap-3 md:grid-cols-3">
              {(modules.data ?? []).map((module) => <Checkbox key={module} label={moduleLabels[module] ?? module} checked={form.modules.includes(module)} onChange={() => toggleModule(module)} />)}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AdminPortalPanel() {
  return (
    <div className="space-y-6">
      <PortalPagesPanel />
      <PortalBannersPanel />
      <PortalMenuPanel />
      <PortalPreviewPanel />
    </div>
  );
}

function PortalPagesPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const pages = useAdminQuery<PortalPage[]>('portal-pages', '/api/portal-content/pages');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ slug: '', title: '', summary: '', content: '', status: 'DRAFT' });
  const filtered = (pages.data ?? []).filter((page) => `${page.title} ${page.slug} ${page.status}`.toLowerCase().includes(filter.toLowerCase()));
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] })
  });
  return (
    <SectionPanel>
      <PageHeader title="Paginas do portal" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Filtrar paginas"><Input value={filter} onChange={(e) => setFilter(e.target.value)} /></Field>
        <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
        <Field label="Titulo"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Resumo"><Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
      </div>
      <Field label="Conteudo"><textarea className="mt-2 min-h-28 w-full rounded-smart border border-slate-200 p-3 text-sm" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
      <Button className="mt-4" onClick={() => mutate.mutate({ path: '/api/portal-content/pages', body: form })}>Salvar pagina</Button>
      <div className="mt-6">
        <PaginatedTable columns={['Titulo', 'Slug', 'Status', 'Acoes']} rows={filtered} renderRow={(page) => [page.title, page.slug, page.status, <div key={page.id} className="flex gap-2"><Button variant="success" onClick={() => mutate.mutate({ path: `/api/portal-content/pages/${page.id}/publish`, method: 'POST' })}>Publicar</Button><Button variant="warning" onClick={() => mutate.mutate({ path: `/api/portal-content/pages/${page.id}/unpublish`, method: 'POST' })}>Despublicar</Button></div>]} />
      </div>
    </SectionPanel>
  );
}

function PortalBannersPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const banners = useAdminQuery<PortalBanner[]>('portal-banners', '/api/portal-content/banners');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', sortOrder: 0, status: 'DRAFT' });
  const filtered = (banners.data ?? []).filter((banner) => `${banner.title} ${banner.status}`.toLowerCase().includes(filter.toLowerCase()));
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] })
  });
  return (
    <SectionPanel>
      <PageHeader title="Banners" />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Field label="Filtrar banners"><Input value={filter} onChange={(e) => setFilter(e.target.value)} /></Field>
        <Field label="Titulo"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Subtitulo"><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></Field>
        <Field label="Ordem"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
        <Field label="Imagem"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
        <Field label="Link"><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></Field>
      </div>
      <Button className="mt-4" onClick={() => mutate.mutate({ path: '/api/portal-content/banners', body: form })}>Salvar banner</Button>
      <div className="mt-6">
        <PaginatedTable columns={['Titulo', 'Status', 'Ativo', 'Ordem', 'Acoes']} rows={filtered} renderRow={(banner) => [banner.title, banner.status, banner.active ? 'Sim' : 'Nao', banner.sortOrder, <Button key={banner.id} variant="outline" onClick={() => mutate.mutate({ path: `/api/portal-content/banners/${banner.id}`, method: 'PATCH', body: { active: !banner.active } })}>Ativar/desativar</Button>]} />
      </div>
    </SectionPanel>
  );
}

function PortalMenuPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const menu = useAdminQuery<PortalMenuItem[]>('portal-menu', '/api/portal-content/menu');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ label: '', url: '', sortOrder: 0 });
  const filtered = (menu.data ?? []).filter((item) => `${item.label} ${item.url}`.toLowerCase().includes(filter.toLowerCase()));
  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) => apiRequest(path, { token, method, body: JSON.stringify(body ?? {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] })
  });
  return (
    <SectionPanel>
      <PageHeader title="Menu publico" />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <Field label="Filtrar menu"><Input value={filter} onChange={(e) => setFilter(e.target.value)} /></Field>
        <Field label="Rotulo"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
        <Field label="URL"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></Field>
        <Field label="Ordem"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
      </div>
      <Button className="mt-4" onClick={() => mutate.mutate({ path: '/api/portal-content/menu', body: form })}>Salvar item</Button>
      <div className="mt-6">
        <PaginatedTable columns={['Rotulo', 'URL', 'Ativo', 'Ordem', 'Acoes']} rows={filtered} renderRow={(item) => [item.label, item.url, item.active ? 'Sim' : 'Nao', item.sortOrder, <Button key={item.id} variant="outline" onClick={() => mutate.mutate({ path: `/api/portal-content/menu/${item.id}`, method: 'PATCH', body: { active: !item.active } })}>Ativar/desativar</Button>]} />
      </div>
    </SectionPanel>
  );
}

function PortalPreviewPanel() {
  const preview = useAdminQuery<{ pages: PortalPage[]; banners: PortalBanner[]; menu: PortalMenuItem[] }>('portal-preview', '/api/portal-content/preview');
  return (
    <SectionPanel>
      <PageHeader title="Pre-visualizacao do portal" description="Mostra rascunhos e conteudos ainda nao publicados. O portal publico real mostra apenas publicados." actions={<a className="inline-flex min-h-10 items-center gap-2 rounded-smart bg-primary px-4 py-2 text-sm font-semibold text-white" href="/publico" target="_blank"><Eye className="h-4 w-4" /> Abrir portal real</a>} />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard title="Paginas" value={String(preview.data?.pages.length ?? 0)} footer="Inclui rascunhos" icon={FileText} />
        <MetricCard title="Banners" value={String(preview.data?.banners.length ?? 0)} footer="Inclui inativos" icon={FileText} />
        <MetricCard title="Menu" value={String(preview.data?.menu.length ?? 0)} footer="Itens cadastrados" icon={FileText} />
      </div>
    </SectionPanel>
  );
}

function AdminAuditPanel() {
  const [filters, setFilters] = useState({ action: '', entity: '', actorUserId: '', startDate: '', endDate: '' });
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params.toString();
  }, [filters]);
  const logs = useAdminQuery<AuditRow[]>('audit-logs', `/api/audit-logs${query ? `?${query}` : ''}`);
  const [detail, setDetail] = useState<AuditRow | null>(null);
  return (
    <div className="space-y-6">
      <SectionPanel>
        <PageHeader title="Auditoria" description="Somente leitura. Logs nao podem ser editados ou excluidos." />
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <Field label="Acao"><Input value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} /></Field>
          <Field label="Entidade"><Input value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })} /></Field>
          <Field label="Usuario ID"><Input value={filters.actorUserId} onChange={(e) => setFilters({ ...filters, actorUserId: e.target.value })} /></Field>
          <Field label="Inicio"><Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></Field>
          <Field label="Fim"><Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></Field>
        </div>
      </SectionPanel>
      <PaginatedTable columns={['Data', 'Acao', 'Entidade', 'Usuario', 'Hash', 'Detalhe']} rows={logs.data ?? []} renderRow={(log) => [new Date(log.createdAt).toLocaleString('pt-BR'), log.action, log.entity, log.actor?.email ?? '-', `${log.hash.slice(0, 10)}...`, <Button key={log.id} variant="outline" onClick={() => setDetail(log)}>Ver</Button>]} />
      {detail && <SectionPanel><PageHeader title="Detalhe do log" /><pre className="mt-5 overflow-auto rounded-smart bg-slate-950 p-4 text-xs text-white">{JSON.stringify(detail, null, 2)}</pre></SectionPanel>}
    </div>
  );
}
