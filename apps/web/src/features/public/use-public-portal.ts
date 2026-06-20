'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import {
  PublicBranding,
  PublicCouncilMember,
  PublicHomeData,
  PublicMatter,
  PublicSession,
  publicApiPath
} from './public-api';

export function usePublicPortalData() {
  const branding = useQuery({
    queryKey: ['public', 'branding'],
    queryFn: () => apiRequest<PublicBranding | null>(publicApiPath('/branding'))
  });

  const home = useQuery({
    queryKey: ['public', 'home'],
    queryFn: () => apiRequest<PublicHomeData>(publicApiPath())
  });

  const matters = useQuery({
    queryKey: ['public', 'matters'],
    queryFn: () => apiRequest<PublicMatter[]>(publicApiPath('/matters'))
  });

  const sessions = useQuery({
    queryKey: ['public', 'sessions'],
    queryFn: () => apiRequest<PublicSession[]>(publicApiPath('/sessions'))
  });

  const councilMembers = useQuery({
    queryKey: ['public', 'council-members'],
    queryFn: () => apiRequest<PublicCouncilMember[]>(publicApiPath('/council-members'))
  });

  return { branding, home, matters, sessions, councilMembers };
}
