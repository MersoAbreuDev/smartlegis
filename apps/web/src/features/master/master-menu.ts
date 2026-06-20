import {
  Activity,
  Building2,
  Crown,
  DatabaseBackup,
  Globe2,
  HardDrive,
  KeyRound,
  MonitorCheck,
  Palette,
  ServerCog,
  ShieldCheck,
  UserCog,
  Users,
  Vote
} from 'lucide-react';

export const masterMenu = [
  { id: 'dashboard', label: 'Dashboard', href: '/master/dashboard', icon: Activity },
  { id: 'tenants', label: 'Camaras', href: '/master/tenants', icon: Building2 },
  { id: 'licenses', label: 'Licencas', href: '/master/licenses', icon: KeyRound },
  { id: 'admins', label: 'Administradores', href: '/master/admins', icon: UserCog },
  { id: 'branding', label: 'Branding', href: '/master/branding', icon: Palette },
  { id: 'domains', label: 'Dominios', href: '/master/domains', icon: Globe2 },
  { id: 'audit', label: 'Auditoria Global', href: '/master/audit', icon: ShieldCheck },
  { id: 'security', label: 'Seguranca', href: '/master/security', icon: ShieldCheck },
  { id: 'monitoring', label: 'Monitoramento', href: '/master/monitoring', icon: MonitorCheck },
  { id: 'backups', label: 'Backups', href: '/master/backups', icon: DatabaseBackup },
  { id: 'settings', label: 'Configuracoes', href: '/master/settings', icon: ServerCog },
  { id: 'profile', label: 'Meu Perfil', href: '/master/profile', icon: Crown },
  { id: 'impersonate', label: 'Impersonate', href: '/master/impersonate', icon: Users }
] as const;

export type MasterSectionId = (typeof masterMenu)[number]['id'];

export const masterSectionIcons = {
  dashboard: Activity,
  tenants: Building2,
  licenses: KeyRound,
  admins: UserCog,
  branding: Palette,
  domains: Globe2,
  audit: ShieldCheck,
  security: ShieldCheck,
  monitoring: MonitorCheck,
  backups: DatabaseBackup,
  settings: ServerCog,
  profile: Crown,
  impersonate: Users
};

export const forbiddenMasterActions = [
  'Votar',
  'Criar Projeto de Lei',
  'Alterar Voto',
  'Encerrar Sessao',
  'Participar de Tramitacao',
  'Aprovar Materia',
  'Mudar Resultado'
];

export const dashboardIcons = {
  tenants: Building2,
  users: Users,
  councilMembers: UserCog,
  sessions: Activity,
  votes: Vote,
  storage: HardDrive,
  licenses: ShieldCheck,
  expiring: KeyRound
};
