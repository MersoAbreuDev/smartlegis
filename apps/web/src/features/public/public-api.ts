export const PUBLIC_TENANT_DOCUMENT = process.env.NEXT_PUBLIC_PUBLIC_TENANT_DOCUMENT ?? '00.000.000/0001-00';

export function publicApiPath(suffix = '') {
  return `/api/public/${encodeURIComponent(PUBLIC_TENANT_DOCUMENT)}${suffix}`;
}

export type PublicBranding = {
  displayName: string;
  logoLoginUrl: string | null;
  logoSidenavUrl: string | null;
  logoPortalUrl: string | null;
  primaryColor: string;
  accentColor: string;
  footerText: string | null;
};

export type PublicHomeData = {
  tenant: { name: string; city: string; state: string };
  stats: { matters: number; sessions: number; councilMembers: number };
};

export type PublicMatter = {
  id: string;
  type: string;
  number: number;
  year: number;
  title: string;
  summary: string;
  status: string;
  author: { name: string; party: string };
};

export type PublicCouncilMember = {
  id: string;
  name: string;
  party: string;
  photoUrl: string | null;
};

export type PublicSession = {
  id: string;
  type: string;
  number: number;
  date: string;
  status: string;
};
