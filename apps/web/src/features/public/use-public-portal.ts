'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import {
  PublicBranding,
  PublicCouncilMember,
  PublicHomeData,
  PublicMatter,
  PublicSession,
  publicApiPath,
  publicTenantKey
} from './public-api';

export function usePublicPortalData() {
  const tenantKey = publicTenantKey();

  const branding = useQuery({
    queryKey: ['public', tenantKey, 'branding'],
    queryFn: () => apiRequest<PublicBranding | null>(publicApiPath('/branding'))
  });

  const home = useQuery({
    queryKey: ['public', tenantKey, 'home'],
    queryFn: () => apiRequest<PublicHomeData>(publicApiPath())
  });

  const matters = useQuery({
    queryKey: ['public', tenantKey, 'matters'],
    queryFn: () => apiRequest<PublicMatter[]>(publicApiPath('/matters'))
  });

  const sessions = useQuery({
    queryKey: ['public', tenantKey, 'sessions'],
    queryFn: () => apiRequest<PublicSession[]>(publicApiPath('/sessions'))
  });

  const councilMembers = useQuery({
    queryKey: ['public', tenantKey, 'council-members'],
    queryFn: () => apiRequest<PublicCouncilMember[]>(publicApiPath('/council-members'))
  });

  return { branding, home, matters, sessions, councilMembers };
}
