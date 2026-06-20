'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';
import {
  MasterAdmin,
  MasterAuditActor,
  MasterAuditLogsPage,
  MasterBackup,
  MasterBranding,
  MasterDashboard,
  MasterDomain,
  MasterLicense,
  MasterMonitoring,
  MasterSetting,
  MasterTenant,
  masterRequest
} from '@/features/master/master-api';
import { dashboardIcons, forbiddenMasterActions, MasterSectionId } from '@/features/master/master-menu';
import {
  ColorSwatch,
  DetailPanel,
  filterBySearch,
  ListSearch,
  RowEditButton,
  SaveActionButton
} from '@/features/master/master-ui-helpers';
import { DataTable } from '@/features/shared/data-table';
import { MetricCard } from '@/features/shared/metric-card';
import { PageHeader } from '@/features/shared/page-header';
import { SectionPanel } from '@/features/shared/section-panel';
import { StatusBadge } from '@/features/shared/status-badge';
import { apiRequest, AuthUser, roleHomePath } from '@/lib/api';
import { maskCep, maskCnpj, maskPhone, onlyDigits } from '@/lib/masks';

function useMasterQuery<T>(key: string, path: string, enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['master', key, token],
    queryFn: () => masterRequest<T>(path, token),
    enabled: Boolean(token) && enabled
  });
}

function ActionMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-smart border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-secondary">{message}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-secondary">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

type CepAddress = {
  zipCode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ImpersonateUser = Pick<AuthUser, 'id' | 'name' | 'email' | 'role'> & { status: string };

type ImpersonateOptions = {
  tenant: { id: string; name: string; city: string; state: string };
  users: ImpersonateUser[];
};

type ImpersonateResponse = {
  accessToken: string;
  user: AuthUser;
};

export function MasterSectionContent({ section }: { section: MasterSectionId }) {
  const { token, user, setSession } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedBackupId, setSelectedBackupId] = useState('');
  const [selectedImpersonateUserId, setSelectedImpersonateUserId] = useState('');

  const invalidate = (...keys: string[]) => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: ['master', key] }));

  const dashboard = useMasterQuery<MasterDashboard>('dashboard', '/dashboard');
  const tenants = useMasterQuery<MasterTenant[]>('tenants', '/tenants?includeDeleted=true');
  const licenses = useMasterQuery<MasterLicense[]>('licenses', '/licenses');
  const admins = useMasterQuery<MasterAdmin[]>('admins', '/admins');
  const domains = useMasterQuery<MasterDomain[]>('domains', '/domains');
  const monitoring = useMasterQuery<MasterMonitoring[]>('monitoring', '/monitoring');
  const backups = useMasterQuery<MasterBackup[]>('backups', '/backups');
  const settings = useMasterQuery<MasterSetting[]>('settings', '/settings');
  const profile = useMasterQuery<any>('profile', '/profile');
  const branding = useMasterQuery<MasterBranding | null>('branding', `/tenants/${selectedTenantId}/branding`, Boolean(selectedTenantId));
  const impersonateOptions = useMasterQuery<ImpersonateOptions>(
    `impersonate-options-${selectedTenantId}`,
    `/tenants/${selectedTenantId}/impersonate-options`,
    section === 'impersonate' && Boolean(selectedTenantId)
  );

  const tenantOptions = tenants.data ?? [];

  const mutate = useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) =>
      masterRequest(path, token, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => {
      invalidate('dashboard', 'tenants', 'licenses', 'admins', 'domains', 'audit', 'backups', 'settings', 'branding');
    }
  });

  async function runAction(label: string, action: () => Promise<unknown>) {
    setMessage(null);
    try {
      await action();
      setMessage(label);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Operacao falhou.');
    }
  }

  const settingsMap = useMemo(() => Object.fromEntries((settings.data ?? []).map((item) => [item.key, item.value])), [settings.data]);

  if (section === 'dashboard') {
    const data = dashboard.data;
    const cards = data
      ? [
          { title: 'Total de Camaras', value: String(data.totalTenants), footer: `${data.activeTenants} ativas`, icon: dashboardIcons.tenants },
          { title: 'Total de Usuarios', value: String(data.totalUsers), footer: 'Plataforma inteira', icon: dashboardIcons.users },
          { title: 'Total de Vereadores', value: String(data.totalCouncilMembers), footer: 'Mandatos ativos', icon: dashboardIcons.councilMembers },
          { title: 'Sessoes Realizadas', value: String(data.totalSessions), footer: 'Historico global', icon: dashboardIcons.sessions },
          { title: 'Votacoes Realizadas', value: String(data.totalVotes), footer: 'Nominais auditadas', icon: dashboardIcons.votes },
          { title: 'Uso de Storage', value: `${data.storageUsedGb} GB`, footer: 'Licencas contratadas', icon: dashboardIcons.storage },
          { title: 'Licencas Ativas', value: String(data.activeLicenses), footer: `${data.suspendedTenants} suspensas`, icon: dashboardIcons.licenses },
          { title: 'Licencas Vencendo', value: String(data.expiringLicenses), footer: 'Proximos 30 dias', icon: dashboardIcons.expiring }
        ]
      : [];

    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Console Master" title="Dashboard da plataforma" description="Indicadores consolidados em tempo real a partir do backend." />
        <section className="grid gap-4 md:grid-cols-4">{cards.map((card) => <MetricCard key={card.title} {...card} />)}</section>
      </div>
    );
  }

  if (section === 'tenants') {
    return (
      <TenantSection
        tenants={tenantOptions}
        message={message}
        onCreate={(body) => runAction('Camara criada.', () => mutate.mutateAsync({ path: '/tenants', body }))}
        onUpdate={(id, body) => runAction('Camara atualizada.', () => mutate.mutateAsync({ path: `/tenants/${id}`, method: 'PATCH', body }))}
        onStatus={(id, status) => runAction('Status atualizado.', () => mutate.mutateAsync({ path: `/tenants/${id}/status`, method: 'PATCH', body: { status } }))}
        onDelete={(id) => runAction('Camara removida (soft delete).', () => mutate.mutateAsync({ path: `/tenants/${id}`, method: 'DELETE' }))}
        onRestore={(id) => runAction('Camara reativada.', () => mutate.mutateAsync({ path: `/tenants/${id}/restore`, body: {} }))}
      />
    );
  }

  if (section === 'licenses') {
    return (
      <LicenseSection
        tenants={tenantOptions}
        licenses={licenses.data ?? []}
        message={message}
        onSave={(tenantId, body) => runAction('Licenca salva.', () => mutate.mutateAsync({ path: `/tenants/${tenantId}/license`, method: 'PUT', body }))}
      />
    );
  }

  if (section === 'admins') {
    return (
      <AdminSection
        tenants={tenantOptions}
        admins={admins.data ?? []}
        message={message}
        selectedAdminId={selectedAdminId}
        onSelectAdmin={setSelectedAdminId}
        onCreate={(body) => runAction('Administrador criado.', () => mutate.mutateAsync({ path: '/admins', body }))}
        onUpdate={(id, body) => runAction('Administrador atualizado.', () => mutate.mutateAsync({ path: `/admins/${id}`, method: 'PATCH', body }))}
        onDelete={(id) => runAction('Administrador removido.', () => mutate.mutateAsync({ path: `/admins/${id}`, method: 'DELETE' }))}
      />
    );
  }

  if (section === 'branding') {
    return (
      <BrandingSection
        tenants={tenantOptions}
        selectedTenantId={selectedTenantId}
        onSelectTenant={setSelectedTenantId}
        branding={branding.data}
        message={message}
        token={token}
        onSave={(tenantId, body) => runAction('Branding salvo.', () => mutate.mutateAsync({ path: `/tenants/${tenantId}/branding`, method: 'PUT', body }))}
      />
    );
  }

  if (section === 'domains') {
    return (
      <DomainSection
        tenants={tenantOptions}
        domains={domains.data ?? []}
        selectedDomainId={selectedDomainId}
        onSelectDomain={setSelectedDomainId}
        message={message}
        onCreate={(body) => runAction('Dominio cadastrado.', () => mutate.mutateAsync({ path: '/domains', body }))}
        onStatus={(id, status) => runAction('Status do dominio atualizado.', () => mutate.mutateAsync({ path: `/domains/${id}/status`, method: 'PATCH', body: { status } }))}
        onDelete={(id) => runAction('Dominio removido.', () => mutate.mutateAsync({ path: `/domains/${id}`, method: 'DELETE' }))}
      />
    );
  }

  if (section === 'audit') {
    return <AuditSection tenants={tenantOptions} />;
  }

  if (section === 'security') {
    return (
      <SecuritySection
        admins={admins.data ?? []}
        message={message}
        onAction={(action, userId) => runAction('Acao de seguranca aplicada.', () => mutate.mutateAsync({ path: '/security/actions', body: { action, userId } }))}
      />
    );
  }

  if (section === 'monitoring') {
    return (
      <div className="space-y-6">
        <PageHeader title="Monitoramento" description="Saude dos servicos da plataforma." />
        <DataTable
          columns={['Servico', 'Status', 'Detalhe']}
          rows={(monitoring.data ?? []).map((row) => [row.service, <StatusBadge key={row.service} status={row.status} />, row.detail])}
        />
      </div>
    );
  }

  if (section === 'backups') {
    return (
      <BackupSection
        backups={backups.data ?? []}
        selectedBackupId={selectedBackupId}
        onSelectBackup={setSelectedBackupId}
        message={message}
        onCreate={() => runAction('Backup gerado.', () => mutate.mutateAsync({ path: '/backups', body: { source: 'MANUAL' } }))}
        onRestore={(backupId) => runAction('Restauracao registrada.', () => mutate.mutateAsync({ path: '/backups/restore', body: { backupId } }))}
        onDelete={(id) => runAction('Backup removido.', () => mutate.mutateAsync({ path: `/backups/${id}`, method: 'DELETE' }))}
      />
    );
  }

  if (section === 'settings') {
    return (
      <SettingsSection
        settings={settingsMap}
        message={message}
        onSave={(settingsBody) => runAction('Configuracoes salvas.', () => mutate.mutateAsync({ path: '/settings', method: 'PUT', body: { settings: settingsBody } }))}
      />
    );
  }

  if (section === 'profile') {
    const data = profile.data ?? user;
    return (
      <SectionPanel>
        <PageHeader title="Meu Perfil" description="Dados do operador Master." />
        <div className="mt-5 space-y-3 text-sm">
          <p><strong className="text-secondary">Nome:</strong> {data?.name}</p>
          <p><strong className="text-secondary">E-mail:</strong> {data?.email}</p>
          <p><strong className="text-secondary">Perfil:</strong> MASTER</p>
          <p><strong className="text-secondary">MFA:</strong> Obrigatorio</p>
        </div>
      </SectionPanel>
    );
  }

  if (section === 'impersonate') {
    const availableUsers = impersonateOptions.data?.users ?? [];
    return (
      <div className="space-y-6">
        <PageHeader title="Impersonate" description="Acesse a plataforma como um perfil ativo da Camara. A acao fica auditada como MASTER_ACCESSED_TENANT." />
        <ActionMessage message={message} />
        <SectionPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Camara">
              <select
                className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  setSelectedImpersonateUserId('');
                }}
              >
                <option value="">Selecione</option>
                {tenantOptions.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </select>
            </Field>
            <Field label="Perfil para acessar">
              <select
                className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
                value={selectedImpersonateUserId}
                disabled={!selectedTenantId || impersonateOptions.isLoading}
                onChange={(e) => setSelectedImpersonateUserId(e.target.value)}
              >
                <option value="">{impersonateOptions.isLoading ? 'Carregando perfis...' : 'Selecione'}</option>
                {availableUsers.map((item) => (
                  <option key={item.id} value={item.id}>{item.role} - {item.name} ({item.email})</option>
                ))}
              </select>
            </Field>
          </div>
          {selectedTenantId && !impersonateOptions.isLoading && availableUsers.length === 0 && (
            <p className="mt-3 rounded-smart border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-secondary">
              Esta Camara ainda nao possui usuarios ativos para acessar.
            </p>
          )}
          <Button className="mt-4" disabled={!selectedTenantId || !selectedImpersonateUserId} onClick={() => runAction('Acesso registrado. Redirecionando...', async () => {
            const response = await masterRequest<ImpersonateResponse>(`/tenants/${selectedTenantId}/impersonate`, token, {
              method: 'POST',
              body: JSON.stringify({ userId: selectedImpersonateUserId })
            });
            setSession(response.accessToken, response.user);
            window.location.href = roleHomePath(response.user.role);
          })}>
            Entrar como perfil selecionado
          </Button>
        </SectionPanel>
        <SectionPanel>
          <PageHeader title="Restricoes do Master" description="O Master nao interfere no processo legislativo." />
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {forbiddenMasterActions.map((action) => (
              <div key={action} className="rounded-smart border border-red-100 bg-red-50 p-4 text-sm font-semibold text-rejected">{action}</div>
            ))}
          </div>
        </SectionPanel>
      </div>
    );
  }

  return null;
}

type TenantFormData = {
  name: string;
  legalName: string;
  tradeName: string;
  document: string;
  stateRegistration: string;
  municipalRegistration: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  billingZipCode: string;
  billingStreet: string;
  billingNumber: string;
  billingComplement: string;
  billingNeighborhood: string;
  billingCity: string;
  billingState: string;
  plan: string;
};

const TENANT_EMPTY_FORM: TenantFormData = {
  name: '',
  legalName: '',
  tradeName: '',
  document: '',
  stateRegistration: '',
  municipalRegistration: '',
  responsibleName: '',
  responsibleEmail: '',
  responsiblePhone: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  billingZipCode: '',
  billingStreet: '',
  billingNumber: '',
  billingComplement: '',
  billingNeighborhood: '',
  billingCity: '',
  billingState: '',
  plan: 'PREMIUM'
};

const TENANT_REQUIRED_FIELDS = [
  'name',
  'legalName',
  'document',
  'responsibleName',
  'responsibleEmail',
  'responsiblePhone',
  'contactEmail',
  'contactPhone',
  'zipCode',
  'street',
  'number',
  'neighborhood',
  'city',
  'state',
  'billingZipCode',
  'billingStreet',
  'billingNumber',
  'billingNeighborhood',
  'billingCity',
  'billingState'
] as const;

function tenantToForm(tenant: MasterTenant): TenantFormData {
  return {
    name: tenant.name,
    legalName: tenant.legalName ?? '',
    tradeName: tenant.tradeName ?? '',
    document: tenant.document,
    stateRegistration: tenant.stateRegistration ?? '',
    municipalRegistration: tenant.municipalRegistration ?? '',
    responsibleName: tenant.responsibleName ?? '',
    responsibleEmail: tenant.responsibleEmail ?? '',
    responsiblePhone: tenant.responsiblePhone ?? '',
    contactEmail: tenant.contactEmail ?? '',
    contactPhone: tenant.contactPhone ?? '',
    website: tenant.website ?? '',
    zipCode: tenant.zipCode ?? '',
    street: tenant.street ?? '',
    number: tenant.number ?? '',
    complement: tenant.complement ?? '',
    neighborhood: tenant.neighborhood ?? '',
    city: tenant.city,
    state: tenant.state,
    billingZipCode: tenant.billingZipCode ?? '',
    billingStreet: tenant.billingStreet ?? '',
    billingNumber: tenant.billingNumber ?? '',
    billingComplement: tenant.billingComplement ?? '',
    billingNeighborhood: tenant.billingNeighborhood ?? '',
    billingCity: tenant.billingCity ?? '',
    billingState: tenant.billingState ?? '',
    plan: tenant.license?.plan ?? 'PREMIUM'
  };
}

function tenantFormToBody(form: TenantFormData, includePlan = false) {
  const body = Object.fromEntries(
    Object.entries(form)
      .filter(([key]) => includePlan || key !== 'plan')
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  );
  return body;
}

function TenantFormFields({
  form,
  setForm,
  cepStatus,
  applyCep,
  setBillingFromAddress,
  showPlan = false
}: {
  form: TenantFormData;
  setForm: (value: TenantFormData) => void;
  cepStatus: { target: 'main' | 'billing'; message: string } | null;
  applyCep: (target: 'main' | 'billing', value: string) => Promise<void>;
  setBillingFromAddress: () => void;
  showPlan?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-secondary">Dados empresariais</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <Field label="Nome exibido *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Razao social *"><Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></Field>
          <Field label="Nome fantasia"><Input value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} /></Field>
          <Field label="CNPJ *"><Input value={form.document} onChange={(e) => setForm({ ...form, document: maskCnpj(e.target.value) })} /></Field>
          <Field label="Inscricao estadual"><Input value={form.stateRegistration} onChange={(e) => setForm({ ...form, stateRegistration: e.target.value })} /></Field>
          <Field label="Inscricao municipal"><Input value={form.municipalRegistration} onChange={(e) => setForm({ ...form, municipalRegistration: e.target.value })} /></Field>
          {showPlan && (
            <Field label="Plano inicial">
              <select className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="BASIC">Basico</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </Field>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-secondary">Dados de contato</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <Field label="Responsavel *"><Input value={form.responsibleName} onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} /></Field>
          <Field label="E-mail do responsavel *"><Input value={form.responsibleEmail} onChange={(e) => setForm({ ...form, responsibleEmail: e.target.value })} /></Field>
          <Field label="Telefone do responsavel *"><Input value={form.responsiblePhone} onChange={(e) => setForm({ ...form, responsiblePhone: maskPhone(e.target.value) })} /></Field>
          <Field label="E-mail de contato *"><Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></Field>
          <Field label="Telefone de contato *"><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: maskPhone(e.target.value) })} /></Field>
          <Field label="Site"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-secondary">Endereco</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <Field label="CEP *">
            <Input
              value={form.zipCode}
              onChange={(e) => {
                const zipCode = maskCep(e.target.value);
                setForm({ ...form, zipCode });
                void applyCep('main', zipCode);
              }}
            />
          </Field>
          <Field label="Logradouro *"><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Field>
          <Field label="Numero *"><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
          <Field label="Complemento"><Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></Field>
          <Field label="Bairro *"><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></Field>
          <Field label="Cidade *"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="UF *"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} /></Field>
        </div>
        {cepStatus?.target === 'main' && <p className="mt-2 text-sm font-semibold text-secondary">{cepStatus.message}</p>}
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-secondary">Endereco de cobranca</h3>
          <Button variant="outline" onClick={setBillingFromAddress}>Usar mesmo endereco</Button>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <Field label="CEP cobranca *">
            <Input
              value={form.billingZipCode}
              onChange={(e) => {
                const billingZipCode = maskCep(e.target.value);
                setForm({ ...form, billingZipCode });
                void applyCep('billing', billingZipCode);
              }}
            />
          </Field>
          <Field label="Logradouro cobranca *"><Input value={form.billingStreet} onChange={(e) => setForm({ ...form, billingStreet: e.target.value })} /></Field>
          <Field label="Numero cobranca *"><Input value={form.billingNumber} onChange={(e) => setForm({ ...form, billingNumber: e.target.value })} /></Field>
          <Field label="Complemento cobranca"><Input value={form.billingComplement} onChange={(e) => setForm({ ...form, billingComplement: e.target.value })} /></Field>
          <Field label="Bairro cobranca *"><Input value={form.billingNeighborhood} onChange={(e) => setForm({ ...form, billingNeighborhood: e.target.value })} /></Field>
          <Field label="Cidade cobranca *"><Input value={form.billingCity} onChange={(e) => setForm({ ...form, billingCity: e.target.value })} /></Field>
          <Field label="UF cobranca *"><Input value={form.billingState} onChange={(e) => setForm({ ...form, billingState: e.target.value.toUpperCase().slice(0, 2) })} /></Field>
        </div>
        {cepStatus?.target === 'billing' && <p className="mt-2 text-sm font-semibold text-secondary">{cepStatus.message}</p>}
      </div>
    </div>
  );
}

function TenantSection({
  tenants,
  message,
  onCreate,
  onUpdate,
  onStatus,
  onDelete,
  onRestore
}: {
  tenants: MasterTenant[];
  message: string | null;
  onCreate: (body: Record<string, string>) => Promise<void>;
  onUpdate: (id: string, body: Record<string, string>) => Promise<void>;
  onStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(TENANT_EMPTY_FORM);
  const [baseline, setBaseline] = useState(TENANT_EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(TENANT_EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<{ target: 'main' | 'billing'; message: string } | null>(null);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedId);
  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  function loadTenant(tenant: MasterTenant) {
    const next = tenantToForm(tenant);
    setSelectedId(tenant.id);
    setForm(next);
    setBaseline(next);
    setFormError(null);
  }

  const setBillingFromAddress = () => setForm({
    ...form,
    billingZipCode: form.zipCode,
    billingStreet: form.street,
    billingNumber: form.number,
    billingComplement: form.complement,
    billingNeighborhood: form.neighborhood,
    billingCity: form.city,
    billingState: form.state
  });

  const setCreateBillingFromAddress = () => setCreateForm({
    ...createForm,
    billingZipCode: createForm.zipCode,
    billingStreet: createForm.street,
    billingNumber: createForm.number,
    billingComplement: createForm.complement,
    billingNeighborhood: createForm.neighborhood,
    billingCity: createForm.city,
    billingState: createForm.state
  });

  const validateForm = (value: TenantFormData) => {
    const missing = TENANT_REQUIRED_FIELDS.filter((key) => !value[key].trim());
    if (missing.length) {
      setFormError('Preencha todos os campos obrigatorios.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const applyCep = async (target: 'main' | 'billing', value: string, mode: 'edit' | 'create' = 'edit') => {
    const digits = onlyDigits(value);
    if (digits.length !== 8) return;
    setCepStatus({ target, message: 'Consultando CEP...' });
    const update = mode === 'edit' ? setForm : setCreateForm;
    try {
      const address = await apiRequest<CepAddress>(`/api/address/cep/${digits}`);
      if (target === 'main') {
        update((current) => ({
          ...current,
          zipCode: maskCep(address.zipCode),
          street: address.street || current.street,
          complement: current.complement || address.complement,
          neighborhood: address.neighborhood || current.neighborhood,
          city: address.city || current.city,
          state: address.state || current.state
        }));
      } else {
        update((current) => ({
          ...current,
          billingZipCode: maskCep(address.zipCode),
          billingStreet: address.street || current.billingStreet,
          billingComplement: current.billingComplement || address.complement,
          billingNeighborhood: address.neighborhood || current.billingNeighborhood,
          billingCity: address.city || current.billingCity,
          billingState: address.state || current.billingState
        }));
      }
      setCepStatus({ target, message: 'Endereco preenchido pelo CEP.' });
    } catch (error) {
      setCepStatus({ target, message: error instanceof Error ? error.message : 'CEP nao encontrado.' });
    }
  };

  const filteredTenants = tenants.filter((tenant) =>
    filterBySearch(`${tenant.name} ${tenant.document} ${tenant.city} ${tenant.state} ${tenant.responsibleName ?? ''}`, search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Camaras" description="Gestao de tenants com lista, edicao e operacoes por Camara." />
        <Button onClick={() => { setCreateForm(TENANT_EMPTY_FORM); setIsModalOpen(true); }}>Criar Camara</Button>
      </div>
      <ActionMessage message={message} />

      <SectionPanel>
        <ListSearch value={search} onChange={setSearch} placeholder="Filtrar por nome, CNPJ, cidade ou responsavel..." />
        <div className="mt-5">
          <DataTable
            columns={['Nome', 'CNPJ', 'Responsavel', 'Contato', 'Cidade/UF', 'Plano', 'Status', 'Acoes']}
            rows={filteredTenants.map((tenant) => [
              tenant.name,
              tenant.document,
              tenant.responsibleName ?? '-',
              tenant.contactEmail ?? tenant.contactPhone ?? '-',
              `${tenant.city}/${tenant.state}`,
              tenant.license?.plan ?? '-',
              <StatusBadge key={`${tenant.id}-status`} status={tenant.deletedAt ? 'INACTIVE' : tenant.status} />,
              <RowEditButton key={tenant.id} onClick={() => loadTenant(tenant)} />
            ])}
          />
        </div>
      </SectionPanel>

      <DetailPanel
        visible={Boolean(selectedTenant)}
        title={selectedTenant ? `Editar Camara — ${selectedTenant.name}` : 'Editar Camara'}
        description="Atualize os dados empresariais, contato e enderecos da Camara selecionada."
        actions={
          <SaveActionButton
            hasRecord
            isDirty={isDirty}
            disabled={!selectedId}
            onClick={async () => {
              if (!validateForm(form)) return;
              await onUpdate(selectedId, tenantFormToBody(form));
              setBaseline(form);
            }}
          />
        }
      >
        {formError && <p className="mb-4 rounded-smart border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-rejected">{formError}</p>}
        <TenantFormFields
          form={form}
          setForm={setForm}
          cepStatus={cepStatus}
          applyCep={(target, value) => applyCep(target, value, 'edit')}
          setBillingFromAddress={setBillingFromAddress}
        />
      </DetailPanel>

      <DetailPanel
        visible={Boolean(selectedTenant)}
        title="Operacoes"
        description={selectedTenant ? `Acoes administrativas para ${selectedTenant.name}.` : undefined}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={!selectedId} onClick={() => onStatus(selectedId, 'ACTIVE')}>Ativar</Button>
          <Button variant="warning" disabled={!selectedId} onClick={() => onStatus(selectedId, 'SUSPENDED')}>Suspender</Button>
          <Button variant="outline" disabled={!selectedId} onClick={() => onRestore(selectedId)}>Reativar</Button>
          <Button variant="danger" disabled={!selectedId} onClick={() => onDelete(selectedId)}>Soft delete</Button>
        </div>
      </DetailPanel>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-5xl rounded-smart bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <PageHeader title="Criar Camara" description="Cadastre a empresa, contatos e enderecos da nova Camara." />
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Fechar</Button>
            </div>
            {formError && <p className="mt-4 rounded-smart border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-rejected">{formError}</p>}
            <div className="mt-5">
              <TenantFormFields
                form={createForm}
                setForm={setCreateForm}
                cepStatus={cepStatus}
                applyCep={(target, value) => applyCep(target, value, 'create')}
                setBillingFromAddress={setCreateBillingFromAddress}
                showPlan
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (!validateForm(createForm)) return;
                  await onCreate(tenantFormToBody(createForm, true));
                  setCreateForm(TENANT_EMPTY_FORM);
                  setIsModalOpen(false);
                }}
              >
                Salvar Camara
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PLAN_DEFAULTS = {
  BASIC: {
    maxUsers: 25,
    maxCouncilMembers: 11,
    storageGb: 20,
    features: 'Portal publico',
    securityPolicy: 'MFA opcional'
  },
  PREMIUM: {
    maxUsers: 80,
    maxCouncilMembers: 21,
    storageGb: 120,
    features: 'Votacao eletronica',
    securityPolicy: 'MFA obrigatorio'
  },
  ENTERPRISE: {
    maxUsers: 9999,
    maxCouncilMembers: 9999,
    storageGb: 1024,
    features: 'Auditoria avancada',
    securityPolicy: 'White label'
  }
} as const;

type LicenseFormState = {
  tenantId: string;
  plan: string;
  maxUsers: number;
  maxCouncilMembers: number;
  storageGb: number;
  features: string;
  securityPolicy: string;
};

function LicenseSection({
  tenants,
  licenses,
  message,
  onSave
}: {
  tenants: MasterTenant[];
  licenses: MasterLicense[];
  message: string | null;
  onSave: (tenantId: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const emptyForm: LicenseFormState = {
    tenantId: '',
    plan: 'PREMIUM',
    maxUsers: PLAN_DEFAULTS.PREMIUM.maxUsers,
    maxCouncilMembers: PLAN_DEFAULTS.PREMIUM.maxCouncilMembers,
    storageGb: PLAN_DEFAULTS.PREMIUM.storageGb,
    features: PLAN_DEFAULTS.PREMIUM.features,
    securityPolicy: PLAN_DEFAULTS.PREMIUM.securityPolicy
  };
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [baseline, setBaseline] = useState(emptyForm);

  const tenantsWithoutLicense = tenants.filter((tenant) => !licenses.some((license) => license.tenantId === tenant.id));
  const selectedLicense = licenses.find((license) => license.tenantId === selectedTenantId);
  const hasRecord = Boolean(selectedLicense);
  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  function loadLicense(license: MasterLicense) {
    const next = {
      tenantId: license.tenantId,
      plan: license.plan,
      maxUsers: license.maxUsers,
      maxCouncilMembers: license.maxCouncilMembers,
      storageGb: license.storageGb,
      features: license.features,
      securityPolicy: license.securityPolicy
    };
    setSelectedTenantId(license.tenantId);
    setMode('edit');
    setForm(next);
    setBaseline(next);
  }

  function startCreate() {
    setMode('create');
    setSelectedTenantId('');
    setForm(emptyForm);
    setBaseline(emptyForm);
  }

  function applyPlanDefaults(plan: keyof typeof PLAN_DEFAULTS) {
    const defaults = PLAN_DEFAULTS[plan];
    setForm((current) => ({
      ...current,
      plan,
      maxUsers: defaults.maxUsers,
      maxCouncilMembers: defaults.maxCouncilMembers,
      storageGb: defaults.storageGb,
      features: defaults.features,
      securityPolicy: defaults.securityPolicy
    }));
  }

  const filteredLicenses = licenses.filter((license) =>
    filterBySearch(`${license.tenant.name} ${license.tenant.city} ${license.tenant.state} ${license.plan}`, search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Licencas" description="Planos contratados por Camara com criacao e edicao completa." />
        <Button onClick={startCreate}>Criar licenca</Button>
      </div>
      <ActionMessage message={message} />

      <SectionPanel>
        <ListSearch value={search} onChange={setSearch} placeholder="Filtrar por Camara, cidade ou plano..." />
        <div className="mt-5">
          <DataTable
            columns={['Camara', 'Plano', 'Usuarios', 'Vereadores', 'Storage', 'Recursos', 'Seguranca', 'Acoes']}
            rows={filteredLicenses.map((license) => [
              license.tenant.name,
              license.plan,
              license.maxUsers,
              license.maxCouncilMembers,
              `${license.storageGb} GB`,
              license.features,
              license.securityPolicy,
              <RowEditButton key={license.id} onClick={() => loadLicense(license)} />
            ])}
          />
        </div>
      </SectionPanel>

      <DetailPanel
        visible={mode === 'create' || Boolean(selectedTenantId)}
        title={mode === 'create' ? 'Nova licenca' : `Editar licenca${selectedLicense ? ` — ${selectedLicense.tenant.name}` : ''}`}
        description={mode === 'create' ? 'Selecione a Camara e configure os limites do plano.' : 'Altere os atributos da licenca selecionada.'}
        actions={
          <SaveActionButton
            hasRecord={hasRecord}
            isDirty={isDirty}
            disabled={!form.tenantId}
            onClick={() => onSave(form.tenantId, {
              plan: form.plan,
              maxUsers: Number(form.maxUsers),
              maxCouncilMembers: Number(form.maxCouncilMembers),
              storageGb: Number(form.storageGb),
              features: form.features,
              securityPolicy: form.securityPolicy
            })}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Camara">
            <select
              className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
              value={form.tenantId}
              disabled={mode === 'edit'}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
            >
              <option value="">Selecione</option>
              {(mode === 'create' ? tenantsWithoutLicense : tenants).map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Plano">
            <select
              className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
              value={form.plan}
              onChange={(e) => applyPlanDefaults(e.target.value as keyof typeof PLAN_DEFAULTS)}
            >
              <option value="BASIC">Basico</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </Field>
          <Field label="Maximo de usuarios">
            <Input type="number" min={1} value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
          </Field>
          <Field label="Maximo de vereadores">
            <Input type="number" min={1} value={form.maxCouncilMembers} onChange={(e) => setForm({ ...form, maxCouncilMembers: Number(e.target.value) })} />
          </Field>
          <Field label="Storage (GB)">
            <Input type="number" min={1} value={form.storageGb} onChange={(e) => setForm({ ...form, storageGb: Number(e.target.value) })} />
          </Field>
          <Field label="Politica de seguranca">
            <Input value={form.securityPolicy} onChange={(e) => setForm({ ...form, securityPolicy: e.target.value })} />
          </Field>
          <Field label="Recursos">
            <Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
          </Field>
        </div>
      </DetailPanel>
    </div>
  );
}

function AdminSection({
  tenants,
  admins,
  message,
  selectedAdminId,
  onSelectAdmin,
  onCreate,
  onUpdate,
  onDelete
}: {
  tenants: MasterTenant[];
  admins: MasterAdmin[];
  message: string | null;
  selectedAdminId: string;
  onSelectAdmin: (id: string) => void;
  onCreate: (body: Record<string, string>) => Promise<void>;
  onUpdate: (id: string, body: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const emptyCreateForm = { tenantId: '', name: '', email: '', password: 'Smart@123' };
  const emptyEditForm = { password: 'Smart@123', status: 'ACTIVE', mfaRequired: true };
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [baseline, setBaseline] = useState(emptyEditForm);

  const selectedAdmin = admins.find((admin) => admin.id === selectedAdminId);
  const isDirty = JSON.stringify(editForm) !== JSON.stringify(baseline);

  function loadAdmin(admin: MasterAdmin) {
    onSelectAdmin(admin.id);
    setMode('edit');
    const next = {
      password: 'Smart@123',
      status: admin.status,
      mfaRequired: admin.mfaRequired
    };
    setEditForm(next);
    setBaseline(next);
  }

  function startCreate() {
    setMode('create');
    onSelectAdmin('');
    setCreateForm(emptyCreateForm);
  }

  const filteredAdmins = admins.filter((admin) =>
    filterBySearch(`${admin.name} ${admin.email} ${admin.tenant?.name ?? ''} ${admin.tenant?.city ?? ''}`, search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Administradores" description="Gestao de Admin Camara por tenant com lista e edicao dinamica." />
        <Button onClick={startCreate}>Criar administrador</Button>
      </div>
      <ActionMessage message={message} />

      <SectionPanel>
        <ListSearch value={search} onChange={setSearch} placeholder="Filtrar por nome, e-mail ou Camara..." />
        <div className="mt-5">
          <DataTable
            columns={['Nome', 'E-mail', 'Camara', 'MFA', 'Status', 'Acoes']}
            rows={filteredAdmins.map((admin) => [
              admin.name,
              admin.email,
              admin.tenant ? `${admin.tenant.name} (${admin.tenant.city}/${admin.tenant.state})` : '-',
              admin.mfaRequired ? 'MFA ativo' : 'MFA pendente',
              <StatusBadge key={`${admin.id}-status`} status={admin.status} />,
              <RowEditButton key={admin.id} onClick={() => loadAdmin(admin)} />
            ])}
          />
        </div>
      </SectionPanel>

      {mode === 'create' ? (
        <DetailPanel
          visible
          title="Novo administrador"
          description="Cadastre um Admin Camara vinculado a uma Camara."
          actions={
            <Button
              disabled={!createForm.tenantId || !createForm.name || !createForm.email || !createForm.password}
              onClick={() => onCreate(createForm)}
            >
              Salvar
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Camara">
              <select
                className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
                value={createForm.tenantId}
                onChange={(e) => setCreateForm({ ...createForm, tenantId: e.target.value })}
              >
                <option value="">Selecione</option>
                {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </select>
            </Field>
            <Field label="Nome"><Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} /></Field>
            <Field label="E-mail"><Input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></Field>
            <Field label="Senha"><Input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} /></Field>
          </div>
        </DetailPanel>
      ) : (
        <DetailPanel
          visible={Boolean(selectedAdmin)}
          title={selectedAdmin ? `Editar administrador — ${selectedAdmin.name}` : 'Editar administrador'}
          description="Atualize senha, MFA e status do administrador selecionado."
          actions={
            <div className="flex flex-wrap gap-2">
              <SaveActionButton
                hasRecord
                isDirty={isDirty}
                disabled={!selectedAdminId}
                onClick={() => onUpdate(selectedAdminId, {
                  password: editForm.password,
                  status: editForm.status,
                  mfaRequired: editForm.mfaRequired
                })}
              />
              <Button variant="danger" disabled={!selectedAdminId} onClick={() => onDelete(selectedAdminId)}>
                Excluir
              </Button>
            </div>
          }
        >
          {selectedAdmin && (
            <>
              <div className="mb-5 grid gap-3 rounded-smart border border-slate-100 bg-surface p-4 text-sm md:grid-cols-3">
                <p><strong className="text-secondary">Nome:</strong> {selectedAdmin.name}</p>
                <p><strong className="text-secondary">E-mail:</strong> {selectedAdmin.email}</p>
                <p><strong className="text-secondary">Camara:</strong> {selectedAdmin.tenant?.name ?? '-'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nova senha">
                  <Input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                </Field>
                <Field label="Status">
                  <select
                    className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </Field>
                <Field label="MFA obrigatorio">
                  <select
                    className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
                    value={editForm.mfaRequired ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, mfaRequired: e.target.value === 'true' })}
                  >
                    <option value="true">Sim</option>
                    <option value="false">Nao</option>
                  </select>
                </Field>
              </div>
            </>
          )}
        </DetailPanel>
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-16 cursor-pointer rounded-smart border border-slate-200 bg-white p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#0B3C6D" />
      </div>
    </Field>
  );
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function BrandingSection({
  tenants,
  selectedTenantId,
  onSelectTenant,
  branding,
  message,
  token,
  onSave
}: {
  tenants: MasterTenant[];
  selectedTenantId: string;
  onSelectTenant: (id: string) => void;
  branding: MasterBranding | null | undefined;
  message: string | null;
  token: string | null;
  onSave: (tenantId: string, body: Record<string, string>) => Promise<void>;
}) {
  const emptyForm = {
    displayName: '',
    logoLoginUrl: '',
    logoSidenavUrl: '',
    logoPortalUrl: '',
    primaryColor: '#0B3C6D',
    accentColor: '#D4AF37',
    footerText: ''
  };
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [baseline, setBaseline] = useState(emptyForm);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);
  const hasRecord = Boolean(branding?.id);
  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  useEffect(() => {
    if (!selectedTenantId) return;

    if (branding) {
      const next = {
        displayName: branding.displayName,
        logoLoginUrl: branding.logoLoginUrl ?? '',
        logoSidenavUrl: branding.logoSidenavUrl ?? '',
        logoPortalUrl: branding.logoPortalUrl ?? '',
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        footerText: branding.footerText ?? ''
      };
      setForm(next);
      setBaseline(next);
      return;
    }

    const next = {
      ...emptyForm,
      displayName: selectedTenant?.name ?? ''
    };
    setForm(next);
    setBaseline(emptyForm);
  }, [branding, selectedTenantId, selectedTenant?.name]);

  function loadTenant(tenant: MasterTenant) {
    onSelectTenant(tenant.id);
    setUploadError(null);
  }

  async function uploadLogo(slot: 'login' | 'sidenav' | 'portal', file: File) {
    if (!selectedTenantId) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem valido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo maior que 5MB. Escolha uma imagem menor.');
      return;
    }

    setUploadingSlot(slot);
    setUploadError(null);
    try {
      const response = await masterRequest<{ publicUrl: string; slot: string }>(`/tenants/${selectedTenantId}/branding/logos`, token, {
        method: 'POST',
        body: JSON.stringify({
          slot,
          fileName: file.name,
          contentType: file.type,
          contentBase64: await fileToBase64(file)
        })
      });
      const field = slot === 'login' ? 'logoLoginUrl' : slot === 'sidenav' ? 'logoSidenavUrl' : 'logoPortalUrl';
      setForm((current) => ({ ...current, [field]: response.publicUrl }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Falha ao enviar logo.');
    } finally {
      setUploadingSlot(null);
    }
  }

  const logoFields = [
    { slot: 'login' as const, label: 'Logo login (esquerdo)', field: 'logoLoginUrl' as const },
    { slot: 'sidenav' as const, label: 'Logo topo sidenav', field: 'logoSidenavUrl' as const },
    { slot: 'portal' as const, label: 'Logo portal publico', field: 'logoPortalUrl' as const }
  ];

  const filteredTenants = tenants.filter((tenant) =>
    filterBySearch(`${tenant.name} ${tenant.city} ${tenant.state} ${tenant.branding?.displayName ?? ''}`, search)
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Branding White Label" description="Selecione uma Camara na lista para editar cores, textos e logos institucionais." />
      <ActionMessage message={message} />

      <SectionPanel>
        <ListSearch value={search} onChange={setSearch} placeholder="Filtrar por Camara ou nome exibido..." />
        <div className="mt-5">
          <DataTable
            columns={['Camara', 'Nome exibido', 'Cores', 'Logos', 'Acoes']}
            rows={filteredTenants.map((tenant) => [
              tenant.name,
              tenant.branding?.displayName ?? tenant.name,
              tenant.branding ? (
                <div key={`${tenant.id}-colors`} className="flex flex-wrap gap-3">
                  <ColorSwatch color={tenant.branding.primaryColor} />
                  <ColorSwatch color={tenant.branding.accentColor} />
                </div>
              ) : (
                'Padrao'
              ),
              tenant.branding
                ? [
                    tenant.branding.logoLoginUrl ? 'Login' : null,
                    tenant.branding.logoSidenavUrl ? 'Sidenav' : null,
                    tenant.branding.logoPortalUrl ? 'Portal' : null
                  ].filter(Boolean).join(', ') || 'Nenhum'
                : 'Nenhum',
              <RowEditButton key={tenant.id} onClick={() => loadTenant(tenant)} />
            ])}
          />
        </div>
      </SectionPanel>

      <DetailPanel
        visible={Boolean(selectedTenantId)}
        title={selectedTenant ? `Branding — ${selectedTenant.name}` : 'Branding'}
        description={hasRecord ? 'Edite o branding da Camara selecionada.' : 'Configure o branding inicial desta Camara.'}
        actions={
          <SaveActionButton
            hasRecord={hasRecord}
            isDirty={isDirty || !hasRecord}
            disabled={!selectedTenantId || !form.displayName.trim()}
            onClick={() => onSave(selectedTenantId, form)}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome exibido"><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></Field>
          <Field label="Rodape"><Input value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} /></Field>
          <ColorField label="Cor primaria" value={form.primaryColor} onChange={(value) => setForm({ ...form, primaryColor: value })} />
          <ColorField label="Cor destaque" value={form.accentColor} onChange={(value) => setForm({ ...form, accentColor: value })} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {logoFields.map(({ slot, label, field }) => (
            <div key={slot} className="rounded-smart border border-slate-200 p-4">
              <p className="text-sm font-semibold text-secondary">{label}</p>
              <Input
                className="mt-3"
                type="file"
                accept="image/*"
                disabled={!selectedTenantId || uploadingSlot === slot}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(slot, file);
                }}
              />
              {uploadingSlot === slot && <p className="mt-2 text-xs font-semibold text-secondary">Enviando...</p>}
              {form[field] && <img src={form[field]} alt={label} className="mt-4 h-16 max-w-full rounded-smart border border-slate-200 object-contain p-2" />}
            </div>
          ))}
        </div>

        {uploadError && <p className="mt-4 text-sm font-semibold text-rejected">{uploadError}</p>}
      </DetailPanel>
    </div>
  );
}

function DomainSection({
  tenants,
  domains,
  selectedDomainId,
  onSelectDomain,
  message,
  onCreate,
  onStatus,
  onDelete
}: {
  tenants: MasterTenant[];
  domains: MasterDomain[];
  selectedDomainId: string;
  onSelectDomain: (id: string) => void;
  message: string | null;
  onCreate: (body: Record<string, string>) => Promise<void>;
  onStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ tenantId: '', hostname: '' });

  return (
    <div className="space-y-6">
      <PageHeader title="Dominios" description="Cadastro e validacao de dominios publicos." />
      <ActionMessage message={message} />
      <SectionPanel>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Camara">
            <select className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
              <option value="">Selecione</option>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </Field>
          <Field label="Dominio"><Input value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} /></Field>
        </div>
        <Button className="mt-4" onClick={() => onCreate(form)}>Cadastrar dominio</Button>
      </SectionPanel>
      <SectionPanel>
        <Field label="Dominio selecionado">
          <select className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm" value={selectedDomainId} onChange={(e) => onSelectDomain(e.target.value)}>
            <option value="">Selecione</option>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.hostname}</option>)}
          </select>
        </Field>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" disabled={!selectedDomainId} onClick={() => onStatus(selectedDomainId, 'VALIDATED')}>Validar</Button>
          <Button variant="warning" disabled={!selectedDomainId} onClick={() => onStatus(selectedDomainId, 'PENDING')}>Pendente</Button>
          <Button variant="danger" disabled={!selectedDomainId} onClick={() => onStatus(selectedDomainId, 'BLOCKED')}>Bloquear</Button>
          <Button variant="danger" disabled={!selectedDomainId} onClick={() => onDelete(selectedDomainId)}>Excluir</Button>
        </div>
      </SectionPanel>
      <DataTable
        columns={['Dominio', 'Camara', 'Status']}
        rows={domains.map((domain) => [domain.hostname, domain.tenant.name, <StatusBadge key={domain.id} status={domain.status} />])}
      />
    </div>
  );
}

function AuditSection({ tenants }: { tenants: MasterTenant[] }) {
  const { token } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [tenantId, setTenantId] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const actors = useQuery({
    queryKey: ['master', 'audit-actors', token],
    queryFn: () => masterRequest<MasterAuditActor[]>('/audit-logs/actors', token),
    enabled: Boolean(token)
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (tenantId) params.set('tenantId', tenantId);
    if (actorUserId) params.set('actorUserId', actorUserId);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return params.toString();
  }, [startDate, endDate, tenantId, actorUserId, page, pageSize]);

  const auditLogs = useQuery({
    queryKey: ['master', 'audit', token, queryString],
    queryFn: () => masterRequest<MasterAuditLogsPage>(`/audit-logs?${queryString}`, token),
    enabled: Boolean(token)
  });

  const data = auditLogs.data;
  const items = data?.items ?? [];

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria Global" description="Eventos registrados com hash encadeado, filtros e paginacao." />

      <SectionPanel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Data inicial">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetPage();
              }}
            />
          </Field>
          <Field label="Data final">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                resetPage();
              }}
            />
          </Field>
          <Field label="Camara">
            <select
              className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                resetPage();
              }}
            >
              <option value="">Todas</option>
              <option value="platform">Plataforma</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Usuario">
            <select
              className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
              value={actorUserId}
              onChange={(e) => {
                setActorUserId(e.target.value);
                resetPage();
              }}
            >
              <option value="">Todos</option>
              {(actors.data ?? []).map((actor) => (
                <option key={actor.id} value={actor.id}>{actor.name} ({actor.email})</option>
              ))}
            </select>
          </Field>
          <Field label="Itens por pagina">
            <select
              className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                resetPage();
              }}
            >
              {[10, 30, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </Field>
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-text">
          <p>
            {auditLogs.isLoading
              ? 'Carregando registros...'
              : `${data?.total ?? 0} registro(s) encontrado(s)`}
          </p>
          {data && (
            <p>
              Pagina {data.page} de {data.totalPages}
            </p>
          )}
        </div>

        <DataTable
          columns={['Data/Hora', 'Acao', 'Entidade', 'Camara', 'Usuario', 'Hash']}
          rows={items.map((log) => [
            new Date(log.createdAt).toLocaleString('pt-BR'),
            log.action,
            log.entity,
            log.tenant ? `${log.tenant.name} (${log.tenant.city}/${log.tenant.state})` : 'Plataforma',
            log.actor ? `${log.actor.name} (${log.actor.email})` : '-',
            `${log.hash.slice(0, 10)}...`
          ])}
        />

        {!auditLogs.isLoading && items.length === 0 && (
          <p className="mt-4 text-sm font-semibold text-text">Nenhum registro encontrado para os filtros selecionados.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={!data || data.page <= 1 || auditLogs.isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!data || data.page >= data.totalPages || auditLogs.isLoading}
            onClick={() => setPage((current) => current + 1)}
          >
            Proxima
          </Button>
        </div>
      </SectionPanel>
    </div>
  );
}

function SecuritySection({
  admins,
  message,
  onAction
}: {
  admins: MasterAdmin[];
  message: string | null;
  onAction: (action: string, userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState('');
  return (
    <div className="space-y-6">
      <PageHeader title="Seguranca" description="Acoes globais de seguranca com auditoria." />
      <ActionMessage message={message} />
      <SectionPanel>
        <Field label="Usuario alvo">
          <select className="h-11 w-full rounded-smart border border-slate-200 px-3 text-sm" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Selecione</option>
            {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.email}</option>)}
          </select>
        </Field>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ['FORCE_PASSWORD_RESET', 'Forcar troca de senha'],
            ['REVOKE_SESSIONS', 'Revogar sessoes'],
            ['BLOCK_USER', 'Bloquear usuario'],
            ['REQUIRE_MFA', 'Ativar MFA obrigatorio']
          ].map(([action, label]) => (
            <Button key={action} variant="outline" disabled={!userId} onClick={() => onAction(action, userId)}>{label}</Button>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}

function BackupSection({
  backups,
  selectedBackupId,
  onSelectBackup,
  message,
  onCreate,
  onRestore,
  onDelete
}: {
  backups: MasterBackup[];
  selectedBackupId: string;
  onSelectBackup: (id: string) => void;
  message: string | null;
  onCreate: () => Promise<void>;
  onRestore: (backupId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Backups" description="Geracao, restauracao e remocao de backups da plataforma." />
      <ActionMessage message={message} />
      <SectionPanel>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onCreate}>Gerar Backup</Button>
          <Button variant="warning" disabled={!selectedBackupId} onClick={() => onRestore(selectedBackupId)}>Restaurar selecionado</Button>
          <Button variant="danger" disabled={!selectedBackupId} onClick={() => onDelete(selectedBackupId)}>Excluir selecionado</Button>
        </div>
      </SectionPanel>
      <DataTable
        columns={['Data', 'Status', 'Tamanho', 'Origem', 'Selecionar']}
        rows={backups.map((backup) => [
          new Date(backup.createdAt).toLocaleString('pt-BR'),
          <StatusBadge key={`${backup.id}-status`} status={backup.status} />,
          `${(Number(backup.sizeBytes) / 1e9).toFixed(1)} GB`,
          backup.source,
          <input key={`${backup.id}-select`} type="radio" name="backup" checked={selectedBackupId === backup.id} onChange={() => onSelectBackup(backup.id)} />
        ])}
      />
    </div>
  );
}

function SettingsSection({
  settings,
  message,
  onSave
}: {
  settings: Record<string, string>;
  message: string | null;
  onSave: (body: Record<string, string>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    'smtp.host': '',
    'whatsapp.provider': '',
    'storage.provider': '',
    'logs.retentionDays': '',
    'security.passwordPolicy': '',
    'security.sessionHours': ''
  });

  useEffect(() => {
    setForm({
      'smtp.host': settings['smtp.host'] ?? '',
      'whatsapp.provider': settings['whatsapp.provider'] ?? '',
      'storage.provider': settings['storage.provider'] ?? '',
      'logs.retentionDays': settings['logs.retentionDays'] ?? '',
      'security.passwordPolicy': settings['security.passwordPolicy'] ?? '',
      'security.sessionHours': settings['security.sessionHours'] ?? ''
    });
  }, [settings]);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracoes Globais" description="Parametros persistidos no backend." />
      <ActionMessage message={message} />
      <SectionPanel>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <Field key={key} label={key}>
              <Input value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </Field>
          ))}
        </div>
        <Button className="mt-4" onClick={() => onSave(form)}>Salvar configuracoes</Button>
      </SectionPanel>
    </div>
  );
}
