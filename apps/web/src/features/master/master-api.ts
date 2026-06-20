import { apiRequest } from '@/lib/api';

export type MasterDashboard = {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalCouncilMembers: number;
  totalSessions: number;
  totalVotes: number;
  storageUsedGb: number;
  activeLicenses: number;
  expiringLicenses: number;
  latestBackupAt: string | null;
};

export type MasterTenant = {
  id: string;
  name: string;
  legalName: string | null;
  tradeName: string | null;
  document: string;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  responsibleName: string | null;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  billingZipCode: string | null;
  billingStreet: string | null;
  billingNumber: string | null;
  billingComplement: string | null;
  billingNeighborhood: string | null;
  billingCity: string | null;
  billingState: string | null;
  status: string;
  deletedAt: string | null;
  license?: {
    plan: string;
    maxUsers: number;
    maxCouncilMembers: number;
    storageGb: number;
    features: string;
    securityPolicy: string;
  } | null;
  branding?: {
    id: string;
    displayName: string;
    primaryColor: string;
    accentColor: string;
    logoLoginUrl: string | null;
    logoSidenavUrl: string | null;
    logoPortalUrl: string | null;
  } | null;
};

export type MasterLicense = {
  id: string;
  tenantId: string;
  plan: string;
  maxUsers: number;
  maxCouncilMembers: number;
  storageGb: number;
  features: string;
  securityPolicy: string;
  expiresAt: string | null;
  tenant: { id: string; name: string; city: string; state: string; status: string };
};

export type MasterAdmin = {
  id: string;
  name: string;
  email: string;
  status: string;
  mfaRequired: boolean;
  tenant: { id: string; name: string; city: string; state: string } | null;
};

export type MasterDomain = {
  id: string;
  hostname: string;
  status: string;
  tenant: { id: string; name: string; city: string; state: string };
};

export type MasterAuditLog = {
  id: string;
  action: string;
  entity: string;
  hash: string;
  createdAt: string;
  tenant: { id?: string; name: string; city: string; state: string } | null;
  actor: { id?: string; name: string; email: string } | null;
};

export type MasterAuditLogsPage = {
  items: MasterAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MasterAuditActor = {
  id: string;
  name: string;
  email: string;
};

export type MasterBranding = {
  id: string;
  tenantId: string;
  displayName: string;
  logoLoginUrl: string | null;
  logoSidenavUrl: string | null;
  logoPortalUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  footerText: string | null;
};

export type MasterSetting = { key: string; value: string };
export type MasterBackup = { id: string; sizeBytes: string; status: string; source: string; createdAt: string };
export type MasterMonitoring = { service: string; status: string; detail: string };

export function masterRequest<T>(path: string, token: string | null, options: RequestInit = {}) {
  return apiRequest<T>(`/api/master${path}`, { ...options, token });
}
